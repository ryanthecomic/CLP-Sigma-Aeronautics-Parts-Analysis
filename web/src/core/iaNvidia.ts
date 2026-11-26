/**
 * Provedor de IA real — NVIDIA NIM (API compatível com OpenAI).
 *
 * Dono: Membro 4 (IA). Este é o único arquivo do core que faz chamadas de rede.
 * `ia.ts` continua 100% puro e determinístico (o teste de "sem rede" só olha
 * para `ia.ts`).
 *
 * Em desenvolvimento a chave da NVIDIA fica no servidor do Vite (proxy
 * `/api/nvidia`) e nunca é enviada ao navegador. Veja `web/vite.config.ts`.
 *
 * Fluxo: requisicao -> prompt em pt-BR -> POST /chat/completions -> conteúdo
 * JSON -> normalização -> `SaidaBrutaIA`. Qualquer falha vira `ErroIA`, então o
 * Controlador aciona o fallback determinístico.
 */
import { calcularMetricas } from "./calculations";
import type { AIProvider, ModeloIAMeta, RequisicaoIA, SaidaBrutaIA } from "./contracts";
import { ErroIA } from "./ia";
import { classificar } from "./rules";
import { ModoFalhaIA, type DadosProducaoAero } from "./types";
import { arredondar, limitar } from "./utils";

/** Modelo padrão testado com a chave do projeto. */
export const NVIDIA_MODELO_PADRAO = "nvidia/nemotron-3.5-lightning-30b-a3b";

/** Caminho do proxy criado em `vite.config.ts` (evita expor a chave no bundle). */
export const NVIDIA_BASE_URL_PADRAO = "/api/nvidia";

/** Tempo limite padrão da chamada real (a inferência leva ~1 s sem raciocínio). */
export const NVIDIA_TIMEOUT_PADRAO_MS = 30_000;

/** Assinatura mínima de `fetch`, injetável em testes sem mock global. */
export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export interface ConfigProvedorNvidia {
  /** Sobrescreve `VITE_NVIDIA_MODELO`. */
  modelo?: string;
  /** Sobrescreve `VITE_NVIDIA_BASE_URL` (padrão: proxy `/api/nvidia`). */
  baseUrl?: string;
  /** Chave usada apenas no modo direto (build sem proxy). Prefira o proxy. */
  apiKey?: string;
  /** Tempo limite da chamada de rede em ms. */
  timeoutMs?: number;
  /** `fetch` alternativo (testes). */
  fetchImpl?: FetchLike;
  /** Desliga o raciocínio explícito no chat template (mais rápido). */
  desativarRaciocinio?: boolean;
}

/** Metadados exibidos na UI para o modelo da NVIDIA. */
export function metaModeloNvidia(modelo: string = NVIDIA_MODELO_PADRAO): ModeloIAMeta {
  return Object.freeze({
    nome: modelo,
    versao: "nim",
    precisao: 0.9,
    status: "carregado",
  }) as ModeloIAMeta;
}

/** Remove cercas de markdown e extrai o primeiro objeto JSON do texto. */
export function extrairJson(texto: string): unknown {
  const limpo = texto
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(limpo);
  } catch {
    // Alguns modelos adicionam uma frase antes/depois do JSON.
  }

  const inicio = limpo.indexOf("{");
  const fim = limpo.lastIndexOf("}");
  if (inicio >= 0 && fim > inicio) {
    try {
      return JSON.parse(limpo.slice(inicio, fim + 1));
    } catch {
      // Cai no erro abaixo.
    }
  }

  throw new Error("A resposta não contém um objeto JSON válido.");
}

/**
 * Converte a resposta crua do modelo em `SaidaBrutaIA`.
 * Campos ausentes ou não numéricos viram `NaN`; o Controlador reprova no
 * schema e aciona o fallback. Números em texto (ex.: "1,2%") são aceitos.
 */
