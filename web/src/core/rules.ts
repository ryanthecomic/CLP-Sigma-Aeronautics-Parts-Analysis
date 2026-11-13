/**
 * Regras de domínio: valores padrão, classificação e validação de peça.
 *
 * Dono: Membro 1 (Modelo).
 */
import type {
  MetricasProducao,
  PecaAeronautica,
  RegrasAnaliseAero,
  StatusQualidade,
  ValidationIssue,
} from "./types";

/** Regras iniciais (seção 7 do prompt). */
export const REGRAS_PADRAO: RegrasAnaliseAero = {
  temperaturaMin: 150,
  temperaturaMax: 250,
  pressaoMin: 3,
  pressaoMax: 10,
  confiancaMinimaIA: 0.7,
  taxaDefeitosOtimo: 2,
  taxaDefeitosAtencao: 5,
  eficienciaOtimo: 85,
  eficienciaAtencao: 70,
};

const PESO_STATUS: Record<StatusQualidade, number> = { OTIMO: 0, ATENCAO: 1, CRITICO: 2 };

/** Retorna o pior entre dois status. */
export function piorStatus(a: StatusQualidade, b: StatusQualidade): StatusQualidade {
  return PESO_STATUS[a] >= PESO_STATUS[b] ? a : b;
}

/** Classifica a taxa de defeitos isoladamente. */
export function classificarDefeitos(taxaDefeitos: number, regras: RegrasAnaliseAero): StatusQualidade {
  if (taxaDefeitos <= regras.taxaDefeitosOtimo) return "OTIMO";
  if (taxaDefeitos <= regras.taxaDefeitosAtencao) return "ATENCAO";
  return "CRITICO";
}

/** Classifica a eficiência isoladamente. */
export function classificarEficiencia(eficiencia: number, regras: RegrasAnaliseAero): StatusQualidade {
  if (eficiencia >= regras.eficienciaOtimo) return "OTIMO";
  if (eficiencia >= regras.eficienciaAtencao) return "ATENCAO";
  return "CRITICO";
}

/**
 * Classificação final: o pior status entre taxa de defeitos e eficiência.
 *
 * - Defeitos: ≤ 2% ótimo; ≤ 5% atenção; acima, crítico.
 * - Eficiência: ≥ 85% ótimo; ≥ 70% atenção; abaixo, crítico.
 */
export function classificar(
  metricas: Pick<MetricasProducao, "taxaDefeitos" | "eficiencia">,
  regras: RegrasAnaliseAero,
): StatusQualidade {
  return piorStatus(
    classificarDefeitos(metricas.taxaDefeitos, regras),
    classificarEficiencia(metricas.eficiencia, regras),
  );
}

function issue(codigo: string, campo: string, mensagem: string): ValidationIssue {
  return { codigo, campo, mensagem, modulo: "MODEL" };
}

function textoObrigatorio(valor: unknown): boolean {
  return typeof valor === "string" && valor.trim().length > 0;
}

/** Valida os campos cadastrais da peça (não exige conformidade). */
export function validarCadastroPeca(peca: PecaAeronautica): ValidationIssue[] {
  const erros: ValidationIssue[] = [];
  if (!textoObrigatorio(peca.id)) {
    erros.push(issue("PECA_ID_OBRIGATORIO", "id", "O código da peça é obrigatório."));
  }
  if (!textoObrigatorio(peca.nome)) {
    erros.push(issue("PECA_NOME_OBRIGATORIO", "nome", "O nome da peça é obrigatório."));
  }
  if (!textoObrigatorio(peca.material)) {
    erros.push(issue("PECA_MATERIAL_OBRIGATORIO", "material", "O material da peça é obrigatório."));
  }
  if (typeof peca.pesoKg !== "number" || !Number.isFinite(peca.pesoKg) || peca.pesoKg <= 0) {
    erros.push(issue("PECA_PESO_INVALIDO", "pesoKg", "O peso deve ser maior que 0 kg."));
  }
  return erros;
}

/**
 * Valida a peça para análise: cadastro + regra de conformidade.
 *
 * Aceita `undefined`/`null` para cobrir o caso de peça inexistente sem
 * lançar exceção. O Controlador e o sandbox do Modelo consomem este
 * contrato e recebem uma lista estruturada de `ValidationIssue`.
 */
export function validarPeca(peca: PecaAeronautica | null | undefined): ValidationIssue[] {
  if (!peca) {
    return [issue("PECA_NAO_ENCONTRADA", "pecaId", "A peça informada não foi encontrada.")];
  }

  const erros = validarCadastroPeca(peca);
  if (!peca.conforme) {
    const id = textoObrigatorio(peca.id) ? peca.id.trim() : "sem código";
    const nome = textoObrigatorio(peca.nome) ? peca.nome.trim() : "sem nome";
    erros.push(
      issue(
        "PECA_NAO_CONFORME",
        "conforme",
        `A peça ${id} (${nome}) não está conforme e não pode ser analisada.`,
      ),
    );
  }
  return erros;
}

export const ROTULO_STATUS: Record<StatusQualidade, string> = {
  OTIMO: "Ótimo",
  ATENCAO: "Atenção",
  CRITICO: "Crítico",
};

