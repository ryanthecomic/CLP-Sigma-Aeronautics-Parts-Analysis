/**
 * T7.4 — Histórico curto com as últimas 5 análises (AnalysisHistoryList).
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AnalysisHistoryList } from "../components/result/ResultCard";
import type { ResultadoAnalise } from "../core/types";

function criarResultado(n: number, parcial: Partial<ResultadoAnalise> = {}): ResultadoAnalise {
  return {
    id: `r-${n}`,
    loteId: `L-${String(n).padStart(3, "0")}`,
    status: "OTIMO",
    produtividade: 50,
    taxaDefeitos: 1,
    eficiencia: 100,
    conformidade: 99,
    previsaoFalhas: 2,
    recomendacao: "Manter os parâmetros atuais de processo.",
    origem: "IA",
    confianca: 0.94,
    traceId: `trace-${n}`,
    passos: [],
    erros: [],
    criadoEm: "2026-10-15T12:00:00Z",
    ...parcial,
  };
}

describe("AnalysisHistoryList (T7.4)", () => {
  it("mostra mensagem quando não há análises", () => {
    render(<AnalysisHistoryList resultados={[]} />);
    expect(screen.getByText("Nenhuma análise executada nesta sessão.")).toBeInTheDocument();
  });

  it("limita a 5 itens por padrão", () => {
    const lista = [1, 2, 3, 4, 5, 6, 7].map((n) => criarResultado(n));
    render(<AnalysisHistoryList resultados={lista} />);
    expect(screen.getAllByRole("button")).toHaveLength(5);
    expect(screen.getByText("L-005")).toBeInTheDocument();
    expect(screen.queryByText("L-006")).not.toBeInTheDocument();
  });

  it("atualiza quando uma nova análise entra no topo da lista", () => {
    const antigos = [1, 2, 3, 4, 5].map((n) => criarResultado(n));
    const { rerender } = render(<AnalysisHistoryList resultados={antigos} />);
    expect(screen.queryByText("L-009")).not.toBeInTheDocument();

    rerender(<AnalysisHistoryList resultados={[criarResultado(9), ...antigos]} />);
    expect(screen.getByText("L-009")).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(5);
    expect(screen.queryByText("L-005")).not.toBeInTheDocument();
  });

  it("cada item mostra status com ícone e texto, e a origem", () => {
    render(<AnalysisHistoryList resultados={[criarResultado(1, { status: "CRITICO", origem: "FALLBACK" })]} />);
    const badge = screen.getByText(/Status: Crítico \(CRITICO\)/);
    expect(badge.querySelector("svg")).not.toBeNull();
    expect(screen.getByText("FALLBACK")).toBeInTheDocument();
  });

  it("chama onSelecionar com o resultado clicado", async () => {
    const user = userEvent.setup();
    const aoSelecionar = vi.fn();
    const r2 = criarResultado(2);
    render(<AnalysisHistoryList resultados={[criarResultado(1), r2]} onSelecionar={aoSelecionar} />);
    await user.click(screen.getByText("L-002"));
    expect(aoSelecionar).toHaveBeenCalledTimes(1);
    expect(aoSelecionar).toHaveBeenCalledWith(r2);
  });
});
