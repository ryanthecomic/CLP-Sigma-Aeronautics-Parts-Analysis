import type { ReactNode } from "react";
import { cx } from "./cx";

export interface CardProps {
  titulo?: ReactNode;
  descricao?: ReactNode;
  acoes?: ReactNode;
  className?: string;
  corpoClassName?: string;
  children?: ReactNode;
  as?: "section" | "article" | "div";
}

export function Card({ titulo, descricao, acoes, className, corpoClassName, children, as: Tag = "section" }: CardProps) {
  const temCabecalho = titulo !== undefined || acoes !== undefined;
  return (
    <Tag className={cx("rounded-lg border border-borda bg-grafite-800", className)}>
      {temCabecalho && (
        <header className="flex items-start justify-between gap-3 border-b border-borda px-4 py-3">
          <div className="min-w-0">
            {titulo !== undefined && <h2 className="text-sm font-semibold text-slate-100">{titulo}</h2>}
            {descricao !== undefined && <p className="mt-0.5 text-xs text-slate-400">{descricao}</p>}
          </div>
          {acoes !== undefined && <div className="flex shrink-0 items-center gap-2">{acoes}</div>}
        </header>
      )}
      <div className={cx("p-4", corpoClassName)}>{children}</div>
    </Tag>
  );
}

