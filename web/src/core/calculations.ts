/**
 * Cálculos determinísticos de produção.
 *
 * Dono: Membro 3 (Cálculos & Fallback). Funções puras, sem React.
 *
 * Fórmulas:
 * - Produtividade = quantidade / horas (0 se horas ≤ 0).
 * - Taxa de defeitos = defeituosos / quantidade × 100, limitada a 0–100 (0 se quantidade ≤ 0).
 * - Eficiência = quantidade / (horas × 50) × 100, limitada a 0–100 (0 se horas ≤ 0).
 * - Conformidade = 100 − taxa de defeitos.
 * - Previsão de falhas = taxa de defeitos × 2 + (desvio de temperatura + desvio de pressão) × 10,
 *   limitada a 0–100. O desvio vale 0 no centro da faixa, 1 na borda e > 1 fora dela.
 */
import type { DadosProducaoAero, MetricasProducao, RegrasAnaliseAero } from "./types";
import { arredondar, limitar } from "./utils";

/** Capacidade nominal de referência: peças por hora. */
export const CAPACIDADE_NOMINAL_POR_HORA = 50;

/** Desvio normalizado de `valor` em relação ao centro da faixa [min, max]. */
export function desvioNormalizado(valor: number, min: number, max: number): number {
  const meiaLargura = (max - min) / 2;
  if (meiaLargura <= 0 || !Number.isFinite(valor)) return 0;
  const centro = min + meiaLargura;
  return Math.abs(valor - centro) / meiaLargura;
}

export function calcularProdutividade(quantidade: number, horas: number): number {
  if (horas <= 0 || !Number.isFinite(horas)) return 0;
  return arredondar(Math.max(0, quantidade) / horas);
}

export function calcularTaxaDefeitos(defeituosos: number, quantidade: number): number {
  if (quantidade <= 0 || !Number.isFinite(quantidade)) return 0;
  return arredondar(limitar((defeituosos / quantidade) * 100, 0, 100));
}

export function calcularEficiencia(quantidade: number, horas: number): number {
  if (horas <= 0 || !Number.isFinite(horas)) return 0;
  return arredondar(limitar((quantidade / (horas * CAPACIDADE_NOMINAL_POR_HORA)) * 100, 0, 100));
}

export function calcularPrevisaoFalhas(
  taxaDefeitos: number,
  dados: Pick<DadosProducaoAero, "temperatura" | "pressao">,
  regras: RegrasAnaliseAero,
): number {
  const desvioT = desvioNormalizado(dados.temperatura, regras.temperaturaMin, regras.temperaturaMax);
  const desvioP = desvioNormalizado(dados.pressao, regras.pressaoMin, regras.pressaoMax);
  return arredondar(limitar(taxaDefeitos * 2 + (desvioT + desvioP) * 10, 0, 100));
}

/** Calcula todas as métricas de um lote. */
export function calcularMetricas(dados: DadosProducaoAero, regras: RegrasAnaliseAero): MetricasProducao {
  const taxaDefeitos = calcularTaxaDefeitos(dados.defeituosos, dados.quantidade);
  return {
    produtividade: calcularProdutividade(dados.quantidade, dados.horas),
    taxaDefeitos,
    eficiencia: calcularEficiencia(dados.quantidade, dados.horas),
    conformidade: arredondar(100 - taxaDefeitos),
    previsaoFalhas: calcularPrevisaoFalhas(taxaDefeitos, dados, regras),
  };
}

