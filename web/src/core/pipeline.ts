/**
 * Orquestração do fluxo de análise e guard clauses.
 *
 * Dono: Membro 2 (Controlador). TypeScript puro, sem React.
 *
 * Princípio: "Validar primeiro, analisar depois". Dados inválidos são
 * barrados ANTES da IA. Se a IA falhar ou tiver baixa confiança, o
 * fallback determinístico assume.
 */
import type {
  AIProvider,
  AnalysisEngine,
  ConfigIA,
  EtapaValidacao,
  EventBus,
  GuardResult,
  Repository,
  ResultadoValidacao,
  SaidaBrutaIA,
} from "./contracts";
import { emitirLog } from "./eventBus";
import { ehErroIA, validarSaidaIA } from "./ia";
import { validarPeca } from "./rules";
import type {
  AnaliseInput,
  DadosProducaoAero,
  FlagsDev,
  MetricasProducao,
  ModuloSistema,
  PecaAeronautica,
  PipelineStep,
  RegrasAnaliseAero,
  ResultadoAnalise,
  StatusPasso,
  ValidationIssue,
} from "./types";
import { arredondar, gerarId as gerarIdPadrao } from "./utils";

/* ------------------------------------------------------------------ */
/* Guard clauses                                                       */
/* ------------------------------------------------------------------ */

export interface ContextoValidacao {
  regras: RegrasAnaliseAero;
  peca: PecaAeronautica | undefined;
  estrita: boolean;
  agora: Date;
}

/** Margem de segurança (fração da faixa) exigida na validação estrita. */
export const MARGEM_ESTRITA = 0.05;

function guarda(
  id: string,
  label: string,
  etapa: EtapaValidacao,
  modulo: ModuloSistema,
  issues: ValidationIssue[],
): GuardResult {
  return { id, label, etapa, modulo, aprovado: issues.length === 0, issues };
}

function erro(codigo: string, campo: string, mensagem: string, modulo: ModuloSistema = "CONTROLLER"): ValidationIssue {
  return { codigo, campo, mensagem, modulo };
}

