import { useState } from "react";
import type { AnaliseInput, ResultadoAnalise } from "../../core/types";
import { AnalysisForm, LimitsModal } from "../../components/form/AnalysisForm";
import { PageHeader } from "../../components/layout/PageHeader";
import { TopBar } from "../../components/layout/TopBar";
import { AnalysisHistoryList, ResultCard } from "../../components/result/ResultCard";
import { Badge } from "../../components/ui/Badge";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { ToastViewport } from "../../components/ui/Toast";
import { useAnalysis } from "../../hooks/useAnalysis";
import { useRegras, useRepositorio } from "../../hooks/useDados";

export function OperatorPreview() {
  const { pecas, resultados } = useRepositorio();
  const { regras, atualizarRegras } = useRegras();
  const { analisar, executando, ultimoResultado } = useAnalysis();
  const [modalLimites, setModalLimites] = useState(false);
  const [selecionado, setSelecionado] = useState<ResultadoAnalise | null>(null);

  const resultadoExibido = selecionado ?? ultimoResultado ?? resultados[0] ?? null;

  const submeter = async (input: AnaliseInput) => {
    const res = await analisar(input);
    if (res) setSelecionado(res);
  };

  return (
    <div className="flex min-h-screen flex-col bg-navy-900 text-slate-200">
      <TopBar modo="operador" />
      <main className="mx-auto w-full max-w-screen-2xl flex-1 px-3 py-5 sm:px-5 lg:px-6">
        <PageHeader
          titulo="Qualidade em cada lote"
          descricao="Transforme os dados da produção em decisões mais seguras. Veja a qualidade do lote, identifique pontos de atenção e receba recomendações para melhorar seus resultados."
          meta={<Badge tom="info">Análise de produção</Badge>}
        />

        <div className="grid min-w-0 grid-cols-1 items-start gap-4 lg:grid-cols-2 lg:gap-5">
          <Card
            titulo="Dados do Lote de Produção"
            descricao="Informe os dados da produção e clique em Analisar."
            className="min-w-0"
          >
            <AnalysisForm
              pecas={pecas}
              regras={regras}
              executando={executando}
              onAnalisar={submeter}
              onAbrirLimites={() => setModalLimites(true)}
            />
          </Card>

          <div className="min-w-0 space-y-4">
            {resultadoExibido ? (
              <ResultCard resultado={resultadoExibido} />
            ) : (
              <EmptyState
                titulo="Nenhuma análise executada ainda"
                descricao="Preencha os dados do lote para descobrir como está a qualidade da produção e receber recomendações de melhoria."
              />
            )}

            <Card
              titulo="Últimas 5 análises"
              descricao="Clique em um registro do histórico para visualizar seus detalhes."
            >
              <AnalysisHistoryList
                resultados={resultados}
                limite={5}
                selecionadoId={resultadoExibido?.id}
                onSelecionar={setSelecionado}
              />
            </Card>
          </div>
        </div>
      </main>

      <LimitsModal
        aberto={modalLimites}
        regras={regras}
        onFechar={() => setModalLimites(false)}
        onSalvar={atualizarRegras}
      />
      <ToastViewport />
    </div>
  );
}

