# Aerolyze — Análise de Conformidade de Peças Aeroespaciais (Equipe Sigma · UFAL)

> **Universidade Federal de Alagoas (UFAL) — Instituto de Computação (IC)**
> **Disciplina:** Conceitos de Linguagem de Programação (CLP)
> **Equipe Sigma (Grupo 4):** Camila Maria Farias Silva · Luana Marina Santos Ferro · Matheus Lopes dos Santos · Mauricio Mateus dos Santos · Pedro Henrique Balbino Rocha · Rian Antonio da Silva Gaião · Tainara Gomes de Oliveira

---

## 1. Sobre o Projeto

A plataforma **Aerolyze** é um sistema de análise de conformidade de peças aeroespaciais e monitoramento de lotes de produção em ambiente de Indústria 4.0. Concorrendo contra o alto custo de detecção tardia de falhas na aviação, a arquitetura foi projetada sobre o padrão **MVC Estendido** e guiada pelo princípio central:

> **"Validar primeiro, analisar depois."**
> Peças não conformes ou lotes com parâmetros fora da faixa operacional são barrados localmente pelas *guard clauses* do Controlador **antes** de acionar a Inteligência Artificial. Se o módulo de IA falhar, exceder o tempo limite, retornar saída inválida ou apresentar confiança abaixo do mínimo configurado (`0.70`), o algoritmo determinístico de reserva (*fallback*) assume automaticamente.

Este repositório reúne:
1. **`web/` (`Aerolyze Lab`):** Ambiente web modular em **React 19 + TypeScript + Vite + Tailwind CSS + Zustand + Zod + Vitest**, com **Modo Desenvolvedor (`/dev`)**, **7 sandboxes isolados** (um para cada membro da equipe), **Preview do Operador (`/operador`)** e **IA mock determinística ou provedor real NVIDIA NIM** (opcional, via `.env.local`).
2. **`material de apoio/`:** Especificação acadêmica completa (Requisitos, 31 Histórias de Usuário com BDD, diagramas Mermaid e *Gap Analysis*), divisão operacional de tarefas, prompt gerador e acervo de diagramas UML/apresentações em PDF.
3. **`agents-sigma/` & `.agents/`:** Pacote de **Rules**, **Skills** e **Subagentes** configurados para governança arquitetural, desenvolvimento assistido por IA e portão automatizado de qualidade.

---

## 2. Estrutura do Repositório

