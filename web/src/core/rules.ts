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

/** Valida os campos cadastrais da peça (não exige conformidade). */
export function validarCadastroPeca(peca: PecaAeronautica): ValidationIssue[] {
  const erros: ValidationIssue[] = [];
  if (!peca.id.trim()) erros.push(issue("PECA_ID_OBRIGATORIO", "id", "O código da peça é obrigatório."));
  if (!peca.nome.trim()) erros.push(issue("PECA_NOME_OBRIGATORIO", "nome", "O nome da peça é obrigatório."));
  if (!peca.material.trim()) {
    erros.push(issue("PECA_MATERIAL_OBRIGATORIO", "material", "O material da peça é obrigatório."));
  }
  if (!Number.isFinite(peca.pesoKg) || peca.pesoKg <= 0) {
    erros.push(issue("PECA_PESO_INVALIDO", "pesoKg", "O peso deve ser maior que 0 kg."));
  }
  return erros;
}

/** Valida a peça para análise: cadastro + regra de conformidade. */
export function validarPeca(peca: PecaAeronautica): ValidationIssue[] {
  const erros = validarCadastroPeca(peca);
  if (!peca.conforme) {
    erros.push(
      issue(
        "PECA_NAO_CONFORME",
        "conforme",
        `A peça ${peca.id} (${peca.nome}) não está conforme e não pode ser analisada.`,
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

