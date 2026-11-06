# Divisão de Tarefas — Aerolyze Lab (MVP React)

> **Documento operacional da Equipe Sigma — UFAL.**
> Base: `divisao-tarefas-aerolyze.pdf` + `PROMPT-Aerolyze-Lab-MVP.md`.
> **Escopo:** scaffold web em React com Modo Desenvolvedor.
> **Objetivo:** permitir que os 7 membros trabalhem em paralelo, com contratos claros, dependências explícitas e entregas verificáveis.

---

## 1. Resumo executivo

- **7 membros, 7 módulos**, cada um com uma pasta própria em `src/modules/`.
- **6 fases (0 a 5)** com checkpoints de integração.
- **5 trilhas paralelas** após a Fase 0.
- **Contratos congelados** ao final da Fase 0; mudanças exigem revisão.
- **MVP:** Hub + 7 sandboxes + pipeline + logs + flags/cenários + documentação + preview do operador.
- **Fora do MVP:** IA real, SQL real, PDF/CSV, gráficos avançados, simulação dimensional e backend Rust.
- **Regra de ouro:** um módulo não importa código de outro módulo. O que for compartilhado vai para `src/core/` ou `src/components/`.

---

## 2. O que foi otimizado em relação ao PDF original

| Ponto | Original | Versão otimizada |
|---|---|---|
| Escopo | Plataforma Rust completa | Scaffold React + modo dev (MVP) |
| Fronteira do Controlador | Membros 2 e 3 ambos no Controlador | Membro 2 = orquestração/validação; Membro 3 = cálculos/fallback; interface `AnalysisEngine` |
| Dependências | Fases sequenciais por compilação | Contratos na Fase 0 + mocks; trilhas paralelas |
| Fronteira das Views | Membros 6 e 7 ambos na View | Membro 6 = entrada/limites; Membro 7 = resultado/dashboard; componentes compartilhados |
| Dados | SQL real desde o início | Interface `Repository` + localStorage; SQL real fica para depois |
| IA | Modelo real embarcado | `AIProvider` mock determinístico com modos de falha |
| Critérios de aceite | Genéricos | Critérios verificáveis por tarefa |
| Integração | Apenas no final | Checkpoints por fase + PRs pequenos |
| Documentação | PDF | Markdown + README por módulo |

### Principais ganhos

1. **Menos bloqueio:** todos trabalham contra contratos e mocks desde a primeira semana.
2. **Menos retrabalho:** as fronteiras entre Controlador/Cálculos e Entrada/Dashboard ficam explícitas.
3. **Menos conflito de merge:** cada arquivo tem um dono definido.
4. **Mais previsibilidade:** cada tarefa tem entrega e critério de aceite.
5. **Menos escopo acidental:** o que não é MVP está listado no backlog futuro.

---

## 3. Arquitetura de trabalho

```text
src/
├── core/                 # Contratos, motor mock, eventos, seed (sem React)
├── modules/              # 7 módulos independentes
│   ├── modelo/
│   ├── controlador/
│   ├── calculos/
│   ├── ia/
│   ├── repositorio/
│   ├── view-entrada/
│   ├── view-dashboard/
│   └── registry.ts
├── features/
│   ├── dev/              # Shell, hub, pipeline, estado, logs, flags, docs
│   └── operator/         # Preview do operador
├── components/
│   ├── ui/               # Botões, cards, badges, inputs
│   ├── layout/           # Sidebar, TopBar, PageHeader
│   ├── form/             # Componentes de formulário
│   └── result/           # Cards de resultado e status
└── store/                # Zustand
```

### Regras de dependência

- `core` **não importa React** e não importa nada de `modules`, `features` ou `components`.
- `modules/*` importa apenas `core`, `components` e arquivos da própria pasta.
- `features/dev` importa `core`, `components` e `modules/registry.ts`.
- `features/operator` importa `components`, `core` e, se necessário, componentes de View.
- Nenhum módulo acessa `localStorage` diretamente; apenas o Repositório.
- Nenhum módulo chama outro módulo diretamente; use os contratos de `core`.

