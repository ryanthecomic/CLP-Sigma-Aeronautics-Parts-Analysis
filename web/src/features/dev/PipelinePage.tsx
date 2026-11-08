import { ChevronDown, ChevronRight, Play } from "lucide-react";
import { useState } from "react";
import type { StatusPasso } from "../../core/types";
import { PageHeader } from "../../components/layout/PageHeader";
import { Badge } from "../../components/ui/Badge";
import type { TomBadge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { CodeBlock } from "../../components/ui/CodeBlock";
import { EmptyState } from "../../components/ui/EmptyState";
import { useAnalysis } from "../../hooks/useAnalysis";
import { usePipeline } from "../../hooks/usePipeline";

const TOM_POR_STATUS: Record<StatusPasso, TomBadge> = {
  SUCESSO: "sucesso",
  ALERTA: "alerta",
  ERRO: "perigo",
  IGNORADO: "neutro",
  EXECUTANDO: "acento",
  PENDENTE: "neutro",
};

export function PipelinePage() {
  const { passos, traceId } = usePipeline();
  const { analisar, executando } = useAnalysis();
  const [expandidoId, setExpandidoId] = useState<string | null>(null);

  const rodarAmostra = async () => {
    await analisar({
      pecaId: "P-001",
      dataLote: "2026-10-15",
      quantidade: 500,
      defeituosos: 5,
      horas: 10,
      temperatura: 205,
      pressao: 6.5,
    });
  };

  return (
    <div className="space-y-4">
      <PageHeader
        titulo="Pipeline de Execução"
        descricao="Passos da última execução: status, duração, motivo e inspeção de entrada/saída em JSON."
        meta={traceId ? <Badge tom="acento">trace: {traceId}</Badge> : undefined}
        acoes={
          <Button
            variante="primario"
            tamanho="sm"
            carregando={executando}
            onClick={rodarAmostra}
            icone={<Play className="size-3.5" />}
          >
            Executar análise de exemplo
          </Button>
        }
      />

      {passos.length === 0 ? (
        <EmptyState
          titulo="Nenhuma execução registrada nesta sessão"
          descricao="Execute uma análise no Controlador, nas Flags & Cenários, no Preview do Operador ou pelo botão acima."
        />
      ) : (
        <>
          <Card titulo={`Passos (${passos.length})`} descricao="Clique em um passo para expandir entrada e saída em JSON.">
            <ol className="space-y-2">
              {passos.map((p, idx) => {
                const aberto = expandidoId === p.id;
                return (
                  <li key={p.id} className="rounded-md border border-borda bg-navy-900/70">
                    <button
                      type="button"
                      onClick={() => setExpandidoId(aberto ? null : p.id)}
                      aria-expanded={aberto}
                      className="flex w-full flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-left text-xs hover:bg-grafite-700/40"
                    >
                      <div className="flex items-center gap-2">
                        {aberto ? (
                          <ChevronDown className="size-4 text-slate-400" />
                        ) : (
                          <ChevronRight className="size-4 text-slate-400" />
                        )}
                        <span className="font-mono text-slate-500">#{idx + 1}</span>
                        <Badge tom="neutro">{p.modulo}</Badge>
                        <span className="font-medium text-slate-100">{p.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {p.motivo && <span className="max-w-md truncate text-slate-400">{p.motivo}</span>}
                        <span className="font-mono text-slate-400">{p.duracaoMs} ms</span>
                        <Badge tom={TOM_POR_STATUS[p.status]}>{p.status}</Badge>
                      </div>
                    </button>
                    {aberto && (
                      <div className="grid grid-cols-1 gap-3 border-t border-borda p-3 md:grid-cols-2">
                        <CodeBlock
                          titulo={`Entrada (${p.id})`}
                          valor={p.entrada ?? { info: "Sem payload de entrada" }}
                          alturaMax="max-h-56"
                        />
                        <CodeBlock
                          titulo={`Saída (${p.id})`}
                          valor={p.saida ?? { motivo: p.motivo ?? "Sem payload de saída" }}
                          alturaMax="max-h-56"
                        />
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          </Card>

          <CodeBlock titulo="PipelineStep[] completo (JSON)" valor={passos} />
        </>
      )}
    </div>
  );
}

