/**
 * Seleção do provedor de IA ativo.
 *
 * Dono: Membro 4 (IA). O padrão é o mock determinístico, para que testes,
 * builds e ambientes sem chave continuem funcionando offline. Defina
 * `VITE_IA_PROVEDOR=nvidia` em `web/.env.local` para usar a NVIDIA NIM.
 *
 * Em `MODE=test` o mock é sempre escolhido; testes que exercitam a NVIDIA
 * devem chamar `criarProviderNvidia` diretamente com um `fetchImpl` falso.
 */
import type { AIProvider } from "./contracts";
import { mockAIProvider } from "./ia";
import { criarProviderNvidia } from "./iaNvidia";

export type ProvedorIAId = "mock" | "nvidia";

/** Identificador do provedor configurado para esta execução. */
export function provedorIAAtivo(): ProvedorIAId {
  if (import.meta.env.MODE === "test") return "mock";
  return (import.meta.env.VITE_IA_PROVEDOR ?? "mock").trim().toLowerCase() === "nvidia" ? "nvidia" : "mock";
}

/** Instancia o provedor ativo. */
export function provedorIAPadrao(): AIProvider {
  return provedorIAAtivo() === "nvidia" ? criarProviderNvidia() : mockAIProvider;
}