### Fluxo de dados

```text
UI → hook → core (pipeline/mockEngine) → eventBus → store → UI
```

---

## 4. Propriedade de arquivos e contratos

| Área / arquivo | Dono | Consumidores | Observação |
|---|---|---|---|
| `src/core/types.ts` | Membro 1 | Todos | Congelar após a Fase 0 |
| `src/core/rules.ts` | Membro 1 | Membro 2, 3, 6 | Regras e classificação |
| `src/core/contracts.ts` | Membro 2 | Todos | Revisão obrigatória do Membro 1 |
| `src/core/pipeline.ts` | Membro 2 | Membro 3, 4, 5, 7 | Orquestração e guard clauses |
| `src/core/mockEngine.ts` | Membro 2 | Todos | Composição do fluxo |
| `src/core/eventBus.ts` | Membro 2 | Todos | PipelineStep e LogEvent |
| `src/store/` | Membro 2 | Todos | Zustand com slices |
| `src/modules/registry.ts` | Membro 2 | Shell | 7 manifests |
| `src/features/dev/*Page` | Membro 2 | Todos | Pipeline, Estado, Logs, Flags, Docs |
| `src/features/dev/ModuleSandboxPage.tsx` | Membro 2 | Todos | Carrega o sandbox |
| `src/core/calculations.ts` | Membro 3 | Membro 2, 7 | Funções puras |
| `src/core/fallback.ts` | Membro 3 | Membro 2, 7 | Algoritmo determinístico |
| `src/core/ia.ts` | Membro 4 | Membro 2, 3 | IA mock determinística |
| `src/core/repository.ts` | Membro 5 | Membro 2, 7 | Única porta de dados |
| `src/core/seed.ts` | Membro 5 | Membro 1, 5 | Dados iniciais |
| `src/modules/view-entrada/` | Membro 6 | Membro 7 | Formulário e limites |
| `src/components/form/` | Membro 6 | Membro 7 | Controles de formulário |
| `src/modules/view-dashboard/` | Membro 7 | Operador | Resultado e dashboard |
| `src/components/ui/`, `components/result/`, `components/layout/` | Membro 7 | Todos | UI kit e layout |
| `src/features/dev/DevLayout.tsx`, `ModuleHub.tsx`, `ModuleCard.tsx` | Membro 7 | Membro 2 | Shell visual |
| `src/features/operator/OperatorPreview.tsx` | Membro 7 | Membro 6 | Integração final |

---

## 5. Matriz de alocação

| Membro | Módulo | Pasta | Foco | Sandbox | Depende de |
|---|---|---|---|---|---|
| 1 | Modelo | `src/modules/modelo/` | Types, regras, classificação | CRUD de peças + JSON | Nada (Fase 0) |
| 2 | Controlador | `src/modules/controlador/` | Contratos, pipeline, guard clauses, store | Validação + pipeline | Types (1), cálculos (3), IA (4) |
| 3 | Cálculos & Fallback | `src/modules/calculos/` | Métricas, fallback, recomendação | Calculadora + fallback | Types (1) |
| 4 | IA | `src/modules/ia/` | `AIProvider` mock, confiança, falhas | Simulador de IA | Types (1), contrato (2) |
| 5 | Repositório | `src/modules/repositorio/` | localStorage, seed, CRUD | Tabelas + reset | Types (1), contrato (2) |
| 6 | View de Entrada | `src/modules/view-entrada/` | Formulário, Zod, limites | Form + validação | Types/contratos (1/2), UI kit (7) |
| 7 | View de Dashboard | `src/modules/view-dashboard/` | Result card, status, alertas, UI kit | Cards + 3 estados | Types (1), UI kit (7) |

---

## 6. Backlog por membro

### 6.1 Membro 1 — Modelo

**Foco:** contratos de domínio, regras e classificação.

