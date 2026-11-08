import { lazy } from "react";
import type { ReactModuleManifest } from "../types";

export const controladorManifest: ReactModuleManifest = {
  id: "controlador",
  nome: "Controlador",
  responsavel: "Membro 2",
  descricao: "Orquestração do pipeline e validação local com guard clauses.",
  status: "pronto",
  camada: "CONTROLLER",
  contratos: ["AnalysisGateway", "GuardResult", "ValidationIssue", "PipelineStep", "LogEvent"],
  sandbox: lazy(() => import("./sandbox")),
};

