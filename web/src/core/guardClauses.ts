import type { GuardResult, ResultadoValidacao } from "./contracts";
import { validarPeca } from "./rules";
import type {
  AnaliseInput,
  ModuloSistema,
  PecaAeronautica,
  RegrasAnaliseAero,
  ValidationIssue,
} from "./types";

export interface ContextoValidacao {
  regras: RegrasAnaliseAero;
  peca: PecaAeronautica | undefined;
  estrita: boolean;
  agora: Date;
}

export const MARGEM_ESTRITA = 0.05;

function guarda(
  id: string,
  label: string,
  etapa: "campos" | "peca" | "lote",
  modulo: ModuloSistema,
  issues: ValidationIssue[],
): GuardResult {
  return { id, label, etapa, modulo, aprovado: issues.length === 0, issues };
}

function erro(
  codigo: string,
  campo: string,
  mensagem: string,
  modulo: ModuloSistema = "CONTROLLER",
): ValidationIssue {
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

  const camposIssues: ValidationIssue[] = [];
  if (!pecaId) camposIssues.push(erro("CAMPO_OBRIGATORIO", "pecaId", "A peça é obrigatória."));
  if (!dataLote) {
    camposIssues.push(erro("CAMPO_OBRIGATORIO", "dataLote", "A data do lote é obrigatória."));
  } else if (!dataIsoValida(dataLote)) {
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
    const data = Date.parse(`${dataLote}T00:00:00Z`);
    if (Number.isFinite(data) && data > ctx.agora.getTime()) {
      dataIssues.push(erro("DATA_FUTURA", "dataLote", "Validação estrita: a data do lote não pode ser futura."));
    }
    guardas.push(guarda("data-nao-futura", "[Estrita] Data não futura", "campos", "CONTROLLER", dataIssues));
  }

  const pecaIssues: ValidationIssue[] = [];
  if (pecaId) {
    if (!ctx.peca) {
      pecaIssues.push(erro("PECA_NAO_ENCONTRADA", "pecaId", `A peça ${pecaId} não foi encontrada.`, "MODEL"));
    } else {
      pecaIssues.push(...validarPeca(ctx.peca));
    }
  } else {
    pecaIssues.push(erro("PECA_NAO_INFORMADA", "pecaId", "Não há peça para validar.", "MODEL"));
  }
  guardas.push(guarda("peca-conforme", "Peça existe e está conforme", "peca", "MODEL", pecaIssues));

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
