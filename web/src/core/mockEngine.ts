/**
 * Motor mock: compõe o pipeline com a IA mock, os cálculos e o repositório.
 *
 * Dono: Membro 2 (Controlador). TypeScript puro, sem React.
 *
 * Uso típico (via hook `useAnalysis`, nunca direto na UI):
 *
 * ```ts
 * const resultado = runAnalysis(input, { repositorio });
 * ```
 */
import type { AnalysisGateway, ConfigIA, EventBus, OpcoesAnalise, Repository } from "./contracts";
import { eventBus as busPadrao } from "./eventBus";
import { analysisEngine } from "./fallback";
import { CONFIG_IA_PADRAO, mockAIProvider } from "./ia";
import { executarPipeline } from "./pipeline";
import type { AnaliseInput, FlagsDev, RegrasAnaliseAero, ResultadoAnalise } from "./types";

/** Latência artificial (ms) quando a flag "latência simulada" está ativa. */
export const LATENCIA_SIMULADA_MS = 800;

/** Seed padrão da IA mock. */
export const SEED_PADRAO = 42;

export interface OpcoesRunAnalysis {
  repositorio: Repository;
  bus?: EventBus;
  regras?: RegrasAnaliseAero;
  flags?: FlagsDev;
  ia?: ConfigIA;
  seed?: number;
  agora?: () => Date;
}

/**
 * Executa uma análise completa de forma síncrona e determinística
 * (exceto ids e timestamps). Regras e flags padrão vêm do repositório.
 */
export function runAnalysis(input: AnaliseInput, opcoes: OpcoesRunAnalysis): ResultadoAnalise {
  const snapshot = opcoes.repositorio.snapshot();
  return executarPipeline(input, {
    repositorio: opcoes.repositorio,
    ia: mockAIProvider,
    engine: analysisEngine,
    bus: opcoes.bus ?? busPadrao,
    regras: opcoes.regras ?? snapshot.regras,
    flags: opcoes.flags ?? snapshot.flags,
    configIA: opcoes.ia ?? CONFIG_IA_PADRAO,
    seed: opcoes.seed ?? SEED_PADRAO,
    latenciaMs: LATENCIA_SIMULADA_MS,
    ...(opcoes.agora ? { agora: opcoes.agora } : {}),
  });
}

/** Espera `ms` milissegundos. */
export function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Gateway assíncrono usado pela UI. Aplica a latência simulada (se a flag
 * estiver ativa) antes de executar o pipeline.
 */
export function criarGatewayMock(repositorio: Repository, bus: EventBus = busPadrao): AnalysisGateway {
  return {
    async analisar(input: AnaliseInput, opcoes: OpcoesAnalise = {}) {
      const flags = opcoes.flags ?? repositorio.snapshot().flags;
      if (flags.latenciaSimulada) await esperar(LATENCIA_SIMULADA_MS);
      return runAnalysis(input, {
        repositorio,
        bus,
        flags,
        ...(opcoes.regras ? { regras: opcoes.regras } : {}),
        ...(opcoes.ia ? { ia: opcoes.ia } : {}),
        ...(opcoes.seed !== undefined ? { seed: opcoes.seed } : {}),
      });
    },
  };
}
