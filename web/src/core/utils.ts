/**
 * Utilitários puros compartilhados pelo core.
 */

/** Arredonda para `casas` casas decimais. */
export function arredondar(valor: number, casas = 2): number {
  if (!Number.isFinite(valor)) return 0;
  const fator = 10 ** casas;
  return Math.round(valor * fator) / fator;
}

/** Limita `valor` ao intervalo [min, max]. */
export function limitar(valor: number, min: number, max: number): number {
  if (Number.isNaN(valor)) return min;
  return Math.min(max, Math.max(min, valor));
}

let contador = 0;

/** Gera um id curto e único na sessão, com prefixo legível. */
export function gerarId(prefixo: string): string {
  contador = (contador + 1) % 1_000_000;
  return `${prefixo}-${Date.now().toString(36)}-${contador.toString(36)}`;
}

/** Hash FNV-1a de 32 bits — usado para derivar seeds determinísticas. */
export function hashTexto(texto: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < texto.length; i += 1) {
    hash ^= texto.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** PRNG determinístico (mulberry32). Retorna função que gera números em [0, 1). */
export function criarPrng(seed: number): () => number {
  let estado = seed >>> 0;
  return () => {
    estado = (estado + 0x6d2b79f5) >>> 0;
    let t = estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Serializa qualquer valor em JSON legível, sem lançar exceção. */
export function paraJson(valor: unknown): string {
  try {
    return JSON.stringify(valor, null, 2) ?? "undefined";
  } catch {
    return String(valor);
  }
}

