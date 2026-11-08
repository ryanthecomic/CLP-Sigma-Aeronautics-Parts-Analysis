---
name: aerolyze-quality-gate
description: >-
  Portão de qualidade automatizado e checklist de Pull Request do Aerolyze Lab.
  Use antes de fazer commit, abrir um PR, integrar branches da equipe ou quando o
  usuário pedir para auditar, validar ou testar a estabilidade do projeto.
---

# Portão de Qualidade & PR (`aerolyze-quality-gate`)

Execute este procedimento para validar a saúde arquitetural e funcional do Aerolyze Lab antes de qualquer entrega ou Pull Request.

## 1. Executar o Script de Auditoria Arquitetural e Testes

Rode o script oficial a partir da raiz do repositório:

[check-architecture.sh](./scripts/check-architecture.sh)

```bash
bash agents-sigma/plugins/aerolyze-sigma/skills/aerolyze-quality-gate/scripts/check-architecture.sh
```

O script verifica automaticamente:
1. Ausência de imports de React dentro de `web/src/core/`.
2. Ausência de imports cruzados entre módulos em `web/src/modules/`.
3. Ausência de uso direto de `localStorage` fora de `web/src/core/repository.ts`.
4. Ausência de `: any` explícito em `web/src/`.
5. Execução completa dos testes (`npm run test`) e build de produção com checagem de tipos (`npm run build`).

## 2. Convenções de Git e Pull Request da Equipe Sigma

Ao criar branches, commits ou descrições de PR, siga o padrão de `DIVISAO-TAREFAS-Aerolyze-MVP.md`:

- **Branches:**
  - `feat/<modulo>-<tarefa>` (nova funcionalidade)
  - `fix/<modulo>-<tarefa>` (correção)
  - `docs/<tema>` (documentação)
  - `chore/<tema>` (configuração/manutenção)
- **Commits:**
  - `feat(modelo): adiciona validarPeca`
  - `fix(controlador): corrige parada precoce`
  - `test(calculos): cobre horas zero`
- **Título do PR:** `[<modulo>] descrição curta`
- **Corpo do PR:**
  - O que mudou e por quê
  - Contratos afetados (se houver, marcar revisão do Membro 1 e Membro 2)
  - Como testar no Modo Desenvolvedor (`/dev`) ou no Preview do Operador (`/operador`)
