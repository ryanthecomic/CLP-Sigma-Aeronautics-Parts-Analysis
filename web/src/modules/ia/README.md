# Módulo 4 — Sistema de IA (`src/modules/ia/`)

**Responsável:** Membro 4
**Camada:** `IA`
**Depende de:** Módulo 1 (`types.ts`, `rules.ts`), Módulo 2 (`contracts.ts`, `pipeline.ts`) e Módulo 3 (`calculations.ts`, `fallback.ts`).

## Escopo

Provedor de IA **simulado** (`modelo_ia.bin`): determinístico por seed, observável e sem rede. Ele calcula as métricas reais do lote, aplica um pequeno ruído reproduzível e devolve uma saída com confiança, imitando um modelo embarcado. Também simula as falhas que o Controlador precisa tratar antes de acionar o fallback determinístico.

## Arquivos

| Arquivo | Papel |
|---|---|
| `src/core/ia.ts` | Núcleo em TypeScript puro: `simularIA`, erros, validação de saída, metadados e provedor. |
| `src/modules/ia/sandbox.tsx` | Sandbox do módulo (`/dev/modulo/ia`). |
| `src/modules/ia/manifest.ts` | Ficha do módulo para o Modo Desenvolvedor. |
| `src/test/mockEngine/ia.test.ts` | Testes de determinismo, falhas, fronteira de confiança, metadados e ausência de rede. |
| `src/test/mockEngine/ia.integracao.test.ts` | Testes de integração com o pipeline do Controlador. |

## API exportada por `src/core/ia.ts`

| Item | O que faz |
|---|---|
| `simularIA(requisicao)` | Executa a inferência simulada. Lança `ErroIA` em `EXCECAO` e `TIMEOUT`; nos outros modos devolve a `SaidaBrutaIA` (que pode ser inválida). |
| `seedEfetiva(requisicao)` | Combina a seed com o conteúdo do lote (nunca com o `id`). |
| `validarSaidaIA(saida)` | Valida a saída com o schema (Zod) e devolve a lista de problemas (vazia = válida). |
| `motivoFallbackIA(saida, regras)` | Explica por que o fallback seria acionado (`null` se a saída é aceita). |
| `fallbackSeriaAcionado(saida, regras)` | Versão booleana de `motivoFallbackIA`. |
| `ErroIA`, `ehErroIA`, `DetalhesErroIA` | Erro tipado (`EXCECAO` ou `TIMEOUT`) com `detalhes` (seed, modelo, limite e latência simulada). |
| `MODELO_IA_META` | Metadados imutáveis: nome `modelo_ia.bin`, versão, precisão e status. |
| `descreverModelo()` | Único ponto que monta o texto `nome@versão`. |
| `CONFIG_IA_PADRAO` | Configuração padrão (`NENHUM`, limite de 2000 ms). |
| `mockAIProvider` | Implementação de `AIProvider` usada pelo motor mock. |

## Modos de falha

| Modo | O que a IA faz | Como o Controlador reage |
|---|---|---|
| `NENHUM` | Saída válida com confiança entre 0,78 e 0,98 (ou o valor de `config.confianca`, se informado). | Aceita se a confiança for maior ou igual ao mínimo (0,70 por padrão). |
| `EXCECAO` | Lança `ErroIA("EXCECAO")` com seed e modelo em `detalhes`. | Passo `ia` em `ERRO` ("IA falhou (EXCECAO)") e fallback. |
| `TIMEOUT` | Lança `ErroIA("TIMEOUT")` com uma latência simulada **maior** que o limite (padrão 2000 ms). Não espera de verdade. | Passo `ia` em `ERRO` ("IA falhou (TIMEOUT)") e fallback. |
| `BAIXA_CONFIANCA` | Saída válida com confiança entre 50% e 100% de (mínimo − 0,01), isto é, **sempre abaixo do mínimo** configurado. | Passo `confianca` em `ALERTA` ("abaixo do mínimo") e fallback. |
| `SAIDA_INVALIDA` | Devolve uma de 3 saídas corrompidas (a seed escolhe qual): valores fora da faixa com `NaN`, valor infinito, ou confiança acima de 1 com recomendação vazia. | `validarSaidaIA` reprova, passo `ia` em `ERRO` ("Saída inválida da IA") e fallback. A saída nunca vira `ResultadoAnalise`. |

