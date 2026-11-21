/**
 * Registro único dos 7 módulos da Equipe Sigma.
 *
 * Dono: Membro 2 (Controlador). O shell do Modo Desenvolvedor importa
 * APENAS este arquivo para descobrir módulos, seus contratos e seus
 * sandboxes lazy.
 */
import { calculosManifest } from "./calculos/manifest";
import { controladorManifest } from "./controlador/manifest";
import { iaManifest } from "./ia/manifest";
import { modeloManifest } from "./modelo/manifest";
import { repositorioManifest } from "./repositorio/manifest";
import type { ReactModuleManifest } from "./types";
import { viewDashboardManifest } from "./view-dashboard/manifest";
import { viewEntradaManifest } from "./view-entrada/manifest";

export const MODULOS: readonly ReactModuleManifest[] = Object.freeze([
  modeloManifest,
  controladorManifest,
  calculosManifest,
  iaManifest,
  repositorioManifest,
  viewEntradaManifest,
  viewDashboardManifest,
]);

export function encontrarModulo(id: string | undefined): ReactModuleManifest | undefined {
  if (!id) return undefined;
  return MODULOS.find((m) => m.id === id);
}