const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Executa todas as guard clauses e retorna o resultado detalhado. */
export function validarEntrada(input: AnaliseInput, ctx: ContextoValidacao): ResultadoValidacao {
  const { regras } = ctx;
  const guardas: GuardResult[] = [];

  // Etapa 1 — campos obrigatórios.
  const camposIssues: ValidationIssue[] = [];
  if (!input.pecaId?.trim()) camposIssues.push(erro("CAMPO_OBRIGATORIO", "pecaId", "A peça é obrigatória."));
  if (!input.dataLote?.trim()) {
    camposIssues.push(erro("CAMPO_OBRIGATORIO", "dataLote", "A data do lote é obrigatória."));
  } else if (!DATA_ISO.test(input.dataLote) || Number.isNaN(Date.parse(input.dataLote))) {
    camposIssues.push(erro("DATA_FORMATO_INVALIDO", "dataLote", "A data do lote deve estar no formato AAAA-MM-DD."));
  }
  guardas.push(guarda("campos-obrigatorios", "Peça e data informadas", "campos", "CONTROLLER", camposIssues));

  const horasIssues: ValidationIssue[] = [];
  if (!Number.isFinite(input.horas) || input.horas <= 0) {
    horasIssues.push(erro("HORAS_INVALIDAS", "horas", "As horas de produção devem ser maiores que 0."));
  }
  guardas.push(guarda("horas", "Horas de produção > 0", "campos", "CONTROLLER", horasIssues));

  if (ctx.estrita) {
    const dataIssues: ValidationIssue[] = [];
    const data = Date.parse(`${input.dataLote}T00:00:00`);
    if (Number.isFinite(data) && data > ctx.agora.getTime()) {
      dataIssues.push(erro("DATA_FUTURA", "dataLote", "Validação estrita: a data do lote não pode ser futura."));
    }
    guardas.push(guarda("data-nao-futura", "[Estrita] Data não futura", "campos", "CONTROLLER", dataIssues));
  }

  // Etapa 2 — peça.
  const pecaIssues: ValidationIssue[] = [];
  if (input.pecaId?.trim()) {
    if (!ctx.peca) {
      pecaIssues.push(erro("PECA_NAO_ENCONTRADA", "pecaId", `A peça ${input.pecaId} não foi encontrada.`, "MODEL"));
    } else {
      pecaIssues.push(...validarPeca(ctx.peca));
    }
  } else {
    pecaIssues.push(erro("PECA_NAO_INFORMADA", "pecaId", "Não há peça para validar.", "MODEL"));
  }
  guardas.push(guarda("peca-conforme", "Peça existe e está conforme", "peca", "MODEL", pecaIssues));

  // Etapa 3 — lote.
  const qtdIssues: ValidationIssue[] = [];
  if (!Number.isFinite(input.quantidade) || !Number.isInteger(input.quantidade) || input.quantidade <= 0) {
    qtdIssues.push(erro("QUANTIDADE_INVALIDA", "quantidade", "A quantidade deve ser um número inteiro maior que 0."));
  }
  guardas.push(guarda("quantidade", "Quantidade inteira > 0", "lote", "CONTROLLER", qtdIssues));

  const defIssues: ValidationIssue[] = [];
  if (!Number.isFinite(input.defeituosos) || !Number.isInteger(input.defeituosos) || input.defeituosos < 0) {
    defIssues.push(erro("DEFEITUOSOS_INVALIDOS", "defeituosos", "Defeituosos deve ser um número inteiro ≥ 0."));
  } else if (Number.isFinite(input.quantidade) && input.defeituosos > input.quantidade) {
    defIssues.push(
      erro("DEFEITUOSOS_EXCEDEM_QUANTIDADE", "defeituosos", "Defeituosos não pode ser maior que a quantidade produzida."),
    );
  }
  guardas.push(guarda("defeituosos", "0 ≤ defeituosos ≤ quantidade", "lote", "CONTROLLER", defIssues));

  const tempIssues: ValidationIssue[] = [];
  if (!Number.isFinite(input.temperatura)) {
    tempIssues.push(erro("TEMPERATURA_OBRIGATORIA", "temperatura", "A temperatura é obrigatória."));
  } else if (input.temperatura < regras.temperaturaMin || input.temperatura > regras.temperaturaMax) {
    tempIssues.push(
      erro(
        "TEMPERATURA_FORA_DA_FAIXA",
        "temperatura",
        `Temperatura ${input.temperatura} °C fora da faixa ${regras.temperaturaMin}–${regras.temperaturaMax} °C.`,
      ),
    );
  }
  guardas.push(
    guarda("temperatura", `Temperatura ${regras.temperaturaMin}–${regras.temperaturaMax} °C`, "lote", "CONTROLLER", tempIssues),
  );

  const presIssues: ValidationIssue[] = [];
  if (!Number.isFinite(input.pressao)) {
    presIssues.push(erro("PRESSAO_OBRIGATORIA", "pressao", "A pressão é obrigatória."));
  } else if (input.pressao < regras.pressaoMin || input.pressao > regras.pressaoMax) {
    presIssues.push(
      erro(
        "PRESSAO_FORA_DA_FAIXA",
        "pressao",
        `Pressão ${input.pressao} bar fora da faixa ${regras.pressaoMin}–${regras.pressaoMax} bar.`,
      ),
    );
  }
  guardas.push(guarda("pressao", `Pressão ${regras.pressaoMin}–${regras.pressaoMax} bar`, "lote", "CONTROLLER", presIssues));

  if (ctx.estrita) {
    const margemIssues: ValidationIssue[] = [];
    const margemT = (regras.temperaturaMax - regras.temperaturaMin) * MARGEM_ESTRITA;
    const margemP = (regras.pressaoMax - regras.pressaoMin) * MARGEM_ESTRITA;
    if (
      tempIssues.length === 0 &&
      (input.temperatura < regras.temperaturaMin + margemT || input.temperatura > regras.temperaturaMax - margemT)
    ) {
      margemIssues.push(
        erro("MARGEM_TEMPERATURA", "temperatura", "Validação estrita: temperatura a menos de 5% do limite da faixa."),
      );
    }
    if (presIssues.length === 0 && (input.pressao < regras.pressaoMin + margemP || input.pressao > regras.pressaoMax - margemP)) {
      margemIssues.push(erro("MARGEM_PRESSAO", "pressao", "Validação estrita: pressão a menos de 5% do limite da faixa."));
    }
    guardas.push(guarda("margem-seguranca", "[Estrita] Margem de 5% dos limites", "lote", "CONTROLLER", margemIssues));
  }

  const erros = guardas.flatMap((g) => g.issues);
  return { valido: erros.length === 0, guardas, erros };
}

