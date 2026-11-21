import { describe, expect, it } from "vitest";
import { classificar, REGRAS_PADRAO, validarPeca } from "../../core/rules";
import { PECAS_SEED } from "../../core/seed";

describe("Membro 1 — Regras, classificação e validação de peça", () => {
  it("classifica corretamente os três estados (ÓTIMO, ATENÇÃO e CRÍTICO)", () => {
    expect(classificar({ taxaDefeitos: 1, eficiencia: 90 }, REGRAS_PADRAO)).toBe("OTIMO");
    expect(classificar({ taxaDefeitos: 3.5, eficiencia: 90 }, REGRAS_PADRAO)).toBe("ATENCAO");
    expect(classificar({ taxaDefeitos: 1, eficiencia: 75 }, REGRAS_PADRAO)).toBe("ATENCAO");
    expect(classificar({ taxaDefeitos: 7, eficiencia: 95 }, REGRAS_PADRAO)).toBe("CRITICO");
    expect(classificar({ taxaDefeitos: 1, eficiencia: 60 }, REGRAS_PADRAO)).toBe("CRITICO");
  });

  it("reprova peça não conforme com código específico", () => {
    const issues = validarPeca(PECAS_SEED[4]!);
    expect(issues.some((i) => i.codigo === "PECA_NAO_CONFORME")).toBe(true);
  });
});
