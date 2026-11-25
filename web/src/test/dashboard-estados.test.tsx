/**
 * Testes de componente do Membro 7 (View de Dashboard).
 * Cobre: T7.2 (três estados com cor, ícone e texto),
 *        T7.3 (alerta de qualidade crítico) e T7.8 (testes de componente).
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { QualityAlert, ResultCard, StatusBadge } from "../components/result/ResultCard";
import type { ResultadoAnalise, StatusQualidade } from "../core/types";

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

const ESTADOS: ReadonlyArray<{ status: StatusQualidade; texto: RegExp; borda: string }> = [
  { status: "OTIMO", texto: /Status: Ótimo \(OTIMO\)/, borda: "border-emerald-500/40" },
  { status: "ATENCAO", texto: /Status: Atenção \(ATENCAO\)/, borda: "border-amber-500/40" },
  { status: "CRITICO", texto: /Status: Crítico \(CRITICO\)/, borda: "border-red-500/50" },
];

describe("Três estados visuais (T7.2)", () => {
  it.each(ESTADOS)("StatusBadge de $status exibe texto e ícone (cor nunca é o único indicador)", ({ status, texto }) => {
    render(<StatusBadge status={status} />);
    const badge = screen.getByText(texto);
    const icone = badge.querySelector("svg");
    expect(icone).not.toBeNull();
    expect(icone).toHaveAttribute("aria-hidden", "true");
  });

  it.each(ESTADOS)("ResultCard de $status aplica a cor própria do estado", ({ status, borda }) => {
    const { container } = render(<ResultCard resultado={criarResultado({ status })} />);
    expect(container.querySelector("section")).toHaveClass(borda);
  });

  it("os três estados têm textos distintos entre si", () => {
    const textos = ESTADOS.map(({ status }) => {
      const { unmount, container } = render(<StatusBadge status={status} />);
      const conteudo = container.textContent ?? "";
      unmount();
      return conteudo;
    });
    expect(new Set(textos).size).toBe(3);
  });
});

describe("Alerta de qualidade crítico (T7.3)", () => {
  it("aparece (role=alert) quando o resultado é CRITICO", () => {
    render(<QualityAlert resultado={criarResultado({ status: "CRITICO", loteId: "L-003" })} />);
    const alerta = screen.getByRole("alert");
    expect(alerta).toHaveTextContent(/Alerta de qualidade/);
    expect(alerta).toHaveTextContent("L-003");
    expect(alerta.querySelector("svg")).not.toBeNull();
  });

  it.each(["OTIMO", "ATENCAO"] as const)("não aparece quando o resultado é %s", (status) => {
    render(<QualityAlert resultado={criarResultado({ status })} />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("mostra a recomendação e a lista de erros de validação", () => {
    render(
      <QualityAlert
        resultado={criarResultado({
          status: "CRITICO",
          recomendacao: "Segregar as peças e abrir não conformidade.",
          erros: [
            { codigo: "LOTE_QTD", campo: "quantidade", mensagem: "Quantidade inválida.", modulo: "CONTROLLER" },
          ],
        })}
      />,
    );
    const alerta = screen.getByRole("alert");
    expect(alerta).toHaveTextContent("Segregar as peças e abrir não conformidade.");
    expect(alerta).toHaveTextContent("[LOTE_QTD]");
    expect(alerta).toHaveTextContent("Quantidade inválida.");
  });

  it("não renderiza lista de erros quando não há erros", () => {
    render(<QualityAlert resultado={criarResultado({ status: "CRITICO" })} />);
    expect(screen.getByRole("alert").querySelector("ul")).toBeNull();
  });
});

describe("ResultCard nos três estados + alerta (T7.8)", () => {
  it("OTIMO: sem alerta", () => {
    render(<ResultCard resultado={criarResultado({ status: "OTIMO" })} />);
    expect(screen.getByText(/Status: Ótimo \(OTIMO\)/)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("ATENCAO: sem alerta", () => {
    render(<ResultCard resultado={criarResultado({ status: "ATENCAO" })} />);
    expect(screen.getByText(/Status: Atenção \(ATENCAO\)/)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("CRITICO: com alerta", () => {
    render(<ResultCard resultado={criarResultado({ status: "CRITICO", loteId: "L-003" })} />);
    expect(screen.getByText(/Status: Crítico \(CRITICO\)/)).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it.each(ESTADOS)("$status exibe as 5 métricas obrigatórias", ({ status }) => {
    render(<ResultCard resultado={criarResultado({ status })} />);
    for (const rotulo of ["Produtividade", "Taxa de defeitos", "Eficiência", "Conformidade", "Previsão de falhas"]) {
      expect(screen.getByText(rotulo)).toBeInTheDocument();
    }
  });
});
