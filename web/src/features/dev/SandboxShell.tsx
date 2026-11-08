import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { PageHeader } from "../../components/layout/PageHeader";
import { Badge } from "../../components/ui/Badge";
import type { ReactModuleManifest } from "../../modules/types";

export interface SandboxShellProps {
  manifest: ReactModuleManifest;
  children: ReactNode;
}

export function SandboxShell({ manifest, children }: SandboxShellProps) {
  return (
    <div>
      <PageHeader
        titulo={`Sandbox: ${manifest.nome}`}
        descricao={manifest.descricao}
        meta={
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tom="acento">{manifest.responsavel}</Badge>
            <Badge tom="neutro">{manifest.camada}</Badge>
            {manifest.contratos.map((c) => (
              <span
                key={c}
                className="rounded border border-borda bg-navy-950 px-1.5 py-0.5 font-mono text-[11px] text-slate-300"
              >
                {c}
              </span>
            ))}
          </div>
        }
        acoes={
          <Link
            to="/dev"
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-borda bg-grafite-700 px-2.5 text-xs font-medium text-slate-100 hover:border-slate-500"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Voltar ao Hub
          </Link>
        }
      />

      {children}
    </div>
  );
}

