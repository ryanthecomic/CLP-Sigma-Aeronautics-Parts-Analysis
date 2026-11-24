import { useState } from "react";
import aerolyzeLogo from "../../assets/aerolyze-horizontal-colorida.svg";
import type { AnaliseInput } from "../../core/types";
import { AnalysisForm, LimitsModal } from "../../components/form/AnalysisForm";
import { Card } from "../../components/ui/Card";
import { CodeBlock } from "../../components/ui/CodeBlock";
import { useAnalysis } from "../../hooks/useAnalysis";
import { useRegras, useRepositorio } from "../../hooks/useDados";

export function ViewEntradaSandbox() {
  const { pecas } = useRepositorio();
  const { regras, atualizarRegras } = useRegras();
  const { analisar, executando, ultimoResultado } = useAnalysis();
  const [modalAberto, setModalAberto] = useState(false);
  const [ultimoInput, setUltimoInput] = useState<AnaliseInput | null>(null);

  const submeter = async (input: AnaliseInput) => {
    setUltimoInput(input);
    await analisar(input);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-5 rounded-2xl border border-acento/20 bg-linear-to-br from-navy-800 to-navy-950 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div className="max-w-xl">
          <p className="mb-2 text-xs font-semibold tracking-widest text-acento uppercase">Controle de produção</p>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-100">Cada lote começa com bons dados.</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">Identifique a peça, registre a produção e confira as condições do processo antes de analisar.</p>
        </div>
        <img src={aerolyzeLogo} alt="Aerolyze" className="h-auto w-56 max-w-full shrink-0 self-start sm:self-center" />
      </header>
      <div className="grid min-w-0 grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Card
          titulo="Formulário de Captura de Produção"
          descricao="Preencha os dados do lote para iniciar a análise."
          className="min-w-0 overflow-hidden rounded-2xl"
          corpoClassName="p-4 sm:p-6"
        >
          <AnalysisForm
            pecas={pecas}
            regras={regras}
            executando={executando}
            permitirEnvioBruto
            onAnalisar={submeter}
            onAbrirLimites={() => setModalAberto(true)}
          />
        </Card>

        <aside aria-label="Inspeção dos dados de entrada" className="min-w-0 space-y-5">
          <Card
            titulo="Regras ativas (RegrasAnaliseAero)"
            className="min-w-0 overflow-hidden rounded-2xl"
            descricao="Limites que alimentam tanto o schema Zod do formulário quanto o Controlador."
          >
            <CodeBlock titulo="regras" valor={regras} alturaMax="max-h-56" />
          </Card>

          <Card
            titulo="Última carga enviada"
            className="min-w-0 overflow-hidden rounded-2xl"
            descricao="Entrada mais recente entregue ao motor, incluindo envios diretos ao Controlador."
          >
            <CodeBlock
              titulo="AnaliseInput"
              valor={
                ultimoInput ?? {
                  observacao: "Submeta o formulário ao lado para visualizar o payload.",
                  ultimoResultadoStatus: ultimoResultado?.status ?? null,
                }
              }
              alturaMax="max-h-56"
            />
          </Card>
        </aside>
      </div>

      <LimitsModal
        aberto={modalAberto}
        regras={regras}
        onFechar={() => setModalAberto(false)}
        onSalvar={atualizarRegras}
      />
    </div>
  );
}

export default ViewEntradaSandbox;

