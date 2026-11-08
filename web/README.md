# Aerolyze Lab (MVP Web — Modo Desenvolvedor)

> **Equipe Sigma — UFAL — Conceitos de Linguagem de Programação (CLP)**

## 1. Objetivo do MVP

O **Aerolyze Lab** é o scaffold web em React com **Modo Desenvolvedor** da plataforma Aerolyze para análise de conformidade de peças aeroespaciais. O objetivo não é entregar o backend Rust definitivo nesta etapa, mas permitir que os **7 membros da Equipe Sigma** trabalhem em paralelo — cada um em seu módulo isolado — contra contratos congelados e um motor mock compartilhado que respeita o princípio central da arquitetura:

> **"Validar primeiro, analisar depois."** Dados inválidos são barrados nas guard clauses antes de qualquer chamada à IA. Se a IA falhar ou retornar confiança abaixo do mínimo, o algoritmo determinístico de fallback assume.

---

## 2. Como rodar

```bash
cd web
npm install
npm run dev      # Inicia o servidor de desenvolvimento (abre em /dev)
npm run test     # Executa os testes unitários, de componentes e de integração (Vitest)
npm run build    # Checagem estrita de tipos (tsc -b) + build de produção (Vite)
```

---

## 3. Estrutura de pastas

```text
web/
  src/
    core/                   # TypeScript puro (sem React!)
      types.ts              # Contratos de domínio (Membro 1)
      contracts.ts          # Contratos de arquitetura e interfaces (Membro 2)
      rules.ts              # Regras padrão, classificar() e validarPeca() (Membro 1)
      calculations.ts       # Métricas determinísticas puras (Membro 3)
      fallback.ts           # Fallback determinístico e recomendação (Membro 3)
      ia.ts                 # Provedor de IA mock por seed + modos de falha (Membro 4)
      repository.ts         # Única porta para localStorage: aerolyze-lab:v1 (Membro 5)
      seed.ts               # Seed inicial: 5 peças e 6 lotes (Membro 5)
      schemas.ts            # Schemas Zod de persistência e de entrada (Membro 6)
      pipeline.ts           # Guard clauses e orquestração (Membro 2)
      mockEngine.ts         # Composição runAnalysis() e gateway (Membro 2)
      eventBus.ts           # Event bus síncrono de PipelineStep e LogEvent (Membro 2)
      scenarios.ts          # 4 cenários prontos e comparador esperado vs. obtido
      config.ts             # Gerador de prévia config.toml
      store.ts              # Re-export da store global
    store/                  # Zustand com slices (dados, regras, flags, sessão, logs, UI)
    modules/                # 7 módulos independentes (carregados com React.lazy)
      modelo/               # Membro 1
      controlador/          # Membro 2
      calculos/             # Membro 3
      ia/                   # Membro 4
      repositorio/          # Membro 5
      view-entrada/         # Membro 6
      view-dashboard/       # Membro 7
      registry.ts           # Registro único lido pelo shell do Modo Dev
    features/
      dev/                  # DevLayout, ModuleHub, SandboxShell, Pipeline, Estado, Logs, Flags, Docs
      operator/             # Preview do Operador (/operador)
    components/
      ui/                   # Button, Card, Badge, Input, Select, Tabs, CodeBlock, EmptyState, Toast
      layout/               # Sidebar, TopBar, PageHeader
      form/                 # AnalysisForm, LimitsModal
      result/               # ResultCard, StatusBadge, QualityAlert, AnalysisHistoryList
      feedback/             # AppErrorBoundary, ModuleErrorBoundary
    hooks/                  # useAnalysis, usePipeline, useLogs, useFlags, useModule, useDados
```

---

## 4. Mapa dos 7 módulos

