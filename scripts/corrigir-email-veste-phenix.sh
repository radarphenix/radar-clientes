#!/usr/bin/env bash
# Corrige o e-mail digitado errado em UMA inscrição da Veste Phenix e a deixa como "falhou",
# para o botão "Reenviar e-mails com falha" do painel mandar a confirmação ao endereço certo.
# Uso: bash scripts/corrigir-email-veste-phenix.sh email-errado@x.y email-certo@x.y
# Aborta se não houver exatamente uma inscrição com o e-mail errado. A troca fica na auditoria.
set -euo pipefail
limpa() { printf '%s' "${1:-}" | tr 'A-Z' 'a-z' | tr -d " '\"\\;"; }
ERRADO=$(limpa "${1:-}")
CERTO=$(limpa "${2:-}")
[[ "$ERRADO" == *@* ]] || { echo "Informe o e-mail errado."; exit 1; }
[[ "$CERTO" =~ ^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$ ]] || { echo "E-mail correto inválido."; exit 1; }
cd "$(dirname "$0")/.."
T=$(grep -E '^SUPABASE_ACCESS_TOKEN=' .env.supabase.local | head -1 | cut -d= -f2- | tr -d '\r" ')
export SUPABASE_ACCESS_TOKEN="$T"
TMP=$(mktemp)
trap 'rm -f "$TMP"' EXIT
cat > "$TMP" <<SQL
do \$\$
declare n int;
begin
  select count(*) into n from promocao_veste_phenix_30_anos where lower(email) = '$ERRADO';
  if n <> 1 then raise exception 'Esperava 1 inscrição com %, achei %', '$ERRADO', n; end if;
  update promocao_veste_phenix_30_anos
     set email = '$CERTO', email_status = 'falhou', email_confirmacao_enviado_em = null,
         email_ultimo_erro = 'E-mail corrigido de $ERRADO; aguardando reenvio'
   where lower(email) = '$ERRADO';
end \$\$;
select email, email_status, email_ultimo_erro from promocao_veste_phenix_30_anos where lower(email) = '$CERTO';
SQL
npx -y supabase db query --linked -f "$TMP" 2>&1 \
  | sed -E 's/sbp_[A-Za-z0-9]+/sbp_***/g'
