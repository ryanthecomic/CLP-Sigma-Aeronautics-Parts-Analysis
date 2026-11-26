import { describe, expect, it, vi } from "vitest";
import type { ConfigIA, RequisicaoIA } from "../../core/contracts";
import { validarSaidaIA } from "../../core/ia";
import { runAnalysis } from "../../core/mockEngine";
import { criarRepositorioLocal, criarStorageMemoria } from "../../core/repository";
import {
  __configEfetivaNvidia,
  criarProviderNvidia,
  extrairJson,
  normalizarSaidaNvidia,
  NVIDIA_BASE_URL_PADRAO,
  NVIDIA_MODELO_PADRAO,
} from "../../core/iaNvidia";
import type { FetchLike } from "../../core/iaNvidia";
import { provedorIAAtivo } from "../../core/iaProvedor";
import { REGRAS_PADRAO } from "../../core/rules";
import { PECAS_SEED } from "../../core/seed";
import type { DadosProducaoAero } from "../../core/types";

const LOTE: DadosProducaoAero = {
  id: "L-NVIDIA",
  pecaId: "P-001",
  dataLote: "2026-10-15",
  quantidade: 500,
  defeituosos: 5,
  horas: 10,
  temperatura: 200,
  pressao: 6.5,
};

const SAIDA_MODELO = {
  produtividade: 50,
  taxaDefeitos: 1,
  eficiencia: 90,
  conformidade: 99,
  previsaoFalhas: 2,
  confianca: 0.91,
  recomendacao: "Lote conforme; manter monitoramento.",
};

function requisicao(config: ConfigIA = { modoFalha: "NENHUM" }): RequisicaoIA {
  return { dados: LOTE, peca: PECAS_SEED[0]!, regras: REGRAS_PADRAO, seed: 42, config };
}

