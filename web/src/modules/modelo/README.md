# Módulo 1 — Modelo (`src/modules/modelo/`)

**Responsável:** Membro 1
**Camada:** `MODEL`

## Escopo

- Define as estruturas de domínio (`PecaAeronautica`, `DadosProducaoAero`, `ResultadoAnalise`, `RegrasAnaliseAero`, `StatusQualidade`) em `src/core/types.ts`.
- Define regras padrão (`REGRAS_PADRAO`), `classificar(metricas, regras)` e `validarPeca(peca)` em `src/core/rules.ts`.
- No sandbox: lista de peças, criar/editar peça, alternar `conforme` e visualizar o JSON da peça e o retorno de `validarPeca`.

## Contratos

- `PecaAeronautica`
- `DadosProducaoAero`
- `ResultadoAnalise`
- `RegrasAnaliseAero`
- `StatusQualidade`