- [ ] **T1.1** Definir `PecaAeronautica`, `DadosProducaoAero`, `ResultadoAnalise`, `RegrasAnaliseAero` e `StatusQualidade` em `src/core/types.ts`.
- [ ] **T1.2** Definir valores padrão das regras e a função `classificar(resultado, regras)`.
- [ ] **T1.3** Implementar `validarPeca(peca)` com códigos de erro específicos.
- [ ] **T1.4** Criar o sandbox do Modelo: listar, criar, editar, alternar `conforme` e visualizar JSON.
- [ ] **T1.5** Escrever testes unitários de classificação e validação de peça.
- [ ] **T1.6** Atualizar `manifest.ts` e `README.md` do módulo.

**Aceite:**

- Todos os tipos são exportados por `src/core/types.ts`.
- `classificar` cobre os três estados com testes.
- `validarPeca` retorna motivos claros.
- O sandbox funciona sem depender de outro módulo.
- `core` não importa React.

---

### 6.2 Membro 2 — Controlador

**Foco:** contratos, orquestração, guard clauses, estado global e shell de dev.

- [ ] **T2.1** Definir `AnalysisGateway`, `AnalysisEngine`, `AIProvider`, `Repository`, `ValidationIssue`, `PipelineStep` e `LogEvent` em `src/core/contracts.ts`.
- [ ] **T2.2** Implementar `eventBus` e a store Zustand com slices de sessão, regras, dados, logs e flags.
- [ ] **T2.3** Implementar `pipeline.ts` e `mockEngine.ts` com o fluxo: validar → IA → confiança → fallback → classificar → persistir.
- [ ] **T2.4** Codificar as guard clauses: campos obrigatórios, faixas de temperatura/pressão, quantidade, defeituosos e horas.
- [ ] **T2.5** Implementar `registry.ts`, rotas, `ModuleSandboxPage`, `SandboxShell` e as páginas de Pipeline, Estado, Logs, Flags e Docs.
- [ ] **T2.6** Criar o sandbox do Controlador: formulário de validação, lista de guard clauses e pipeline atualizado.
- [ ] **T2.7** Escrever testes de integração: rejeição precoce, IA não chamada e fallback acionado.
- [ ] **T2.8** Documentar os contratos e atualizar o README do módulo.

**Aceite:**

- Dados inválidos retornam rejeição antes de qualquer chamada à IA.
- O pipeline contém steps com status, tempo e motivo.
- O `traceId` correlaciona logs e execução.
- O sandbox atualiza o pipeline global.
- Testes provam que a IA não é chamada em rejeição.
- O Hub lista os 7 módulos e as rotas funcionam.

---

### 6.3 Membro 3 — Cálculos & Fallback

**Foco:** métricas determinísticas, fallback e recomendação.

- [ ] **T3.1** Implementar `calcularMetricas(dados)` com produtividade, taxa de defeitos, eficiência, conformidade e previsão de falhas.
- [ ] **T3.2** Implementar `executarFallback(dados, regras)` retornando um `ResultadoAnalise` com `origem: "FALLBACK"`.
- [ ] **T3.3** Implementar a recomendação textual com base no status e no principal desvio.
- [ ] **T3.4** Criar o sandbox de Cálculos com entradas, métricas e resultado do fallback.
- [ ] **T3.5** Escrever testes de borda: horas zero, quantidade zero, defeituosos maior que produzidos e valores extremos.
- [ ] **T3.6** Atualizar `manifest.ts` e `README.md` do módulo.

**Aceite:**

- Fórmulas documentadas e testadas.
- O fallback retorna um resultado completo e classificável.
- A recomendação muda conforme o status e o desvio.
- Nenhuma função do módulo importa React.
- O sandbox mostra entradas e saídas de forma clara.

---

### 6.4 Membro 4 — IA

**Foco:** `AIProvider` mock determinístico e modos de falha.

