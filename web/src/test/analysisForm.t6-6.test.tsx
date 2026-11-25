import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AnalysisForm, VALORES_INICIAIS_FORM } from "../components/form/AnalysisForm";
import { REGRAS_PADRAO } from "../core/rules";
import { PECAS_SEED } from "../core/seed";
import type { ValoresFormularioAnalise } from "../core/schemas";

const campos = [
  ["pecaId", "Peça aeronáutica"], ["dataLote", "Data do lote"],
  ["quantidade", "Quantidade produzida"], ["defeituosos", "Peças defeituosas"],
  ["horas", "Tempo de produção"], ["temperatura", "Temperatura do processo"],
  ["pressao", "Pressão do processo"],
] as const;
function preparar(alteracoes: Partial<ValoresFormularioAnalise> = {}) {
  const onAnalisar = vi.fn();
  render(<AnalysisForm pecas={[...PECAS_SEED]} regras={REGRAS_PADRAO}
    valoresIniciais={{ ...VALORES_INICIAIS_FORM, ...alteracoes }} onAnalisar={onAnalisar} />);
  return onAnalisar;
}
function enviar() {
  fireEvent.click(screen.getByRole("button", { name: /^Analisar$/ }));
}
function conferirErro(rotulo: string) {
  const campo = screen.getByLabelText(rotulo);
  expect(campo).toHaveAttribute("aria-invalid", "true");
  const id = campo.getAttribute("aria-describedby");
  expect(id).toBeTruthy();
  expect(document.getElementById(id!)).toHaveAttribute("role", "alert");
  expect(document.getElementById(id!)).not.toBeEmptyDOMElement();
}

describe("T6.6 — obrigatórios, faixas e submit", () => {
  it.each(campos)("bloqueia %s vazio com erro associado ao campo", (campo, rotulo) => {
    const onAnalisar = preparar({ [campo]: "" });
    enviar();
    conferirErro(rotulo);
    expect(onAnalisar).not.toHaveBeenCalled();
  });
  it.each([
    ["temperatura", "Temperatura do processo", String(REGRAS_PADRAO.temperaturaMin - 1)],
    ["temperatura", "Temperatura do processo", String(REGRAS_PADRAO.temperaturaMax + 1)],
    ["pressao", "Pressão do processo", String(REGRAS_PADRAO.pressaoMin - 1)],
    ["pressao", "Pressão do processo", String(REGRAS_PADRAO.pressaoMax + 1)],
    ["quantidade", "Quantidade produzida", "0"],
    ["quantidade", "Quantidade produzida", "2.5"],
    ["defeituosos", "Peças defeituosas", "-1"],
    ["defeituosos", "Peças defeituosas", "501"],
    ["horas", "Tempo de produção", "0"],
  ] as const)("bloqueia %s fora da faixa (%s: %s)", (campo, rotulo, valor) => {
    const onAnalisar = preparar({ [campo]: valor });
    enviar();
    conferirErro(rotulo);
    expect(onAnalisar).not.toHaveBeenCalled();
  });
  it.each([
    [REGRAS_PADRAO.temperaturaMin, REGRAS_PADRAO.pressaoMin],
    [REGRAS_PADRAO.temperaturaMax, REGRAS_PADRAO.pressaoMax],
  ])("aceita extremos válidos de temperatura %s e pressão %s", (temperatura, pressao) => {
    const onAnalisar = preparar({ temperatura: String(temperatura), pressao: String(pressao) });
    enviar();
    expect(onAnalisar).toHaveBeenCalledTimes(1);
    expect(onAnalisar).toHaveBeenCalledWith({
      pecaId: VALORES_INICIAIS_FORM.pecaId, dataLote: VALORES_INICIAIS_FORM.dataLote,
      quantidade: 500, defeituosos: 5, horas: 10, temperatura, pressao,
    });
  });
  it("permite envio após corrigir temperatura inválida", async () => {
    const user = userEvent.setup();
    const onAnalisar = preparar({ temperatura: "999" });
    enviar();
    expect(onAnalisar).not.toHaveBeenCalled();
    const campo = screen.getByLabelText("Temperatura do processo");
    await user.clear(campo);
    await user.type(campo, "205");
    await user.click(screen.getByRole("button", { name: /^Analisar$/ }));
    expect(onAnalisar).toHaveBeenCalledTimes(1);
    expect(campo).not.toHaveAttribute("aria-invalid", "true");
  });
});
