#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../../../.." && pwd)"
WEB_DIR="${ROOT_DIR}/web"

echo "==> [1/6] Verificando se src/core/ está livre de imports de React..."
if grep -rnE "from ['\"]react(-dom|-router)?['\"]" "${WEB_DIR}/src/core/"; then
  echo "ERRO: src/core/ não pode importar React!"
  exit 1
fi
echo "OK: src/core/ é TypeScript puro."

echo "==> [2/6] Verificando isolamento entre os 7 módulos em src/modules/..."
MODULOS=(modelo controlador calculos ia repositorio view-entrada view-dashboard)
for mod in "${MODULOS[@]}"; do
  for outro in "${MODULOS[@]}"; do
    if [ "${mod}" != "${outro}" ]; then
      if grep -rnE "modules/${outro}|\\.\\./${outro}" "${WEB_DIR}/src/modules/${mod}/"; then
        echo "ERRO: O módulo '${mod}' está importando diretamente o módulo '${outro}'!"
        exit 1
      fi
    fi
  done
done
echo "OK: Nenhum import cruzado entre módulos."

echo "==> [3/6] Verificando se apenas repository.ts acessa localStorage..."
VIOLACOES_STORAGE="$(grep -rnE "localStorage\.(getItem|setItem|removeItem|clear)|globalThis\.localStorage|window\.localStorage" "${WEB_DIR}/src/" \
  | grep -v "src/core/repository.ts" || true)"
if [ -n "${VIOLACOES_STORAGE}" ]; then
  echo "ERRO: Acesso direto ao localStorage fora de src/core/repository.ts:"
  echo "${VIOLACOES_STORAGE}"
  exit 1
fi
echo "OK: Apenas repository.ts acessa localStorage."

echo "==> [4/6] Verificando ausência de 'any' explícito..."
if grep -rnE ":[[:space:]]*any\b|<any>" "${WEB_DIR}/src/"; then
  echo "ERRO: Uso explícito de 'any' encontrado em web/src/!"
  exit 1
fi
echo "OK: Sem uso de 'any'."

echo "==> [5/6] Executando suíte de testes (Vitest)..."
(cd "${WEB_DIR}" && npm run test)

echo "==> [6/6] Executando checagem de tipos (tsc -b) e build de produção (Vite)..."
(cd "${WEB_DIR}" && npm run build)

echo ""
echo "✅ Portão de qualidade Aerolyze Lab aprovado com sucesso!"
