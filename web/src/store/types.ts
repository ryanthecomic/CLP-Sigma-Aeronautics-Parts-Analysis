/**
 * Tipos da store global (Zustand com slices).
 */
import type {
  FlagsDev,
  LogEvent,
  PecaAeronautica,
  DadosProducaoAero,
  PipelineStep,
  RegrasAnaliseAero,
  ResultadoAnalise,
} from "../core/types";

export type TipoToast = "sucesso" | "erro" | "aviso" | "info";

export interface Toast {
  id: string;
  tipo: TipoToast;
  mensagem: string;
}

export interface DadosSlice {
  pecas: PecaAeronautica[];
  lotes: DadosProducaoAero[];
  resultados: ResultadoAnalise[];
  salvarPeca: (peca: PecaAeronautica) => void;
  alternarConforme: (id: string) => void;
  removerPeca: (id: string) => void;
  removerLote: (id: string) => void;
  removerResultado: (id: string) => void;
  resetarDados: () => void;
  /** Copia o snapshot atual do repositório para a store. */
  sincronizarDados: () => void;
}

export interface RegrasSlice {
  regras: RegrasAnaliseAero;
  atualizarRegras: (regras: RegrasAnaliseAero) => void;
}

export interface FlagsSlice {
  flags: FlagsDev;
  definirFlag: (chave: keyof FlagsDev, valor: boolean) => void;
}

export interface SessaoSlice {
  traceAtual: string | null;
  passos: PipelineStep[];
  ultimoResultado: ResultadoAnalise | null;
  executando: boolean;
  definirExecutando: (executando: boolean) => void;
}

export interface LogsSlice {
  logs: LogEvent[];
  adicionarLog: (log: LogEvent) => void;
  limparLogs: () => void;
}

export interface UiSlice {
  toasts: Toast[];
  notificar: (tipo: TipoToast, mensagem: string) => void;
  dispensarToast: (id: string) => void;
}

export type AppState = DadosSlice & RegrasSlice & FlagsSlice & SessaoSlice & LogsSlice & UiSlice;

