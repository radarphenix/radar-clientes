# Segurança do Radar

Documento de auditoria e das decisões de segurança do `radar-clientes`.
Projeto Supabase: `ujrvncptcymootpyalpd`. Frontend: Cloudflare Pages (`radarphenix.pages.dev`).

> Última revisão: **2026-10-28**. Mantenha este arquivo atualizado a cada mudança
> que afete controle de acesso, RLS, edge functions ou cabeçalhos.

---

## 1. Escopo e método

- **Revisão caixa-branca** do que é nosso: policies RLS de todas as tabelas, as 9 edge
  functions, funções `security definer`, tratamento de segredos e cabeçalhos HTTP.
- **Testes ao vivo não-invasivos** no nosso próprio ambiente, com a conta de teste
  (ver `CREDENCIAIS_TESTE_LOCAL.md`): confirmação de que quem não tem acesso é negado,
  e avaliação de CSP com navegador automatizado.
- **Não foi feito** (e não deve ser sem autorização): varredura de vulnerabilidade,
  brute force, ou qualquer sondagem contra sistemas de terceiros (ex.: portal CIGAM).

Pergunta-guia da auditoria: **"dá para acessar o dado sem ter acesso?"**

---

## 2. Como o acesso é protegido (modelo)

Há dois caminhos até o dado, com proteções diferentes:

### Caminho 1 — banco direto (REST/realtime, chave anon, o próprio app)
Protegido por **RLS**. Estado verificado:
- RLS habilitado em **todas** as ~40 tabelas de conteúdo; `anon` revogado.
- `clientes` (dado sensível): **SELECT por carteira** — representante só vê os clientes
  do próprio código; admin/técnico veem tudo. Escrita exige `radar_pode('clientes.gerenciar')`.
- As policies frouxas `using (true)` que existiam no início (em `perfis`, `rotas`,
  `rota_clientes`, `visitas`, `clientes`) **foram removidas** (`DROP`) e trocadas por
  policies por carteira/admin. A policy de teste `clientes_select_anon_teste` foi apagada.

**Conclusão:** usuário logado comum não lê a carteira dos outros; sem login não entra.

### Caminho 2 — edge functions
Todas rodam com **service_role**, que **ignora o RLS**. Nelas, a trava é **apenas o
`if` escrito no código** (`getUser` / `radar_pode` / token). **Regra de manutenção:
toda edge function nova confere papel/token logo no topo** — o RLS não salva aqui.

| Função | Login exigido (`verify_jwt`) | Trava |
|---|---|---|
| `criar-usuario` | sim | confirma chamador `admin` ativo |
| `inspecao-arquivos` | sim | papel Inspeção + lê a foto pela sessão do usuário (RLS) |
| `inspecao-email` | sim | papel `inspetor` |
| `geocodificar-clientes` | sim | só dispara geocodificação (não devolve dado) |
| `inspecao-celular` | **não** | token aleatório de 48 chars, sessão expira em 2h |
| `agenda-tecnico-ics` | **não** | token (uuid) na URL |
| `agenda-geral-ics` | **não** | token (uuid) na URL |
| `cadastrar-produto-feira` | **não** | formulário público validado |
| `inscrever-veste-phenix` | **não** | público, com tabela de rate-limit |

---

## 3. Achados e status

| # | Achado | Gravidade | Status |
|---|---|---|---|
| 1 | `inspecao-arquivos` baixava foto via service_role (RLS não era a trava) | Médio | ✅ **Corrigido e publicado** |
| 2 | Feeds `.ics` expunham **endereço completo** do cliente numa URL pública | Médio | ✅ **Corrigido e publicado** |
| 3 | Sem HSTS/CSP; portal revela menos que o nosso, mas ambos sem esses headers | Baixo | ✅ **`_headers` criado** (CSP Report-Only) |
| 4 | `inspecao-email` é "mailer aberto": inspetor manda html/anexos a qualquer destino pela conta Gmail Qualidade Phenix | Médio-alto | ⛔ **Pendente** |
| 5 | Token das agendas `.ics` **não vence nem tem revogação** | Médio | ⛔ **Pendente** |
| 6 | `cadastrar-produto-feira` sem rate-limit/captcha (flood sem login) | Baixo | ⛔ **Pendente** |
| 7 | `radar_permissoes*` com SELECT `using(true)` (qualquer logado lê a matriz de permissões) | Baixo | ⛔ Pendente (info, não dado de cliente) |

---

## 4. O que foi corrigido (com data)

### 4.1 `inspecao-arquivos` — RLS como trava (2026-10-28)
O GET de foto passou a ler a linha de `inspecao_fotos` **com a sessão do usuário**
(`doUsuario`), de modo que o RLS decide o acesso; o `service_role` só baixa o arquivo
do Google Drive. Se o `pode()` for removido numa edição futura, o RLS ainda segura.

### 4.2 Feeds de agenda `.ics` — só cidade (2026-10-28)
`agenda-geral-ics` e `agenda-tecnico-ics`: o evento mostra **nome do cliente + cidade**;
o endereço completo **nem é consultado** no banco. Motivo: o feed é uma URL pública
(sem login) que vaza com facilidade (sincroniza para Google/Apple, logs, compartilhamento).

### 4.3 Cabeçalhos de segurança — `public/_headers` (2026-10-28)
Vale no **próximo deploy do Cloudflare Pages** (o dev local não serve `_headers`).
- **Entram valendo:** `Strict-Transport-Security` (HSTS, 180 dias), `X-Content-Type-Options: nosniff`,
  `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`,
  `Permissions-Policy` (geolocalização e câmera só para o próprio site).
