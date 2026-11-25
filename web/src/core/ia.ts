/**
 * IA mock determinística (simula a biblioteca embarcada `modelo_ia.bin`).
 *
 * Dono: Membro 4 (IA). Funções puras, sem React e sem rede.
 * A mesma seed e a mesma entrada geram sempre a mesma saída.
 */
import { z } from "zod";
import type { AIProvider, ConfigIA, ModeloIAMeta, RequisicaoIA, SaidaBrutaIA, TipoErroIA } from "./contracts";
import { calcularMetricas } from "./calculations";
import { gerarRecomendacao } from "./fallback";
import { classificar } from "./rules";
import { ModoFalhaIA, type RegrasAnaliseAero } from "./types";
import { arredondar, criarPrng, hashTexto, limitar } from "./utils";

const metaModelo: ModeloIAMeta = {
  nome: "modelo_ia.bin",
  versao: "0.1.0-mock",
  precisao: 0.92,
  status: "carregado",
};

/**
 * Metadados do modelo embarcado (nome, versão, precisão e status).
 * Congelado: nenhum código pode alterá-lo em tempo de execução.
 */
export const MODELO_IA_META: Readonly<ModeloIAMeta> = Object.freeze(metaModelo);

/**
 * Identificador legível do modelo no formato "nome@versão" (ex.: "modelo_ia.bin@0.1.0-mock").
 * É o único lugar que monta esse texto: use esta função em vez de concatenar à mão.
 */
export function descreverModelo(meta: Pick<ModeloIAMeta, "nome" | "versao"> = MODELO_IA_META): string {
  return `${meta.nome}@${meta.versao}`;
}

export const CONFIG_IA_PADRAO: ConfigIA = { modoFalha: ModoFalhaIA.NENHUM, timeoutMs: 2000 };

/**
 * Amplitudes do ruído aplicado às métricas reais para simular a variação do modelo.
 * "Relativa" = fração do valor base (0.05 = ±5%). "Absoluta" = pontos percentuais.
 */
const AMPLITUDE_TAXA_DEFEITOS = 0.05; // relativa
const AMPLITUDE_EFICIENCIA = 1; // absoluta
const AMPLITUDE_PRODUTIVIDADE = 0.02; // relativa
const AMPLITUDE_PREVISAO_FALHAS = 2; // absoluta

/** Identificador "nome@versão" usado nas saídas e nos erros. */
const IDENTIFICADOR_MODELO = descreverModelo();

/**
 * Saídas corrompidas devolvidas no modo SAIDA_INVALIDA. A seed escolhe qual delas.
 * Todas reprovam em `saidaIASchema`, então o Controlador nunca as aceita como resultado.
 */
const SAIDAS_INVALIDAS: readonly SaidaBrutaIA[] = [
  // 0: valores fora da faixa, NaN e recomendação vazia
  {
    produtividade: -1,
    taxaDefeitos: Number.NaN,
    eficiencia: 140,
    conformidade: -5,
    previsaoFalhas: 250,
    confianca: 1.7,
    recomendacao: "",
    modelo: IDENTIFICADOR_MODELO,
  },
  // 1: valor infinito em uma métrica
  {
    produtividade: Number.POSITIVE_INFINITY,
    taxaDefeitos: 2,
    eficiencia: 90,
    conformidade: 98,
    previsaoFalhas: 5,
    confianca: 0.9,
    recomendacao: "Saída corrompida (valor infinito).",
    modelo: IDENTIFICADOR_MODELO,
  },
  // 2: métricas plausíveis, mas confiança acima de 1 e recomendação vazia
  {
    produtividade: 50,
    taxaDefeitos: 2,
    eficiencia: 90,
    conformidade: 98,
    previsaoFalhas: 5,
    confianca: 1.3,
    recomendacao: "",
    modelo: IDENTIFICADOR_MODELO,
  },
];

/** Informações que tornam uma falha simulada rastreável e reproduzível. */
export interface DetalhesErroIA {
  /** Seed efetiva usada na chamada (já normalizada). */
  seed: number;
  /** Identificador "nome@versão" do modelo. */
  modelo: string;
  /** Limite de tempo configurado (apenas no TIMEOUT). */
  timeoutMs?: number;
  /** Latência simulada que estourou o limite (apenas no TIMEOUT). */
  latenciaSimuladaMs?: number;
}

