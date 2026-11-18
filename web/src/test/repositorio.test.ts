import { describe, expect, it, vi } from "vitest";
import { montarConfig, paraToml } from "../core/config";
import {
  CHAVE_STORAGE,
  criarRepositorioLocal,
  criarStorageMemoria,
  obterStorageNavegador,
  type StorageLike,
} from "../core/repository";
import { REGRAS_PADRAO } from "../core/rules";
import { criarSeed, FLAGS_PADRAO, LOTES_SEED, PECAS_SEED } from "../core/seed";
import type { DadosProducaoAero, PecaAeronautica, ResultadoAnalise } from "../core/types";

const RESULTADO_EXEMPLO: ResultadoAnalise = {
  id: "RES-500",
  loteId: "L-001",
  status: "OTIMO",
  origem: "IA",
  confianca: 0.94,
  produtividade: 50,
  taxaDefeitos: 1,
  eficiencia: 100,
  conformidade: 99,
  previsaoFalhas: 2,
  recomendacao: "Operação nominal; manter regime atual.",
  traceId: "tr-500",
  passos: [],
  erros: [],
  criadoEm: "2026-10-15T12:00:00.000Z",
};

describe("Membro 5 — contrato do Repositório, Seed e Configuração", () => {
  describe("T5.1 — chave versionada e abstração StorageLike", () => {
    it("usa a chave versionada aerolyze-lab:v1 por padrão", () => {
      const repo = criarRepositorioLocal(criarStorageMemoria());
      expect(CHAVE_STORAGE).toBe("aerolyze-lab:v1");
      expect(repo.chave).toBe("aerolyze-lab:v1");
    });

    it("mantém o estado em memória se o storage lançar erro de quota no setItem", () => {
      const storageComFalhaQuota: StorageLike = {
        getItem: () => null,
        setItem: () => {
          throw new Error("QuotaExceededError");
        },
        removeItem: () => undefined,
      };

      const repo = criarRepositorioLocal(storageComFalhaQuota);
      expect(() => repo.carregar()).not.toThrow();
      expect(() => repo.registrarResultado(RESULTADO_EXEMPLO)).not.toThrow();
      expect(repo.listarResultados()).toHaveLength(1);
    });

    it("faz fallback para storage em memória quando localStorage está indisponível", () => {
      const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
        throw new Error("SecurityError");
      });

      const storage = obterStorageNavegador();
      storage.setItem("chave-teste", "valor-teste");
      expect(storage.getItem("chave-teste")).toBe("valor-teste");

      spy.mockRestore();
    });
  });

  describe("T5.2 — seed determinístico com 5 peças e 6 lotes", () => {
    it("expõe exatamente 5 peças e 6 lotes imutáveis", () => {
      expect(PECAS_SEED).toHaveLength(5);
      expect(LOTES_SEED).toHaveLength(6);
      expect(Object.isFrozen(PECAS_SEED)).toBe(true);
      expect(Object.isFrozen(LOTES_SEED)).toBe(true);
      expect(Object.isFrozen(FLAGS_PADRAO)).toBe(true);
      expect(PECAS_SEED.find((p) => p.id === "P-005")?.conforme).toBe(false);
    });

    it("criarSeed retorna cópias profundas independentes a cada chamada", () => {
      const seedA = criarSeed();
      const seedB = criarSeed();

      expect(seedA).toEqual(seedB);
      seedA.pecas[0].nome = "Alterada";
      seedA.lotes[0].quantidade = 9999;

      expect(seedB.pecas[0].nome).toBe("Suporte do trem de pouso");
      expect(seedB.lotes[0].quantidade).toBe(400);
    });
  });

  describe("T5.3 — operações CRUD, isolamento de referências e reset", () => {
    it("busca peças e lotes existentes (incluindo trim) e retorna undefined para inexistentes", () => {
      const repo = criarRepositorioLocal(criarStorageMemoria());
      repo.carregar();

      const peca = repo.buscarPeca(" P-001 ");
      expect(peca?.nome).toBe("Suporte do trem de pouso");
      expect(repo.buscarPeca("P-999")).toBeUndefined();

      const lote = repo.buscarLote("L-001");
      expect(lote?.pecaId).toBe("P-001");
      expect(repo.buscarLote("L-999")).toBeUndefined();

      // Mutar o objeto retornado não deve afetar o repositório
      peca!.nome = "Mutação externa";
      expect(repo.buscarPeca("P-001")?.nome).toBe("Suporte do trem de pouso");
    });

    it("salva novas peças e atualiza peças existentes mantendo persistência", () => {
      const storage = criarStorageMemoria();
      const repo = criarRepositorioLocal(storage);
      repo.carregar();

      const novaPeca: PecaAeronautica = {
        id: "P-006",
        nome: "Longarina central",
        material: "Titânio Ti-6Al-4V",
        pesoKg: 14.2,
        conforme: true,
      };
      repo.salvarPeca(novaPeca);
      expect(repo.buscarPeca("P-006")?.nome).toBe("Longarina central");

      repo.salvarPeca({ ...novaPeca, conforme: false, nome: "Longarina revisada" });
      expect(repo.snapshot().pecas).toHaveLength(6);
      expect(repo.buscarPeca("P-006")?.conforme).toBe(false);
      expect(repo.buscarPeca("P-006")?.nome).toBe("Longarina revisada");
    });

    it("registra e atualiza lotes em isolamento", () => {
      const repo = criarRepositorioLocal(criarStorageMemoria());
      repo.carregar();

      const novoLote: DadosProducaoAero = {
        id: "L-007",
        pecaId: "P-001",
        dataLote: "2026-10-25",
        quantidade: 600,
        defeituosos: 6,
        horas: 12,
        temperatura: 210,
        pressao: 6.2,
      };
      repo.registrarLote(novoLote);
      expect(repo.buscarLote("L-007")?.quantidade).toBe(600);

      repo.registrarLote({ ...novoLote, quantidade: 650 });
      expect(repo.buscarLote("L-007")?.quantidade).toBe(650);
    });

    it("registra e lista resultados mantendo o mais recente no topo", () => {
      const repo = criarRepositorioLocal(criarStorageMemoria());
      repo.carregar();

      repo.registrarResultado(RESULTADO_EXEMPLO);
      expect(repo.listarResultados()).toHaveLength(1);
      expect(repo.listarResultados()[0].id).toBe("RES-500");

      // Substitui resultado de mesmo ID mantendo no topo
      repo.registrarResultado({ ...RESULTADO_EXEMPLO, recomendacao: "Atualizada" });
      expect(repo.listarResultados()).toHaveLength(1);
      expect(repo.listarResultados()[0].recomendacao).toBe("Atualizada");
    });

    it("remove itens individualmente por coleção (pecas, lotes e resultados)", () => {
      const repo = criarRepositorioLocal(criarStorageMemoria());
      repo.carregar();
      repo.registrarResultado(RESULTADO_EXEMPLO);

      repo.remover("pecas", "P-001");
      repo.remover("lotes", "L-001");
      repo.remover("resultados", "RES-500");

      expect(repo.buscarPeca("P-001")).toBeUndefined();
      expect(repo.buscarLote("L-001")).toBeUndefined();
      expect(repo.listarResultados()).toHaveLength(0);
    });

    it("dois resets consecutivos produzem exatamente as mesmas 5 peças e 6 lotes", () => {
      const repo = criarRepositorioLocal(criarStorageMemoria());
      repo.carregar();

      repo.remover("pecas", "P-001");
      repo.remover("lotes", "L-001");
      repo.registrarResultado(RESULTADO_EXEMPLO);

      const primeiroReset = repo.reset();
      const segundoReset = repo.reset();

      expect(primeiroReset.pecas).toHaveLength(5);
      expect(primeiroReset.lotes).toHaveLength(6);
      expect(primeiroReset.resultados).toHaveLength(0);
      expect(segundoReset).toEqual(primeiroReset);
    });

    it("resultado registrado sobrevive a recarregar a aplicação e mantém regras/flags", () => {
      const storage = criarStorageMemoria();
      const repo1 = criarRepositorioLocal(storage);
      repo1.carregar();

      repo1.registrarResultado(RESULTADO_EXEMPLO);
      repo1.atualizarRegras({ ...REGRAS_PADRAO, temperaturaMax: 245 });
      repo1.atualizarFlags({ ...FLAGS_PADRAO, validacaoEstrita: true });

      const repo2 = criarRepositorioLocal(storage);
      const { dados, aviso } = repo2.carregar();
      expect(aviso).toBeUndefined();
      expect(dados.resultados).toHaveLength(1);
      expect(dados.resultados[0]).toEqual(RESULTADO_EXEMPLO);
      expect(repo2.listarResultados()[0].id).toBe("RES-500");
      expect(dados.regras.temperaturaMax).toBe(245);
      expect(dados.flags.validacaoEstrita).toBe(true);
    });
  });

  describe("T5.4 — tratamento de JSON corrompido, versão incompatível e schema inválido", () => {
    it("recupera JSON malformado restaurando o seed com aviso claro", () => {
      const storage = criarStorageMemoria({
        [CHAVE_STORAGE]: "{json_corrompido: true",
      });
      const repo = criarRepositorioLocal(storage);
      const { dados, aviso } = repo.carregar();

      expect(aviso).toMatch(/corrompidos/i);
      expect(dados.pecas).toHaveLength(5);
      expect(dados.lotes).toHaveLength(6);
      // Garante que o storage foi sobrescrito com o seed válido
      expect(() => JSON.parse(storage.getItem(CHAVE_STORAGE)!)).not.toThrow();
    });

    it("recupera versão de schema incompatível restaurando o seed", () => {
      const storage = criarStorageMemoria({
        [CHAVE_STORAGE]: JSON.stringify({ versao: 99, pecas: [], lotes: [] }),
      });
      const repo = criarRepositorioLocal(storage);
      const { dados, aviso } = repo.carregar();

      expect(aviso).toMatch(/Versão de dados incompatível \(99\)/i);
      expect(dados.versao).toBe(1);
      expect(dados.pecas).toHaveLength(5);
    });

    it("recupera estrutura em formato inválido (Zod safeParse) restaurando o seed", () => {
      const storage = criarStorageMemoria({
        [CHAVE_STORAGE]: JSON.stringify({ versao: 1, pecas: "invalido" }),
      });
      const repo = criarRepositorioLocal(storage);
      const { dados, aviso } = repo.carregar();

      expect(aviso).toMatch(/formato inválido/i);
      expect(dados.pecas).toHaveLength(5);
    });
  });

  describe("Prévia config.toml (src/core/config.ts)", () => {
    it("serializa regras, flags e chave do repositório no formato TOML", () => {
      const config = montarConfig(REGRAS_PADRAO, FLAGS_PADRAO);
      const toml = paraToml(config);

      expect(toml).toContain("[app]");
      expect(toml).toContain(`chave_storage = "${CHAVE_STORAGE}"`);
      expect(toml).toContain("[regras]");
      expect(toml).toContain("[ia]");
      expect(toml).toContain("[dev]");
    });
  });
});
