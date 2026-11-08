import { lazy } from "react";
import type { ReactModuleManifest } from "../types";

export const calculosManifest: ReactModuleManifest = {
  id: "calculos",
  nome: "Cálculos & Fallback",
  responsavel: "Membro 3",
  descricao: "Estatísticas determinísticas de produção, fallback e recomendação textual.",
  status: "pronto",
  camada: "CALC",
  contratos: ["AnalysisEngine", "MetricasProducao", "ResultadoAnalise"],
  sandbox: lazy(() => import("./sandbox")),
};

