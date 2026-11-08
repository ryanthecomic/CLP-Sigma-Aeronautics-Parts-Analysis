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
      <main className="mx-auto w-full max-w-5xl flex-1 p-6">
        <PageHeader
          titulo="Preview do Operador"
          descricao="Visão simplificada de ponta a ponta: entrada de lote → validação → IA / fallback → resultado e histórico curto."
          meta={<Badge tom="info">Fluxo integrado</Badge>}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <Card
            titulo="Dados do Lote de Produção"
            descricao="Preencha os parâmetros e clique em Analisar."
            className="lg:col-span-2"
          >
            <AnalysisForm
              pecas={pecas}
              regras={regras}
              executando={executando}
              onAnalisar={submeter}
              onAbrirLimites={() => setModalLimites(true)}
            />
          </Card>

          <div className="space-y-4 lg:col-span-3">
            {resultadoExibido ? (
              <ResultCard resultado={resultadoExibido} />
            ) : (
              <EmptyState
                titulo="Nenhuma análise executada ainda"
                descricao="Submeta o formulário ao lado para ver o resultado de conformidade, recomendação e métricas."
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