```text
CLP-Sigma-Aeronautics-Parts-Analysis/
├── README.md                                              # Este guia principal do repositório
├── .agents/                                               # Ponte JSON de descoberta automática para agentes de IA
│   ├── plugins.json                                       # Carrega o plugin aerolyze-sigma
│   └── skills.json                                        # Carrega as skills da Equipe Sigma
├── .github/workflows/rust.yml                             # Build e portão de qualidade Rust no CI
├── Cargo.toml                                             # Pacote Rust e executável nativo `aerolyze`
├── Cargo.lock                                              # Dependências Rust travadas (sem dependências externas)
├── src/                                                    # Domínio Rust e CLI do executável nativo
│   ├── lib.rs                                              # Tipos, validação e análise determinística de lotes
│   └── main.rs                                             # CLI `aerolyze`
├── agents-sigma/                                          # Customizações de IA da Equipe Sigma
│   ├── README.md                                          # Guia de uso de Rules, Skills e Subagentes
│   └── plugins/aerolyze-sigma/
│       ├── plugin.json
│       ├── rules/AGENTS.md                                # Regras obrigatórias de arquitetura e contexto
│       ├── skills/
│       │   ├── aerolyze-module-dev/SKILL.md               # Runbook para evoluir qualquer um dos 7 módulos
│       │   ├── aerolyze-contract-change/SKILL.md          # Protocolo seguro para mudanças em web/src/core/
│       │   └── aerolyze-quality-gate/                     # Checklist de PR + script check-architecture.sh
│       └── agents/
│           ├── architecture-guardian.md                   # Subagente auditor de fronteiras e DoD
│           └── test-engineer.md                           # Subagente especialista em Vitest + Testing Library
├── material de apoio/                                     # Documentação acadêmica, fluxos e diagramas
│   ├── PLANEJAMENTO-E-ESPECIFICACAO-ACADEMICA-Aerolyze.md # Especificação completa (RF/RNF, HU-01..31, Fluxos, Gaps)
│   ├── DIVISAO-TAREFAS-Aerolyze-MVP.md                    # Divisão operacional por membro, fases e DoD
│   ├── PROMPT-Aerolyze-Lab-MVP.md                         # Especificação base do scaffold Aerolyze Lab
│   ├── Diagrama de Componentes.pdf                        # Arquitetura de componentes e interfaces UML
│   ├── Diagrama de Pacotes CLP.pdf                        # Organização MVC de pacotes
│   ├── Diagrama de Sequência Aerolyze.pdf                 # Fluxo condicional (Validação, IA e Fallback)
│   ├── Pitch - CLP Grupo 4.pdf                            # Pitch executivo, casos reais e implantação Rust
│   ├── divisao-tarefas-aerolyze.pdf                       # Plano original de divisão da plataforma em Rust
│   └── clp- apresentação 2 (1).pdf / clp- apresentação 3.pdf
└── web/                                                   # Aplicação Web — Aerolyze Lab (React 19 + TS)
    ├── README.md                                          # Documentação técnica detalhada do front-end
    ├── .env.example                                       # Template da IA real (NVIDIA NIM)
    ├── package.json
    ├── vite.config.ts                                     # Proxy /api/nvidia + configuração do Vitest
    └── src/
        ├── core/                                          # Núcleo TypeScript puro (sem React): tipos, regras, IA mock/NVIDIA, fallback, pipeline
        ├── modules/                                       # 7 módulos independentes (sandboxes carregados via React.lazy)
        ├── features/                                      # Shell do Modo Desenvolvedor (/dev) e Preview do Operador (/operador)
        ├── components/                                    # UI Kit, formulários (AnalysisForm/LimitsModal) e resultados (ResultCard)
        ├── hooks/                                         # Hooks de fachada (useAnalysis, useDados, usePipeline, useLogs, useFlags)
        ├── store/                                         # Estado global Zustand em slices conectado ao eventBus
        └── test/                                          # Suíte Vitest (mock engine, IA/NVIDIA, UI e integração)
```

---

## 3. Onde Está a Documentação

| Documento | Caminho | Conteúdo Principal |
|---|---|---|
| **Planejamento & Especificação Acadêmica (Principal)** | [`material de apoio/PLANEJAMENTO-E-ESPECIFICACAO-ACADEMICA-Aerolyze.md`](./material%20de%20apoio/PLANEJAMENTO-E-ESPECIFICACAO-ACADEMICA-Aerolyze.md) | Consolidação das 3 gerações do projeto, diagramas Mermaid (Pacotes, Componentes, Classes, Sequência e Guard Clauses), equações matemáticas, Requisitos (`RF01–RF27`, `RNF01–RNF10`), **31 Histórias de Usuário (`HU-01` a `HU-31`) com BDD**, *Gap Analysis* e Roadmap em 3 Ondas. |
| **Divisão de Tarefas e Backlog por Membro** | [`material de apoio/DIVISAO-TAREFAS-Aerolyze-MVP.md`](./material%20de%20apoio/DIVISAO-TAREFAS-Aerolyze-MVP.md) | Matriz de propriedade de arquivos, alocação dos 7 integrantes, trilhas paralelas, Definição de Pronto (DoD) e convenções de Git/PR. |
| **Guia Técnico do Front-End (`Aerolyze Lab`)** | [`web/README.md`](./web/README.md) | Arquitetura interna do React, como adicionar/evoluir módulos, contratos do `core/`, funcionamento do `mockEngine` e configuração do provedor real NVIDIA NIM. |
| **Guia de Agentes, Skills e Portão de Qualidade** | [`agents-sigma/README.md`](./agents-sigma/README.md) | Como utilizar as skills (`aerolyze-module-dev`, `aerolyze-contract-change`, `aerolyze-quality-gate`) e os subagentes (`architecture-guardian`, `test-engineer`). |

