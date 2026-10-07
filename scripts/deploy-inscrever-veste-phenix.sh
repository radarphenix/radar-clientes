#!/usr/bin/env bash
# Publica a Edge Function inscrever-veste-phenix (e-mails da promoção) no Supabase do Radar.
# O token fica em .env.supabase.local (fora do git) e nunca é impresso.
set -euo pipefail
cd "$(dirname "$0")/.."
T=$(grep -E '^SUPABASE_ACCESS_TOKEN=' .env.supabase.local | head -1 | cut -d= -f2- | tr -d '\r" ')
export SUPABASE_ACCESS_TOKEN="$T"
npx -y supabase functions deploy inscrever-veste-phenix --project-ref ujrvncptcymootpyalpd 2>&1 \
  | sed -E 's/sbp_[A-Za-z0-9]+/sbp_***/g'
