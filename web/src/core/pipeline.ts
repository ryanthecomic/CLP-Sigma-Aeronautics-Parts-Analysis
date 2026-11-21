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
<<<<<<< HEAD
import {
  criarDadosLote,
  criarPasso,
  METRICAS_ZERADAS,
  PIPELINE_STEP_IDS,
  registrarPassosInterrompidos,
  relogioPadrao,
  ROTULO_ETAPA,
} from "./pipelineSteps";
=======
import { validarPeca } from "./rules";
import {
  ModoFalhaIA,
  ModuloSistema,
  NivelLog,
  OrigemResultado,
  PipelineStepId,
  StatusPasso,
  StatusQualidade,
} from "./types";
>>>>>>> f4913061195fb7f573ac498d4a89f1d3b587216a
import type {
  AnaliseInput,
  FlagsDev,
  MetricasProducao,
  PecaAeronautica,
  PipelineStep,
  RegrasAnaliseAero,
  ResultadoAnalise,
<<<<<<< HEAD
  StatusPasso,
=======
  ValidationIssue,
>>>>>>> f4913061195fb7f573ac498d4a89f1d3b587216a
} from "./types";
import { gerarId as gerarIdPadrao } from "./utils";

<<<<<<< HEAD
export { MARGEM_ESTRITA, validarEntrada } from "./guardClauses";
export type { ContextoValidacao } from "./guardClauses";
export { MOTIVO_INTERRUPCAO, PIPELINE_STEP_IDS } from "./pipelineSteps";
=======
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

function erro(codigo: string, campo: string, mensagem: string, modulo: ModuloSistema = ModuloSistema.CONTROLLER): ValidationIssue {
  return { codigo, campo, mensagem, modulo };
}

const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;

function textoObrigatorio(valor: unknown): valor is string {
  return typeof valor === "string" && valor.trim().length > 0;
}

function dataIsoValida(valor: unknown): valor is string {
  if (typeof valor !== "string" || !DATA_ISO.test(valor)) return false;
  const [ano, mes, dia] = valor.split("-").map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  return data.getUTCFullYear() === ano && data.getUTCMonth() === mes - 1 && data.getUTCDate() === dia;
}

