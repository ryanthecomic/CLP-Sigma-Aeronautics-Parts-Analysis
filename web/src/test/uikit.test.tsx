import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PageHeader } from "../components/layout/PageHeader";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";

describe("UI kit base (T7.6)", () => {
  describe("Button", () => {
    it("dispara onClick ao clicar", async () => {
      const user = userEvent.setup();
      const aoClicar = vi.fn();
      render(<Button onClick={aoClicar}>Salvar</Button>);
      await user.click(screen.getByRole("button", { name: "Salvar" }));
      expect(aoClicar).toHaveBeenCalledTimes(1);
    });

    it("usa type=button por padrão (não envia formulários sem querer)", () => {
      render(<Button>Ação</Button>);
      expect(screen.getByRole("button", { name: "Ação" })).toHaveAttribute("type", "button");
    });

    it("fica desabilitado e com aria-busy quando carregando", async () => {
      const user = userEvent.setup();
      const aoClicar = vi.fn();
      render(
        <Button carregando onClick={aoClicar}>
          Analisar
        </Button>,
      );
      const botao = screen.getByRole("button", { name: "Analisar" });
      expect(botao).toBeDisabled();
      expect(botao).toHaveAttribute("aria-busy", "true");
      await user.click(botao);
      expect(aoClicar).not.toHaveBeenCalled();
    });
  });

  describe("Card", () => {
    it("renderiza título, descrição, ações e conteúdo", () => {
      render(
        <Card titulo="Título do card" descricao="Descrição do card" acoes={<button type="button">Ação</button>}>
          Conteúdo
        </Card>,
      );
      expect(screen.getByRole("heading", { name: "Título do card" })).toBeInTheDocument();
      expect(screen.getByText("Descrição do card")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Ação" })).toBeInTheDocument();
      expect(screen.getByText("Conteúdo")).toBeInTheDocument();
    });

    it("não renderiza cabeçalho quando não há título nem ações", () => {
      render(<Card>Só conteúdo</Card>);
      expect(screen.queryByRole("heading")).not.toBeInTheDocument();
      expect(screen.getByText("Só conteúdo")).toBeInTheDocument();
    });
  });

  describe("Badge", () => {
    it("exibe ícone junto com o texto (cor não é o único indicador)", () => {
      render(<Badge tom="perigo" icone={<svg data-testid="icone" aria-hidden />}>Crítico</Badge>);
      expect(screen.getByText("Crítico")).toBeInTheDocument();
      expect(screen.getByTestId("icone")).toBeInTheDocument();
    });
  });

  describe("PageHeader", () => {
    it("renderiza título, descrição e ações", () => {
      render(
        <PageHeader titulo="Página" descricao="Resumo da página" acoes={<button type="button">Exportar</button>} />,
      );
      expect(screen.getByRole("heading", { level: 1, name: "Página" })).toBeInTheDocument();
      expect(screen.getByText("Resumo da página")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Exportar" })).toBeInTheDocument();
    });
  });
});
