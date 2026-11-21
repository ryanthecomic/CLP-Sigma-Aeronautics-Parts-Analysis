import { EtapaValidacao } from "./types";
import type {
  AnaliseInput,
  DadosProducaoAero,
  MetricasProducao,
  ModuloSistema,
  PipelineStep,
  StatusPasso,
} from "./types";
import { arredondar, gerarId } from "./utils";

export const PIPELINE_STEP_IDS = {
  Entrada: "entrada",
  ValidarCampos: "validar-campos",
  ValidarPeca: "validar-peca",
  ValidarLote: "validar-lote",
  Ia: "ia",
  Confianca: "confianca",
  Fallback: "fallback",
  Classificar: "classificar",
  Persistir: "persistir",
} as const;

export const MOTIVO_INTERRUPCAO = "Interrompido: validação reprovada (validar primeiro, analisar depois).";

export const METRICAS_ZERADAS: MetricasProducao = {
  produtividade: 0,
  taxaDefeitos: 0,
  eficiencia: 0,
  conformidade: 0,
  previsaoFalhas: 0,
};

export const ROTULO_ETAPA: Record<EtapaValidacao, { id: string; label: string; modulo: ModuloSistema }> = {
  [EtapaValidacao.CAMPOS]: { id: PIPELINE_STEP_IDS.ValidarCampos, label: "Validar campos obrigatórios", modulo: "CONTROLLER" },
  [EtapaValidacao.PECA]: { id: PIPELINE_STEP_IDS.ValidarPeca, label: "Validar peça", modulo: "MODEL" },
  [EtapaValidacao.LOTE]: { id: PIPELINE_STEP_IDS.ValidarLote, label: "Validar lote (faixas)", modulo: "CONTROLLER" },
};

export function relogioPadrao(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

export function criarDadosLote(
  input: AnaliseInput,
  novoId: (prefixo: string) => string = gerarId,
): DadosProducaoAero {
  const loteId = input.loteId?.trim() ? input.loteId.trim() : novoId("L");
  return {
    id: loteId,
    pecaId: input.pecaId,
    dataLote: input.dataLote,
    quantidade: input.quantidade,
    defeituosos: input.defeituosos,
    horas: input.horas,
    temperatura: input.temperatura,
    pressao: input.pressao,
  };
}

export function criarPasso(
  relogio: () => number,
  id: string,
  label: string,
  modulo: ModuloSistema,
  status: StatusPasso,
  inicio: number,
  extra: Partial<Pick<PipelineStep, "motivo" | "entrada" | "saida">> = {},
  duracaoExtraMs = 0,
): PipelineStep {
  return {
    id,
    label,
    modulo,
    status,
    duracaoMs: arredondar(relogio() - inicio + duracaoExtraMs),
    ...extra,
  };
}

export function registrarPassosInterrompidos(
  registrar: (step: PipelineStep) => void,
): void {
  for (const [id, label, modulo] of [
    [PIPELINE_STEP_IDS.Ia, "Inferência da IA", "IA"],
    [PIPELINE_STEP_IDS.Confianca, "Verificar confiança", "CONTROLLER"],
    [PIPELINE_STEP_IDS.Fallback, "Fallback determinístico", "CALC"],
    [PIPELINE_STEP_IDS.Classificar, "Classificar resultado", "MODEL"],
  ] as const) {
    registrar({ id, label, modulo, status: "IGNORADO", duracaoMs: 0, motivo: MOTIVO_INTERRUPCAO });
  }
}
