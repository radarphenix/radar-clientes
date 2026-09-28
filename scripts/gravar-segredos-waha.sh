#!/usr/bin/env bash
# Grava no Supabase do Radar os secrets do WAHA (WhatsApp) usados pelo comunicado ao contemplado
# da promoção Veste Phenix. Lê a chave da API direto da VM (nunca exibe) e o token do Radar do
# arquivo local .env.supabase.local (o Supabase CLI desta máquina está logado em outra conta).
set -euo pipefail
RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
CHAVE_SSH="$RAIZ/../../01_Desktop/MW_Aniversarios/Keys/ssh-key-2026-08-04.key"
VM="opc@136.248.112.223"

SUPABASE_ACCESS_TOKEN="$(grep -E '^SUPABASE_ACCESS_TOKEN=' "$RAIZ/.env.supabase.local" | head -1 | cut -d= -f2- | tr -d '\r" ')"
export SUPABASE_ACCESS_TOKEN
[ -n "$SUPABASE_ACCESS_TOKEN" ] || { echo "Token do Radar não encontrado em .env.supabase.local"; exit 1; }

CHAVE_WAHA="$(ssh -i "$CHAVE_SSH" -o BatchMode=yes -o ConnectTimeout=15 "$VM" "sudo grep -E '^WAHA_API_KEY=' /etc/waha.env | cut -d= -f2-" 2>/dev/null | tr -d '\r\n')"
[ ${#CHAVE_WAHA} -ge 20 ] || { echo "Não foi possível ler a chave do WAHA na VM"; exit 1; }

npx -y supabase secrets set \
  WAHA_BASE_URL=http://136.248.112.223:3000 \
  "WAHA_API_KEY=$CHAVE_WAHA" \
  WAHA_SESSAO=default \
  --project-ref ujrvncptcymootpyalpd 2>&1 | sed -E 's/sbp_[A-Za-z0-9]+/sbp_***/g'
echo "Secrets do WAHA gravados."
