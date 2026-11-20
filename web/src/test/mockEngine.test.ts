import { describe, expect, it, vi } from "vitest";
import { calcularMetricas } from "../core/calculations";
import { criarEventBus } from "../core/eventBus";
import { executarFallback } from "../core/fallback";
import { simularIA, validarSaidaIA } from "../core/ia";
import { runAnalysis } from "../core/mockEngine";
import { executarPipeline } from "../core/pipeline";
import { criarRepositorioLocal, criarStorageMemoria } from "../core/repository";
import { classificar, REGRAS_PADRAO, validarPeca } from "../core/rules";
import { CENARIOS, compararCenario } from "../core/scenarios";
import { FLAGS_PADRAO, PECAS_SEED } from "../core/seed";
import { ModoFalhaIA, type DadosProducaoAero } from "../core/types";

const LOTE_BASE: DadosProducaoAero = {
  id: "L-TESTE",
  pecaId: "P-001",
  dataLote: "2026-10-15",
  quantidade: 500,
  defeituosos: 5,
  horas: 10,
  temperatura: 200,
  pressao: 6.5,
};

describe("Membro 1 — Regras, classificação e validação de peça", () => {
  it("classifica corretamente os três estados (ÓTIMO, ATENÇÃO e CRÍTICO)", () => {
    expect(classificar({ taxaDefeitos: 1, eficiencia: 90 }, REGRAS_PADRAO)).toBe("OTIMO");
    expect(classificar({ taxaDefeitos: 3.5, eficiencia: 90 }, REGRAS_PADRAO)).toBe("ATENCAO");
    expect(classificar({ taxaDefeitos: 1, eficiencia: 75 }, REGRAS_PADRAO)).toBe("ATENCAO");
    expect(classificar({ taxaDefeitos: 7, eficiencia: 95 }, REGRAS_PADRAO)).toBe("CRITICO");
    expect(classificar({ taxaDefeitos: 1, eficiencia: 60 }, REGRAS_PADRAO)).toBe("CRITICO");
  });

  it("reprova peça não conforme com código específico", () => {
    const issues = validarPeca(PECAS_SEED[4]!); // P-005 (conforme: false)
    expect(issues.some((i) => i.codigo === "PECA_NAO_CONFORME")).toBe(true);
  });
});

describe("Membro 3 — Cálculos determinísticos e fallback", () => {
  it("calcula produtividade, taxa de defeitos, eficiência e conformidade", () => {
    const metricas = calcularMetricas(LOTE_BASE, REGRAS_PADRAO);
    expect(metricas.produtividade).toBe(50);
    expect(metricas.taxaDefeitos).toBe(1);
    expect(metricas.eficiencia).toBe(100);
    expect(metricas.conformidade).toBe(99);
  });

  it("trata casos de borda (horas zero e quantidade zero) sem NaN", () => {
    const m = calcularMetricas({ ...LOTE_BASE, quantidade: 0, horas: 0 }, REGRAS_PADRAO);
    expect(m.produtividade).toBe(0);
    expect(m.taxaDefeitos).toBe(0);
    expect(m.eficiencia).toBe(0);
    expect(m.conformidade).toBe(100);
  });

  it("executarFallback retorna ResultadoAnalise com origem FALLBACK", () => {
    const res = executarFallback(LOTE_BASE, REGRAS_PADRAO);
    expect(res.origem).toBe("FALLBACK");
    expect(res.status).toBe("OTIMO");
    expect(res.recomendacao).toContain("padrões de qualidade");
  });
});

describe("Membro 4 — IA mock determinística e modos de falha", () => {
  it("gera exatamente a mesma saída para a mesma seed e entrada", () => {
    const req = {
      dados: LOTE_BASE,
      peca: PECAS_SEED[0]!,
      regras: REGRAS_PADRAO,
      config: { modoFalha: ModoFalhaIA.NENHUM as const },
      seed: 123,
    };
    expect(simularIA(req)).toEqual(simularIA(req));
  });

  it("reproduz os modos de falha EXCECAO, TIMEOUT, BAIXA_CONFIANCA e SAIDA_INVALIDA", () => {
    const base = { dados: LOTE_BASE, peca: PECAS_SEED[0]!, regras: REGRAS_PADRAO, seed: 42 };
    expect(() => simularIA({ ...base, config: { modoFalha: ModoFalhaIA.EXCECAO} })).toThrow();
    expect(() => simularIA({ ...base, config: { modoFalha: ModoFalhaIA.TIMEOUT } })).toThrow();

    const baixa = simularIA({ ...base, config: { modoFalha: ModoFalhaIA.BAIXA_CONFIANCA } });
    expect(baixa.confianca).toBeLessThan(REGRAS_PADRAO.confiancaMinimaIA);

    const invalida = simularIA({ ...base, config: { modoFalha: ModoFalhaIA.SAIDA_INVALIDA } });
    expect(validarSaidaIA(invalida).length).toBeGreaterThan(0);
  });
});

