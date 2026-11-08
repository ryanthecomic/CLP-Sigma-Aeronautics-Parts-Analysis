import type { StateCreator } from "zustand";
import { emitirLog, eventBus } from "../../core/eventBus";
import type { FlagsDev, RegrasAnaliseAero } from "../../core/types";
import { repositorio } from "../instancias";
import type { AppState, FlagsSlice, RegrasSlice } from "../types";

export function criarRegrasSlice(inicial: RegrasAnaliseAero): StateCreator<AppState, [], [], RegrasSlice> {
  return (set) => ({
    regras: inicial,
    atualizarRegras: (regras) => {
      repositorio.atualizarRegras(regras);
      set({ regras: { ...regras } });
      emitirLog(eventBus, "INFO", "CONTROLLER", "Regras de análise atualizadas.", { payload: regras });
    },
  });
}

export function criarFlagsSlice(inicial: FlagsDev): StateCreator<AppState, [], [], FlagsSlice> {
  return (set, get) => ({
    flags: inicial,
    definirFlag: (chave, valor) => {
      const flags = { ...get().flags, [chave]: valor };
      repositorio.atualizarFlags(flags);
      set({ flags });
      emitirLog(eventBus, "INFO", "CONTROLLER", `Flag ${chave} = ${String(valor)}.`);
    },
  });
}

