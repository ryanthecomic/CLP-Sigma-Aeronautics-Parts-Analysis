import { describe, expect, it } from "vitest";
import type { ConfigIA } from "../../core/contracts";
import { criarEventBus } from "../../core/eventBus";
import { runAnalysis } from "../../core/mockEngine";
import type { OpcoesRunAnalysis } from "../../core/mockEngine";
import { criarRepositorioLocal, criarStorageMemoria } from "../../core/repository";
import { REGRAS_PADRAO } from "../../core/rules";
import type { AnaliseInput, ResultadoAnalise } from "../../core/types";

const ENTRADA: AnaliseInput = {
  pecaId: "P-001",
  dataLote: "2026-10-15",
  quantidade: 500,
  defeituosos: 5,
  horas: 10,
  temperatura: 205,
  pressao: 6.5,
};

/** Roda o pipeline completo (validação, IA, confiança, fallback, classificação, persistência). */
function analisar(
  ia: ConfigIA,
  extra: Partial<OpcoesRunAnalysis> = {},
  entrada: AnaliseInput = ENTRADA,
): ResultadoAnalise {
  const repositorio = criarRepositorioLocal(criarStorageMemoria());
  repositorio.carregar();
  return runAnalysis(entrada, { repositorio, bus: criarEventBus(), ia, seed: 42, ...extra });
}

function passo(resultado: ResultadoAnalise, id: string) {
  return resultado.passos.find((p) => p.id === id);
}

/** Campos do resultado que precisam ser iguais entre execuções (ids e datas mudam). */
function essencia(r: ResultadoAnalise) {
  return {
    origem: r.origem,
    status: r.status,
    produtividade: r.produtividade,
    taxaDefeitos: r.taxaDefeitos,
    eficiencia: r.eficiencia,
    conformidade: r.conformidade,
    previsaoFalhas: r.previsaoFalhas,
    confianca: r.confianca,
    recomendacao: r.recomendacao,
  };
}

const FALHAS: Array<{ nome: string; config: ConfigIA }> = [
  { nome: "EXCECAO", config: { modoFalha: "EXCECAO" } },
  { nome: "TIMEOUT", config: { modoFalha: "TIMEOUT", timeoutMs: 1500 } },
  { nome: "BAIXA_CONFIANCA", config: { modoFalha: "BAIXA_CONFIANCA" } },
  { nome: "SAIDA_INVALIDA", config: { modoFalha: "SAIDA_INVALIDA" } },
];

describe("Membro 4 — IA integrada ao Controlador", () => {
  it("sem falha, o resultado vem da IA e o fallback é ignorado", () => {
    const resultado = analisar({ modoFalha: "NENHUM" });
    expect(resultado.origem).toBe("IA");
    expect(resultado.recomendacao).toContain("Modelo indica");
    expect(resultado.confianca).toBeGreaterThanOrEqual(REGRAS_PADRAO.confiancaMinimaIA);
    expect(passo(resultado, "ia")?.status).toBe("SUCESSO");
    expect(passo(resultado, "fallback")?.status).toBe("IGNORADO");
  });

  it.each(FALHAS)("$nome aciona o fallback determinístico", ({ config }) => {
    const resultado = analisar(config);
    expect(resultado.origem).toBe("FALLBACK");
    expect(passo(resultado, "fallback")?.status).toBe("SUCESSO");
    expect(passo(resultado, "fallback")?.motivo).toBeTruthy();
  });

  it.each(FALHAS)("$nome é reproduzível de ponta a ponta", ({ config }) => {
    expect(essencia(analisar(config))).toEqual(essencia(analisar(config)));
  });

  it("EXCECAO registra a falha da IA com o tipo no motivo", () => {
    const resultado = analisar({ modoFalha: "EXCECAO" });
    expect(passo(resultado, "ia")?.status).toBe("ERRO");
    expect(passo(resultado, "ia")?.motivo).toContain("IA falhou (EXCECAO)");
  });

  it("TIMEOUT registra a falha com o limite configurado", () => {
    const resultado = analisar({ modoFalha: "TIMEOUT", timeoutMs: 1500 });
    expect(passo(resultado, "ia")?.status).toBe("ERRO");
    expect(passo(resultado, "ia")?.motivo).toContain("IA falhou (TIMEOUT)");
    expect(passo(resultado, "ia")?.motivo).toContain("1500 ms");
  });

  it("BAIXA_CONFIANCA: a IA responde, mas a verificação de confiança barra", () => {
    const resultado = analisar({ modoFalha: "BAIXA_CONFIANCA" });
    expect(passo(resultado, "ia")?.status).toBe("SUCESSO");
    expect(passo(resultado, "confianca")?.status).toBe("ALERTA");
    expect(passo(resultado, "confianca")?.motivo).toContain("abaixo do mínimo");
  });

  it("BAIXA_CONFIANCA continua acionando o fallback com outro mínimo nas regras", () => {
    const regras = { ...REGRAS_PADRAO, confiancaMinimaIA: 0.5 };
    const resultado = analisar({ modoFalha: "BAIXA_CONFIANCA" }, { regras });
    expect(resultado.origem).toBe("FALLBACK");
    expect(passo(resultado, "confianca")?.status).toBe("ALERTA");
  });

  it("SAIDA_INVALIDA nunca é aceita como ResultadoAnalise", () => {
    for (const seed of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]) {
      const resultado = analisar({ modoFalha: "SAIDA_INVALIDA" }, { seed });
      expect(resultado.origem).toBe("FALLBACK");
      expect(passo(resultado, "ia")?.status).toBe("ERRO");
      expect(passo(resultado, "ia")?.motivo).toContain("Saída inválida da IA");
      expect(passo(resultado, "confianca")?.status).toBe("IGNORADO");

      for (const valor of [
        resultado.produtividade,
        resultado.taxaDefeitos,
        resultado.eficiencia,
        resultado.conformidade,
        resultado.previsaoFalhas,
        resultado.confianca,
      ]) {
        expect(Number.isFinite(valor)).toBe(true);
      }
      expect(resultado.taxaDefeitos).toBeGreaterThanOrEqual(0);
      expect(resultado.taxaDefeitos).toBeLessThanOrEqual(100);
      expect(resultado.confianca).toBeGreaterThanOrEqual(0);
      expect(resultado.confianca).toBeLessThanOrEqual(1);
      expect(resultado.recomendacao.length).toBeGreaterThan(0);
    }
  });

  it("dados inválidos são barrados antes da IA, mesmo com falha configurada", () => {
    const resultado = analisar({ modoFalha: "EXCECAO" }, {}, { ...ENTRADA, defeituosos: 600 });
    expect(resultado.origem).toBe("VALIDACAO");
    expect(passo(resultado, "ia")?.status).toBe("IGNORADO");
  });
});