/* ------------------------------------------------------------------ */
/* Orquestração                                                        */
/* ------------------------------------------------------------------ */

export interface DependenciasPipeline {
  repositorio: Repository;
  ia: AIProvider;
  engine: AnalysisEngine;
  bus: EventBus;
  regras: RegrasAnaliseAero;
  flags: FlagsDev;
  configIA: ConfigIA;
  seed: number;
  /** Latência artificial (ms) somada ao passo da IA. */
  latenciaMs?: number;
  agora?: () => Date;
  relogio?: () => number;
  gerarId?: (prefixo: string) => string;
}

export const MOTIVO_INTERRUPCAO = "Interrompido: validação reprovada (validar primeiro, analisar depois).";

const relogioPadrao = (): number => (typeof performance !== "undefined" ? performance.now() : Date.now());

const ROTULO_ETAPA: Record<EtapaValidacao, { id: string; label: string; modulo: ModuloSistema }> = {
  campos: { id: "validar-campos", label: "Validar campos obrigatórios", modulo: "CONTROLLER" },
  peca: { id: "validar-peca", label: "Validar peça", modulo: "MODEL" },
  lote: { id: "validar-lote", label: "Validar lote (faixas)", modulo: "CONTROLLER" },
};

const METRICAS_ZERADAS: MetricasProducao = {
  produtividade: 0,
  taxaDefeitos: 0,
  eficiencia: 0,
  conformidade: 0,
  previsaoFalhas: 0,
};

