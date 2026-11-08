/**
 * Configuração da aplicação e prévia no formato `config.toml`.
 *
 * No backend Rust, o Repositório lê o `config.toml`. Aqui geramos uma
 * prévia equivalente a partir do estado atual.
 */
import { MODELO_IA_META } from "./ia";
import { SEED_PADRAO, LATENCIA_SIMULADA_MS } from "./mockEngine";
import { CHAVE_STORAGE } from "./repository";
import type { FlagsDev, RegrasAnaliseAero } from "./types";

type ValorToml = string | number | boolean;
export type TabelaToml = Record<string, ValorToml>;
export type ConfigToml = Record<string, TabelaToml>;

/** Monta o objeto de configuração a partir das regras e flags atuais. */
export function montarConfig(regras: RegrasAnaliseAero, flags: FlagsDev): ConfigToml {
  return {
    app: {
      nome: "Aerolyze Lab",
      versao: "0.1.0",
      chave_storage: CHAVE_STORAGE,
    },
    regras: {
      temperatura_min: regras.temperaturaMin,
      temperatura_max: regras.temperaturaMax,
      pressao_min: regras.pressaoMin,
      pressao_max: regras.pressaoMax,
      confianca_minima_ia: regras.confiancaMinimaIA,
      taxa_defeitos_otimo: regras.taxaDefeitosOtimo,
      taxa_defeitos_atencao: regras.taxaDefeitosAtencao,
      eficiencia_otimo: regras.eficienciaOtimo,
      eficiencia_atencao: regras.eficienciaAtencao,
    },
    ia: {
      modelo: MODELO_IA_META.nome,
      versao: MODELO_IA_META.versao,
      precisao: MODELO_IA_META.precisao,
      seed: SEED_PADRAO,
    },
    dev: {
      forcar_falha_ia: flags.forcarFalhaIA,
      forcar_fallback: flags.forcarFallback,
      validacao_estrita: flags.validacaoEstrita,
      latencia_simulada: flags.latenciaSimulada,
      latencia_ms: LATENCIA_SIMULADA_MS,
    },
  };
}

function valorToml(valor: ValorToml): string {
  if (typeof valor === "string") return JSON.stringify(valor);
  if (typeof valor === "number") return String(valor);
  return valor ? "true" : "false";
}

/** Serializa um objeto de tabelas (um nível) em TOML. */
export function paraToml(config: ConfigToml): string {
  return Object.entries(config)
    .map(([tabela, valores]) => {
      const linhas = Object.entries(valores).map(([k, v]) => `${k} = ${valorToml(v)}`);
      return [`[${tabela}]`, ...linhas].join("\n");
    })
    .join("\n\n")
    .concat("\n");
}
