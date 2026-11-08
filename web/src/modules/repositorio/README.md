# Módulo 5 — Repositório de Dados (`src/modules/repositorio/`)

**Responsável:** Membro 5
**Camada:** `REPO`

## Escopo

- Implementa o contrato `Repository` em `src/core/repository.ts`, usando a chave versionada `aerolyze-lab:v1`.
- Define o seed determinístico com **5 peças** (`PECAS_SEED`) e **6 lotes** (`LOTES_SEED`) em `src/core/seed.ts`.
- Recupera automaticamente dados corrompidos ou com versão incompatível.
- No sandbox: exibição da chave do `localStorage`, tabelas de lotes e resultados salvos, exclusão individual e reset do seed.

