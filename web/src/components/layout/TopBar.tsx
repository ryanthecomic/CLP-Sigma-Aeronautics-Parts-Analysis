import { ExternalLink, RotateCcw, Wrench } from "lucide-react";
import { Link } from "react-router";
import aerolyzeLogo from "../../assets/aerolyze-horizontal-colorida.svg";
import { useRepositorio } from "../../hooks/useDados";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

export interface TopBarProps {
  modo?: "dev" | "operador";
}

export function TopBar({ modo = "dev" }: TopBarProps) {
  const { resetarDados } = useRepositorio();

  return (
    <header className="flex min-h-20 shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-borda bg-grafite-900 px-3 py-2 sm:px-5">
      <div className="flex items-center gap-2.5">
        <Link to="/dev" className="flex items-center gap-2 text-sm font-semibold text-slate-100">
          <img src={aerolyzeLogo} alt="Aerolyze" className="h-auto w-36 max-w-full sm:w-40" />
        </Link>
        <Badge tom="acento">{modo === "dev" ? "DEV" : "OPERADOR"}</Badge>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {modo === "dev" ? (
          <Link
            to="/operador"
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-borda bg-grafite-700 px-2.5 text-xs font-medium text-slate-100 transition-colors hover:border-slate-500"
          >
            <ExternalLink className="size-3.5" aria-hidden />
            Área do Operador
          </Link>
        ) : (
          <Link
            to="/dev"
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-borda bg-grafite-700 px-2.5 text-xs font-medium text-slate-100 transition-colors hover:border-slate-500"
          >
            <Wrench className="size-3.5" aria-hidden />
            Voltar ao Modo Dev
          </Link>
        )}
        <Button
          variante="secundario"
          tamanho="sm"
          onClick={resetarDados}
          icone={<RotateCcw className="size-3.5" aria-hidden />}
        >
          Resetar dados
        </Button>
      </div>
    </header>
  );
}