- [ ] **T4.1** Implementar `simularIA(dados, peca, regras, config, seed)` com PRNG determinístico.
- [ ] **T4.2** Implementar os modos de falha: exceção, timeout, baixa confiança e saída inválida.
- [ ] **T4.3** Expor metadados do modelo: nome `modelo_ia.bin`, versão, precisão e status.
- [ ] **T4.4** Criar o sandbox de IA: slider de confiança, select de falha, seed, saída JSON e aviso de fallback.
- [ ] **T4.5** Escrever testes de determinismo e de cada modo de falha.
- [ ] **T4.6** Atualizar `manifest.ts` e `README.md` do módulo.

**Aceite:**

- A mesma seed e a mesma entrada geram a mesma saída.
- Cada modo de falha é reproduzível.
- O Controlador consegue acionar o fallback a partir de cada falha.
- O sandbox mostra a saída bruta e se o fallback seria acionado.
- A IA não faz chamadas de rede.

---

### 6.5 Membro 5 — Repositório

**Foco:** persistência local, seed e única porta de dados.

- [ ] **T5.1** Definir `Repository` e implementar a versão localStorage com a chave `aerolyze-lab:v1`.
- [ ] **T5.2** Criar o seed determinístico com 5 peças e 6 lotes.
- [ ] **T5.3** Implementar `buscarPeca`, `buscarLote`, `registrarResultado`, `listarResultados`, `remover` e `reset`.
- [ ] **T5.4** Tratar JSON corrompido, versão de schema e reset seguro.
- [ ] **T5.5** Criar o sandbox do Repositório: tabelas, exclusão, reset e chave usada.
- [ ] **T5.6** Escrever testes de salvar, carregar, resetar e recuperar dados corrompidos.
- [ ] **T5.7** Atualizar `manifest.ts` e `README.md` do módulo.

**Aceite:**

- Apenas o Repositório acessa `localStorage`.
- O seed é determinístico.
- Dados corrompidos não quebram a aplicação.
- O sandbox lista e remove registros.
- O reset restaura o seed.

---

### 6.6 Membro 6 — View de Entrada

**Foco:** formulário, validação e configuração de limites.

- [ ] **T6.1** Criar o formulário controlado com peça, data, quantidade, defeituosos, horas, temperatura e pressão.
- [ ] **T6.2** Implementar o schema Zod e as mensagens de validação inline.
- [ ] **T6.3** Implementar o modal "Configurar Limites" com temperatura, pressão e confiança mínima.
- [ ] **T6.4** Criar componentes reutilizáveis em `src/components/form/`.
- [ ] **T6.5** Criar o sandbox de View de Entrada reutilizando o formulário.
- [ ] **T6.6** Escrever testes de componente: campos obrigatórios, faixas e submit.
- [ ] **T6.7** Atualizar `manifest.ts` e `README.md` do módulo.

**Aceite:**

- O formulário bloqueia dados inválidos antes de chamar o motor.
- As mensagens são específicas e acessíveis.
- O modal de limites atualiza as regras na store.
- O sandbox exibe validação inline.
- Nenhum cálculo de domínio fica duplicado na View.

**Backlog futuro:** simulação dimensional (comprimento, largura, espessura e tolerância), se o contrato for aprovado. Não bloqueia o MVP.

---

### 6.7 Membro 7 — View de Dashboard

**Foco:** resultado, status, alertas, UI kit e preview do operador.

- [ ] **T7.1** Criar `ResultCard` com status, métricas, recomendação, origem e confiança.
- [ ] **T7.2** Implementar os três estados visuais com cor, ícone e texto.
- [ ] **T7.3** Implementar o alerta de qualidade para resultados críticos.
- [ ] **T7.4** Criar o histórico curto com as últimas 5 análises.
- [ ] **T7.5** Criar o `OperatorPreview` integrando o formulário do Membro 6 ao resultado.
- [ ] **T7.6** Criar a base do UI kit e o layout visual (`Button`, `Card`, `Badge`, `Sidebar`, `TopBar`, `PageHeader`).
- [ ] **T7.7** Criar o sandbox de View de Dashboard com alternância entre os três estados.
- [ ] **T7.8** Escrever testes de componente para os três estados e o alerta.
- [ ] **T7.9** Atualizar `manifest.ts` e `README.md` do módulo.

