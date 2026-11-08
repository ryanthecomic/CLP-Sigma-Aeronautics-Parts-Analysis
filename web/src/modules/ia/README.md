# Módulo 4 — Sistema de IA (`src/modules/ia/`)

**Responsável:** Membro 4
**Camada:** `IA`

## Escopo

- Implementa `simularIA`, `validarSaidaIA`, `fallbackSeriaAcionado` e `mockAIProvider` em `src/core/ia.ts`.
- Usa PRNG determinístico (`mulberry32`): mesma seed + mesma entrada = mesma saída.
- Modos de falha simuláveis: `NENHUM`, `EXCECAO`, `TIMEOUT`, `BAIXA_CONFIANCA` e `SAIDA_INVALIDA`.
- No sandbox: slider de confiança, seletor de modo de falha, campo de seed, botão "Executar inferência", saída JSON e indicação clara de acionamento do fallback.

