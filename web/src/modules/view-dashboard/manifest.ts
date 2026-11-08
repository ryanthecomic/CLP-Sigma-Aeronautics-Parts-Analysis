import { lazy } from "react";
import type { ReactModuleManifest } from "../types";

export const viewDashboardManifest: ReactModuleManifest = {
  id: "view-dashboard",
  nome: "View de Dashboard",
  responsavel: "Membro 7",
  descricao: "Cards de resultado, estados visuais (Ótimo/Atenção/Crítico), alertas e histórico.",
  status: "pronto",
  camada: "VIEW",
  contratos: ["ResultadoAnalise", "StatusQualidade", "MetricasProducao"],
  sandbox: lazy(() => import("./sandbox")),
};