- **CSP em Report-Only** (não bloqueia, só reporta). Origens declaradas: Supabase
  (REST + `wss` realtime), `nominatim.openstreetmap.org`, Google Fonts
  (`fonts.googleapis.com` / `fonts.gstatic.com`), logo em `phenixonline.com.br`,
  `data:`/`blob:`. `script-src 'self'` (o build de produção não tem script inline).

### 4.4 Senha forte e provisória automática (2026-10-28)
- **Regra de senha:** mínimo 8 caracteres, com maiúscula, minúscula, número e caractere
  especial. Imposta **no servidor** (Supabase Auth: `password_min_length=8` e
  `password_required_characters` com os quatro grupos, via Management API) e validada também
  nas telas de definir/trocar senha do app (mesma mensagem). **Senhas existentes não são
  afetadas** — a regra só vale ao definir ou trocar a senha.
- **Senha provisória automática:** `criar-usuario` passou a gerar a senha provisória forte
  por conta própria (16 caracteres, 4 grupos garantidos, via `crypto`); o admin não digita
  mais senha. O onboarding segue **por e-mail** (link para o usuário definir a própria senha).

---

## 5. Evidência dos testes ao vivo

### 5.1 Controle de acesso (`inspecao-arquivos`) — 2026-10-28
| Cenário | Função (foto) | REST direto na tabela |
|---|---|---|
| admin logado (legítimo) | `200` imagem | `200` com linhas |
| sem login (só chave anon) | `403` "Sem acesso" | `401` *permission denied* (42501) |
| token/JWT inválido | `401` *Invalid JWT* | — |

Confirma: minha correção não quebrou o caminho legítimo, e quem não tem acesso é negado
pelas duas portas. (O cenário "logado sem papel" cai no mesmo caminho do anon:
`inspecao_papel_atual` devolve `null` → nível 0 → negado.)

### 5.2 Avaliação de CSP (Report-Only, Playwright) — 2026-10-28
Navegação real com o CSP injetado como header Report-Only. Exercitado: página pública
da feira (fonts), login admin, Clientes, Rotas, Comissões, Inspeções + fotos.
- **Achado real:** `img-src` bloquearia o logo `phenixonline.com.br` → **adicionado ao CSP**.
- **Falso positivo:** `script-src-elem inline` era o HMR do Vite (dev). Confirmado pelo
  build: `dist/index.html` não tem script inline. `script-src 'self'` está correto.
- **Não exercitado ao vivo:** Mapa, Agenda, Painel BI e busca de endereço (nominatim).
  Pela análise estática só consomem Supabase (coberto) e não há mapa de tiles embutido.

---

## 6. Pendências (backlog priorizado)

1. **`inspecao-email` — allowlist de destinatários** *(maior risco real)*.
   Hoje um `inspetor` manda HTML e anexos arbitrários para qualquer e-mail, saindo de
   `Qualidade Phenix <radarphenix@gmail.com>`. Restringir os destinos aos e-mails
   cadastrados (ou domínios aprovados), gerar o HTML no servidor e pôr rate-limit.

2. **Token de agenda — "gerar novo link" (kill-switch)**.
   O `calendario_token` (em `perfis_tokens`) e o token da agenda geral são `uuid` fixos,
   **sem validade nem revogação**. Decisão: **não** expirar/rotacionar de rotina (quebraria
   as assinaturas dos diretores no Google Agenda). Implementar só um botão "gerar novo link"
   que troca o `uuid` do próprio usuário — usado apenas em suspeita de vazamento.

3. **Ligar o CSP (enforced)**.
   Depois do próximo deploy do Pages, abrir o console (F12) em Mapa/Agenda/Painel BI; se
   não houver aviso de CSP, trocar `Content-Security-Policy-Report-Only` por
   `Content-Security-Policy` em `public/_headers`.

4. **`cadastrar-produto-feira` — rate-limit** contra flood sem login (a
   `inscrever-veste-phenix` já tem `promocao_veste_phenix_rate_limits` como referência).

5. **`radar_permissoes*` — escopar SELECT para admin** (hoje qualquer logado lê a matriz
   inteira de permissões; é config, não dado de cliente).

---

## 7. Como verificar / operar

**Conferir os cabeçalhos após o deploy do Pages:**
```bash
curl -sI https://radarphenix.pages.dev/ | grep -iE "strict-transport|content-security|frame-options|referrer-policy"
```

**Ligar o CSP de verdade:** em `public/_headers`, renomear o header
`Content-Security-Policy-Report-Only` para `Content-Security-Policy` e redeployar o Pages.

**Publicar uma edge function** (produção):
```bash
npx supabase functions deploy <nome> --project-ref ujrvncptcymootpyalpd
```

**Comparação com terceiros (ex.: portal CIGAM):** só é lícito observar cabeçalhos
públicos (o que o navegador já recebe). Não sondar/varrer sistema que não é nosso.
```

---

## 8. Princípios a manter

- Edge function nova **confere papel/token no topo** — o RLS não protege quem usa service_role.
- Policy nova **nunca** `using (true)` em tabela de dado; sempre por carteira/`radar_pode`.
- Segredos (`.env.*.local`) ficam fora do git e **nunca** são impressos.
- Mudança em produção (deploy, escrita no banco) só com autorização explícita.
```
