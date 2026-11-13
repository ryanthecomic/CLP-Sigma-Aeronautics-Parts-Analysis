# Módulo 1 — Modelo (`src/modules/modelo/`)

**Responsável:** Membro 1
**Camada:** `MODEL`

## Escopo

- Define as estruturas de domínio (`PecaAeronautica`, `DadosProducaoAero`, `ResultadoAnalise`, `RegrasAnaliseAero`, `StatusQualidade`) em `src/core/types.ts`.
- Define regras padrão (`REGRAS_PADRAO`), `classificar(metricas, regras)` e `validarPeca(peca)` em `src/core/rules.ts`.
- `validarCadastroPeca(peca)` valida os campos cadastrais e retorna `ValidationIssue[]` com códigos específicos, sem lançar exceção para entrada malformada em runtime.
- `validarPeca(peca)` cobre também `undefined`/`null`, retornando `PECA_NAO_ENCONTRADA` para peça inexistente.
- `classificar` usa o pior indicador entre taxa de defeitos e eficiência, respeitando os limites configurados em `RegrasAnaliseAero`.
- No sandbox: lista de peças, criação com código sequencial livre, edição, alternância de `conforme`, exclusão, estado vazio e visualização do JSON da peça e do retorno de `validarPeca`.

## Contratos

- `PecaAeronautica`
- `DadosProducaoAero`
- `ResultadoAnalise`
- `RegrasAnaliseAero`
- `StatusQualidade`
- `ValidationIssue`

## Testes

- `web/src/test/modelo.test.ts`: três status, limites exatos de defeitos/eficiência, peça não conforme, peça inexistente, entrada malformada e integração com o pipeline.
- `web/src/test/ui.test.tsx`: criação, alternância de conformidade e edição de peça no sandbox do Modelo.

