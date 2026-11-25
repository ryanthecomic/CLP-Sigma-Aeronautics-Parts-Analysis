# Módulo 6 — View de Entrada (`src/modules/view-entrada/`)

**Responsável:** Membro 6
**Camada:** `VIEW`

## Uso e contratos

Acesse `/dev/modulo/view-entrada` para experimentar o módulo e `/operador` para o fluxo integrado.

| Componente | Entradas | Saídas |
|---|---|---|
| `AnalysisForm` | `pecas: PecaAeronautica[]`, `regras: RegrasAnaliseAero`, estado de execução e valores iniciais opcionais | `onAnalisar(input: AnaliseInput)` e abertura de limites |
| `LimitsModal` | `aberto`, `regras: RegrasAnaliseAero` | `onSalvar(regras: RegrasAnaliseAero)` e fechamento |

Os componentes são compartilhados pelo sandbox e operador. Validação vem de `core/schemas.ts`; persistência e análise passam pelos hooks. Não há cálculo de domínio na View.

Para revisar: conferir os sete campos, enviar valores válidos, observar erros inline, alterar limites e comparar as regras ativas. No sandbox, Enviar direto ao Controlador ignora intencionalmente a validação da View.

Registro específico desta entrega: [T6.7 — Manifesto e README](./evidencias/T6.7.md). A aprovação da equipe e a Definition of Done continuam necessárias; o status `pronto` no manifesto não substitui esse aceite.

## Escopo

- Componentes `AnalysisForm` e `LimitsModal` em `src/components/form/AnalysisForm.tsx`.
- Validação inline com Zod (`criarSchemaEntrada(regras)` de `src/core/schemas.ts`), sem duplicar limites de domínio na View.
- No sandbox: reutiliza o formulário do Preview do Operador, exibe mensagens de erro inline por campo e permite configurar limites de temperatura, pressão e confiança mínima da IA.

