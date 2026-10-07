#!/usr/bin/env bash
# Consulta SOMENTE LEITURA no Supabase do Radar (ujrvncptcymootpyalpd).
# Uso: bash scripts/consulta-leitura-radar.sh caminho/arquivo.sql
# O SQL roda dentro de uma transação read only (qualquer insert/update/delete falha)
# e termina em rollback. O token fica em .env.supabase.local (fora do git) e nunca é impresso.
set -euo pipefail
SQL_ARQ="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
cd "$(dirname "$0")/.."
T=$(grep -E '^SUPABASE_ACCESS_TOKEN=' .env.supabase.local | head -1 | cut -d= -f2- | tr -d '\r" ')
export SUPABASE_ACCESS_TOKEN="$T"
TMP=$(mktemp)
trap 'rm -f "$TMP"' EXIT
{ echo "begin; set transaction read only;"; cat "$SQL_ARQ"; echo; echo "rollback;"; } > "$TMP"
npx -y supabase db query --linked -f "$TMP" 2>&1 \
  | sed -E 's/sbp_[A-Za-z0-9]+/sbp_***/g'
