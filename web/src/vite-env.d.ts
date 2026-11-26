/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "mock" (padrão) ou "nvidia". */
  readonly VITE_IA_PROVEDOR?: "mock" | "nvidia";
  /** Modelo NIM usado pelo provedor real. */
  readonly VITE_NVIDIA_MODELO?: string;
  /** Base da API. Em dev o padrão `/api/nvidia` usa o proxy do Vite. */
  readonly VITE_NVIDIA_BASE_URL?: string;
  /** Tempo limite da chamada real, em ms. */
  readonly VITE_NVIDIA_TIMEOUT_MS?: string;
  /** Chave direta (somente builds sem proxy; fica visível no bundle). */
  readonly VITE_NVIDIA_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
