# Módulo 3 — Cálculos & Fallback (`src/modules/calculos/`)

**Responsável:** Membro 3
**Camada:** `CALC`

## Escopo

- `calcularMetricas(dados, regras)` em `src/core/calculations.ts`.
- `executarFallback(dados, regras)`, `principalDesvio(...)` e `gerarRecomendacao(...)` em `src/core/fallback.ts`.
- Contrato `AnalysisEngine` implementado por `analysisEngine`, consumido pelo Controlador.
- Funções puras e determinísticas: `src/core/` não importa React e não depende da IA.
- No sandbox: entradas de produção, cenários rápidos (Ótimo, Atenção, Crítico por defeitos, Crítico por eficiência e Borda térmica), as 5 métricas, o desvio principal e o resultado completo do fallback.

## Fórmulas (`calcularMetricas`)

| Métrica | Fórmula | Regra de borda |
|---|---|---|
| Produtividade | `quantidade / horas` | `0` se `horas ≤ 0`; quantidade negativa vira `0` |
| Taxa de defeitos | `(defeituosos / quantidade) × 100` | limitada a `0–100`; `0` se `quantidade ≤ 0` |
| Eficiência | `(quantidade / (horas × 50)) × 100` | limitada a `0–100`; `0` se `horas ≤ 0` |
| Conformidade | `100 − taxaDefeitos` | `0–100` |
| Previsão de falhas | `taxaDefeitos × 2 + (desvioT + desvioP) × 10` | limitada a `0–100` |

O desvio de temperatura/pressão (`desvioNormalizado`) vale `0` no centro da faixa, `1` na borda e `> 1` fora dela:

```text
desvio = |valor − centro| / meiaLargura
centro = (min + max) / 2
meiaLargura = (max − min) / 2
```

Resultados são arredondados em 2 casas decimais (`arredondar`). Entradas `NaN`/`Infinity` e faixas inválidas nunca propagam `NaN`: o pior caso é `0`.

## Classificação e desvio principal

- `classificar(metricas, regras)` usa o **pior status** entre taxa de defeitos e eficiência (ver `src/core/rules.ts`).
- `principalDesvio(metricas, dados, regras)` compara quatro pesos:
  - `DEFEITOS`: `taxaDefeitos / taxaDefeitosAtencao` (0 no ótimo).
  - `EFICIENCIA`: afastamento da meta + `0.5` (0 no ótimo).
  - `TEMPERATURA` / `PRESSAO`: `max(0, desvioNormalizado − 0.8)` — só acusa a partir de 80% do caminho até a borda.
- Sem nenhum peso positivo, retorna `NENHUM`.

## Recomendação textual

`gerarRecomendacao(status, metricas, dados, regras)` concatena a abertura do status com a ação do desvio principal:

| Status | Abertura |
|---|---|
| `OTIMO` | "Lote dentro dos padrões de qualidade." |
| `ATENCAO` | "Lote requer atenção." |
| `CRITICO` | "Lote crítico: segregar as peças e abrir não conformidade." |

| Desvio | Ação |
|---|---|
| `DEFEITOS` | Inspecionar o processo de fabricação e o ferramental. |
| `EFICIENCIA` | Revisar a capacidade e as paradas da linha. |
| `TEMPERATURA` | Recalibrar o controle térmico. |
| `PRESSAO` | Verificar o sistema de pressurização. |
| `NENHUM` | Manter os parâmetros atuais de processo. |

Rótulos legíveis ficam em `ROTULOS_DESVIO`, reutilizados pelo sandbox.

## Fallback (`executarFallback`)

Retorna um `ResultadoAnalise` completo e classificável:

- `id: res-<loteId>` e `loteId` de entrada;
- métricas de `calcularMetricas`;
- `status` de `classificar`;
- `recomendacao` de `gerarRecomendacao`;
- `origem: "FALLBACK"`, `confianca: 1`, `traceId: ""`, `passos: []`, `erros: []`;
- `criadoEm` em ISO. O orquestrador sobrescreve `traceId` e `passos` quando roda no pipeline.

## Casos de borda cobertos

- `horas = 0`, `quantidade = 0` e valores negativos → métricas zeradas, sem `NaN`.
- `defeituosos > quantidade` → taxa `100%` e conformidade `0%`.
- `NaN` e `Infinity` em qualquer campo → métricas finitas.
- Temperatura/pressão fora da faixa → previsão de falhas cresce e satura em `100%`.
- Faixa inválida (`min ≥ max`) → desvio `0`.

## Contratos

- `AnalysisEngine`
- `DadosProducaoAero`
- `MetricasProducao`
- `RegrasAnaliseAero`
- `ResultadoAnalise`
- `StatusQualidade`

## Testes

`web/src/test/mockEngine/calculos.test.ts` cobre:

- fórmulas e determinismo das 5 métricas;
- casos de borda (zeros, negativos, `NaN`, `Infinity`, defeituosos acima da quantidade);
- desvio normalizado no centro, na borda e fora da faixa;
- fallback completo, determinístico e sem mutar a entrada;
- variação da recomendação por status e por desvio principal;
- contrato `AnalysisEngine`;
- sandbox coberto por `web/src/test/ui.test.tsx` (abertura dos 7 módulos).

## Definição de pronto (T3.1–T3.6)

- [x] **T3.1** `calcularMetricas` com produtividade, defeitos, eficiência, conformidade e previsão de falhas.
- [x] **T3.2** `executarFallback` retornando `ResultadoAnalise` com `origem: "FALLBACK"`.
- [x] **T3.3** Recomendação textual variando por status e principal desvio.
- [x] **T3.4** Sandbox com entradas, métricas, desvio principal e resultado do fallback.
- [x] **T3.5** Testes de borda (horas/quantidade zero, defeituosos acima do produzido, extremos e não finitos).
- [x] **T3.6** `manifest.ts` e este README atualizados.
