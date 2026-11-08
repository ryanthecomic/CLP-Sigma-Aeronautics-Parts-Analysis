---
name: aerolyze-module-dev
description: >-
  Guia passo a passo para criar ou evoluir qualquer um dos 7 módulos independentes
  do Aerolyze Lab em web/src/modules/<id>/ mantendo isolamento, telemetria no eventBus,
  carregamento lazy e definição de pronto (DoD). Use quando um membro da equipe pedir
  para desenvolver, alterar ou corrigir um módulo ou seu sandbox.
---

# Desenvolvimento de Módulo no Aerolyze Lab (`aerolyze-module-dev`)

Use este procedimento sempre que for evoluir um dos 7 módulos em `web/src/modules/<id>/` ou criar um novo módulo para a Equipe Sigma.

## 1. Identificar o Módulo e sua Camada

| ID do módulo | Responsável | Camada (`ModuloSistema`) | Pasta |
|---|---|---|---|
| `modelo` | Membro 1 | `MODEL` | `web/src/modules/modelo/` |
| `controlador` | Membro 2 | `CONTROLLER` | `web/src/modules/controlador/` |
| `calculos` | Membro 3 | `CALC` | `web/src/modules/calculos/` |
| `ia` | Membro 4 | `IA` | `web/src/modules/ia/` |
| `repositorio` | Membro 5 | `REPO` | `web/src/modules/repositorio/` |
| `view-entrada` | Membro 6 | `VIEW` | `web/src/modules/view-entrada/` |
| `view-dashboard` | Membro 7 | `VIEW` | `web/src/modules/view-dashboard/` |

## 2. Regras de Isolamento do Módulo

1. Dentro de `web/src/modules/<id>/`, importe **apenas**:
   - `../../core/*` (tipos, contratos e funções puras)
   - `../../components/*` (UI kit, formulários, cards de resultado)
   - `../../hooks/*` (`useAnalysis`, `usePipeline`, `useLogs`, `useFlags`, `useModule`, `useRepositorio`, `useRegras`)
   - Arquivos locais da própria pasta `web/src/modules/<id>/`
2. **Proibido** importar qualquer arquivo de outro módulo (`../outro-modulo/*`).
3. **Proibido** acessar `localStorage` diretamente (use `useRepositorio()`).

## 3. Estrutura Obrigatória do Módulo

Cada módulo deve conter:

- `manifest.ts` — exporta o `ReactModuleManifest` com `sandbox: lazy(() => import("./sandbox"))`.
- `sandbox.tsx` — exporta o componente React (nomeado e `default`) para funcionar com `React.lazy`.
- `README.md` — documenta responsável, camada, escopo e contratos consumidos/expostos.

### Emitindo Logs no Sandbox

Sempre use o hook `useModule("<id>")` para emitir logs já identificados com a camada correta do módulo:

```tsx
const { log } = useModule("calculos");
log("INFO", "Cálculo executado no sandbox.", { metricas });
```

## 4. Definição de Pronto (DoD) — Verificação Obrigatória

Antes de concluir a tarefa no módulo, execute:

1. Checagem de arquitetura e testes:
   `bash agents-sigma/plugins/aerolyze-sigma/skills/aerolyze-quality-gate/scripts/check-architecture.sh`
2. Confirme que:
   - `manifest.ts` lista todos os contratos usados em `contratos: [...]`.
   - `README.md` do módulo está atualizado.
   - Nenhum erro de tipo (`tsc -b`) ou de teste (`vitest run`) ocorre.
