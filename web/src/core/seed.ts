/**
 * Dados iniciais determinísticos: 5 peças e 6 lotes.
 *
 * Dono: Membro 5 (Repositório). Todos os dados são fictícios.
 */
import { REGRAS_PADRAO } from "./rules";
import type { DadosPersistidos, DadosProducaoAero, FlagsDev, PecaAeronautica } from "./types";

export const FLAGS_PADRAO: FlagsDev = Object.freeze({
  forcarFalhaIA: false,
  forcarFallback: false,
  validacaoEstrita: false,
  latenciaSimulada: false,
});

export const PECAS_SEED: readonly PecaAeronautica[] = Object.freeze([
  Object.freeze({ id: "P-001", nome: "Suporte do trem de pouso", material: "Titânio Ti-6Al-4V", pesoKg: 12.4, conforme: true }),
  Object.freeze({ id: "P-002", nome: "Pá de turbina HP", material: "Inconel 718", pesoKg: 0.85, conforme: true }),
  Object.freeze({ id: "P-003", nome: "Nervura de asa", material: "Alumínio 7075-T6", pesoKg: 3.2, conforme: true }),
  Object.freeze({ id: "P-004", nome: "Painel de fuselagem", material: "Compósito CFRP", pesoKg: 8.7, conforme: true }),
  Object.freeze({ id: "P-005", nome: "Atuador de flap", material: "Aço 300M", pesoKg: 5.6, conforme: false }),
]);

export const LOTES_SEED: readonly DadosProducaoAero[] = Object.freeze([
  Object.freeze({ id: "L-001", pecaId: "P-001", dataLote: "2026-10-01", quantidade: 400, defeituosos: 4, horas: 9, temperatura: 200, pressao: 6 }),
  Object.freeze({ id: "L-002", pecaId: "P-002", dataLote: "2026-10-03", quantidade: 1200, defeituosos: 30, horas: 26, temperatura: 215, pressao: 7.5 }),
  Object.freeze({ id: "L-003", pecaId: "P-003", dataLote: "2026-10-08", quantidade: 300, defeituosos: 21, horas: 8, temperatura: 190, pressao: 5 }),
  Object.freeze({ id: "L-004", pecaId: "P-004", dataLote: "2026-10-12", quantidade: 250, defeituosos: 2, horas: 6, temperatura: 265, pressao: 6 }),
  Object.freeze({ id: "L-005", pecaId: "P-001", dataLote: "2026-10-15", quantidade: 500, defeituosos: 5, horas: 10, temperatura: 205, pressao: 6.5 }),
  Object.freeze({ id: "L-006", pecaId: "P-005", dataLote: "2026-10-20", quantidade: 180, defeituosos: 3, horas: 5, temperatura: 180, pressao: 4 }),
]);

/** Cria uma cópia nova do seed (nunca compartilha referências). */
export function criarSeed(): DadosPersistidos {
  return {
    versao: 1,
    pecas: PECAS_SEED.map((p) => ({ ...p })),
    lotes: LOTES_SEED.map((l) => ({ ...l })),
    resultados: [],
    regras: { ...REGRAS_PADRAO },
    flags: { ...FLAGS_PADRAO },
  };
}

