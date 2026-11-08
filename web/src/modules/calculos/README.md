# Módulo 3 — Cálculos & Fallback (`src/modules/calculos/`)

**Responsável:** Membro 3
**Camada:** `CALC`

## Escopo

- `calcularMetricas(dados, regras)` em `src/core/calculations.ts`:
  - Produtividade = `quantidade / horas`
  - Taxa de defeitos = `(defeituosos / quantidade) * 100`
  - Eficiência = `(quantidade / (horas * 50)) * 100` (limitada a 0–100)
  - Conformidade = `100 - taxaDefeitos`
  - Previsão de falhas = função da taxa de defeitos e do desvio de temperatura/pressão
- `executarFallback(dados, regras)` e `gerarRecomendacao(...)` em `src/core/fallback.ts`.
- No sandbox: inputs de quantidade, defeituosos e horas, exibição das 4 métricas principais e do resultado completo do fallback.

