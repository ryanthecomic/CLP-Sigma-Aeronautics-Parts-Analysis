/// <reference types="vitest/config" />
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const RAIZ_WEB = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, RAIZ_WEB, "");
  const chaveNvidia = env.NVIDIA_API_KEY?.trim();

  if (env.VITE_IA_PROVEDOR?.trim().toLowerCase() === "nvidia" && !chaveNvidia) {
    console.warn(
      "[aerolyze] VITE_IA_PROVEDOR=nvidia, mas NVIDIA_API_KEY não está definida em web/.env.local. " +
        "O provedor real vai falhar e o fallback determinístico assumirá.",
    );
  }

  // O navegador chama /api/nvidia/chat/completions; o servidor do Vite injeta
  // a chave e encaminha para a API compatível com OpenAI da NVIDIA.
  const proxy = chaveNvidia
    ? {
        "/api/nvidia": {
          target: "https://integrate.api.nvidia.com",
          changeOrigin: true,
          secure: true,
          rewrite: (caminho: string) => caminho.replace(/^\/api\/nvidia/, "/v1"),
          headers: { Authorization: `Bearer ${chaveNvidia}` },
        },
      }
    : undefined;

  return {
    plugins: [react(), tailwindcss()],
    server: { proxy },
    preview: { proxy },
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: ["./src/test/setup.ts"],
      css: false,
    },
  };
});
