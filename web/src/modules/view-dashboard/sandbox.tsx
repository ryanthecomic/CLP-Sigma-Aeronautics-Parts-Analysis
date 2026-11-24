import { useState } from "react";
import type { ResultadoAnalise, StatusQualidade } from "../../core/types";
import { AnalysisHistoryList, ResultCard } from "../../components/result/ResultCard";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { useAnalysis } from "../../hooks/useAnalysis";
import { useRegras, useRepositorio } from "../../hooks/useDados";

const FIXTURES_POR_STATUS: Record<StatusQualidade, ResultadoAnalise> = {
  OTIMO: {
    id: "preview-otimo",
    loteId: "L-001",
    status: "OTIMO",
    produtividade: 50,
    taxaDefeitos: 1,
    eficiencia: 100,
    conformidade: 99,
    previsaoFalhas: 2,
    recomendacao: "Lote dentro dos padrões de qualidade. Manter os parâmetros atuais de processo.",
    origem: "IA",
    confianca: 0.94,
    traceId: "trace-preview-otimo",
    passos: [],
    erros: [],
    criadoEm: "2026-10-15T12:00:00Z",
  },
  ATENCAO: {
    id: "preview-atencao",
    loteId: "L-002",
    status: "ATENCAO",
    produtividade: 40,
    taxaDefeitos: 3.5,
    eficiencia: 80,
    conformidade: 96.5,
    previsaoFalhas: 12,
    recomendacao:
      "Lote requer atenção. Inspecionar o processo de fabricação e o ferramental: a taxa de defeitos é o principal desvio.",
    origem: "FALLBACK",
    confianca: 1,
    traceId: "trace-preview-atencao",
    passos: [],
    erros: [],
    criadoEm: "2026-10-15T12:00:00Z",
  },
  CRITICO: {
    id: "preview-critico",
    loteId: "L-003",
    status: "CRITICO",
    produtividade: 30,
    taxaDefeitos: 8.5,
    eficiencia: 60,
    conformidade: 91.5,
    previsaoFalhas: 28,
    recomendacao:
      "Lote crítico: segregar as peças e abrir não conformidade. Inspecionar o processo de fabricação e o ferramental.",
    origem: "IA",
    confianca: 0.89,
    traceId: "trace-preview-critico",
    passos: [],
    erros: [],
    criadoEm: "2026-10-15T12:00:00Z",
  },
};

export function ViewDashboardSandbox() {
  const { ultimoResultado } = useAnalysis();
  const { resultados } = useRepositorio();
  const { regras } = useRegras();
  const [modoPreview, setModoPreview] = useState<StatusQualidade | "REAL">(
    ultimoResultado ? "REAL" : "OTIMO",
  );

  const resultadoExibido: ResultadoAnalise =
    modoPreview === "REAL" && ultimoResultado
      ? ultimoResultado
      : FIXTURES_POR_STATUS[modoPreview === "REAL" ? "OTIMO" : modoPreview];

  return (
    <div className="space-y-4">
      <Card
        titulo="Seletor de Estado Visual"
        descricao="alterne entre ÓTIMO, ATENÇÃO e CRÍTICO para pré-visualizar cores, ícones e alertas de qualidade."
      >
        <div className="flex flex-wrap gap-2">
          {(["OTIMO", "ATENCAO", "CRITICO"] as const).map((status) => (
            <Button
              key={status}
              variante={modoPreview === status ? "primario" : "secundario"}
              tamanho="sm"
              onClick={() => setModoPreview(status)}
            >
              Pré-visualizar {status}
            </Button>
          ))}
          {ultimoResultado && (
            <Button
              variante={modoPreview === "REAL" ? "primario" : "secundario"}
              tamanho="sm"
              onClick={() => setModoPreview("REAL")}
            >
              Última análise real ({ultimoResultado.loteId})
            </Button>
          )}
        </div>
      </Card>

      <ResultCard resultado={resultadoExibido} regras={regras} />

      <Card
        titulo="Histórico curto (últimas 5 análises)"
        descricao="Mesmo componente usado no Preview do Operador."
      >
        <AnalysisHistoryList resultados={resultados} limite={5} />
      </Card>
    </div>
  );
}

export default ViewDashboardSandbox;

