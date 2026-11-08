/**
 * Schemas Zod do core: dados persistidos e entrada de análise.
 *
 * Os schemas de entrada são construídos a partir das regras, para que a
 * View (Membro 6) não duplique limites de domínio.
 */
import { z } from "zod";
import { MODULOS_SISTEMA } from "./types";
import type { AnaliseInput, RegrasAnaliseAero } from "./types";

const modulo = z.enum(MODULOS_SISTEMA as [string, ...string[]]);

export const pecaSchema = z.object({
  id: z.string(),
  nome: z.string(),
  material: z.string(),
  pesoKg: z.number(),
  conforme: z.boolean(),
});

export const loteSchema = z.object({
  id: z.string(),
  pecaId: z.string(),
  dataLote: z.string(),
  quantidade: z.number(),
  defeituosos: z.number(),
  horas: z.number(),
  temperatura: z.number(),
  pressao: z.number(),
});

export const regrasSchema = z.object({
  temperaturaMin: z.number(),
  temperaturaMax: z.number(),
  pressaoMin: z.number(),
  pressaoMax: z.number(),
  confiancaMinimaIA: z.number().min(0).max(1),
  taxaDefeitosOtimo: z.number(),
  taxaDefeitosAtencao: z.number(),
  eficienciaOtimo: z.number(),
  eficienciaAtencao: z.number(),
});

export const flagsSchema = z.object({
  forcarFalhaIA: z.boolean(),
  forcarFallback: z.boolean(),
  validacaoEstrita: z.boolean(),
  latenciaSimulada: z.boolean(),
});

const issueSchema = z.object({
  codigo: z.string(),
  campo: z.string(),
  mensagem: z.string(),
  modulo,
});

const stepSchema = z.object({
  id: z.string(),
  label: z.string(),
  modulo,
  status: z.enum(["PENDENTE", "EXECUTANDO", "SUCESSO", "ALERTA", "ERRO", "IGNORADO"]),
  duracaoMs: z.number(),
  motivo: z.string().optional(),
  entrada: z.unknown().optional(),
  saida: z.unknown().optional(),
});

export const resultadoSchema = z.object({
  id: z.string(),
  loteId: z.string(),
  status: z.enum(["OTIMO", "ATENCAO", "CRITICO"]),
  produtividade: z.number(),
  taxaDefeitos: z.number(),
  eficiencia: z.number(),
  conformidade: z.number(),
  previsaoFalhas: z.number(),
  recomendacao: z.string(),
  origem: z.enum(["IA", "FALLBACK", "VALIDACAO"]),
  confianca: z.number(),
  traceId: z.string(),
  passos: z.array(stepSchema),
  erros: z.array(issueSchema),
  criadoEm: z.string(),
});

export const dadosPersistidosSchema = z.object({
  versao: z.literal(1),
  pecas: z.array(pecaSchema),
  lotes: z.array(loteSchema),
  resultados: z.array(resultadoSchema),
  regras: regrasSchema,
  flags: flagsSchema,
});

/** Valores do formulário (strings, como chegam dos inputs). */
export interface ValoresFormularioAnalise {
  pecaId: string;
  dataLote: string;
  quantidade: string;
  defeituosos: string;
  horas: string;
  temperatura: string;
  pressao: string;
}

export type ErrosFormulario = Partial<Record<keyof ValoresFormularioAnalise, string>>;

const numeroObrigatorio = (rotulo: string) =>
  z
    .string()
    .trim()
    .min(1, `${rotulo} é obrigatório.`)
    .transform((v) => Number(v.replace(",", ".")))
    .refine((v) => Number.isFinite(v), `${rotulo} deve ser um número.`);

/** Schema da entrada de análise, montado a partir das regras vigentes. */
export function criarSchemaEntrada(regras: RegrasAnaliseAero) {
  return z
    .object({
      pecaId: z.string().trim().min(1, "Selecione uma peça."),
      dataLote: z
        .string()
        .trim()
        .min(1, "A data do lote é obrigatória.")
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Use o formato AAAA-MM-DD."),
      quantidade: numeroObrigatorio("Quantidade")
        .refine((v) => Number.isInteger(v), "Quantidade deve ser um número inteiro.")
        .refine((v) => v > 0, "Quantidade deve ser maior que 0."),
      defeituosos: numeroObrigatorio("Defeituosos")
        .refine((v) => Number.isInteger(v), "Defeituosos deve ser um número inteiro.")
        .refine((v) => v >= 0, "Defeituosos não pode ser negativo."),
      horas: numeroObrigatorio("Horas").refine((v) => v > 0, "Horas deve ser maior que 0."),
      temperatura: numeroObrigatorio("Temperatura").refine(
        (v) => v >= regras.temperaturaMin && v <= regras.temperaturaMax,
        `Temperatura deve estar entre ${regras.temperaturaMin} e ${regras.temperaturaMax} °C.`,
      ),
      pressao: numeroObrigatorio("Pressão").refine(
        (v) => v >= regras.pressaoMin && v <= regras.pressaoMax,
        `Pressão deve estar entre ${regras.pressaoMin} e ${regras.pressaoMax} bar.`,
      ),
    })
    .refine((v) => v.defeituosos <= v.quantidade, {
      message: "Defeituosos não pode ser maior que a quantidade.",
      path: ["defeituosos"],
    });
}

export type ResultadoFormulario =
  | { ok: true; input: AnaliseInput; erros: ErrosFormulario }
  | { ok: false; erros: ErrosFormulario };

/** Valida os valores do formulário e devolve a entrada tipada ou os erros por campo. */
export function validarFormulario(valores: ValoresFormularioAnalise, regras: RegrasAnaliseAero): ResultadoFormulario {
  const resultado = criarSchemaEntrada(regras).safeParse(valores);
  if (resultado.success) return { ok: true, input: resultado.data, erros: {} };
  const erros: ErrosFormulario = {};
  for (const i of resultado.error.issues) {
    const campo = i.path[0] as keyof ValoresFormularioAnalise | undefined;
    if (campo && !erros[campo]) erros[campo] = i.message;
  }
  return { ok: false, erros };
}

/** Converte valores do formulário em entrada sem validar (para enviar dados inválidos ao motor). */
export function converterSemValidar(valores: ValoresFormularioAnalise): AnaliseInput {
  const n = (v: string): number => (v.trim() === "" ? Number.NaN : Number(v.replace(",", ".")));
  return {
    pecaId: valores.pecaId,
    dataLote: valores.dataLote,
    quantidade: n(valores.quantidade),
    defeituosos: n(valores.defeituosos),
    horas: n(valores.horas),
    temperatura: n(valores.temperatura),
    pressao: n(valores.pressao),
  };
}

