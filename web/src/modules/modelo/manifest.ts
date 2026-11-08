import { lazy } from "react";
import type { ReactModuleManifest } from "../types";

export const modeloManifest: ReactModuleManifest = {
  id: "modelo",
  nome: "Modelo",
  responsavel: "Membro 1",
  descricao: "Estruturas de domínio, validação de peças e regras de conformidade.",
  status: "pronto",
  camada: "MODEL",
  contratos: ["PecaAeronautica", "DadosProducaoAero", "ResultadoAnalise", "RegrasAnaliseAero", "StatusQualidade"],
  sandbox: lazy(() => import("./sandbox")),
};

