import type { ComponentType, LazyExoticComponent } from "react";
import type { ModuleManifest as CoreModuleManifest } from "../core/contracts";

/**
 * Especialização React do contrato `ModuleManifest` de `src/core/contracts.ts`,
 * mantendo `src/core/` livre de imports de React.
 */
export type ReactModuleManifest = CoreModuleManifest<LazyExoticComponent<ComponentType>>;

