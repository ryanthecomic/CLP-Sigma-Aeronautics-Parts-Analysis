/**
 * Tratamento de erro por sandbox: usado como `errorElement` da rota
 * `/dev/modulo/:id`, mantendo a Sidebar e o TopBar funcionais caso um
 * módulo lance exceção (sem class component).
 */
import { AlertTriangle, ArrowLeft, RotateCcw } from "lucide-react";
import { Link, useNavigate, useParams, useRouteError } from "react-router";
import { emitirLog, eventBus } from "../../core/eventBus";
import { useEffect } from "react";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

export function ModuleErrorBoundary() {
  const { id } = useParams<{ id: string }>();
  const erro = useRouteError();
  const navigate = useNavigate();
  const mensagem = erro instanceof Error ? erro.message : String(erro ?? "Erro desconhecido no sandbox.");

  useEffect(() => {
    emitirLog(eventBus, "ERROR", "VIEW", `Erro no sandbox do módulo "${id ?? "?"}": ${mensagem}`);
  }, [id, mensagem]);

  return (
    <Card
      titulo={`Erro no sandbox: ${id ?? "módulo"}`}
      descricao="O restante do Modo Desenvolvedor continua funcionando normalmente."
    >
      <div role="alert" className="flex items-start gap-2.5 rounded-md border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-200">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-300" aria-hidden />
        <span className="font-mono break-all">{mensagem}</span>
      </div>
      <div className="mt-4 flex gap-2">
        <Button
          variante="primario"
          tamanho="sm"
          onClick={() => navigate(0)}
          icone={<RotateCcw className="size-3.5" aria-hidden />}
        >
          Tentar novamente
        </Button>
        <Link
          to="/dev"
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-borda bg-grafite-700 px-2.5 text-xs font-medium text-slate-100 hover:border-slate-500"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Voltar ao Hub
        </Link>
      </div>
    </Card>
  );
}

