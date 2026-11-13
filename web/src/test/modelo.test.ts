import { describe, expect, it, vi } from "vitest";
import { calcularMetricas } from "../core/calculations";
import { criarEventBus } from "../core/eventBus";
import { executarFallback } from "../core/fallback";
import { executarPipeline } from "../core/pipeline";
import { criarRepositorioLocal, criarStorageMemoria } from "../core/repository";
import { classificar, REGRAS_PADRAO, validarCadastroPeca, validarPeca } from "../core/rules";
import { FLAGS_PADRAO } from "../core/seed";
import type { PecaAeronautica } from "../core/types";

const PECA_BASE: PecaAeronautica = {
  id: "P-100",
  nome: "Peça de teste",
  material: "Ti-6Al-4V",
  pesoKg: 2.5,
  conforme: true,
};

describe("Membro 1 — contrato do Modelo", () => {
  describe("classificar", () => {
    it("respeita os limites de taxa de defeitos", () => {
      expect(classificar({ taxaDefeitos: 2, eficiencia: 90 }, REGRAS_PADRAO)).toBe("OTIMO");
      expect(classificar({ taxaDefeitos: 2.01, eficiencia: 90 }, REGRAS_PADRAO)).toBe("ATENCAO");
      expect(classificar({ taxaDefeitos: 5, eficiencia: 90 }, REGRAS_PADRAO)).toBe("ATENCAO");
      expect(classificar({ taxaDefeitos: 5.01, eficiencia: 90 }, REGRAS_PADRAO)).toBe("CRITICO");
    });

    it("respeita os limites de eficiência", () => {
      expect(classificar({ taxaDefeitos: 1, eficiencia: 85 }, REGRAS_PADRAO)).toBe("OTIMO");
      expect(classificar({ taxaDefeitos: 1, eficiencia: 84.99 }, REGRAS_PADRAO)).toBe("ATENCAO");
      expect(classificar({ taxaDefeitos: 1, eficiencia: 70 }, REGRAS_PADRAO)).toBe("ATENCAO");
      expect(classificar({ taxaDefeitos: 1, eficiencia: 69.99 }, REGRAS_PADRAO)).toBe("CRITICO");
    });

    it("usa o pior indicador entre defeitos e eficiência", () => {
      expect(classificar({ taxaDefeitos: 1, eficiencia: 60 }, REGRAS_PADRAO)).toBe("CRITICO");
      expect(classificar({ taxaDefeitos: 7, eficiencia: 95 }, REGRAS_PADRAO)).toBe("CRITICO");
      expect(classificar({ taxaDefeitos: 3, eficiencia: 80 }, REGRAS_PADRAO)).toBe("ATENCAO");
    });
  });

  describe("validarCadastroPeca", () => {
    it("aprova uma peça válida", () => {
      expect(validarCadastroPeca(PECA_BASE)).toEqual([]);
    });

    it("retorna códigos específicos para campos inválidos", () => {
      const issues = validarCadastroPeca({
        ...PECA_BASE,
        id: " ",
        nome: "",
        material: "",
        pesoKg: 0,
      });
      expect(issues.map((i) => i.codigo)).toEqual(
        expect.arrayContaining([
          "PECA_ID_OBRIGATORIO",
          "PECA_NOME_OBRIGATORIO",
          "PECA_MATERIAL_OBRIGATORIO",
          "PECA_PESO_INVALIDO",
        ]),
      );
    });

    it("não lança para entrada malformada em runtime", () => {
      const malformada = {
        id: undefined,
        nome: null,
        material: 42,
        pesoKg: Number.NaN,
        conforme: true,
      } as unknown as PecaAeronautica;

      expect(() => validarCadastroPeca(malformada)).not.toThrow();
      expect(validarCadastroPeca(malformada)).toHaveLength(4);
    });
  });

  describe("validarPeca", () => {
    it("aprova peça válida e conforme", () => {
      expect(validarPeca(PECA_BASE)).toEqual([]);
    });

    it("reprova peça não conforme com PECA_NAO_CONFORME", () => {
      const issues = validarPeca({ ...PECA_BASE, conforme: false });
      expect(issues.some((i) => i.codigo === "PECA_NAO_CONFORME")).toBe(true);
    });

    it("retorna PECA_NAO_ENCONTRADA para peça ausente sem lançar", () => {
      expect(validarPeca(undefined)).toEqual([
        expect.objectContaining({ codigo: "PECA_NAO_ENCONTRADA", modulo: "MODEL" }),
      ]);
      expect(validarPeca(null)).toEqual([
        expect.objectContaining({ codigo: "PECA_NAO_ENCONTRADA", modulo: "MODEL" }),
      ]);
    });

    it("não lança para peça malformada", () => {
      const malformada = { ...PECA_BASE, id: undefined } as unknown as PecaAeronautica;
      expect(() => validarPeca(malformada)).not.toThrow();
    });
  });

  describe("integração com o pipeline", () => {
    it("interrompe com PECA_NAO_ENCONTRADA quando a peça não existe e não chama a IA", () => {
      const repo = criarRepositorioLocal(criarStorageMemoria());
      repo.carregar();
      const inferirSpy = vi.fn();

      const resultado = executarPipeline(
        {
          pecaId: "P-999",
          dataLote: "2026-10-15",
          quantidade: 100,
          defeituosos: 1,
          horas: 2,
          temperatura: 200,
          pressao: 6,
        },
        {
          repositorio: repo,
          ia: {
            meta: {
              nome: "modelo_ia.bin",
              versao: "0.1",
              precisao: 0.9,
              status: "carregado",
            },
            inferir: inferirSpy,
          },
          engine: {
            calcularMetricas,
            classificar,
            gerarRecomendacao: () => "ok",
            executarFallback,
          },
          bus: criarEventBus(),
          regras: REGRAS_PADRAO,
          flags: FLAGS_PADRAO,
          configIA: { modoFalha: "NENHUM" },
          seed: 42,
        },
      );

      expect(inferirSpy).not.toHaveBeenCalled();
      expect(resultado.origem).toBe("VALIDACAO");
      expect(resultado.status).toBe("CRITICO");
      expect(resultado.erros.some((e) => e.codigo === "PECA_NAO_ENCONTRADA")).toBe(true);
    });
  });
});
