import { describe, expect, it } from "vitest";
import type { ConfigIA, RequisicaoIA } from "../../core/contracts";
import {
  descreverModelo,
  ehErroIA,
  fallbackSeriaAcionado,
  mockAIProvider,
  MODELO_IA_META,
  motivoFallbackIA,
  simularIA,
  validarSaidaIA,
} from "../../core/ia";
import type { ErroIA } from "../../core/ia";
import fonteIA from "../../core/ia.ts?raw";
import { REGRAS_PADRAO } from "../../core/rules";
import { PECAS_SEED } from "../../core/seed";
import type { DadosProducaoAero } from "../../core/types";

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

const SEEDS = Array.from({ length: 200 }, (_, i) => i);
const MINIMO = REGRAS_PADRAO.confiancaMinimaIA;

/** Monta uma requisição de teste. Qualquer campo pode ser sobrescrito. */
function montar(config: ConfigIA, parcial: Partial<RequisicaoIA> = {}): RequisicaoIA {
  return { dados: LOTE_BASE, peca: PECAS_SEED[0]!, regras: REGRAS_PADRAO, seed: 42, ...parcial, config };
}

/** Executa a IA esperando um ErroIA e devolve o erro. Falha o teste se não houver erro. */
function capturarErro(requisicao: RequisicaoIA): ErroIA {
  try {
    simularIA(requisicao);
  } catch (e) {
    if (ehErroIA(e)) return e;
    throw e;
  }
  throw new Error("simularIA deveria ter lançado ErroIA.");
}

