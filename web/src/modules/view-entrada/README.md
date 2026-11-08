# Módulo 6 — View de Entrada (`src/modules/view-entrada/`)

**Responsável:** Membro 6
**Camada:** `VIEW`

## Escopo

- Componentes `AnalysisForm` e `LimitsModal` em `src/components/form/AnalysisForm.tsx`.
- Validação inline com Zod (`criarSchemaEntrada(regras)` de `src/core/schemas.ts`), sem duplicar limites de domínio na View.
- No sandbox: reutiliza o formulário do Preview do Operador, exibe mensagens de erro inline por campo e permite configurar limites de temperatura, pressão e confiança mínima da IA.

