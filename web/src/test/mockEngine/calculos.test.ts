import { describe, expect, it } from "vitest";
import { calcularMetricas, desvioNormalizado } from "../../core/calculations";
import {
  analysisEngine,
  executarFallback,
  gerarRecomendacao,
  principalDesvio,
  ROTULOS_DESVIO,
} from "../../core/fallback";
import { classificar, REGRAS_PADRAO } from "../../core/rules";
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

/** Cria um lote de teste preservando os campos de identificação. */
function lote(alteracoes: Partial<DadosProducaoAero>): DadosProducaoAero {
  return { ...LOTE_BASE, ...alteracoes };
}

describe("Membro 3 — Métricas determinísticas", () => {
  it("calcula produtividade, taxa de defeitos, eficiência, conformidade e previsão de falhas", () => {
    const metricas = calcularMetricas(LOTE_BASE, REGRAS_PADRAO);
    expect(metricas.produtividade).toBe(50);
    expect(metricas.taxaDefeitos).toBe(1);
    expect(metricas.eficiencia).toBe(100);
    expect(metricas.conformidade).toBe(99);
    expect(metricas.previsaoFalhas).toBe(2);
  });

  it("é determinística: a mesma entrada produz sempre a mesma saída", () => {
    const primeira = calcularMetricas(LOTE_BASE, REGRAS_PADRAO);
    const segunda = calcularMetricas(LOTE_BASE, REGRAS_PADRAO);
    expect(segunda).toEqual(primeira);
  });

  it("limita a taxa de defeitos a 100% quando defeituosos excedem a quantidade", () => {
    const metricas = calcularMetricas(lote({ quantidade: 100, defeituosos: 150, horas: 10 }), REGRAS_PADRAO);
    expect(metricas.taxaDefeitos).toBe(100);
    expect(metricas.conformidade).toBe(0);
    expect(metricas.produtividade).toBe(10);
    expect(metricas.eficiencia).toBe(20);
    expect(metricas.previsaoFalhas).toBe(100);
  });

  it("trata horas zero e quantidade zero sem NaN", () => {
    const metricas = calcularMetricas(lote({ quantidade: 0, defeituosos: 0, horas: 0 }), REGRAS_PADRAO);
    expect(metricas).toEqual({
      produtividade: 0,
      taxaDefeitos: 0,
      eficiencia: 0,
      conformidade: 100,
      previsaoFalhas: 0,
    });
  });

  it("trata quantidade e horas negativas sem gerar métricas negativas", () => {
    const metricas = calcularMetricas(lote({ quantidade: -10, defeituosos: -2, horas: -2 }), REGRAS_PADRAO);
    expect(metricas.produtividade).toBe(0);
    expect(metricas.taxaDefeitos).toBe(0);
    expect(metricas.eficiencia).toBe(0);
    expect(metricas.conformidade).toBe(100);
    expect(metricas.previsaoFalhas).toBe(0);
  });

  it("trata valores NaN e Infinity sem propagar NaN para as métricas", () => {
    const metricas = calcularMetricas(
      lote({
        quantidade: Number.NaN,
        defeituosos: Number.NaN,
        horas: Number.NaN,
        temperatura: Number.NaN,
        pressao: Number.NaN,
      }),
      REGRAS_PADRAO,
    );
    for (const valor of Object.values(metricas)) {
      expect(Number.isFinite(valor)).toBe(true);
    }

    const infinito = calcularMetricas(
      lote({ quantidade: Number.POSITIVE_INFINITY, horas: Number.POSITIVE_INFINITY, defeituosos: 1 }),
      REGRAS_PADRAO,
    );
    for (const valor of Object.values(infinito)) {
      expect(Number.isFinite(valor)).toBe(true);
    }
  });

  it("eleva a previsão de falhas quando temperatura e pressão saem da faixa e limita a 100%", () => {
    const naBordaExterna = calcularMetricas(lote({ defeituosos: 0, temperatura: 300, pressao: 13 }), REGRAS_PADRAO);
    expect(naBordaExterna.taxaDefeitos).toBe(0);
    expect(naBordaExterna.previsaoFalhas).toBe(38.57);

    const extremo = calcularMetricas(lote({ defeituosos: 0, temperatura: 1_000_000 }), REGRAS_PADRAO);
    expect(extremo.previsaoFalhas).toBe(100);
  });
});

