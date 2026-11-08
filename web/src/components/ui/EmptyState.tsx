import type { ReactNode } from "react";

export interface EmptyStateProps {
  titulo: string;
  descricao?: string;
  icone?: ReactNode;
  acao?: ReactNode;
}

export function EmptyState({ titulo, descricao, icone, acao }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-borda bg-grafite-900/50 p-8 text-center">
      {icone && <div className="mb-3 text-slate-400">{icone}</div>}
      <p className="text-sm font-medium text-slate-200">{titulo}</p>
      {descricao && <p className="mt-1 max-w-md text-xs text-slate-400">{descricao}</p>}
      {acao && <div className="mt-4">{acao}</div>}
    </div>
  );
}

