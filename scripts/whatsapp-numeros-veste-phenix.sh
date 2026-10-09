#!/usr/bin/env bash
# Envia por WhatsApp (WAHA da VM, mesmo número do MW_Aniversarios) os 10 números da sorte de UM
# participante da Veste Phenix cujo e-mail de confirmação foi recusado (ex.: filtro de spam da empresa).
# Uso: bash scripts/whatsapp-numeros-veste-phenix.sh email@participante.com [--endereco|--confirmar] [--enviar]
# Sem --enviar só mostra a mensagem e o telefone (prévia). Lê o banco em transação somente leitura.
# --endereco: o servidor da empresa não reconheceu o endereço (ex.: 550 5.4.1) — a mensagem pede o
# e-mail correto. Sem ele, o texto fala de filtro de spam.
# --confirmar: o e-mail não voltou, mas parece ter erro de digitação (ex.: não bate com o nome) — a
# mensagem só pede para a pessoa confirmar se o endereço está certo.
set -euo pipefail
EMAIL=$(printf '%s' "${1:-}" | tr 'A-Z' 'a-z' | tr -d " '\"\\;")
[[ "$EMAIL" =~ ^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$ ]] || { echo "Informe um e-mail válido."; exit 1; }
ENVIAR=""; export MOTIVO="spam"
for a in "${@:2}"; do case "$a" in --enviar) ENVIAR="--enviar";; --endereco) MOTIVO="endereco";; --confirmar) MOTIVO="confirmar";; *) echo "Opção desconhecida: $a"; exit 1;; esac; done
RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
cd "$RAIZ"
T=$(grep -E '^SUPABASE_ACCESS_TOKEN=' .env.supabase.local | head -1 | cut -d= -f2- | tr -d '\r" ')
export SUPABASE_ACCESS_TOKEN="$T"
TMP=$(mktemp); SAIDA=$(mktemp)
trap 'rm -f "$TMP" "$SAIDA"' EXIT
cat > "$TMP" <<SQL
begin; set transaction read only;
select nome_completo, telefone, email, numeros_sorte from promocao_veste_phenix_30_anos_com_numeros
 where lower(email) = '$EMAIL' and status = 'valida';
rollback;
SQL
npx -y supabase db query --linked -f "$TMP" > "$SAIDA" 2>/dev/null || { echo "Falha ao consultar o banco."; exit 1; }

