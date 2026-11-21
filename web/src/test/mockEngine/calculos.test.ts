import { describe, expect, it } from "vitest";
import { calcularMetricas } from "../../core/calculations";
import { executarFallback } from "../../core/fallback";
import { REGRAS_PADRAO } from "../../core/rules";
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
