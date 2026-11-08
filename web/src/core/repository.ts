/**
 * Repositório local — a ÚNICA porta de acesso ao `localStorage`.
 *
 * Dono: Membro 5 (Repositório). Nenhum outro arquivo deve tocar em
 * `localStorage`. No futuro, esta implementação pode ser trocada por um
 * repositório SQL real mantendo o contrato `Repository`.
 */
import type { ColecaoRepositorio, Repository, ResultadoCarga } from "./contracts";
import { dadosPersistidosSchema } from "./schemas";
import { criarSeed } from "./seed";
import type { DadosPersistidos } from "./types";

/** Chave versionada usada no localStorage. */
export const CHAVE_STORAGE = "aerolyze-lab:v1";

/** Subconjunto da Web Storage API usado pelo repositório. */
export interface StorageLike {
  getItem(chave: string): string | null;
  setItem(chave: string, valor: string): void;
  removeItem(chave: string): void;
}

/** Storage em memória (testes e ambientes sem localStorage). */
export function criarStorageMemoria(inicial: Record<string, string> = {}): StorageLike {
  const mapa = new Map(Object.entries(inicial));
  return {
    getItem: (chave) => mapa.get(chave) ?? null,
    setItem: (chave, valor) => {
      mapa.set(chave, valor);
    },
    removeItem: (chave) => {
      mapa.delete(chave);
    },
  };
}

/** Retorna o localStorage do navegador, ou um storage em memória se indisponível. */
export function obterStorageNavegador(): StorageLike {
  try {
    const storage = globalThis.localStorage;
    if (storage) {
      const teste = `${CHAVE_STORAGE}:teste`;
      storage.setItem(teste, "1");
      storage.removeItem(teste);
      return storage;
    }
  } catch {
    // localStorage bloqueado (modo privado, políticas do navegador etc.).
  }
  return criarStorageMemoria();
}

function clonar(dados: DadosPersistidos): DadosPersistidos {
  return structuredClone(dados);
}

/** Cria o repositório baseado em storage chave-valor. */
export function criarRepositorioLocal(storage: StorageLike = obterStorageNavegador(), chave = CHAVE_STORAGE): Repository {
  let dados: DadosPersistidos = criarSeed();

  const persistir = (): void => {
    try {
      storage.setItem(chave, JSON.stringify(dados));
    } catch {
      // Falha de quota: o estado em memória continua válido nesta sessão.
    }
  };

  const mutar = (fn: (atual: DadosPersistidos) => DadosPersistidos): void => {
    dados = fn(dados);
    persistir();
  };

  return {
    chave,

    carregar(): ResultadoCarga {
      const bruto = storage.getItem(chave);
      if (bruto === null) {
        dados = criarSeed();
        persistir();
        return { dados: clonar(dados) };
      }
      try {
        const json: unknown = JSON.parse(bruto);
        const versao = typeof json === "object" && json !== null && "versao" in json ? json.versao : undefined;
        const validado = dadosPersistidosSchema.safeParse(json);
        if (!validado.success) {
          dados = criarSeed();
          persistir();
          const aviso =
            versao !== undefined && versao !== 1
              ? `Versão de dados incompatível (${String(versao)}). O seed foi restaurado.`
              : "Os dados locais estavam em formato inválido e foram resetados para o seed.";
          return { dados: clonar(dados), aviso };
        }
        dados = validado.data as DadosPersistidos;
        return { dados: clonar(dados) };
      } catch {
        dados = criarSeed();
        persistir();
        return {
          dados: clonar(dados),
          aviso: "Os dados locais estavam corrompidos (JSON inválido) e foram resetados para o seed.",
        };
      }
    },

    snapshot: () => clonar(dados),

    buscarPeca: (id) => {
      const peca = dados.pecas.find((p) => p.id === id);
      return peca ? { ...peca } : undefined;
    },

    buscarLote: (id) => {
      const lote = dados.lotes.find((l) => l.id === id);
      return lote ? { ...lote } : undefined;
    },

    listarResultados: () => clonar(dados).resultados,

    salvarPeca: (peca) =>
      mutar((d) => {
        const existe = d.pecas.some((p) => p.id === peca.id);
        return {
          ...d,
          pecas: existe ? d.pecas.map((p) => (p.id === peca.id ? { ...peca } : p)) : [...d.pecas, { ...peca }],
        };
      }),

    registrarLote: (lote) =>
      mutar((d) => {
        const existe = d.lotes.some((l) => l.id === lote.id);
        return {
          ...d,
          lotes: existe ? d.lotes.map((l) => (l.id === lote.id ? { ...lote } : l)) : [...d.lotes, { ...lote }],
        };
      }),

    registrarResultado: (resultado) =>
      mutar((d) => ({
        ...d,
        resultados: [structuredClone(resultado), ...d.resultados.filter((r) => r.id !== resultado.id)],
      })),

    remover: (colecao: ColecaoRepositorio, id: string) =>
      mutar((d) => {
        if (colecao === "pecas") return { ...d, pecas: d.pecas.filter((p) => p.id !== id) };
        if (colecao === "lotes") return { ...d, lotes: d.lotes.filter((l) => l.id !== id) };
        return { ...d, resultados: d.resultados.filter((r) => r.id !== id) };
      }),

    atualizarRegras: (regras) => mutar((d) => ({ ...d, regras: { ...regras } })),

    atualizarFlags: (flags) => mutar((d) => ({ ...d, flags: { ...flags } })),

    reset: () => {
      dados = criarSeed();
      persistir();
      return clonar(dados);
    },
  };
}

