import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "./cx";

export type VarianteBotao = "primario" | "secundario" | "fantasma" | "perigo";
export type TamanhoBotao = "sm" | "md";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: VarianteBotao;
  tamanho?: TamanhoBotao;
  icone?: ReactNode;
  carregando?: boolean;
}

const VARIANTES: Record<VarianteBotao, string> = {
  primario: "bg-acento text-navy-950 hover:bg-cyan-300 font-semibold",
  secundario: "border border-borda bg-grafite-700 text-slate-100 hover:bg-grafite-700/70 hover:border-slate-500",
  fantasma: "text-slate-300 hover:bg-grafite-700 hover:text-slate-100",
  perigo: "border border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20",
};

const TAMANHOS: Record<TamanhoBotao, string> = {
  sm: "h-8 px-2.5 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
};

export function Button({
  variante = "secundario",
  tamanho = "md",
  icone,
  carregando = false,
  disabled,
  className,
  children,
  type = "button",
  ...resto
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || carregando}
      aria-busy={carregando || undefined}
      className={cx(
        "inline-flex items-center justify-center rounded-md font-medium transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-50",
        VARIANTES[variante],
        TAMANHOS[tamanho],
        className,
      )}
      {...resto}
    >
      {carregando ? (
        <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
      ) : (
        icone
      )}
      {children}
    </button>
  );
}

