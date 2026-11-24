import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it } from "vitest";
import { routes } from "../App";
import { MODULOS } from "../modules/registry";
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
    expect(MODULOS).toHaveLength(7);
    expect(new Set(MODULOS.map((modulo) => modulo.id)).size).toBe(7);
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

  it("rejeita o preset inválido no sandbox do Controlador sem chamar a IA", async () => {
    const user = userEvent.setup();
    renderRota("/dev/modulo/controlador");

    await user.click(await screen.findByRole("button", { name: /Preset inválido/i }));
    await user.click(screen.getByRole("button", { name: /Executar validação/i }));

    await waitFor(() => {
      const estado = useAppStore.getState();
      expect(estado.ultimoResultado?.origem).toBe("VALIDACAO");
      expect(estado.ultimoResultado?.status).toBe("CRITICO");
      expect(estado.ultimoResultado?.erros.length).toBeGreaterThan(0);
      expect(estado.passos.some((passo) => passo.id === "ia" && passo.status === "IGNORADO")).toBe(true);
      expect(estado.traceAtual).toBe(estado.ultimoResultado?.traceId);
    });
  });

  it("executa uma análise completa no Preview do Operador e bloqueia dados inválidos no formulário", async () => {
    const user = userEvent.setup();
    renderRota("/operador");

    expect(await screen.findByRole("heading", { name: "Qualidade em cada lote" })).toBeInTheDocument();

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

  it("abre as rotas globais do Modo Desenvolvedor", async () => {
    const paginas = [
      ["/dev/pipeline", "Pipeline de Execução"],
      ["/dev/estado", "Estado & Contratos"],
      ["/dev/logs", "Logs do Event Bus"],
      ["/dev/flags", "Flags & Cenários"],
      ["/dev/docs", "Documentação da Equipe Sigma"],
    ] as const;

    for (const [rota, titulo] of paginas) {
      const { unmount } = renderRota(rota);
      expect(await screen.findByRole("heading", { name: titulo })).toBeInTheDocument();
      unmount();
    }
  });

  it("exibe estado vazio para o id de módulo desconhecido", async () => {
    renderRota("/dev/modulo/modulo-inexistente");
    expect(await screen.findByText('Módulo "modulo-inexistente" não encontrado')).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir para o Hub" })).toHaveAttribute("href", "/dev");
  });
});
