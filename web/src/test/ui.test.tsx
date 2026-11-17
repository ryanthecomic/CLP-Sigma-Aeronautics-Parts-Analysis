import { render, screen, waitFor, within } from "@testing-library/react";
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

  it("cria, alterna conformidade e edita uma peça no sandbox do Modelo", async () => {
    const user = userEvent.setup();
    renderRota("/dev/modulo/modelo");

    expect(await screen.findByText(/Peças cadastradas/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Nova peça/i }));
    await user.click(screen.getByRole("button", { name: /Adicionar peça/i }));

    const linha = (await screen.findByText("P-006")).closest("tr");
    expect(linha).not.toBeNull();

    await user.click(
      within(linha!).getByRole("button", { name: /Alternar conformidade de P-006/i }),
    );
    expect(within(linha!).getByText(/Não conforme/i)).toBeInTheDocument();

    await user.click(within(linha!).getByRole("button", { name: /Editar P-006/i }));
    const campoNome = screen.getByLabelText(/Nome da peça/i);
    await user.clear(campoNome);
    await user.type(campoNome, "Peça editada");
    await user.click(screen.getByRole("button", { name: /Salvar alterações/i }));

    expect(await screen.findByText("Peça editada")).toBeInTheDocument();
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

  it("lista registros, exclui lote e restaura o seed no sandbox do Repositório", async () => {
    const user = userEvent.setup();
    renderRota("/dev/modulo/repositorio");

    expect(await screen.findByText(/Configuração de Persistência/i)).toBeInTheDocument();
    expect(screen.getByText("aerolyze-lab:v1")).toBeInTheDocument();
    expect(screen.getByText("L-001")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Excluir lote L-001/i }));
    expect(screen.queryByText("L-001")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Resetar para o seed/i }));
    expect(await screen.findByText("L-001")).toBeInTheDocument();
    expect(useAppStore.getState().logs.some((l) => l.modulo === "REPO")).toBe(true);
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
