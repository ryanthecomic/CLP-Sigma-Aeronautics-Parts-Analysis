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
import type { RegrasAnaliseAero } from "./types";
import { arredondar, criarPrng, hashTexto, limitar } from "./utils";

export const MODELO_IA_META: ModeloIAMeta = {
  nome: "modelo_ia.bin",
  versao: "0.1.0-mock",
  precisao: 0.92,
  status: "carregado",
};

export const CONFIG_IA_PADRAO: ConfigIA = { modoFalha: "NENHUM", timeoutMs: 2000 };

/** Erro lançado pela IA nos modos EXCECAO e TIMEOUT. */
export class ErroIA extends Error {
  readonly tipo: TipoErroIA;

  constructor(tipo: TipoErroIA, mensagem: string) {
    super(mensagem);
    this.name = "ErroIA";
    this.tipo = tipo;
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

/** Seed efetiva: combina a seed informada com o conteúdo do lote (não com o id). */
export function seedEfetiva(requisicao: Pick<RequisicaoIA, "dados" | "seed">): number {
  const d = requisicao.dados;
  return hashTexto(
    [requisicao.seed, d.pecaId, d.dataLote, d.quantidade, d.defeituosos, d.horas, d.temperatura, d.pressao].join("|"),
  );
}

/**
 * Simula a inferência. Lança `ErroIA` nos modos EXCECAO e TIMEOUT.
 * Nos demais modos retorna a saída bruta (que pode ser inválida).
 */
export function simularIA(requisicao: RequisicaoIA): SaidaBrutaIA {
  const { dados, peca, regras, config } = requisicao;
  const rand = criarPrng(seedEfetiva(requisicao));

  if (config.modoFalha === "EXCECAO") {
    throw new ErroIA("EXCECAO", `Falha interna do ${MODELO_IA_META.nome} ao analisar a peça ${peca.id}.`);
  }
  if (config.modoFalha === "TIMEOUT") {
    const limite = config.timeoutMs ?? CONFIG_IA_PADRAO.timeoutMs ?? 2000;
    throw new ErroIA("TIMEOUT", `A inferência excedeu o tempo limite de ${limite} ms.`);
  }

  if (config.modoFalha === "SAIDA_INVALIDA") {
    return {
      produtividade: -1,
      taxaDefeitos: Number.NaN,
      eficiencia: 140,
      conformidade: -5,
      previsaoFalhas: 250,
      confianca: 1.7,
      recomendacao: "",
      modelo: MODELO_IA_META.nome,
    };
  }

  const base = calcularMetricas(dados, regras);
  const ruido = (amplitude: number): number => (rand() - 0.5) * 2 * amplitude;

  const taxaDefeitos = arredondar(limitar(base.taxaDefeitos * (1 + ruido(0.05)), 0, 100));
  const eficiencia = arredondar(limitar(base.eficiencia + ruido(1), 0, 100));
  const metricas = {
    produtividade: arredondar(Math.max(0, base.produtividade * (1 + ruido(0.02)))),
    taxaDefeitos,
    eficiencia,
    conformidade: arredondar(100 - taxaDefeitos),
    previsaoFalhas: arredondar(limitar(base.previsaoFalhas + ruido(2), 0, 100)),
  };

  const confiancaSorteada =
    config.modoFalha === "BAIXA_CONFIANCA" ? 0.35 + rand() * 0.25 : 0.78 + rand() * 0.2;
  const confianca =
    config.modoFalha === "NENHUM" && config.confianca !== undefined
      ? limitar(config.confianca, 0, 1)
      : confiancaSorteada;

  const status = classificar(metricas, regras);
  return {
    ...metricas,
    confianca: arredondar(confianca, 3),
    recomendacao: `Modelo indica: ${gerarRecomendacao(status, metricas, dados, regras)}`,
    modelo: `${MODELO_IA_META.nome}@${MODELO_IA_META.versao}`,
  };
}

/** Diz se o fallback seria acionado para uma saída (inválida ou com baixa confiança). */
export function fallbackSeriaAcionado(saida: SaidaBrutaIA, regras: RegrasAnaliseAero): boolean {
  return validarSaidaIA(saida).length > 0 || saida.confianca < regras.confiancaMinimaIA;
}

/** `AIProvider` mock padrão: a configuração chega em cada requisição. */
export const mockAIProvider: AIProvider = {
  meta: MODELO_IA_META,
  inferir: (requisicao) => simularIA(requisicao),
};