export function normalizarSaidaNvidia(bruto: unknown, modelo: string = NVIDIA_MODELO_PADRAO): SaidaBrutaIA {
  if (typeof bruto !== "object" || bruto === null || Array.isArray(bruto)) {
    throw new Error("A resposta da NVIDIA não é um objeto JSON.");
  }
  const obj = bruto as Record<string, unknown>;

  const campo = (chaves: readonly string[]): unknown => {
    for (const chave of chaves) {
      if (Object.prototype.hasOwnProperty.call(obj, chave)) return obj[chave];
    }
    return undefined;
  };

  return {
    produtividade: numero(campo(["produtividade", "productivity"])),
    taxaDefeitos: numero(campo(["taxaDefeitos", "defectRate"])),
    eficiencia: numero(campo(["eficiencia", "efficiency"])),
    conformidade: numero(campo(["conformidade", "compliance"])),
    previsaoFalhas: numero(campo(["previsaoFalhas", "failureForecast"])),
    confianca: numero(campo(["confianca", "confidence"])),
    recomendacao: texto(campo(["recomendacao", "recommendation"])),
    modelo: `${modelo}@nim`,
  };
}

/** Cria o provedor NVIDIA NIM com fallback automático para o Controlador. */
export function criarProviderNvidia(opcoes: ConfigProvedorNvidia = {}): AIProvider {
  const { modelo, baseUrl, apiKey, timeoutMs, fetchImpl, desativarRaciocinio } = resolverConfigNvidia(opcoes);
  const meta = metaModeloNvidia(modelo);

  return {
    meta,
    async inferir(requisicao: RequisicaoIA): Promise<SaidaBrutaIA> {
      if (requisicao.config.modoFalha === ModoFalhaIA.EXCECAO) {
        throw new ErroIA(
          "EXCECAO",
          `Falha interna do provedor NVIDIA NIM para a peça ${requisicao.peca.id} (seed ${requisicao.seed}).`,
          { seed: requisicao.seed, modelo: `${modelo}@nim` },
        );
      }

      if (requisicao.config.modoFalha === ModoFalhaIA.TIMEOUT) {
        const limite = requisicao.config.timeoutMs ?? timeoutMs;
        throw new ErroIA(
          "TIMEOUT",
          `A chamada ao provedor NVIDIA NIM excedeu o tempo limite de ${limite} ms (seed ${requisicao.seed}).`,
          {
            seed: requisicao.seed,
            modelo: `${modelo}@nim`,
            timeoutMs: limite,
            latenciaSimuladaMs: limite,
          },
        );
      }

      const resposta = await chamarNvidia({
        requisicao,
        modelo,
        baseUrl,
        timeoutMs,
        fetchImpl,
        desativarRaciocinio,
        ...(apiKey ? { apiKey } : {}),
      });
      const saida = normalizarSaidaNvidia(resposta, modelo);

      if (requisicao.config.modoFalha === ModoFalhaIA.SAIDA_INVALIDA) {
        return saidaCorrompida(modelo);
      }

      if (requisicao.config.modoFalha === ModoFalhaIA.BAIXA_CONFIANCA) {
        const teto = Math.max(0, requisicao.regras.confiancaMinimaIA - 0.01);
        saida.confianca = arredondar(teto * 0.75, 3);
        return saida;
      }

      if (requisicao.config.modoFalha === ModoFalhaIA.NENHUM && requisicao.config.confianca !== undefined) {
        saida.confianca = arredondar(limitar(requisicao.config.confianca, 0, 1), 3);
      }

      return saida;
    },
  };
}

/* ------------------------------------------------------------------ */
/* Internos                                                            */
/* ------------------------------------------------------------------ */

interface ChamadaNvidia {
  requisicao: RequisicaoIA;
  modelo: string;
  baseUrl: string;
  timeoutMs: number;
  fetchImpl: FetchLike;
  desativarRaciocinio: boolean;
  apiKey?: string;
}

