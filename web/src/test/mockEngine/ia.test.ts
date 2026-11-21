import { describe, expect, it } from "vitest";
import { simularIA, validarSaidaIA } from "../../core/ia";
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
