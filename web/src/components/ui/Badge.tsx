import type { ReactNode } from "react";
import { cx } from "./cx";

export type TomBadge = "neutro" | "acento" | "sucesso" | "alerta" | "perigo" | "info";

export interface BadgeProps {
  tom?: TomBadge;
  icone?: ReactNode;
  className?: string;
  children: ReactNode;
}

const TONS: Record<TomBadge, string> = {
  neutro: "border-slate-600 bg-slate-700/40 text-slate-300",
  acento: "border-cyan-500/40 bg-cyan-500/10 text-cyan-300",
  sucesso: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  alerta: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  perigo: "border-red-500/40 bg-red-500/10 text-red-300",
  info: "border-sky-500/40 bg-sky-500/10 text-sky-300",
};

export function Badge({ tom = "neutro", icone, className, children }: BadgeProps) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium",
        TONS[tom],
        className,
      )}
    >
      {icone}
      {children}
    </span>
  );
}

