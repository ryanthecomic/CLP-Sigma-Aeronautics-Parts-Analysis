import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AnalysisForm } from "../components/form/AnalysisForm";
import { REGRAS_PADRAO } from "../core/rules";
import { PECAS_SEED } from "../core/seed";

describe("T6.1 — formulário controlado", () => {
  it("permite editar os sete campos e envia os valores atuais apenas ao analisar", async () => {
    const user = userEvent.setup();
    const onAnalisar = vi.fn();
    render(<AnalysisForm pecas={[...PECAS_SEED]} regras={REGRAS_PADRAO} onAnalisar={onAnalisar} />);

    await user.selectOptions(screen.getByLabelText("Peça aeronáutica"), PECAS_SEED[1].id);
    const data = screen.getByLabelText("Data do lote");
    await user.clear(data);
    await user.type(data, "2026-11-25");
    const campos = [
      ["Quantidade produzida", "720"],
      ["Peças defeituosas", "8"],
      ["Tempo de produção", "12"],
      ["Temperatura do processo", "210"],
      ["Pressão do processo", "7.5"],
    ] as const;
    for (const [rotulo, valor] of campos) {
      const campo = screen.getByLabelText(rotulo);
      await user.clear(campo);
      await user.type(campo, valor);
      expect(campo).toHaveValue(Number(valor));
    }
    expect(screen.getByLabelText("Peça aeronáutica")).toHaveValue(PECAS_SEED[1].id);
    expect(data).toHaveValue("2026-11-25");
    expect(onAnalisar).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /^Analisar$/ }));
    expect(onAnalisar).toHaveBeenCalledTimes(1);
    expect(onAnalisar).toHaveBeenCalledWith({
      pecaId: PECAS_SEED[1].id, dataLote: "2026-11-25", quantidade: 720,
      defeituosos: 8, horas: 12, temperatura: 210, pressao: 7.5,
    });
  });
});
