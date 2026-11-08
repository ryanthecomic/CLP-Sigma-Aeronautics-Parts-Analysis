import { useId, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { cx } from "./cx";

export interface Aba {
  id: string;
  rotulo: string;
  conteudo: ReactNode;
}

export interface TabsProps {
  abas: Aba[];
  inicial?: string;
  rotuloAcessivel: string;
  onTrocar?: (id: string) => void;
}

export function Tabs({ abas, inicial, rotuloAcessivel, onTrocar }: TabsProps) {
  const base = useId();
  const [ativa, setAtiva] = useState(inicial ?? abas[0]?.id ?? "");
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const selecionar = (id: string) => {
    setAtiva(id);
    onTrocar?.(id);
  };

  const aoTeclar = (e: KeyboardEvent<HTMLButtonElement>, indice: number) => {
    let proximo = indice;
    if (e.key === "ArrowRight") proximo = (indice + 1) % abas.length;
    else if (e.key === "ArrowLeft") proximo = (indice - 1 + abas.length) % abas.length;
    else if (e.key === "Home") proximo = 0;
    else if (e.key === "End") proximo = abas.length - 1;
    else return;
    e.preventDefault();
    const aba = abas[proximo];
    if (aba) {
      selecionar(aba.id);
      refs.current[proximo]?.focus();
    }
  };

  const atual = abas.find((a) => a.id === ativa) ?? abas[0];

  return (
    <div>
      <div role="tablist" aria-label={rotuloAcessivel} className="flex gap-1 border-b border-borda">
        {abas.map((aba, i) => {
          const selecionada = aba.id === atual?.id;
          return (
            <button
              key={aba.id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${base}-tab-${aba.id}`}
              aria-selected={selecionada}
              aria-controls={`${base}-painel-${aba.id}`}
              tabIndex={selecionada ? 0 : -1}
              onClick={() => selecionar(aba.id)}
              onKeyDown={(e) => aoTeclar(e, i)}
              className={cx(
                "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                selecionada
                  ? "border-acento text-cyan-300"
                  : "border-transparent text-slate-400 hover:text-slate-200",
              )}
            >
              {aba.rotulo}
            </button>
          );
        })}
      </div>
      {atual && (
        <div
          role="tabpanel"
          id={`${base}-painel-${atual.id}`}
          aria-labelledby={`${base}-tab-${atual.id}`}
          className="pt-4"
        >
          {atual.conteudo}
        </div>
      )}
    </div>
  );
}

