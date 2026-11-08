import { Activity, BookOpen, Database, Flag, LayoutGrid, ScrollText } from "lucide-react";
import { NavLink } from "react-router";
import { MODULOS } from "../../modules/registry";
import { cx } from "../ui/cx";

const LINKS_GLOBAIS = [
  { para: "/dev", rotulo: "Hub", icone: LayoutGrid, end: true },
  { para: "/dev/pipeline", rotulo: "Pipeline", icone: Activity, end: false },
  { para: "/dev/estado", rotulo: "Estado", icone: Database, end: false },
  { para: "/dev/logs", rotulo: "Logs", icone: ScrollText, end: false },
  { para: "/dev/flags", rotulo: "Flags & Cenários", icone: Flag, end: false },
  { para: "/dev/docs", rotulo: "Docs", icone: BookOpen, end: false },
] as const;

export function Sidebar() {
  return (
    <aside
      aria-label="Navegação do Modo Desenvolvedor"
      className="flex w-60 shrink-0 flex-col border-r border-borda bg-grafite-900"
    >
      <div className="p-3">
        <p className="px-2 pb-1.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Ferramentas
        </p>
        <nav className="flex flex-col gap-0.5">
          {LINKS_GLOBAIS.map(({ para, rotulo, icone: Icone, end }) => (
            <NavLink
              key={para}
              to={para}
              end={end}
              className={({ isActive }) =>
                cx(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-cyan-500/15 text-cyan-300"
                    : "text-slate-300 hover:bg-grafite-700 hover:text-slate-100",
                )
              }
            >
              <Icone className="size-4 shrink-0" aria-hidden />
              <span>{rotulo}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="border-t border-borda p-3">
        <p className="px-2 pb-1.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          7 Módulos (Sandboxes)
        </p>
        <nav className="flex flex-col gap-0.5">
          {MODULOS.map((m) => (
            <NavLink
              key={m.id}
              to={`/dev/modulo/${m.id}`}
              className={({ isActive }) =>
                cx(
                  "flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs transition-colors",
                  isActive
                    ? "bg-cyan-500/15 font-medium text-cyan-300"
                    : "text-slate-400 hover:bg-grafite-700 hover:text-slate-200",
                )
              }
            >
              <span className="truncate">{m.nome}</span>
              <span className="font-mono text-[10px] text-slate-500">{m.camada}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="mt-auto border-t border-borda p-3 text-[11px] text-slate-500">
        Equipe Sigma · UFAL · CLP
      </div>
    </aside>
  );
}