async function chamarNvidia(chamada: ChamadaNvidia): Promise<unknown> {
  const { requisicao, modelo, baseUrl, timeoutMs, fetchImpl, desativarRaciocinio, apiKey } = chamada;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let resposta: Response;
  try {
    resposta = await fetchImpl(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: modelo,
        messages: montarMensagens(requisicao),
        temperature: 0.1,
        max_tokens: 2_000,
        response_format: { type: "json_object" },
        ...(desativarRaciocinio ? { chat_template_kwargs: { enable_thinking: false } } : {}),
      }),
      signal: controller.signal,
    });
  } catch (erro) {
    if (controller.signal.aborted) {
      throw new ErroIA(
        "TIMEOUT",
        `A chamada à NVIDIA NIM excedeu o tempo limite de ${timeoutMs} ms.`,
        {
          seed: requisicao.seed,
          modelo: `${modelo}@nim`,
          timeoutMs,
          latenciaSimuladaMs: timeoutMs,
        },
      );
    }
    const mensagem = erro instanceof Error ? erro.message : String(erro);
    throw new ErroIA("EXCECAO", `Falha de rede ao chamar a NVIDIA NIM: ${mensagem}`, {
      seed: requisicao.seed,
      modelo: `${modelo}@nim`,
    });
  } finally {
    clearTimeout(timer);
  }

  if (!resposta.ok) {
    const detalhe = await lerErro(resposta);
    throw new ErroIA(
      "EXCECAO",
      `NVIDIA NIM respondeu ${resposta.status}${detalhe ? `: ${detalhe}` : ""}`,
      { seed: requisicao.seed, modelo: `${modelo}@nim` },
    );
  }

  let corpo: unknown;
  try {
    corpo = await resposta.json();
  } catch {
    throw new ErroIA("EXCECAO", "A NVIDIA NIM devolveu uma resposta que não é JSON.", {
      seed: requisicao.seed,
      modelo: `${modelo}@nim`,
    });
  }

  const conteudo = extrairConteudo(corpo);
  if (conteudo.trim() === "") {
    throw new ErroIA("EXCECAO", "A NVIDIA NIM devolveu uma resposta sem conteúdo.", {
      seed: requisicao.seed,
      modelo: `${modelo}@nim`,
    });
  }

  try {
    return extrairJson(conteudo);
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : String(erro);
    throw new ErroIA("EXCECAO", `Conteúdo inválido devolvido pela NVIDIA NIM: ${mensagem}`, {
      seed: requisicao.seed,
      modelo: `${modelo}@nim`,
    });
  }
}

function montarMensagens(requisicao: RequisicaoIA): Array<{ role: "system" | "user"; content: string }> {
  const { dados, peca, regras } = requisicao;
  const referencia = calcularMetricas(dados, regras);
  const statusReferencia = classificar(referencia, regras);

  return [
    {
      role: "system",
      content: [
        "Você é o módulo de IA do Aerolyze, especialista em qualidade de peças aeroespaciais.",
        "Responda exclusivamente com um objeto JSON válido, sem markdown e sem texto fora do JSON.",
        "Todos os campos numéricos devem ser números JSON finitos (nunca strings) e dentro das faixas indicadas.",
        'Formato exato: {"produtividade": <número >= 0>, "taxaDefeitos": <0-100>, "eficiencia": <0-100>, "conformidade": <0-100>, "previsaoFalhas": <0-100>, "confianca": <0-1>, "recomendacao": "<texto curto em português>"}',
        "Use as métricas determinísticas de referência como base e só as ajuste se houver justificativa técnica clara.",
        "A confiança deve refletir a qualidade dos dados e a consistência da análise (0 = incerta, 1 = totalmente segura).",
      ].join("\n"),
    },
    {
      role: "user",
      content: [
        "Dados do lote:",
        descreverLote(dados, peca.nome, peca.material, peca.pesoKg),
        "",
        "Regras vigentes:",
        JSON.stringify(regras),
        "",
        "Métricas determinísticas de referência:",
        JSON.stringify(referencia),
        `Classificação de referência: ${statusReferencia}.`,
        "",
        "Avalie a conformidade do lote e devolva o JSON no formato exigido.",
      ].join("\n"),
    },
  ];
}

function descreverLote(dados: DadosProducaoAero, nomePeca: string, material: string, pesoKg: number): string {
  return [
    `- Peça: ${nomePeca} (${dados.pecaId}), material ${material}, peso ${pesoKg} kg`,
    `- Data do lote: ${dados.dataLote}`,
    `- Quantidade produzida: ${dados.quantidade}`,
    `- Peças defeituosas: ${dados.defeituosos}`,
    `- Horas trabalhadas: ${dados.horas}`,
    `- Temperatura do processo: ${dados.temperatura} °C`,
    `- Pressão do processo: ${dados.pressao} bar`,
  ].join("\n");
}

