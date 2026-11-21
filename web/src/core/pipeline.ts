/**
 * Orquestração do fluxo de análise.
 *
 * Dono: Membro 2 (Controlador). Validação e criação de steps ficam
 * separadas para que este arquivo concentre o fluxo integrado.
 */
import type {
  AIProvider,
  AnalysisEngine,
  ConfigIA,
  EventBus,
  Repository,
  SaidaBrutaIA,
} from "./contracts";
import { emitirLog } from "./eventBus";
import { validarEntrada } from "./guardClauses";
import { ehErroIA, validarSaidaIA } from "./ia";
import {
  criarDadosLote,
  criarPasso,
  METRICAS_ZERADAS,
  PIPELINE_STEP_IDS,
  registrarPassosInterrompidos,
  relogioPadrao,
  ROTULO_ETAPA,
} from "./pipelineSteps";
import type {
  AnaliseInput,
  FlagsDev,
  MetricasProducao,
  ModuloSistema,
  PecaAeronautica,
  PipelineStep,
  RegrasAnaliseAero,
  ResultadoAnalise,
  StatusPasso,
} from "./types";
import { gerarId as gerarIdPadrao } from "./utils";

export { MARGEM_ESTRITA, validarEntrada } from "./guardClauses";
export type { ContextoValidacao } from "./guardClauses";
export { MOTIVO_INTERRUPCAO, PIPELINE_STEP_IDS } from "./pipelineSteps";

export interface DependenciasPipeline {
  repositorio: Repository;
  ia: AIProvider;
  engine: AnalysisEngine;
  bus: EventBus;
  regras: RegrasAnaliseAero;
  flags: FlagsDev;
  configIA: ConfigIA;
  seed: number;
  latenciaMs?: number;
  agora?: () => Date;
  relogio?: () => number;
  gerarId?: (prefixo: string) => string;
}

/**
 * Executa: validar -> IA -> confiança -> fallback -> classificar -> persistir.
 * Emite PipelineStep e LogEvent no bus a cada etapa.
 */
