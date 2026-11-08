import { ArrowRight, CheckCircle2, Clock, Sparkles } from "lucide-react";
import { Link } from "react-router";
import type { StatusModulo } from "../../core/contracts";
import type { ReactModuleManifest } from "../../modules/types";
import { Badge } from "../../components/ui/Badge";
import type { TomBadge } from "../../components/ui/Badge";

const CONFIG_STATUS: Record<
  StatusModulo,
  { rotulo: string; tom: TomBadge; icone: typeof CheckCircle2 }
> = {
  pronto: { rotulo: "Pronto", tom: "sucesso", icone: CheckCircle2 },
  em_andamento: { rotulo: "Em andamento", tom: "alerta", icone: Clock },
  planejado: { rotulo: "Planejado", tom: "neutro", icone: Sparkles },
};

export interface ModuleCardProps {
  modulo: ReactModuleManifest;
}

export function ModuleCard({ modulo }: ModuleCardProps) {
  const cfg = CONFIG_STATUS[modulo.status];
  const Icone = cfg.icone;

  return (
    <article className="flex flex-col justify-between rounded-lg border border-borda bg-grafite-800 p-4 transition-colors hover:border-slate-600">
      <div>
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="font-mono text-[11px] text-cyan-300">{modulo.camada}</span>
            <h2 className="text-base font-semibold text-slate-100">{modulo.nome}</h2>
          </div>
          <Badge tom={cfg.tom} icone={<Icone className="size-3" />}>
            {cfg.rotulo}
          </Badge>
        </div>

        <p className="mt-1 text-xs font-medium text-slate-400">Responsável: {modulo.responsavel}</p>
        <p className="mt-2 text-xs leading-relaxed text-slate-300">{modulo.descricao}</p>

        <div className="mt-3">
          <p className="text-[11px] font-medium text-slate-400">Contratos:</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {modulo.contratos.map((c) => (
              <span
                key={c}
                className="rounded border border-borda bg-navy-900 px-1.5 py-0.5 font-mono text-[11px] text-slate-300"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 border-t border-borda pt-3">
        <Link
          to={`/dev/modulo/${modulo.id}`}
          className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-md bg-acento px-3 text-xs font-semibold text-navy-950 transition-colors hover:bg-cyan-300"
        >
          Abrir sandbox
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>
    </article>
  );
}

