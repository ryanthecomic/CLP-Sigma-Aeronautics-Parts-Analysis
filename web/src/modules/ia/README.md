# Módulo 4 — Sistema de IA (`src/modules/ia/`)

**Responsável:** Membro 4
**Camada:** `IA`
**Depende de:** Módulo 1 (`types.ts`, `rules.ts`), Módulo 2 (`contracts.ts`, `pipeline.ts`) e Módulo 3 (`calculations.ts`, `fallback.ts`).

## Escopo

O módulo tem dois provedores que implementam o mesmo contrato `AIProvider`:

1. **Mock** (`modelo_ia.bin`): determinístico por seed, observável e sem rede. Calcula as métricas reais do lote, aplica um pequeno ruído reproduzível e simula as falhas que o Controlador precisa tratar antes do fallback.
2. **Real NVIDIA NIM**: chamada assíncrona à API compatível com OpenAI, com prompt em pt-BR, métricas determinísticas de referência, validação por schema e fallback automático. É a única parte do core que faz rede (`iaNvidia.ts`).

A escolha é feita por `VITE_IA_PROVEDOR` (`mock` por padrão, `nvidia` para a API real). Em testes o mock é sempre usado.

## Arquivos

| Arquivo | Papel |
|---|---|
| `src/core/ia.ts` | Núcleo puro: `simularIA`, erros, validação de saída, metadados e provedor mock. |
| `src/core/iaNvidia.ts` | Provedor real NVIDIA NIM: prompt, chamada HTTP, timeout, parsing e normalização. |
| `src/core/iaProvedor.ts` | Seleciona o provedor ativo (`mock` ou `nvidia`). |
| `src/modules/ia/sandbox.tsx` | Sandbox do módulo (`/dev/modulo/ia`) com simulador mock e inferência real. |
| `src/modules/ia/manifest.ts` | Ficha do módulo para o Modo Desenvolvedor. |
| `src/test/mockEngine/ia.test.ts` | Testes do mock: determinismo, falhas, confiança, metadados e ausência de rede. |
| `src/test/mockEngine/iaNvidia.test.ts` | Testes do provedor real com `fetchImpl` falso (sem rede). |
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

## API do provedor real (`src/core/iaNvidia.ts`)

| Item | O que faz |
|---|---|
| `criarProviderNvidia(opcoes?)` | Cria o `AIProvider` que chama `/chat/completions` com timeout, `response_format: json_object` e raciocínio desligado. |
| `normalizarSaidaNvidia(bruto, modelo?)` | Converte o JSON do modelo em `SaidaBrutaIA`; campos inválidos viram `NaN` para o schema reprovar. |
| `extrairJson(texto)` | Remove cercas de markdown e extrai o objeto JSON da resposta. |
| `metaModeloNvidia(modelo?)` | Metadados exibidos na UI (`modelo@nim`). |
| `NVIDIA_MODELO_PADRAO` | `nvidia/nemotron-3.5-lightning-30b-a3b`. |
| `NVIDIA_BASE_URL_PADRAO` | `/api/nvidia` (proxy do Vite). |
| `NVIDIA_TIMEOUT_PADRAO_MS` | `30000`. |

Configuração em `web/.env.local`:

```bash
VITE_IA_PROVEDOR=nvidia
NVIDIA_API_KEY=nvapi-sua-chave       # sem prefixo VITE_: não vai ao navegador
VITE_NVIDIA_MODELO=nvidia/nemotron-3.5-lightning-30b-a3b
VITE_NVIDIA_TIMEOUT_MS=30000
```

O proxy `/api/nvidia` é criado em `vite.config.ts` (dev e preview) e injeta o
`Authorization` no servidor. Em produção estática é necessário um backend/proxy
equivalente, ou o modo direto (chave visível no bundle) via
`VITE_NVIDIA_BASE_URL` + `VITE_NVIDIA_API_KEY`.

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

## Ausência de rede no mock

`src/core/ia.ts` não usa `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource` ou `sendBeacon`, nem `Math.random` ou relógio. O teste `ia.test.ts` (bloco "sem rede e sem fontes de não determinismo") lê o código-fonte e falha se algum aparecer. Toda a rede do provedor real está isolada em `src/core/iaNvidia.ts`.

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
npx vitest run src/test/mockEngine/iaNvidia.test.ts
npx vitest run src/test/mockEngine/ia.integracao.test.ts
```

## Limitações e pontos em aberto

- É um **mock**: a "confiança" não é uma probabilidade calibrada.
- `SaidaBrutaIA` é tipada como válida, então as corrupções ficam limitadas a valores inválidos (fora da faixa, `NaN`, infinito, texto vazio). Simular campo ausente ou tipo errado exigiria que o provedor devolvesse `unknown`, o que é uma mudança de contrato do Módulo 2.
- Com `confiancaMinimaIA` igual a `0`, nenhuma confiança pode ser "baixa".
- Com um mínimo acima de 0,78, o modo `NENHUM` do mock também pode cair no fallback.
- O provedor real depende de rede e de uma chave válida; sem eles, o Controlador aciona o fallback. A confiança devolvida pelo LLM não é uma probabilidade calibrada.
- O proxy do Vite existe apenas em dev/preview. Build estático em produção exige um backend/proxy ou o modo direto (com a chave exposta no bundle).
- A resposta do modelo é validada pelo mesmo schema do mock; qualquer divergência de tipo/faixa vira fallback, nunca `ResultadoAnalise`.