/**
 * Tipos de domínio do Aerolyze Lab.
 *
 * Dono: Membro 1 (Modelo). Congelado após a Fase 0 — mudanças exigem
 * revisão do Membro 1 e do Membro 2.
 *
 * Este arquivo é TypeScript puro: não importa React nem nada fora de `core`.
 */
import type { PipelineStep, ValidationIssue } from "./contracts";

export type { LogEvent, PipelineStep, ValidationIssue } from "./contracts";

/** Classificação final de qualidade de um lote. */
export const StatusQualidade = {
  OTIMO: "OTIMO",
  ATENCAO: "ATENCAO",
  CRITICO: "CRITICO",
} as const;
export type StatusQualidade = (typeof StatusQualidade)[keyof typeof StatusQualidade];

/** Camadas da arquitetura MVC original (usadas no pipeline e nos logs). */
export const ModuloSistema = {
  VIEW: "VIEW",
  CONTROLLER: "CONTROLLER",
  MODEL: "MODEL",
  CALC: "CALC",
  IA: "IA",
  REPO: "REPO",
} as const;
export type ModuloSistema = (typeof ModuloSistema)[keyof typeof ModuloSistema];

export const MODULOS_SISTEMA: readonly ModuloSistema[] = [
  ModuloSistema.VIEW,
  ModuloSistema.CONTROLLER,
  ModuloSistema.MODEL,
  ModuloSistema.CALC,
  ModuloSistema.IA,
  ModuloSistema.REPO,
];

/** Peça aeronáutica cadastrada. */
export interface PecaAeronautica {
  id: string;
  nome: string;
  material: string;
  pesoKg: number;
  conforme: boolean;
}

/** Dados de produção de um lote de peças. */
export interface DadosProducaoAero {
  id: string;
  pecaId: string;
  /** Data do lote no formato ISO `AAAA-MM-DD`. */
  dataLote: string;
  quantidade: number;
  defeituosos: number;
  horas: number;
  /** Temperatura do processo em °C. */
  temperatura: number;
  /** Pressão do processo em bar. */
  pressao: number;
}

/**
 * Regras de análise configuráveis.
 *
 * Os cinco primeiros campos são o contrato mínimo; os limiares de
 * classificação foram adicionados para que a classificação também seja
 * configurável (ver seção 7 do prompt).
 */
export interface RegrasAnaliseAero {
  temperaturaMin: number;
  temperaturaMax: number;
  pressaoMin: number;
  pressaoMax: number;
  confiancaMinimaIA: number;
  /** Taxa de defeitos (%) até a qual o lote é ÓTIMO. */
  taxaDefeitosOtimo: number;
  /** Taxa de defeitos (%) até a qual o lote é ATENÇÃO. Acima disso, CRÍTICO. */
  taxaDefeitosAtencao: number;
  /** Eficiência (%) mínima para ÓTIMO. */
  eficienciaOtimo: number;
  /** Eficiência (%) mínima para ATENÇÃO. Abaixo disso, CRÍTICO. */
  eficienciaAtencao: number;
}

export const StatusPasso = {
  PENDENTE: "PENDENTE",
  EXECUTANDO: "EXECUTANDO",
  SUCESSO: "SUCESSO",
  ALERTA: "ALERTA",
  ERRO: "ERRO",
  IGNORADO: "IGNORADO",
} as const;
export type StatusPasso = (typeof StatusPasso)[keyof typeof StatusPasso];

export const OrigemResultado = {
  IA: "IA",
  FALLBACK: "FALLBACK",
  VALIDACAO: "VALIDACAO",
} as const;
export type OrigemResultado = (typeof OrigemResultado)[keyof typeof OrigemResultado];

/** Métricas de produção calculadas para um lote. */
export interface MetricasProducao {
  /** Peças por hora. */
  produtividade: number;
  /** Percentual de peças defeituosas (0–100). */
  taxaDefeitos: number;
  /** Eficiência (0–100). */
  eficiencia: number;
  /** Conformidade (0–100). */
  conformidade: number;
  /** Previsão de falhas (0–100). */
  previsaoFalhas: number;
}

/** Resultado de uma análise de lote. */
export interface ResultadoAnalise extends MetricasProducao {
  id: string;
  loteId: string;
  status: StatusQualidade;
  recomendacao: string;
  origem: OrigemResultado;
  /** Confiança entre 0 e 1. */
  confianca: number;
  traceId: string;
  passos: PipelineStep[];
  /** Erros de validação (vazio quando a entrada é válida). */
  erros: ValidationIssue[];
  /** Data/hora ISO da análise. */
  criadoEm: string;
}

export const NivelLog = {
  DEBUG: "DEBUG",
  INFO: "INFO",
  WARN: "WARN",
  ERROR: "ERROR",
} as const;
export type NivelLog = (typeof NivelLog)[keyof typeof NivelLog];

export const NIVEIS_LOG: readonly NivelLog[] = [
  NivelLog.DEBUG,
  NivelLog.INFO,
  NivelLog.WARN,
  NivelLog.ERROR,
];

/** Flags do Modo Desenvolvedor que alteram o motor mock. */
export interface FlagsDev {
  /** A IA sempre lança exceção. */
  forcarFalhaIA: boolean;
  /** A IA é ignorada e o fallback sempre executa. */
  forcarFallback: boolean;
  /** Adiciona guard clauses extras (data não futura e margem de segurança). */
  validacaoEstrita: boolean;
  /** Adiciona latência artificial à inferência da IA. */
  latenciaSimulada: boolean;
}

/** Modos de falha simuláveis da IA mock. */
export const ModoFalhaIA = {
  NENHUM: "NENHUM",
  EXCECAO: "EXCECAO",
  TIMEOUT: "TIMEOUT",
  BAIXA_CONFIANCA: "BAIXA_CONFIANCA",
  SAIDA_INVALIDA: "SAIDA_INVALIDA",
} as const;
export type ModoFalhaIA = (typeof ModoFalhaIA)[keyof typeof ModoFalhaIA];

export const MODOS_FALHA_IA: readonly ModoFalhaIA[] = [
  ModoFalhaIA.NENHUM,
  ModoFalhaIA.EXCECAO,
  ModoFalhaIA.TIMEOUT,
  ModoFalhaIA.BAIXA_CONFIANCA,
  ModoFalhaIA.SAIDA_INVALIDA,
];

/** Entrada de uma análise (o que o operador informa). */
export interface AnaliseInput {
  /** Opcional: se ausente, o motor gera um id de lote. */
  loteId?: string;
  pecaId: string;
  dataLote: string;
  quantidade: number;
  defeituosos: number;
  horas: number;
  temperatura: number;
  pressao: number;
}

/** Tudo o que o Repositório persiste. */
export interface DadosPersistidos {
  versao: 1;
  pecas: PecaAeronautica[];
  lotes: DadosProducaoAero[];
  resultados: ResultadoAnalise[];
  regras: RegrasAnaliseAero;
  flags: FlagsDev;
}

export enum EtapaValidacao {
  CAMPOS = "campos",
  PECA = "peca",
  LOTE = "lote",
}