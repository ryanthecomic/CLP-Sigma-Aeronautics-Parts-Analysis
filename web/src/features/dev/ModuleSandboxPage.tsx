import { Suspense } from "react";
import { Link, useParams } from "react-router";
import { EmptyState } from "../../components/ui/EmptyState";
import { encontrarModulo } from "../../modules/registry";
import { SandboxShell } from "./SandboxShell";

export function ModuleSandboxPage() {
  const { id } = useParams<{ id: string }>();
  const manifest = encontrarModulo(id);

  if (!manifest) {
    return (
      <EmptyState
        titulo={`Módulo "${id ?? ""}" não encontrado`}
        descricao="Verifique o id em src/modules/registry.ts ou volte para o Hub."
        acao={
          <Link
            to="/dev"
            className="inline-flex h-8 items-center rounded-md bg-acento px-3 text-xs font-semibold text-navy-950"
          >
            Ir para o Hub
          </Link>
        }
      />
    );
  }

  const SandboxComponent = manifest.sandbox;

  return (
    <SandboxShell manifest={manifest}>
      <Suspense
        fallback={
          <div className="rounded-lg border border-borda bg-grafite-800 p-8 text-center text-xs text-slate-400">
            Carregando sandbox de {manifest.nome}...
          </div>
        }
      >
        <SandboxComponent />
      </Suspense>
    </SandboxShell>
  );
}

