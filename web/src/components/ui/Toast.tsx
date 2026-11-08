import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { useEffect } from "react";
import { useToasts } from "../../hooks/useDados";
import type { TipoToast, Toast as ToastItem } from "../../store";
import { cx } from "./cx";

const ESTILOS: Record<TipoToast, { classe: string; icone: typeof CheckCircle2 }> = {
  sucesso: { classe: "border-emerald-500/40 bg-emerald-950/90 text-emerald-100", icone: CheckCircle2 },
  aviso: { classe: "border-amber-500/40 bg-amber-950/90 text-amber-100", icone: AlertTriangle },
  erro: { classe: "border-red-500/40 bg-red-950/90 text-red-100", icone: XCircle },
  info: { classe: "border-cyan-500/40 bg-cyan-950/90 text-cyan-100", icone: Info },
};

export interface ToastProps {
  toast: ToastItem;
  onDispensar: (id: string) => void;
}

export function Toast({ toast, onDispensar }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(() => onDispensar(toast.id), 5000);
    return () => clearTimeout(t);
  }, [onDispensar, toast.id]);

  const { classe, icone: Icone } = ESTILOS[toast.tipo];
  return (
    <div
      role={toast.tipo === "erro" ? "alert" : "status"}
      className={cx("flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-xs shadow-lg", classe)}
    >
      <Icone className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span className="flex-1 leading-relaxed">{toast.mensagem}</span>
      <button
        type="button"
        onClick={() => onDispensar(toast.id)}
        aria-label="Fechar notificação"
        className="rounded p-0.5 opacity-70 hover:opacity-100"
      >
        <X className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}

export function ToastViewport() {
  const { toasts, dispensarToast } = useToasts();
  if (toasts.length === 0) return null;
  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2"
    >
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onDispensar={dispensarToast} />
      ))}
    </div>
  );
}

