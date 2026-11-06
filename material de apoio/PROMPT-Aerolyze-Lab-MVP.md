# Prompt — Aerolyze Lab (MVP)

**Objetivo:** criar o scaffold do ambiente web em React, com foco no Modo Desenvolvedor, para que os 7 membros da Equipe Sigma possam trabalhar em paralelo.

**Stack:** React 19 + TypeScript + Vite + Tailwind CSS + Zustand + Zod + React Router.

**Público:** Equipe Sigma — UFAL — Conceitos de Linguagem de Programação.

**Como usar:** copie o conteúdo a partir da seção "Você é um engenheiro..." e cole na ferramenta de geração de código. Se a ferramenta aceitar um arquivo de contexto, envie este documento inteiro.

---

Você é um engenheiro front-end sênior especializado em React e TypeScript. Crie um MVP simples, legível e extensível chamado "Aerolyze Lab".

O objetivo NÃO é entregar o produto Aerolyze completo. O objetivo é criar o esqueleto do ambiente web e o Modo Desenvolvedor para que os 7 membros da equipe possam trabalhar em paralelo, cada um no seu módulo. Priorize clareza, contratos e extensibilidade sobre quantidade de funcionalidades.

A arquitetura do ambiente web deve ser em React. Não use Next.js, Vue, Angular, Svelte ou outro framework de UI.

Trabalhe de forma autônoma. Não faça perguntas. Não use placeholders, TODOs ou botões sem função. Se algo não estiver especificado, escolha a solução mais simples e consistente com este prompt. Todos os dados são fictícios e locais.

## 1. CONTEXTO

Aerolyze é uma plataforma da Equipe Sigma (UFAL) para análise de conformidade de peças aeroespaciais. A arquitetura original é MVC em Rust:

- Modelo: PecaAeronautica, DadosProducaoAero, ResultadoAnalise, RegrasAnaliseAero.
- Controlador: validação local com guard clauses e orquestração.
- Cálculos: estatísticas de produção e fallback determinístico.
- IA: biblioteca embarcada (modelo_ia.bin), chamada em processo, sem rede.
- Repositório: única porta para o banco SQL e para o config.toml.
- View: captura de dados, dashboard, alertas e relatórios.

Princípio central: "Validar primeiro, analisar depois". Dados inválidos são barrados antes da IA. Se a IA falhar ou tiver baixa confiança, o fallback assume.

O ambiente web é um protótipo inicial em React. Ele deve permitir que cada membro teste seu módulo isoladamente e veja o fluxo completo funcionando com dados mockados. O backend Rust não faz parte deste MVP; o domínio é simulado em TypeScript.

## 2. ESCOPO DO MVP

Obrigatório:

- Hub com os 7 módulos.
- Sandbox funcional para cada módulo.
- Motor mock compartilhado.
- Ferramentas globais: Pipeline, Estado/Contratos, Logs, Flags/Cenários e Documentação.
- Preview mínimo do Operador.
- Persistência local e reset.
- README para a equipe.

Fora de escopo:

- IA real, banco real, autenticação, multiusuário.
- Exportação PDF/CSV, gráficos avançados, SQL explorer.
- Diagramas interativos com React Flow.
- Gestão de tarefas, cronograma, command palette e snapshots.
- Dashboard completo com muitos KPIs.
- Backend Rust real.

## 3. ARQUITETURA REACT (OBRIGATÓRIA)

A aplicação é uma SPA React 19 + TypeScript + Vite. React é a base da arquitetura, não apenas a camada visual.

Regras:

- Use apenas componentes funcionais e hooks. Proibido class components.
- Use React Router para todas as rotas.
- Use Zustand para estado global, com slices e seletores. Não use Redux.
- Use estado local com useState/useReducer quando o estado não precisar ser global.
- Não importe React dentro de `src/core`. O core é TypeScript puro e testável.
- Carregue os sandboxes com React.lazy + Suspense.
- Envolva cada sandbox em um ErrorBoundary próprio.
- Crie hooks de fachada para conectar UI e core: useAnalysis, usePipeline, useLogs, useFlags e useModule.
- Use Tailwind e componentes próprios. Não use biblioteca externa de UI.
- Um componente por arquivo, exports nomeados, props tipadas e sem `any`.
- Prefira composição a herança.
- Não manipule o DOM diretamente; use refs apenas quando necessário.
- Use StrictMode no ponto de entrada.

Árvore de rotas:

```text
App
├── /dev → DevLayout
│   ├── index → ModuleHub
│   ├── modulo/:id → ModuleSandboxPage
│   ├── pipeline → PipelinePage
│   ├── estado → StatePage
│   ├── logs → LogsPage
│   ├── flags → FlagsPage
│   └── docs → DocsPage
├── /operador → OperatorPreview
└── * → NotFound
```

Árvore de componentes do modo dev:

```text
DevLayout
├── Sidebar
├── TopBar
└── Outlet
    ├── ModuleHub → ModuleCard[]
    ├── ModuleSandboxPage → SandboxShell → Lazy Sandbox
    ├── PipelinePage
    ├── StatePage
    ├── LogsPage
    ├── FlagsPage
    └── DocsPage
```

Fluxo de dados:

```text
UI → hook → mockEngine → eventBus → store → UI
```

O `mockEngine` é composto por funções puras. O `eventBus` emite PipelineStep e LogEvent. A store se inscreve no eventBus e atualiza a UI.

Tratamento de erros:

- AppErrorBoundary global.
- ModuleErrorBoundary em cada sandbox.
- Toasts para erros recuperáveis.
- Nunca deixe a tela branca.

## 4. STACK

Use apenas:

- React 19 + TypeScript + Vite.
- React Router.
- Tailwind CSS.
- Zustand.
- Zod.
- lucide-react.
- Vitest + React Testing Library.

Não use bibliotecas pesadas de UI, gráficos, PDF, SQL ou diagramas. Componentes de UI devem ser pequenos e feitos à mão com Tailwind.

Se estiver dentro deste repositório, crie o projeto em `web/` e não altere `material de apoio/`.

## 5. ESTRUTURA

```text
web/
  src/
    core/
      types.ts
      contracts.ts
      mockEngine.ts
      eventBus.ts
      store.ts
      seed.ts
    modules/
      modelo/
        manifest.ts
        sandbox.tsx
        README.md
      controlador/
      calculos/
      ia/
      repositorio/
      view-entrada/
      view-dashboard/
      registry.ts
    features/
      dev/
        DevLayout.tsx
        ModuleHub.tsx
        ModuleCard.tsx
        ModuleSandboxPage.tsx
        SandboxShell.tsx
        PipelinePage.tsx
        StatePage.tsx
        LogsPage.tsx
        FlagsPage.tsx
        DocsPage.tsx
      operator/
        OperatorPreview.tsx
    components/
      ui/
        Button.tsx
        Card.tsx
        Badge.tsx
        Input.tsx
        Select.tsx
        Tabs.tsx
        CodeBlock.tsx
        EmptyState.tsx
        Toast.tsx
      layout/
        Sidebar.tsx
        TopBar.tsx
        PageHeader.tsx
      feedback/
        AppErrorBoundary.tsx
        ModuleErrorBoundary.tsx
    hooks/
      useAnalysis.ts
      usePipeline.ts
      useLogs.ts
      useFlags.ts
      useModule.ts
    App.tsx
    main.tsx
    index.css
```

Cada módulo deve ser independente. O shell do modo dev importa apenas o `registry.ts` e os componentes compartilhados.

## 6. CONTRATOS MÍNIMOS

