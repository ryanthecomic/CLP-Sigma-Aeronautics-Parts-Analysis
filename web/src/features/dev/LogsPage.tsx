import { Download, Trash2 } from "lucide-react";
import { useState } from "react";
import { MODULOS_SISTEMA, NIVEIS_LOG } from "../../core/types";
import type { ModuloSistema, NivelLog } from "../../core/types";
import { PageHeader } from "../../components/layout/PageHeader";
import { Badge } from "../../components/ui/Badge";
import type { TomBadge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { CodeBlock } from "../../components/ui/CodeBlock";
import { EmptyState } from "../../components/ui/EmptyState";
import { Select } from "../../components/ui/Select";
import { useLogs } from "../../hooks/useLogs";

const TOM_NIVEL: Record<NivelLog, TomBadge> = {
  DEBUG: "neutro",
  INFO: "info",
  WARN: "alerta",
  ERROR: "perigo",
};

export function LogsPage() {
  const [nivel, setNivel] = useState<NivelLog | "TODOS">("TODOS");
  const [modulo, setModulo] = useState<ModuloSistema | "TODOS">("TODOS");
  const [mostrarJson, setMostrarJson] = useState(false);

  const { filtrados, limpar, exportarJson } = useLogs({ nivel, modulo });

  const baixarJson = () => {
    const conteudo = exportarJson();
    try {
      const blob = new Blob([conteudo], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "aerolyze-logs.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setMostrarJson(true);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        titulo="Logs do Event Bus"
        descricao="Eventos emitidos pelos módulos e pelo pipeline, correlacionados por traceId."
        acoes={
          <div className="flex gap-2">
            <Button
              variante="secundario"
              tamanho="sm"
              onClick={() => {
                setMostrarJson((v) => !v);
                baixarJson();
              }}
              icone={<Download className="size-3.5" />}
            >
              Exportar JSON
            </Button>
            <Button
              variante="perigo"
              tamanho="sm"
              onClick={limpar}
              icone={<Trash2 className="size-3.5" />}
            >
              Limpar
            </Button>
          </div>
        }
      />

      <Card titulo="Filtros">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Select
            rotulo="Nível"
            opcoes={[
              { valor: "TODOS", rotulo: "Todos os níveis" },
              ...NIVEIS_LOG.map((n) => ({ valor: n, rotulo: n })),
            ]}
            value={nivel}
            onChange={(e) => setNivel(e.target.value as NivelLog | "TODOS")}
          />
          <Select
            rotulo="Módulo"
            opcoes={[
              { valor: "TODOS", rotulo: "Todos os módulos" },
              ...MODULOS_SISTEMA.map((m) => ({ valor: m, rotulo: m })),
            ]}
            value={modulo}
            onChange={(e) => setModulo(e.target.value as ModuloSistema | "TODOS")}
          />
        </div>
      </Card>

      {mostrarJson && <CodeBlock titulo="Exportação JSON dos logs filtrados" valor={filtrados} />}

      {filtrados.length === 0 ? (
        <EmptyState
          titulo="Nenhum evento de log para os filtros selecionados"
          descricao="Interaja com um sandbox ou execute uma análise para gerar eventos no event bus."
        />
      ) : (
        <Card titulo={`Eventos (${filtrados.length})`}>
          <ul className="divide-y divide-borda">
            {[...filtrados].reverse().map((l) => (
              <li key={l.id} className="py-2.5 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge tom={TOM_NIVEL[l.nivel]}>{l.nivel}</Badge>
                    <Badge tom="neutro">{l.modulo}</Badge>
                    <span className="text-slate-100">{l.mensagem}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
                    {l.traceId && <span>{l.traceId}</span>}
                    <span>{new Date(l.timestamp).toLocaleTimeString("pt-BR")}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

