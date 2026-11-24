import { lazy } from "react";
import type { ReactModuleManifest } from "../types";

export const iaManifest: ReactModuleManifest = {
  id: "ia",
  nome: "Sistema de IA",
  responsavel: "Membro 4",
  descricao:
    "Provedor mock determinístico (modelo_ia.bin) com seed, 4 modos de falha reproduzíveis, metadados do modelo e indicação de fallback.",
  status: "pronto",
  camada: "IA",
  contratos: ["AIProvider", "ConfigIA", "RequisicaoIA", "SaidaBrutaIA", "ModeloIAMeta", "TipoErroIA"],
  sandbox: lazy(() => import("./sandbox")),
};