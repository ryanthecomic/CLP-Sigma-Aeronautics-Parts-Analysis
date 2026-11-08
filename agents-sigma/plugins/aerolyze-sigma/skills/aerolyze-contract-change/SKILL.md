---
name: aerolyze-contract-change
description: >-
  Procedimento seguro para alterar contratos compartilhados (types.ts, contracts.ts,
  schemas.ts) ou regras do motor mock (rules.ts, pipeline.ts, calculations.ts, fallback.ts,
  ia.ts, repository.ts) em web/src/core/. Use sempre que uma tarefa modificar arquivos em
  web/src/core/ para evitar quebrar os 7 módulos ou a persistência local.
---

# Governança de Contratos e Core (`aerolyze-contract-change`)

Os arquivos em `web/src/core/` são a base compartilhada pelos 7 membros da Equipe Sigma. Qualquer alteração ali exige este protocolo de segurança.

## 1. Pré-checagem

1. **Pureza do Core:** `web/src/core/` deve continuar sendo TypeScript 100% puro (zero imports de React ou de camadas visuais).
2. **Impacto nos Consumidores:** Antes de alterar um tipo em `src/core/types.ts` ou interface em `src/core/contracts.ts`, identifique todos os consumidores com `grep` em `web/src/`.

## 2. Sincronização Obrigatória ao Alterar Contratos

Se você alterar qualquer estrutura persistida (`PecaAeronautica`, `DadosProducaoAero`, `ResultadoAnalise`, `RegrasAnaliseAero`, `FlagsDev`):

1. **Atualize `web/src/core/schemas.ts`**:
   - Mantenha `pecaSchema`, `loteSchema`, `regrasSchema`, `flagsSchema`, `resultadoSchema` e `dadosPersistidosSchema` 100% alinhados com `types.ts`. Caso contrário, o Repositório considerará os dados do `localStorage` inválidos e resetará para o seed.
2. **Atualize `web/src/core/seed.ts`**:
   - Garanta que `PECAS_SEED` (5 peças), `LOTES_SEED` (6 lotes), `REGRAS_PADRAO` e `FLAGS_PADRAO` preencham todos os campos obrigatórios.
3. **Atualize `web/src/core/scenarios.ts`**:
   - Verifique se os 4 cenários oficiais (`CEN-A`, `CEN-B`, `CEN-C`, `CEN-D`) continuam reproduzindo os status e origens esperados.
4. **Atualize o catálogo na aba Contratos**:
   - Se uma interface pública mudou de assinatura, sincronize `CATALOGO_CONTRATOS` em `web/src/features/dev/StatePage.tsx`.

## 3. Invariantes do Motor Mock que Nunca Podem Quebrar

- Dados inválidos **nunca** acionam `ia.inferir(...)` — devem retornar `origem: "VALIDACAO"` e `status: "CRITICO"`.
- Mesma `seed` + mesma entrada de lote na IA mock (`simularIA`) **sempre** produzem a mesma saída.
- Modos `EXCECAO`, `TIMEOUT`, `BAIXA_CONFIANCA` e `SAIDA_INVALIDA` **sempre** acionam o fallback determinístico (`origem: "FALLBACK"`).

## 4. Validação Pós-Alteração

Execute obrigatoriamente:

```bash
bash agents-sigma/plugins/aerolyze-sigma/skills/aerolyze-quality-gate/scripts/check-architecture.sh
```
