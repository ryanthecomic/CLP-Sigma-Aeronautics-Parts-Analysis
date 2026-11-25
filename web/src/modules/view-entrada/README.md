# Módulo 6 — View de Entrada (`src/modules/view-entrada/`)

**Responsável:** Membro 6
**Camada:** `VIEW`

## Escopo

- Componentes `AnalysisForm` e `LimitsModal` em `src/components/form/AnalysisForm.tsx`.
- Validação inline com Zod (`criarSchemaEntrada(regras)` de `src/core/schemas.ts`), sem duplicar limites de domínio na View.
- No sandbox: reutiliza o formulário do Preview do Operador, exibe mensagens de erro inline por campo e permite configurar limites de temperatura, pressão e confiança mínima da IA.


## T6.1 — Evidências do formulário controlado

A implementação já existia no scaffold do projeto. Este registro documenta sua verificação, sem recriar o formulário nem atribuir sua implementação original a este PR.

| Campo visível | Estado do formulário | Tipo de controle |
|---|---|---|
| Peça aeronáutica | `pecaId` | Select |
| Data do lote | `dataLote` | Input date |
| Quantidade produzida | `quantidade` | Input number |
| Peças defeituosas | `defeituosos` | Input number |
| Tempo de produção | `horas` | Input number |
| Temperatura do processo | `temperatura` | Input number |
| Pressão do processo | `pressao` | Input number |

Em `src/components/form/AnalysisForm.tsx`, `useState<ValoresFormularioAnalise>` mantém os valores. Cada controle recebe `value` e atualiza o estado através de `onChange` e da função `atualizar`. No envio, `aoSubmeter` impede a navegação padrão, valida os valores e entrega um `AnaliseInput` ao callback `onAnalisar`. A View não calcula métricas de domínio.

O formulário é reutilizado em `/dev/modulo/view-entrada` e `/operador`. O teste `src/test/analysisForm.t6-1.test.tsx` verifica a edição dos sete controles e o envio dos valores atuais, com números convertidos e sem submeter durante a edição.

### Roteiro de revisão

1. Abrir `/dev/modulo/view-entrada` e conferir os sete campos da tabela.
2. Alterar peça, data, quantidade, defeituosos, horas, temperatura e pressão, respeitando as faixas exibidas.
3. Clicar em **Analisar** e conferir os valores na última carga enviada.
4. Conferir a reutilização do formulário em `/operador`.

Este PR trata somente da T6.1. Schema e erros inline (T6.2), modal (T6.3), componentes (T6.4), sandbox (T6.5), cobertura ampliada de testes (T6.6) e documentação geral do módulo (T6.7) serão verificados separadamente. A revisão da equipe e a Definition of Done continuam necessárias para mover o cartão para Concluído.

### Estado da validação deste registro

- Conferência estática: sete controles ligados a `value`/`onChange` e envio por `onAnalisar` presentes.
- Checagens de arquitetura: aprovadas.
- Teste específico e suíte completa: execução interrompida após 45 segundos sem resultado; aprovação pendente.
- Checagem de tipos: passou após ajustar a fixture do teste para copiar a lista readonly de peças. O build chegou à transformação do Vite, sem conclusão confirmada.
- Revisão no navegador: roteiro fornecido acima; ainda não executada nesta sessão.
