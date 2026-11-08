/**
 * Store global (Zustand) com slices: dados, regras, flags, sessão, logs e UI.
 *
 * Dono: Membro 2. A store se inscreve no event bus e é a fonte reativa
 * da UI. A persistência é feita SOMENTE pelo Repositório.
 *
 * Fluxo: UI → hook → mockEngine → eventBus → store → UI
 */
import { create } from "zustand";
import { eventBus } from "../core/eventBus";
import { gerarId } from "../core/utils";
import { repositorio } from "./instancias";
import { criarFlagsSlice, criarRegrasSlice } from "./slices/configSlices";
import { criarDadosSlice } from "./slices/dadosSlice";
import { criarLogsSlice, criarSessaoSlice, criarUiSlice } from "./slices/sessaoSlices";
import type { AppState, Toast } from "./types";

const carga = repositorio.carregar();
const toastsIniciais: Toast[] = carga.aviso ? [{ id: gerarId("toast"), tipo: "aviso", mensagem: carga.aviso }] : [];

export const useAppStore = create<AppState>()((...a) => ({
  ...criarDadosSlice(carga.dados)(...a),
  ...criarRegrasSlice(carga.dados.regras)(...a),
  ...criarFlagsSlice(carga.dados.flags)(...a),
  ...criarSessaoSlice(carga.dados.resultados[0] ?? null)(...a),
  ...criarLogsSlice(...a),
  ...criarUiSlice(toastsIniciais)(...a),
}));

eventBus.on((evento) => {
  const estado = useAppStore.getState();
  switch (evento.tipo) {
    case "analise:inicio":
      useAppStore.setState({ traceAtual: evento.traceId, passos: [] });
      break;
    case "step":
      if (evento.traceId === useAppStore.getState().traceAtual) {
        useAppStore.setState((s) => ({ passos: [...s.passos, evento.step] }));
      }
      break;
    case "log":
      estado.adicionarLog(evento.log);
      break;
    case "analise:fim":
      useAppStore.setState({ ultimoResultado: evento.resultado, passos: evento.resultado.passos });
      estado.sincronizarDados();
      break;
  }
});

export type { AppState, Toast, TipoToast } from "./types";

