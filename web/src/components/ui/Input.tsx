import { useId } from "react";
import type { InputHTMLAttributes } from "react";
import { cx } from "./cx";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  rotulo: string;
  erro?: string;
  dica?: string;
  sufixo?: string;
  id?: string;
}

export function Input({ rotulo, erro, dica, sufixo, id, className, ...resto }: InputProps) {
  const gerado = useId();
  const inputId = id ?? gerado;
  const descricaoId = erro ? `${inputId}-erro` : dica ? `${inputId}-dica` : undefined;
  return (
    <div className={cx("flex flex-col gap-1", className)}>
      <label htmlFor={inputId} className="text-xs font-medium text-slate-300">
        {rotulo}
      </label>
      <div className="relative">
        <input
          id={inputId}
          aria-invalid={erro ? true : undefined}
          aria-describedby={descricaoId}
          className={cx(
            "h-9 w-full rounded-md border bg-navy-900 px-3 text-sm text-slate-100 placeholder:text-slate-500",
            "focus:border-acento focus:outline-none",
            erro ? "border-red-500/70" : "border-borda",
            sufixo && "pr-12",
          )}
          {...resto}
        />
        {sufixo && (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-slate-500">
            {sufixo}
          </span>
        )}
      </div>
      {erro ? (
        <p id={`${inputId}-erro`} role="alert" className="text-xs text-red-300">
          {erro}
        </p>
      ) : (
        dica && (
          <p id={`${inputId}-dica`} className="text-xs text-slate-500">
            {dica}
          </p>
        )
      )}
    </div>
  );
}

