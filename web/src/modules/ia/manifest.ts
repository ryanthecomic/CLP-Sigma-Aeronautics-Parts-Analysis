import { lazy } from "react";
import type { ReactModuleManifest } from "../types";

export const iaManifest: ReactModuleManifest = {
  id: "ia",
  nome: "Sistema de IA",
  responsavel: "Membro 4",
  descricao: "Provedor mock determinístico (modelo_ia.bin), confiança e modos de falha.",
  status: "pronto",
  camada: "IA",
  contratos: ["AIProvider", "ConfigIA", "RequisicaoIA", "SaidaBrutaIA", "ModeloIAMeta"],
  sandbox: lazy(() => import("./sandbox")),
};

