# Regras de Arquitetura e Estabilidade — Aerolyze Lab (Equipe Sigma)

Estas regras são **obrigatórias** ao criar, editar ou revisar qualquer código em `web/`.

## 1. Princípio Central do Domínio
- **"Validar primeiro, analisar depois."** Dados inválidos devem ser barrados pelas guard clauses no Controlador (`src/core/pipeline.ts`) **antes** de qualquer chamada à IA.
- Se a IA falhar (`EXCECAO`, `TIMEOUT`), retornar saída inválida (`SAIDA_INVALIDA`) ou confiança abaixo de `regras.confiancaMinimaIA`, o fallback determinístico (`src/core/fallback.ts`) deve assumir automaticamente.

## 2. Fronteiras de Dependência (Invioláveis)
- **`web/src/core/` é TypeScript puro:** NUNCA importe `react`, `react-dom`, `react-router` ou qualquer arquivo de `modules/`, `features/` ou `components/` dentro de `src/core/`.
- **Isolamento entre os 7 módulos (`web/src/modules/<id>/`):** Um módulo NUNCA importa arquivos de outro módulo. Código compartilhado deve ficar em `src/core/`, `src/components/` ou `src/hooks/`.
- **Shell do Modo Desenvolvedor (`web/src/features/dev/`):** Conhece os módulos **apenas** por meio de `src/modules/registry.ts`. Não importe arquivos internos de um módulo diretamente nas páginas de `features/dev/`.
- **Porta única de persistência:** Apenas `src/core/repository.ts` pode acessar `localStorage` (chave versionada `aerolyze-lab:v1`). Componentes e sandboxes devem usar o hook `useRepositorio()`.
- **Fluxo de dados unidirecional:** `UI → hook (src/hooks/) → mockEngine → eventBus → store (Zustand) → UI`.

## 3. Padrões de Código React e TypeScript
- Apenas **componentes funcionais e hooks**. Proibido class components.
- Tipagem estrita: **proibido usar `any`**.
- Acessibilidade de status (`OTIMO`, `ATENCAO`, `CRITICO`): a cor **nunca** deve ser o único indicador visual; exiba sempre ícone + texto.
- Idioma da interface, mensagens de validação, logs e documentação: **Português do Brasil (pt-BR)**.

## 4. Propriedade de Arquivos (7 Membros)
- **Membro 1 (Modelo):** `src/core/types.ts`, `src/core/rules.ts`, `src/modules/modelo/`
- **Membro 2 (Controlador):** `src/core/contracts.ts`, `src/core/pipeline.ts`, `src/core/mockEngine.ts`, `src/core/eventBus.ts`, `src/store/`, `src/modules/registry.ts`, `src/features/dev/`, `src/modules/controlador/`
- **Membro 3 (Cálculos & Fallback):** `src/core/calculations.ts`, `src/core/fallback.ts`, `src/modules/calculos/`
- **Membro 4 (IA):** `src/core/ia.ts`, `src/modules/ia/`
- **Membro 5 (Repositório):** `src/core/repository.ts`, `src/core/seed.ts`, `src/modules/repositorio/`
- **Membro 6 (View de Entrada):** `src/core/schemas.ts`, `src/components/form/`, `src/modules/view-entrada/`
- **Membro 7 (View de Dashboard):** `src/components/ui/`, `src/components/layout/`, `src/components/result/`, `src/features/operator/`, `src/modules/view-dashboard/`