/** Erro lançado pela IA nos modos EXCECAO e TIMEOUT. */
export class ErroIA extends Error {
  readonly tipo: TipoErroIA;
  readonly detalhes: DetalhesErroIA;

  constructor(tipo: TipoErroIA, mensagem: string, detalhes: DetalhesErroIA) {
    super(mensagem);
    this.name = "ErroIA";
    this.tipo = tipo;
    this.detalhes = detalhes;
  }
}

export function ehErroIA(erro: unknown): erro is ErroIA {
  return erro instanceof ErroIA;
}

/** Schema da saída válida da IA. */
export const saidaIASchema = z.object({
  produtividade: z.number().finite().nonnegative(),
  taxaDefeitos: z.number().finite().min(0).max(100),
  eficiencia: z.number().finite().min(0).max(100),
  conformidade: z.number().finite().min(0).max(100),
  previsaoFalhas: z.number().finite().min(0).max(100),
  confianca: z.number().finite().min(0).max(1),
  recomendacao: z.string().min(1),
  modelo: z.string().min(1),
});

/** Valida a saída bruta. Retorna a lista de problemas (vazia se válida). */
export function validarSaidaIA(saida: unknown): string[] {
  const resultado = saidaIASchema.safeParse(saida);
  if (resultado.success) return [];
  return resultado.error.issues.map((i) => `${i.path.join(".") || "saida"}: ${i.message}`);
}

/**
 * Seed efetiva: combina a seed informada com o conteúdo do lote (não com o id).
 * Seeds inválidas (NaN, Infinity) viram 0, para a mesma entrada nunca gerar
 * resultados diferentes por causa de um valor inválido.
 */
/** Seeds inválidas (NaN, Infinity) viram 0, para a mesma entrada não variar por valor inválido. */
function normalizarSeed(seed: number): number {
  return Number.isFinite(seed) ? seed : 0;
}

/**
 * Seed efetiva: combina a seed informada com o conteúdo do lote (não com o id).
 */
export function seedEfetiva(requisicao: Pick<RequisicaoIA, "dados" | "seed">): number {
  const d = requisicao.dados;
  return hashTexto(
    [normalizarSeed(requisicao.seed), d.pecaId, d.dataLote, d.quantidade, d.defeituosos, d.horas, d.temperatura, d.pressao].join("|"),
  );
}

/**
 * Simula a inferência do `modelo_ia.bin`.
 *
 * Propriedades garantidas:
 * - Determinística: mesma requisição (dados, peça, regras, config) e mesma seed
 *   produzem exatamente a mesma saída, inclusive nas falhas.
 * - Pura: sem relógio, sem `Math.random()`, sem estado global e sem rede.
 * - O PRNG (mulberry32, em `utils.ts`) é semeado por `seedEfetiva`.
 *
 * Modos de falha:
 * - EXCECAO: lança `ErroIA` com seed e modelo em `detalhes`.
 * - TIMEOUT: lança `ErroIA` com a latência simulada que estourou o limite (sem espera real).
 * - BAIXA_CONFIANCA: retorna saída válida com confiança sempre abaixo do mínimo das regras.
 * - SAIDA_INVALIDA: retorna uma saída corrompida (a seed escolhe o tipo de corrupção);
 *   deve passar por `validarSaidaIA`, que a reprova.
 */
