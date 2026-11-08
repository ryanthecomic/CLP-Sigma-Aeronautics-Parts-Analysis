import type { StateCreator } from "zustand";
import { emitirLog, eventBus } from "../../core/eventBus";
import type { DadosPersistidos } from "../../core/types";
import { repositorio } from "../instancias";
import type { AppState, DadosSlice } from "../types";

export function extrairDados(d: DadosPersistidos): Pick<DadosSlice, "pecas" | "lotes" | "resultados"> {
  return { pecas: d.pecas, lotes: d.lotes, resultados: d.resultados };
}

export function criarDadosSlice(inicial: DadosPersistidos): StateCreator<AppState, [], [], DadosSlice> {
  return (set, get) => ({
    ...extrairDados(inicial),

    sincronizarDados: () => set(extrairDados(repositorio.snapshot())),

    salvarPeca: (peca) => {
      repositorio.salvarPeca(peca);
      get().sincronizarDados();
      emitirLog(eventBus, "INFO", "MODEL", `Peça ${peca.id} salva.`, { payload: peca });
    },

    alternarConforme: (id) => {
      const peca = repositorio.buscarPeca(id);
      if (!peca) return;
      repositorio.salvarPeca({ ...peca, conforme: !peca.conforme });
      get().sincronizarDados();
      emitirLog(eventBus, "INFO", "MODEL", `Peça ${id} marcada como ${peca.conforme ? "não conforme" : "conforme"}.`);
    },

    removerPeca: (id) => {
      repositorio.remover("pecas", id);
      get().sincronizarDados();
      emitirLog(eventBus, "INFO", "REPO", `Peça ${id} removida.`);
    },

    removerLote: (id) => {
      repositorio.remover("lotes", id);
      get().sincronizarDados();
      emitirLog(eventBus, "INFO", "REPO", `Lote ${id} removido.`);
    },

    removerResultado: (id) => {
      repositorio.remover("resultados", id);
      get().sincronizarDados();
      const ultimo = get().ultimoResultado;
      if (ultimo?.id === id) set({ ultimoResultado: get().resultados[0] ?? null });
      emitirLog(eventBus, "INFO", "REPO", `Resultado ${id} removido.`);
    },

    resetarDados: () => {
      const dados = repositorio.reset();
      set({
        ...extrairDados(dados),
        regras: dados.regras,
        flags: dados.flags,
        passos: [],
        traceAtual: null,
        ultimoResultado: null,
      });
      emitirLog(eventBus, "INFO", "REPO", "Dados resetados para o seed.");
      get().notificar("sucesso", "Dados restaurados para o seed inicial.");
    },
  });
}

