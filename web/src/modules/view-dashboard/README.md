# Módulo 7 — View de Dashboard (`src/modules/view-dashboard/`)

**Responsável:** Membro 7
**Camada:** `VIEW`

## Escopo

- Componentes `ResultCard`, `StatusBadge`, `QualityAlert`, `MetricTile` e `AnalysisHistoryList` em `src/components/result/ResultCard.tsx`.
- Base do UI Kit (`src/components/ui/`) e Layout (`src/components/layout/`).
- No sandbox: cards com as métricas do resultado e alternância entre os três estados (`OTIMO`, `ATENCAO`, `CRITICO`) para pré-visualizar cores, ícones e alerta crítico.


## UI Kit base (T7.6)

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
- Para status (`OTIMO`, `ATENCAO`, `CRITICO`), use `Badge` com `icone` **e** texto: a cor nunca é o único indicador.
- Não recriar botões, cards ou badges nos outros módulos; importar de `src/components/ui/`.
- Testes do kit: `src/test/uikit.test.tsx`.
