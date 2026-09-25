# Feira Veste Phenix — app de atendimento, cadastro de produtos e relatório

Referência técnica e operacional do app **Veste Phenix — Feira**, que convive com o Radar de
Clientes no mesmo site (`radarphenix.pages.dev`) e no mesmo projeto Supabase
(`ujrvncptcymootpyalpd`). Leia antes de mexer em rotas, PWA/instalação, no cadastro de
produtos ou no relatório admin.

Documentos relacionados: `ACESSO_SUPABASE_CLI.md` (como rodar comandos `supabase` daqui),
`OPERACAO_DEPLOY_SUPABASE_RADAR.md` (deploy automático do banco), `CONTEXTO_PROJETO.md`
(histórico), `MANUAL_USUARIO.md` (seções 15.5, 15.6, 18 e 24).

## 1. Endereços

| Endereço | O que é | Login |
| --- | --- | --- |
| `radarphenix.pages.dev/radar/` | Radar de Clientes (app instalável "Radar Clientes") | sim |
| `radarphenix.pages.dev/` | redireciona para `/radar/` (sem recarregar; preserva `?query` e `#hash`) | — |
| `radarphenix.pages.dev/feira/veste-phenix` | App da feira (instalável "Veste Phenix"): menu → Promoção ou Cadastro de Produtos | não |
| `radarphenix.pages.dev/promo/veste-phenix` | Formulário público de inscrição da promoção (não instalável) | não |

A escolha da tela acontece em `src/main.jsx` pelo `pathname`: `/promo/veste-phenix` →
`FormularioPromocao`, `/feira/veste-phenix` → `FeiraVestePhenix`, qualquer outro → `App` (Radar).

## 2. Dois apps instaláveis no mesmo site

Requisito do usuário: Radar e Veste Phenix instalam como **apps separados**, cada um com seu
ícone, **sem criar outro site/domínio**.

Como está resolvido (não desfazer):

1. **Escopo do Radar é `/radar/`**, não `/`. Em `vite.config.js` o manifesto do Radar tem
   `id: '/'`, `start_url: '/radar/'`, `scope: '/radar/'`. O `id: '/'` mantém a identidade
   das instalações antigas (feitas com `start_url: '/'`), que só passam a abrir em `/radar/`.
   Com `scope: '/'` o Radar abrangia `/feira/` e o Android/Chrome mostrava "Abrir no app" em
   vez de instalar o Veste Phenix.
2. **A feira tem HTML próprio**: `feira/veste-phenix.html` é uma segunda entrada do build
   (`build.rollupOptions.input.feira`). O Cloudflare Pages serve esse arquivo em
   `/feira/veste-phenix` (URL sem `.html`, resposta 200). O HTML já traz
   `<link rel="manifest" href="/manifest-feira-veste-phenix.webmanifest">`, ícones, título e
   `apple-mobile-web-app-title` do Veste Phenix.
   - Trocar o manifesto por JavaScript depois do carregamento **não funciona**: o navegador lê
     o manifesto no load. No computador ele reinstalava o Radar ("instalado", sem novo ícone) e no
     Android a instalação travava em "Instalando…".
   - O plugin `manifestoSoDoRadar` (em `vite.config.js`) remove da página da feira o
     `<link rel="manifest">` do Radar que o `vite-plugin-pwa` injeta em todo HTML.
3. **Service worker**: um só, escopo `/`, compartilhado pelos dois apps. O Workbox tem
   `navigateFallbackDenylist: [/^\/feira\//]`, e `feira/veste-phenix.html` é pré-cacheado.
   Assim `/feira/veste-phenix` nunca recebe o `index.html` do Radar, nem offline.
   `includeAssets` pré-cacheia o manifesto e os ícones `veste-phenix-*.png`.
4. **Manifesto da feira** (`public/manifest-feira-veste-phenix.webmanifest`):
   `id: /feira/veste-phenix`, `start_url: /feira/veste-phenix`, `scope: /feira/`.
5. **Ícones distintos**: Radar = azul `#0057d8` (`pwa-*.png`); Veste Phenix = azul-escuro com
   "VESTE" em `#8ed7e8` (`veste-phenix-192x192.png`, `-512x512`, `-maskable-512x512`,
   `-apple-touch-180x180`), gerados a partir de `phenix-30-anos-branco-transparente.png`.