function resposta(corpo: unknown, status = 200): Response {
  return new Response(typeof corpo === "string" ? corpo : JSON.stringify(corpo), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function respostaChat(conteudo: string): Response {
  return resposta({ choices: [{ index: 0, message: { role: "assistant", content: conteudo } }] });
}

function provedorCom(fetchImpl: FetchLike, timeoutMs = 5_000) {
  return criarProviderNvidia({ modelo: "modelo-teste", baseUrl: "/api/nvidia", timeoutMs, fetchImpl });
}

describe("Membro 4 — provedor real NVIDIA NIM", () => {
  it("chama o endpoint compatível com OpenAI e normaliza a saída", async () => {
    const fetchImpl = vi.fn<FetchLike>(async () => respostaChat(JSON.stringify(SAIDA_MODELO)));

    const saida = await provedorCom(fetchImpl).inferir(requisicao());

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(url).toBe("/api/nvidia/chat/completions");
    expect(init?.method).toBe("POST");

    const corpo = JSON.parse(String(init?.body)) as {
      model: string;
      messages: Array<{ role: string; content: string }>;
      response_format: { type: string };
      chat_template_kwargs: { enable_thinking: boolean };
    };
    expect(corpo.model).toBe("modelo-teste");
    expect(corpo.messages[0]?.role).toBe("system");
    expect(corpo.messages[1]?.content).toContain("500");
    expect(corpo.response_format).toEqual({ type: "json_object" });
    expect(corpo.chat_template_kwargs).toEqual({ enable_thinking: false });

    expect(saida.produtividade).toBe(50);
    expect(saida.taxaDefeitos).toBe(1);
    expect(saida.modelo).toBe("modelo-teste@nim");
    expect(validarSaidaIA(saida)).toEqual([]);
  });

  it("não envia Authorization no modo proxy (a chave fica no servidor)", async () => {
    const fetchImpl = vi.fn<FetchLike>(async () => respostaChat(JSON.stringify(SAIDA_MODELO)));
    await provedorCom(fetchImpl).inferir(requisicao());

    const headers = new Headers(fetchImpl.mock.calls[0]?.[1]?.headers);
    expect(headers.get("Authorization")).toBeNull();
  });

  it("envia Authorization apenas quando uma chave explícita é fornecida", async () => {
    const fetchImpl = vi.fn<FetchLike>(async () => respostaChat(JSON.stringify(SAIDA_MODELO)));
    const provider = criarProviderNvidia({
      modelo: "modelo-teste",
      baseUrl: "/api/nvidia",
      apiKey: "chave-de-teste",
      fetchImpl,
    });

    await provider.inferir(requisicao());

    const headers = new Headers(fetchImpl.mock.calls[0]?.[1]?.headers);
    expect(headers.get("Authorization")).toBe("Bearer chave-de-teste");
  });

  it("aceita JSON dentro de cercas de markdown", async () => {
    const fetchImpl = vi.fn<FetchLike>(async () =>
      respostaChat("```json\n" + JSON.stringify(SAIDA_MODELO) + "\n```"),
    );

    const saida = await provedorCom(fetchImpl).inferir(requisicao());
    expect(validarSaidaIA(saida)).toEqual([]);
  });

  it("converte números em texto e vírgula decimal", () => {
    const saida = normalizarSaidaNvidia(
      {
        produtividade: "50",
        taxaDefeitos: "1,5%",
        eficiencia: "90",
        conformidade: "98,5",
        previsaoFalhas: "2",
        confianca: "0,88",
        recomendacao: "  Lote ok.  ",
      },
      "modelo-teste",
    );

    expect(saida.taxaDefeitos).toBe(1.5);
    expect(saida.confianca).toBe(0.88);
    expect(saida.recomendacao).toBe("Lote ok.");
    expect(validarSaidaIA(saida)).toEqual([]);
  });

  it("reprova no schema quando o modelo omite ou devolve texto em campo numérico", () => {
    const saida = normalizarSaidaNvidia({
      produtividade: 50,
      taxaDefeitos: "baixa",
      eficiencia: 90,
      conformidade: 99,
      previsaoFalhas: 2,
      confianca: 0.9,
      recomendacao: "ok",
    });

    expect(validarSaidaIA(saida).length).toBeGreaterThan(0);
  });

  it("aborta e lança ErroIA TIMEOUT quando a chamada excede o limite", async () => {
    const fetchImpl: FetchLike = (_input, init) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new Error("abortado")));
      });

    await expect(provedorCom(fetchImpl, 10).inferir(requisicao())).rejects.toMatchObject({
      name: "ErroIA",
      tipo: "TIMEOUT",
      detalhes: { timeoutMs: 10 },
    });
  });

  it("lança ErroIA EXCECAO em resposta HTTP de erro", async () => {
    const fetchImpl = vi.fn<FetchLike>(async () => resposta({ error: "não autorizado" }, 401));

    await expect(provedorCom(fetchImpl).inferir(requisicao())).rejects.toMatchObject({
      name: "ErroIA",
      tipo: "EXCECAO",
    });
  });

  it("lança ErroIA EXCECAO quando o conteúdo não é JSON", async () => {
    const fetchImpl = vi.fn<FetchLike>(async () => respostaChat("não é json"));

    await expect(provedorCom(fetchImpl).inferir(requisicao())).rejects.toThrow(/JSON válido/);
  });

  it("BAIXA_CONFIANCA devolve saída válida sempre abaixo do mínimo", async () => {
    const fetchImpl = vi.fn<FetchLike>(async () => respostaChat(JSON.stringify(SAIDA_MODELO)));
    const saida = await provedorCom(fetchImpl).inferir(requisicao({ modoFalha: "BAIXA_CONFIANCA" }));

    expect(validarSaidaIA(saida)).toEqual([]);
    expect(saida.confianca).toBeLessThan(REGRAS_PADRAO.confiancaMinimaIA);
  });

  it("SAIDA_INVALIDA devolve saída reprovada pelo schema", async () => {
    const fetchImpl = vi.fn<FetchLike>(async () => respostaChat(JSON.stringify(SAIDA_MODELO)));
    const saida = await provedorCom(fetchImpl).inferir(requisicao({ modoFalha: "SAIDA_INVALIDA" }));

    expect(validarSaidaIA(saida).length).toBeGreaterThan(0);
  });

  it("EXCECAO e TIMEOUT simulados não chamam a rede", async () => {
    const fetchImpl = vi.fn<FetchLike>(async () => respostaChat(JSON.stringify(SAIDA_MODELO)));
    const provider = provedorCom(fetchImpl);

    await expect(provider.inferir(requisicao({ modoFalha: "EXCECAO" }))).rejects.toMatchObject({ tipo: "EXCECAO" });
    await expect(
      provider.inferir(requisicao({ modoFalha: "TIMEOUT", timeoutMs: 1_500 })),
    ).rejects.toMatchObject({ tipo: "TIMEOUT", detalhes: { timeoutMs: 1_500 } });

    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("integra com o pipeline: saída aceita vira ResultadoAnalise com origem IA", async () => {
    const repositorio = criarRepositorioLocal(criarStorageMemoria());
    repositorio.carregar();
    const fetchImpl = vi.fn<FetchLike>(async () => respostaChat(JSON.stringify(SAIDA_MODELO)));

    const resultado = await runAnalysis(
      {
        pecaId: "P-001",
        dataLote: "2026-10-15",
        quantidade: LOTE.quantidade,
        defeituosos: LOTE.defeituosos,
        horas: LOTE.horas,
        temperatura: LOTE.temperatura,
        pressao: LOTE.pressao,
      },
      { repositorio, provedorIA: provedorCom(fetchImpl), seed: 42 },
    );

    expect(resultado.origem).toBe("IA");
    expect(resultado.confianca).toBe(0.91);
    expect(resultado.recomendacao).toContain("Lote conforme");
    expect(resultado.passos.find((passo) => passo.id === "ia")?.status).toBe("SUCESSO");
    expect(resultado.passos.find((passo) => passo.id === "fallback")?.status).toBe("IGNORADO");
  });

  it("extrai JSON mesmo com texto antes ou depois", () => {
    expect(extrairJson('Segue: {"status":"ok"} fim')).toEqual({ status: "ok" });
  });

  it("a configuração padrão usa o proxy e o modelo documentado", () => {
    const config = __configEfetivaNvidia();
    expect(config.modelo).toBe(NVIDIA_MODELO_PADRAO);
    expect(config.baseUrl).toBe(NVIDIA_BASE_URL_PADRAO);
    expect(config.timeoutMs).toBeGreaterThan(0);
  });

  it("em testes o provedor ativo é sempre o mock", () => {
    expect(provedorIAAtivo()).toBe("mock");
  });
});