## Como reproduzir uma falha

No sandbox (`/dev/modulo/ia`): escolha o modo, informe a seed e clique em **Executar inferência**. O botão **Executar 2× e comparar** confirma que duas execuções idênticas dão o mesmo resultado.

Em código:

```ts
simularIA({
  dados,
  peca,
  regras,
  config: { modoFalha: "TIMEOUT", timeoutMs: 1500 },
  seed: 42,
});
// Sempre lança o mesmo ErroIA("TIMEOUT"), com a mesma latência simulada em `detalhes`.
```

## Determinismo

- O PRNG é o `mulberry32` (em `src/core/utils.ts`), semeado por `seedEfetiva`, que mistura a seed com o conteúdo do lote.
- O `id` do lote **não** entra na seed, porque é gerado com relógio.
- Seeds inválidas (`NaN`, `Infinity`) são normalizadas para `0`. A seed `0` é válida.
- A ordem das chamadas ao PRNG dentro de `simularIA` define a saída de cada seed. Reordenar essas linhas muda o resultado de todas as seeds (há um comentário no código avisando).

## Ausência de rede

`src/core/ia.ts` não usa `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource` ou `sendBeacon`, nem `Math.random` ou relógio. O teste `ia.test.ts` (bloco "sem rede e sem fontes de não determinismo") lê o código-fonte e falha se algum aparecer.

## Sandbox

- Cabeçalho do modelo (`nome@versão`, status e precisão).
- Slider de confiança (ativo apenas no modo `NENHUM`, com aviso quando travado).
- Seletor de modo de falha, campo de seed (validada) e campo de tempo limite.
- Saída em JSON bruto (`NaN` e `Infinity` aparecem literalmente), lista de problemas do schema e detalhes do `ErroIA`.
- Aviso "Fallback seria ACIONADO" com o **motivo**, e botão "Executar 2× e comparar".

## Critérios de aceite e onde são verificados

| Critério | Verificação |
|---|---|
| Mesma seed e mesma entrada geram a mesma saída | `ia.test.ts` (bloco "determinismo") e botão "Executar 2× e comparar" |
| Cada modo de falha é reproduzível | `ia.test.ts` (bloco "modos de falha") e `ia.integracao.test.ts` |
| O Controlador aciona o fallback a partir de cada falha | `ia.integracao.test.ts` |
| O sandbox mostra a saída bruta e se o fallback seria acionado | Sandbox (`/dev/modulo/ia`) |
| A IA não faz chamadas de rede | `ia.test.ts` (bloco "sem rede") |

## Como rodar os testes

```bash
cd web
npx vitest run src/test/mockEngine/ia.test.ts
npx vitest run src/test/mockEngine/ia.integracao.test.ts
```

## Limitações e pontos em aberto

- É um **mock**: a "confiança" não é uma probabilidade calibrada.
- `SaidaBrutaIA` é tipada como válida, então as corrupções ficam limitadas a valores inválidos (fora da faixa, `NaN`, infinito, texto vazio). Simular campo ausente ou tipo errado exigiria que o provedor devolvesse `unknown`, o que é uma mudança de contrato do Módulo 2.
- Com `confiancaMinimaIA` igual a `0`, nenhuma confiança pode ser "baixa".
- Com um mínimo acima de 0,78, o modo `NENHUM` também pode cair no fallback.
- Provedor real (por exemplo, uma API de LLM) está **fora do escopo atual**. Se for adotado, exige `inferir` assíncrono (mudança de contrato e do pipeline, no Módulo 2) e o código de rede num arquivo separado, mantendo `ia.ts` sem rede.