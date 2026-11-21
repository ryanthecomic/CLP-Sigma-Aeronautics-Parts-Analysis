# Módulo 2 — Controlador (`src/modules/controlador/`)

**Responsável:** Membro 2
**Camada:** `CONTROLLER`

## Objetivo

O Controlador implementa o princípio **“Validar primeiro, analisar depois”**:

1. Receber os dados do operador.
2. Executar guard clauses locais.
3. Interromper a execução sem chamar a IA quando houver rejeição.
4. Consultar a IA somente para entradas válidas.
5. Verificar confiança.
6. Acionar o fallback determinístico quando necessário.
7. Classificar o lote.
8. Persistir o resultado e emitir o evento final.

## Arquivos

- `src/core/contracts.ts`: contratos públicos do Controlador e interfaces compartilhadas.
- `src/core/guardClauses.ts`: validação pura da entrada.
- `src/core/pipeline.ts`: orquestração da execução.
- `src/core/pipelineSteps.ts`: IDs, timing, criação do lote e passos interrompidos.
- `src/core/mockEngine.ts`: gateway assíncrono e composição do motor mock.
- `src/core/eventBus.ts`: emissão síncrona de logs e passos.
- `src/store/`: slices Zustand e atualização reativa da sessão.
- `src/modules/controlador/sandbox.tsx`: interface do Módulo 2.

## Contratos principais

### `AnalysisGateway`

Porta usada pela interface para solicitar uma análise:

```ts
analisar(input: AnaliseInput, opcoes?: OpcoesAnalise): Promise<ResultadoAnalise>;
```

Não deve ser implementado pela View. Views devem usar `useAnalysis()`.

### `GuardResult`

Representa o resultado de uma guard clause:

```ts
interface GuardResult {
  id: string;
  label: string;
  etapa: "campos" | "peca" | "lote";
  modulo: ModuloSistema;
  aprovado: boolean;
  issues: ValidationIssue[];
}
```

### `ResultadoValidacao`

Resultado agregado da validação:

```ts
interface ResultadoValidacao {
  valido: boolean;
  guardas: GuardResult[];
  erros: ValidationIssue[];
}
```

### `PipelineStep`

Cada etapa emitida no pipeline possui status, tempo e motivo opcional:

```ts
interface PipelineStep {
  id: string;
  label: string;
  modulo: ModuloSistema;
  status: "PENDENTE" | "EXECUTANDO" | "SUCESSO" | "ALERTA" | "ERRO" | "IGNORADO";
  duracaoMs: number;
  motivo?: string;
  entrada?: unknown;
  saida?: unknown;
}
```

### `LogEvent`

Logs emitidos pelo event bus podem ser correlacionados à execução pelo `traceId`:

```ts
interface LogEvent {
  id: string;
  timestamp: string;
  nivel: "DEBUG" | "INFO" | "WARN" | "ERROR";
  modulo: ModuloSistema;
  mensagem: string;
  traceId?: string;
  payload?: unknown;
}
```

## Guard clauses

- Campos obrigatórios:
  - `pecaId`
  - `dataLote` no formato `AAAA-MM-DD`
- Horas:
  - número finito maior que zero
- Peça:
  - existente no repositório
  - cadastro válido
  - `conforme === true`
- Quantidade:
  - inteiro maior que zero
- Defeituosos:
  - inteiro maior ou igual a zero
  - não pode exceder a quantidade
- Temperatura:
  - dentro de `temperaturaMin`–`temperaturaMax`
- Pressão:
  - dentro de `pressaoMin`–`pressaoMax`
- Validação estrita:
  - data não futura
  - temperatura e pressão distantes pelo menos 5% das bordas da faixa

## Fluxo do pipeline

```text
entrada
validar-campos
validar-peca
validar-lote
ia
confianca
fallback
classificar
persistir
```

Quando uma validação falha:

- a origem do resultado é `VALIDACAO`;
- o status é `CRITICO`;
- os passos `ia`, `confianca`, `fallback` e `classificar` são `IGNORADO`;
- `ai.inferir()` não é chamado;
- o lote inválido não é persistido;
- o resultado da rejeição é registrado.

## Rastreabilidade

Cada execução gera um `traceId`. Ele é emitido em:

- evento `analise:inicio`;
- eventos `step`;
- logs relacionados;
- evento `analise:fim`;
- resultado final em `ResultadoAnalise.traceId`.

Isso permite correlacionar steps, logs e resultado no painel Pipeline e na página Logs.

## Sandbox

O sandbox em `/dev/modulo/controlador` disponibiliza:

- formulário com peça, data, temperatura, pressão, quantidade, defeituosos e horas;
- presets válido e inválido;
- avaliação imediata das guard clauses;
- pipeline global atualizado;
- `traceId` da execução;
- status e duração dos steps;
- motivo de rejeição ou interrupção.

## Store e event bus

A store não recebe dados diretamente do sandbox. O fluxo é:

```text
Sandbox -> useAnalysis -> AnalysisGateway -> executarPipeline
        -> eventBus -> store Zustand -> pipeline/logs/UI
```

Os eventos relevantes são:

- `analise:inicio`;
- `step`;
- `log`;
- `analise:fim`.

## Testes

Os testes ficam em `src/test/mockEngine/controlador.test.ts` e cobrem:

- rejeição precoce de dados inválidos;
- IA não chamada quando uma guard clause reprova;
- fallback após exceção da IA;
- fallback após baixa confiança;
- os quatro cenários oficiais do motor mock;
- compatibilidade da sequência de steps.

