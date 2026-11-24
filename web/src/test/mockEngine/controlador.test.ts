import { describe, expect, it, vi } from "vitest";
import { calcularMetricas } from "../../core/calculations";
import { criarEventBus } from "../../core/eventBus";
import { executarFallback } from "../../core/fallback";
import { runAnalysis } from "../../core/mockEngine";
import { executarPipeline } from "../../core/pipeline";
import { criarRepositorioLocal, criarStorageMemoria } from "../../core/repository";
import { classificar, REGRAS_PADRAO } from "../../core/rules";
import { CENARIOS, compararCenario } from "../../core/scenarios";
import { FLAGS_PADRAO } from "../../core/seed";

describe("Membro 2 — Pipeline, guard clauses e 4 cenários oficiais", () => {
  it("rejeita dados inválidos antes da IA e mantém o motivo do bloqueio nos steps", async () => {
    const repo = criarRepositorioLocal(criarStorageMemoria());
    repo.carregar();
    const bus = criarEventBus();
    const inferirSpy = vi.fn();

    const resultado = await executarPipeline(
      {
        pecaId: "P-001",
        dataLote: "2026-10-15",
        quantidade: 500,
        defeituosos: 600,
        horas: 10,
        temperatura: 200,
        pressao: 6.5,
      },
      {
        repositorio: repo,
        ia: {
          meta: { nome: "modelo_ia.bin", versao: "0.1", precisao: 0.9, status: "carregado" },
          inferir: async () => inferirSpy(),
        },
        engine: {
          calcularMetricas,
          classificar,
          gerarRecomendacao: () => "ok",
          executarFallback,
        },
        bus,
        regras: REGRAS_PADRAO,
        flags: FLAGS_PADRAO,
        configIA: { modoFalha: "NENHUM" },
        seed: 42,
      },
    );

    expect(inferirSpy).not.toHaveBeenCalled();
    expect(resultado.origem).toBe("VALIDACAO");
    expect(resultado.erros.map((erro) => erro.codigo)).toContain("DEFEITUOSOS_EXCEDEM_QUANTIDADE");
    for (const id of ["ia", "confianca", "fallback", "classificar"]) {
      const step = resultado.passos.find((item) => item.id === id);
      expect(step?.status).toBe("IGNORADO");
      expect(step?.motivo).toContain("validação reprovada");
    }
  });

  it("aciona o fallback determinístico quando a IA lança exceção", async () => {
    const repo = criarRepositorioLocal(criarStorageMemoria());
    repo.carregar();

    const resultado = await runAnalysis(
      {
        pecaId: "P-001",
        dataLote: "2026-10-15",
        quantidade: 500,
        defeituosos: 5,
        horas: 10,
        temperatura: 205,
        pressao: 6.5,
      },
      {
        repositorio: repo,
        flags: { ...FLAGS_PADRAO, forcarFalhaIA: true },
      },
    );

    expect(resultado.origem).toBe("FALLBACK");
    expect(resultado.passos.find((step) => step.id === "ia")?.status).toBe("ERRO");
    expect(resultado.passos.find((step) => step.id === "fallback")?.status).toBe("SUCESSO");
    expect(resultado.passos.find((step) => step.id === "fallback")?.motivo).toContain("IA falhou");
  });

  it("aciona o fallback determinístico quando a confiança da IA é baixa", async () => {
    const repo = criarRepositorioLocal(criarStorageMemoria());
    repo.carregar();

    const resultado = await runAnalysis(
      {
        pecaId: "P-001",
        dataLote: "2026-10-15",
        quantidade: 500,
        defeituosos: 5,
        horas: 10,
        temperatura: 205,
        pressao: 6.5,
      },
      {
        repositorio: repo,
        ia: { modoFalha: "BAIXA_CONFIANCA" },
      },
    );

    expect(resultado.origem).toBe("FALLBACK");
    expect(resultado.passos.find((step) => step.id === "confianca")?.status).toBe("ALERTA");
    expect(resultado.passos.find((step) => step.id === "confianca")?.motivo).toContain("abaixo do mínimo");
    expect(resultado.passos.find((step) => step.id === "fallback")?.status).toBe("SUCESSO");
  });

  it("interrompe antes da IA quando a temperatura está fora da faixa", async () => {
    const repo = criarRepositorioLocal(criarStorageMemoria());
    repo.carregar();
    const bus = criarEventBus();
    const inferirSpy = vi.fn();

    const resultado = await executarPipeline(
      {
        pecaId: "P-001",
        dataLote: "2026-10-15",
        quantidade: 500,
        defeituosos: 5,
        horas: 10,
        temperatura: 300,
        pressao: 6.5,
      },
      {
        repositorio: repo,
        ia: { meta: { nome: "modelo_ia.bin", versao: "0.1", precisao: 0.9, status: "carregado" }, inferir: async () => inferirSpy() },
        engine: {
          calcularMetricas,
          classificar,
          gerarRecomendacao: () => "ok",
          executarFallback,
        },
        bus,
        regras: REGRAS_PADRAO,
        flags: FLAGS_PADRAO,
        configIA: { modoFalha: "NENHUM" },
        seed: 42,
      },
    );

    expect(inferirSpy).not.toHaveBeenCalled();
    expect(resultado.origem).toBe("VALIDACAO");
    expect(resultado.status).toBe("CRITICO");
    expect(resultado.erros.some((e) => e.codigo === "TEMPERATURA_FORA_DA_FAIXA")).toBe(true);
  });

  it("executa os 4 cenários prontos e todos batem com o esperado", async () => {
    const repo = criarRepositorioLocal(criarStorageMemoria());
    repo.carregar();

    for (const cenario of CENARIOS) {
      const resultado = await runAnalysis(cenario.input, {
        repositorio: repo,
        flags: cenario.flags,
        ia: cenario.ia,
        regras: cenario.regras,
      });
      const comparacao = compararCenario(cenario, resultado);
      expect(comparacao.passou).toBe(true);
    }
  });
});