export function executarPipeline(input: AnaliseInput, deps: DependenciasPipeline): ResultadoAnalise {
  const { repositorio, ia, engine, bus, regras, flags } = deps;
  const relogio = deps.relogio ?? relogioPadrao;
  const agora = deps.agora ?? (() => new Date());
  const novoId = deps.gerarId ?? gerarIdPadrao;

  const traceId = novoId("trace");
  const passos: PipelineStep[] = [];
  const log = (
    nivel: "DEBUG" | "INFO" | "WARN" | "ERROR",
    modulo: ModuloSistema,
    mensagem: string,
    payload?: unknown,
  ): void => {
    emitirLog(bus, nivel, modulo, mensagem, { traceId, payload });
  };
  const registrar = (step: PipelineStep): void => {
    passos.push(step);
    bus.emit({ tipo: "step", traceId, step });
  };
  const passo = (
    id: string,
    label: string,
    modulo: ModuloSistema,
    status: StatusPasso,
    inicio: number,
    extra: Partial<Pick<PipelineStep, "motivo" | "entrada" | "saida">> = {},
    duracaoExtraMs = 0,
  ): PipelineStep =>
    criarPasso(relogio, id, label, modulo, status, inicio, extra, duracaoExtraMs);

  bus.emit({ tipo: "analise:inicio", traceId, input });
  log("INFO", "VIEW", "Análise solicitada.", input);

  let inicio = relogio();
  const dados = criarDadosLote(input, novoId);
  registrar(passo(
    PIPELINE_STEP_IDS.Entrada,
    "Receber entrada do operador",
    "VIEW",
    "SUCESSO",
    inicio,
    { entrada: input, saida: dados },
  ));

  inicio = relogio();
  const peca = input.pecaId ? repositorio.buscarPeca(input.pecaId) : undefined;
  const validacao = validarEntrada(input, {
    regras,
    peca,
    estrita: flags.validacaoEstrita,
    agora: agora(),
  });

  for (const etapa of ["campos", "peca", "lote"] as const) {
    const guardas = validacao.guardas.filter((guard) => guard.etapa === etapa);
    const issues = guardas.flatMap((guard) => guard.issues);
    const meta = ROTULO_ETAPA[etapa];
    registrar(
      passo(
        meta.id,
        meta.label,
        meta.modulo,
        issues.length ? "ERRO" : "SUCESSO",
        inicio,
        {
          ...(issues.length ? { motivo: issues.map((issue) => issue.mensagem).join(" ") } : {}),
          entrada: etapa === "peca" ? (peca ?? input.pecaId) : dados,
          saida: guardas,
        },
      ),
    );
    for (const issue of issues) {
      log("WARN", issue.modulo, `Guard clause reprovada [${issue.codigo}]: ${issue.mensagem}`, issue);
    }
    inicio = relogio();
  }

  if (!validacao.valido) {
    registrarPassosInterrompidos(registrar);
    log("WARN", "CONTROLLER", `Entrada rejeitada antes da IA (${validacao.erros.length} erro(s)).`, validacao.erros);

    const resultado: ResultadoAnalise = {
      id: novoId("res"),
      loteId: dados.id,
      ...METRICAS_ZERADAS,
      status: "CRITICO",
      recomendacao: `Entrada rejeitada: ${validacao.erros.map((erro) => erro.mensagem).join(" ")} Corrija os dados e envie novamente.`,
      origem: "VALIDACAO",
      confianca: 0,
      traceId,
      passos: [],
      erros: validacao.erros,
      criadoEm: agora().toISOString(),
    };
    return persistirEFinalizar(resultado, false);
  }

  let saidaIA: SaidaBrutaIA | undefined;
  let motivoFallback: string | undefined;
  inicio = relogio();

  if (flags.forcarFallback) {
    motivoFallback = "Flag \"forçar fallback\" ativa.";
    registrar({
      id: PIPELINE_STEP_IDS.Ia,
      label: "Inferência da IA",
      modulo: "IA",
      status: "IGNORADO",
      duracaoMs: 0,
      motivo: motivoFallback,
    });
    log("INFO", "IA", "IA ignorada: flag forçar fallback ativa.");
  } else {
    const config: ConfigIA = flags.forcarFalhaIA
      ? { ...deps.configIA, modoFalha: "EXCECAO" }
      : deps.configIA;
    const latencia = flags.latenciaSimulada ? (deps.latenciaMs ?? 0) : 0;
    const requisicao = { dados, peca: peca as PecaAeronautica, regras, config, seed: deps.seed };

    try {
      const saida = ia.inferir(requisicao);
      const problemas = validarSaidaIA(saida);
      if (problemas.length) {
        motivoFallback = `Saída inválida da IA: ${problemas.join("; ")}.`;
        registrar(passo(
          PIPELINE_STEP_IDS.Ia,
          "Inferência da IA",
          "IA",
          "ERRO",
          inicio,
          { motivo: motivoFallback, entrada: { config, seed: deps.seed }, saida },
          latencia,
        ));
        log("ERROR", "IA", motivoFallback, saida);
      } else {
        saidaIA = saida;
        registrar(passo(
          PIPELINE_STEP_IDS.Ia,
          "Inferência da IA",
          "IA",
          "SUCESSO",
          inicio,
          { entrada: { config, seed: deps.seed }, saida },
          latencia,
        ));
        log("INFO", "IA", `Inferência concluída com confiança ${saida.confianca.toFixed(2)}.`, saida);
      }
    } catch (erro) {
      const tipo = ehErroIA(erro) ? erro.tipo : "EXCECAO";
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      motivoFallback = `IA falhou (${tipo}): ${mensagem}`;
      const extra = tipo === "TIMEOUT" ? (config.timeoutMs ?? 0) : latencia;
      registrar(passo(
        PIPELINE_STEP_IDS.Ia,
        "Inferência da IA",
        "IA",
        "ERRO",
        inicio,
        { motivo: motivoFallback, entrada: { config, seed: deps.seed } },
        extra,
      ));
      log("ERROR", "IA", motivoFallback);
    }
  }

  inicio = relogio();
  if (saidaIA) {
    if (saidaIA.confianca < regras.confiancaMinimaIA) {
      motivoFallback = `Confiança ${saidaIA.confianca.toFixed(2)} abaixo do mínimo ${regras.confiancaMinimaIA.toFixed(2)}.`;
      registrar(passo(
        PIPELINE_STEP_IDS.Confianca,
        "Verificar confiança",
        "CONTROLLER",
        "ALERTA",
        inicio,
        { motivo: motivoFallback, saida: { confianca: saidaIA.confianca } },
      ));
      log("WARN", "CONTROLLER", motivoFallback);
    } else {
      registrar(passo(
        PIPELINE_STEP_IDS.Confianca,
        "Verificar confiança",
        "CONTROLLER",
        "SUCESSO",
        inicio,
        { saida: { confianca: saidaIA.confianca, minimo: regras.confiancaMinimaIA } },
      ));
    }
  } else {
    registrar({
      id: PIPELINE_STEP_IDS.Confianca,
      label: "Verificar confiança",
      modulo: "CONTROLLER",
      status: "IGNORADO",
      duracaoMs: 0,
      motivo: "Sem saída válida da IA.",
    });
  }

  inicio = relogio();
  const usarFallback = motivoFallback !== undefined;
  let metricas: MetricasProducao;
  let recomendacao: string;
  let confianca: number;

  if (usarFallback || !saidaIA) {
    const fallback = engine.executarFallback(dados, regras);
    metricas = {
      produtividade: fallback.produtividade,
      taxaDefeitos: fallback.taxaDefeitos,
      eficiencia: fallback.eficiencia,
      conformidade: fallback.conformidade,
      previsaoFalhas: fallback.previsaoFalhas,
    };
    recomendacao = fallback.recomendacao;
    confianca = fallback.confianca;
    registrar(passo(
      PIPELINE_STEP_IDS.Fallback,
      "Fallback determinístico",
      "CALC",
      "SUCESSO",
      inicio,
      { motivo: motivoFallback, entrada: dados, saida: metricas },
    ));
    log("WARN", "CALC", `Fallback acionado. ${motivoFallback ?? ""}`.trim(), metricas);
  } else {
    metricas = {
      produtividade: saidaIA.produtividade,
      taxaDefeitos: saidaIA.taxaDefeitos,
      eficiencia: saidaIA.eficiencia,
      conformidade: saidaIA.conformidade,
      previsaoFalhas: saidaIA.previsaoFalhas,
    };
    recomendacao = saidaIA.recomendacao;
    confianca = saidaIA.confianca;
    registrar({
      id: PIPELINE_STEP_IDS.Fallback,
      label: "Fallback determinístico",
      modulo: "CALC",
      status: "IGNORADO",
      duracaoMs: 0,
      motivo: "IA respondeu com confiança suficiente.",
    });
  }

  inicio = relogio();
  const status = engine.classificar(metricas, regras);
  if (usarFallback) recomendacao = engine.gerarRecomendacao(status, metricas, dados, regras);
  registrar(passo(
    PIPELINE_STEP_IDS.Classificar,
    "Classificar resultado",
    "MODEL",
    status === "CRITICO" ? "ALERTA" : "SUCESSO",
    inicio,
    {
      ...(status === "CRITICO" ? { motivo: "Resultado crítico: alerta de qualidade." } : {}),
      entrada: metricas,
      saida: { status },
    },
  ));
  if (status === "CRITICO") {
    log("WARN", "MODEL", `Alerta de qualidade: lote ${dados.id} classificado como CRÍTICO.`);
  }

  const resultado: ResultadoAnalise = {
    id: novoId("res"),
    loteId: dados.id,
    ...metricas,
    status,
    recomendacao,
    origem: usarFallback ? "FALLBACK" : "IA",
    confianca,
    traceId,
    passos: [],
    erros: [],
    criadoEm: agora().toISOString(),
  };
  return persistirEFinalizar(resultado, true);

  function persistirEFinalizar(r: ResultadoAnalise, salvarLote: boolean): ResultadoAnalise {
    const inicioPersistencia = relogio();
    const stepPersistencia = passo(
      PIPELINE_STEP_IDS.Persistir,
      "Persistir resultado",
      "REPO",
      "SUCESSO",
      inicioPersistencia,
      {
        entrada: { resultadoId: r.id, loteId: r.loteId, salvarLote },
        ...(salvarLote ? {} : { motivo: "Apenas a rejeição foi registrada (lote inválido não é salvo)." }),
      },
    );
    const final: ResultadoAnalise = { ...r, passos: [...passos, stepPersistencia] };

    try {
      if (salvarLote) repositorio.registrarLote(dados);
      repositorio.registrarResultado(final);
      registrar(stepPersistencia);
      log("INFO", "REPO", `Resultado ${r.id} persistido.`);
    } catch (erro) {
      const motivo = `Falha ao persistir: ${erro instanceof Error ? erro.message : String(erro)}`;
      registrar({ ...stepPersistencia, status: "ERRO", motivo });
      final.passos = [...passos];
      log("ERROR", "REPO", motivo);
    }

    log("INFO", "CONTROLLER", `Análise concluída: ${final.status} (origem ${final.origem}).`, {
      status: final.status,
      origem: final.origem,
    });
    bus.emit({ tipo: "analise:fim", traceId, resultado: final });
    return final;
  }
}