**Aceite:**

- O resultado exibe todas as métricas obrigatórias.
- A cor nunca é o único indicador de status.
- O alerta aparece em resultados críticos.
- O histórico atualiza após uma análise.
- O preview do operador executa o fluxo completo.
- O UI kit é reutilizado pelos outros módulos.

**Backlog futuro:** gráficos, exportação CSV/PDF e dashboard analítico completo.

---

## 7. Fases, trilhas e checkpoints

As fases são **marcos de integração**, não bloqueios. Depois da Fase 0, todos podem trabalhar em paralelo contra contratos e mocks.

| Fase | Membros | Objetivo | Checkpoint |
|---|---|---|---|
| **0 — Fundação** | 1, 2, 7 | Scaffold, types, contratos, registry, UI kit, Hub, rotas | App abre, Hub com 7 cards e sandboxes stub temporários |
| **1 — Domínio e Dados** | 1, 5 | Regras, classificação, seed, repositório local | Criar/editar peça e lote; persistir e recarregar |
| **2 — Núcleo de Controle** | 2, 3 | Pipeline, guard clauses, cálculos e fallback | Análise válida, rejeição precoce e fallback com IA mockada |
| **3 — Inteligência** | 4 | IA mock, confiança e modos de falha | Falha/baixa confiança aciona fallback |
| **4 — Interface e Integração** | 6, 7 | Formulário, limites, resultado, dashboard e operador | Preview do operador de ponta a ponta |
| **5 — Endurecimento** | Todos | Testes, READMEs, revisão, build e polish | `npm run test` e `npm run build` passam |

### Trilhas paralelas após a Fase 0

| Trilha | Membros | Entrega |
|---|---|---|
| A — Domínio | 1 | Types, regras e classificação |
| B — Dados | 5 | Repositório e seed |
| C — Núcleo | 2, 3 | Pipeline, guard clauses, cálculos e fallback |
| D — IA | 4 | `AIProvider` mock e modos de falha |
| E — Interface | 6, 7 | Formulário, resultado, UI kit e operador |

### Caminho crítico

```text
types/contracts → cálculos/fallback → pipeline → result card → operator preview → entrega
```

**Gargalos previstos:**

- Membro 1 e Membro 2 na definição de contratos.
- Membro 2 na integração do pipeline.
- Membro 7 na integração visual final.

**Mitigação:**

- Congelar contratos ao final da Fase 0.
- Membro 1 revisa os contratos do Membro 2.
- Membro 2 usa stubs temporários de cálculos e IA.
- Membros 6 e 7 trabalham com fixtures de `ResultadoAnalise`.
- Se alguém ficar bloqueado por mais de um dia, fazer pair programming ou redistribuir a tarefa.

---

## 8. Definição de pronto

### Por tarefa

- Código implementado e tipado, sem `any`.
- Teste unitário ou de componente quando aplicável.
- `npm run build` passa.
- Sem erros no console.
- Sandbox funcional, se a tarefa for de módulo.
- `manifest.ts` atualizado.
- README do módulo atualizado.

### Por módulo

- Sandbox abre e funciona sem depender de outro módulo.
- Contratos listados no manifest.
- Logs emitidos com o módulo correto.
- Nenhum acesso direto a `localStorage` fora do Repositório.
- Nenhum import de React em `src/core`.
- Nenhum import cruzado entre módulos.
- Pelo menos um revisor aprovou o PR.

### Global

- Hub com os 7 módulos.
- Fluxo completo no preview do operador.
- Pipeline, logs e flags funcionando.
- Reset de dados funcionando.
- README principal atualizado.
- `npm run test` e `npm run build` passam.

---

## 9. Convenções de colaboração

### Branches

- `feat/<modulo>-<tarefa>` — nova funcionalidade.
- `fix/<modulo>-<tarefa>` — correção.
- `docs/<tema>` — documentação.
- `chore/<tema>` — configuração e manutenção.

