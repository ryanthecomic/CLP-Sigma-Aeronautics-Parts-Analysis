import { Database, RotateCcw, Trash2 } from "lucide-react";
import { StatusBadge } from "../../components/result/ResultCard";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { useRepositorio } from "../../hooks/useDados";

export function RepositorioSandbox() {
  const { pecas, lotes, resultados, removerLote, removerResultado, resetarDados, chave } = useRepositorio();

  return (
    <div className="space-y-4">
      <Card
        titulo="Configuração de Persistência"
        descricao="Apenas o Repositório acessa o localStorage. Se o JSON for corrompido, o seed é restaurado com segurança."
        acoes={
          <Button
            variante="secundario"
            tamanho="sm"
            onClick={resetarDados}
            icone={<RotateCcw className="size-3.5" />}
          >
            Resetar para o seed
          </Button>
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
                          onClick={() => removerLote(l.id)}
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
                          onClick={() => removerResultado(r.id)}
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

