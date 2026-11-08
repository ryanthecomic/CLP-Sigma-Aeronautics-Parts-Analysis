import { CheckCircle2, Edit3, Plus, Trash2, XCircle } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import { validarCadastroPeca, validarPeca } from "../../core/rules";
import type { PecaAeronautica } from "../../core/types";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { CodeBlock } from "../../components/ui/CodeBlock";
import { Input } from "../../components/ui/Input";
import { useRepositorio } from "../../hooks/useDados";
import { useModule } from "../../hooks/useModule";

interface FormPeca {
  id: string;
  nome: string;
  material: string;
  pesoKg: string;
  conforme: boolean;
}

const FORM_VAZIO: FormPeca = {
  id: "P-006",
  nome: "Longarina de empenagem",
  material: "Alumínio-Lítio 2099",
  pesoKg: "4.5",
  conforme: true,
};

export function ModeloSandbox() {
  const { pecas, salvarPeca, alternarConforme, removerPeca } = useRepositorio();
  const { log } = useModule("modelo");
  const [selecionadaId, setSelecionadaId] = useState<string>(pecas[0]?.id ?? "");
  const [form, setForm] = useState<FormPeca>(FORM_VAZIO);
  const [editando, setEditando] = useState(false);
  const [errosForm, setErrosForm] = useState<string[]>([]);

  const selecionada = pecas.find((p) => p.id === selecionadaId) ?? pecas[0];
  const validacaoSelecionada = selecionada ? validarPeca(selecionada) : [];

  const carregarParaEdicao = (peca: PecaAeronautica) => {
    setSelecionadaId(peca.id);
    setEditando(true);
    setErrosForm([]);
    setForm({
      id: peca.id,
      nome: peca.nome,
      material: peca.material,
      pesoKg: String(peca.pesoKg),
      conforme: peca.conforme,
    });
  };

  const iniciarNova = () => {
    const proximoNum = pecas.length + 1;
    setEditando(false);
    setErrosForm([]);
    setForm({
      ...FORM_VAZIO,
      id: `P-00${proximoNum}`,
    });
  };

  const submeter = (e: FormEvent) => {
    e.preventDefault();
    const peca: PecaAeronautica = {
      id: form.id.trim(),
      nome: form.nome.trim(),
      material: form.material.trim(),
      pesoKg: Number(form.pesoKg.replace(",", ".")),
      conforme: form.conforme,
    };
    const issues = validarCadastroPeca(peca);
    if (issues.length > 0) {
      setErrosForm(issues.map((i) => i.mensagem));
      log("WARN", `Tentativa de salvar peça inválida (${peca.id}).`, issues);
      return;
    }
    setErrosForm([]);
    salvarPeca(peca);
    setSelecionadaId(peca.id);
    setEditando(true);
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card
        titulo={`Peças cadastradas (${pecas.length})`}
        descricao="Selecione uma peça para inspecionar seu JSON, editar ou alternar conformidade."
        acoes={
          <Button variante="secundario" tamanho="sm" onClick={iniciarNova} icone={<Plus className="size-3.5" />}>
            Nova peça
          </Button>
        }
        className="lg:col-span-2"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-borda text-slate-400">
                <th className="py-2 pr-3 font-medium">ID</th>
                <th className="py-2 pr-3 font-medium">Nome</th>
                <th className="py-2 pr-3 font-medium">Material</th>
                <th className="py-2 pr-3 font-medium">Peso</th>
                <th className="py-2 pr-3 font-medium">Conformidade</th>
                <th className="py-2 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borda">
              {pecas.map((peca) => {
                const ativa = peca.id === selecionada?.id;
                return (
                  <tr
                    key={peca.id}
                    onClick={() => setSelecionadaId(peca.id)}
                    className={ativa ? "bg-cyan-500/10" : "cursor-pointer hover:bg-grafite-700/50"}
                  >
                    <td className="py-2.5 pr-3 font-mono font-medium text-slate-100">{peca.id}</td>
                    <td className="py-2.5 pr-3 text-slate-200">{peca.nome}</td>
                    <td className="py-2.5 pr-3 text-slate-400">{peca.material}</td>
                    <td className="py-2.5 pr-3 font-mono text-slate-300">{peca.pesoKg} kg</td>
                    <td className="py-2.5 pr-3">
                      {peca.conforme ? (
                        <Badge tom="sucesso" icone={<CheckCircle2 className="size-3" />}>
                          Conforme
                        </Badge>
                      ) : (
                        <Badge tom="perigo" icone={<XCircle className="size-3" />}>
                          Não conforme
                        </Badge>
                      )}
                    </td>
                    <td className="py-2.5 text-right">
                      <div className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variante="fantasma"
                          tamanho="sm"
                          onClick={() => alternarConforme(peca.id)}
                          aria-label={`Alternar conformidade de ${peca.id}`}
                        >
                          Alternar
                        </Button>
                        <Button
                          variante="fantasma"
                          tamanho="sm"
                          onClick={() => carregarParaEdicao(peca)}
                          icone={<Edit3 className="size-3.5" />}
                          aria-label={`Editar ${peca.id}`}
                        >
                          Editar
                        </Button>
                        <Button
                          variante="perigo"
                          tamanho="sm"
                          onClick={() => removerPeca(peca.id)}
                          icone={<Trash2 className="size-3.5" />}
                          aria-label={`Excluir ${peca.id}`}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card
        titulo={editando ? `Editar peça ${form.id}` : "Criar nova peça"}
        descricao="Valida cadastro com validarCadastroPeca() antes de salvar."
      >
        <form onSubmit={submeter} className="space-y-3">
          <Input
            rotulo="Código (ID)"
            value={form.id}
            onChange={(e) => setForm({ ...form, id: e.target.value })}
          />
          <Input
            rotulo="Nome da peça"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
          />
          <Input
            rotulo="Material"
            value={form.material}
            onChange={(e) => setForm({ ...form, material: e.target.value })}
          />
          <Input
            rotulo="Peso"
            type="number"
            step="0.1"
            sufixo="kg"
            value={form.pesoKg}
            onChange={(e) => setForm({ ...form, pesoKg: e.target.value })}
          />
          <label className="flex items-center gap-2 text-xs text-slate-300">
            <input
              type="checkbox"
              checked={form.conforme}
              onChange={(e) => setForm({ ...form, conforme: e.target.checked })}
              className="size-4 accent-cyan-400"
            />
            Peça conforme (apta para análise)
          </label>
          {errosForm.length > 0 && (
            <ul role="alert" className="list-disc space-y-1 pl-4 text-xs text-red-300">
              {errosForm.map((msg) => (
                <li key={msg}>{msg}</li>
              ))}
            </ul>
          )}
          <Button type="submit" variante="primario" className="w-full">
            {editando ? "Salvar alterações" : "Adicionar peça"}
          </Button>
        </form>
      </Card>

      {selecionada && (
        <Card
          titulo={`Inspeção da peça ${selecionada.id}`}
          descricao="Contrato PecaAeronautica e resultado de validarPeca(peca)."
          className="lg:col-span-3"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <CodeBlock titulo={`PecaAeronautica (${selecionada.id})`} valor={selecionada} />
            <CodeBlock
              titulo="validarPeca(peca)"
              valor={{
                aptaParaAnalise: validacaoSelecionada.length === 0,
                issues: validacaoSelecionada,
              }}
            />
          </div>
        </Card>
      )}
    </div>
  );
}

export default ModeloSandbox;

