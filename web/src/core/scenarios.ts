/**
 * Cenários prontos para o Modo Desenvolvedor (Flags & Cenários).
 *
 * Cada cenário roda com regras padrão e flags próprias, para que o
 * resultado esperado seja reproduzível independentemente do estado atual.
 */
import type { ConfigIA } from "./contracts";
import { CONFIG_IA_PADRAO } from "./ia";
import { REGRAS_PADRAO } from "./rules";
import { FLAGS_PADRAO } from "./seed";
import type {
  AnaliseInput,
  FlagsDev,
  OrigemResultado,
  RegrasAnaliseAero,
  ResultadoAnalise,
  StatusQualidade,
} from "./types";

export interface EsperadoCenario {
  origem: OrigemResultado;
  status: StatusQualidade;
  /** Código de erro que deve aparecer (cenários de rejeição). */
  codigoErro?: string;
}

export interface Cenario {
  id: string;
  nome: string;
  descricao: string;
  input: AnaliseInput;
  flags: FlagsDev;
  ia: ConfigIA;
  regras: RegrasAnaliseAero;
  esperado: EsperadoCenario;
}

const LOTE_CONFORME: AnaliseInput = {
  pecaId: "P-001",
  dataLote: "2026-10-15",
  quantidade: 500,
  defeituosos: 5,
  horas: 10,
  temperatura: 205,
  pressao: 6.5,
};

export const CENARIOS: readonly Cenario[] = [
  {
    id: "lote-conforme",
    nome: "a. Lote conforme",
    descricao: "Peça conforme, parâmetros no centro da faixa e 1% de defeitos. A IA responde com confiança alta.",
    input: { ...LOTE_CONFORME, loteId: "CEN-A" },
    flags: { ...FLAGS_PADRAO },
    ia: { ...CONFIG_IA_PADRAO },
    regras: { ...REGRAS_PADRAO },
    esperado: { origem: "IA", status: "OTIMO" },
  },
  {
    id: "temperatura-fora",
    nome: "b. Temperatura fora da faixa",
    descricao: "Temperatura de 280 °C (limite 250 °C). Deve ser rejeitado antes da IA.",
    input: { ...LOTE_CONFORME, loteId: "CEN-B", temperatura: 280 },
    flags: { ...FLAGS_PADRAO },
    ia: { ...CONFIG_IA_PADRAO },
    regras: { ...REGRAS_PADRAO },
    esperado: { origem: "VALIDACAO", status: "CRITICO", codigoErro: "TEMPERATURA_FORA_DA_FAIXA" },
  },
  {
    id: "baixa-confianca",
    nome: "c. Baixa confiança da IA",
    descricao: "A IA responde com confiança abaixo de 0,70. O fallback determinístico assume.",
    input: { ...LOTE_CONFORME, loteId: "CEN-C" },
    flags: { ...FLAGS_PADRAO },
    ia: { ...CONFIG_IA_PADRAO, modoFalha: "BAIXA_CONFIANCA" },
    regras: { ...REGRAS_PADRAO },
    esperado: { origem: "FALLBACK", status: "OTIMO" },
  },
  {
    id: "falha-total-ia",
    nome: "d. Falha total da IA",
    descricao: "Flag \"forçar falha da IA\" ativa: a IA lança exceção e o fallback assume.",
    input: { ...LOTE_CONFORME, loteId: "CEN-D" },
    flags: { ...FLAGS_PADRAO, forcarFalhaIA: true },
    ia: { ...CONFIG_IA_PADRAO },
    regras: { ...REGRAS_PADRAO },
    esperado: { origem: "FALLBACK", status: "OTIMO" },
  },
];

export interface ItemComparacao {
  campo: string;
  esperado: string;
  obtido: string;
  ok: boolean;
}

export interface ComparacaoCenario {
  passou: boolean;
  itens: ItemComparacao[];
}

/** Compara o resultado obtido com o esperado do cenário. */
export function compararCenario(cenario: Cenario, resultado: ResultadoAnalise): ComparacaoCenario {
  const itens: ItemComparacao[] = [
    {
      campo: "origem",
      esperado: cenario.esperado.origem,
      obtido: resultado.origem,
      ok: cenario.esperado.origem === resultado.origem,
    },
    {
      campo: "status",
      esperado: cenario.esperado.status,
      obtido: resultado.status,
      ok: cenario.esperado.status === resultado.status,
    },
  ];
  if (cenario.esperado.codigoErro) {
    const codigos = resultado.erros.map((e) => e.codigo);
    itens.push({
      campo: "erro",
      esperado: cenario.esperado.codigoErro,
      obtido: codigos.join(", ") || "nenhum",
      ok: codigos.includes(cenario.esperado.codigoErro),
    });
  }
  return { passou: itens.every((i) => i.ok), itens };
}

