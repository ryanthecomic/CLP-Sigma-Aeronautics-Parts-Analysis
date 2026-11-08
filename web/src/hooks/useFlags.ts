/**
 * Hook de fachada: flags do Modo Desenvolvedor.
 */
import { useCallback } from "react";
import type { FlagsDev } from "../core/types";
import { useAppStore } from "../store";

export interface UseFlags {
  flags: FlagsDev;
  definirFlag: (chave: keyof FlagsDev, valor: boolean) => void;
  alternar: (chave: keyof FlagsDev) => void;
}

export function useFlags(): UseFlags {
  const flags = useAppStore((s) => s.flags);
  const definirFlag = useAppStore((s) => s.definirFlag);
  const alternar = useCallback(
    (chave: keyof FlagsDev) => definirFlag(chave, !useAppStore.getState().flags[chave]),
    [definirFlag],
  );
  return { flags, definirFlag, alternar };
}

