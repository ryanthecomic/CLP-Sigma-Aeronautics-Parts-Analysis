import { useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { AnalysisHistoryList, ResultCard } from "../components/result/ResultCard";
import type { ResultadoAnalise } from "../core/types";

const resultado: ResultadoAnalise = {
  id: "analise-1", loteId: "lote-1", status: "OTIMO", origem: "IA",
  confianca: 0.9, traceId: "trace-1", passos: [], erros: [],
  produtividade: 50, taxaDefeitos: 1, eficiencia: 99, conformidade: 99,
  previsaoFalhas: 1, recomendacao: "Manter os parâmetros.",
  criadoEm: new Date(2026, 10, 23, 14, 35).toISOString(),
};

describe("Data e hora das análises", () => {
  it("mostra a data registrada em português, no horário local, com marcação semântica", () => {
    render(<ResultCard resultado={resultado} />);
    const data = screen.getByText("Análise realizada em 23/11/2026 às 14:35");
    expect(data.tagName).toBe("TIME");
    expect(data).toHaveAttribute("datetime", resultado.criadoEm);
  });

  it.each(["", "data-inválida"])("trata data ausente ou inválida (%s) no resultado e histórico", (criadoEm) => {
    const registro = { ...resultado, criadoEm };
    const { container } = render(<><ResultCard resultado={registro} /><AnalysisHistoryList resultados={[registro]} /></>);
    expect(screen.getAllByText("Data e hora indisponíveis")).toHaveLength(2);
    expect(container.querySelector("time")).toBeNull();
  });

  it("mantém as datas de cada registro e atualiza o resultado ao selecionar o histórico", async () => {
    const anterior = { ...resultado, id: "analise-2", loteId: "lote-2", criadoEm: new Date(2026, 10, 22, 9, 5).toISOString() };
    function Historico() {
      const [selecionado, selecionar] = useState(resultado);
      return <><ResultCard resultado={selecionado} /><AnalysisHistoryList resultados={[resultado, anterior]} onSelecionar={selecionar} selecionadoId={selecionado.id} /></>;
    }
    const user = userEvent.setup();
    render(<Historico />);
    const registro = screen.getByRole("button", { name: /lote-2/ });
    expect(within(registro).getByText("Análise realizada em 22/11/2026 às 09:05")).toBeInTheDocument();
    await user.click(registro);
    expect(screen.getAllByText("Análise realizada em 22/11/2026 às 09:05")).toHaveLength(2);
    expect(screen.getAllByText("Análise realizada em 23/11/2026 às 14:35")).toHaveLength(1);
  });
});
