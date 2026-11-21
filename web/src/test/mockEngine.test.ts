import { describe, expect, it, vi } from "vitest";
import { calcularMetricas } from "../core/calculations";
import { criarEventBus } from "../core/eventBus";
import { executarFallback } from "../core/fallback";
import { simularIA, validarSaidaIA } from "../core/ia";
import { runAnalysis } from "../core/mockEngine";
import { executarPipeline, validarEntrada } from "../core/pipeline";
import { criarRepositorioLocal, criarStorageMemoria } from "../core/repository";
import { classificar, REGRAS_PADRAO, validarPeca } from "../core/rules";
import { CENARIOS, compararCenario } from "../core/scenarios";
import { FLAGS_PADRAO, PECAS_SEED } from "../core/seed";
import type { DadosProducaoAero } from "../core/types";

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
      config: { modoFalha: "NENHUM" as const },
      seed: 123,
    };
    expect(simularIA(req)).toEqual(simularIA(req));
  });

  it("reproduz os modos de falha EXCECAO, TIMEOUT, BAIXA_CONFIANCA e SAIDA_INVALIDA", () => {
    const base = { dados: LOTE_BASE, peca: PECAS_SEED[0]!, regras: REGRAS_PADRAO, seed: 42 };
    expect(() => simularIA({ ...base, config: { modoFalha: "EXCECAO" } })).toThrow();
    expect(() => simularIA({ ...base, config: { modoFalha: "TIMEOUT" } })).toThrow();

    const baixa = simularIA({ ...base, config: { modoFalha: "BAIXA_CONFIANCA" } });
    expect(baixa.confianca).toBeLessThan(REGRAS_PADRAO.confiancaMinimaIA);

    const invalida = simularIA({ ...base, config: { modoFalha: "SAIDA_INVALIDA" } });
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
  it("reprova cada grupo de guard clauses com código específico", () => {
    const base = {
      pecaId: "P-001",
      dataLote: "2026-10-15",
      quantidade: 500,
      defeituosos: 5,
      horas: 10,
      temperatura: 200,
      pressao: 6.5,
    };
    const casos = [
      { input: { ...base, pecaId: "" }, codigo: "CAMPO_OBRIGATORIO" },
      { input: { ...base, dataLote: "2026-02-31" }, codigo: "DATA_FORMATO_INVALIDO" },
      { input: { ...base, temperatura: 300 }, codigo: "TEMPERATURA_FORA_DA_FAIXA" },
      { input: { ...base, pressao: 20 }, codigo: "PRESSAO_FORA_DA_FAIXA" },
      { input: { ...base, quantidade: 0 }, codigo: "QUANTIDADE_INVALIDA" },
      { input: { ...base, quantidade: 500.5 }, codigo: "QUANTIDADE_INVALIDA" },
      { input: { ...base, defeituosos: -1 }, codigo: "DEFEITUOSOS_INVALIDOS" },
      { input: { ...base, defeituosos: 600 }, codigo: "DEFEITUOSOS_EXCEDEM_QUANTIDADE" },
      { input: { ...base, horas: 0 }, codigo: "HORAS_INVALIDAS" },
      { input: { ...base, horas: Number.NaN }, codigo: "HORAS_INVALIDAS" },
      { input: { ...base, temperatura: Number.POSITIVE_INFINITY }, codigo: "TEMPERATURA_OBRIGATORIA" },
      { input: { ...base, pressao: Number.NaN }, codigo: "PRESSAO_OBRIGATORIA" },
    ] as const;

    for (const caso of casos) {
      const resultado = validarEntrada(caso.input, {
        regras: REGRAS_PADRAO,
        peca: PECAS_SEED[0],
        estrita: false,
        agora: new Date("2026-11-08T12:00:00Z"),
      });
      expect(resultado.valido).toBe(false);
      expect(resultado.erros.some((erro) => erro.codigo === caso.codigo)).toBe(true);
    }
  });

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
        configIA: { modoFalha: "NENHUM" },
        seed: 42,
      },
    );

    expect(inferirSpy).not.toHaveBeenCalled();
    expect(resultado.origem).toBe("VALIDACAO");
    expect(resultado.status).toBe("CRITICO");
    expect(resultado.erros.some((e) => e.codigo === "TEMPERATURA_FORA_DA_FAIXA")).toBe(true);
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