6. **A página `/promo/veste-phenix` remove o `<link rel="manifest">`** (em `main.jsx`): é uma
   página pública de inscrição e não deve oferecer instalar nada.

Regras para mudanças futuras:

- Nunca voltar o `scope` do Radar para `/`.
- Nova tela do app da feira: manter debaixo de `/feira/`. Nova página pública fora de
  `/feira/` e de `/radar/`: decidir explicitamente se tem manifesto próprio ou nenhum.
- Links internos do Radar que montam URL devem continuar funcionando em `/radar/`. O
  `redirectTo: window.location.origin` do Supabase Auth cai em `/`, que redireciona para
  `/radar/` preservando o `#hash` com os tokens.

Como verificar (automatizável; a instalação em si não é, porque o navegador headless falha com
`kWriteDataFailed`): via CDP, `Page.getAppManifest`, `Page.getAppId` e
`Page.getInstallabilityErrors` em `/radar/` e `/feira/veste-phenix`, inclusive com
`javaScriptEnabled: false`, com o service worker já ativo e offline. Esperado:
- dois apps diferentes (`id` `/` e `/feira/veste-phenix`), ambos sem erro de instalabilidade;
- em `/promo/veste-phenix`, `no-manifest`.

## 3. Cadastro de produtos (tela da feira)

Arquivos: `src/CadastroProdutos.jsx`, `src/cadastro-produtos-feira.css`. A tela é aberta pelo
menu da feira (`src/MenuFeira.jsx`, `src/FeiraVestePhenix.jsx`).

- **Conexão**: usa o cliente compartilhado `src/supabaseClient.js`. Não criar cliente próprio a
  partir de `import.meta.env.VITE_SUPABASE_*`: essas variáveis não existem no build do
  Cloudflare. A primeira versão fazia isso e, em produção, gravava em `invalid.supabase.co`
  (nenhum cadastro era salvo).
- **Obrigatórios**: empresa, contato, telefone e quem fez o cadastro (mínimo 2 caracteres nos
  textos). Todo o resto é opcional.
- **Validações**: telefone fixo (DDD + 8 dígitos) ou celular (DDD + 9 dígitos começando com 9),
  com máscara automática; e-mail só é validado se for digitado.
- **Fluxo**: tipo de papel → produto → (modelo, se o produto tiver) e posição (opcional, para
  Tela Tecida, Secadora Espiral, Feltro e Feltro com emenda). Escolhas por botões clicáveis;
  clicar de novo desmarca. Medidas (comprimento, largura, espessura com 3 casas; CFM e
  gramatura inteiros; "Teflonada" só para Secadora Espiral) e condições de operação só
  aparecem depois de escolher papel e produto. Sem produto, esses campos não são enviados.
- **Aviso de medidas**: ao salvar sem comprimento e/ou largura (ou sem produto), aparece
  confirmação "Salvar mesmo assim / Informar medidas" (não bloqueia).
- **Salvar**: barra de ações fixa no rodapé. "Salvar e cadastrar outra máquina" mantém os
  dados do contato e mostra confirmação; "Salvar e voltar ao menu".
- Estilos do app (`button:hover` global) vazam para a tela; por isso há regras explícitas de
  hover em `.cadastro-produtos …` no CSS.

### Banco e função

- Tabela `public.cadastro_produtos_feira_phenix`. Migrations:
  - `20260924120000_cadastro_produtos_feira.sql` (criação; RLS ligado, sem acesso para anon);
  - `20260924123000_cadastro_produtos_dimensoes.sql` (comprimento/largura);
  - `20260925090000_cadastro_produtos_campos_opcionais.sql` (só os 4 campos obrigatórios;
    checks de e-mail/máquina/tipo de papel aceitam nulo);
  - `20260925120000_cadastro_produtos_leitura_admin.sql` (leitura para admin, ver seção 4).
- Gravação exclusiva pela Edge Function `supabase/functions/cadastrar-produto-feira`
  (`verify_jwt = false`, service role). Ela revalida tudo no servidor: obrigatórios, telefone,
  e-mail, formato das medidas, combinação papel/produto/modelo. Campos vazios são gravados
  como `null`; posição só é gravada para produtos que a usam.

