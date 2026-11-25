# Módulo 6 — View de Entrada (`src/modules/view-entrada/`)

**Responsável:** Membro 6
**Camada:** `VIEW`

## Escopo

- Componentes `AnalysisForm` e `LimitsModal` em `src/components/form/AnalysisForm.tsx`.
- Validação inline com Zod (`criarSchemaEntrada(regras)` de `src/core/schemas.ts`), sem duplicar limites de domínio na View.
- No sandbox: reutiliza o formulário do Preview do Operador, exibe mensagens de erro inline por campo e permite configurar limites de temperatura, pressão e confiança mínima da IA.


## Organização visual

- Tema escuro com destaque ciano, seções numeradas e agrupamentos semânticos: Identificação do lote, Produção e Condições do processo.
- Formulário compartilhado com `/operador`, com uma coluna em telas pequenas e duas a partir do breakpoint `sm`.
- Modal com grupos de temperatura, pressão e confiança da IA, altura limitada à tela e rolagem interna.
- Sandbox com marca no cabeçalho e painel técnico separado, empilhado em telas menores.
- Logotipo oficial: `material de apoio/Logo/AEROLYZE-07 horizontal colorida sem fundo.svg`, copiado sem alterações para `src/assets/aerolyze-horizontal-colorida.svg`.

## Contratos consumidos

`AnaliseInput`, `RegrasAnaliseAero` e `PecaAeronautica`. As props públicas, validações e callbacks foram preservados; não há alteração de contratos ou persistência.

## Verificação

Acesse `/dev/modulo/view-entrada` e `/operador`. Confira campos, erros inline, envio válido e configuração de limites em desktop e celular, incluindo navegação por teclado. O botão “Enviar direto ao Controlador” permanece exclusivo do sandbox e permite testar entradas sem validação da View.
