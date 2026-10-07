#!/usr/bin/env bash
# Marca como "enviado" a confirmação de UMA inscrição da Veste Phenix que ficou "falhou"
# por timeout do Gmail, mas que comprovadamente saiu (conferido na caixa de saída).
# Evita que "Reenviar e-mails com falha" mande uma segunda cópia ao participante.
# Uso: bash scripts/marcar-email-enviado-veste-phenix.sh email@participante.com
# Só altera linhas com email_status = 'falhou' daquele e-mail; aborta se achar mais de uma.
set -euo pipefail
EMAIL=$(printf '%s' "${1:-}" | tr 'A-Z' 'a-z' | tr -d " '\"\\;")
[[ "$EMAIL" =~ ^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$ ]] || { echo "Informe um e-mail válido."; exit 1; }
cd "$(dirname "$0")/.."
T=$(grep -E '^SUPABASE_ACCESS_TOKEN=' .env.supabase.local | head -1 | cut -d= -f2- | tr -d '\r" ')
export SUPABASE_ACCESS_TOKEN="$T"
TMP=$(mktemp)
trap 'rm -f "$TMP"' EXIT
cat > "$TMP" <<SQL
do \$\$
declare n int;
begin
  select count(*) into n from promocao_veste_phenix_30_anos
   where lower(email) = '$EMAIL' and email_status = 'falhou';
  if n <> 1 then raise exception 'Esperava 1 inscrição com falha para %, achei %', '$EMAIL', n; end if;
  update promocao_veste_phenix_30_anos
     set email_status = 'enviado', email_confirmacao_enviado_em = now(), email_ultimo_erro = null
   where lower(email) = '$EMAIL' and email_status = 'falhou';
end \$\$;
select email, email_status, email_tentativas from promocao_veste_phenix_30_anos where lower(email) = '$EMAIL';
SQL
npx -y supabase db query --linked -f "$TMP" 2>&1 \
  | sed -E 's/sbp_[A-Za-z0-9]+/sbp_***/g'
