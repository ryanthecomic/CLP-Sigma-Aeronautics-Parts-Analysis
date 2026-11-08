import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { paraJson } from "../../core/utils";
import { Button } from "./Button";
import { cx } from "./cx";

export interface CodeBlockProps {
  valor: unknown;
  titulo?: string;
  linguagem?: string;
  alturaMax?: string;
  className?: string;
}

export function CodeBlock({
  valor,
  titulo,
  linguagem = "json",
  alturaMax = "max-h-96",
  className,
}: CodeBlockProps) {
  const [copiado, setCopiado] = useState(false);
  const texto = typeof valor === "string" ? valor : paraJson(valor);

  const copiar = async () => {
    try {
      await navigator.clipboard?.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch {
      // Sem permissão de clipboard no navegador: nada a fazer.
    }
  };

  return (
    <div className={cx("rounded-lg border border-borda bg-navy-950", className)}>
      <div className="flex items-center justify-between border-b border-borda px-3 py-1.5">
        <span className="font-mono text-xs text-slate-400">{titulo ?? linguagem.toUpperCase()}</span>
        <Button
          variante="fantasma"
          tamanho="sm"
          onClick={copiar}
          icone={copiado ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
        >
          {copiado ? "Copiado" : "Copiar"}
        </Button>
      </div>
      <pre className={cx("overflow-auto p-3 font-mono text-xs leading-relaxed text-slate-200", alturaMax)}>
        <code>{texto}</code>
      </pre>
    </div>
  );
}