## 4. Relatório para administradores

- Menu admin do Radar → **Promoção 30 anos** (`src/PromocaoVestePhenix.jsx`) → abas
  **Promoção** | **Cadastros de produtos** (`src/RelatorioProdutosFeira.jsx`, estilos em
  `src/promocao.css`).
- Indicadores (cadastros, empresas, sem comprimento/largura), busca, filtros por papel e
  produto, linha expansível com todos os campos, "Atualizar" e "Exportar Excel" (respeita os
  filtros).
- **Segurança**: a política RLS `admin consulta cadastro produtos feira` e o
  `grant select … to authenticated` liberam leitura só para `perfis.tipo_perfil='admin'` e
  `ativo=true`. É o mesmo padrão das tabelas da promoção. Testado no banco oficial:
  - anon: `permission denied`;
  - usuário comum: 0 linhas;
  - admin: todas as linhas.

## 5. Publicação

- **Frontend**: push na `main` → Cloudflare Pages publica sozinho em ~1 min.
- **Banco e função da feira**: o push na `main` que altera `supabase/migrations/**` ou
  `supabase/functions/cadastrar-produto-feira/**` dispara o workflow **Deploy Supabase Radar**
  (`db push` + deploy da função). Ver `OPERACAO_DEPLOY_SUPABASE_RADAR.md`.
- **Toda migration aplicada no banco precisa estar versionada**. Uma migration aplicada daqui e
  não commitada faz o `db push` do workflow falhar com *Remote migration versions not found in
  local migrations directory*. Isso aconteceu com `20260831083000`, e a correção foi commitar o
  arquivo.
- **Comandos `supabase` locais**: usar a chave de `.env.supabase.local` conforme
  `ACESSO_SUPABASE_CLI.md`. Nunca `supabase login`, nunca exibir a chave.
- Para verificar se um deploy entrou no ar, conferir o conteúdo publicado: baixar o
  `/assets/index-*.js` atual e procurar um texto novo. "Não mudou nada" costuma ser cache do
  PWA; no navegador, **Ctrl+Shift+R**; no app instalado, fechar e abrir de novo.

## 6. Solução de problemas de instalação

| Sintoma | Causa provável | O que fazer |
| --- | --- | --- |
| "Abrir no app" em vez de "Instalar" na feira | Radar instalado com o manifesto antigo (`scope: '/'`), guardado no cache | Remover os apps (`chrome://apps`/`edge://apps`), excluir dados do site, fechar o navegador, instalar a feira primeiro e depois o Radar. Conferir o `scope` em `chrome://web-app-internals` |
| Android travado em "Instalando…" | O Chrome entrega a instalação à Play Store, que estava configurada para baixar só no Wi-Fi e o celular estava em dados móveis | Ligar o Wi-Fi, ou Play Store → Configurações → Preferências de rede → "Qualquer rede"; verificar a fila de downloads da Play Store |
| Computador diz "instalado", mas não cria o segundo ícone | Firefox: não instala dois apps separados do mesmo site | Instalar pelo Chrome ou pelo Edge (confirmado funcionando no Chrome em 2026-09-25) |
| Alternativa que sempre funciona no celular | — | Chrome ⋮ → Adicionar à tela inicial → **Criar atalho** (abre no navegador, com o ícone de cada app) |

## 7. Histórico

- **2026-09-24** (outra IA): cadastro de produtos, menu da feira, rota própria `/feira/veste-phenix`
  e workflow Deploy Supabase Radar. O workflow falhava (migration `20260831083000` sem arquivo
  versionado); corrigido commitando a migration.
- **2026-09-24/25**:
  - redesenho do cadastro no padrão visual da promoção, com regras de campos
    obrigatórios/opcionais, aviso de medidas, botões fixos e campos revelados após o produto;
  - correção da gravação (cliente Supabase inválido em produção);
  - relatório admin;
  - separação dos dois apps instaláveis (escopo `/radar/`, HTML próprio da feira, ícones
    próprios);
  - chaves do Supabase CLI por projeto.
- Registro existente no banco em 2026-09-25: cadastro "marcelo" / Tela Acabadora, feito pelo
  usuário como teste. Não foi apagado; aguarda decisão dele.