/**
 * Executa o fluxo completo:
 * validar → IA → confiança → fallback → classificar → persistir.
 * Emite `PipelineStep` e `LogEvent` no bus a cada etapa.
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
  ): PipelineStep => ({
    id,
    label,
    modulo,
    status,
    duracaoMs: arredondar(relogio() - inicio + duracaoExtraMs),
    ...extra,
  });

  bus.emit({ tipo: "analise:inicio", traceId, input });
  log("INFO", "VIEW", "Análise solicitada.", input);

  // 1. Entrada.
  let t = relogio();
  const loteId = input.loteId?.trim() ? input.loteId : novoId("L");
  const dados: DadosProducaoAero = {
    id: loteId,
    pecaId: input.pecaId,
    dataLote: input.dataLote,
    quantidade: input.quantidade,
    defeituosos: input.defeituosos,
    horas: input.horas,
    temperatura: input.temperatura,
    pressao: input.pressao,
  };
  registrar(passo("entrada", "Receber entrada do operador", "VIEW", "SUCESSO", t, { entrada: input, saida: dados }));

  // 2–4. Validação (guard clauses).
  t = relogio();
  const peca = input.pecaId ? repositorio.buscarPeca(input.pecaId) : undefined;
  const validacao = validarEntrada(input, { regras, peca, estrita: flags.validacaoEstrita, agora: agora() });
  for (const etapa of ["campos", "peca", "lote"] as const) {
    const guardas = validacao.guardas.filter((g) => g.etapa === etapa);
    const issues = guardas.flatMap((g) => g.issues);
    const meta = ROTULO_ETAPA[etapa];
    registrar(
      passo(meta.id, meta.label, meta.modulo, issues.length ? "ERRO" : "SUCESSO", t, {
        ...(issues.length ? { motivo: issues.map((i) => i.mensagem).join(" ") } : {}),
        entrada: etapa === "peca" ? (peca ?? input.pecaId) : dados,
        saida: guardas,
      }),
    );
    for (const i of issues) log("WARN", i.modulo, `Guard clause reprovada [${i.codigo}]: ${i.mensagem}`, i);
    t = relogio();
  }

  if (!validacao.valido) {
    for (const [id, label, modulo] of [
      ["ia", "Inferência da IA", "IA"],
      ["confianca", "Verificar confiança", "CONTROLLER"],
      ["fallback", "Fallback determinístico", "CALC"],
      ["classificar", "Classificar resultado", "MODEL"],
    ] as const) {
      registrar({ id, label, modulo, status: "IGNORADO", duracaoMs: 0, motivo: MOTIVO_INTERRUPCAO });
    }
    log("WARN", "CONTROLLER", `Entrada rejeitada antes da IA (${validacao.erros.length} erro(s)).`, validacao.erros);

    const resultado: ResultadoAnalise = {
      id: novoId("res"),
      loteId,
      ...METRICAS_ZERADAS,
      status: "CRITICO",
      recomendacao: `Entrada rejeitada: ${validacao.erros.map((e) => e.mensagem).join(" ")} Corrija os dados e envie novamente.`,
      origem: "VALIDACAO",
      confianca: 0,
      traceId,
      passos: [],
      erros: validacao.erros,
      criadoEm: agora().toISOString(),
    };
    return persistirEFinalizar(resultado, false);
  }

  // 5. IA.
  let saidaIA: SaidaBrutaIA | undefined;
  let motivoFallback: string | undefined;
  t = relogio();
  if (flags.forcarFallback) {
    motivoFallback = "Flag \"forçar fallback\" ativa.";
    registrar({ id: "ia", label: "Inferência da IA", modulo: "IA", status: "IGNORADO", duracaoMs: 0, motivo: motivoFallback });
    log("INFO", "IA", "IA ignorada: flag forçar fallback ativa.");
  } else {
    const config: ConfigIA = flags.forcarFalhaIA ? { ...deps.configIA, modoFalha: "EXCECAO" } : deps.configIA;
    const latencia = flags.latenciaSimulada ? (deps.latenciaMs ?? 0) : 0;
    const requisicao = { dados, peca: peca as PecaAeronautica, regras, config, seed: deps.seed };
    try {
      const saida = ia.inferir(requisicao);
      const problemas = validarSaidaIA(saida);
      if (problemas.length) {
        motivoFallback = `Saída inválida da IA: ${problemas.join("; ")}.`;
        registrar(passo("ia", "Inferência da IA", "IA", "ERRO", t, { motivo: motivoFallback, entrada: { config, seed: deps.seed }, saida }, latencia));
        log("ERROR", "IA", motivoFallback, saida);
      } else {
        saidaIA = saida;
        registrar(passo("ia", "Inferência da IA", "IA", "SUCESSO", t, { entrada: { config, seed: deps.seed }, saida }, latencia));
        log("INFO", "IA", `Inferência concluída com confiança ${saida.confianca.toFixed(2)}.`, saida);
      }
    } catch (e) {
      const tipo = ehErroIA(e) ? e.tipo : "EXCECAO";
      const mensagem = e instanceof Error ? e.message : String(e);
      motivoFallback = `IA falhou (${tipo}): ${mensagem}`;
      const extra = tipo === "TIMEOUT" ? (config.timeoutMs ?? 0) : latencia;
      registrar(passo("ia", "Inferência da IA", "IA", "ERRO", t, { motivo: motivoFallback, entrada: { config, seed: deps.seed } }, extra));
      log("ERROR", "IA", motivoFallback);
    }
  }

  // 6. Confiança.
  t = relogio();
  if (saidaIA) {
    if (saidaIA.confianca < regras.confiancaMinimaIA) {
      motivoFallback = `Confiança ${saidaIA.confianca.toFixed(2)} abaixo do mínimo ${regras.confiancaMinimaIA.toFixed(2)}.`;
      registrar(passo("confianca", "Verificar confiança", "CONTROLLER", "ALERTA", t, { motivo: motivoFallback, saida: { confianca: saidaIA.confianca } }));
      log("WARN", "CONTROLLER", motivoFallback);
    } else {
      registrar(passo("confianca", "Verificar confiança", "CONTROLLER", "SUCESSO", t, { saida: { confianca: saidaIA.confianca, minimo: regras.confiancaMinimaIA } }));
    }
  } else {
    registrar({ id: "confianca", label: "Verificar confiança", modulo: "CONTROLLER", status: "IGNORADO", duracaoMs: 0, motivo: "Sem saída válida da IA." });
  }

  // 7. Fallback.
  t = relogio();
  const usarFallback = motivoFallback !== undefined;
  let metricas: MetricasProducao;
  let recomendacao: string;
  let confianca: number;
  if (usarFallback || !saidaIA) {
    const fb = engine.executarFallback(dados, regras);
    metricas = {
      produtividade: fb.produtividade,
      taxaDefeitos: fb.taxaDefeitos,
      eficiencia: fb.eficiencia,
      conformidade: fb.conformidade,
      previsaoFalhas: fb.previsaoFalhas,
    };
    recomendacao = fb.recomendacao;
    confianca = fb.confianca;
    registrar(passo("fallback", "Fallback determinístico", "CALC", "SUCESSO", t, { motivo: motivoFallback, entrada: dados, saida: metricas }));
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
    registrar({ id: "fallback", label: "Fallback determinístico", modulo: "CALC", status: "IGNORADO", duracaoMs: 0, motivo: "IA respondeu com confiança suficiente." });
  }

  // 8. Classificação.
  t = relogio();
  const status = engine.classificar(metricas, regras);
  if (usarFallback) recomendacao = engine.gerarRecomendacao(status, metricas, dados, regras);
  registrar(passo("classificar", "Classificar resultado", "MODEL", status === "CRITICO" ? "ALERTA" : "SUCESSO", t, {
    ...(status === "CRITICO" ? { motivo: "Resultado crítico: alerta de qualidade." } : {}),
    entrada: metricas,
    saida: { status },
  }));
  if (status === "CRITICO") log("WARN", "MODEL", `Alerta de qualidade: lote ${loteId} classificado como CRÍTICO.`);

  const resultado: ResultadoAnalise = {
    id: novoId("res"),
    loteId,
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

  // 9. Persistência (função auxiliar com acesso ao escopo).
  function persistirEFinalizar(r: ResultadoAnalise, salvarLote: boolean): ResultadoAnalise {
    const inicio = relogio();
    const stepOk = passo("persistir", "Persistir resultado", "REPO", "SUCESSO", inicio, {
      entrada: { resultadoId: r.id, loteId: r.loteId, salvarLote },
      ...(salvarLote ? {} : { motivo: "Apenas a rejeição foi registrada (lote inválido não é salvo)." }),
    });
    const final: ResultadoAnalise = { ...r, passos: [...passos, stepOk] };
    try {
      if (salvarLote) repositorio.registrarLote(dados);
      repositorio.registrarResultado(final);
      registrar(stepOk);
      log("INFO", "REPO", `Resultado ${r.id} persistido.`);
    } catch (e) {
      const motivo = `Falha ao persistir: ${e instanceof Error ? e.message : String(e)}`;
      registrar({ ...stepOk, status: "ERRO", motivo });
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

