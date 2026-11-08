import { lazy } from "react";
import type { ReactModuleManifest } from "../types";

export const repositorioManifest: ReactModuleManifest = {
  id: "repositorio",
  nome: "Repositório de Dados",
  responsavel: "Membro 5",
  descricao: "Única porta de persistência local (localStorage versionado) e seed determinístico.",
  status: "pronto",
  camada: "REPO",
  contratos: ["Repository", "DadosPersistidos", "DadosProducaoAero", "ResultadoAnalise"],
  sandbox: lazy(() => import("./sandbox")),
};