---

## 4. Como Rodar o Projeto (`web/`)

### Pré-requisitos
- **Node.js** `>= 20.x` e **npm** `>= 10.x`

### Passo a passo

```bash
# 1. Acesse a pasta da aplicação web
cd web

# 2. Instale as dependências
npm install

# 3. (Opcional) Ative a IA real da NVIDIA NIM
cp .env.example .env.local
#    Edite .env.local: preencha NVIDIA_API_KEY e mantenha VITE_IA_PROVEDOR=nvidia.
#    Sem isso, o mock determinístico é usado.

# 4. Inicie o servidor de desenvolvimento (Vite)
npm run dev
```

> **Segurança:** a chave da NVIDIA fica em `web/.env.local` (ignorado pelo Git) e é
> usada apenas pelo proxy do servidor Vite; ela não é incluída no bundle do navegador.
> Nunca faça commit de `.env.local` nem de chaves em texto puro. Para detalhes de
> modelo, timeout, modo direto e fallback, veja a **seção 7** de [`web/README.md`](./web/README.md).

Com o servidor rodando, acesse no navegador:
- **`/dev`** — **Modo Desenvolvedor (padrão):** Hub com os 7 módulos, abertura dos sandboxes individuais (`/dev/modulo/:id`), Inspetor de Pipeline (`/dev/pipeline`), Estado & Contratos + Prévia `config.toml` (`/dev/estado`), Logs do EventBus (`/dev/logs`), Flags & 4 Cenários Oficiais (`/dev/flags`) e Documentação integrada (`/dev/docs`).
- **`/operador`** — **Preview do Operador:** Fluxo integrado ponta a ponta com formulário validado via Zod, modal *"Configurar Limites"*, card de resultado semântico, alerta de qualidade para lotes críticos e histórico curto das últimas 5 análises.

### Executar Testes e Build de Produção

```bash
cd web

# Executa a suíte de testes unitários, de componentes e de integração (Vitest)
npm run test

# Executa a checagem estrita de tipos (tsc -b) e gera o bundle de produção (Vite)
npm run build
```

### Executar o Portão de Qualidade Arquitetural Completo

Na raiz do repositório (em terminal Bash / Git Bash / WSL):

```bash
bash agents-sigma/plugins/aerolyze-sigma/skills/aerolyze-quality-gate/scripts/check-architecture.sh
```

O script valida automaticamente:
1. Ausência de imports de React em `web/src/core/`.
2. Ausência de imports cruzados entre os 7 módulos em `web/src/modules/`.
3. Acesso ao `localStorage` restrito exclusivamente a `web/src/core/repository.ts`.
4. Ausência de `: any` explícito em todo `web/src/`.
5. Sucesso integral em `npm run test` e `npm run build`.

---

## 5. Executável Nativo Rust (`aerolyze`)

O pacote Rust na raiz implementa a base nativa de análise determinística de lotes. Ele aplica as regras de memória segura e erros explícitos e gera um único executável chamado `aerolyze`. Esta crate não substitui nem migra o MVP web descrito acima.

### Pré-requisito
- Rust estável com Cargo.

### Compilar e executar

Na raiz do repositório:

```bash
# Compila o executável nativo em target/debug/aerolyze
cargo build

# Executa os testes e as verificações de qualidade
cargo test --all-targets
cargo fmt --all -- --check
cargo clippy --all-targets -- -D warnings

# Compila a versão otimizada em target/release/aerolyze
cargo build --release

# Exibe as opções da CLI ou analisa um lote
cargo run -- --help
cargo run -- analisar 100 2 2 200 6.5
```

O alvo `aerolyze` usa apenas a biblioteca padrão, propaga erros com `Result` e rejeita entradas inválidas sem `unwrap()`, `expect()` ou `panic!` no código de produção. O workflow `Rust quality` executa formatação, testes, Clippy e build em pull requests.