```ts
export type StatusQualidade = "OTIMO" | "ATENCAO" | "CRITICO";

export interface PecaAeronautica {
  id: string;
  nome: string;
  material: string;
  pesoKg: number;
  conforme: boolean;
}

export interface DadosProducaoAero {
  id: string;
  pecaId: string;
  dataLote: string;
  quantidade: number;
  defeituosos: number;
  horas: number;
  temperatura: number;
  pressao: number;
}

export interface RegrasAnaliseAero {
  temperaturaMin: number;
  temperaturaMax: number;
  pressaoMin: number;
  pressaoMax: number;
  confiancaMinimaIA: number;
}

export interface PipelineStep {
  id: string;
  label: string;
  modulo: "VIEW" | "CONTROLLER" | "MODEL" | "CALC" | "IA" | "REPO";
  status: "PENDENTE" | "EXECUTANDO" | "SUCESSO" | "ALERTA" | "ERRO" | "IGNORADO";
  duracaoMs: number;
  motivo?: string;
  entrada?: unknown;
  saida?: unknown;
}

export interface ResultadoAnalise {
  id: string;
  loteId: string;
  status: StatusQualidade;
  produtividade: number;
  taxaDefeitos: number;
  eficiencia: number;
  conformidade: number;
  previsaoFalhas: number;
  recomendacao: string;
  origem: "IA" | "FALLBACK" | "VALIDACAO";
  confianca: number;
  traceId: string;
  passos: PipelineStep[];
}

export interface LogEvent {
  id: string;
  timestamp: string;
  nivel: "DEBUG" | "INFO" | "WARN" | "ERROR";
  modulo: "VIEW" | "CONTROLLER" | "MODEL" | "CALC" | "IA" | "REPO";
  mensagem: string;
  traceId?: string;
  payload?: unknown;
}
```

## 7. MOTOR MOCK

Implemente `runAnalysis(input)` com este fluxo:

1. Validar campos obrigatórios e faixas.
2. Validar a peça.
3. Validar o lote (temperatura, pressão, quantidade e defeituosos).
4. Se inválido, interromper antes da IA e retornar rejeição com erros específicos.
5. Executar IA mock determinística por seed.
6. Se a IA falhar ou tiver confiança abaixo do mínimo, executar fallback determinístico.
7. Classificar o resultado em ÓTIMO, ATENÇÃO ou CRÍTICO.
8. Persistir o resultado no estado local.
9. Emitir PipelineStep[] e LogEvent[].

Regras iniciais configuráveis:

- Temperatura: 150 a 250 °C.
- Pressão: 3 a 10 bar.
- Confiança mínima da IA: 0.70.
- Taxa de defeitos: <= 2% ótimo; <= 5% atenção; acima disso crítico.
- Eficiência: >= 85% ótimo; >= 70% atenção; abaixo disso crítico.

O fallback deve calcular:

- Produtividade = quantidade / horas.
- Taxa de defeitos = defeituosos / quantidade * 100.
- Eficiência = (quantidade / (horas * 50)) * 100, limitada a 0–100.
- Conformidade = 100 - taxa de defeitos.
- Previsão de falhas = função simples da taxa de defeitos e do desvio de temperatura/pressão.

A IA mock deve permitir simular: sucesso, exceção, timeout, baixa confiança e saída inválida.

## 8. REGISTRO DE MÓDULOS EM REACT

Cada módulo exporta um manifest com um componente React carregado de forma lazy:

```ts
import type { ComponentType, LazyExoticComponent } from "react";

export interface ModuleManifest {
  id: string;
  nome: string;
  responsavel: string; // "Membro 1" etc.
  descricao: string;
  status: "planejado" | "em_andamento" | "pronto";
  contratos: string[];
  sandbox: LazyExoticComponent<ComponentType>;
}
```

Exemplo de manifest:

```ts
import { lazy } from "react";
import type { ModuleManifest } from "../../core/contracts";

export const modeloManifest: ModuleManifest = {
  id: "modelo",
  nome: "Modelo",
  responsavel: "Membro 1",
  descricao: "Estruturas de domínio e regras de conformidade.",
  status: "em_andamento",
  contratos: ["PecaAeronautica", "RegrasAnaliseAero"],
  sandbox: lazy(() => import("./sandbox")),
};
```

