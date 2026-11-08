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

type Desvio = "DEFEITOS" | "EFICIENCIA" | "TEMPERATURA" | "PRESSAO" | "NENHUM";

/** Identifica o principal desvio do lote (o que mais pesa na qualidade). */
export function principalDesvio(
  metricas: MetricasProducao,
  dados: DadosProducaoAero,
  regras: RegrasAnaliseAero,
): Desvio {
  const candidatos: Array<{ desvio: Desvio; peso: number }> = [
    {
      desvio: "DEFEITOS",
      peso: classificarDefeitos(metricas.taxaDefeitos, regras) === "OTIMO" ? 0 : metricas.taxaDefeitos / regras.taxaDefeitosAtencao,
    },
    {
      desvio: "EFICIENCIA",
      peso:
        classificarEficiencia(metricas.eficiencia, regras) === "OTIMO"
          ? 0
          : (regras.eficienciaOtimo - metricas.eficiencia) / regras.eficienciaOtimo + 0.5,
    },
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