---

## 6. Mapa dos 7 Módulos da Equipe Sigma

| # | Módulo (`id`) | Camada | Responsável | Pasta do Sandbox | Arquivos de Core sob sua Responsabilidade | Status MVP |
|---|---|---|---|---|---|---|
| **1** | **Modelo** (`modelo`) | `MODEL` | Membro 1 | `web/src/modules/modelo/` | `src/core/types.ts`, `src/core/rules.ts` | Pronto |
| **2** | **Controlador** (`controlador`) | `CONTROLLER` | Membro 2 | `web/src/modules/controlador/` | `src/core/contracts.ts`, `src/core/pipeline.ts`, `src/core/mockEngine.ts`, `src/core/eventBus.ts`, `src/store/` | Pronto |
| **3** | **Cálculos & Fallback** (`calculos`) | `CALC` | Membro 3 | `web/src/modules/calculos/` | `src/core/calculations.ts`, `src/core/fallback.ts` | Pronto |
| **4** | **Sistema de IA** (`ia`) | `IA` | Membro 4 | `web/src/modules/ia/` | `src/core/ia.ts`, `src/core/iaNvidia.ts`, `src/core/iaProvedor.ts` | Pronto (mock + NVIDIA NIM) |
| **5** | **Repositório de Dados** (`repositorio`) | `REPO` | Membro 5 | `web/src/modules/repositorio/` | `src/core/repository.ts`, `src/core/seed.ts`, `src/core/config.ts` | Pronto |
| **6** | **View de Entrada** (`view-entrada`) | `VIEW` | Membro 6 | `web/src/modules/view-entrada/` | `src/core/schemas.ts`, `src/components/form/` | Pronto |
| **7** | **View de Dashboard** (`view-dashboard`) | `VIEW` | Membro 7 | `web/src/modules/view-dashboard/` | `src/components/ui/`, `src/components/layout/`, `src/components/result/`, `src/features/operator/` | Pronto |

---

## 7. Fluxo de Trabalho com IA e Convenções de Git

### Como iniciar uma nova sessão de IA economizando tokens
Toda a leitura dos PDFs, diagramas e contratos já está consolidada em [`material de apoio/PLANEJAMENTO-E-ESPECIFICACAO-ACADEMICA-Aerolyze.md`](./material%20de%20apoio/PLANEJAMENTO-E-ESPECIFICACAO-ACADEMICA-Aerolyze.md) e referenciada automaticamente em [`agents-sigma/plugins/aerolyze-sigma/rules/AGENTS.md`](./agents-sigma/plugins/aerolyze-sigma/rules/AGENTS.md). Ao pedir uma evolução (ex.: implementar uma História de Usuário da **Onda 2** ou **Onda 3**), basta indicar o número da HU e a skill correspondente:

- **Evoluir um módulo ou componente visual:** *"Use a skill `aerolyze-module-dev` para implementar a `HU-20` no módulo `view-entrada`."*
- **Alterar contratos compartilhados no Core:** *"Use a skill `aerolyze-contract-change` para implementar a `HU-04` (`DimensaoPeca`)."*
- **Auditar e testar antes do PR:** *"Invoque os subagentes `test-engineer` e `architecture-guardian` e rode a skill `aerolyze-quality-gate`."*

### Convenções de Branches, Commits e Pull Requests
- **Branches:** `feat/<modulo>-<tarefa>`, `fix/<modulo>-<tarefa>`, `docs/<tema>`, `chore/<tema>`
- **Commits (Conventional Commits):**
  - `feat(view-entrada): adiciona cortes de eficiencia no LimitsModal (HU-20)`
  - `feat(calculos): implementa estatisticas multi-lote (HU-11)`
  - `docs(planejamento): atualiza especificacao academica e HUs`
- **Pull Requests:** Título no formato `[<modulo>] descrição curta`, passando obrigatoriamente pelo script `check-architecture.sh`.
