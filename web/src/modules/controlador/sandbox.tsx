import { CheckCircle2, Play, ShieldAlert, XCircle } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import { validarEntrada } from "../../core/pipeline";
import type { AnaliseInput } from "../../core/types";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { useAnalysis } from "../../hooks/useAnalysis";
import { useRegras, useRepositorio } from "../../hooks/useDados";
import { useFlags } from "../../hooks/useFlags";
import { usePipeline } from "../../hooks/usePipeline";

export function ControladorSandbox() {
  const { pecas } = useRepositorio();
  const { regras } = useRegras();
  const { flags } = useFlags();
  const { analisar, executando } = useAnalysis();
  const { passos, traceId } = usePipeline();

  const [pecaId, setPecaId] = useState(pecas[0]?.id ?? "P-001");
  const [dataLote, setDataLote] = useState("2026-10-15");
  const [temperatura, setTemperatura] = useState("205");
  const [pressao, setPressao] = useState("6.5");
  const [quantidade, setQuantidade] = useState("500");
  const [defeituosos, setDefeituosos] = useState("5");
  const [horas, setHoras] = useState("10");

  const numeroDoCampo = (valor: string): number =>
    valor.trim() === "" ? Number.NaN : Number(valor.replace(",", "."));

  const inputAtual: AnaliseInput = {
    pecaId,
    dataLote,
    temperatura: numeroDoCampo(temperatura),
    pressao: numeroDoCampo(pressao),
    quantidade: numeroDoCampo(quantidade),
    defeituosos: numeroDoCampo(defeituosos),
    horas: numeroDoCampo(horas),
  };

  const pecaSelecionada = pecas.find((p) => p.id === pecaId);
  const validacao = validarEntrada(inputAtual, {
    regras,
    peca: pecaSelecionada,
    estrita: flags.validacaoEstrita,
    agora: new Date("2026-11-08T12:00:00Z"),
  });

  const executar = async (e: FormEvent) => {
    e.preventDefault();
    await analisar(inputAtual);
  };

  const carregarInvalido = () => {
    setTemperatura("280");
    setDefeituosos("600");
  };

  const carregarValido = () => {
    setPecaId("P-001");
    setTemperatura("205");
    setPressao("6.5");
    setQuantidade("500");
    setDefeituosos("5");
    setHoras("10");
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card
        titulo="Parâmetros de entrada para o Controlador"
        descricao="Princípio: validar primeiro, analisar depois. Ao clicar em Executar validação, o pipeline global, os logs e o estado são atualizados."
        acoes={
          <div className="flex gap-1.5">
            <Button variante="fantasma" tamanho="sm" onClick={carregarValido}>
              Preset válido
            </Button>
            <Button
              variante="secundario"
              tamanho="sm"
              onClick={carregarInvalido}
              icone={<ShieldAlert className="size-3.5" />}
            >
              Preset inválido
            </Button>
          </div>
        }
      >
        <form onSubmit={executar} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select
              rotulo="Peça"
              opcoes={pecas.map((p) => ({
                valor: p.id,
                rotulo: `${p.id} — ${p.nome}${p.conforme ? "" : " (não conforme)"}`,
              }))}
              value={pecaId}
              onChange={(e) => setPecaId(e.target.value)}
            />
            <Input
              rotulo="Data do lote"
              type="date"
              value={dataLote}
              onChange={(e) => setDataLote(e.target.value)}
            />
            <Input
              rotulo="Temperatura"
              type="number"
              sufixo="°C"
              dica={`${regras.temperaturaMin} a ${regras.temperaturaMax} °C`}
              value={temperatura}
              onChange={(e) => setTemperatura(e.target.value)}
            />
            <Input
              rotulo="Pressão"
              type="number"
              step="0.5"
              sufixo="bar"
              dica={`${regras.pressaoMin} a ${regras.pressaoMax} bar`}
              value={pressao}
              onChange={(e) => setPressao(e.target.value)}
            />
            <Input
              rotulo="Quantidade"
              type="number"
              sufixo="pç"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
            />
            <Input
              rotulo="Defeituosos"
              type="number"
              sufixo="pç"
              value={defeituosos}
              onChange={(e) => setDefeituosos(e.target.value)}
            />
            <Input
              rotulo="Horas"
              type="number"
              step="0.5"
              sufixo="h"
              value={horas}
              onChange={(e) => setHoras(e.target.value)}
            />
          </div>
          <Button
            type="submit"
            variante="primario"
            carregando={executando}
            icone={<Play className="size-4" />}
          >
            Executar validação
          </Button>
        </form>
      </Card>

      <Card
        titulo="Guard clauses"
        descricao="Avaliação local imediata. Se qualquer guard reprovar, a IA não é chamada."
        acoes={
          validacao.valido ? (
            <Badge tom="sucesso" icone={<CheckCircle2 className="size-3.5" />}>
              Todas aprovadas
            </Badge>
          ) : (
            <Badge tom="perigo" icone={<XCircle className="size-3.5" />}>
              {validacao.erros.length} reprovação(ões)
            </Badge>
          )
        }
      >
        <ul className="space-y-2">
          {validacao.guardas.map((g) => (
            <li
              key={g.id}
              className="rounded-md border border-borda bg-navy-900/70 px-3 py-2 text-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-slate-200">{g.label}</span>
                {g.aprovado ? (
                  <Badge tom="sucesso" icone={<CheckCircle2 className="size-3" />}>
                    Aprovada
                  </Badge>
                ) : (
                  <Badge tom="perigo" icone={<XCircle className="size-3" />}>
                    Reprovada
                  </Badge>
                )}
              </div>
              {!g.aprovado && (
                <ul className="mt-1.5 space-y-0.5 text-red-300">
                  {g.issues.map((issue) => (
                    <li key={issue.codigo}>
                      <span className="font-mono">[{issue.codigo}]</span> {issue.mensagem}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </Card>

      <Card
        titulo="Pipeline global atualizado"
        descricao={traceId ? `Última execução: ${traceId}` : "Execute a validação para popular o pipeline global."}
        className="lg:col-span-2"
      >
        {passos.length === 0 ? (
          <p className="text-xs text-slate-400">Nenhum passo registrado ainda.</p>
        ) : (
          <ol className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {passos.map((p) => (
              <li key={p.id} className="rounded-md border border-borda bg-navy-900/70 p-2.5 text-xs">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-mono text-[11px] text-slate-400">{p.modulo}</span>
                  <Badge
                    tom={
                      p.status === "SUCESSO"
                        ? "sucesso"
                        : p.status === "ERRO"
                          ? "perigo"
                          : p.status === "ALERTA"
                            ? "alerta"
                            : "neutro"
                    }
                  >
                    {p.status}
                  </Badge>
                </div>
                <p className="mt-1 font-medium text-slate-200">{p.label}</p>
                <p className="mt-0.5 font-mono text-[11px] text-slate-500">{p.duracaoMs} ms</p>
                {p.motivo && <p className="mt-1 text-[11px] text-slate-400">{p.motivo}</p>}
              </li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  );
}

export default ControladorSandbox;