### Commits

- `feat(modelo): adiciona validarPeca`
- `fix(controlador): corrige parada precoce`
- `docs(ia): documenta modos de falha`
- `test(calculos): cobre horas zero`

### Pull requests

- Título: `[modulo] descrição curta`.
- Descrição: o que mudou, por que, como testar e screenshots quando houver UI.
- PRs pequenos, preferencialmente com menos de 400 linhas alteradas.
- Pelo menos 1 aprovação; 2 aprovações para `core/types.ts` e `core/contracts.ts`.
- Não fazer merge com conflitos, testes quebrados ou `console.log` esquecido.

### Cadência

- **Diário assíncrono:** o que fiz, o que farei, bloqueios.
- **Checkpoint semanal:** 15 minutos para integrar e revisar o caminho crítico.
- **Regra de bloqueio:** se uma tarefa estiver bloqueada por mais de 1 dia, pedir ajuda ou reatribuir.
- **Regra de contrato:** mudança em contrato compartilhado exige aviso no grupo e revisão do Membro 1 e do Membro 2.

---

## 10. Riscos e mitigação

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Contratos mudarem depois da Fase 0 | Média | Alto | Congelar tipos/contratos; revisão obrigatória |
| Membro 2 virar gargalo de integração | Alta | Alto | Stubs, pair programming e distribuição de páginas de dev |
| Membros 3 e 4 ficarem bloqueados por tipos | Média | Alto | Fase 0 curta e focada em contratos |
| UI esperar o motor ficar pronto | Alta | Médio | Fixtures de `ResultadoAnalise` e mocks |
| Escopo crescer além do MVP | Alta | Alto | Consultar a lista de fora de escopo antes de aceitar nova feature |
| Conflitos de merge | Média | Médio | Ownership por arquivo + PRs pequenos |
| Dados locais corrompidos | Baixa | Médio | Chave versionada, validação e reset seguro |
| Confusão entre Rust e React | Média | Médio | Este MVP é React; Rust é backend futuro |
| Falta de testes no núcleo | Média | Alto | Testes obrigatórios para cálculos, fallback e guard clauses |

---

## 11. Checklist de integração final

- [ ] Hub lista os 7 módulos.
- [ ] Os 7 sandboxes abrem sem erro.
- [ ] Uma análise válida retorna resultado completo.
- [ ] Dados inválidos são rejeitados antes da IA.
- [ ] Falha da IA aciona o fallback.
- [ ] Baixa confiança aciona o fallback.
- [ ] O pipeline mostra steps, tempos e motivos.
- [ ] Os logs têm `traceId` e filtros.
- [ ] As flags alteram o comportamento do motor.
- [ ] Os 4 cenários mostram esperado vs. obtido.
- [ ] O preview do operador funciona de ponta a ponta.
- [ ] O reset restaura o seed.
- [ ] `npm run test` passa.
- [ ] `npm run build` passa.
- [ ] READMEs dos módulos estão atualizados.

---

## 12. Backlog futuro (fora do MVP)

Itens que estavam no PDF original ou que fazem sentido depois do scaffold:

- **Membro 6:** simulação dimensional de peças (comprimento, largura, espessura e tolerância).
- **Membro 7:** exportação CSV/PDF e dashboard com gráficos.
- **Membro 5:** repositório SQL real (PostgreSQL/SQLite) e parsing de `config.toml`.
- **Membro 4:** integração com modelo de IA real (`modelo_ia.bin`).
- **Membro 2:** command palette, snapshots de estado e diagrama de arquitetura interativo.
- **Membro 3:** otimização de parâmetros e análises estatísticas mais avançadas.
- **Equipe:** integração futura com backend Rust via HTTP, Tauri ou WASM.

---

## 13. Observação final

Este documento não substitui o PDF original; ele é a **versão operacional para o MVP web em React**. A divisão original de 7 módulos foi preservada, mas as fronteiras, dependências e entregas foram ajustadas para permitir trabalho paralelo e reduzir bloqueios.