O `registry.ts` importa os 7 manifests. O Hub renderiza um card para cada módulo com nome, responsável, status, contratos e botão "Abrir sandbox".

O `ModuleSandboxPage` usa `useParams`, encontra o manifest, renderiza o `SandboxShell` e carrega o sandbox com Suspense e ModuleErrorBoundary.

## 9. SANDBOXES OBRIGATÓRIOS

1. Modelo
   - Lista de peças.
   - Criar/editar peça.
   - Alternar `conforme`.
   - Visualizar JSON da peça.

2. Controlador
   - Formulário com temperatura, pressão, quantidade e defeituosos.
   - Botão "Executar validação".
   - Exibir guard clauses aprovadas/reprovadas e o motivo.
   - Atualizar o pipeline global.

3. Cálculos
   - Inputs de quantidade, defeituosos e horas.
   - Exibir produtividade, taxa de defeitos, eficiência e conformidade.
   - Exibir também o resultado do fallback.

4. IA
   - Slider de confiança.
   - Select de modo de falha.
   - Campo de seed.
   - Botão "Executar inferência".
   - Exibir saída mock e se o fallback seria acionado.

5. Repositório
   - Tabela de lotes e resultados salvos.
   - Excluir registro.
   - Botão de reset do seed.
   - Exibir a chave usada no localStorage.

6. View de Entrada
   - Reutilizar o formulário do Preview do Operador.
   - Exibir validação inline e mensagens de erro.

7. View de Dashboard
   - Exibir cards com as métricas do último resultado.
   - Permitir alternar entre os três estados (ÓTIMO, ATENÇÃO, CRÍTICO) para pré-visualizar as cores.
   - Sem gráficos complexos.

## 10. MODO DESENVOLVEDOR

O app inicia em `/dev`. O Modo Desenvolvedor é o foco do MVP.

Layout:

- Sidebar com: Hub, Pipeline, Estado, Logs, Flags & Cenários, Docs.
- Top bar com "Aerolyze Lab", badge "DEV", botão "Preview do Operador" e botão "Resetar dados".
- Rotas:
  - `/dev` → Hub
  - `/dev/modulo/:id` → Sandbox
  - `/dev/pipeline` → Pipeline
  - `/dev/estado` → Estado/Contratos
  - `/dev/logs` → Logs
  - `/dev/flags` → Flags & Cenários
  - `/dev/docs` → Documentação
  - `/operador` → Preview do Operador

Ferramentas globais:

1. Pipeline
   - Lista dos passos da última execução.
   - Status, duração e motivo.
   - Expandir para ver entrada/saída em JSON.
   - Botão para copiar JSON.

2. Estado & Contratos
   - Aba "Estado atual" com o JSON de peças, lotes, resultados, regras e flags.
   - Aba "Contratos" listando os tipos e interfaces do core.
   - Aba "Config" com o JSON de configuração e uma prévia em formato config.toml.
   - Botão para copiar.

3. Logs
   - Lista de eventos do event bus.
   - Filtros por nível e módulo.
   - Botão limpar e exportar JSON.

4. Flags & Cenários
   - Toggles: forçar falha da IA, forçar fallback, validação estrita, latência simulada.
   - Cenários prontos:
     a. Lote conforme.
     b. Temperatura fora da faixa.
     c. Baixa confiança da IA.
     d. Falha total da IA.
   - Cada cenário tem botão "Executar" e mostra o resultado esperado vs. obtido.

5. Documentação
   - Como adicionar um novo módulo.
   - Convenções de pastas.
   - Como usar o motor mock e o event bus.
   - Definição de pronto de um módulo.
   - Mapa dos 7 módulos e seus contratos.

## 11. PREVIEW DO OPERADOR

Rota `/operador`, acessível pelo top bar.

