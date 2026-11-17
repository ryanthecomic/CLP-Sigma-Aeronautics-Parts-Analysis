import { useState } from "react";
import { Code2, Database, RotateCcw, Trash2 } from "lucide-react";
import { StatusBadge } from "../../components/result/ResultCard";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { CodeBlock } from "../../components/ui/CodeBlock";
import { EmptyState } from "../../components/ui/EmptyState";
import { useRepositorio, useRegras } from "../../hooks/useDados";
import { useFlags } from "../../hooks/useFlags";
import { useModule } from "../../hooks/useModule";

export function RepositorioSandbox() {
  const { pecas, lotes, resultados, removerLote, removerResultado, resetarDados, chave } = useRepositorio();
  const { regras } = useRegras();
  const { flags } = useFlags();
  const { log } = useModule("repositorio");
  const [mostrarSnapshot, setMostrarSnapshot] = useState(false);

  const handleRemoverLote = (id: string) => {
    removerLote(id);
    log("WARN", `Lote ${id} removido do Repositório local.`, { loteId: id, chave });
  };

  const handleRemoverResultado = (id: string) => {
    removerResultado(id);
    log("WARN", `Resultado ${id} removido do Repositório local.`, { resultadoId: id, chave });
  };

  const handleReset = () => {
    resetarDados();
    log("INFO", "Repositório resetado para o seed determinístico (5 peças e 6 lotes).", { chave });
  };

  const snapshotJson = JSON.stringify(
    { versao: 1, chave, pecas, lotes, resultados, regras, flags },
    null,
    2,
  );

  return (
    <div className="space-y-4">
      <Card
        titulo="Configuração de Persistência"
        descricao="Apenas o Repositório acessa o localStorage. Se o JSON for corrompido, o seed é restaurado com segurança."
        acoes={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variante="fantasma"
              tamanho="sm"
              onClick={() => setMostrarSnapshot((atual) => !atual)}
              icone={<Code2 className="size-3.5" />}
            >
              {mostrarSnapshot ? "Ocultar JSON" : "Inspecionar JSON"}
            </Button>
            <Button
              variante="secundario"
              tamanho="sm"
              onClick={handleReset}
              icone={<RotateCcw className="size-3.5" />}
            >
              Resetar para o seed
            </Button>
          </div>
        }
      >
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <Badge tom="acento" icone={<Database className="size-3.5" />}>
            Chave localStorage: <span className="font-mono">{chave}</span>
          </Badge>
          <Badge tom="neutro">{pecas.length} peças</Badge>
          <Badge tom="neutro">{lotes.length} lotes</Badge>
          <Badge tom="neutro">{resultados.length} resultados</Badge>
        </div>
        {mostrarSnapshot ? (
          <div className="mt-3">
            <CodeBlock
              titulo={`Payload persistido (${chave})`}
              valor={snapshotJson}
              linguagem="json"
            />
          </div>
        ) : null}
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card titulo={`Lotes salvos (${lotes.length})`} descricao="Tabela de DadosProducaoAero persistidos.">
          {lotes.length === 0 ? (
            <EmptyState titulo="Nenhum lote salvo" descricao="Restaure o seed ou execute uma análise." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-borda text-slate-400">
                    <th className="py-2 pr-2 font-medium">Lote</th>
                    <th className="py-2 pr-2 font-medium">Peça</th>
                    <th className="py-2 pr-2 font-medium">Data</th>
                    <th className="py-2 pr-2 font-medium">Qtd / Def</th>
                    <th className="py-2 pr-2 font-medium">T / P</th>
                    <th className="py-2 text-right font-medium">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borda">
                  {lotes.map((l) => (
                    <tr key={l.id}>
                      <td className="py-2 pr-2 font-mono font-medium text-slate-100">{l.id}</td>
                      <td className="py-2 pr-2 font-mono text-slate-300">{l.pecaId}</td>
                      <td className="py-2 pr-2 text-slate-400">{l.dataLote}</td>
                      <td className="py-2 pr-2 font-mono text-slate-300">
                        {l.quantidade} / {l.defeituosos}
                      </td>
                      <td className="py-2 pr-2 font-mono text-slate-400">
                        {l.temperatura}°C · {l.pressao}bar
                      </td>
                      <td className="py-2 text-right">
                        <Button
                          variante="perigo"
                          tamanho="sm"
                          onClick={() => handleRemoverLote(l.id)}
                          icone={<Trash2 className="size-3.5" />}
                          aria-label={`Excluir lote ${l.id}`}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card titulo={`Resultados salvos (${resultados.length})`} descricao="Tabela de ResultadoAnalise persistidos.">
          {resultados.length === 0 ? (
            <EmptyState
              titulo="Nenhum resultado salvo ainda"
              descricao="Execute uma análise no Controlador ou no Preview do Operador para registrar resultados."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-borda text-slate-400">
                    <th className="py-2 pr-2 font-medium">ID</th>
                    <th className="py-2 pr-2 font-medium">Lote</th>
                    <th className="py-2 pr-2 font-medium">Origem</th>
                    <th className="py-2 pr-2 font-medium">Status</th>
                    <th className="py-2 text-right font-medium">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borda">
                  {resultados.map((r) => (
                    <tr key={r.id}>
                      <td className="py-2 pr-2 font-mono text-slate-200">{r.id}</td>
                      <td className="py-2 pr-2 font-mono text-slate-300">{r.loteId}</td>
                      <td className="py-2 pr-2">
                        <Badge tom="neutro">{r.origem}</Badge>
                      </td>
                      <td className="py-2 pr-2">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="py-2 text-right">
                        <Button
                          variante="perigo"
                          tamanho="sm"
                          onClick={() => handleRemoverResultado(r.id)}
                          icone={<Trash2 className="size-3.5" />}
                          aria-label={`Excluir resultado ${r.id}`}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default RepositorioSandbox;

