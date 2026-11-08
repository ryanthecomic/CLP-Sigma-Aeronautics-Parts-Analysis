/**
 * Hook de fachada: executar análises.
 * UI → useAnalysis → mockEngine → eventBus → store → UI
 */
import { useCallback } from "react";
import type { OpcoesAnalise } from "../core/contracts";
import { emitirLog, eventBus } from "../core/eventBus";
import type { AnaliseInput, ResultadoAnalise } from "../core/types";
import { useAppStore } from "../store";
import { gateway } from "../store/instancias";

export interface UseAnalysis {
  analisar: (input: AnaliseInput, opcoes?: OpcoesAnalise) => Promise<ResultadoAnalise | null>;
  executando: boolean;
  ultimoResultado: ResultadoAnalise | null;
}

export function useAnalysis(): UseAnalysis {
  const executando = useAppStore((s) => s.executando);
  const ultimoResultado = useAppStore((s) => s.ultimoResultado);

  const analisar = useCallback(async (input: AnaliseInput, opcoes: OpcoesAnalise = {}) => {
    const estado = useAppStore.getState();
    estado.definirExecutando(true);
    try {
      return await gateway.analisar(input, { flags: estado.flags, regras: estado.regras, ...opcoes });
    } catch (e) {
      const mensagem = e instanceof Error ? e.message : String(e);
      emitirLog(eventBus, "ERROR", "CONTROLLER", `Erro inesperado na análise: ${mensagem}`);
      useAppStore.getState().notificar("erro", `Não foi possível concluir a análise: ${mensagem}`);
      return null;
    } finally {
      useAppStore.getState().definirExecutando(false);
    }
  }, []);

  return { analisar, executando, ultimoResultado };
}