/** Executa todas as guard clauses e retorna o resultado detalhado. */
export function validarEntrada(input: AnaliseInput, ctx: ContextoValidacao): ResultadoValidacao {
  const { regras } = ctx;
  const guardas: GuardResult[] = [];
  const pecaId = textoObrigatorio(input.pecaId) ? input.pecaId.trim() : "";
  const dataLote = textoObrigatorio(input.dataLote) ? input.dataLote.trim() : "";

  // Etapa 1 — campos obrigatórios.
  const camposIssues: ValidationIssue[] = [];
  if (!pecaId) camposIssues.push(erro("CAMPO_OBRIGATORIO", "pecaId", "A peça é obrigatória."));
  if (!dataLote) {
    camposIssues.push(erro("CAMPO_OBRIGATORIO", "dataLote", "A data do lote é obrigatória."));
  } else if (!dataIsoValida(dataLote)) {
    camposIssues.push(erro("DATA_FORMATO_INVALIDO", "dataLote", "A data do lote deve estar no formato AAAA-MM-DD."));
  }
  guardas.push(guarda("campos-obrigatorios", "Peça e data informadas", "campos", ModuloSistema.CONTROLLER, camposIssues));

  const horasIssues: ValidationIssue[] = [];
  if (!Number.isFinite(input.horas) || input.horas <= 0) {
    horasIssues.push(erro("HORAS_INVALIDAS", "horas", "As horas de produção devem ser maiores que 0."));
  }
  guardas.push(guarda("horas", "Horas de produção > 0", "campos", ModuloSistema.CONTROLLER, horasIssues));

  if (ctx.estrita) {
    const dataIssues: ValidationIssue[] = [];
    const data = Date.parse(`${dataLote}T00:00:00Z`);
    if (Number.isFinite(data) && data > ctx.agora.getTime()) {
      dataIssues.push(erro("DATA_FUTURA", "dataLote", "Validação estrita: a data do lote não pode ser futura."));
    }
    guardas.push(guarda("data-nao-futura", "[Estrita] Data não futura", "campos", ModuloSistema.CONTROLLER, dataIssues));
  }

  // Etapa 2 — peça.
  const pecaIssues: ValidationIssue[] = [];
  if (pecaId) {
    if (!ctx.peca) {
      pecaIssues.push(erro("PECA_NAO_ENCONTRADA", "pecaId", `A peça ${pecaId} não foi encontrada.`, ModuloSistema.MODEL));
    } else {
      pecaIssues.push(...validarPeca(ctx.peca));
    }
  } else {
    pecaIssues.push(erro("PECA_NAO_INFORMADA", "pecaId", "Não há peça para validar.", ModuloSistema.MODEL));
  }
  guardas.push(guarda("peca-conforme", "Peça existe e está conforme", "peca", ModuloSistema.MODEL, pecaIssues));

  // Etapa 3 — lote.
  const qtdIssues: ValidationIssue[] = [];
  if (!Number.isFinite(input.quantidade) || !Number.isInteger(input.quantidade) || input.quantidade <= 0) {
    qtdIssues.push(erro("QUANTIDADE_INVALIDA", "quantidade", "A quantidade deve ser um número inteiro maior que 0."));
  }
  guardas.push(guarda("quantidade", "Quantidade inteira > 0", "lote", ModuloSistema.CONTROLLER, qtdIssues));

  const defIssues: ValidationIssue[] = [];
  if (!Number.isFinite(input.defeituosos) || !Number.isInteger(input.defeituosos) || input.defeituosos < 0) {
    defIssues.push(erro("DEFEITUOSOS_INVALIDOS", "defeituosos", "Defeituosos deve ser um número inteiro ≥ 0."));
  } else if (Number.isFinite(input.quantidade) && input.defeituosos > input.quantidade) {
    defIssues.push(
      erro("DEFEITUOSOS_EXCEDEM_QUANTIDADE", "defeituosos", "Defeituosos não pode ser maior que a quantidade produzida."),
    );
  }
  guardas.push(guarda("defeituosos", "0 ≤ defeituosos ≤ quantidade", "lote", ModuloSistema.CONTROLLER, defIssues));

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
    guarda("temperatura", `Temperatura ${regras.temperaturaMin}–${regras.temperaturaMax} °C`, "lote", ModuloSistema.CONTROLLER, tempIssues),
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
  guardas.push(guarda("pressao", `Pressão ${regras.pressaoMin}–${regras.pressaoMax} bar`, "lote", ModuloSistema.CONTROLLER, presIssues));

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
    guardas.push(guarda("margem-seguranca", "[Estrita] Margem de 5% dos limites", "lote", ModuloSistema.CONTROLLER, margemIssues));
  }

  const erros = guardas.flatMap((g) => g.issues);
  return { valido: erros.length === 0, guardas, erros };
}

/* ------------------------------------------------------------------ */
/* Orquestração                                                        */
/* ------------------------------------------------------------------ */
>>>>>>> f4913061195fb7f573ac498d4a89f1d3b587216a

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

<<<<<<< HEAD
=======
export const MOTIVO_INTERRUPCAO = "Interrompido: validação reprovada (validar primeiro, analisar depois).";

const relogioPadrao = (): number => (typeof performance !== "undefined" ? performance.now() : Date.now());

enum PipelineStepId {
  Entrada = "entrada",
  ValidarCampos = "validar-campos",
  ValidarPeca = "validar-peca",
  ValidarLote = "validar-lote",
  Ia = "ia",
  Confianca = "confianca",
  Fallback = "fallback",
  Classificar = "classificar",
  Persistir = "persistir",
}

const ROTULO_ETAPA: Record<EtapaValidacao, { id: string; label: string; modulo: ModuloSistema }> = {
  campos: { id: PipelineStepId.ValidarCampos, label: "Validar campos obrigatórios", modulo: ModuloSistema.CONTROLLER },
  peca: { id: PipelineStepId.ValidarPeca, label: "Validar peça", modulo: ModuloSistema.MODEL },
  lote: { id: PipelineStepId.ValidarLote, label: "Validar lote (faixas)", modulo: ModuloSistema.CONTROLLER },
};

