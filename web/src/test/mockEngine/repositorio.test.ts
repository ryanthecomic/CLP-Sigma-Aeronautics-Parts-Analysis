import { describe, expect, it } from "vitest";
import { criarRepositorioLocal, criarStorageMemoria } from "../../core/repository";

describe("Membro 5 — Repositório local e recuperação de JSON corrompido", () => {
  it("carrega o seed determinístico (5 peças e 6 lotes) e recupera JSON corrompido", () => {
    const storage = criarStorageMemoria({ "aerolyze-lab:v1": "{json-quebrado" });
    const repo = criarRepositorioLocal(storage);
    const carga = repo.carregar();
    expect(carga.aviso).toBeDefined();
    expect(carga.dados.pecas).toHaveLength(5);
    expect(carga.dados.lotes).toHaveLength(6);
  });
});