describe("Membro 3 — Desvio normalizado", () => {
  it("vale 0 no centro, 1 na borda e > 1 fora da faixa", () => {
    expect(desvioNormalizado(200, 150, 250)).toBe(0);
    expect(desvioNormalizado(250, 150, 250)).toBe(1);
    expect(desvioNormalizado(300, 150, 250)).toBe(2);
    expect(desvioNormalizado(100, 150, 250)).toBe(2);
  });

  it("retorna 0 para faixa inválida ou valor não finito", () => {
    expect(desvioNormalizado(200, 250, 150)).toBe(0);
    expect(desvioNormalizado(Number.NaN, 150, 250)).toBe(0);
    expect(desvioNormalizado(Number.POSITIVE_INFINITY, 150, 250)).toBe(0);
  });
});

describe("Membro 3 — Fallback determinístico", () => {
  it("retorna um ResultadoAnalise completo com origem FALLBACK", () => {
    const resultado = executarFallback(LOTE_BASE, REGRAS_PADRAO);
    const metricas = calcularMetricas(LOTE_BASE, REGRAS_PADRAO);

    expect(resultado).toMatchObject({
      id: "res-L-TESTE",
      loteId: "L-TESTE",
      status: "OTIMO",
      origem: "FALLBACK",
      confianca: 1,
      traceId: "",
      passos: [],
      erros: [],
      ...metricas,
    });
    expect(resultado.status).toBe(classificar(metricas, REGRAS_PADRAO));
    expect(Number.isNaN(Date.parse(resultado.criadoEm))).toBe(false);
  });

  it("é determinístico: mesma entrada gera mesmo resultado (exceto o instante de criação)", () => {
    const primeiro = executarFallback(LOTE_BASE, REGRAS_PADRAO);
    const segundo = executarFallback(LOTE_BASE, REGRAS_PADRAO);
    const { criadoEm: _criadoEmPrimeiro, ...restoPrimeiro } = primeiro;
    const { criadoEm: _criadoEmSegundo, ...restoSegundo } = segundo;
    expect(restoSegundo).toEqual(restoPrimeiro);
  });

  it("não altera os dados de entrada", () => {
    const entrada = lote({ quantidade: 100, defeituosos: 20, horas: 2 });
    const copia = { ...entrada };
    executarFallback(entrada, REGRAS_PADRAO);
    expect(entrada).toEqual(copia);
  });

  it("classifica como CRÍTICO quando há defeituosos acima do limite de atenção", () => {
    const resultado = executarFallback(lote({ quantidade: 100, defeituosos: 20, horas: 2 }), REGRAS_PADRAO);
    expect(resultado.status).toBe("CRITICO");
    expect(resultado.taxaDefeitos).toBe(20);
  });
});