const METRICAS_ZERADAS: MetricasProducao = {
  produtividade: 0,
  taxaDefeitos: 0,
  eficiencia: 0,
  conformidade: 0,
  previsaoFalhas: 0,
};

>>>>>>> f4913061195fb7f573ac498d4a89f1d3b587216a
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
  const pecaId = textoObrigatorio(input.pecaId) ? input.pecaId.trim() : "";
  const dataLote = textoObrigatorio(input.dataLote) ? input.dataLote.trim() : "";
  const passos: PipelineStep[] = [];
  const log = (
    nivel: NivelLog,
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
  log(NivelLog.INFO, ModuloSistema.VIEW, "Análise solicitada.", input);

<<<<<<< HEAD
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

=======
  // 1. Entrada.
  let t = relogio();
  const loteId = textoObrigatorio(input.loteId) ? input.loteId.trim() : novoId("L");
  const dados: DadosProducaoAero = {
    id: loteId,
    pecaId,
    dataLote,
    quantidade: input.quantidade,
    defeituosos: input.defeituosos,
    horas: input.horas,
    temperatura: input.temperatura,
    pressao: input.pressao,
  };
  registrar(passo(PipelineStepId.Entrada, "Receber entrada do operador", ModuloSistema.VIEW, StatusPasso.SUCESSO, t, { entrada: input, saida: dados }));

  // 2–4. Validação (guard clauses).
  t = relogio();
  const peca = pecaId ? repositorio.buscarPeca(pecaId) : undefined;
  const validacao = validarEntrada(input, { regras, peca, estrita: flags.validacaoEstrita, agora: agora() });
>>>>>>> f4913061195fb7f573ac498d4a89f1d3b587216a
  for (const etapa of ["campos", "peca", "lote"] as const) {
    const guardas = validacao.guardas.filter((guard) => guard.etapa === etapa);
    const issues = guardas.flatMap((guard) => guard.issues);
    const meta = ROTULO_ETAPA[etapa];
    registrar(
<<<<<<< HEAD
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
=======
      passo(meta.id, meta.label, meta.modulo, issues.length ? StatusPasso.ERRO : StatusPasso.SUCESSO, t, {
        ...(issues.length ? { motivo: issues.map((i) => i.mensagem).join(" ") } : {}),
        entrada: etapa === "peca" ? (peca ?? pecaId) : dados,
        saida: guardas,
      }),
    );
    for (const i of issues) log(NivelLog.WARN, i.modulo, `Guard clause reprovada [${i.codigo}]: ${i.mensagem}`, i);
    t = relogio();
  }

  if (!validacao.valido) {
    for (const [id, label, modulo] of [
      [PipelineStepId.Ia, "Inferência da IA", ModuloSistema.IA],
      [PipelineStepId.Confianca, "Verificar confiança", ModuloSistema.CONTROLLER],
      [PipelineStepId.Fallback, "Fallback determinístico", ModuloSistema.CALC],
      [PipelineStepId.Classificar, "Classificar resultado", ModuloSistema.MODEL],
    ] as const) {
      registrar({ id, label, modulo, status: StatusPasso.IGNORADO, duracaoMs: 0, motivo: MOTIVO_INTERRUPCAO });
    }
    log(NivelLog.WARN, ModuloSistema.CONTROLLER, `Entrada rejeitada antes da IA (${validacao.erros.length} erro(s)).`, validacao.erros);
>>>>>>> f4913061195fb7f573ac498d4a89f1d3b587216a

    const resultado: ResultadoAnalise = {
      id: novoId("res"),
      loteId: dados.id,
      ...METRICAS_ZERADAS,
<<<<<<< HEAD
      status: "CRITICO",
      recomendacao: `Entrada rejeitada: ${validacao.erros.map((erro) => erro.mensagem).join(" ")} Corrija os dados e envie novamente.`,
      origem: "VALIDACAO",
=======
      status: StatusQualidade.CRITICO,
      recomendacao: `Entrada rejeitada: ${validacao.erros.map((e) => e.mensagem).join(" ")} Corrija os dados e envie novamente.`,
      origem: OrigemResultado.VALIDACAO,
>>>>>>> f4913061195fb7f573ac498d4a89f1d3b587216a
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
<<<<<<< HEAD
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
=======
    registrar({ id: PipelineStepId.Ia, label: "Inferência da IA", modulo: ModuloSistema.IA, status: StatusPasso.IGNORADO, duracaoMs: 0, motivo: motivoFallback });
    log(NivelLog.INFO, ModuloSistema.IA, "IA ignorada: flag forçar fallback ativa.");
  } else {
    const config: ConfigIA = flags.forcarFalhaIA ? { ...deps.configIA, modoFalha: ModoFalhaIA.EXCECAO } : deps.configIA;
>>>>>>> f4913061195fb7f573ac498d4a89f1d3b587216a
    const latencia = flags.latenciaSimulada ? (deps.latenciaMs ?? 0) : 0;
    const requisicao = { dados, peca: peca as PecaAeronautica, regras, config, seed: deps.seed };

    try {
      const saida = ia.inferir(requisicao);
      const problemas = validarSaidaIA(saida);
      if (problemas.length) {
        motivoFallback = `Saída inválida da IA: ${problemas.join("; ")}.`;
<<<<<<< HEAD
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
=======
        registrar(passo(PipelineStepId.Ia, "Inferência da IA", ModuloSistema.IA, StatusPasso.ERRO, t, { motivo: motivoFallback, entrada: { config, seed: deps.seed }, saida }, latencia));
        log(NivelLog.ERROR, ModuloSistema.IA, motivoFallback, saida);
      } else {
        saidaIA = saida;
        registrar(passo(PipelineStepId.Ia, "Inferência da IA", ModuloSistema.IA, StatusPasso.SUCESSO, t, { entrada: { config, seed: deps.seed }, saida }, latencia));
        log(NivelLog.INFO, ModuloSistema.IA, `Inferência concluída com confiança ${saida.confianca.toFixed(2)}.`, saida);
>>>>>>> f4913061195fb7f573ac498d4a89f1d3b587216a
      }
    } catch (erro) {
      const tipo = ehErroIA(erro) ? erro.tipo : "EXCECAO";
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      motivoFallback = `IA falhou (${tipo}): ${mensagem}`;
      const extra = tipo === "TIMEOUT" ? (config.timeoutMs ?? 0) : latencia;
<<<<<<< HEAD
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
=======
      registrar(passo(PipelineStepId.Ia, "Inferência da IA", ModuloSistema.IA, StatusPasso.ERRO, t, { motivo: motivoFallback, entrada: { config, seed: deps.seed } }, extra));
      log(NivelLog.ERROR, ModuloSistema.IA, motivoFallback);
>>>>>>> f4913061195fb7f573ac498d4a89f1d3b587216a
    }
  }

  inicio = relogio();
  if (saidaIA) {
    if (saidaIA.confianca < regras.confiancaMinimaIA) {
      motivoFallback = `Confiança ${saidaIA.confianca.toFixed(2)} abaixo do mínimo ${regras.confiancaMinimaIA.toFixed(2)}.`;
<<<<<<< HEAD
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
=======
      registrar(passo(PipelineStepId.Confianca, "Verificar confiança", ModuloSistema.CONTROLLER, StatusPasso.ALERTA, t, { motivo: motivoFallback, saida: { confianca: saidaIA.confianca } }));
      log(NivelLog.WARN, ModuloSistema.CONTROLLER, motivoFallback);
    } else {
      registrar(passo(PipelineStepId.Confianca, "Verificar confiança", ModuloSistema.CONTROLLER, StatusPasso.SUCESSO, t, { saida: { confianca: saidaIA.confianca, minimo: regras.confiancaMinimaIA } }));
    }
  } else {
    registrar({ id: PipelineStepId.Confianca, label: "Verificar confiança", modulo: ModuloSistema.CONTROLLER, status: StatusPasso.IGNORADO, duracaoMs: 0, motivo: "Sem saída válida da IA." });
>>>>>>> f4913061195fb7f573ac498d4a89f1d3b587216a
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
<<<<<<< HEAD
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
=======
    recomendacao = fb.recomendacao;
    confianca = fb.confianca;
    registrar(passo(PipelineStepId.Fallback, "Fallback determinístico", ModuloSistema.CALC, StatusPasso.SUCESSO, t, { motivo: motivoFallback, entrada: dados, saida: metricas }));
    log(NivelLog.WARN, ModuloSistema.CALC, `Fallback acionado. ${motivoFallback ?? ""}`.trim(), metricas);
>>>>>>> f4913061195fb7f573ac498d4a89f1d3b587216a
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
<<<<<<< HEAD
    registrar({
      id: PIPELINE_STEP_IDS.Fallback,
      label: "Fallback determinístico",
      modulo: "CALC",
      status: "IGNORADO",
      duracaoMs: 0,
      motivo: "IA respondeu com confiança suficiente.",
    });
=======
    registrar({ id: PipelineStepId.Fallback, label: "Fallback determinístico", modulo: ModuloSistema.CALC, status: StatusPasso.IGNORADO, duracaoMs: 0, motivo: "IA respondeu com confiança suficiente." });
>>>>>>> f4913061195fb7f573ac498d4a89f1d3b587216a
  }

  inicio = relogio();
  const status = engine.classificar(metricas, regras);
  if (usarFallback) recomendacao = engine.gerarRecomendacao(status, metricas, dados, regras);
<<<<<<< HEAD
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
=======
  registrar(passo(PipelineStepId.Classificar, "Classificar resultado", ModuloSistema.MODEL, status === StatusQualidade.CRITICO ? StatusPasso.ALERTA : StatusPasso.SUCESSO, t, {
    ...(status === StatusQualidade.CRITICO ? { motivo: "Resultado crítico: alerta de qualidade." } : {}),
    entrada: metricas,
    saida: { status },
  }));
  if (status === StatusQualidade.CRITICO) log(NivelLog.WARN, ModuloSistema.MODEL, `Alerta de qualidade: lote ${loteId} classificado como CRÍTICO.`);
>>>>>>> f4913061195fb7f573ac498d4a89f1d3b587216a

  const resultado: ResultadoAnalise = {
    id: novoId("res"),
    loteId: dados.id,
    ...metricas,
    status,
    recomendacao,
    origem: usarFallback ? OrigemResultado.FALLBACK : OrigemResultado.IA,
    confianca,
    traceId,
    passos: [],
    erros: [],
    criadoEm: agora().toISOString(),
  };
  return persistirEFinalizar(resultado, true);

  function persistirEFinalizar(r: ResultadoAnalise, salvarLote: boolean): ResultadoAnalise {
<<<<<<< HEAD
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
=======
    const inicio = relogio();
    const stepOk = passo(PipelineStepId.Persistir, "Persistir resultado", ModuloSistema.REPO, StatusPasso.SUCESSO, inicio, {
      entrada: { resultadoId: r.id, loteId: r.loteId, salvarLote },
      ...(salvarLote ? {} : { motivo: "Apenas a rejeição foi registrada (lote inválido não é salvo)." }),
    });
    const final: ResultadoAnalise = { ...r, passos: [...passos, stepOk] };
    try {
      if (salvarLote) repositorio.registrarLote(dados);
      repositorio.registrarResultado(final);
      registrar(stepOk);
      log(NivelLog.INFO, ModuloSistema.REPO, `Resultado ${r.id} persistido.`);
    } catch (e) {
      const motivo = `Falha ao persistir: ${e instanceof Error ? e.message : String(e)}`;
      registrar({ ...stepOk, status: StatusPasso.ERRO, motivo });
>>>>>>> f4913061195fb7f573ac498d4a89f1d3b587216a
      final.passos = [...passos];
      log(NivelLog.ERROR, ModuloSistema.REPO, motivo);
    }
<<<<<<< HEAD

    log("INFO", "CONTROLLER", `Análise concluída: ${final.status} (origem ${final.origem}).`, {
=======
    log(NivelLog.INFO, ModuloSistema.CONTROLLER, `Análise concluída: ${final.status} (origem ${final.origem}).`, {
>>>>>>> f4913061195fb7f573ac498d4a89f1d3b587216a
      status: final.status,
      origem: final.origem,
    });
    bus.emit({ tipo: "analise:fim", traceId, resultado: final });
    return final;
  }
}
