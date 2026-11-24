import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ResultCard } from "../components/result/ResultCard";
import { REGRAS_PADRAO } from "../core/rules";
import type { ResultadoAnalise } from "../core/types";

function criarResultado(parcial: Partial<ResultadoAnalise> = {}): ResultadoAnalise {
  return {
    id: "r-1",
    loteId: "L-001",
    status: "OTIMO",
    produtividade: 50,
    taxaDefeitos: 1,
    eficiencia: 100,
    conformidade: 99,
    previsaoFalhas: 2,
    recomendacao: "Manter os parâmetros atuais de processo.",
    origem: "IA",
    confianca: 0.94,
    traceId: "trace-1",
    passos: [],
    erros: [],
    criadoEm: "2026-10-15T12:00:00Z",
    ...parcial,
  };
}

describe("ResultCard (T7.1)", () => {
  it("exibe status, as 5 métricas, recomendação, origem e confiança", () => {
    render(<ResultCard resultado={criarResultado()} />);

    expect(screen.getByText(/Status: Ótimo \(OTIMO\)/)).toBeInTheDocument();
    for (const rotulo of [
      "Produtividade",
      "Taxa de defeitos",
      "Eficiência",
      "Conformidade",
      "Previsão de falhas",
    ]) {
      expect(screen.getByText(rotulo)).toBeInTheDocument();
    }
    expect(screen.getByText("50 pç/h")).toBeInTheDocument();
    expect(screen.getByText("Manter os parâmetros atuais de processo.")).toBeInTheDocument();
    expect(screen.getByText("Origem: IA")).toBeInTheDocument();
    expect(screen.getByText("Confiança: 94%")).toBeInTheDocument();
  });

  it("mostra os limiares das regras padrão quando nenhuma regra é informada", () => {
    render(<ResultCard resultado={criarResultado()} />);
    expect(
      screen.getByText(`≤ ${REGRAS_PADRAO.taxaDefeitosOtimo}% ótimo · ≤ ${REGRAS_PADRAO.taxaDefeitosAtencao}% atenção`),
    ).toBeInTheDocument();
  });

  it("mostra os limiares das regras vigentes quando informadas", () => {
    render(
      <ResultCard
        resultado={criarResultado()}
        regras={{
          ...REGRAS_PADRAO,
          taxaDefeitosOtimo: 1,
          taxaDefeitosAtencao: 3,
          eficienciaOtimo: 90,
          eficienciaAtencao: 75,
        }}
      />,
    );
    expect(screen.getByText("≤ 1% ótimo · ≤ 3% atenção")).toBeInTheDocument();
    expect(screen.getByText("≥ 90% ótimo · ≥ 75% atenção")).toBeInTheDocument();
  });

  it("oculta a confiança quando o resultado foi rejeitado na validação", () => {
    render(
      <ResultCard
        resultado={criarResultado({ status: "CRITICO", origem: "VALIDACAO", confianca: 0 })}
      />,
    );
    expect(screen.getByText("Rejeitado na validação")).toBeInTheDocument();
    expect(screen.queryByText(/Confiança:/)).not.toBeInTheDocument();
  });
});
