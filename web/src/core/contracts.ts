/**
 * Contratos (interfaces) entre as partes do sistema.
 *
 * Dono: Membro 2 (Controlador). Revisão obrigatória do Membro 1.
 * TypeScript puro — sem React. O tipo React do manifest de módulo fica em
 * `src/modules/types.ts`, que especializa `ModuleManifest` abaixo.
 */
import type {
  AnaliseInput,
  DadosPersistidos,
  DadosProducaoAero,
  FlagsDev,
  LogEvent,
  MetricasProducao,
  ModoFalhaIA,
  ModuloSistema,
  PecaAeronautica,
  PipelineStep,
  RegrasAnaliseAero,
  ResultadoAnalise,
  StatusQualidade,
  ValidationIssue,
} from "./types";

export type { LogEvent, PipelineStep, ValidationIssue };

/* ------------------------------------------------------------------ */
/* Guard clauses                                                       */
/* ------------------------------------------------------------------ */

/** Etapa do pipeline em que a guard clause roda. */
export type EtapaValidacao = "campos" | "peca" | "lote";

/** Resultado de uma guard clause executada pelo Controlador. */
export interface GuardResult {
  id: string;
  label: string;
  etapa: EtapaValidacao;
  modulo: ModuloSistema;
  aprovado: boolean;
  /** Presente quando a guard reprovou. */
  issues: ValidationIssue[];
}

/** Resultado da validação completa ("validar primeiro"). */
export interface ResultadoValidacao {
  valido: boolean;
  guardas: GuardResult[];
  erros: ValidationIssue[];
}

/* ------------------------------------------------------------------ */
/* IA (Membro 4)                                                       */
/* ------------------------------------------------------------------ */

export interface ModeloIAMeta {
  nome: string;
  versao: string;
  /** Precisão declarada do modelo (0–1). */
  precisao: number;
  status: "carregado" | "indisponivel";
}

/** Configuração da IA mock. */
export interface ConfigIA {
  modoFalha: ModoFalhaIA;
  /** Se definido, força a confiança reportada (0–1) no modo NENHUM. */
  confianca?: number;
  /** Tempo limite simulado (ms) usado no modo TIMEOUT. */
  timeoutMs?: number;
}

export interface RequisicaoIA {
  dados: DadosProducaoAero;
  peca: PecaAeronautica;
  regras: RegrasAnaliseAero;
  config: ConfigIA;
  seed: number;
}

/** Saída bruta da IA. Pode ser inválida no modo SAIDA_INVALIDA. */
export interface SaidaBrutaIA extends MetricasProducao {
  confianca: number;
  recomendacao: string;
  modelo: string;
}

export type TipoErroIA = "EXCECAO" | "TIMEOUT";

/** Provedor de IA (biblioteca embarcada, chamada em processo, sem rede). */
export interface AIProvider {
  readonly meta: ModeloIAMeta;
  /** Lança `ErroIA` em caso de exceção ou timeout. */
  inferir(requisicao: RequisicaoIA): SaidaBrutaIA;
}

/* ------------------------------------------------------------------ */
/* Cálculos & fallback (Membro 3)                                      */
/* ------------------------------------------------------------------ */

/** Fronteira entre orquestração (Membro 2) e cálculos (Membro 3). */
export interface AnalysisEngine {
  calcularMetricas(dados: DadosProducaoAero, regras: RegrasAnaliseAero): MetricasProducao;
  classificar(metricas: MetricasProducao, regras: RegrasAnaliseAero): StatusQualidade;
  gerarRecomendacao(
    status: StatusQualidade,
    metricas: MetricasProducao,
    dados: DadosProducaoAero,
    regras: RegrasAnaliseAero,
  ): string;
  executarFallback(dados: DadosProducaoAero, regras: RegrasAnaliseAero): ResultadoAnalise;
}

/* ------------------------------------------------------------------ */
/* Repositório (Membro 5)                                              */
/* ------------------------------------------------------------------ */

export type ColecaoRepositorio = "pecas" | "lotes" | "resultados";

export interface ResultadoCarga {
  dados: DadosPersistidos;
  /** Mensagem quando os dados foram recuperados/resetados. */
  aviso?: string;
}

/** Única porta para os dados persistidos. */
export interface Repository {
  readonly chave: string;
  carregar(): ResultadoCarga;
  snapshot(): DadosPersistidos;
  buscarPeca(id: string): PecaAeronautica | undefined;
  buscarLote(id: string): DadosProducaoAero | undefined;
  listarResultados(): ResultadoAnalise[];
  salvarPeca(peca: PecaAeronautica): void;
  registrarLote(lote: DadosProducaoAero): void;
  registrarResultado(resultado: ResultadoAnalise): void;
  remover(colecao: ColecaoRepositorio, id: string): void;
  atualizarRegras(regras: RegrasAnaliseAero): void;
  atualizarFlags(flags: FlagsDev): void;
  reset(): DadosPersistidos;
}

/* ------------------------------------------------------------------ */
/* Event bus                                                           */
/* ------------------------------------------------------------------ */

export type BusEvent =
  | { tipo: "analise:inicio"; traceId: string; input: AnaliseInput }
  | { tipo: "step"; traceId: string; step: PipelineStep }
  | { tipo: "log"; log: LogEvent }
  | { tipo: "analise:fim"; traceId: string; resultado: ResultadoAnalise };

export type BusHandler = (evento: BusEvent) => void;

export interface EventBus {
  emit(evento: BusEvent): void;
  on(handler: BusHandler): () => void;
}

/* ------------------------------------------------------------------ */
/* Gateway usado pela UI                                               */
/* ------------------------------------------------------------------ */

export interface OpcoesAnalise {
  flags?: FlagsDev;
  regras?: RegrasAnaliseAero;
  ia?: ConfigIA;
  seed?: number;
}

/** Porta que a camada de UI usa para pedir uma análise. */
export interface AnalysisGateway {
  analisar(input: AnaliseInput, opcoes?: OpcoesAnalise): Promise<ResultadoAnalise>;
}

/* ------------------------------------------------------------------ */
/* Registro de módulos                                                 */
/* ------------------------------------------------------------------ */

export type StatusModulo = "planejado" | "em_andamento" | "pronto";

/**
 * Manifest de um módulo. `TSandbox` é o componente do sandbox; a
 * especialização React está em `src/modules/types.ts`.
 */
export interface ModuleManifest<TSandbox = unknown> {
  id: string;
  nome: string;
  /** "Membro 1" etc. */
  responsavel: string;
  descricao: string;
  status: StatusModulo;
  /** Camada usada nos logs emitidos pelo sandbox. */
  camada: ModuloSistema;
  contratos: string[];
  sandbox: TSandbox;
}
