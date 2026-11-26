import { CheckCircle2, Play, XCircle } from "lucide-react";
import { useState } from "react";
import { mockAIProvider } from "../../core/ia";
import { CENARIOS, compararCenario } from "../../core/scenarios";
import type { Cenario, ComparacaoCenario } from "../../core/scenarios";
import type { FlagsDev, ResultadoAnalise } from "../../core/types";
import { PageHeader } from "../../components/layout/PageHeader";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { useAnalysis } from "../../hooks/useAnalysis";
import { useFlags } from "../../hooks/useFlags";

const DESCRICOES_FLAGS: Array<{ chave: keyof FlagsDev; titulo: string; descricao: string }> = [
  {
    chave: "forcarFalhaIA",
    titulo: "Forçar falha da IA",
    descricao: "A IA sempre lança exceção (EXCECAO), obrigando o Controlador a acionar o fallback.",
  },
  {
    chave: "forcarFallback",
    titulo: "Forçar fallback",
    descricao: "A etapa de IA é ignorada e o algoritmo determinístico de fallback assume diretamente.",
  },
  {
    chave: "validacaoEstrita",
    titulo: "Validação estrita",
    descricao: "Adiciona guard clauses extras: data não futura e margem de segurança de 5% nos limites de T/P.",
  },
  {
    chave: "latenciaSimulada",
    titulo: "Latência simulada",
    descricao: "Adiciona latência artificial de 800 ms à etapa de inferência da IA.",
  },
];

interface ExecucaoCenario {
  resultado: ResultadoAnalise;
  comparacao: ComparacaoCenario;
}

export function FlagsPage() {
  const { flags, alternar } = useFlags();
  const { analisar, executando } = useAnalysis();
  const [execucoes, setExecucoes] = useState<Record<string, ExecucaoCenario>>({});

  const rodarCenario = async (cenario: Cenario) => {
    const resultado = await analisar(cenario.input, {
      flags: cenario.flags,
      ia: cenario.ia,
      regras: cenario.regras,
      // Os cenários oficiais comparam resultados exatos: sempre use o mock.
      provedorIA: mockAIProvider,
    });
    if (!resultado) return;
    setExecucoes((atual) => ({
      ...atual,
      [cenario.id]: {
        resultado,
        comparacao: compararCenario(cenario, resultado),
      },
    }));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Flags & Cenários"
        descricao="Toggles globais que alteram o motor mock e 4 cenários prontos com comparação esperado vs. obtido."
      />

      <Card
        titulo="Flags do Modo Desenvolvedor"
        descricao="Persistidas em localStorage e aplicadas às análises executadas nos sandboxes e no Preview do Operador."
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {DESCRICOES_FLAGS.map((f) => {
            const ativo = flags[f.chave];
            return (
              <label
                key={f.chave}
                className="flex cursor-pointer items-start justify-between gap-3 rounded-md border border-borda bg-navy-900/70 p-3"
              >
                <div>
                  <p className="text-sm font-medium text-slate-100">{f.titulo}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{f.descricao}</p>
                </div>
                <input
                  type="checkbox"
                  checked={ativo}
                  onChange={() => alternar(f.chave)}
                  aria-label={f.titulo}
                  className="mt-1 size-4 shrink-0 accent-cyan-400"
                />
              </label>
            );
          })}
        </div>
      </Card>

      <Card
        titulo="Cenários Prontos de Validação"
        descricao="Cada cenário executa o motor mock e compara o resultado esperado com o obtido."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {CENARIOS.map((c) => {
            const exec = execucoes[c.id];
            return (
              <div key={c.id} className="flex flex-col justify-between rounded-lg border border-borda bg-navy-900/70 p-4">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-slate-100">{c.nome}</h3>
                    {exec &&
                      (exec.comparacao.passou ? (
                        <Badge tom="sucesso" icone={<CheckCircle2 className="size-3.5" />}>
                          Passou
                        </Badge>
                      ) : (
                        <Badge tom="perigo" icone={<XCircle className="size-3.5" />}>
                          Divergente
                        </Badge>
                      ))}
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{c.descricao}</p>

                  <div className="mt-3 rounded border border-borda bg-navy-950 p-2.5 text-xs">
                    <p className="font-medium text-slate-300">
                      Esperado: origem <span className="font-mono text-cyan-300">{c.esperado.origem}</span> · status{" "}
                      <span className="font-mono text-cyan-300">{c.esperado.status}</span>
                      {c.esperado.codigoErro ? ` · erro ${c.esperado.codigoErro}` : ""}
                    </p>
                    {exec && (
                      <div className="mt-2 space-y-1 border-t border-borda pt-2">
                        {exec.comparacao.itens.map((item) => (
                          <div key={item.campo} className="flex items-center justify-between font-mono text-[11px]">
                            <span className="text-slate-400">{item.campo}</span>
                            <span className={item.ok ? "text-emerald-300" : "text-red-300"}>
                              esperado: {item.esperado} | obtido: {item.obtido}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-2">
                  <Button
                    variante="primario"
                    tamanho="sm"
                    carregando={executando}
                    onClick={() => rodarCenario(c)}
                    icone={<Play className="size-3.5" />}
                  >
                    Executar
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