# Monta a mensagem (modelo aprovado em 06/10/2026) e o número no formato 55DDDNNNNNNNNN.
MSG_JSON=$(node -e '
const fs=require("fs");const t=fs.readFileSync(process.argv[1],"utf8");const j=JSON.parse(t.slice(t.indexOf("{")));
const r=j.rows||[];if(r.length!==1){console.error(`Esperava 1 inscrição válida, achei ${r.length}.`);process.exit(1)}
const p=r[0];const nome=String(p.nome_completo).trim().split(/\s+/)[0];
const ns=p.numeros_sorte.map(n=>String(n).padStart(5,"0")).sort();
const endereco=process.env.MOTIVO==="endereco";const confirmar=process.env.MOTIVO==="confirmar";
const texto=[`Olá, *${nome}*! Tudo bem? 😊`,"",
confirmar?`Aqui é da *Phenix*. Recebemos sua inscrição na promoção *Veste Phenix 30 anos* e enviamos a confirmação para o e-mail informado, *${p.email}*. Na conferência dos cadastros, ficamos na dúvida se esse endereço está correto.`
:endereco?`Aqui é da *Phenix*. Recebemos sua inscrição na promoção *Veste Phenix 30 anos* e tentamos enviar a confirmação para o e-mail informado, *${p.email}*, mas tivemos um retorno do servidor de e-mail informando que a mensagem não pôde ser entregue.`
:`Aqui é da *Phenix*. Recebemos sua inscrição na promoção *Veste Phenix 30 anos* e enviamos a confirmação para *${p.email}*, mas o filtro de spam do seu e-mail recusou nossa mensagem.`,"",
"Sua inscrição está *confirmada* ✅ e estes são os seus *10 números da sorte*:","",
`*${ns.slice(0,5).join(" · ")}*`,`*${ns.slice(5).join(" · ")}*`,"",
"🎯 O sorteio será pela *Loteria Federal de 04/11/2026*.","📄 Regulamento: https://radarphenix.pages.dev/regulamento.pdf","",
...(endereco?["📧 Se puder, *confirme por aqui o seu e-mail*, para atualizarmos seu cadastro.",""]:[]),
...(confirmar?["📧 Pode nos *confirmar por aqui se esse é mesmo o seu e-mail*? Se tiver algum erro, é só mandar o endereço certo que atualizamos seu cadastro.",""]:[]),
"Guarde esta mensagem. Qualquer dúvida, é só responder aqui ou escrever para phenix@phenixonline.com.br.","",
"Boa sorte! 🍀","*Phenix • Tecendo Facilidades*"].join("\n");
const d=String(p.telefone).replace(/\D/g,"");const numero=d.startsWith("55")&&d.length>11?d:"55"+d;
process.stdout.write(JSON.stringify({numero,texto}));' "$SAIDA")
NUMERO=$(node -e 'process.stdout.write(JSON.parse(process.argv[1]).numero)' "$MSG_JSON")

echo "Telefone: +$NUMERO"
echo "-----"
node -e 'console.log(JSON.parse(process.argv[1]).texto)' "$MSG_JSON"
echo "-----"
[ "$ENVIAR" = "--enviar" ] || { echo "Prévia apenas. Para enviar, repita com --enviar."; exit 0; }

CHAVE_SSH="$RAIZ/../../01_Desktop/MW_Aniversarios/Keys/ssh-key-2026-08-04.key"
VM="opc@136.248.112.223"
CHAVE_WAHA="$(ssh -i "$CHAVE_SSH" -o BatchMode=yes -o ConnectTimeout=15 "$VM" "sudo grep -E '^WAHA_API_KEY=' /etc/waha.env | cut -d= -f2-" 2>/dev/null | tr -d '\r\n')"
[ ${#CHAVE_WAHA} -ge 20 ] || { echo "Não foi possível ler a chave do WAHA na VM."; exit 1; }
BASE="http://136.248.112.223:3000"

EXISTE=$(curl -s --max-time 20 -H "X-Api-Key: $CHAVE_WAHA" "$BASE/api/contacts/check-exists?phone=$NUMERO&session=default")
CHAT=$(node -e 'const j=JSON.parse(process.argv[1]||"{}");if(!j.numberExists||!j.chatId){process.exit(1)}process.stdout.write(j.chatId)' "$EXISTE") \
  || { echo "O número +$NUMERO não tem WhatsApp ativo (ou o WAHA não respondeu)."; exit 1; }
# O corpo vai por arquivo, com acentos/emojis escapados (\uXXXX): passar UTF-8 como argumento do
# curl no Windows converte para a página de código ANSI e a mensagem chega com acentos quebrados.
CORPO_ARQ=$(mktemp)
trap 'rm -f "$TMP" "$SAIDA" "$CORPO_ARQ"' EXIT
node -e 'const m=JSON.parse(process.argv[1]);const j=JSON.stringify({session:"default",chatId:process.argv[2],text:m.texto});let s="";for(let i=0;i<j.length;i++){const c=j.charCodeAt(i);s+=c>127?String.fromCharCode(92)+"u"+c.toString(16).padStart(4,"0"):j[i]}require("fs").writeFileSync(process.argv[3],s,"ascii")' "$MSG_JSON" "$CHAT" "$CORPO_ARQ"
COD=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 -X POST -H "X-Api-Key: $CHAVE_WAHA" -H 'Content-Type: application/json; charset=utf-8' --data-binary "@$CORPO_ARQ" "$BASE/api/sendText")
[[ "$COD" =~ ^2 ]] && echo "WhatsApp enviado para +$NUMERO (HTTP $COD)." || { echo "WAHA respondeu HTTP $COD ao enviar."; exit 1; }
