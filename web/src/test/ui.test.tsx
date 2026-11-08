import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it } from "vitest";
import { routes } from "../App";
import { useAppStore } from "../store";

function renderRota(caminhoInicial: string) {
  const router = createMemoryRouter(routes, { initialEntries: [caminhoInicial] });
  return render(<RouterProvider router={router} />);
}

describe("Testes de componentes e integração de fluxo (React Testing Library)", () => {
  beforeEach(() => {
    useAppStore.getState().resetarDados();
    useAppStore.getState().limparLogs();
  });

  it("renderiza o Hub em /dev com os 7 módulos da Equipe Sigma", async () => {
    renderRota("/dev");
    expect(await screen.findByText("Hub de Módulos — Equipe Sigma")).toBeInTheDocument();
    expect(screen.getAllByText("Abrir sandbox")).toHaveLength(7);
    expect(screen.getByRole("heading", { name: "Cálculos & Fallback" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Sistema de IA" })).toBeInTheDocument();
  });

  it("executa validação no sandbox do Controlador e atualiza Pipeline, Logs e Estado", async () => {
    const user = userEvent.setup();
    renderRota("/dev/modulo/controlador");

    const botao = await screen.findByRole("button", { name: /Executar validação/i });
    await user.click(botao);

    await waitFor(() => {
      const estado = useAppStore.getState();
      expect(estado.passos.length).toBeGreaterThan(0);
      expect(estado.logs.length).toBeGreaterThan(0);
      expect(estado.resultados.length).toBe(1);
    });
  });

  it("executa uma análise completa no Preview do Operador e bloqueia dados inválidos no formulário", async () => {
    const user = userEvent.setup();
    renderRota("/operador");

    expect(await screen.findByText("Preview do Operador")).toBeInTheDocument();

    const botaoAnalisar = screen.getByRole("button", { name: /^Analisar$/i });
    await user.click(botaoAnalisar);

    expect(await screen.findByText(/Resultado da análise/i)).toBeInTheDocument();
    expect(useAppStore.getState().resultados.length).toBe(1);

    // Agora insere temperatura inválida e verifica erro inline sem chamar o motor
    const inputTemp = screen.getByLabelText(/Temperatura do processo/i);
    await user.clear(inputTemp);
    await user.type(inputTemp, "999");
    await user.click(botaoAnalisar);

    expect(await screen.findByText(/Temperatura deve estar entre/i)).toBeInTheDocument();
    expect(useAppStore.getState().resultados.length).toBe(1);
  });

  it("abre todos os 7 sandboxes via lazy loading sem erro", async () => {
    const ids = [
      "modelo",
      "controlador",
      "calculos",
      "ia",
      "repositorio",
      "view-entrada",
      "view-dashboard",
    ];
    for (const id of ids) {
      const { unmount } = renderRota(`/dev/modulo/${id}`);
      expect(await screen.findByText(/Sandbox:/i)).toBeInTheDocument();
      unmount();
    }
  });
});
