# Módulo 5 — Repositório de Dados (`src/modules/repositorio/`)

**Responsável:** Membro 5 (Pedro Henrique Balbino Rocha)
**Camada:** `REPO`

## Escopo

- Implementa o contrato `Repository` em `src/core/repository.ts`, como **única porta de acesso** ao `localStorage` por meio da chave versionada `aerolyze-lab:v1` e da abstração `StorageLike`.
- Define o seed determinístico e imutável com **5 peças** (`PECAS_SEED`) e **6 lotes** (`LOTES_SEED`) em `src/core/seed.ts`, além de `criarSeed()` sem compartilhamento de referências.
- Implementa `buscarPeca`, `buscarLote`, `salvarPeca`, `registrarLote`, `registrarResultado`, `listarResultados`, `remover`, `atualizarRegras`, `atualizarFlags` e `reset` com clonagem profunda (`structuredClone`).
- Recupera automaticamente dados corrompidos (JSON inválido), versão de schema incompatível (`versao !== 1`) ou estrutura inválida (`dadosPersistidosSchema.safeParse`), restaurando o seed com segurança e retornando `aviso` em `ResultadoCarga`.
- Gera a prévia de configuração `config.toml` em `src/core/config.ts` (`montarConfig` e `paraToml`).
- No sandbox: exibição da chave `aerolyze-lab:v1`, contadores de peças/lotes/resultados, inspeção do JSON persistido, tabelas de lotes e resultados com exclusão individual, botão "Resetar para o seed" e emissão de logs na camada `REPO` via `useModule("repositorio")`.

## Contratos

- `Repository`
- `StorageLike`
- `ResultadoCarga`
- `ColecaoRepositorio`
- `DadosPersistidos`
- `PecaAeronautica`
- `DadosProducaoAero`
- `ResultadoAnalise`

## Testes

- `web/src/test/repositorio.test.ts`: chave versionada `aerolyze-lab:v1`, fallback de storage em memória, resiliência a erro de quota, imutabilidade de `PECAS_SEED` (5) e `LOTES_SEED` (6), CRUD completo com isolamento de referências, recuperação de JSON corrompido/versão incompatível/schema inválido e serialização `config.toml`.
- `web/src/test/ui.test.tsx`: listagem de registros, exclusão de lote, restauração do seed e emissão de log `REPO` no sandbox do Repositório.
