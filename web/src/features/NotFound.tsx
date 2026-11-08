import { Link } from "react-router";
import { EmptyState } from "../components/ui/EmptyState";

export function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-900 p-6">
      <EmptyState
        titulo="404 — Página não encontrada"
        descricao="A rota solicitada não existe no Aerolyze Lab."
        acao={
          <Link
            to="/dev"
            className="inline-flex h-9 items-center rounded-md bg-acento px-4 text-xs font-semibold text-navy-950"
          >
            Voltar ao Modo Desenvolvedor
          </Link>
        }
      />
    </div>
  );
}

