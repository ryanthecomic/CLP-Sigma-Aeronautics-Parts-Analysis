import { lazy } from "react";
import type { ReactModuleManifest } from "../types";

export const viewEntradaManifest: ReactModuleManifest = {
  id: "view-entrada",
  nome: "View de Entrada",
  responsavel: "Membro 6",
  descricao: "Formulário controlado, validação inline com Zod e configuração de limites.",
  status: "pronto",
  camada: "VIEW",
  contratos: ["AnaliseInput", "RegrasAnaliseAero", "PecaAeronautica"],
  sandbox: lazy(() => import("./sandbox")),
};