function extrairConteudo(corpo: unknown): string {
  if (typeof corpo !== "object" || corpo === null) return "";
  const escolhas = (corpo as Record<string, unknown>).choices;
  if (!Array.isArray(escolhas) || escolhas.length === 0) return "";
  const primeira = escolhas[0];
  if (typeof primeira !== "object" || primeira === null) return "";
  const mensagem = (primeira as Record<string, unknown>).message;
  if (typeof mensagem !== "object" || mensagem === null) return "";
  const conteudo = (mensagem as Record<string, unknown>).content;

  if (typeof conteudo === "string") return conteudo;
  if (Array.isArray(conteudo)) {
    return conteudo
      .map((parte) => {
        if (typeof parte !== "object" || parte === null) return "";
        const valor = (parte as Record<string, unknown>).text;
        return typeof valor === "string" ? valor : "";
      })
      .join("");
  }
  return "";
}

function numero(valor: unknown): number {
  if (typeof valor === "number") return valor;
  if (typeof valor === "string") {
    const limpo = valor.trim().replace("%", "").replace(",", ".");
    if (limpo === "") return Number.NaN;
    return Number(limpo);
  }
  return Number.NaN;
}

function texto(valor: unknown): string {
  return typeof valor === "string" ? valor.trim() : "";
}

function textoEnv(valor: unknown): string | undefined {
  if (typeof valor !== "string") return undefined;
  const limpo = valor.trim();
  return limpo === "" ? undefined : limpo;
}

function inteiroEnv(valor: unknown): number | undefined {
  const textoValor = textoEnv(valor);
  if (!textoValor) return undefined;
  const n = Number(textoValor);
  return Number.isInteger(n) && n > 0 ? n : undefined;
}

function saidaCorrompida(modelo: string): SaidaBrutaIA {
  return {
    produtividade: -1,
    taxaDefeitos: Number.NaN,
    eficiencia: 140,
    conformidade: -5,
    previsaoFalhas: 250,
    confianca: 1.7,
    recomendacao: "",
    modelo: `${modelo}@nim`,
  };
}

async function lerErro(resposta: Response): Promise<string> {
  try {
    const textoErro = await resposta.text();
    return textoErro.trim().slice(0, 300);
  } catch {
    return "";
  }
}

/**
 * Exportado para testes: permite conferir o prompt sem chamar a rede.
 * Não faz parte do contrato público do pipeline.
 */
export function __montarMensagensNvidia(requisicao: RequisicaoIA): Array<{ role: "system" | "user"; content: string }> {
  return montarMensagens(requisicao);
}

/**
 * Exportado para testes: valida a configuração efetiva sem efetuar a chamada.
 * Não faz parte do contrato público do pipeline.
 */
export function __configEfetivaNvidia(opcoes: ConfigProvedorNvidia = {}): {
  modelo: string;
  baseUrl: string;
  timeoutMs: number;
  temChave: boolean;
} {
  const { modelo, baseUrl, apiKey, timeoutMs } = resolverConfigNvidia(opcoes);
  return { modelo, baseUrl, timeoutMs, temChave: Boolean(apiKey) };
}

function resolverConfigNvidia(opcoes: ConfigProvedorNvidia): {
  modelo: string;
  baseUrl: string;
  apiKey?: string;
  timeoutMs: number;
  fetchImpl: FetchLike;
  desativarRaciocinio: boolean;
} {
  const modelo = opcoes.modelo ?? textoEnv(import.meta.env.VITE_NVIDIA_MODELO) ?? NVIDIA_MODELO_PADRAO;
  const baseUrl = (opcoes.baseUrl ?? textoEnv(import.meta.env.VITE_NVIDIA_BASE_URL) ?? NVIDIA_BASE_URL_PADRAO).replace(/\/$/, "");
  const apiKey = opcoes.apiKey ?? textoEnv(import.meta.env.VITE_NVIDIA_API_KEY);
  const timeoutMs = opcoes.timeoutMs ?? inteiroEnv(import.meta.env.VITE_NVIDIA_TIMEOUT_MS) ?? NVIDIA_TIMEOUT_PADRAO_MS;
  return {
    modelo,
    baseUrl,
    ...(apiKey ? { apiKey } : {}),
    timeoutMs,
    fetchImpl: opcoes.fetchImpl ?? fetch,
    desativarRaciocinio: opcoes.desativarRaciocinio ?? true,
  };
}
