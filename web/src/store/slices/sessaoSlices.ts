import type { StateCreator } from "zustand";
import type { ResultadoAnalise } from "../../core/types";
import { gerarId } from "../../core/utils";
import type { AppState, LogsSlice, SessaoSlice, Toast, UiSlice } from "../types";

/** Quantidade máxima de logs mantidos em memória. */
export const LIMITE_LOGS = 500;

export function criarSessaoSlice(ultimo: ResultadoAnalise | null): StateCreator<AppState, [], [], SessaoSlice> {
  return (set) => ({
    traceAtual: ultimo?.traceId ?? null,
    passos: ultimo?.passos ?? [],
    ultimoResultado: ultimo,
    executando: false,
    definirExecutando: (executando) => set({ executando }),
  });
}

export const criarLogsSlice: StateCreator<AppState, [], [], LogsSlice> = (set) => ({
  logs: [],
  adicionarLog: (log) => set((s) => ({ logs: [...s.logs, log].slice(-LIMITE_LOGS) })),
  limparLogs: () => set({ logs: [] }),
});

export function criarUiSlice(toastsIniciais: Toast[]): StateCreator<AppState, [], [], UiSlice> {
  return (set) => ({
    toasts: toastsIniciais,
    notificar: (tipo, mensagem) => set((s) => ({ toasts: [...s.toasts, { id: gerarId("toast"), tipo, mensagem }] })),
    dispensarToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  });
}

