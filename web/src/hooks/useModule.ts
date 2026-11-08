/**
 * Hook de fachada: manifest do módulo e emissão de logs com a camada correta.
 */
import { useCallback } from "react";
import { emitirLog, eventBus } from "../core/eventBus";
import type { NivelLog } from "../core/types";
import { encontrarModulo } from "../modules/registry";
import type { ReactModuleManifest } from "../modules/types";

export interface UseModule {
  manifest: ReactModuleManifest | undefined;
  log: (nivel: NivelLog, mensagem: string, payload?: unknown) => void;
}

export function useModule(id: string): UseModule {
  const manifest = encontrarModulo(id);
  const camada = manifest?.camada ?? "VIEW";
  const log = useCallback(
    (nivel: NivelLog, mensagem: string, payload?: unknown) => {
      emitirLog(eventBus, nivel, camada, `[${id}] ${mensagem}`, payload === undefined ? {} : { payload });
    },
    [camada, id],
  );
  return { manifest, log };
}

