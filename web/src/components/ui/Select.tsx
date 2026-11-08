import { useId } from "react";
import type { SelectHTMLAttributes } from "react";
import { cx } from "./cx";

export interface OpcaoSelect {
  valor: string;
  rotulo: string;
  desabilitada?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "id"> {
  rotulo: string;
  opcoes: OpcaoSelect[];
  erro?: string;
  dica?: string;
  placeholder?: string;
  id?: string;
}

export function Select({ rotulo, opcoes, erro, dica, placeholder, id, className, ...resto }: SelectProps) {
  const gerado = useId();
  const selectId = id ?? gerado;
  const descricaoId = erro ? `${selectId}-erro` : dica ? `${selectId}-dica` : undefined;
  return (
    <div className={cx("flex flex-col gap-1", className)}>
      <label htmlFor={selectId} className="text-xs font-medium text-slate-300">
        {rotulo}
      </label>
      <select
        id={selectId}
        aria-invalid={erro ? true : undefined}
        aria-describedby={descricaoId}
        className={cx(
          "h-9 w-full rounded-md border bg-navy-900 px-2.5 text-sm text-slate-100 focus:border-acento focus:outline-none",
          erro ? "border-red-500/70" : "border-borda",
        )}
        {...resto}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {opcoes.map((o) => (
          <option key={o.valor} value={o.valor} disabled={o.desabilitada}>
            {o.rotulo}
          </option>
        ))}
      </select>
      {erro ? (
        <p id={`${selectId}-erro`} role="alert" className="text-xs text-red-300">
          {erro}
        </p>
      ) : (
        dica && (
          <p id={`${selectId}-dica`} className="text-xs text-slate-500">
            {dica}
          </p>
        )
      )}
    </div>
  );
}

