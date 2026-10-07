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
- **Outros e limites por máquina** (2026-09-29): Tissue e Marrom têm o produto "Outros", com
  "Nome do produto" (coluna `nome_produto_outros`, só gravada quando produto = Outros),
  posição, medidas, CFM, gramatura e durabilidade. Formadora (Tela Formadora/Formadora) vai
  até 5 unidades por máquina, Secadora Espiral até 14, os demais até 3. Regra em `LIMITES`,
  igual no front e na Edge Function; o banco só limita `item` entre 1 e 14.
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
  `src/promocao.css`) | **Estatísticas** (`src/EstatisticasFeira.jsx`, seção 4.3).
- A aba **Promoção** recarrega a lista de inscrições e o "Contador da feira" sozinha a cada
  minuto, só com a aba visível, e também ao voltar para ela. Tem ainda o botão **Atualizar**
  com "atualizado às HH:MM". Desde 06/10/2026, commit `0b1b1d7`.
- Indicadores (cadastros, empresas, sem comprimento/largura), busca, filtros por papel e
  produto, linha expansível com todos os campos, "Atualizar" e "Exportar Excel" (respeita os
  filtros).
- **Segurança**: a política RLS `admin consulta cadastro produtos feira` e o
  `grant select … to authenticated` liberam leitura só para `perfis.tipo_perfil='admin'` e
  `ativo=true`. É o mesmo padrão das tabelas da promoção. Testado no banco oficial:
  - anon: `permission denied`;
  - usuário comum: 0 linhas;
  - admin: todas as linhas.

## 4.1 Botão VestControl (demonstração)

- Terceiro botão do menu da feira (`src/MenuFeira.jsx`). Abre `https://vestcontrol.pages.dev/demo?voltar=<origem>/feira/veste-phenix` na mesma janela.
- O VestControl entra sozinho com um usuário de **Consulta** (somente leitura) da empresa fictícia **Cartiera**, mostra a faixa "Modo demonstração" e o botão **← Voltar ao Veste Phenix**, que encerra a sessão e volta para o menu da feira.
- Toda a lógica de acesso vive no projeto VestControl (`app/demo`, Edge Function `demo-session`; ver `CONTEXTO_PROJETO.md` de lá). Aqui só existe o link; se o endereço do VestControl mudar, trocar `VESTCONTROL_DEMO` em `src/MenuFeira.jsx`.

## 4.2 Contador da feira (cliques e acessos)

- Tabela `veste_phenix_eventos`. Ela **não guarda dado pessoal**: nada de IP, aparelho ou
  identificação. Só `evento`, `origem` e `criado_em`. Migration `20261006150000`.
- A gravação pública passa só pela função `registrar_evento_veste_phenix(evento, origem)`, que
  valida o evento numa lista fechada. No front fica em `src/eventosVestePhenix.js` (fetch com
  `keepalive`, que nunca trava a tela; uma falha de rede é ignorada).
- Eventos:

  | Evento | Onde | Origem |
  | --- | --- | --- |
  | `menu_veste_phenix`, `menu_cadastro_produtos`, `menu_vestcontrol` | botões do menu da feira (`MenuFeira.jsx`) | `stand` |
  | `acesso_promocao` | abrir `/promo/veste-phenix` (uma vez por visita) | `?origem=` do link, ou `direto` |
  | `inscricao_concluida` | tela de sucesso do formulário | `stand` (tablet) ou a origem do link |

- **QR code**: o QR impresso no stand aponta para `https://radarphenix.pages.dev/promo/veste-phenix`
  sem marcação. Por isso os acessos dele entram como `direto`, junto com quem abre o link pelo
  WhatsApp. Numa reimpressão, usar `…/promo/veste-phenix?origem=qrcode` para separar.
- Leitura (admin): `resumo_eventos_veste_phenix()` (total e hoje) e
  `eventos_por_hora_veste_phenix()` (por dia e hora, migration `20261006210000`). As duas
  conferem perfil admin ativo.

## 4.3 Aba Estatísticas e PDF

- `src/EstatisticasFeira.jsx` reaproveita os gráficos do Painel BI (`src/bi/BarChart.jsx`,
  `StatTile.jsx`, `paletteBI.js`, `bi-panel.css`).
- Filtro por dia da feira (horário de Brasília) e "Período todo". Mostra 8 indicadores
  (inscrições, empresas, acessos link/QR, conversão, pico, aceite de novidades, e-mails com
  falha, cadastros de produtos), gráficos por hora, segmento, UF, relação, empresas, cidades,
  cliques e produtos, e o **mapa de calor dia × hora** das inscrições.
- Agrupamentos:
  - **Empresa**: pelo domínio do e-mail corporativo. "Fernandez" e "Fernandez Indústria de
    Papel" entram juntas. Quem usou e-mail pessoal (gmail, hotmail…) entra pelo nome digitado.
  - **Cidade**: ignora maiúsculas, acentos e a UF digitada junto ("Amparo-SP" = "Amparo").
- **Imprimir / PDF**: o botão põe a classe `modo-impressao-estat` no `body`, e o CSS de
  impressão em `promocao.css` esconde todo o resto do Radar (`:has(.estat-feira)`). O resultado
  são 2 páginas A4 com logo, dia e hora de geração. No navegador, escolher "Salvar como PDF".
