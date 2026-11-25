import { lazy } from "react";
import type { ReactModuleManifest } from "../types";

export const viewEntradaManifest: ReactModuleManifest = {
  id: "view-entrada",
  nome: "View de Entrada",
  responsavel: "Membro 6",
  descricao: "Formulário de produção reutilizável, validação inline com Zod, modal de limites e sandbox de entrada.",
  status: "pronto",
  camada: "VIEW",
  contratos: ["AnaliseInput", "RegrasAnaliseAero", "PecaAeronautica"],
  sandbox: lazy(() => import("./sandbox")),
};

