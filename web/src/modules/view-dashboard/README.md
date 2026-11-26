# Módulo 7 — View de Dashboard (`src/modules/view-dashboard/`)

**Responsável:** Membro 7
**Camada:** `VIEW`
**Rota do sandbox:** `/dev/modulo/view-dashboard`

## Escopo

- Resultado da análise: `ResultCard` com status, métricas, recomendação, origem e confiança.
- Estados visuais (`OTIMO`, `ATENCAO`, `CRITICO`) sempre com cor, ícone e texto.
- Alerta de qualidade para resultados críticos.
- Histórico curto das últimas 5 análises.
- Base do UI kit (`src/components/ui/`) e layout (`src/components/layout/`).
- Preview do Operador (`src/features/operator/OperatorPreview.tsx`), que integra o formulário do Membro 6 ao resultado.

## Contratos usados

`ResultadoAnalise`, `StatusQualidade`, `MetricasProducao`, `RegrasAnaliseAero`, `OrigemResultado` (de `src/core/types.ts`). Este módulo **só lê** esses contratos; não os altera.

## Componentes de resultado

Todos em `src/components/result/ResultCard.tsx`.

| Componente | Props principais | O que faz |
|---|---|---|
| `ResultCard` | `resultado`, `titulo?`, `regras?` | Card completo: lote e trace, `StatusBadge`, origem, confiança, `QualityAlert`, 5 métricas e recomendação. |
| `StatusBadge` | `status` | Badge com ícone e texto: `Status: <rótulo> (<CÓDIGO>)`. |
| `QualityAlert` | `resultado` | Alerta (`role="alert"`) exibido **apenas** quando `status === "CRITICO"`; lista a recomendação e os erros de validação. |
| `MetricTile` | `rotulo`, `valor`, `subtitulo?` | Bloco de uma métrica. |
| `AnalysisHistoryList` | `resultados`, `limite?` (padrão 5), `onSelecionar?`, `selecionadoId?` | Lista curta das análises mais recentes; mostra mensagem quando vazia. |

### Métricas exibidas

Produtividade (pç/h), Taxa de defeitos (%), Eficiência (%), Conformidade (%) e Previsão de falhas (%). Os subtítulos de limiares de *Taxa de defeitos* e *Eficiência* vêm da prop `regras` (padrão `REGRAS_PADRAO`), então acompanham o modal de limites.

### Estados visuais

| Status | Cor | Ícone | Texto |
|---|---|---|---|
| `OTIMO` | verde | `CheckCircle2` | Ótimo |
| `ATENCAO` | âmbar | `AlertTriangle` | Atenção |
| `CRITICO` | vermelho | `AlertOctagon` | Crítico (exibe o `QualityAlert`) |

**Regra de acessibilidade:** a cor nunca é o único indicador de status; sempre há ícone e texto.

### Origem e confiança

- Origem: `IA`, `FALLBACK` ou `VALIDACAO` ("Rejeitado na validação").
- A confiança é exibida em %, exceto quando a origem é `VALIDACAO` (a IA não foi executada e o pipeline devolve confiança 0).

## UI Kit base

Componentes compartilhados por todos os módulos. Donos: Membro 7. Usuários: todos.

| Componente | Arquivo | Props principais |
|---|---|---|
| `Button` | `src/components/ui/Button.tsx` | `variante` (`primario` \| `secundario` \| `fantasma` \| `perigo`), `tamanho` (`sm` \| `md`), `icone`, `carregando` |
| `Card` | `src/components/ui/Card.tsx` | `titulo`, `descricao`, `acoes`, `as` (`section` \| `article` \| `div`) |
| `Badge` | `src/components/ui/Badge.tsx` | `tom` (`neutro` \| `acento` \| `sucesso` \| `alerta` \| `perigo` \| `info`), `icone` |
| `Sidebar` | `src/components/layout/Sidebar.tsx` | sem props; navegação do Modo Dev gerada a partir do `registry` |
| `TopBar` | `src/components/layout/TopBar.tsx` | `modo` (`dev` \| `operador`) |
| `PageHeader` | `src/components/layout/PageHeader.tsx` | `titulo`, `descricao`, `meta`, `acoes` |

Regras de uso:

- Todo texto e rótulo em pt-BR.
- Para status, use `Badge` com `icone` **e** texto.
- Não recriar botões, cards ou badges nos outros módulos; importar de `src/components/ui/`.

## Preview do Operador

`OperatorPreview` (`/operador`) executa o fluxo completo: formulário (Membro 6) → validação → IA ou fallback → `ResultCard` + histórico das últimas 5 análises. Clicar em um item do histórico exibe os detalhes daquela análise. As regras vigentes são passadas ao `ResultCard`.

## Sandbox

Em `/dev/modulo/view-dashboard`:

- Seletor de estado visual: pré-visualiza `OTIMO`, `ATENCAO` e `CRITICO` com fixtures de `ResultadoAnalise`, e a última análise real quando existir.
- `ResultCard` com o estado escolhido e histórico curto, usando as regras vigentes.
- Funciona sem depender de outros módulos.

## Testes

Em `web/src/test/`:

- `uikit.test.tsx` — `Button`, `Card`, `Badge`, `PageHeader`.
- `resultcard.test.tsx` — campos do `ResultCard`, limiares das regras e confiança oculta em rejeição.
- `dashboard-estados.test.tsx` — três estados e alerta crítico.
- `dashboard-historico.test.tsx` — histórico curto.
- `ui.test.tsx` — fluxo completo do Preview do Operador.

Rodar: `cd web` e `npm run test`.

## Fora do escopo do MVP

Gráficos, exportação CSV/PDF e dashboard analítico completo.
