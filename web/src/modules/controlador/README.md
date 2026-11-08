# Módulo 2 — Controlador (`src/modules/controlador/`)

**Responsável:** Membro 2
**Camada:** `CONTROLLER`

## Escopo

- Contratos (`src/core/contracts.ts`), event bus (`src/core/eventBus.ts`), orquestração e guard clauses (`src/core/pipeline.ts`), motor mock (`src/core/mockEngine.ts`) e store Zustand (`src/store/`).
- Princípio central: **"Validar primeiro, analisar depois"**. Dados inválidos são barrados antes de qualquer chamada à IA.
- No sandbox: formulário com temperatura, pressão, quantidade e defeituosos, botão "Executar validação", lista de guard clauses aprovadas/reprovadas com motivo e visualização do pipeline global atualizado.

