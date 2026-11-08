# Customizações de IA da Equipe Sigma (`agents-sigma/`)

Esta pasta visível guarda todo o pacote de **Rules**, **Skills** e **Agents (Subagents)** da **Equipe Sigma (UFAL)** para o **Aerolyze Lab**, separada do código-fonte (`web/`) e do material acadêmico (`material de apoio/`).

A conexão automática com o Antigravity é feita pelos dois arquivos JSON em `.agents/`:
- `.agents/plugins.json` → aponta para `agents-sigma/plugins` (carrega regras, skills e subagentes).
- `.agents/skills.json` → aponta para `agents-sigma/plugins/aerolyze-sigma/skills` (carrega as skills diretamente).

---

## Estrutura Completa

```text
CLP-Sigma-Aeronautics-Parts-Analysis/
├── .agents/                                  # Ponte JSON de descoberta automática
│   ├── plugins.json                          # Aponta para agents-sigma/plugins
│   └── skills.json                           # Aponta para agents-sigma/plugins/aerolyze-sigma/skills
└── agents-sigma/                             # Pasta separada de IA da Equipe Sigma
    ├── README.md                             # Este guia
    └── plugins/
        └── aerolyze-sigma/
            ├── plugin.json                   # Manifesto do pacote da equipe
            ├── rules/
            │   └── AGENTS.md                 # Regras sempre ativas (fronteiras, contratos e padrões)
            ├── skills/
            │   ├── aerolyze-module-dev/
            │   │   └── SKILL.md              # Runbook para desenvolver/evoluir um dos 7 módulos
            │   ├── aerolyze-contract-change/
            │   │   └── SKILL.md              # Protocolo seguro para mudanças em web/src/core/
            │   └── aerolyze-quality-gate/
            │       ├── SKILL.md              # Checklist de qualidade, auditoria e padrão de PR
            │       └── scripts/
            │           └── check-architecture.sh
            └── agents/
                ├── architecture-guardian.md  # Subagente revisor de arquitetura e DoD
                └── test-engineer.md          # Subagente especialista em Vitest + Testing Library
```

---

## Como usar no dia a dia

1. **Regras sempre ativas (`rules/AGENTS.md`):**
   - Impedem automaticamente imports de React em `src/core/`, imports cruzados entre os 7 módulos em `src/modules/`, acesso direto ao `localStorage` fora de `src/core/repository.ts` e uso de `any`.

2. **Evoluir o seu módulo (`aerolyze-module-dev`):**
   - Exemplo de prompt: *"Sou o Membro 3, use a skill `aerolyze-module-dev` para evoluir o sandbox de Cálculos"*.

3. **Alterar contratos do Core (`aerolyze-contract-change`):**
   - Exemplo de prompt: *"Preciso alterar `RegrasAnaliseAero` usando a skill `aerolyze-contract-change`"*.

4. **Portão de Qualidade antes do Commit/PR (`aerolyze-quality-gate`):**
   - Peça ao agente para rodar a skill `aerolyze-quality-gate` ou execute diretamente no terminal:
     ```bash
     bash agents-sigma/plugins/aerolyze-sigma/skills/aerolyze-quality-gate/scripts/check-architecture.sh
     ```

5. **Subagentes Especialistas (`architecture-guardian` e `test-engineer`):**
   - *"Invoque o subagente `architecture-guardian` para auditar minhas alterações"*
   - *"Invoque o subagente `test-engineer` para expandir os testes do meu módulo"*
