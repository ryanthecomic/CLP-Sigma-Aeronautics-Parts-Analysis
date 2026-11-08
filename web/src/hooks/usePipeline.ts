/**
 * Hook de fachada: passos do pipeline da última execução.
 */
import type { PipelineStep, ResultadoAnalise } from "../core/types";
import { useAppStore } from "../store";

export interface UsePipeline {
  passos: PipelineStep[];
  traceId: string | null;
  ultimoResultado: ResultadoAnalise | null;
}

export function usePipeline(): UsePipeline {
  const passos = useAppStore((s) => s.passos);
  const traceId = useAppStore((s) => s.traceAtual);
  const ultimoResultado = useAppStore((s) => s.ultimoResultado);
  return { passos, traceId, ultimoResultado };
}

