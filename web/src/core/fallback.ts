/**
 * Fallback determinístico e recomendação textual.
 *
 * Dono: Membro 3 (Cálculos & Fallback). Funções puras, sem React.
 */
import type { AnalysisEngine } from "./contracts";
import { calcularMetricas, desvioNormalizado } from "./calculations";
import { classificar, classificarDefeitos, classificarEficiencia } from "./rules";
import type {
  DadosProducaoAero,
  MetricasProducao,
  RegrasAnaliseAero,
  ResultadoAnalise,
  StatusQualidade,
} from "./types";

export type Desvio = "DEFEITOS" | "EFICIENCIA" | "TEMPERATURA" | "PRESSAO" | "NENHUM";

/** Rótulos legíveis do desvio principal (usados nos sandboxes e no operador). */
export const ROTULOS_DESVIO: Record<Desvio, string> = {
  DEFEITOS: "Taxa de defeitos",
  EFICIENCIA: "Eficiência abaixo da meta",
  TEMPERATURA: "Temperatura próxima do limite",
  PRESSAO: "Pressão próxima do limite",
  NENHUM: "Nenhum desvio relevante",
};

/** Peso da taxa de defeitos: 0 no ótimo, 1 na borda de atenção e > 1 no crítico. */
function pesoDefeitos(metricas: MetricasProducao, regras: RegrasAnaliseAero): number {
  if (classificarDefeitos(metricas.taxaDefeitos, regras) === "OTIMO") return 0;
  if (regras.taxaDefeitosAtencao <= 0) return 1;
  return metricas.taxaDefeitos / regras.taxaDefeitosAtencao;
}

/** Peso da eficiência: 0 no ótimo e cresce conforme o afastamento da meta. */
function pesoEficiencia(metricas: MetricasProducao, regras: RegrasAnaliseAero): number {
  if (classificarEficiencia(metricas.eficiencia, regras) === "OTIMO") return 0;
  if (regras.eficienciaOtimo <= 0) return 1;
  return Math.max(0, (regras.eficienciaOtimo - metricas.eficiencia) / regras.eficienciaOtimo) + 0.5;
}

/** Identifica o principal desvio do lote (o que mais pesa na qualidade). */
export function principalDesvio(
  metricas: MetricasProducao,
  dados: DadosProducaoAero,
  regras: RegrasAnaliseAero,
): Desvio {
  const candidatos: Array<{ desvio: Desvio; peso: number }> = [
    { desvio: "DEFEITOS", peso: pesoDefeitos(metricas, regras) },
    { desvio: "EFICIENCIA", peso: pesoEficiencia(metricas, regras) },
    {
      desvio: "TEMPERATURA",
      peso: Math.max(0, desvioNormalizado(dados.temperatura, regras.temperaturaMin, regras.temperaturaMax) - 0.8),
    },
    {
      desvio: "PRESSAO",
      peso: Math.max(0, desvioNormalizado(dados.pressao, regras.pressaoMin, regras.pressaoMax) - 0.8),
    },
  ];
  const maior = candidatos.reduce((a, b) => (b.peso > a.peso ? b : a));
  return maior.peso > 0 ? maior.desvio : "NENHUM";
}

const ACAO_POR_DESVIO: Record<Desvio, string> = {
  DEFEITOS: "Inspecionar o processo de fabricação e o ferramental: a taxa de defeitos é o principal desvio.",
  EFICIENCIA: "Revisar a capacidade e as paradas da linha: a eficiência está abaixo da meta.",
  TEMPERATURA: "Recalibrar o controle térmico: a temperatura está próxima do limite da faixa.",
  PRESSAO: "Verificar o sistema de pressurização: a pressão está próxima do limite da faixa.",
  NENHUM: "Manter os parâmetros atuais de processo.",
};

const ABERTURA_POR_STATUS: Record<StatusQualidade, string> = {
  OTIMO: "Lote dentro dos padrões de qualidade.",
  ATENCAO: "Lote requer atenção.",
  CRITICO: "Lote crítico: segregar as peças e abrir não conformidade.",
};

/** Gera a recomendação com base no status e no principal desvio. */
export function gerarRecomendacao(
  status: StatusQualidade,
  metricas: MetricasProducao,
  dados: DadosProducaoAero,
  regras: RegrasAnaliseAero,
): string {
  const desvio = principalDesvio(metricas, dados, regras);
  return `${ABERTURA_POR_STATUS[status]} ${ACAO_POR_DESVIO[desvio]}`;
}

/** Confiança do fallback: regras determinísticas, sem incerteza estatística. */
export const CONFIANCA_FALLBACK = 1;

/**
 * Executa o fallback determinístico. Retorna um resultado completo, com
 * `origem: "FALLBACK"`. O orquestrador sobrescreve `traceId` e `passos`.
 */
export function executarFallback(dados: DadosProducaoAero, regras: RegrasAnaliseAero): ResultadoAnalise {
  const metricas = calcularMetricas(dados, regras);
  const status = classificar(metricas, regras);
  return {
    id: `res-${dados.id}`,
    loteId: dados.id,
    ...metricas,
    status,
    recomendacao: gerarRecomendacao(status, metricas, dados, regras),
    origem: "FALLBACK",
    confianca: CONFIANCA_FALLBACK,
    traceId: "",
    passos: [],
    erros: [],
    criadoEm: new Date().toISOString(),
  };
}

/** Implementação padrão do contrato `AnalysisEngine`. */
export const analysisEngine: AnalysisEngine = {
  calcularMetricas,
  classificar,
  gerarRecomendacao,
  executarFallback,
};