- O PDF do 1º dia está em `veste-phenix-30-anos/Publicar/Estatisticas_Feira_Veste_Phenix_2026-10-06.pdf`.

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

## 6.1 Operação durante a feira (e-mails, WhatsApp, consultas)

Todos os scripts ficam em `scripts/`, leem o token de `.env.supabase.local` e nunca o exibem.

| Situação | O que fazer |
| --- | --- |
| Conferir números ao vivo | `bash scripts/consulta-leitura-radar.sh arquivo.sql`. Roda o SQL numa transação **somente leitura** e termina em rollback |
| E-mail aparece como "falhou", mas está na caixa de saída do Gmail (timeout do Gmail) | `bash scripts/marcar-email-enviado-veste-phenix.sh email@x`. Marca como enviado só aquela inscrição (exige exatamente 1). **Não** clicar em "Reenviar", senão sai uma 2ª cópia |
| E-mail digitado errado (domínio inexistente, `.comb.r`, faltou `.br`) | Conferir o domínio certo (`nslookup -type=MX dominio`, padrão dos colegas da mesma empresa) → `bash scripts/corrigir-email-veste-phenix.sh errado@x certo@x` → no painel, **Reenviar e-mails com falha** |
| Recusado por spam ou "endereço não existe" na empresa (550) | Mandar os números por WhatsApp: `bash scripts/whatsapp-numeros-veste-phenix.sh email@x` (prévia) e depois com `--enviar`. Acrescentar `--endereco` quando o servidor não reconheceu o endereço: o texto diz que "tivemos um retorno do servidor" (sem dizer que está errado) e pede para a pessoa confirmar o e-mail |

- O WhatsApp sai pelo WAHA da VM do MW_Aniversarios (mesmo número). O script lê a chave na VM
  por SSH e confere `check-exists` antes de enviar. As respostas chegam nesse número.
- **Acentos no WhatsApp**: o corpo vai para o `curl` por arquivo, com os acentos escritos como
  códigos `\uXXXX`. Passar UTF-8 como argumento do curl no Windows quebrou os acentos da 1ª
  mensagem de 06/10, que foi apagada e reenviada.
- Os e-mails saem do `radarphenix@gmail.com` (Gmail SMTP), sem DKIM do domínio Phenix. Filtros
  corporativos (BRDrive, Microsoft 365) podem recusar. Esses casos são tratados como exceção
  por WhatsApp. A solução definitiva, se o volume crescer, é um provedor transacional
  (Resend) com DNS do domínio.
- O tempo de espera do SMTP é de 60 s desde 06/10 (`socketTimeout`). Com 20 s, o Gmail lento
  marcava como "falhou" um e-mail que tinha saído.
- **Validação de e-mail** (formulário e Edge Function, desde 06/10): recusa domínio que não
  termina em letras e os erros comuns `.con`, `.cpm`, `.cm`, `.vom`, `.comb.r` e `.com.b`. Um
  domínio válido porém inexistente (`empresa.com` em vez de `.com.br`) **não** é detectado.
  Isso foi decisão de 06/10: com o volume baixo, é corrigido um a um.

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
- **2026-10-06 (1º dia de feira)**:
  - painel com recarga automática e botão Atualizar (`0b1b1d7`);
  - SMTP com 60 s de espera e validação de e-mail mais rígida (`3829c4c`);
  - contador de cliques e acessos (`79b98d3` banco, `1142d1f` telas);
  - aba Estatísticas (`fe8f9ac` banco, `998e2ec` telas) e Imprimir / PDF (`1b1f3de`).
  - Correções feitas no dia:
    - e-mail do Rafael (`suzano.comb.r` → `.com.br`) e do Luiz (`fernandezpapel.com` →
      `.com.br`) corrigidos e reenviados;
    - Kelvyn (Papel Tangará, recusa por spam), Luiz e Fabrício (Fernandez, endereço não
      reconhecido) receberam os números por WhatsApp;
    - um falso "falhou" do compras3@gmail.com (timeout) foi marcado como enviado.
  - Fechamento do dia: 30 inscrições de 16 empresas, pico às 15h, 79% de conversão
    link/QR → inscrição e **0 cadastros de produtos**. Os tablets quase não foram usados (2
    cliques em cada botão do menu); conferir com a equipe do stand.
- **2026-10-07 (2º dia de feira)**:
  - Joaquim Silva (g.producao@cipel.com.br) tinha o telefone gravado no campo empresa;
    corrigido para "Cipel de Pádua", o mesmo nome usado pelo outro inscrito da Cipel. Só esse
    campo foi alterado; os números da sorte continuam os mesmos e o e-mail não foi reenviado.
  - Revisão das 30 inscrições do 1º dia: todos os CPFs e CNPJs são válidos, não há CPF,
    e-mail ou telefone repetido, e os 300 números são distintos, 10 por inscrição. Ficou para
    **depois da promoção**, por decisão do usuário, a padronização de nomes de empresa
    (Suzano / Suzano SA, Novacki…), a correção de "Luteprl" para Lutepel, das cidades
    "Amparo-SP" e "Amparo SP" e das maiúsculas de nomes e cidades. Durante a promoção só se
    corrige dado claramente errado.
- Registro existente no banco em 2026-09-25: cadastro "marcelo" / Tela Acabadora, feito pelo
  usuário como teste. Não foi apagado; aguarda decisão dele.