export function simularIA(requisicao: RequisicaoIA): SaidaBrutaIA {
  const { dados, peca, regras, config } = requisicao;
  const seed = normalizarSeed(requisicao.seed);
  const rand = criarPrng(seedEfetiva(requisicao));

  if (config.modoFalha === "EXCECAO") {
    throw new ErroIA(
      "EXCECAO",
      `Falha interna do ${MODELO_IA_META.nome} ao analisar a peça ${peca.id} (seed ${seed}).`,
      { seed, modelo: IDENTIFICADOR_MODELO },
    );
  }

  if (config.modoFalha === "TIMEOUT") {
    const limite = config.timeoutMs ?? CONFIG_IA_PADRAO.timeoutMs ?? 2000;
    // Latência simulada: sempre acima do limite. Nenhuma espera real acontece.
    const latenciaSimuladaMs = limite + 1 + Math.floor(rand() * 500);
    throw new ErroIA(
      "TIMEOUT",
      `A inferência simulada levou ${latenciaSimuladaMs} ms e excedeu o tempo limite de ${limite} ms (seed ${seed}).`,
      { seed, modelo: IDENTIFICADOR_MODELO, timeoutMs: limite, latenciaSimuladaMs },
    );
  }

  if (config.modoFalha === "SAIDA_INVALIDA") {
    const variante = Math.floor(rand() * SAIDAS_INVALIDAS.length);
    return { ...SAIDAS_INVALIDAS[variante]! };
  }

  const base = calcularMetricas(dados, regras);
  const ruido = (amplitude: number): number => (rand() - 0.5) * 2 * amplitude;

  // ATENÇÃO: a ordem das chamadas a rand() abaixo define a saída de cada seed.
  // Reordenar estas linhas muda o resultado de TODAS as seeds.
  // Ordem: 1) taxaDefeitos  2) eficiencia  3) produtividade  4) previsaoFalhas  5) confiança.
  const taxaDefeitos = arredondar(limitar(base.taxaDefeitos * (1 + ruido(AMPLITUDE_TAXA_DEFEITOS)), 0, 100));
  const eficiencia = arredondar(limitar(base.eficiencia + ruido(AMPLITUDE_EFICIENCIA), 0, 100));
  const metricas = {
    produtividade: arredondar(Math.max(0, base.produtividade * (1 + ruido(AMPLITUDE_PRODUTIVIDADE)))),
    taxaDefeitos,
    eficiencia,
    conformidade: arredondar(100 - taxaDefeitos),
    previsaoFalhas: arredondar(limitar(base.previsaoFalhas + ruido(AMPLITUDE_PREVISAO_FALHAS), 0, 100)),
  };

  // BAIXA_CONFIANCA: sorteia entre 50% e 100% de (mínimo - 0,01), então fica sempre
  // abaixo do mínimo configurado, sem depender de um número fixo.
  const tetoBaixaConfianca = Math.max(0, regras.confiancaMinimaIA - 0.01);
  const confiancaSorteada =
    config.modoFalha === "BAIXA_CONFIANCA"
      ? tetoBaixaConfianca * (0.5 + rand() * 0.5)
      : 0.78 + rand() * 0.2;
  const confianca =
    config.modoFalha === "NENHUM" && config.confianca !== undefined
      ? limitar(config.confianca, 0, 1)
      : confiancaSorteada;

  const status = classificar(metricas, regras);
  return {
    ...metricas,
    confianca: arredondar(confianca, 3),
    recomendacao: `Modelo indica: ${gerarRecomendacao(status, metricas, dados, regras)}`,
    modelo: IDENTIFICADOR_MODELO,
  };
}

/**
 * Explica por que o fallback seria acionado para uma saída da IA.
 * Devolve `null` quando a saída é aceita. Usa a mesma ordem de checagem do pipeline:
 * primeiro o schema, depois a confiança mínima.
 */
export function motivoFallbackIA(saida: SaidaBrutaIA, regras: RegrasAnaliseAero): string | null {
  const problemas = validarSaidaIA(saida);
  if (problemas.length > 0) return `Saída inválida da IA: ${problemas.join("; ")}.`;
  if (saida.confianca < regras.confiancaMinimaIA) {
    return `Confiança ${saida.confianca.toFixed(2)} abaixo do mínimo ${regras.confiancaMinimaIA.toFixed(2)}.`;
  }
  return null;
}

/** Diz se o fallback seria acionado para uma saída (inválida ou com baixa confiança). */
export function fallbackSeriaAcionado(saida: SaidaBrutaIA, regras: RegrasAnaliseAero): boolean {
  return motivoFallbackIA(saida, regras) !== null;
}

/** `AIProvider` mock padrão: a configuração chega em cada requisição. */
export const mockAIProvider: AIProvider = {
  meta: MODELO_IA_META,
  inferir: async (requisicao) => simularIA(requisicao),
};