| # | Módulo | Pasta | Responsável | Camada | Contratos principais |
|---|---|---|---|---|---|
| 1 | **Modelo** | `src/modules/modelo/` | Membro 1 | `MODEL` | `PecaAeronautica`, `DadosProducaoAero`, `ResultadoAnalise`, `RegrasAnaliseAero`, `StatusQualidade` |
| 2 | **Controlador** | `src/modules/controlador/` | Membro 2 | `CONTROLLER` | `AnalysisGateway`, `GuardResult`, `ValidationIssue`, `PipelineStep`, `LogEvent` |
| 3 | **Cálculos & Fallback** | `src/modules/calculos/` | Membro 3 | `CALC` | `AnalysisEngine`, `MetricasProducao`, `ResultadoAnalise` |
| 4 | **Sistema de IA** | `src/modules/ia/` | Membro 4 | `IA` | `AIProvider`, `ConfigIA`, `RequisicaoIA`, `SaidaBrutaIA`, `ModeloIAMeta` |
| 5 | **Repositório de Dados** | `src/modules/repositorio/` | Membro 5 | `REPO` | `Repository`, `DadosPersistidos`, `DadosProducaoAero`, `ResultadoAnalise` |
| 6 | **View de Entrada** | `src/modules/view-entrada/` | Membro 6 | `VIEW` | `AnaliseInput`, `RegrasAnaliseAero`, `PecaAeronautica` |
| 7 | **View de Dashboard** | `src/modules/view-dashboard/` | Membro 7 | `VIEW` | `ResultadoAnalise`, `StatusQualidade`, `MetricasProducao` |

---

## 5. Como adicionar ou evoluir um módulo React

1. Trabalhe dentro de `src/modules/<seu-modulo>/`, editando principalmente `sandbox.tsx`, `manifest.ts` e `README.md`.
2. Exporte o componente do sandbox como `default` em `sandbox.tsx` para suportar `React.lazy`.
3. Registre ou atualize o manifest em `src/modules/registry.ts`:

```ts
import { lazy } from "react";
import type { ReactModuleManifest } from "../types";

export const meuModuloManifest: ReactModuleManifest = {
  id: "meu-modulo",
  nome: "Meu Módulo",
  responsavel: "Membro X",
  descricao: "Descrição curta do módulo.",
  status: "em_andamento",
  camada: "VIEW",
  contratos: ["PecaAeronautica", "ResultadoAnalise"],
  sandbox: lazy(() => import("./sandbox")),
};
```

4. **Regras de dependência:**
   - `src/core/` nunca importa React.
   - Um módulo nunca importa outro módulo diretamente.
   - Nenhum módulo acessa `localStorage` diretamente (use `useRepositorio()`).

---

## 6. Como o motor mock funciona

Fluxo unidirecional:

```text
UI → hook (useAnalysis) → mockEngine (runAnalysis) → eventBus → store (Zustand) → UI
```

Etapas de `runAnalysis(input)`:

1. **Validar campos obrigatórios** (peça, data ISO, horas > 0 e data não futura se `validacaoEstrita`).
2. **Validar a peça** (`validarPeca`: cadastro + `conforme === true`).
3. **Validar o lote** (quantidade inteira > 0, `0 <= defeituosos <= quantidade`, temperatura 150–250 °C, pressão 3–10 bar).
4. **Parada precoce:** se qualquer guard clause reprovar, a execução para antes da IA e retorna `origem: "VALIDACAO"`, `status: "CRITICO"` e a lista de `ValidationIssue`.
5. **Inferência da IA mock** (`simularIA`): determinística por seed (`mulberry32`), permitindo simular `NENHUM`, `EXCECAO`, `TIMEOUT`, `BAIXA_CONFIANCA` e `SAIDA_INVALIDA`.
6. **Verificação de confiança e fallback** (`executarFallback`): se a IA falhar, retornar saída inválida ou confiança `< confiancaMinimaIA` (`0.70`), o fallback determinístico calcula produtividade, taxa de defeitos, eficiência, conformidade e previsão de falhas.
7. **Classificação** (`classificar`): `OTIMO`, `ATENCAO` ou `CRITICO` conforme taxa de defeitos e eficiência.
8. **Persistência e telemetria:** salva na chave `aerolyze-lab:v1` via Repositório e emite `PipelineStep[]` e `LogEvent[]` correlacionados por `traceId`.

---

## 7. Fora de escopo nesta fase

- Modelo de IA real (`modelo_ia.bin` nativo) e backend Rust real.
- Banco de dados SQL real (PostgreSQL/SQLite), autenticação e multiusuário.
- Exportação PDF/CSV, gráficos complexos e diagramas interativos com React Flow.
- Simulação dimensional avançada (comprimento, largura, espessura e tolerância).