describe("Membro 5 — Repositório local e recuperação de JSON corrompido", () => {
  it("carrega o seed determinístico (5 peças e 6 lotes) e recupera JSON corrompido", () => {
    const storage = criarStorageMemoria({ "aerolyze-lab:v1": "{json-quebrado" });
    const repo = criarRepositorioLocal(storage);
    const carga = repo.carregar();
    expect(carga.aviso).toBeDefined();
    expect(carga.dados.pecas).toHaveLength(5);
    expect(carga.dados.lotes).toHaveLength(6);
  });
});

describe("Membro 2 — Pipeline, guard clauses e 4 cenários oficiais", () => {
  it("interrompe antes da IA quando os dados são inválidos (IA nunca é chamada)", () => {
    const repo = criarRepositorioLocal(criarStorageMemoria());
    repo.carregar();
    const bus = criarEventBus();
    const inferirSpy = vi.fn();

    const resultado = executarPipeline(
      {
        pecaId: "P-001",
        dataLote: "2026-10-15",
        quantidade: 500,
        defeituosos: 5,
        horas: 10,
        temperatura: 300, // fora da faixa 150–250
        pressao: 6.5,
      },
      {
        repositorio: repo,
        ia: { meta: { nome: "modelo_ia.bin", versao: "0.1", precisao: 0.9, status: "carregado" }, inferir: inferirSpy },
        engine: {
          calcularMetricas,
          classificar,
          gerarRecomendacao: () => "ok",
          executarFallback,
        },
        bus,
        regras: REGRAS_PADRAO,
        flags: FLAGS_PADRAO,
        configIA: { modoFalha: ModoFalhaIA.NENHUM },
        seed: 42,
      },
    );

    expect(inferirSpy).not.toHaveBeenCalled();
    expect(resultado.origem).toBe("VALIDACAO");
    expect(resultado.status).toBe("CRITICO");
    expect(resultado.erros.some((e) => e.codigo === "TEMPERATURA_FORA_DA_FAIXA")).toBe(true);
    expect(resultado.passos.find((step) => step.id === "ia")).toMatchObject({
      status: "IGNORADO",
      motivo: expect.stringContaining("validação reprovada"),
    });
    expect(resultado.passos.every((step) => Number.isFinite(step.duracaoMs))).toBe(true);
  });

  it("executa validar, IA, confiança, fallback, classificação e persistência em ordem", () => {
    const repo = criarRepositorioLocal(criarStorageMemoria());
    repo.carregar();
    const bus = criarEventBus();
    const traces: string[] = [];
    bus.on((evento) => {
      if (evento.tipo === "step") traces.push(evento.traceId);
      if (evento.tipo === "log" && evento.log.traceId) traces.push(evento.log.traceId);
    });

    const resultado = runAnalysis(
      {
        pecaId: "P-001",
        dataLote: "2026-10-15",
        quantidade: 500,
        defeituosos: 5,
        horas: 10,
        temperatura: 200,
        pressao: 6.5,
      },
      { repositorio: repo, flags: FLAGS_PADRAO, bus },
    );

    expect(resultado.passos.map((step) => step.id)).toEqual([
      "entrada",
      "validar-campos",
      "validar-peca",
      "validar-lote",
      "ia",
      "confianca",
      "fallback",
      "classificar",
      "persistir",
    ]);
    expect(resultado.passos.every((step) => step.duracaoMs >= 0)).toBe(true);
    expect(resultado.passos.find((step) => step.id === "confianca")).toMatchObject({
      status: "SUCESSO",
    });
    expect(repo.listarResultados()[0]?.traceId).toBe(resultado.traceId);
    expect(traces.length).toBeGreaterThan(0);
    expect(new Set(traces)).toEqual(new Set([resultado.traceId]));
  });

  it("executa os 4 cenários prontos e todos batem com o esperado", () => {
    const repo = criarRepositorioLocal(criarStorageMemoria());
    repo.carregar();

    for (const cenario of CENARIOS) {
      const resultado = runAnalysis(cenario.input, {
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

