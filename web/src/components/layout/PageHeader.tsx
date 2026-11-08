import type { ReactNode } from "react";

export interface PageHeaderProps {
  titulo: string;
  descricao?: string;
  meta?: ReactNode;
  acoes?: ReactNode;
}

export function PageHeader({ titulo, descricao, meta, acoes }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-borda pb-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-lg font-semibold text-slate-100">{titulo}</h1>
          {meta}
        </div>
        {descricao && <p className="mt-1 text-sm text-slate-400">{descricao}</p>}
      </div>
      {acoes && <div className="flex items-center gap-2">{acoes}</div>}
    </div>
  );
}

