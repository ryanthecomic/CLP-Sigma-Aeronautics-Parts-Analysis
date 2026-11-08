import { useState } from "react";
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
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card
        titulo="Formulário de Captura de Produção"
        descricao="Reutiliza o mesmo componente AnalysisForm do Preview do Operador, com validação inline via Zod."
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

      <div className="space-y-4">
        <Card
          titulo="Regras ativas (RegrasAnaliseAero)"
          descricao="Limites que alimentam tanto o schema Zod do formulário quanto o Controlador."
        >
          <CodeBlock titulo="regras" valor={regras} alturaMax="max-h-56" />
        </Card>

        <Card
          titulo="Última carga enviada"
          descricao="Payload entregue ao motor de análise após validação do formulário."
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

