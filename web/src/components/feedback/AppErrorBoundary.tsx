/**
 * Tratamento global de erros: usado como `errorElement` da rota raiz do
 * React Router (sem class component). Nunca deixa a tela branca.
 */
import { AlertTriangle, RotateCcw } from "lucide-react";
import { isRouteErrorResponse, Link, useRouteError } from "react-router";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

export function AppErrorBoundary() {
  const erro = useRouteError();
  const mensagem = isRouteErrorResponse(erro)
    ? `${erro.status} — ${erro.statusText}`
    : erro instanceof Error
      ? erro.message
      : "Ocorreu um erro inesperado na aplicação.";

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-900 p-6">
      <Card
        titulo="Falha recuperável na aplicação"
        descricao="A interface interceptou um erro para evitar a tela branca."
        className="w-full max-w-lg"
      >
        <div role="alert" className="flex items-start gap-2.5 rounded-md border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-200">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-300" aria-hidden />
          <span className="font-mono break-all">{mensagem}</span>
        </div>
        <div className="mt-4 flex gap-2">
          <Button
            variante="primario"
            onClick={() => globalThis.location?.reload()}
            icone={<RotateCcw className="size-4" aria-hidden />}
          >
            Recarregar
          </Button>
          <Link
            to="/dev"
            className="inline-flex h-10 items-center rounded-md border border-borda bg-grafite-700 px-4 text-sm font-medium text-slate-100 hover:border-slate-500"
          >
            Voltar ao Hub
          </Link>
        </div>
      </Card>
    </div>
  );
}