describe("Membro 3 — Desvio principal e recomendação", () => {
  it("não aponta desvio quando o lote está no centro das faixas e dentro das metas", () => {
    const metricas = calcularMetricas(LOTE_BASE, REGRAS_PADRAO);
    expect(principalDesvio(metricas, LOTE_BASE, REGRAS_PADRAO)).toBe("NENHUM");
    expect(ROTULOS_DESVIO.NENHUM).toBe("Nenhum desvio relevante");
  });

  it("aponta DEFEITOS como principal desvio em lote com excesso de defeituosos", () => {
    const dados = lote({ quantidade: 100, defeituosos: 20, horas: 2 });
    const metricas = calcularMetricas(dados, REGRAS_PADRAO);
    expect(principalDesvio(metricas, dados, REGRAS_PADRAO)).toBe("DEFEITOS");
  });

  it("aponta EFICIENCIA quando a produção fica abaixo da meta sem defeitos", () => {
    const dados = lote({ quantidade: 10, defeituosos: 0, horas: 10 });
    const metricas = calcularMetricas(dados, REGRAS_PADRAO);
    expect(metricas.eficiencia).toBe(2);
    expect(principalDesvio(metricas, dados, REGRAS_PADRAO)).toBe("EFICIENCIA");
  });

  it("aponta TEMPERATURA e PRESSAO quando o parâmetro está colado no limite", () => {
    const quente = lote({ defeituosos: 0, temperatura: 250 });
    const pressurizado = lote({ defeituosos: 0, pressao: 3 });

    expect(principalDesvio(calcularMetricas(quente, REGRAS_PADRAO), quente, REGRAS_PADRAO)).toBe("TEMPERATURA");
    expect(principalDesvio(calcularMetricas(pressurizado, REGRAS_PADRAO), pressurizado, REGRAS_PADRAO)).toBe(
      "PRESSAO",
    );
  });

  it("varia a abertura da recomendação conforme o status", () => {
    const otimo = executarFallback(LOTE_BASE, REGRAS_PADRAO);
    const atencao = executarFallback(lote({ quantidade: 100, defeituosos: 4, horas: 2 }), REGRAS_PADRAO);
    const critico = executarFallback(lote({ quantidade: 100, defeituosos: 20, horas: 2 }), REGRAS_PADRAO);

    expect(otimo.status).toBe("OTIMO");
    expect(atencao.status).toBe("ATENCAO");
    expect(critico.status).toBe("CRITICO");

    expect(otimo.recomendacao).toContain("Lote dentro dos padrões de qualidade.");
    expect(atencao.recomendacao).toContain("Lote requer atenção.");
    expect(critico.recomendacao).toContain("Lote crítico: segregar as peças e abrir não conformidade.");
    expect(new Set([otimo.recomendacao, atencao.recomendacao, critico.recomendacao]).size).toBe(3);
  });

  it("varia a ação da recomendação conforme o principal desvio", () => {
    const porDefeitos = executarFallback(lote({ quantidade: 100, defeituosos: 20, horas: 2 }), REGRAS_PADRAO);
    const porEficiencia = executarFallback(lote({ quantidade: 10, defeituosos: 0, horas: 10 }), REGRAS_PADRAO);
    const porTemperatura = executarFallback(lote({ defeituosos: 0, temperatura: 250 }), REGRAS_PADRAO);
    const porPressao = executarFallback(lote({ defeituosos: 0, pressao: 3 }), REGRAS_PADRAO);

    expect(porDefeitos.recomendacao).toContain("a taxa de defeitos é o principal desvio");
    expect(porEficiencia.recomendacao).toContain("a eficiência está abaixo da meta");
    expect(porTemperatura.recomendacao).toContain("a temperatura está próxima do limite da faixa");
    expect(porPressao.recomendacao).toContain("a pressão está próxima do limite da faixa");
  });

  it("gerarRecomendacao é pura e reutilizável com métricas calculadas", () => {
    const metricas = calcularMetricas(LOTE_BASE, REGRAS_PADRAO);
    const texto = gerarRecomendacao("OTIMO", metricas, LOTE_BASE, REGRAS_PADRAO);
    expect(texto).toBe(
      "Lote dentro dos padrões de qualidade. Manter os parâmetros atuais de processo.",
    );
  });
});

describe("Membro 3 — Contrato AnalysisEngine", () => {
  it("expõe as funções do módulo no contrato consumido pelo Controlador", () => {
    expect(analysisEngine.calcularMetricas).toBe(calcularMetricas);
    expect(analysisEngine.classificar).toBe(classificar);
    expect(analysisEngine.gerarRecomendacao).toBe(gerarRecomendacao);
    expect(analysisEngine.executarFallback).toBe(executarFallback);

    const resultado = analysisEngine.executarFallback(LOTE_BASE, REGRAS_PADRAO);
    expect(resultado.origem).toBe("FALLBACK");
    expect(resultado.status).toBe("OTIMO");
  });
});
