/**
 * Hook de fachada: logs do event bus, com filtros por nível e módulo.
 */
import { useMemo } from "react";
import type { LogEvent, ModuloSistema, NivelLog } from "../core/types";
import { paraJson } from "../core/utils";
import { useAppStore } from "../store";

export interface FiltrosLog {
  nivel: NivelLog | "TODOS";
  modulo: ModuloSistema | "TODOS";
}

export interface UseLogs {
  logs: LogEvent[];
  filtrados: LogEvent[];
  limpar: () => void;
  /** JSON dos logs filtrados. */
  exportarJson: () => string;
}

export function useLogs(filtros: FiltrosLog = { nivel: "TODOS", modulo: "TODOS" }): UseLogs {
  const logs = useAppStore((s) => s.logs);
  const limpar = useAppStore((s) => s.limparLogs);
  const { nivel, modulo } = filtros;

  const filtrados = useMemo(
    () => logs.filter((l) => (nivel === "TODOS" || l.nivel === nivel) && (modulo === "TODOS" || l.modulo === modulo)),
    [logs, nivel, modulo],
  );

  return { logs, filtrados, limpar, exportarJson: () => paraJson(filtrados) };
}

