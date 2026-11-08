/**
 * Hooks de fachada: dados do repositório, regras e notificações.
 */
import { useShallow } from "zustand/react/shallow";
import { useAppStore } from "../store";
import { repositorio } from "../store/instancias";

/** Dados persistidos e ações do Repositório. */
export function useRepositorio() {
  const estado = useAppStore(
    useShallow((s) => ({
      pecas: s.pecas,
      lotes: s.lotes,
      resultados: s.resultados,
      salvarPeca: s.salvarPeca,
      alternarConforme: s.alternarConforme,
      removerPeca: s.removerPeca,
      removerLote: s.removerLote,
      removerResultado: s.removerResultado,
      resetarDados: s.resetarDados,
    })),
  );
  return { ...estado, chave: repositorio.chave };
}

/** Regras de análise vigentes. */
export function useRegras() {
  return useAppStore(useShallow((s) => ({ regras: s.regras, atualizarRegras: s.atualizarRegras })));
}

/** Notificações (toasts). */
export function useToasts() {
  return useAppStore(
    useShallow((s) => ({ toasts: s.toasts, notificar: s.notificar, dispensarToast: s.dispensarToast })),
  );
}