- Formulário simples: peça, data, quantidade, defeituosos, horas, temperatura e pressão.
- Botão "Analisar".
- Card de resultado com status, métricas, recomendação, origem e confiança.
- Histórico curto com as últimas 5 análises.
- Sem gráficos, sem PDF/CSV, sem dashboard completo.
- Serve apenas para validar o fluxo e servir de base para os módulos de View.

## 12. PERSISTÊNCIA

- Salvar peças, lotes, resultados, regras e flags em localStorage.
- Chave versionada: `aerolyze-lab:v1`.
- Seed inicial com 5 peças e 6 lotes.
- Botão "Resetar dados" restaura o seed.
- Se o JSON estiver corrompido, resetar com segurança e avisar via toast.

## 13. DESIGN

- Tema escuro simples: fundo azul-marinho, cards grafite, borda sutil e acento ciano.
- Status: verde, âmbar e vermelho, sempre com ícone e texto.
- Tipografia Inter para UI e monospace para JSON.
- Sidebar fixa, cards, badges, tabelas simples e drawers.
- Componentes de UI pequenos: Button, Card, Badge, Input, Select, Tabs, CodeBlock, EmptyState, Toast.
- Sem animações complexas ou gradientes chamativos.
- Responsivo o suficiente para notebook; não é prioridade mobile.
- Idioma: português do Brasil.
- Acessibilidade básica: labels, foco visível, navegação por teclado e contraste adequado.

## 14. TESTES

- Testes unitários do motor mock: validação, fallback, classificação e cenários.
- Testes de componente com React Testing Library: Hub, um sandbox e o formulário do operador.
- Testes de integração do fluxo: executar análise e verificar atualização do pipeline e dos logs.
- `npm run test` e `npm run build` devem passar.
- Sem erros no console do navegador.

## 15. CRITÉRIOS DE ACEITE

1. `npm install` e `npm run dev` funcionam.
2. O app inicia em `/dev` e mostra o Hub com os 7 módulos.
3. Todos os 7 sandboxes abrem sem erro e têm uma demonstração funcional mínima.
4. Uma análise no sandbox do Controlador atualiza o Pipeline, os Logs e o Estado.
5. As flags alteram o comportamento do motor mock.
6. Os 4 cenários executam e mostram resultado esperado vs. obtido.
7. O Preview do Operador executa uma análise completa.
8. O reset restaura o seed.
9. `npm run build` passa.
10. O README explica como rodar e como cada membro adiciona/evolui seu módulo.

## 16. ORDEM DE IMPLEMENTAÇÃO

1. Scaffold React + Vite + TypeScript + Tailwind, layout, rotas e componentes de UI.
2. Tipos, contratos, motor mock, event bus, store, hooks e seed.
3. Shell do modo dev, Hub e registry.
4. Os 7 sandboxes.
5. Pipeline, Estado, Logs, Flags/Cenários e Docs.
6. Preview do Operador.
7. Testes do motor e dos componentes.
8. README e polish final.

## 17. ENTREGA

Entregue o código completo, sem trechos omitidos. Inclua um README com:

- objetivo do MVP;
- como rodar;
- estrutura de pastas;
- mapa dos 7 módulos;
- como adicionar um módulo React;
- como o motor mock funciona;
- o que está fora de escopo nesta fase.

---

## Notas para a equipe

- **Cada membro** trabalha em `src/modules/<seu-modulo>/`, principalmente no `sandbox.tsx`.
- **Contratos compartilhados** ficam em `src/core/`; mudanças ali devem ser combinadas com o grupo.
- **O shell do modo dev** não deve conhecer detalhes dos módulos: ele lê apenas o `registry.ts`.
- **Definição de pronto de um módulo:** sandbox funcional, manifest atualizado, contratos listados, logs emitidos e nenhum erro no console.
- **O Preview do Operador** é secundário neste MVP; serve para validar o fluxo e orientar os módulos de View.