/** Remove comentários para os testes de "sem rede" olharem só o código. */
function semComentarios(codigo: string): string {
  return codigo.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

describe("Membro 4 — IA mock: determinismo", () => {
  it("gera exatamente a mesma saída para a mesma seed e entrada", () => {
    for (const seed of [-7, 0, 1, 42, 123]) {
      const req = montar({ modoFalha: "NENHUM" }, { seed });
      expect(simularIA(req)).toEqual(simularIA(req));
    }
  });

  it("o provedor mock devolve o mesmo resultado que simularIA", () => {
    const req = montar({ modoFalha: "NENHUM" });
    expect(mockAIProvider.inferir(req)).toEqual(simularIA(req));
  });

  it("seeds diferentes produzem saídas diferentes", () => {
    const saidas = new Set(
      SEEDS.slice(0, 20).map((seed) => JSON.stringify(simularIA(montar({ modoFalha: "NENHUM" }, { seed })))),
    );
    expect(saidas.size).toBeGreaterThan(10);
  });

  it("não depende do id do lote", () => {
    const a = simularIA(montar({ modoFalha: "NENHUM" }));
    const b = simularIA(montar({ modoFalha: "NENHUM" }, { dados: { ...LOTE_BASE, id: "L-OUTRO" } }));
    expect(b).toEqual(a);
  });

  it("a seed 0 é válida e diferente da seed 42", () => {
    const zero = simularIA(montar({ modoFalha: "NENHUM" }, { seed: 0 }));
    const quarentaEDois = simularIA(montar({ modoFalha: "NENHUM" }, { seed: 42 }));
    expect(zero).not.toEqual(quarentaEDois);
  });

  it("seed inválida (NaN, Infinity) equivale à seed 0", () => {
    const zero = simularIA(montar({ modoFalha: "NENHUM" }, { seed: 0 }));
    expect(simularIA(montar({ modoFalha: "NENHUM" }, { seed: Number.NaN }))).toEqual(zero);
    expect(simularIA(montar({ modoFalha: "NENHUM" }, { seed: Number.POSITIVE_INFINITY }))).toEqual(zero);
  });

  it("no modo NENHUM a saída é sempre válida e com confiança alta", () => {
    for (const seed of SEEDS) {
      const saida = simularIA(montar({ modoFalha: "NENHUM" }, { seed }));
      expect(validarSaidaIA(saida)).toEqual([]);
      expect(saida.confianca).toBeGreaterThanOrEqual(0.78);
      expect(saida.confianca).toBeLessThan(0.99);
    }
  });

  it("respeita a confiança configurada no modo NENHUM", () => {
    const saida = simularIA(montar({ modoFalha: "NENHUM", confianca: 0.55 }));
    expect(saida.confianca).toBeCloseTo(0.55, 3);
  });
});

describe("Membro 4 — IA mock: modos de falha", () => {
  it("EXCECAO lança ErroIA documentado e reproduzível", () => {
    const req = montar({ modoFalha: "EXCECAO" });
    const erro = capturarErro(req);
    expect(erro.tipo).toBe("EXCECAO");
    expect(erro.detalhes).toEqual({ seed: 42, modelo: descreverModelo() });
    expect(erro.message).toContain("seed 42");

    const repetido = capturarErro(req);
    expect(repetido.message).toBe(erro.message);
    expect(repetido.detalhes).toEqual(erro.detalhes);
  });

  it("TIMEOUT simula uma latência acima do limite configurado", () => {
    const erro = capturarErro(montar({ modoFalha: "TIMEOUT", timeoutMs: 1500 }));
    expect(erro.tipo).toBe("TIMEOUT");
    expect(erro.detalhes.timeoutMs).toBe(1500);
    expect(erro.detalhes.latenciaSimuladaMs).toBeGreaterThan(1500);
    expect(erro.message).toContain("1500 ms");
    expect(erro.message).toContain(`${erro.detalhes.latenciaSimuladaMs} ms`);
  });

  it("TIMEOUT usa o limite padrão de 2000 ms quando nenhum é informado", () => {
    expect(capturarErro(montar({ modoFalha: "TIMEOUT" })).detalhes.timeoutMs).toBe(2000);
  });

  it("TIMEOUT é reproduzível por seed e varia entre seeds", () => {
    const req = montar({ modoFalha: "TIMEOUT", timeoutMs: 1500 });
    expect(capturarErro(req).detalhes).toEqual(capturarErro(req).detalhes);

    const latencias = new Set(
      SEEDS.slice(0, 10).map(
        (seed) => capturarErro(montar({ modoFalha: "TIMEOUT", timeoutMs: 1500 }, { seed })).detalhes.latenciaSimuladaMs,
      ),
    );
    expect(latencias.size).toBeGreaterThan(1);
  });

  it("TIMEOUT não espera de verdade (sem setTimeout)", () => {
    const inicio = performance.now();
    capturarErro(montar({ modoFalha: "TIMEOUT", timeoutMs: 60_000 }));
    expect(performance.now() - inicio).toBeLessThan(500);
  });

  it("BAIXA_CONFIANCA fica sempre abaixo do mínimo configurado e aciona o fallback", () => {
    for (const minimo of [0.5, MINIMO, 0.95]) {
      const regras = { ...REGRAS_PADRAO, confiancaMinimaIA: minimo };
      for (const seed of SEEDS) {
        const saida = simularIA(montar({ modoFalha: "BAIXA_CONFIANCA" }, { regras, seed }));
        expect(saida.confianca).toBeLessThan(minimo);
        expect(validarSaidaIA(saida)).toEqual([]);
        expect(fallbackSeriaAcionado(saida, regras)).toBe(true);
      }
    }
  });

  it("SAIDA_INVALIDA sempre reprova no schema e usa 3 tipos de corrupção", () => {
    const formatos = new Set<string>();
    for (const seed of SEEDS) {
      const saida = simularIA(montar({ modoFalha: "SAIDA_INVALIDA" }, { seed }));
      expect(validarSaidaIA(saida).length).toBeGreaterThan(0);
      expect(fallbackSeriaAcionado(saida, REGRAS_PADRAO)).toBe(true);
      expect(motivoFallbackIA(saida, REGRAS_PADRAO)).toContain("Saída inválida");
      formatos.add(JSON.stringify(saida));
    }
    expect(formatos.size).toBe(3);
  });

  it("SAIDA_INVALIDA é reproduzível", () => {
    const req = montar({ modoFalha: "SAIDA_INVALIDA" }, { seed: 7 });
    expect(simularIA(req)).toEqual(simularIA(req));
  });
});

describe("Membro 4 — IA mock: fronteira de confiança e motivo do fallback", () => {
  it("confiança exatamente igual ao mínimo é aceita", () => {
    const saida = simularIA(montar({ modoFalha: "NENHUM", confianca: MINIMO }));
    expect(saida.confianca).toBeCloseTo(MINIMO, 5);
    expect(motivoFallbackIA(saida, REGRAS_PADRAO)).toBeNull();
  });

  it("confiança logo abaixo do mínimo aciona o fallback e explica o motivo", () => {
    const saida = simularIA(montar({ modoFalha: "NENHUM", confianca: MINIMO - 0.01 }));
    expect(motivoFallbackIA(saida, REGRAS_PADRAO)).toContain("abaixo do mínimo");
    expect(fallbackSeriaAcionado(saida, REGRAS_PADRAO)).toBe(true);
  });

  it("uma saída boa não aciona o fallback", () => {
    const saida = simularIA(montar({ modoFalha: "NENHUM" }));
    expect(motivoFallbackIA(saida, REGRAS_PADRAO)).toBeNull();
    expect(fallbackSeriaAcionado(saida, REGRAS_PADRAO)).toBe(false);
  });
});

describe("Membro 4 — IA mock: metadados do modelo", () => {
  it("expõe nome, versão, precisão e status", () => {
    expect(MODELO_IA_META.nome).toBe("modelo_ia.bin");
    expect(MODELO_IA_META.versao.length).toBeGreaterThan(0);
    expect(MODELO_IA_META.precisao).toBeGreaterThan(0);
    expect(MODELO_IA_META.precisao).toBeLessThanOrEqual(1);
    expect(MODELO_IA_META.status).toBe("carregado");
  });

  it("é imutável", () => {
    expect(Object.isFrozen(MODELO_IA_META)).toBe(true);
    expect(() => {
      (MODELO_IA_META as { status: string }).status = "indisponivel";
    }).toThrow();
  });

  it("descreverModelo monta nome@versão e é usado nas saídas", () => {
    expect(descreverModelo()).toBe(`${MODELO_IA_META.nome}@${MODELO_IA_META.versao}`);
    expect(simularIA(montar({ modoFalha: "NENHUM" })).modelo).toBe(descreverModelo());
  });

  it("o provedor mock expõe exatamente os mesmos metadados", () => {
    expect(mockAIProvider.meta).toBe(MODELO_IA_META);
  });
});

describe("Membro 4 — IA mock: sem rede e sem fontes de não determinismo", () => {
  const codigo = semComentarios(fonteIA);

  it("core/ia.ts não usa nenhuma API de rede", () => {
    expect(codigo).not.toMatch(/\b(fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon)\b/);
  });

  it("core/ia.ts não usa Math.random nem relógio", () => {
    expect(codigo).not.toMatch(/Math\.random|Date\.now|new Date/);
  });
});