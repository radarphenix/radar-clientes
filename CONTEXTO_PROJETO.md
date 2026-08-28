# CONTEXTO_PROJETO

## Regra final de comissoes revisadas (2026-08-27)

O Radar nao exibe nem agrega notas ainda nao revisadas no MWComissoes. Vendas, metas, faixas, comissao prevista e Painel BI usam apenas notas cujas parcelas estejam todas revisadas. Os banners que informavam valores pendentes de revisao foram removidos para nao comunicar ao representante valores internos que ainda podem ser descartados.

No Historico anual, a composicao da comissao mostra separadamente comissao percentual, fixo previsto e total comissao + fixo.

## Regras Operacionais (Copilot + Codex)

- Nao realizar push para GitHub sem solicitacao explicita do usuario.
- Antes de qualquer alteracao de codigo, criar backup local com data/hora em `.codex-backups/`.
- Manter este arquivo atualizado ao final de cada bloco de trabalho relevante.
- Sempre atualizar `MANUAL_USUARIO.md` quando alteracoes funcionais forem concluidas com sucesso.
- Testes que inserem dados no Supabase remoto (rotas, clientes na rota,
  amostras, etc.) devem ter esses dados apagados ao final do teste. Usar o
  usuario demo documentado em `CREDENCIAIS_TESTE_LOCAL.md` (fora do git)
  para login automatizado em QA; esse usuario/perfil pode permanecer, mas
  os registros de teste que ele gerar, nao.

## Snapshot Atual

- Data: 2026-08-14
- Branch atual: `main`
- Situacao de sincronizacao: lote de commits (reordenacao de rotas, Meu Dia
  mobile, menu mobile, Promocao Veste Phenix e documentacao) enviado para
  `origin/main` em 2026-08-05; segundo lote (horario previsto de chegada,
  selo de status na Manutencao, `rota_clientes.incluido_por` e a tela
  Pesquisa de Rotas) enviado para `origin/main` em 2026-08-10 - todas as
  migrations correspondentes ja estavam aplicadas no Supabase remoto desde
  os testes locais. Terceiro lote (PWA instalavel, feed de Agenda do
  Tecnico/Geral em .ics, melhorias de apuracao da Promocao Veste Phenix) e
  a correcao de `STATUS:CANCELLED` sumindo do Google Calendar enviados
  para `origin/main` em 2026-08-14 (4 commits separados por assunto);
  migrations e edge functions correspondentes ja aplicadas/deployadas no
  Supabase remoto. Quarto commit do mesmo dia (`58620ea`, motivo do
  cancelamento em texto livre no "Cancelar" da execucao de rota, refletido
  na Manutencao da Rota e na `DESCRIPTION` do `.ics`) tambem ja foi
  enviado para `origin/main` e sua migration/functions ja aplicadas no
  Supabase remoto - confirmado via `supabase migration list`/`functions
  list` (o texto anterior desta secao, que dizia "pendente de solicitacao
  pra subir", ficou desatualizado por nao ter sido revisado logo apos o
  envio). Trabalho em andamento (nao commitado ainda): nova tela
  "Historico do Cliente" (botao no card de cliente, timeline de visitas +
  amostras) e reforma da Pesquisa de Rotas (filtros reorganizados, cidade/UF,
  nome da rota, atalhos de periodo, impressao de lista/roteiro) - ver
  secoes dedicadas abaixo.
- Backup pre-alteracoes mais recente: `.codex-backups/20260724_102912_visitas_agendadas_meu_dia`
- Backup da evolucao de repeticao e reordenacao:
  `.codex-backups/20260727_173924_rotas_repeticao_reordenacao`.
- Migration de Amostras aplicada no Supabase remoto via `supabase db push --linked` em 2026-07-03.
- Ajuste de contraste global aplicado em `src/app-global.css` e `src/index.css` para melhorar leitura de titulos e campos de busca.
- Cabecalho de contexto padronizado em `src/App.jsx` com estilo compartilhado em `src/app-global.css` para clientes, amostras, dashboard, administracao e alterar senha.
- Bloco de trabalho de 2026-08-18 (aba Comissões, card financeiro no Meu Dia,
  `piloto_comissoes`) ainda **sem commit** - ver entrada detalhada na secao
  de historico abaixo ("[Local em 2026-08-18] Aba Comissões revisada...").
  Nao fazer push ate solicitacao explicita.
- Bloco de trabalho de 2026-08-25 (auditoria de seguranca RLS, feature
  "Clientes em Pauta" completa e "Painel BI" para diretores) tambem ainda
  **sem commit** - ver as entradas detalhadas na secao de historico abaixo,
  todas datadas de 2026-08-25. Nao fazer push ate solicitacao explicita.

## PWA (aplicativo instalavel)

- [Concluido em 2026-08-14] Radar de Clientes instalavel no celular
  (icone na tela inicial, abre em tela cheia):
  - motivacao: usuario listou algumas evolucoes possiveis do Radar e
    escolheu comecar por essa - tecnicos abrindo o navegador e digitando
    a URL toda vez; guardadas as demais ideias em memoria (QR check-in,
    relatorio periodico, push, rota otimizada, historico do cliente);
  - `vite-plugin-pwa` (novo devDependency) adicionado ao
    `vite.config.js`: gera `manifest.webmanifest` e um service worker
    (Workbox, `registerType: 'autoUpdate'`) automaticamente no build; sem
    `runtimeCaching` customizado, entao so os arquivos do build (JS/CSS)
    ficam em cache - chamadas ao Supabase/Nominatim/OSRM continuam
    sempre indo pra rede, sem risco de mostrar dado desatualizado como
    se fosse atual;
  - **icone do app**: nao existia nenhum icone quadrado da marca Phenix
    em lugar nenhum acessivel (procurado no proprio repo, em
    `.codex-backups` e nos outros projetos do usuario -
    `MWAgendador`/`MWMenuWhatsApp` - sem sucesso); usada a logo oficial
    retangular (asa + "PHENIX") ja hotlinkada ao vivo no cabecalho do
    app (`https://phenixonline.com.br/wp-content/uploads/2021/05/Logo-Branco-1.png`),
    baixada para `src/pwa-icon-source.png` e composta sobre um fundo
    solido na cor azul da marca (`#0057d8`, mesma dos botoes do app
    inteiro) para virar um icone quadrado;
  - **bug encontrado na ferramenta `@vite-pwa/assets-generator`**
    (tentativa inicial, depois removida): ao usar essa ferramenta oficial
    para gerar o conjunto de icones automaticamente a partir da logo
    retangular, o resultado saia com a logo inteira sumindo (virava duas
    faixas azuis solidas com um vao branco no meio, sem nenhum traço do
    desenho) - a letterbox/enquadramento ficava certo, mas a composicao
    da transparencia dentro da area do logo se perdia; tentei reconverter
    o PNG de indexado para RGBA puro e o problema persistiu, ou seja nao
    era o formato do arquivo de origem, e sim algo na propria composicao
    de resize+background da ferramenta com essa imagem; a ferramenta foi
    removida do projeto (`npm uninstall @vite-pwa/assets-generator`, TS
    config apagado) para nao deixar configuracao quebrada/enganosa no
    repo;
  - **solucao usada**: script Node avulso com `sharp` (instalado
    temporariamente so pra essa tarefa) fazendo a composicao em duas
    etapas - primeiro redimensiona a logo mantendo a transparencia real
    (`fit: 'inside'`, sem forcar canvas quadrado nesse passo), depois
    cria um canvas solido azul do tamanho final e faz `composite()` da
    logo redimensionada centralizada por cima; gerou `pwa-64x64.png`,
    `pwa-192x192.png`, `pwa-512x512.png`, `apple-touch-icon-180x180.png`
    (todos com a logo ocupando ~70% da largura) e
    `maskable-icon-512x512.png` (logo menor, ~45%, dentro da area segura
    de recorte adaptativo do Android) - todos movidos para `public/`;
    sem `favicon.ico` (sharp nao gera esse formato) - o favicon usa o
    PNG de 64x64 diretamente via `<link rel="icon" type="image/png">`,
    suportado por todos os navegadores atuais;
  - `index.html`: favicon local substitui a URL remota antiga
    (`Logo-azul.png` do site da Phenix); adicionadas
    `<meta name="theme-color">` e as meta tags de iOS
    (`apple-mobile-web-app-capable`, `apple-mobile-web-app-title`,
    `apple-touch-icon`) - o plugin injeta o `<link rel="manifest">` e o
    script de registro do service worker automaticamente no build; `lang`
    do `<html>` corrigido de `en` para `pt-BR` de passagem (app inteiro
    em portugues);
  - `vite.config.js`: bloco `manifest` com `name: "Radar de Clientes
    Phenix"`, `short_name: "Radar Clientes"`, `display: "standalone"`,
    `background_color: "#edf4fb"` (mesmo tom claro de fundo do app),
    `theme_color: "#0057d8"`, `lang: "pt-BR"` (o plugin usa `"en"` como
    padrao se essa chave nao for definida - corrigido explicitamente);
  - validacoes: `npm run build` gera `dist/sw.js`,
    `dist/manifest.webmanifest`, `dist/registerSW.js` sem erros; testado
    com Playwright contra `npm run preview` (service worker so registra
    em contexto seguro, por isso preview/produção, nao o `npm run dev`
    comum): manifest retorna 200 com JSON valido (nome, short_name,
    display, 4 icones corretos), cada arquivo de icone (incluindo
    apple-touch-icon) retorna 200, `navigator.serviceWorker.getRegistrations()`
    mostra 1 registro ativo no escopo certo, meta tags de iOS presentes
    no DOM - cobre todo criterio tecnico de instalabilidade automatizavel;
    o prompt real de "instalar app" do sistema operacional (Android/iOS)
    nao e simulavel por Playwright, fica como teste manual pendente do
    usuario no celular;
  - nota tecnica: `npm run dev` nao ativa o service worker por padrao
    (`devOptions` nao foi habilitado) - o comportamento de instalacao so
    aparece no build de producao (`npm run preview` localmente, ou o
    ambiente publicado); isso e o comportamento padrao/esperado do
    `vite-plugin-pwa`, nao uma limitacao introduzida aqui;
  - `npm audit`: a instalacao trouxe (e depois removeu, junto do
    `@vite-pwa/assets-generator`) uma vulnerabilidade alta em `sharp`
    (`libvips`, uso pontual/dev-only, sem exposicao em producao); `npm
    audit fix` (sem `--force`) resolveu as demais vulnerabilidades que
    apareceram com as novas dependencias; sobrou so a vulnerabilidade
    pre-existente do `xlsx` (sem correcao disponivel, nao relacionada a
    este trabalho);
  - `MANUAL_USUARIO.md`: nova secao 18 "Instalacao como aplicativo
    (PWA)" com o passo a passo de instalar no Android/iOS.

## Planejamento de Rotas

- [Correcao em 2026-07-28] Reordenacao segura de clientes pendentes:
  - somente itens com status `PENDENTE` podem ser movidos;
  - clientes `VISITADO` e `CANCELADO` preservam suas posicoes, e os pendentes
    sao renumerados de forma continua a partir da posicao seguinte;
  - inclusoes novas tambem normalizam a fila pendente, evitando sequencias
    duplicadas ou lacunas;
  - a persistencia passou a atualizar diretamente cada item pendente, sem
    depender da funcao RPC `reordenar_clientes_rota`;
  - a ordenacao de leitura usa `sequencia` e `created_at` como desempate;
  - a regra foi centralizada em `src/lib/rotasSequencia.js` e coberta por
    `tests/rotas-sequencia.test.js`.
- [Ajuste em 2026-07-28] Planejamento responsivo:
  - os itens ganharam resumo visual de status e data prevista;
  - acoes, metadados e seletor de sequencia foram reorganizados para celular;
  - o botao Remover passou a usar icone com rotulo acessivel;
  - o mesmo cliente continua podendo aparecer mais de uma vez, mas nao pode
    ser agendado duas vezes para a mesma data dentro da mesma rota.
- [Concluido em 2026-07-27] Visitas repetidas e reordenacao manual:
  - o mesmo cliente pode ser incluido mais de uma vez na mesma rota;
  - cada inclusao permanece independente, inclusive para informar datas
    previstas diferentes;
  - a digitacao instavel da sequencia foi substituida por um seletor de
    posicao no Planejamento, Operacao e Manutencao;
  - ao mover um item para uma posicao ocupada, os demais pendentes sao
    deslocados e renumerados;
  - a migration criou a funcao SQL `reordenar_clientes_rota`, posteriormente
    substituida no frontend pela atualizacao direta dos itens pendentes;
  - a migration
    `20260727174500_rota_clientes_repeticao_reordenacao.sql` remove a
    unicidade rota/cliente, preserva indice de consulta e cria a funcao;
  - migration aplicada com sucesso no Supabase remoto vinculado;
  - o seletor recebeu largura compacta compativel com desktop e mobile;
  - validacoes concluidas: lint, build e `git diff --check`;
  - backup anterior:
    `.codex-backups/20260727_173924_rotas_repeticao_reordenacao`.
- [Correcao em 2026-07-27] Aparencia da reordenacao na Manutencao:
  - o seletor deixou de herdar o fundo azul e as dimensoes do antigo indicador
    numerico, eliminando a sobreposicao visual;
  - o indicador circular azul continua preservado fora do modo de
    reordenacao;
  - ajuste aplicado para desktop e mobile;
  - backup anterior:
    `.codex-backups/20260727_175447_ajuste_visual_reordenacao_manutencao`.

- [Concluido em 2026-08-10] Horario previsto de chegada por cliente da rota:
  - migration `20260810120000_rota_clientes_horario_previsto_visita.sql`
    adiciona `public.rota_clientes.horario_previsto_visita time`;
  - `RotasPlanejamento.jsx` ganhou campo de horario ao lado da data prevista,
    permitindo ao responsavel pela rota (tecnico ou admin) definir a hora de
    chegada esperada em cada cliente;
  - o campo fica bloqueado quando a rota esta `FINALIZADA`, seguindo a mesma
    regra da data prevista;
  - a lista de clientes da rota exibe um selo com o horario definido, ao lado
    do selo de data;
  - `App.jsx` persiste a alteracao em `rota_clientes.horario_previsto_visita`
    e mantem o resumo das rotas sincronizado;
  - `RotasOperacao.jsx` passou a exibir o horario previsto no painel do
    Cliente Atual e como selo em cada item de Proximos Clientes;
  - `MeuDia.jsx` passou a exibir o horario previsto junto da rota/cidade em
    cada card da agenda (atrasados, hoje, sem data, proximos);
  - migration aplicada no Supabase remoto (projeto usado tambem para
    desenvolvimento local) via `supabase db push --linked` em 2026-08-10;
    nao ha ambiente Docker local nesta maquina, entao o teste local roda
    contra o mesmo projeto remoto vinculado;
  - validacoes concluidas: lint (`eslint`) e build (`vite build`); servidor
    local (`npm run dev`) iniciado para validacao manual do usuario (login
    real necessario, nao automatizado pelo assistente).
- [Correcao em 2026-08-10] QA visual do horario previsto (desktop/tablet/mobile)
  encontrou e corrigiu um bug real de layout:
  - Playwright (Chromium headless) instalado localmente como devDependency
    ad-hoc (`npm install --no-save playwright` + `npx playwright install
    chromium`) para permitir screenshots automatizados; nao ficou registrado
    em `package.json`;
  - usuario de teste criado via Auth Admin API (service role) para permitir
    login automatizado sem usar credenciais reais: `Demo Teste`
    (perfil `admin`, ativo) - credenciais completas em
    `CREDENCIAIS_TESTE_LOCAL.md` (fora do git, ver `.gitignore`); esse
    usuario e reutilizavel por qualquer IA/ferramenta que precise logar
    para QA neste projeto;
  - a rota de teste usada nesta sessao (`ROTA DEMO TESTE (apagar)`, com 2
    clientes de exemplo ja existentes na base) foi removida do Supabase
    remoto apos o QA - regra fixada: dados inseridos para teste (rotas,
    rota_clientes, etc.) devem ser apagados ao final; o usuario/perfil
    demo em si pode permanecer, pois e infraestrutura reutilizavel;
  - screenshots confirmaram que os selos de data/horario (Planejamento,
    Operacao, Meu Dia) ficaram bons em todas as larguras;
  - bug encontrado: no Planejamento, em telas >900px, os campos "Data
    prevista" e "Horario" dividiam a linha lado a lado com `flex: 1 1
    160px`, deixando so ~72px para o `<input>` (rotulo de 80px + gap) -
    o valor aparecia cortado (ex.: data mostrando so "10/01" e o icone do
    seletor sobrepondo a borda);
  - correcao: dentro de `.linha-planejamento-rota-agendamento`, os campos
    passaram a empilhar rotulo acima do input (mesmo padrao ja usado no
    mobile) em vez de rotulo-esquerda/input-direita, entao o input recebe
    a largura cheia do campo;
  - efeito colateral encontrado e corrigido no mesmo lote: o
    `align-items: flex-start` adicionado para resolver o esticamento do
    par de campos no desktop vazava para o breakpoint `<=900px`, onde
    a mesma propriedade controla a largura (eixo cruzado) do modo coluna,
    fazendo os campos empilhados encolherem para o conteudo em vez de
    ocupar a linha inteira; corrigido com `align-items: stretch` explicito
    dentro do bloco `@media (max-width: 900px)` do `.planejamento-mobile`.
- [Correcao em 2026-08-10] Status na Manutencao parecia nao atualizar:
  - usuario relatou que mudar um cliente de Visitado para Pendente na
    Manutencao alterava o banco mas "nao visualmente", passando a
    impressao de que a alteracao nao ocorreu;
  - reproduzido com Playwright (login real, sem reload manual): o dado
    e o texto realmente atualizavam na hora (`alterarStatusClienteRota`
    ja chama `abrirRota` + `carregarRotas`, recarregando `clientesDaRota`
    do banco) - o problema nao era falta de refresh, e sim que o status
    aparecia como texto preto simples ("Status: VISITADO"), sem nenhuma
    cor, ao contrario do Planejamento/Operacao que usam selo colorido;
  - correcao: `RotasManutencao.jsx` passou a usar o mesmo selo
    `badge-status-rota` (verde/vermelho/laranja) ja usado no
    Planejamento, deixando a troca de status visualmente inequivoca no
    instante do clique;
  - validado visualmente com Playwright antes/depois do clique (sem
    reload) - confirmado que o selo muda de cor imediatamente.
- [Concluido em 2026-08-10] Auditoria de quem incluiu cliente na rota:
  - migration `20260810170000_rota_clientes_incluido_por.sql` adiciona
    `public.rota_clientes.incluido_por uuid` (sem FK, mesmo padrao de
    `aviso_whatsapp_por`);
  - `adicionarClienteNaRota` em `App.jsx` passou a gravar
    `session.user.id` em `incluido_por` a cada inclusao; a data de
    inclusao ja fica registrada em `created_at` (existente, automatico);
  - objetivo: se um admin incluir/alterar algo na rota de outro usuario,
    fica rastreavel quem fez a inclusao - relevante porque admins podem
    mexer em rotas de qualquer responsavel;
  - por pedido do usuario, nesta etapa so a gravacao foi implementada;
    exibir esse dado em alguma tela fica para uma proxima tarefa;
  - validado end-to-end com Playwright: login real, clique em "Adicionar"
    no Planejamento, e conferido via REST que a linha criada tinha
    `incluido_por` = id do usuario logado e `created_at` preenchido;
    dado de teste removido do Supabase remoto ao final.

## Pesquisa de Rotas

- [Concluido em 2026-08-10] Nova tela de busca por cliente-dentro-da-rota:
  - motivacao: `RotasLista.jsx` so filtra rotas inteiras; nao havia como
    consultar no nivel de cliente (ex.: "quem incluiu esse cliente", "quais
    clientes de tal cidade estao pendentes"), o que ficou mais relevante
    depois de `rota_clientes.incluido_por` ter sido implementado sem tela;
  - novo componente `src/RotasPesquisa.jsx` + `src/rotas-pesquisa.css`,
    modelados no padrao ja usado na tela Amostras (`App.jsx`
    `montarConsultaAmostras`/render ~5067): barra de filtros + lista de
    cards `<details>` (resumo sempre visivel, detalhe expande ao tocar);
  - diferença: filtragem 100% client-side (`useMemo` em `RotasPesquisa.jsx`)
    sobre uma lista ja montada em `App.jsx` (`linhasPesquisaRotas`, mesma
    logica do `agenda` de `MeuDia.jsx`: `rotas.flatMap(...)` juntando
    `rota`, `cliente` e o nome de quem incluiu) - sem query nova ao
    Supabase, os dados ja estao carregados para Meu Dia/Dashboard;
  - `carregarRotas()` (`App.jsx`) ampliou o `select` de `rota_clientes`
    para incluir `incluido_por, created_at` (unico dado que faltava);
  - filtros: busca livre (cliente/codigo/cidade), status do cliente,
    status da rota, responsavel pela rota, incluido por, periodo da data
    prevista (de/ate); "Limpar filtros";
  - cada card expandido mostra status da rota, responsavel, sequencia,
    incluido por + data/hora de inclusao, e botao "Abrir rota" (reusa
    `abrirRotaPeloMeuDia`, mesmo padrao ja usado pelo Meu Dia);
  - acesso restrito a admin (confirmado com o usuario): guarda em
    `abrirPesquisaRotas()` e no render condicional; botao "Pesquisar
    rotas" aparece no Meu Dia (`MeuDia.jsx`, ao lado de "Ver todas as
    rotas", tambem admin-only) e no Dashboard (grupo "Rotas",
    `App.jsx`/`home.css` `.dashboard-grupo-topo`);
  - `"pesquisaRotas"` adicionado a `TELAS_PERSISTIDAS` (`App.jsx`) para
    manter o comportamento padrao de voltar do navegador/persistencia
    entre as demais telas;
  - sem paginacao server-side nesta v1 - lista vem toda da memoria; se o
    volume crescer muito pode precisar de ajuste futuro;
  - validado com Playwright (usuario demo): entrada pelo Meu Dia e pelo
    Dashboard, filtro por status do cliente, card expandido conferindo
    "incluido por" de um usuario diferente do responsavel pela rota
    (cenario real que motivou a feature), clique em "Abrir rota", desktop
    e mobile. Dados de teste inseridos via REST e removidos ao final.

- [Redesenho em 2026-08-14] Filtros reorganizados + campos novos +
  impressao (lista filtrada e roteiro de rota):
  - motivacao: usuario relatou que a tela "nao parece atender bem com os
    filtros" - esclarecido via perguntas que o problema era usabilidade
    (muitos campos sempre visiveis) e falta de campos (cidade/UF, nome da
    rota, atalhos de periodo); pediu tambem um "imprimir para gerar PDF";
  - `FILTROS_PESQUISA_ROTAS_INICIAIS` (`App.jsx`) ganhou `cidade` e
    `nomeRota`; `RotasPesquisa.jsx` reorganizado em duas camadas: "busca
    rapida" sempre visivel (texto livre + botoes de atalho "Hoje"/"Esta
    semana"/"Este mes" que preenchem `dataInicio`/`dataFim` via
    `calcularPeriodoPreset()` em `App.jsx` + botao "Imprimir lista") e um
    painel `<details className="pesquisa-rotas-filtros-avancados">`
    recolhivel com os demais 8 campos (status cliente/rota, responsavel,
    incluido por, cidade/UF, nome da rota, datas manuais, limpar filtros),
    com badge mostrando quantos desses estao ativos mesmo fechado
    (`contarFiltrosAvancadosAtivos`);
  - filtro "Cidade/UF" busca em `cliente.cidade + cliente.uf` (texto
    solto, ex.: buscar so "SC" pega todo mundo de Santa Catarina); filtro
    "Nome da rota" busca em `rota.nome` - ambos independentes do campo de
    busca livre (que continua buscando cliente/codigo/cidade/rota junto);
  - impressao usa a API nativa `window.print()` do navegador (sem
    biblioteca de PDF nova) - o dialogo de impressao do proprio sistema ja
    oferece "Salvar como PDF" como destino, que era o pedido original;
  - novo estado `impressaoAtiva` (`App.jsx`) guarda o que deve ser
    impresso (`{tipo:"lista", linhas, resumoFiltros}` ou
    `{tipo:"roteiro", rota, clientes}`); `dispararImpressao(dados)` seta o
    estado, adiciona a classe `modo-impressao` no `<body>` e chama
    `window.print()` num `requestAnimationFrame` (pra garantir que o React
    ja renderizou o conteudo antes do navegador abrir o dialogo); um
    listener de `window.addEventListener("afterprint", ...)` limpa o
    estado e a classe quando o usuario fecha o dialogo;
  - `imprimirListaPesquisaRotas(linhas, resumoFiltros)`: recebe a lista ja
    filtrada de dentro de `RotasPesquisa.jsx` (via prop `imprimirLista`,
    chamada com `linhasFiltradas` do proprio `useMemo` do componente, sem
    duplicar a logica de filtro em `App.jsx`) e um resumo textual dos
    filtros ativos (`montarResumoFiltros()`, dentro de
    `RotasPesquisa.jsx`); recusa com alerta se a lista estiver vazia;
  - `imprimirRoteiroRota(rota)`: reaproveita `linhasPesquisaRotas` (ja
    carregado, sem query nova), filtra por `rota_id` e ordena por
    `sequencia` - roteiro pensado pro tecnico levar impresso (endereco
    completo, telefone, data/hora prevista, motivo se cancelado);
  - `carregarRotas()` (`App.jsx`) ampliou o `select` de `rota_clientes`
    para incluir `motivo_cancelamento` (faltava ali; ja existia no
    `select("*")` usado ao abrir uma rota especifica e no Historico do
    Cliente) - necessario pro roteiro impresso mostrar o motivo;
  - novo componente `src/ImpressaoPesquisaRotas.jsx` +
    `src/impressao-pesquisa-rotas.css`: renderiza os dois tipos de
    relatorio dentro de uma `<div className="area-impressao">` sempre
    presente no fim do JSX de `App.jsx` (dentro de `.app`, so quando
    `impressaoAtiva` existe) - fica invisivel (`display:none`) fora de
    impressao; regra `@media print` com `body.modo-impressao .app > *:not(.area-impressao)
    { display:none }` esconde cabecalho/sidebar/conteudo normal e mostra
    so o relatorio;
  - dois bugs de CSS encontrados e corrigidos durante o QA visual:
    (1) `.app` tem `padding: 132px 30px 48px 310px` no desktop (espaco
    reservado pro header fixo + sidebar) que continuava sendo aplicado
    mesmo com os irmaos escondidos, empurrando o relatorio pra baixo/direita
    com fundo azul claro do app around - corrigido com
    `body.modo-impressao .app { padding:0 !important; background:#fff
    !important }`; (2) todo o texto do relatorio saia centralizado (herdava
    `text-align:center` de uma regra legada em `App.css`, tipo boilerplate
    antigo de Create React App) - corrigido com `text-align:left` explicito
    em `.area-impressao`;
  - nota tecnica de QA: `window.print()` clicado via Playwright real
    (`.click()`, evento "trusted") se comportou de forma inconsistente no
    Chromium headless (a chamada real parece disparar `afterprint` quase
    instantaneamente, limpando o estado antes de dar pra conferir); QA
    visual do layout de impressao foi feito com `window.print` stubado
    (`page.addInitScript(() => { window.print = () => {} })`) so no
    contexto de teste - nao afeta o comportamento real do app, onde
    `window.print()` abre o dialogo nativo do sistema operacional e so
    dispara `afterprint` quando o usuario fecha esse dialogo;
  - responsividade mobile: bug encontrado e corrigido - o campo de busca
    (`input[type="text"]` com `flex: 1 1 260px` pensado pro layout em
    linha do desktop) virava uma caixa gigante (~260px de altura) quando
    o container trocava pra `flex-direction:column` no mobile, porque
    `flex-basis` passou a controlar a altura (eixo principal) em vez da
    largura; corrigido com `flex:none; height:44px` especifico dentro do
    `@media (max-width:700px)`;
  - validado com Playwright (usuario demo, dados reais, sem inserir nada
    no Supabase): atalhos de periodo (conferido "Esta semana" preenchendo
    as duas datas corretamente), filtro cidade/UF, filtro nome da rota,
    "Limpar filtros", contador de resultados mudando a cada filtro,
    conteudo e formatacao dos dois relatorios impressos (lista com 15
    linhas reais e tabela completa, roteiro de uma rota real com 3
    clientes, endereco e datas corretas), desktop (1366px) e mobile
    (390px, incluindo o painel de filtros avancados e os dois botoes
    "Abrir rota"/"Imprimir roteiro" empilhados no card);
  - `lint`/`build` sem erros; `MANUAL_USUARIO.md` (secao 17) reescrita
    para descrever a busca rapida, o painel "Mais filtros" e os dois
    botoes de impressao.

- [Ajuste em 2026-08-14] Sugestao de nome de rota + relatorios com
  identidade visual Phenix:
  - feedback do usuario logo apos usar a v1 dos relatorios impressos: (1)
    o campo "Nome da rota" deveria sugerir rotas ja existentes ao digitar;
    (2) o leiaute da impressao estava "longe de um leiaute decente e
    padrao da Phenix que ja temos";
  - investigacao (agente Explore) confirmou que nao havia nenhum
    relatorio/PDF anterior no projeto pra reaproveitar - nem o Excel de
    importacao de clientes (`XLSX.utils.book_new()` em `App.jsx`, puramente
    tabular, sem marca) nem a Promocao Veste Phenix tem identidade visual
    de documento; o "padrao Phenix" que o usuario tinha em mente e o
    proprio cabecalho do app (`.home-topo` em `src/home.css:10-20`):
    gradiente `linear-gradient(135deg, #032b63, #0057d8)`, `border-radius:
    28px`, logo oficial branca hotlinkada
    (`https://phenixonline.com.br/wp-content/uploads/2021/05/Logo-Branco-1.png`,
    mesma usada no icone do PWA) e acento laranja (`#ea580c`/`#f97316`)
    usado em detalhes pontuais;
  - `RotasPesquisa.jsx`: novo `nomesRotasSugeridos` (`useMemo`, nomes
    unicos de `linha.rota.nome` a partir de `linhas` - a lista completa,
    nao a filtrada, pra sugestao nao encolher conforme o usuario digita);
    campo "Nome da rota" ganhou `list="pesquisa-rotas-sugestoes-nome-rota"`
    ligado a um `<datalist>` com essas opcoes - autocomplete nativo do
    navegador, sem biblioteca nova;
  - `ImpressaoPesquisaRotas.jsx` reescrito: novo `CabecalhoImpressao`
    (componente interno compartilhado pelos dois tipos de relatorio) com
    logo Phenix + faixa gradiente azul (replica `.home-topo`, em versao
    compacta de cabecalho de documento em vez de hero da tela inicial);
    status (Visitado/Cancelado/Pendente) agora aparece colorido (verde/
    vermelho/laranja, mesma paleta do `badge-status-rota` do resto do
    app) em vez de texto simples; roteiro ganhou numeracao em circulo
    laranja (`#ea580c`) por parada, reforcando o acento de marca; rodape
    fixo "Radar de Clientes Phenix · Relatorio gerado automaticamente"
    nos dois relatorios;
  - `impressao-pesquisa-rotas.css`: `-webkit-print-color-adjust: exact` /
    `print-color-adjust: exact` adicionados (sem isso, muitos navegadores
    omitem cores de fundo na impressao por padrao, o que apagaria o
    gradiente da faixa); linha divisoria laranja (`border-bottom: 2px
    solid #ea580c`) entre o cabecalho e o corpo do relatorio; tabela com
    linhas zebradas (`tbody tr:nth-child(even)`) pra facilitar leitura de
    listas longas;
  - validado com Playwright (mesmo metodo da v1, `window.print` anulado
    so no contexto de teste pra poder inspecionar o layout - ver nota na
    entrada anterior): datalist do nome da rota retornou os 3 nomes reais
    de rota existentes na base; os dois relatorios renderizaram com a
    faixa azul/logo/acento laranja, status coloridos corretamente
    (verde/laranja/vermelho batendo com o status real de cada linha) e
    numeracao laranja no roteiro;
  - `lint`/`build` sem erros; `MANUAL_USUARIO.md` (secao 17, itens 3 e 9,
    e o paragrafo final) atualizado para mencionar a sugestao de nomes de
    rota e o cabecalho de marca nos relatorios.

- [Ajuste em 2026-08-18] Impressao da Pesquisa de Rotas restrita a paleta
  Phenix:
  - removidos os acentos laranja e as cores verde/vermelha dos status no
    modelo impresso;
  - divisor, numeracao do roteiro, status e motivo de cancelamento passaram
    a usar azul Phenix (`#0057d8`), azul profundo (`#032b63`) e tons neutros.

## Agenda do Tecnico (feed .ics)

- [Concluido em 2026-08-13] Feed de calendario pessoal (.ics) por usuario:
  - motivacao: usuario perguntou se dava para vincular a data/hora prevista
    de cada rota a agenda (Google Calendar/Outlook) do tecnico usando o
    email ja cadastrado - conclusao da conversa: nao da para escrever
    direto na agenda de alguem so com o email (exige OAuth do proprio
    usuario ou dominio Google Workspace administrado), entao a solucao
    adotada foi um feed `.ics` proprio, combinando assinatura automatica
    (fora do nosso controle, tipicamente 12-24h de atraso) com um botao de
    atualizacao manual imediata usando o mesmo link;
  - migration `20260813120000_perfis_calendario_token.sql` adiciona
    `public.perfis.calendario_token uuid` (aleatorio, indice unico) -
    token secreto por usuario, usado como autenticacao do feed via query
    string (sem exigir login do Google, ja que o poller do Google Calendar
    nao envia header de autenticacao);
  - nova Edge Function `supabase/functions/agenda-tecnico-ics` (`verify_jwt
    = false`, mesmo padrao ja usado em `inscrever-veste-phenix`): recebe
    `?token=...`, resolve o usuario pelo `calendario_token`, busca as
    rotas onde ele e `usuario_responsavel` e monta o `.ics` com as visitas
    (`rota_clientes`) com `data_prevista_visita` entre 7 dias atras e 90
    dias a frente; nao ha campo de "data de fechamento" da rota no schema,
    entao a janela de datas da visita (nao o status da rota) e o que
    decide o que entra no feed;
  - cada visita gera um `VEVENT` com `UID` estavel
    (`rota-cliente-<id>@radar-clientes`) - reimportar o arquivo atualiza o
    evento existente em vez de duplicar; visitas `CANCELADO` aparecem como
    `STATUS:CANCELLED` em vez de somem do feed; sem horario definido vira
    evento de dia inteiro; com horario, duracao padrao de 1h, convertendo
    de horario local (Brasil, UTC-3 fixo, sem horario de verao) para UTC;
  - `src/supabaseClient.js` passou a exportar `supabaseUrl` (antes so
    local) para montar a URL da function em outros arquivos;
  - `src/MeuDia.jsx` ganhou o botao "Atualizar agenda agora" (link direto
    para o `.ics`, com `download`) no toolbar, ao lado de "Ver todas as
    rotas"; estilos em `src/meu-dia.css`;
  - nova tela `src/MinhaAgenda.jsx` (+ `src/minha-agenda.css`), acessivel
    pelo menu lateral ("Minha agenda"): mostra o link de assinatura
    (`webcal://...`) com botao copiar, o link "Baixar agora" e o botao
    "Gerar novo link" (regenera o token, invalidando o link anterior
    imediatamente - util se o link vazar);
  - `src/App.jsx` ganhou `regenerarTokenAgenda()` (atualiza
    `perfis.calendario_token` via `crypto.randomUUID()`, com confirmacao
    do usuario antes de invalidar o link atual) e monta a URL do feed a
    partir de `perfil.calendario_token`;
  - migration aplicada e function publicada no Supabase remoto via
    `supabase db push` / `supabase functions deploy agenda-tecnico-ics`
    (nao ha Docker local nesta maquina, entao nao e possivel rodar
    `supabase functions serve` localmente contra uma copia da base - o
    teste local roda contra o mesmo projeto remoto);
  - validacoes concluidas: `eslint` e `vite build` sem erros; logica pura
    de geracao do `.ics` (conversao de fuso, evento de dia inteiro,
    escaping de texto, janela de datas) testada isoladamente em Node antes
    do deploy; apos o deploy, testado via REST com o usuario demo
    (`CREDENCIAIS_TESTE_LOCAL.md`): token invalido retorna 404, feed vazio
    e valido sem rotas, e uma rota/visita de teste apareceu corretamente
    no `.ics` (horario convertido, escaping, `LOCATION` do endereco do
    cliente) - dados de teste (`ROTA DEMO TESTE AGENDA (apagar)`, id 22, e
    seu `rota_clientes` id 78) removidos do Supabase remoto ao final;
  - `MANUAL_USUARIO.md` atualizado (secao 4, item 16, e nova secao 18
    "Tela Minha Agenda").

- [Redesenho em 2026-08-13] Gerenciamento do link de agenda passou a ser
  admin-only:
  - motivacao: o usuario (admin) testou a v1 self-service e trouxe dois
    pontos - (1) queria ver a agenda de um tecnico especifico (ex.: Diego)
    na propria agenda pessoal, o que so era possivel se o proprio tecnico
    pegasse e repassasse o link (tela "Minha agenda" era self-service);
    (2) o item solto "Minha agenda" no menu lateral, disponivel pra
    qualquer perfil, nao fazia sentido no fluxo de trabalho - quem
    controla/distribui esse tipo de link e o admin, do mesmo jeito que ja
    controla o aviso de visita por WhatsApp;
  - removido: item de menu "Minha agenda" e a tela self-service
    (`telaAtual === "minhaAgenda"`), acessivel antes a qualquer perfil
    logado; removida tambem a funcao `regenerarTokenAgenda()` (ligada a
    `session.user.id`);
  - adicionado: a tela Administracao (`src/App.jsx`, lista de usuarios ja
    existente) ganhou uma acao "Agenda" por usuario (ao lado de
    "Editar"/"Atualizar senha"), abrindo um modal (mesmo padrao do modal
    de contatos WhatsApp ja usado no projeto) com o link daquele usuario
    especifico - copiar, baixar agora e gerar novo link;
  - `regenerarTokenAgendaUsuario(usuario)` substitui a funcao antiga,
    aceitando o usuario alvo (nao so o proprio logado), gated por
    `perfil?.tipo_perfil === "admin"`; se o alvo for o proprio admin
    logado, tambem atualiza o estado `perfil` para o botao "Atualizar
    agenda agora" (Meu Dia) refletir o novo token na hora, sem reload;
  - `src/MinhaAgenda.jsx` deixou de ser uma tela cheia (removido o
    cabeçalho `secao-contexto` e o wrapper `<section className="painel-admin">`)
    e virou um painel reutilizavel (`<div className="admin-bloco">`),
    reaproveitado dentro do novo modal;
  - `src/minha-agenda.css` ganhou as classes do modal
    (`.modal-agenda-usuario-overlay/-usuario/-usuario-cabecalho`),
    espelhando `.modal-contatos-whatsapp-*` (`src/clientes.css`);
    `src/admin.css` (`.admin-card-acoes-usuario button`) ganhou
    `display:inline-flex` + `gap` para o icone dos botoes de acao (Agenda
    inclusive) nao ficar colado no texto - mesmo ajuste que ja tinha sido
    necessario nos botoes do proprio `MinhaAgenda.jsx`;
  - o que NAO mudou: botao "Atualizar agenda agora" no Meu Dia continua
    disponivel pra qualquer perfil (self-download da propria agenda); a
    edge function `agenda-tecnico-ics` e a migration
    `perfis.calendario_token` nao mudaram - so a interface de
    gerenciamento trocou de dono; nao foi necessario nenhum deploy novo
    no Supabase;
  - validacoes concluidas: `eslint` e `vite build` sem erros; validado
    visualmente com Playwright (usuario demo admin): confirmado que
    "Minha agenda" sumiu do menu lateral, que o botao "Agenda" aparece em
    cada usuario da lista (inclusive um tecnico real, "Diego"), que o
    modal abre com o link correto daquele usuario e fecha ao clicar fora;
  - `MANUAL_USUARIO.md` atualizado: removida a secao 18 "Tela Minha
    Agenda" (renumerando "Governanca de documentacao" para 18); acao
    "Agenda" documentada dentro da secao 15.2 "Usuarios do sistema"; item
    16 da secao 4 (botao "Atualizar agenda agora") ajustado para apontar
    pra secao 15 em vez da secao removida.

- [Ajuste em 2026-08-13] Feed `.ics` sem limite de data + tecnico
  responsavel na descricao do evento:
  - pedido do usuario apos usar a v2 (admin-only): manter todo o
    historico de visitas no feed (nao so a janela de 7 dias atras/90 dias
    a frente usada na v1) e mostrar o tecnico dono da rota em cada evento,
    para identificar de quem e a visita quando o admin assina a agenda de
    mais de um usuario no proprio calendario;
  - `supabase/functions/agenda-tecnico-ics/index.ts`: removido o filtro
    `gte`/`lte` por `data_prevista_visita` (mantido apenas
    `not(..., "is", null)`, ja que uma visita sem data nao vira evento);
    removida a funcao `formatarDataIso`, que so servia para esse filtro;
    `montarEvento` ganhou o campo `tecnicoNome`, incluido na
    `DESCRIPTION` do evento (`Rota: ... \nTecnico responsavel: ...`) - o
    nome vem de `perfil.nome`, ja carregado ao resolver o token (todas as
    rotas do feed pertencem a esse mesmo usuario, entao nao precisou de
    query nova;
  - function reimplantada via `supabase functions deploy
    agenda-tecnico-ics` (sem migration, schema nao mudou);
  - validado via REST com o usuario demo: uma visita de teste datada de
    2025-01-15 (fora da antiga janela) apareceu no feed, com
    `DESCRIPTION` mostrando `Tecnico responsavel: Demo Teste`; dados de
    teste (`ROTA DEMO TESTE AGENDA HISTORICO (apagar)`, id 23, e seu
    `rota_clientes` id 79) removidos do Supabase remoto ao final;
  - `MANUAL_USUARIO.md` (secao 15.2, item 6 "Agenda") atualizado para
    refletir o historico completo e o nome do tecnico na descricao.

- [Concluido em 2026-08-13] Agenda geral (todos os tecnicos) para
  diretores:
  - pedido do usuario: manter as agendas individuais como estao, mas
    criar uma agenda unica que junte as visitas de todos os tecnicos, para
    diretores acompanharem tudo num lugar so (o nome do tecnico ja aparece
    na descricao de cada evento, entao ao ver o cliente ja sabem quem vai);
  - decisao de design: token proprio, independente de qualquer usuario -
    se reaproveitasse o `calendario_token` de um admin, regenerar o link
    pessoal desse admin quebraria tambem o link que os diretores usam;
  - migration `20260813180000_agenda_geral_token.sql`: tabela
    `public.configuracoes_agenda_geral`, linha unica (`id boolean primary
    key default true` com `check (id)`, garantindo 1 linha so), coluna
    `token uuid default gen_random_uuid()`; RLS restrita a admin
    (`radar_perfil_atual_tipo() = 'admin'`, mesmo padrao de
    `configuracoes_grupos`);
  - nova edge function `supabase/functions/agenda-geral-ics/index.ts`
    (`verify_jwt = false`, registrada em `config.toml`) - estrutura igual
    a `agenda-tecnico-ics` mas sem filtrar `rotas.usuario_responsavel`:
    busca todas as rotas + todos os `perfis` (mapa `user_id -> nome`) e
    resolve o tecnico responsavel de cada rota individualmente (nao um
    valor fixo, como no feed pessoal); mesmas regras ja validadas
    (historico completo, `STATUS:CANCELLED`, `UID` estavel);
  - `src/App.jsx`: estado `configuracaoAgendaGeral` (carregado junto com
    `carregarUsuariosPerfis` sempre que `perfil.tipo_perfil === "admin"`),
    `regenerarTokenAgendaGeral()` (mesmo padrao do regenerar por usuario,
    mas atualiza a linha unica da nova tabela), botao "Agenda geral (todos
    os tecnicos)" ao lado do titulo "Usuarios cadastrados" na tela
    Administracao, abrindo o mesmo modal (`.modal-agenda-usuario-*`)
    reaproveitando `<MinhaAgenda />`;
  - migration e function publicadas no Supabase remoto; validado via REST
    com o usuario demo: criadas 2 rotas de teste com responsaveis
    diferentes (Demo Teste e Diego), cada uma com 1 visita - o feed geral
    trouxe as duas juntas, cada uma com o nome de tecnico correto na
    descricao, junto com as rotas reais ja existentes no sistema (Nicholas,
    Diego); token invalido retornou 404; dados de teste (rotas id 25 e 26,
    `rota_clientes` id 83 e 84) removidos ao final;
  - validado visualmente com Playwright: botao aparece na tela
    Administracao, modal abre com o link certo, fecha ao clicar em
    Fechar;
  - `MANUAL_USUARIO.md` (secao 15.2, novo item 7 "Agenda geral") e este
    bloco documentam a feature.

- [Concluido em 2026-08-13] Menu suspenso nos botoes de Agenda +
  "Adicionar ao Google Calendar":
  - pedido do usuario: em vez do botao "Agenda" abrir sempre um modal
    inteiro, ele queria acoes rapidas direto no botao; tambem perguntou se
    dava pra ter um link que abre o Google Calendar ja com a tela de
    assinatura preenchida, em vez do usuario precisar copiar e colar
    manualmente em Configuracoes -> Outras agendas -> Por URL;
  - `src/lib/agendaLinks.js` (novo arquivo, para nao violar a regra de
    lint `react-refresh/only-export-components` ao exportar funcoes puras
    do mesmo arquivo de um componente): `urlWebcal(url)` (ja existia
    dentro de `MinhaAgenda.jsx`, so foi extraida) e
    `urlAdicionarGoogleCalendar(url)`, que monta
    `https://calendar.google.com/calendar/render?cid=<link-webcal-codificado>`
    - padrao nao documentado oficialmente pelo Google, mas usado ha anos
      por diversas ferramentas para abrir direto a tela "Adicionar esta
      agenda?"; funciona so no Google Calendar (Outlook/Apple Calendar
      continuam exigindo colar o link manualmente); se a pessoa ja tiver
      assinado antes, o Google reconhece a mesma URL e nao duplica;
  - correcao junto: `MinhaAgenda.jsx` tinha uma inconsistencia onde o
    campo exibia o link `webcal://` mas o botao "Copiar link" copiava a
    versao `https://` - agora os dois usam a mesma versao (`webcal://`);
  - `src/App.jsx`: os botoes "Agenda" (por usuario, na lista de
    Administracao) e "Agenda geral" deixaram de abrir o modal diretamente
    - agora abrem um menu suspenso (`menuAgendaAberto`, guardando o
      `user_id` ou o literal `"geral"`) com 5 acoes: Copiar link,
      Adicionar ao Google Calendar, Baixar agora, Ver painel completo
      (abre o modal de sempre, pra quem quiser a explicacao completa) e
      Gerar novo link;
    - fecha sozinho ao clicar fora (`useEffect` com listener de
      `mousedown` no documento, checando `data-menu-agenda-root`) ou ao
      copiar o link (mostra "Copiado!" por ~1.1s antes de fechar);
    - o modal (`MinhaAgenda.jsx` dentro de `.modal-agenda-usuario-*`)
      continua existindo, agora acessivel via "Ver painel completo";
  - `src/minha-agenda.css` ganhou `.menu-agenda-wrapper`/
    `.menu-agenda-dropdown`/`.menu-agenda-divisor`;
  - validacoes: `eslint`/`vite build` sem erros; validado com Playwright
    (contexto com permissao de clipboard concedida, necessaria em Chromium
    headless): menu abre com o link certo (conferido o `href` de "Adicionar
    ao Google Calendar" ja no formato `calendar.google.com/calendar/render?cid=...`),
    fecha ao clicar fora, "Copiar link" mostra "Copiado!" e fecha sozinho,
    "Ver painel completo" abre o modal existente corretamente.

- [Concluido em 2026-08-13] Menu suspenso tambem no botao "Atualizar
  agenda" do Meu Dia (self-service, mobile-friendly):
  - pedido do usuario apos usar a v3 (menu suspenso admin-only): notou que
    o menu suspenso com "Adicionar ao Google Calendar" so existia na tela
    Administracao - o proprio tecnico, logado com a conta dele, so tinha
    o botao antigo de baixar o `.ics`, sem acesso ao atalho de assinatura
    de um clique; pediu tambem atencao ao celular, ja que os tecnicos usam
    bastante nesse formato e um menu flutuante pequeno nao funciona bem
    ali;
  - discussao previa relevante: usuario relatou uma duplicacao de agenda
    no Google Calendar ao clicar em "Adicionar ao Google Calendar" para
    "Todos os tecnicos" que ele ja tinha antes - causa identificada (nao e
    bug do sistema): "baixar e importar" (snapshot estatico, sem memoria
    da origem) e "assinar por link" (`cid=`, com URL rastreada pelo
    Google) sao mecanismos independentes no Google Calendar - se a agenda
    anterior foi adicionada por importacao manual, o Google nao reconhece
    a nova assinatura como "a mesma", cria uma agenda separada e duplica
    os eventos; solucao e apagar a copia antiga (estatica) e manter so a
    assinatura nova (essa sim se atualiza sozinha) - nao ha correcao de
    codigo possivel para esse caso, e comportamento do proprio Google;
  - `src/MinhaAgenda.jsx` ganhou a prop `permiteRegenerar` (default
    `true`, para nao quebrar os usos existentes no admin) - quando
    `false`, esconde a secao "Gerar novo link"/aviso de troca de link,
    mantendo essa acao exclusiva do administrador mesmo dentro do painel
    completo;
  - `src/MeuDia.jsx` passou a gerenciar seu proprio menu suspenso local
    (`menuAgendaAberto`, `linkCopiado`, `painelCompletoAberto` - estado
    interno do componente, sem precisar subir pra `App.jsx`, diferente do
    padrao usado na Administracao que precisa lidar com uma lista de
    varios usuarios); importa `MinhaAgenda` e renderiza o modal
    "Como funciona?" diretamente, com `permiteRegenerar={false}`;
  - novo arquivo `src/lib/agendaLinks.js` reaproveitado (`urlWebcal`,
    `urlAdicionarGoogleCalendar`) - sem duplicar logica;
  - `src/meu-dia.css`: como o gatilho do menu agora fica dentro de um
    `<div className="menu-agenda-wrapper">` (e nao mais filho direto de
    `.meu-dia-controles`), os seletores `.meu-dia-controles > button/> a`
    (que usam combinador de filho direto) deixaram de alcancar o botao -
    adicionada a classe `.meu-dia-atualizar-agenda` como seletor
    explicito (nao dependente de posicao no DOM) com o mesmo visual, tanto
    no bloco desktop quanto no bloco mobile (`max-width: 900px`, incluindo
    a largura 100% do wrapper);
  - `src/minha-agenda.css`: nova classe `.menu-agenda-dropdown-mobile`
    (usada so no gatilho do Meu Dia, nao nos da Administracao) que, dentro
    de `@media (max-width: 900px)`, muda o menu de "caixinha flutuante
    ancorada no botao" para um painel fixo de largura cheia, ancorado na
    parte de baixo da tela (`position: fixed; left/right: 12px; bottom:
    12px`), com itens de toque maiores (`min-height: 46px`) - mais facil
    de usar com o polegar;
  - validado com Playwright em dois contextos (desktop 1366x900 e celular
    390x844, com permissao de clipboard concedida): no desktop, o menu
    abre encostado no botao com o link certo e o modal "Como funciona"
    abre sem o botao "Gerar novo link" (confirmado por contagem zero); no
    celular, o painel abre ancorado embaixo, cabe inteiro dentro dos
    390px de largura (bounding box conferida) e fecha sozinho apos copiar
    o link;
  - `MANUAL_USUARIO.md` (secao 4, item 16) atualizado para descrever o
    novo menu em vez do botao simples de download.

- [Simplificado em 2026-08-13] Removido "Baixar agora"/"Como funciona"
  dos menus de agenda; Meu Dia virou 2 botoes diretos (sem dropdown):
  - motivacao (feedback do usuario apos testar a v4): (1) bug visual real
    - no desktop, o botao "Atualizar agenda" do Meu Dia ficava menor que
      os vizinhos e com texto cortado; (2) o usuario relatou ter sofrido
      na pratica a duplicacao de agenda explicada na entrada anterior, e
      concluiu (corretamente) que manter "Baixar agora" convivendo com
      "Adicionar ao Google Calendar" so convida a esse problema de novo -
      pediu para tirar a opcao de baixar manualmente; (3) "Ver painel
      completo"/"Como funciona" foi considerado desnecessario, tambem
      removido; (4) reforcou a preocupacao com celular (uso principal dos
      tecnicos) ao pedir a troca do botao do Meu Dia;
  - causa raiz do bug do item (1): o gatilho do Meu Dia tinha virado filho
    de um novo `<div className="menu-agenda-wrapper">` (`display:
    inline-flex`, sem stretch de largura no eixo principal) em vez de
    filho direto de `.meu-dia-controles` (`display:flex;
    align-items:stretch` no eixo cruzado da coluna) - o botao parou de
    herdar o stretch de largura que os demais botoes do toolbar recebem,
    ficando estreito (shrink-to-fit) mesmo com CSS dedicado adicionado
    (`.meu-dia-atualizar-agenda`) tentando compensar;
  - correcao definitiva: em vez de tentar consertar o wrapper, o Meu Dia
    deixou de usar dropdown nesse ponto - agora sao 2 elementos (`button`
    "Copiar link da agenda" e `a` "Adicionar ao Google Calendar")
    filhos diretos de `.meu-dia-controles`, exatamente no padrao que ja
    funcionava antes de qualquer wrapper existir; resolve o bug por
    construcao e tambem simplifica a experiencia no celular (nada para
    abrir/rolar - os botoes ja aparecem direto no toolbar);
  - `src/App.jsx` e os dois menus suspensos da Administracao (por usuario
    e "Agenda geral") perderam as opcoes "Baixar agora" e "Ver painel
    completo", ficando com 3 itens: Copiar link / Adicionar ao Google
    Calendar / (divisor) / Gerar novo link;
  - como "Ver painel completo" foi removido de todo lugar, o modal e o
    componente que ele abria (`src/MinhaAgenda.jsx`, junto com os states
    `usuarioAgendaSelecionado`/`agendaGeralAberta` em `App.jsx` e
    `painelCompletoAberto` em `MeuDia.jsx` e as funcoes
    abrir/fechar correspondentes) ficaram sem nenhum uso -
    `src/MinhaAgenda.jsx` foi deletado e todo esse codigo morto removido,
    em vez de deixado inerte;
  - CSS morto removido de `src/minha-agenda.css` (`.minha-agenda-link`,
    `.minha-agenda-botao`, `.minha-agenda-aviso`, `.modal-agenda-usuario-*`,
    `.menu-agenda-dropdown-mobile`) e de `src/meu-dia.css`
    (`.meu-dia-atualizar-agenda` e a regra mobile do wrapper, que não são
    mais necessárias); `App.jsx` passou a importar `./minha-agenda.css`
    diretamente (antes vinha "de carona" via `MinhaAgenda.jsx`, que
    deixou de existir) - sem isso os dois dropdowns da Administracao
    ficariam sem estilo;
  - validado com Playwright: no desktop, os 4 botoes do toolbar do Meu Dia
    (Ver todas as rotas / Copiar link da agenda / Adicionar ao Google
    Calendar / Pesquisar rotas) saem com a mesma largura exata
    (`boundingBox` comparado, 361.28px os dois); no celular, os 2 botoes
    aparecem direto na tela sem precisar rolar; nos dois menus da
    Administracao, confirmado que restam exatamente 3 itens; "Copiar
    link" testado isoladamente (grava no clipboard e alterna o texto para
    "Link copiado!"/"Copiado!" corretamente - uma tentativa anterior com
    varias interacoes na mesma sessao de teste deu falso negativo por
    instabilidade do proprio script de teste, nao do app);
  - `MANUAL_USUARIO.md` (secao 4 item 16, secao 15.2 itens 6 e 7)
    atualizado para refletir os menus simplificados.

- [Redesenho em 2026-08-13] Toolbar do Meu Dia: "Pesquisar rotas" movido
  pro menu lateral + par de agenda compacto:
  - feedback do usuario apos ver o Meu Dia com 4 botoes grandes
    empilhados ("Ver todas as rotas", "Copiar link da agenda", "Adicionar
    ao Google Calendar", "Pesquisar rotas"): ficou desproporcional/pesado
    visualmente - pediu pra repensar tamanho e ate mover "Pesquisar
    rotas" pra fora dali;
  - `src/App.jsx`: novo item "Pesquisar rotas" no menu lateral
    (`desktop-sidebar-nav`), admin-only, logo antes de "Administracao",
    chamando a mesma `abrirPesquisaRotas()` que ja existia; removida a
    prop `abrirPesquisaRotas` passada pro `<MeuDia>` (não é mais
    necessária ali);
  - `src/MeuDia.jsx`: removido o botao "Pesquisar rotas" do toolbar
    (prop `abrirPesquisaRotas` tirada da assinatura do componente,
    import nao usado do icone `Search` removido); "Copiar link da
    agenda" e "Adicionar ao Google Calendar" passaram a ficar lado a
    lado dentro de um `<div className="meu-dia-agenda-secundaria">`, com
    estilo secundario/compacto (`.meu-dia-botao-secundario`: fundo azul
    claro, borda, texto azul, ~36px de altura) em vez do mesmo visual
    grande e solido do botao principal "Ver todas as rotas" - a ideia e
    sinalizar visualmente que sao acoes de configurar uma vez, nao acoes
    do dia a dia;
  - `src/meu-dia.css`: novas classes `.meu-dia-agenda-secundaria` (linha
    flex, 2 colunas) e `.meu-dia-botao-secundario`; como o wrapper e
    filho direto de `.meu-dia-controles` (flex-column com
    `align-items:stretch`), ele herda a largura total automaticamente,
    sem repetir o problema de stretch quebrado do ajuste anterior;
  - de quebra, os dois `window.confirm()` de "Gerar novo link"
    (`regenerarTokenAgendaUsuario` e `regenerarTokenAgendaGeral`, em
    `App.jsx`) ganharam um aviso explicito: como o token faz parte da
    propria URL, gerar um link novo cria uma agenda **separada** no
    Google de quem ja tinha assinado (a antiga so para de atualizar,
    nao e substituida) - quem regenera precisa avisar as pessoas a
    removerem a agenda antiga e assinarem a nova; motivado por uma
    pergunta direta do usuario sobre esse comportamento;
  - validado com Playwright: "Pesquisar rotas" some do toolbar do Meu
    Dia e aparece no menu lateral (contagem 0 e 1, respectivamente),
    clicar no item do menu abre a tela de Pesquisa de Rotas
    normalmente; capturas em desktop e celular confirmam o layout mais
    compacto (1 botao grande + par pequeno lado a lado, em vez de 4
    botoes grandes empilhados);
  - `MANUAL_USUARIO.md`: item "Pesquisar rotas" removido da lista de
    botoes do Meu Dia (renumerando os itens seguintes da secao 4, de 8-16
    para 7-15) e adicionado a "Menu lateral" (item 10); secao 17 (Tela
    Pesquisa de Rotas) atualizada quanto a onde o acesso aparece agora.

- [Ajuste em 2026-08-13] Reorganizacao do menu lateral + estilo dos
  botoes de agenda do Meu Dia (segunda rodada de feedback):
  - pedidos do usuario: (1) tirar o atalho "Pesquisar rotas" de dentro do
    Dashboard, ja redundante com o item novo no menu lateral; (2) mover
    "Pesquisar rotas" do menu lateral para logo abaixo de "Rotas" (estava
    perto de "Administracao", mais dificil de achar); (3) manter os
    botoes "Copiar link"/"Adicionar ao Google Calendar" do Meu Dia
    pequenos e lado a lado (isso ele aprovou), mas com o mesmo visual do
    botao "Ver todas as rotas" (fundo azul solido, texto branco) em vez
    do estilo secundario/claro que foi usado antes; (4) encurtar o texto
    "Google Calendar" para uma palavra so, pra caber sem precisar
    diminuir a fonte - perguntado ao usuario entre "Agenda"/"Google"/
    "Calendar" (essa ultima em ingles), escolhida "Agenda" por já ser o
    termo usado em todo o resto da funcionalidade;
  - `src/App.jsx`: removido o botao "Pesquisar rotas" de dentro do grupo
    "Rotas" no Dashboard (`dashboard-grupo-topo`); o item do menu lateral
    foi movido de perto de "Administracao" para logo depois do botao
    "Rotas";
  - `src/MeuDia.jsx`: texto do link mudou de "Google Calendar" para
    "Agenda" (mantendo o icone `CalendarPlus` e o `title` completo
    "Adicionar ao Google Calendar" no atributo, so o texto visivel
    encurtou);
  - `src/meu-dia.css`: `.meu-dia-botao-secundario` trocou de fundo claro
    com borda (`#eef5ff`/`#bfd0e4`) para fundo azul solido `#0057d8` com
    texto branco - mesma paleta do botao principal, so menor (`min-height:
    38px` em vez de `44px`, `font-size: 13px`);
  - validado com Playwright: ordem do menu lateral conferida via lista de
    textos (`Rotas` seguido imediatamente por `Pesquisar rotas`, depois
    `Dashboard`); confirmado que o grupo "Rotas" do Dashboard nao mostra
    mais o atalho (checagem escopada ao `.dashboard-grupo-topo`, ja que
    o texto "Pesquisar rotas" tambem existe no menu lateral, sempre
    presente na pagina); captura visual confirma os botoes menores no
    mesmo azul/branco do botao principal, com "Agenda" cabendo sem corte;
  - `MANUAL_USUARIO.md`: secao 8 (Dashboard) perdeu o item "Pesquisar
    rotas"; secao 4 item 15 atualizada com o novo texto/estilo dos
    botoes; secao 4 item 10 (Menu lateral) passou a listar a ordem real
    dos itens; secao 17 (Pesquisa de Rotas) atualizada removendo a
    mencao ao atalho do Dashboard.

- [Concluido em 2026-08-14] Status da visita (Pendente/Visitado/Cancelado)
  legivel nos eventos do feed .ics:
  - pergunta respondida antes da implementacao: usar "Copiar link" (colar
    manualmente) e depois tambem clicar em "Adicionar ao Google Calendar"
    NAO duplica, porque os dois botoes geram a mesma URL exata - o Google
    reconhece pela URL de origem e trata como a mesma assinatura (esse e
    o cenario oposto ao que causou a duplicacao registrada na entrada de
    2026-08-13, onde a mistura foi entre "baixar/importar" e "assinar",
    dois mecanismos diferentes usando o mesmo link);
  - pedido do usuario: ja existia `STATUS:CANCELLED` no `.ics` para
    visitas canceladas, mas isso e um campo estruturado que cada app de
    calendario interpreta (e mostra) de um jeito diferente, as vezes de
    forma sutil; o usuario queria texto explicito e visivel, e tambem
    queria distinguir "Visitado" (que antes nao tinha nenhuma marcacao
    diferente de "Pendente");
  - `supabase/functions/agenda-tecnico-ics/index.ts` e
    `supabase/functions/agenda-geral-ics/index.ts` (mesma mudanca nas
    duas, seguindo o padrao ja existente de duplicar as funcoes puras em
    vez de compartilhar codigo entre as duas functions): nova funcao
    `statusLegivel(status, visitado)` retornando "Cancelado"/"Visitado"/
    "Pendente" (cancelado tem prioridade sobre visitado; olha tanto a
    coluna `status` quanto o booleano `visitado`, replicando a mesma
    logica ja usada em `MeuDia.jsx` pra decidir se uma visita foi feita);
    `montarEvento` ganhou o campo `visitado` e passou a prefixar o
    `SUMMARY` com `[Visitado] `/`[Cancelado] ` (nada para Pendente, pra
    nao poluir o caso comum) e adicionar uma linha `Status: ...` na
    `DESCRIPTION`; a consulta a `rota_clientes` passou a selecionar
    tambem a coluna `visitado`;
  - como o feed e gerado na hora a cada acesso (nao e um snapshot),
    qualquer mudanca de status feita no Radar aparece automaticamente na
    proxima sincronizacao, sem precisar recriar o evento - so o texto do
    evento existente (mesmo `UID`) muda;
  - deploy: `supabase functions deploy` nas duas functions (sem
    migration, schema nao mudou - `visitado` ja existia em
    `rota_clientes`);
  - validado via REST com o usuario demo: uma rota de teste com 3
    visitas (pendente, visitada com `visitado=true`, cancelada) retornou
    o `.ics` com `SUMMARY` sem prefixo pra pendente, `[Visitado] ` pra
    visitada e `[Cancelado] ` pra cancelada, e a linha `Status: ...`
    correspondente em cada `DESCRIPTION`; dados de teste (`ROTA DEMO
    TESTE STATUS (apagar)`, id 27, `rota_clientes` id 85/86/87) removidos
    do Supabase remoto ao final;
  - `MANUAL_USUARIO.md` (secao 15.2, item 6) atualizado descrevendo o
    prefixo no titulo e a linha de status na descricao.

- [Corrigido em 2026-08-14] Cliente cancelado sumindo da assinatura do
  Google Calendar:
  - usuario reportou que, mesmo ao assinar a Agenda Geral (todos os
    tecnicos), um cliente cancelado no dia nao aparecia; investigado
    buscando o `.ics` bruto direto da function (via `curl` com o token
    real da `configuracoes_agenda_geral`) - o evento estava la, correto,
    com `SUMMARY:[Cancelado] ...` e `DTSTART` no dia certo, mas com
    `STATUS:CANCELLED`;
  - causa: `STATUS:CANCELLED` e um campo estruturado do padrao iCal que
    o Google Calendar (e a maioria dos apps de agenda) interpreta como
    "evento nao acontece" e simplesmente **oculta** de calendarios
    assinados, em vez de mostrar riscado como se poderia esperar - o
    prefixo `[Cancelado]` no titulo (da entrada anterior) ja bastava pra
    comunicar isso visualmente, entao nao havia motivo pra tambem usar o
    `STATUS:CANCELLED` estrutural;
  - `supabase/functions/agenda-geral-ics/index.ts` e
    `supabase/functions/agenda-tecnico-ics/index.ts`: `status` do VEVENT
    passou a ser sempre `CONFIRMED`, independente do status da visita;
  - deploy: `supabase functions deploy` nas duas functions (sem
    migration); validado buscando o `.ics` de novo apos o deploy e
    confirmando `STATUS:CONFIRMED` no evento cancelado;
  - explicado ao usuario que o Google Calendar nao tem botao de
    "atualizar agora" pra calendarios assinados por URL (nem web nem
    app) - o proprio Google decide quando vai buscar a atualizacao
    (historicamente horas, sem garantia documentada), e clicar de novo
    no link "Adicionar ao Google Calendar" so forca uma busca imediata
    se for uma assinatura nova (calendario ainda nao estava na lista);
    se ja estava assinado, o clique so reabre o que ja tinha em cache -
    e preciso remover a assinatura e adicionar de novo pra contar como
    nova.

- [Concluido neste bloco, 2026-08-14] Motivo do cancelamento (texto
  livre) na execucao da rota, refletido no calendario:
  - pedido do usuario: quando o tecnico clica em "Cancelar" durante a
    execucao da rota, o sistema deve perguntar o motivo em texto livre,
    e esse motivo deve aparecer tambem no calendario;
  - migration local
    `supabase/migrations/20260814120000_rota_clientes_motivo_cancelamento.sql`
    adiciona a coluna `motivo_cancelamento text` em `rota_clientes`;
  - `src/App.jsx` (`alterarStatusClienteRota`): quando o novo status e
    `CANCELADO`, pede o motivo via `window.prompt` (obrigatorio - `null`
    ou texto vazio cancela a operacao sem alterar nada); ao mudar para
    qualquer outro status, `motivo_cancelamento` volta pra `null`
    automaticamente (fica sempre coerente com o status atual). Essa
    funcao e compartilhada pelos dois lugares onde o tecnico pode marcar
    "Cancelado" - o botao do Cliente Atual em `RotasOperacao.jsx` e os
    botoes rapidos de status em `RotasManutencao.jsx` - entao a
    pergunta acontece nos dois fluxos sem duplicar codigo;
  - `src/RotasManutencao.jsx` passou a exibir o motivo (quando existe)
    abaixo do selo de status de cada cliente cancelado;
  - `supabase/functions/agenda-geral-ics/index.ts` e
    `supabase/functions/agenda-tecnico-ics/index.ts`: consulta a
    `rota_clientes` passou a selecionar tambem `motivo_cancelamento`;
    `montarEvento` acrescenta a linha `Motivo do cancelamento: ...` na
    `DESCRIPTION` quando o status e `CANCELADO` e ha motivo preenchido;
  - validado localmente com `npm run lint`, `npm run build` e
    `deno check` nas duas edge functions; [Atualizado] migration e deploy
    das duas functions foram aplicados no Supabase remoto e o commit
    (`58620ea`) foi enviado a `origin/main` ainda em 2026-08-14 - esta nota
    ficou desatualizada por nao ter sido revisada logo apos o envio
    (confirmado depois via `supabase migration list`/`functions list` e
    `git log origin/main`, todos batendo com o local).

## Histórico do Cliente

- [Concluído em 2026-08-14] Nova tela com linha do tempo por cliente
  (visitas + amostras):
  - motivação: o usuário pediu sugestões de evolução do Radar; entre as
    ideias guardadas em memória estava "histórico do cliente em linha do
    tempo" - antes de implementar, foi pedido um mockup visual (Artifact
    HTML, tema claro/escuro, cores/badges reaproveitados do app) para
    validação; aprovado com uma ressalva: a parte de amostras precisa
    continuar condicionada à mesma configuração por grupo que já controla
    o menu Amostras (`permite_menu_amostras`), não aparecer incondicional;
  - novo botão "Histórico" no card de cliente (`src/App.jsx`), ao lado de
    "Acomp." e "Amostras" - sempre visível (não depende de permissão),
    pois a parte de visitas é aberta a qualquer perfil;
  - `abrirHistoricoCliente(item)` (`src/App.jsx`): guarda o cliente em
    `clienteHistorico`, muda `telaAtual` para `"historicoCliente"` e, só
    se `permiteMenuAmostrasGrupoAtual` for verdadeiro, consulta amostras
    do cliente reaproveitando `montarConsultaAmostras({ cliente:
    item.codigo_cliente })` (mesma função/mesmo filtro `ilike` já usado
    pelo atalho "Amostras" do card) - resultado guardado em
    `amostrasHistoricoCliente`, separado do estado da tela Amostras para
    não interferir nos filtros de quem estiver navegando lá;
  - `eventosHistoricoCliente` (`useMemo`): combina, sem nenhuma consulta
    nova ao Supabase para visitas,
    `linhasPesquisaRotas` (já carregado para Meu Dia/Pesquisa de Rotas)
    filtrado por `cliente_id === clienteHistorico.id`, com as amostras
    carregadas; cada visita vira evento `visita`/`cancelamento`/`pendente`
    conforme `status`, cada amostra vira evento `amostra`; motivo do
    cancelamento (`rota_clientes.motivo_cancelamento`, ver seção anterior)
    incluído no evento quando existe; lista final ordenada por data
    (mais recente primeiro) e agrupada por mês na tela;
  - `carregarRotas()` (`App.jsx`) passou a selecionar também
    `motivo_cancelamento` no `select` de `rota_clientes` (faltava ali;
    já existia no `select("*")` usado ao abrir uma rota específica);
  - novo componente `src/HistoricoCliente.jsx` + `src/historico-cliente.css`:
    cabeçalho com nome/código/cidade do cliente, resumo em blocos (visitas
    realizadas, cancelamentos, amostras enviadas - só quando permitido -,
    última visita), filtros rápidos "Tudo/Visitas/Amostras" (chip "Amostras"
    só aparece se `permiteAmostras`), timeline com marcador de mês e
    cartões por evento; visitas reaproveitam a classe `badge-status-rota`
    já usada em Rotas/Manutenção/Pesquisa de Rotas (mesmas cores
    verde/vermelho/laranja); amostras reaproveitam a classe `amostra-origem`
    já usada na tela Amostras (`MANUAL`/`ACOMPANHAMENTO`) - nenhuma cor
    nova inventada para status já existentes, só um ponto roxo na timeline
    para diferenciar visualmente evento de amostra de evento de visita;
  - tela `"historicoCliente"` adicionada a `TELAS_PERSISTIDAS`
    especificamente para o botão "Voltar"/botão-voltar-do-navegador
    funcionar corretamente (sem isso, o histórico de navegação interno do
    app pula direto para Home em vez de voltar para Clientes, pois só
    telas em `TELAS_PERSISTIDAS` empilham estado no `window.history`);
    efeito colateral aceito: um F5 enquanto essa tela está aberta perde o
    cliente selecionado (não persistido) e mostra "Nenhum cliente
    selecionado" com um botão de volta para Clientes - mesma limitação já
    existente em filtros de outras telas (ex.: filtro de cliente da tela
    Amostras também não sobrevive a F5);
  - validado com Playwright (usuário demo, dados reais, sem inserir nada
    novo no Supabase): cliente com 13 amostras reais (mix
    MANUAL/ACOMPANHAMENTO, agrupamento por mês correto), cliente com uma
    visita `CANCELADO` real (badge vermelho, motivo ausente nesse caso
    específico não quebra o layout), estado vazio ("Nenhum evento
    encontrado"), filtro "Amostras", botão "Voltar" retornando
    corretamente para Clientes (confirma o ajuste de `TELAS_PERSISTIDAS`),
    desktop (1366px) e mobile (390px);
  - `lint`/`build` sem erros; `MANUAL_USUARIO.md` (seção 6, novo item 7)
    documenta o botão.

## Meu Dia

- [Correcao em 2026-08-13] Itens do menu lateral desktop cortados em
  notebooks (telas de altura menor):
  - usuario relatou que no notebook nao via o menu lateral inteiro;
  - causa: `.desktop-sidebar` (`src/home.css`, bloco `min-width: 901px`) e
    posicionado com `top`/`bottom` fixos (altura = viewport - 96px) mas
    sem `overflow-y`, entao quando os itens do nav nao cabem nessa altura
    (comum em notebooks com pouca altura efetiva de viewport, ex.: painel
    fisico 768px menos barra de tarefas/chrome do navegador), os ultimos
    botoes (ex.: Administracao) ficam renderizados abaixo da area visivel,
    sem barra de rolagem para alcanca-los; a versao mobile do mesmo menu
    (`.desktop-sidebar.menu-mobile-aberto`, bloco `max-width: 900px`) ja
    tinha `overflow-y: auto` - a versao desktop nunca ganhou o mesmo ajuste;
  - correcao: adicionado `overflow-y: auto` em `.desktop-sidebar` no bloco
    desktop tambem;
  - validado com Playwright em viewport de altura reduzida (1366x520):
    antes da correcao "Administracao" ficava fora da area visivel do
    container (bounding box abaixo dos 520px) sem conseguir rolar ate ele;
    depois da correcao, rolar o menu traz o item para dentro da area
    visivel normalmente;
  - `npm run lint` (aviso esperado de arquivo CSS sem config de lint,
    nao bloqueante) e `npm run build` executados com sucesso.

- [Correcao em 2026-08-05] Navegacao do menu sumia no mobile:
  - o menu lateral (`desktop-sidebar`) sempre foi exclusivo do desktop
    (`display: none` abaixo de 901px) e a tela Meu Dia nao tinha atalhos
    proprios para Clientes, Proximos, Amostras, Dashboard ou Administracao;
  - o botao Menu do cabecalho so aparecia fora da tela Meu Dia e apenas
    voltava para ela, entao ao chegar na Meu Dia no celular nao havia
    caminho de volta para as demais telas;
  - `src/App.jsx` ganhou o estado `menuMobileAberto`: na Meu Dia (mobile) o
    botao do cabecalho vira um atalho que abre o menu lateral como painel
    deslizante com fundo escurecido, fechando ao tocar fora ou ao escolher
    uma opcao; fora da Meu Dia o botao mantem o comportamento anterior;
  - `src/home.css` recebeu os estilos do painel deslizante, do fundo
    escurecido e do botao dedicado ao mobile; o desktop nao foi alterado;
  - validacao tecnica: `npm run lint` e `npm run build` executados com
    sucesso.

- [Ajuste em 2026-07-28] Resumo de clientes visitados por rota:
  - o painel passou a exibir as rotas ativas que possuem clientes visitados;
  - cada rota mostra responsavel, total de visitados e ate tres clientes;
  - o cabecalho da rota abre diretamente sua execucao;
  - o layout foi compactado para preservar a leitura no celular.
- [Concluido em 2026-07-23] A antiga Home de cartoes foi substituida pelo
  painel operacional Meu Dia.
- A funcionalidade foi isolada em `src/MeuDia.jsx`, com estilos proprios em
  `src/meu-dia.css`, evitando aumentar os arquivos visuais existentes.
- O item Inicio do menu lateral passou a se chamar Meu Dia.
- A tela apresenta saudacao, data, rotas ativas, clientes nas rotas, visitados,
  pendentes, rota prioritaria, progresso e acessos rapidos.
- Os dados sao vinculados ao `session.user.id`: somente rotas atribuidas ao
  usuario autenticado aparecem no Meu Dia, inclusive para administradores.
- A prioridade das rotas e EM_ANDAMENTO, ABERTA e FECHADA; rotas FINALIZADAS
  ficam fora do resumo ativo.
- O layout usa grade ampla no desktop e reorganizacao em coluna no celular,
  com indicadores em duas colunas e botoes adequados para toque.
- Backup anterior: `.codex-backups/20260723_220500_meu_dia`.
- `MANUAL_USUARIO.md` foi atualizado com regras, areas e botoes da nova tela.
- Validacao tecnica: `npm.cmd run lint`, `npm.cmd run build` e
  `git diff --check` executados com sucesso; permanece apenas o aviso
  nao bloqueante de chunk JavaScript acima de 500 kB.
- [Ajuste mobile em 2026-07-23] A grade de indicadores do Meu Dia foi mantida
  em duas colunas inclusive em celulares estreitos. Cards, icones, textos e
  saudacao foram compactados para reduzir rolagem vertical.
- Backup anterior ao ajuste: `.codex-backups/20260723_223500_meu_dia_mobile`.
- [Ajuste de alinhamento mobile em 2026-07-23] Os indicadores passaram a usar
  colunas internas fixas para icone e conteudo. Titulos e valores agora ficam
  alinhados pela esquerda na mesma posicao, independentemente do tamanho do
  rotulo.
- Backup anterior: `.codex-backups/20260723_224500_meu_dia_alinhamento`.
- [Concluido em 2026-07-23] Supervisao do Meu Dia por administradores:
  - `App.jsx` mantem a selecao do usuario supervisionado durante a sessao;
  - administradores podem escolher qualquer perfil ativo ou Toda a equipe;
  - a selecao recalcula rotas, indicadores, prioridade e pendencias;
  - usuarios comuns continuam limitados ao proprio `session.user.id`;
  - o seletor fica ao lado das acoes no desktop e ocupa largura total no
    celular;
  - backup anterior:
    `.codex-backups/20260723_230500_meu_dia_admin`.
- [Correcao em 2026-07-23] Abertura de rota pelo Meu Dia:
  - o atalho agora define explicitamente `radarClientes:modoTelaRota` como
    `execucao` antes de abrir a rota;
  - evita que o modo persistido `lista` mostre somente topo e historico,
    ocultando cliente atual e proximos clientes;
  - backup anterior:
    `.codex-backups/20260723_233000_meu_dia_abrir_rota`.
- [Concluido em 2026-07-23] Data prevista por cliente da rota:
  - migration
    `20260723235000_rota_clientes_data_prevista_visita.sql` adiciona
    `public.rota_clientes.data_prevista_visita date` e indice por data/status;
  - migration aplicada com sucesso no Supabase remoto vinculado;
  - `RotasPlanejamento.jsx` permite definir ou limpar a data de cada cliente;
  - rotas finalizadas exibem o campo bloqueado;
  - `App.jsx` carrega os itens agendados junto ao resumo das rotas e mantem
    Meu Dia sincronizado apos alteracao;
  - `MeuDia.jsx` passou de resumo de rotas para agenda de clientes, com
    clientes para hoje, visitados, pendentes, atrasados, proximos e sem data;
  - visoes individual e Toda a equipe continuam disponiveis para admin;
  - layouts desktop e mobile foram atualizados;
  - validacoes concluidas: lint, build, `git diff --check`, servidor local e
    historico remoto de migrations;
  - backup anterior:
    `.codex-backups/20260723_235000_data_prevista_cliente`.
- [Correcao em 2026-07-24] Ajuste de consistencia na agenda do Meu Dia:
  - clientes de rotas FINALIZADA deixaram de aparecer na lista de hoje;
  - a tela passou a manter essa exclusao alinhada com as demais secoes da
    agenda;
  - o input de sequencia no planejamento teve o evento `onFocus` duplicado
    removido;
  - backup anterior:
    `.codex-backups/20260724_100837_riscos_meu_dia_planejamento`.
- [Correcao em 2026-07-24] Clientes proximos e busca de cidade:
  - clientes com UF `EX` deixaram de entrar no calculo de proximidade;
  - o modal de cidade passou a remover sugestoes duplicadas antes de renderizar;
  - backup anterior:
    `.codex-backups/20260724_101416_ex_uf_proximos_cidade`.
- [Ajuste em 2026-07-24] Busca de cidade ficou mais flexivel:
  - a consulta passou a normalizar acentos e pontuacao antes de procurar;
  - a lista agora mistura sugestoes vindas de cidades reais ja presentes nos
    clientes com o geocoding externo;
  - isso melhora casos como `parob` -> `Parobé` e `Novo H` -> `Novo Hamburgo`;
  - backup anterior:
    `.codex-backups/20260724_102842_busca_cidade_hibrida`.
- [Ajuste em 2026-07-24] Meu Dia trocou o indicador redundante:
  - o card `Pendentes hoje` passou a exibir `Visitas agendadas`;
  - a alteracao reduziu a repeticao de informacao no bloco de indicadores;
  - backup anterior:
    `.codex-backups/20260724_102912_visitas_agendadas_meu_dia`.
- [Ajuste em 2026-07-24] Visitas agendadas passaram a cobrir o futuro:
  - o card agora considera apenas visitas com data a partir de amanha;
  - a regra ficou alinhada com a ideia de proximos dias, sem incluir hoje;
  - backup anterior:
    `.codex-backups/20260724_103117_visitas_agendadas_amanha`.
- [Correcao em 2026-07-24] Página branca no Meu Dia:
  - o componente estava usando `proximos` antes da declaracao da constante;
  - isso gerava falha de montagem e tela em branco;
  - a ordem foi corrigida em `src/MeuDia.jsx`;
  - backup anterior:
    `.codex-backups/20260724_103117_visitas_agendadas_amanha`.
- [Concluido em 2026-07-24] Rotas abertas no Meu Dia:
  - a agenda de clientes passou a incluir uma secao complementar de rotas com
    status `ABERTA`;
  - na visao individual, lista somente rotas atribuidas ao usuario escolhido;
  - na opcao Toda a equipe, exibe consolidado por responsavel com quantidade
    de rotas, clientes e pendentes, seguido da lista de rotas;
  - cada item abre diretamente a rota no modo Execucao;
  - layout desktop usa coluna lateral e o mobile empilha resumo e lista;
  - backup anterior:
    `.codex-backups/20260724_001500_meu_dia_rotas_abertas`.
- [Concluido em 2026-07-24] Clareza da agenda do Meu Dia:
  - bloco redundante Acesso rapido foi removido, pois a navegacao ja existe no
    menu lateral;
  - o titulo generico Visitas prioritarias foi substituido por listas
    separadas de Clientes atrasados e Clientes agendados para hoje;
  - Clientes sem data ganharam uma lista propria com cliente, rota, cidade e
    sequencia, em vez de somente um contador;
  - Proximos dias continua exibindo visitas futuras;
  - desktop e mobile preservam a mesma ordem e significado das secoes;
  - backup anterior:
    `.codex-backups/20260724_004500_meu_dia_clareza`.
- [Concluido em 2026-07-24] Visao ampliada de Minhas rotas:
  - a antiga secao Rotas abertas passou a se chamar Minhas rotas;
  - inclui status `EM_ANDAMENTO`, `ABERTA` e `FECHADA`;
  - exclui apenas rotas `FINALIZADA` da visao operacional;
  - ordena primeiro EM_ANDAMENTO, depois ABERTA e FECHADA, usando pendencias
    como segundo criterio;
  - cada item passou a exibir o status da rota;
  - o consolidado de Toda a equipe segue a mesma regra ampliada;
  - backup anterior:
    `.codex-backups/20260724_011500_meu_dia_minhas_rotas`.
- [Concluido em 2026-07-24] Distancia rodoviaria em Clientes Proximos:
  - a formula Haversine permanece somente como pre-filtro invisivel;
  - candidatos em linha reta dentro do raio sao enviados ao Table Service do
    OSRM em lotes de ate 40 destinos;
  - o filtro final e a distancia rodoviaria menor ou igual ao raio solicitado;
  - cards exibem quilometros por estrada e duracao estimada;
  - a interface informa calculo em andamento, resultado sem transito em tempo
    real e falha do servico;
  - em caso de falha, a distancia em linha reta nao e exibida como substituta;
  - exemplo validado Parobe/Rondinha: 95 km em linha reta e aproximadamente
    152,6 km / 137 minutos por estrada;
  - CORS do servico validado para `http://localhost:5173`;
  - dependencia externa: servidor publico demonstrativo do OSRM, sem SLA;
  - backup anterior:
    `.codex-backups/20260724_014500_distancia_rodoviaria`.
- [Concluido em 2026-07-24] Carregamento de Clientes Proximos:
  - durante o calculo rodoviario, total e lista deixam de aparecer vazios;
  - painel visivel informa Aguarde, carregando clientes proximos;
  - spinner permanece animado durante as requisicoes;
  - quantidade processada e total sao atualizados ao final de cada lote;
  - barra visual acompanha o progresso;
  - mensagens de erro continuam separadas do estado de carregamento;
  - backup anterior:
    `.codex-backups/20260724_021500_loading_clientes_proximos`.

## Promocao Veste Phenix - 30 anos

- [Correcao em 2026-08-05] Apuracao pela Loteria Federal - bug e evolucoes
  (aplicadas no Supabase remoto via `supabase db push --linked`):
  - `apurar_veste_phenix` retornava erro `column reference "numero_sorte"
    is ambiguous`: o `RETURNS TABLE` da funcao declarava uma saida
    `numero_sorte` que colidia com a coluna de mesmo nome usada sem
    qualificacao dentro da funcao; todas as referencias de coluna passaram
    a ser qualificadas (`t.numero_sorte`, `v.numero_sorte`);
    `20260805120000_apuracao_veste_phenix_correcao_e_reversao.sql`;
  - a mesma migration criou a reversao de apuracao de teste: a funcao
    passou a devolver tambem `apuracao_id`, e
    `reverter_apuracao_teste_veste_phenix(p_apuracao_id)` devolve a
    inscricao vencedora para `valida` e marca a apuracao como
    `revertida_em`/`revertida_por` (nunca apaga a linha, preservando a
    auditoria); so aceita reverter apuracao cuja vencedora seja
    `origem='formulario_teste'`;
  - `20260805130000_apuracao_veste_phenix_desempate_visivel.sql` passou a
    retornar tambem `criado_em` do vencedor e `total_empatados` (quantas
    inscricoes validas empataram na menor diferenca); o painel so exibe a
    data/hora de inscricao quando `total_empatados > 1`, deixando claro
    quando o criterio de desempate por data foi realmente necessario;
  - `20260805140000_apuracao_veste_phenix_bloqueia_duplicidade.sql`: cada
    clique em Realizar apuracao escolhia sempre a proxima melhor inscricao
    valida, entao cliques repetidos geravam varios contemplados ao mesmo
    tempo; a funcao passou a recusar uma nova apuracao enquanto ja existir
    uma inscricao com status `contemplada`;
  - `20260805150000_apuracao_veste_phenix_reverter_todos_teste.sql` criou
    `reverter_todos_contemplados_teste_veste_phenix()`, que reverte de uma
    vez todos os contemplados de teste ainda ativos (util tanto para
    destravar apos testes repetidos anteriores ao bloqueio de duplicidade
    quanto para quando o resultado ja saiu da tela, ex.: apos atualizar a
    pagina); mesma regra de nunca afetar inscricoes reais;
  - `src/PromocaoVestePhenix.jsx` ganhou os botoes "Reverter apuracao
    (teste)" (no card de resultado) e "Reverter todos os contemplados de
    teste" (bloco Manutencao de testes, acima de Limpar inscricoes de
    teste); Apuracao e Manutencao de testes subiram para o topo da pagina,
    antes do resumo/tabela de inscricoes;
  - `MANUAL_USUARIO.md` (secao 15.5) atualizado com os novos botoes e
    regras.
  - [Correcao em 2026-08-05] Limpar inscricoes de teste falhava com
    violacao de foreign key quando a inscricao apagada era vencedora de
    alguma apuracao (mesmo ja revertida), pois
    `promocao_veste_phenix_30_anos_apuracoes.vencedor_inscricao_id`
    bloqueava a exclusao:
    - a constraint passou a ser `on delete set null`, permitindo apagar a
      inscricao de teste sem apagar o registro de auditoria da apuracao;
    - para nao perder a rastreabilidade quando isso acontece, a apuracao
      passou a gravar copia do vencedor no momento da apuracao
      (`vencedor_nome_completo`, `vencedor_numero_sorte`, `vencedor_cpf`);
      o historico ja existente foi preenchido retroativamente antes da
      constraint mudar;
    - migration `20260805160000_apuracao_veste_phenix_preserva_auditoria_ao_limpar.sql`,
      aplicada no Supabase remoto.

- [Concluido em 2026-08-04] Inscricao publica, apuracao e painel admin:
  - a promocao vive no mesmo dominio do Radar, mas a inscricao publica NAO
    tem acesso monitorado/autenticado como o restante do sistema; o Supabase
    do projeto e usado somente para hospedar o cadastro das inscricoes;
  - a gravacao acontece exclusivamente pela Edge Function
    `supabase/functions/inscrever-veste-phenix`, que usa a service role e
    valida: maior de 18, aceite de regulamento e privacidade, formato de
    e-mail, CPF e CNPJ com digito verificador, janela oficial de inscricao
    (06 a 08/10/2026, exceto em modo teste) e a flag
    `PROMO_INSCRICOES_ATIVAS`;
  - `cpf` e unico na tabela (bloqueia segunda inscricao com erro 409); o
    `numero_sorte` e sorteado aleatoriamente entre 00000 e 99999, unico por
    inscricao;
  - apos o cadastro, o envio do e-mail de confirmacao ocorre em segundo
    plano e nunca bloqueia a resposta; o status fica em
    `email_status` (`pendente/enviando/enviado/falhou/aguardando_configuracao`);
  - toda alteracao na tabela e auditada automaticamente via trigger em
    `promocao_veste_phenix_30_anos_auditoria`;
  - `src/PromocaoVestePhenix.jsx` e o painel administrativo (item "Promocao
    30 anos" no menu), restrito ao perfil admin tanto no front quanto por
    RLS no banco; lista inscricoes, exporta Excel e executa a apuracao
    oficial pela funcao `apurar_veste_phenix` (menor diferenca absoluta
    para o numero sorteado, desempate pela inscricao valida mais antiga);
  - `limpar_testes_veste_phenix()` remove somente inscricoes de
    `origem='formulario_teste'` e e restrita a admin;
  - migrations locais: `20260804120000_veste_phenix_30_anos.sql`,
    `20260804163000_promocao_email_assincrono.sql` e
    `20260804173000_numero_sorte_aleatorio.sql`;
  - `MANUAL_USUARIO.md` atualizado com a secao 15.5 descrevendo a tela.

## Mudancas Locais Relevantes Identificadas

- Frontend:
  - `src/App.jsx`
  - `src/amostras.css`
  - `src/Rotas.jsx`
  - `src/RotasPlanejamento.jsx`
  - `src/RotasOperacao.jsx`
  - `src/admin.css`
  - `src/clientes.css`
  - `src/MeuDia.jsx` / `src/meu-dia.css`
  - `src/minha-agenda.css` (`src/MinhaAgenda.jsx` existiu brevemente nesta
    mesma sessao e foi removido apos os menus serem simplificados)
  - `src/lib/agendaLinks.js`
  - `src/supabaseClient.js`
  - `src/home.css`
  - `index.html` / `vite.config.js` / `package.json` (PWA)
  - `src/pwa-icon-source.png` e `public/pwa-*.png` /
    `public/maskable-icon-512x512.png` /
    `public/apple-touch-icon-180x180.png` (icones do PWA)
  - `src/HistoricoCliente.jsx` / `src/historico-cliente.css` (novo,
    tela "Historico do Cliente")
  - `src/ImpressaoPesquisaRotas.jsx` / `src/impressao-pesquisa-rotas.css`
    (novo, relatorios impressos da Pesquisa de Rotas)
  - `src/RotasPesquisa.jsx` / `src/rotas-pesquisa.css`
  - `MANUAL_USUARIO.md`
- Supabase:
  - `supabase/migrations/20260629190000_configuracoes_grupos_whatsapp_rotas.sql`
  - `supabase/migrations/20260629234500_configuracoes_grupos_menu_amostras.sql`
  - `supabase/migrations/20260813120000_perfis_calendario_token.sql`
  - `supabase/migrations/20260813180000_agenda_geral_token.sql`
  - `supabase/functions/agenda-tecnico-ics/`
  - `supabase/functions/agenda-geral-ics/`
  - `supabase/config.toml`

## Proximo Foco Sugerido

- [Concluido em 2026-07-14] Integracao da tela Amostras com acompanhamentos GEACOMP:
  - migration remota `20260714000100_amostras_phenix_geacomp.sql` adiciona chave/ID de origem, sequencia, status, comprimento, largura e modelo concorrente
  - `src/App.jsx` passou a ler os novos campos da `public.amostras_phenix`
  - a listagem comum mostra cadastros manuais (`status_geacomp` nulo) e acompanhamentos concluidos; registros `EM_ANALISE` e `IGNORADO` ficam fora da consulta e da contagem
  - a origem exibida e derivada sem nova coluna: chave GEACOMP preenchida = `ACOMPANHAMENTO`; chave nula = `MANUAL`
  - detalhes compactos incluem origem, chave/ID, sequencia, status, comprimento, largura e modelo concorrente
  - backup anterior ao frontend: `.codex-backups/20260714_180000_geacomp_radar`
  - validacao tecnica: `npm.cmd run lint` e `npm.cmd run build` executados com sucesso em 2026-07-14; permanece apenas o aviso nao bloqueante de chunk acima de 500 kB

- [Concluido neste bloco] Revisao de layout mobile:
  - `src/app-global.css` recebeu base responsiva para reduzir padding, evitar estouro horizontal e padronizar box sizing
  - `src/home.css` ganhou versao mobile do topo/home com logo, acoes e titulo em fluxo responsivo, alem de cards de menu e dashboard mais compactos
  - `src/clientes.css` ajustou busca, botoes e cards de clientes para listas mais leves no celular
  - `src/rotas.css` refinou cards de rotas, topo de rota aberta, barra de acoes, planejamento e operacao para evitar largura fixa/estouro em telas pequenas
  - `src/admin.css`, `src/amostras.css` e `src/login.css` receberam ajustes de padding, raio, grids e campos para melhorar leitura no celular
  - validacao tecnica: `npm.cmd run build` executado com sucesso em 2026-07-03
- [Concluido neste bloco] Ajuste de topo mobile e navegacao interna:
  - `src/App.jsx` passou a usar estado interno no `window.history` para que o botao voltar do navegador retorne para a tela anterior do Radar
  - `src/App.jsx` ganhou botao geral `Voltar` em telas internas, usando o historico interno quando disponivel e o menu como fallback
  - botao mobile de menu passou a usar icone `Menu` do `lucide-react`, deixando de depender de caractere textual
  - `src/home.css` voltou a exibir o usuario logado no topo mobile, com texto truncado para evitar quebra do layout
  - `src/app-global.css` recebeu estilos do botao geral de voltar
  - backup criado em `.codex-backups/20260703_092000_mobile_nav`
  - validacao tecnica: `npm.cmd run build` executado com sucesso em 2026-07-03
- [Concluido neste bloco] Revisao de layout desktop inspirada no portal anexado:
  - `src/App.jsx` ganhou menu lateral desktop persistente com atalhos para Inicio, Clientes, Proximos, Rotas, Dashboard, Amostras, Alterar senha e Administracao
  - `src/App.jsx` calcula iniciais do usuario logado para avatar visual no topo desktop
  - `src/home.css` passou a ter layout desktop com barra superior fixa azul, menu lateral branco, conteudo deslocado e dashboard/cards com aparencia de portal corporativo
  - `src/app-global.css` recebeu regras desktop para area central, paineis, margens, botao voltar e fundo da aplicacao
  - regras desktop ficam em `@media (min-width: 901px)` para preservar os ajustes mobile recentes
  - backup criado em `.codex-backups/20260703_094500_desktop_layout`
  - validacao tecnica: `npm.cmd run build` executado com sucesso em 2026-07-03
- [Concluido neste bloco] Correcao de identidade visual Phenix no desktop:
  - ajuste solicitado apos validacao visual: o anexo deve servir como referencia de estrutura, nao como copia de CSS/estilo
  - `src/home.css` recolocou identidade Phenix no desktop com azul institucional, acentos laranja, logo em destaque, sidebar propria e cards menos colados ao modelo externo
  - `src/app-global.css` ajustou fundo e paineis desktop para dialogar com a identidade do Radar/Phenix
  - regras permanecem restritas ao desktop para preservar os ajustes mobile
  - backup criado em `.codex-backups/20260703_101500_phenix_desktop_identity`
  - validacao tecnica: `npm.cmd run build` executado com sucesso em 2026-07-03
- [Concluido neste bloco] Ajuste do topo desktop para a identidade visual Phenix correta:
  - referencia visual validada pelo usuario: card azul Phenix com logo branco, usuario/perfil em branco e botoes contornados translucidos
  - `src/home.css` ajustou o header desktop para virar um bloco azul arredondado com logo Phenix sem fundo, titulo/subtitulo em branco e acoes no canto direito
  - `src/app-global.css` ajustou o respiro superior desktop para acomodar o header Phenix
  - sidebar desktop foi reposicionada para iniciar abaixo do novo bloco visual
  - backup criado em `.codex-backups/20260703_103500_phenix_brand_header`
  - validacao tecnica: `npm.cmd run build` executado com sucesso em 2026-07-03
- [Concluido neste bloco] Alinhamento do desktop ao layout enviado com identidade Phenix:
  - ajuste de direcao: manter o layout da captura enviada pelo usuario, aplicando a identidade visual Phenix dentro dele
  - `src/app-global.css` ajustou o canvas desktop para sidebar de 280px, area util iniciando em 310px e cards abaixo do header
  - `src/home.css` ajustou medidas do header Phenix, margem lateral, grid de cards, sidebar e espaçamentos para aproximar o layout da captura
  - backup criado em `.codex-backups/20260703_105500_match_phenix_layout`
  - validacao tecnica: `npm.cmd run build` executado com sucesso em 2026-07-03
- [Concluido neste bloco] Ajuste fino da sidebar desktop no estilo do anexo:
  - removido o texto "Portal comercial" da area de titulo da sidebar
  - estado ativo/hover dos botoes da sidebar deixou de usar destaque laranja e passou para azul escuro Phenix (`#032b63`)
  - backup criado em `.codex-backups/20260703_111500_desktop_sidebar_phenix`
  - validacao tecnica: `npm.cmd run build` executado com sucesso em 2026-07-03
- [Concluido neste bloco] Topo desktop em largura total:
  - ajuste solicitado: no desktop a parte superior deve ocupar a pagina inteira, com icone/logo da empresa bem a esquerda, titulo centralizado e usuario/botoes a direita
  - `src/home.css` mudou o header desktop de bloco dentro do conteudo para barra fixa full-width
  - `src/home.css` reposicionou a sidebar para iniciar abaixo do topo full-width
  - `src/app-global.css` reduziu o respiro superior do conteudo para a nova altura do header
  - backup criado em `.codex-backups/20260703_113000_full_width_desktop_header`
  - validacao tecnica: `npm.cmd run build` executado com sucesso em 2026-07-03
- [Concluido neste bloco] Nova area Amostras:
  - `src/App.jsx` ganhou tela `amostras`, persistida em `TELAS_PERSISTIDAS`, usando o cliente Supabase existente
  - consulta a tabela `public.amostras_phenix`, ordenando por `updated_at desc` e `id_amostra_oracle desc`
  - filtros por cliente, produto, fornecedor, maquina e tipo de amostra
  - lista responsiva com total encontrado, loading, erro e lista vazia
  - visualizacao refinada em 2026-07-10 para linhas compactas de largura total, com os principais dados visiveis e expansao `Ver detalhes` no proprio item
  - refinamento posterior removeu reticencias/cortes e manteve visiveis todos os dados operacionais, deixando no expansor apenas campos complementares e de auditoria
  - cabecalho final de cada linha: codigo e descricao da empresa em uma unica linha (reticencias apenas no nome quando necessario), codigo e produto na linha 2 e somente `#numero` no canto superior direito
  - resumo operacional em grade 3x2: `Tipo | Maquina | Fornecedor` e `Papel | Duracao | Gramatura`; posicao, espessura e CFM ficam no expansor
  - menu principal exibe Amostras somente para grupos liberados
  - cards de clientes exibem atalho Amostras para grupos liberados e abrem a tela com filtro inicial do cliente
  - painel administrativo ganhou configuracao de acesso a Amostras por grupo (`admin`, `tecnico`, `representante`)
  - `src/amostras.css` criado para estilos dedicados e `src/clientes.css` ajustado para comportar o novo botao no card
  - migration local `supabase/migrations/20260629234500_configuracoes_grupos_menu_amostras.sql` adiciona `permite_menu_amostras` em `configuracoes_grupos`
  - `MANUAL_USUARIO.md` atualizado com a nova tela e a regra administrativa
- [Concluido neste bloco] Configuracao de envio de WhatsApp nas rotas por grupo de usuario:
- [Concluido localmente] Contatos de empresas como origem do WhatsApp:
  - `clientes_contatos` vincula cada contato ao cliente por `codigo_cliente`, com chave composta `codigo_cliente + codigo_contato`
  - a migration `supabase/migrations/20260717113000_clientes_contatos_whatsapp.sql` cria tabela, chave estrangeira, validacao do numero, indice e RLS de leitura
  - o botao WhatsApp do card consulta os contatos sincronizados, descarta numeros invalidos e abre uma selecao com nome, cargo, setor e numero
  - os fluxos de Rotas (`Avisar proximo cliente`, `Primeiro aviso` e `Reenviar`) usam o mesmo seletor de `clientes_contatos`; nenhum deles usa mais diretamente `clientes.whatsapp` ou `clientes.telefone`
  - o RadarSync recebe os dados da view Oracle `EX_MW_VW_RADAR_CLIENTES_CONTATOS`, priorizando `CELULAR` e usando `FONE` como alternativa
  - corrigida a barra de acoes da execucao de rotas: controles permanecem alinhados no desktop, reorganizam em duas linhas em larguras intermediarias e empilham no celular
  - ao acessar `Rotas` pelo menu, a rota anteriormente aberta e sua busca sao limpas; o usuario retorna para a listagem de rotas cadastradas
  - a entrada na listagem foi centralizada em `abrirListaRotas`: menu lateral, card `Rotas` da tela inicial e indicadores do Dashboard limpam a selecao anterior; somente o clique explicito em uma rota do ranking abre diretamente seus detalhes
  - alteracoes visuais de Rotas devem ser conferidas antes da liberacao em notebook 14 polegadas (`1366x768`) e celular (breakpoint ate `500px`); o harness `visual-tests/rotas-cliente-atual.html` permite capturas headless com o CSS real
  - migration local `supabase/migrations/20260629190000_configuracoes_grupos_whatsapp_rotas.sql` criada com tabela `configuracoes_grupos`, seed de perfis (`admin`, `tecnico`, `representante`) e policies RLS
  - `src/App.jsx` agora carrega configuracao por grupo e aplica bloqueio funcional em `Avisar proximo cliente` e `Primeiro aviso/Reenviar aviso`
  - `src/App.jsx` ganhou painel administrativo para habilitar/desabilitar envio por grupo com salvar/recarregar
  - `src/Rotas.jsx`, `src/RotasOperacao.jsx` e `src/RotasPlanejamento.jsx` passaram a refletir a permissao com botoes desabilitados e aviso visual
  - `src/admin.css` ganhou estilos da secao de configuracao por grupo
  - `MANUAL_USUARIO.md` atualizado com a nova secao de administracao e regra de negocio por grupo
- [Concluido neste bloco] Ajuste da regra de visibilidade de clientes para perfil `representante`:
  - `src/App.jsx` agora consulta `clientes_representantes` por `codigo_representante`
  - consulta considera variantes do codigo do representante com e sem zeros a esquerda
  - consulta de `clientes` considera variantes do `codigo_cliente` com e sem zeros a esquerda
  - os `codigo_cliente` retornados sao deduplicados antes da consulta em `clientes`
  - representantes sem vinculos recebem lista vazia sem quebrar a tela
  - `clientes.codigo_representante` permanece no modelo e na importacao por compatibilidade
  - admin continua visualizando todos os clientes
- [Concluido e validado manualmente] Migration criada em `supabase/migrations/20260622234500_clientes_representantes_rls.sql`:
  - libera `select` em `clientes_representantes` para usuarios autenticados via RLS
  - permite representante ler vinculos da nova tabela pelo proprio `codigo_representante`
  - adiciona policy em `clientes` para leitura por vinculo em `clientes_representantes`
  - mantem compatibilidade com `clientes.codigo_representante`
  - validacao manual: login com usuario representante passou a trazer clientes
  - validacao manual: `select count` na tabela de vinculos retornou o mesmo total exibido no Radar
- [Concluido neste bloco] Endurecimento de validacoes e robustez do fluxo em `src/App.jsx`:
  - validacao de e-mail para cadastro/edicao de usuario
  - normalizacao de e-mail (trim + lowercase)
  - validacoes adicionais na alteracao de senha interna (minimo 6, senha diferente da atual)
  - protecao de estado com `try/finally` para evitar tela travada em "Alterando..."
  - limpeza de estado visual de senha provisoria ao limpar formulario
- Proximo passo recomendado:
  - [Concluido neste bloco] Modelo padrao para importacao manual de clientes no painel administrativo:
    - `src/App.jsx` ganhou geracao de `modelo_importacao_clientes_radar.xlsx` via `xlsx`
    - modelo usa as colunas que a importacao manual ja consome (`CD_EMPRESA`, `NOME_COMPLETO`, `FANTASIA`, endereco, contato, status e `CD_REPRESENTANT`)
    - arquivo gerado tem aba `CLIENTES` com exemplo preenchido e aba `INSTRUCOES`
    - painel administrativo agora exibe botao para baixar o modelo ao lado da selecao da planilha
    - `src/admin.css` recebeu estilos para os controles de importacao
  - [Concluido neste bloco] Ajuste do modelo/importacao manual para multiplos representantes:
    - modelo passou a incluir `CD_REPRESENTANTES` para informar mais de um representante no mesmo cliente
    - importacao manual deduplica e grava vinculos em `clientes_representantes`
    - `CD_REPRESENTANT` continua sendo usado como representante principal/compatibilidade em `clientes`
    - layout da area de importacao foi reorganizado em painel com acoes separadas
    - refinamento visual posterior alinhou a area administrativa a esquerda, exibiu metricas em blocos compactos e removeu o peso visual do card interno de importacao
    - migration local `supabase/migrations/20260624223500_clientes_representantes_admin_write.sql` libera escrita admin em `clientes_representantes`
  - [Concluido neste bloco] Primeiro fluxo de aviso de visita por WhatsApp em Rotas:
    - `src/App.jsx` ganhou montagem de mensagem padrao para visita programada na semana
    - barra de acoes da rota ganhou botao `Avisar clientes`, abrindo o WhatsApp do proximo cliente pendente sem aviso
    - aviso e registrado no item da rota com data, usuario e mensagem
    - telas de operacao/planejamento exibem selo para cliente ja avisado
    - migration local `supabase/migrations/20260624232000_rota_clientes_aviso_whatsapp.sql` adiciona campos de auditoria em `rota_clientes`
    - ajuste posterior removeu o nome da rota da mensagem, adicionou assinatura `Att, usuario - Phenix`, moveu o botao para painel proprio de comunicacao e evitou popup tecnico quando a migration ainda nao foi aplicada no remoto
    - migrations aplicadas no Supabase remoto via `supabase.cmd db push --linked`: RLS/vinculos de representantes, escrita admin em `clientes_representantes` e campos `aviso_whatsapp_*` em `rota_clientes`
  - [Concluido neste bloco] Evolucao do aviso WhatsApp com status e historico de eventos:
    - `src/App.jsx` passou a registrar status `ENVIADO_ABERTURA` ao abrir o WhatsApp, mantendo a regra atual de considerar abertura como envio
    - `src/App.jsx` passou a inserir historico por evento em `rota_clientes_whatsapp_historico` com rota, cliente, usuario, telefone, mensagem e horario
    - `src/App.jsx` manteve fallback amigavel para ambientes sem migration aplicada (sem travar fluxo do usuario)
    - migration local `supabase/migrations/20260624235500_rota_clientes_whatsapp_status_historico.sql` adiciona `aviso_whatsapp_status` em `rota_clientes` e cria tabela historica com RLS
    - migration aplicada com sucesso no Supabase remoto via `supabase db push --linked` apos ajustes de compatibilidade:
      - correcao de tipos de chave para `bigint` no historico (`rota_cliente_id`, `rota_id`, `cliente_id`)
      - policy passou a usar `public.radar_perfil_atual_tipo()` em vez de depender de `public.usuarios_perfis`
  - [Concluido neste bloco] Visualizacao de historico WhatsApp na tela de rota e ajuste de layout:
    - `src/App.jsx` passou a carregar historico da tabela `rota_clientes_whatsapp_historico` ao abrir rota
    - `src/App.jsx` agora mantem lista local de historico para refletir imediatamente novos envios na tela
    - `src/Rotas.jsx` ganhou painel `Historico de envios do WhatsApp` com data/hora, status, cliente e telefone
    - `src/RotasTopoDetalhe.jsx` recebeu container dedicado para o botao `Finalizar rota` quando status e `EM_ANDAMENTO`
    - `src/rotas.css` recebeu estilos do painel de historico e do botao/topo para evitar deslocamento visual
  - [Concluido neste bloco] Refinamento de usabilidade do fluxo WhatsApp e da tela em andamento:
    - `src/Rotas.jsx` trocou historico fixo em tela por botao `Ver historico` com popup/modal
    - `src/Rotas.jsx` moveu o botao `Finalizar rota` para painel abaixo da comunicacao
    - `src/App.jsx` ganhou funcao `reenviarAvisoWhatsAppCliente` para reenvio por item especifico da rota
    - `src/RotasOperacao.jsx` ganhou botao `Reenviar WhatsApp` nos cards de proximos clientes
    - `src/RotasPlanejamento.jsx` ganhou botao `Reenviar WhatsApp` na lista de clientes planejados
    - `src/rotas.css` recebeu estilos do modal de historico, botao secundario e botoes de reenvio
  - [Concluido neste bloco] Ajustes finos de layout limpo e regra de reenvio:
    - `src/Rotas.jsx` moveu o botao `Finalizar rota` para o fim do conteudo da rota, evitando deslocamento visual no topo
    - `src/RotasOperacao.jsx` agora so permite acionar `Reenviar WhatsApp` quando ja existe `aviso_whatsapp_em`
    - `src/RotasPlanejamento.jsx` agora so permite acionar `Reenviar WhatsApp` quando ja existe `aviso_whatsapp_em`
    - `src/rotas.css` suavizou o visual dos botoes de reenvio (estilo neutro com contorno) e ampliou a coluna de acoes no planejamento para evitar corte de texto
  - [Concluido neste bloco] Ajuste de usabilidade solicitado no fluxo de aviso/finalizacao:
    - `src/RotasOperacao.jsx` passou a exibir botao sempre habilitado com rotulo dinamico: `Primeiro aviso` ou `Reenviar aviso`
    - `src/RotasPlanejamento.jsx` passou a exibir botao sempre habilitado com rotulo dinamico: `Primeiro aviso` ou `Reenviar aviso`
    - `src/RotasBarraAcoes.jsx` passou a exibir `Finalizar rota` no mesmo bloco de acoes quando status e `FECHADA` ou `EM_ANDAMENTO`
    - `src/RotasPlanejamento.jsx` passou a exibir `Finalizar rota` no mesmo bloco principal onde fica `Fechar rota`
    - `src/Rotas.jsx` removeu `Finalizar rota` do rodape da tela para evitar deslocamento visual
  - [Concluido neste bloco] Documentacao de usuario por tela:
    - criado `MANUAL_USUARIO.md` com descricao completa de telas, botoes, funcoes e regras de negocio
    - manual definido como documento interno local (nao publicado online)
    - regra operacional adicionada para manter `MANUAL_USUARIO.md` sempre atualizado apos alteracoes funcionais bem-sucedidas
  - [Concluido neste bloco] Ajustes de robustez em `supabase/functions/criar-usuario/index.ts`:
    - validacao de JSON de entrada com retorno 400 em payload invalido
    - validacao de formato de e-mail
    - validacao de tipo de perfil permitido (`admin`, `tecnico`, `representante`)
    - correcao da validacao de `codigo_representante` para impedir vazio mascarado como `000000`
  - [Concluido neste bloco] Mensagens amigaveis para usuario final:
    - mapeamento de erros tecnicos de autenticacao no `src/App.jsx` para mensagens claras (login, recuperacao e troca de senha)
    - mapeamento de erros de criacao de usuario no `src/App.jsx` (e-mail duplicado, permissao, validacoes)
    - mensagens amigaveis na edge function `supabase/functions/criar-usuario/index.ts`
  - Status da validacao de cenarios do fluxo `criar-usuario`:
    - cobertura de regras no codigo revisada para: sucesso, e-mail duplicado, representante sem codigo e usuario sem perfil admin
    - pendente apenas validacao E2E com ambiente Supabase autenticado (execucao real)
  - [Concluido em 2026-07-10] Menu lateral desktop ajustado para notebooks:
    - removido o titulo duplicado `Radar Clientes` do topo da barra lateral
    - reduzidos os espacamentos verticais para manter todas as opcoes visiveis em telas de menor altura
    - logo Phenix do cabecalho transformado em atalho acessivel para a pagina inicial
    - build de producao validado com sucesso (`npm.cmd run build`)
  - [Concluido em 2026-07-10] Cards da visao de clientes compactados:
    - card fechado exibe nome em tamanho reduzido, codigo, cidade, distancia e endereco compacto
    - controle `Ver detalhes` expande telefone, WhatsApp, representante, tipo, prioridade e status
    - acoes `Waze`, `WhatsApp`, `Acomp.` e `Amostras` permanecem visiveis em uma unica linha de botoes pequenos no desktop
    - no mobile, as acoes sao exibidas em duas colunas (dois botoes por linha)
    - removida regra conflitante de telas ate 380px que voltava as acoes para uma coluna; botoes mobile reduzidos para 34px de altura
  - [Concluido em 2026-07-10] Dashboard redefinido em formato compacto:
    - indicadores horizontais com icones de 30px, rotulo e numero na mesma faixa
    - cinco indicadores por linha no desktop, tres em larguras intermediarias e dois no mobile
    - ranking e rotas pendentes reorganizados em listas menores dentro de paineis discretos
    - build e lint validados
    - tipografia, espacamentos, bordas e sombra suavizados sem remover dados
    - layout mobile mantido em coluna e build de producao validado
  - [Local em 2026-08-18] Consulta de comissoes alinhada à decisão manual de devoluções:
    - somente tratamentos aceitos são sincronizados
    - estorno pago e comissão futura cancelada permanecem separados
    - ajuste de faixa é informativo e não é descontado novamente
    - alterações ainda não publicadas no ambiente oficial
  - [Local em 2026-08-18] Aba Comissões revisada em bloco extenso de trabalho (push NAO feito):
    - filtro da lista "a receber/pago" voltou a ser por `data_vencimento` (não
      `data_emissao`) - bate com a tela de lançamentos financeiros do
      MWComissoes; a visão por competência/emissão continua só no Histórico,
      que já vem pronta das views do Oracle
    - nova coluna "Mês origem" na lista "a receber", mostrando o mês de
      emissão da nota ao lado do vencimento
    - "Base válida após devoluções posteriores" (Histórico) ganhou
      expansível mostrando quais devoluções reduziram a base daquele mês,
      com NF de origem, data, valor e representante
    - menu "Comissões" restrito a `tipo_perfil === admin` (antes também
      aparecia para representante); acesso individual controlado por nova
      coluna `perfis.piloto_comissoes` (migration
      `20260818220000_perfis_piloto_comissoes.sql`), com checkbox de edição
      no painel Administração > Usuários do sistema
    - tentativa de "visualizar como" global no seletor "Meu Dia de" (admin
      assumiria 100% a visão de Clientes/Rotas/Comissões/menus do usuário
      selecionado) foi implementada e **revertida a pedido** - causou um bug
      real (clique em "Clientes" recarregava com o perfil do admin por cima
      da simulação) e o usuário preferiu manter o escopo do seletor restrito
      ao original (só filtra as rotas do Meu Dia); para testar direitos de
      representante, o combinado é logar de fato com a conta do
      representante, não simular
    - card financeiro novo no Meu Dia (`src/MinhaComissaoCard.jsx`), visível
      só para representante com `piloto_comissoes = true`: três gráficos
      lado a lado no topo da tela (Sua comissão, Faturamento, Comissões a
      receber), últimos 6 meses, com variação vs mês anterior e progresso até
      a próxima faixa de meta; "Comissões a receber" é calculado a partir de
      `comissoes_lancamentos` por `data_vencimento` no mês (não pago), igual
      à regra da aba principal - não é a diferença prevista/paga da
      competência
    - por decisão pontual, o card financeiro do Meu Dia passou a refletir o
      usuário escolhido no seletor "Meu Dia de" (`usuarioMeuDiaSelecionado`),
      diferente da simulação global revertida acima - essa é a única tela
      onde o admin "vendo como outro usuário" também troca o que aparece
    - depende de duas migrations locais aplicadas no Supabase real
      (`comissoes_representantes_consulta` e
      `comissoes_competencia_devolucao`, ambas de 18/08) e do MWComissoesSync
      (projeto novo, fora deste repo) sincronizar dados reais - ver
      `MWComissoesSync/MWCOMISSOESSYNC_ACOMPANHAMENTO.md`
    - pendente: rodar `014_revisado_radar.sql` (MWComissoes) e recriar a view
      `EX_MW_VW_RADAR_COMISSOES_LANC` no Oracle antes de qualquer dado real
      aparecer para o piloto; nada disso foi testado ao vivo em navegador
    - alterações ainda não publicadas no ambiente oficial (sem commit/push)

- [Concluído em 2026-08-25] Auditoria completa de segurança de dados (RLS/Supabase) e correção de falhas críticas:
  - Docker não está instalado nesta máquina, então `supabase db pull`/`db dump`/`db diff` (precisam de shadow DB via Docker) não funcionam; `supabase db query --linked` (via Management API), `supabase db advisors --linked`, `supabase functions download --use-api` e `supabase db push --linked` funcionam direto, sem Docker - usar esses a partir de agora para introspecção/deploy nesta máquina
  - achado crítico: tabela `clientes` tinha policy `clientes_select_anon_teste` liberando SELECT para o role `anon` (qualquer visitante da internet, sem login, lia a tabela inteira via REST) e policies antigas "true" para `authenticated` que anulavam a restrição de carteira do representante (`clientes_select_por_clientes_representantes`) e liberavam DELETE de qualquer cliente por qualquer usuário logado
  - achado crítico: tabela `perfis` liberava SELECT amplo (`true`) para todo `authenticated`, expondo a coluna `calendario_token` (segredo do feed `.ics` pessoal) de qualquer usuário para qualquer outro - um representante conseguia sequestrar a agenda de outro técnico/admin
  - causa raiz: `perfis`, `clientes`, `clientes_geolocalizacao`, `rotas`, `rota_clientes`, `visitas`, `importacoes`, `amostras_phenix` e a tabela legada `perfis_usuarios` foram criadas direto no Studio antes deste projeto adotar migrations versionadas - nenhuma migration do repo as criava, então as policies "libera tudo" nunca apareciam em revisão de código
  - correção aplicada e testada ao vivo (login como usuário demo rebaixado para representante, ver `CREDENCIAIS_TESTE_LOCAL.md`), migrations `20260825130000_seguranca_clientes_perfis_rls.sql` e `20260825140000_amostras_phenix_rls_por_grupo.sql`:
    - `calendario_token` isolado em tabela nova `perfis_tokens` (RLS: só o próprio dono ou admin leem; só admin atualiza); `src/App.jsx` (`carregarPerfil`, `carregarUsuariosPerfis`, `regenerarTokenAgendaUsuario`) e a function `agenda-tecnico-ics` atualizados e redeployados para ler/gravar na tabela nova
    - `clientes`: removidas as policies `clientes_select_anon_teste` (anon) e as duas `select true`/`delete true` soltas para authenticated; policy de select agora cobre `admin`/`tecnico` (acesso total, como sempre foi) e `representante` (só a própria carteira, como já era a intenção desde a migration de 22/06); DELETE agora exige admin
    - INSERT/UPDATE de `clientes` restringidos a admin em seguida (migration `20260825160000_clientes_insert_update_restringe_admin.sql`): checado o código e os dois únicos fluxos que escrevem em `clientes` (`importarPlanilha`, que apaga a base inteira e reinsere do Excel, e a atualização de coordenadas via geocodificação) já eram admin-only na tela - não existe cadastro/edição de cliente em campo por representante/técnico, então travar no banco não quebra nada
    - `amostras_phenix`: policy de select trocada de "true" para checar `configuracoes_grupos.permite_menu_amostras` do grupo do usuário (a flag só escondia o menu na UI antes; agora também é reforçada no banco)
    - `usuario_admin()` (lia a tabela legada `perfis_usuarios`, parada em 2 linhas desde sempre, sem trigger de sync com `perfis`) trocada por `radar_perfil_atual_tipo()` nas policies de escrita restrita a admin de `clientes`/`importacoes` - sem essa troca, qualquer admin criado depois da function `criar-usuario` ficaria bloqueado dessas ações assim que as policies soltas fossem removidas
  - migration `20260825150000_baseline_tabelas_pre_migrations.sql` criada para fechar a lacuna de auditoria: reconstrói `create table if not exists` + RLS + policies das 9 tabelas nunca antes versionadas, a partir do schema real do banco (idempotente, sem efeito em produção onde as tabelas já existem) - a partir de agora qualquer alteração nelas fica visível em revisão de código
  - validado com `curl` direto no REST (anon não lê mais `clientes`; representante rebaixado só vê a própria carteira, não lê token de outro usuário, não vê amostras do grupo sem a flag) e função `agenda-tecnico-ics` testada ponta a ponta (token válido → 200, token inválido → 404) após o redeploy
  - descoberta lateral: function `inscrever-veste-phenix` implantada em produção (versão 9, RPC `inscrever_veste_phenix_completo` de 10 números da sorte) estava à frente do código local (versão antiga de 1 número) - baixada com `supabase functions download --use-api` e commitada junto com a correção de segurança, a pedido do usuário. Function `geocodificar-clientes`, que rodava em produção sem nenhum arquivo correspondente no repo, também foi baixada e commitada - mas continua sem checagem de autorização própria no código (só depende do `verify_jwt` do projeto, não verifica admin/tipo de perfil); ainda vale revisar isso especificamente
  - pendente (registrado, não corrigido): CORS `Access-Control-Allow-Origin: '*'` em todas as Edge Functions, incluindo `criar-usuario` (já exige Bearer token + reverifica admin no servidor, então não é explorável hoje porque o token não viaja sozinho entre origens como cookie viajaria) - restringir ao(s) domínio(s) reais do site quando alguma function passar a depender de sessão via cookie

- [Concluído em 2026-08-25] Nova feature "Clientes em Pauta", pedida pelo usuário a partir de uma necessidade trazida por um técnico de campo:
  - cadastro manual de cliente com nível de criticidade (Urgente > Crítico > Importante > Aproveitamento de rota, mesma lista ordenada); qualquer perfil pode cadastrar (representante só dentro da própria carteira); lista compartilhada com a mesma regra de visibilidade que `clientes`/`comissoes` já usam
  - nova tabela `clientes_em_pauta` (migration `20260825170000_clientes_em_pauta.sql`), com RLS no mesmo padrão de `clientes_select_por_clientes_representantes`; ciclo de vida por `status`: `ATIVO` (na lista) → `EM_ROTA` (incluído numa rota ainda não visitada, some da lista pra não ser sugerido de novo) → `ATENDIDO` (visita concluída, resolvido) ou `DESCARTADO` (visita cancelada e usuário optou por não devolver à pauta); histórico nunca é apagado, só muda de status; índice único parcial garante só 1 entrada ativa/em rota por cliente, permitindo recadastrar depois de resolvido
  - ganchos de ciclo de vida em `src/App.jsx`: `adicionarClienteNaRota` marca `EM_ROTA` e liga ao `rota_cliente_id` novo; `removerClienteDaRota` devolve pra `ATIVO` silenciosamente (remoção sem querer); `alterarStatusClienteRota` marca `ATENDIDO` ao visitar, e no cancelamento (além do motivo já obrigatório) pergunta se quer devolver o cliente à pauta
  - dois pontos de cadastro: botão "Pauta"/"Em Pauta" no card do cliente na tela Clientes (`.acoes`, 5º botão, grid ajustado pra 5 colunas desktop/3 mobile em `clientes.css`), e seção "Clientes em Pauta" no Meu Dia (`src/ClientesEmPauta.jsx`, componente autônomo que busca os próprios dados via RLS, no mesmo padrão do `MinhaComissaoCard.jsx`, mas sem exigir `codigo_representante` porque admin/técnico também usam) com botão "Cadastrar" que navega pra tela Clientes
  - modal de escolha do nível reaproveita a estrutura do `modalVisita` (que estava morto no código, nada chamava `setModalVisita`), em `src/lib/pautaCriticidade.js` (níveis/rótulos/cores) - cuidado ao reaproveitar componentes com `style` inline: o CSS global tem `button { color: white }`, então qualquer botão com fundo claro precisa `color` explícito no style ou o texto fica invisível (bug real encontrado e corrigido durante o teste visual)
  - painel de sugestões (`src/SugestoesPautaRota.jsx`) nas telas de planejamento/operação de rota (`RotasPlanejamento.jsx`, `RotasOperacao.jsx`): ao adicionar um cliente na rota, mostra clientes em pauta do mesmo estado (ordenados por criticidade) e de outros estados num raio de 300km (linha reta, reaproveitando `calcularDistanciaKm` já existente - sem chamar a API de distância rodoviária), com botão "Adicionar" que reusa `adicionarClienteNaRota` direto
  - fora de escopo por decisão: RLS aberta de `rotas`/`rota_clientes` (`using (true)`, gap pré-existente não relacionado) não foi mexida; painel de sugestões não foi adicionado na aba de manutenção; as 3 cópias duplicadas do bloco de busca de cliente em rota não foram unificadas
  - validado com `npm run build`/`npm run lint` limpos e testes end-to-end no navegador via Playwright com o usuário demo (rebaixado pra representante 000060 pra validar escopo de carteira e depois restaurado a admin): RLS de `clientes_em_pauta` (representante só vê/insere na própria carteira, índice único parcial bloqueia duplicata), fluxo completo cadastrar → aparecer como sugestão na rota → clicar Adicionar → status vira `EM_ROTA` com `rota_cliente_id` correto, sem nenhum erro de console/JS; dados e rotas de teste apagados ao final
- [Concluído em 2026-08-25, mesmo bloco] Melhorias na feature "Clientes em Pauta", a partir de perguntas do usuário (base do cálculo de 300km, como ver/editar, duplicidade, quem cadastrou, remoção manual) mais sugestões próprias:
  - nova tela "Clientes em Pauta" (`src/PautaClientes.jsx`, `src/pauta.css`), menu lateral novo com ícone `Flag` (sem badge de contagem - removido depois, ver bloco seguinte); lista todos os ativos/em rota por padrão, com busca por texto, filtro por nível e checkbox "Mostrar histórico" (revela atendidos/descartados, com motivo da remoção quando houver)
  - cada card mostra quem cadastrou e há quantos dias (via `perfis`, buscado à parte já que `criado_por` referencia `auth.users`, sem FK direta pra `perfis`), com destaque visual quando passa de 15 dias em aberto (mesmo destaque replicado no widget do Meu Dia)
  - clicar no botão "Pauta"/"Em Pauta" do card do cliente agora abre direto em modo edição quando já existe uma entrada ativa (antes só mostrava um alerta bloqueando); o modal ganhou modo edição (`pautaEditandoId`) que faz `update` em vez de `insert`
  - remoção manual (`removerClienteDaPautaManual` em `App.jsx`, coluna nova `motivo_remocao` na migration `20260825180000_clientes_em_pauta_remocao.sql`): se quem remove foi quem cadastrou, só confirma; se foi outro usuário, exige justificativa em texto (obrigatória) antes de marcar `DESCARTADO` - testado nos dois caminhos
  - índice único parcial (`uq_clientes_em_pauta_ativo_por_cliente`) já impedia duplicidade desde a primeira versão - reconfirmado nesta rodada
  - painel de sugestões na rota agora mostra explicitamente a base do cálculo: "Distâncias calculadas a partir do último cliente adicionado: `<nome>` (`<cidade/UF>`)" - a regra sempre foi essa (último cliente inserido na rota), só não estava visível
  - Meu Dia ganhou link "Ver todos" ao lado de "Cadastrar" no painel, levando pra tela nova
  - validado ao vivo com o usuário demo: durante o teste, o **usuário real (Marcelo)** já tinha usado o servidor local sozinho e cadastrado 3 clientes reais em pauta (ABBASPEL, ADAMI, COCELPA) - identificados via `criado_por` antes de qualquer limpeza e preservados intactos; os testes automatizados usaram outros clientes e foram apagados ao final, sem tocar nos 3 registros reais
- [Concluído em 2026-08-25, mesmo bloco] Correções na feature "Clientes em Pauta" a partir de bugs reportados pelo usuário testando ao vivo:
  - **bug real corrigido**: `carregarSugestoesPauta` lia `clientesDaRota` (estado do React) direto do closure do componente, que fica "atrasado" em relação ao estado real assim que a própria função que o chama já disparou um `setClientesDaRota` momentos antes (closure da renderização anterior). Passou a receber a lista de `cliente_id`s da rota como parâmetro explícito, montada a partir do resultado fresco da própria consulta ao banco em `adicionarClienteNaRota`/`removerClienteDaRota` - sem depender de estado do React que pode estar desatualizado. Sintoma relatado: "coloquei um cliente, trouxe sugestões; coloquei um segundo de outro estado, não trouxe nada" - confirmado e corrigido; testado com uma sequência de 2 clientes de estados diferentes numa mesma rota, sugestões corretas nos dois casos
  - `removerClienteDaRota` agora reavalia o painel de sugestões com base no cliente mais recente que **restou** na rota (antes não tocava no painel, que ficava com dado do cliente removido); se a rota ficar vazia, o painel some
  - `SugestoesPautaRota.jsx` não some mais silenciosamente quando não há sugestões - mostra "Nenhum cliente em pauta encontrado por perto." com a mesma linha de "base do cálculo", pra deixar claro que a busca rodou
  - texto da base do cálculo mudou de "a partir do último cliente adicionado" pra "com base em", já que agora também pode ser o último cliente que restou após uma remoção
  - badge de contagem no menu lateral removido - usuário apontou que não é um padrão usado em outro lugar do app
  - botões "Ver todos"/"Cadastrar" do painel no Meu Dia saíram do cabeçalho apertado (ao lado do título) e foram pra um rodapé de largura cheia abaixo da lista - couberam meio espremidos quando eram dois no cabeçalho estreito da coluna lateral
- [Concluído em 2026-08-25, mesmo bloco] Segunda rodada de ajustes finos, a partir de mais feedback ao vivo:
  - botões do painel de pauta no Meu Dia voltaram pro topo (logo abaixo do título, antes da lista) em vez do rodapé - o rodapé ficava longe demais se a lista crescesse; lista do widget agora mostra os **5 mais recentes** (`order by criado_em desc, limit 5`), não mais os 10 mais críticos - o widget virou "o que chegou agora", a tela cheia (`PautaClientes.jsx`) continua ordenada por criticidade pra quem quer ver o que é urgente
  - novo botão "Clientes em Pauta" na linha de ações do Planejamento da Rota (ao lado de "Reordenar rota"/"Ordenar por distância"/"Fechar rota"), com o mesmo ícone `Flag` do menu - alterna um painel manual (`src/PainelTodaPauta.jsx`, reaproveita `CartaoSugestao` exportado de `SugestoesPautaRota.jsx`) com **todos** os clientes em pauta ativos ordenados por criticidade (sem filtro de UF/raio), cada um com botão Adicionar direto na rota. Cobre o caso de começar a planejar sem nenhum cliente ainda (quando o painel automático de sugestões não tem nenhuma referência) e também serve como consulta manual a qualquer momento
  - painel manual e o painel automático reusam os mesmos hooks de atualização (`carregarTodaPautaAtiva`, chamado depois de adicionar/remover cliente da rota quando o painel manual está aberto) e são resetados ao trocar de rota, mesma lógica já usada pro painel automático
  - `carregarTodaPautaAtiva` roda a partir de um clique direto do usuário (nunca encadeado dentro de outra função assíncrona que acabou de mudar estado), então ler `clientesDaRota` do estado React ali é seguro - não é o mesmo padrão que causou o bug da rodada anterior
- [Concluído em 2026-08-25, mesmo bloco] Correção: botão "Clientes em Pauta" (painel manual) do Planejamento estava aparecendo sempre, mesmo quando o painel automático de sugestões já tinha resultado - usuário apontou que a intenção original era o botão ser um substituto só pra quando não há sugestão nenhuma. `RotasPlanejamento.jsx` agora calcula `temSugestaoAutomatica` (a partir de `sugestoesPautaRota.mesmaUf`/`raio`) e some tanto com o botão quanto com o painel manual (mesmo que ainda esteja "aberto" internamente) sempre que o painel automático já tem algo pra mostrar; volta a aparecer quando a sugestão automática fica vazia de novo (ex.: depois de remover o único cliente da rota). Validado com Playwright: botão visível sem cliente na rota, escondido com sugestão automática presente, visível de novo após remover o cliente.
- [Concluído em 2026-08-25, mesmo bloco] Duas melhorias sugeridas pelo Claude e aprovadas pelo usuário (uma terceira, exigir observação em níveis altos, foi descartada por enquanto):
  - **Alerta de cliente preso numa rota aberta há muito tempo**: `PautaClientes.jsx` agora busca, pra cada item `EM_ROTA`, a rota vinculada (via `rota_cliente_id` → `rota_clientes.rota_id` → `rotas.status`/`nome`, join manual em 2 consultas, sem depender de embed automático do PostgREST) e calcula `diasDesde(atualizado_em)` (quando o item virou `EM_ROTA`) - se a rota ainda não está `FINALIZADA` e já se passaram 15+ dias, mostra um banner no topo da tela ("N cliente(s) em pauta preso(s) há 15+ dias...") e um aviso no próprio card ("rota parada há X dias, ainda não finalizada"). Cobre o risco de um cliente entrar numa rota e a rota nunca ser fechada/executada, ficando esquecido pra sempre sem aparecer em nenhuma sugestão
  - **Métricas de pauta no Dashboard**: novo grupo "Clientes em Pauta" na tela Dashboard (`carregarMetricasPauta()` em `App.jsx`, chamada junto com `carregarRotas()` ao abrir a tela) - Cadastrados (total histórico), Aguardando (`ATIVO`+`EM_ROTA`), Atendidos, Descartados, e Tempo médio até resolver em dias (média de `resolvido_em - criado_em` entre os que já foram concluídos, mostra "-" se nenhum ainda)
  - validado ao vivo: métricas batendo com os 3 registros reais do Marcelo (3 cadastrados, 3 aguardando, tempo médio "-" por não ter nenhum resolvido ainda); alerta de rota presa testado com cenário sintético (cliente de teste numa rota "envelhecida" 20 dias via SQL) - banner e aviso no card apareceram corretamente, achado e corrigido um erro de concordância no texto do banner ("está presos" → "está preso"/"estão presos"); dados de teste apagados ao final, sem tocar nos registros do Marcelo
- [Concluído em 2026-08-25] Nova tela "Painel BI" (`src/PainelBI.jsx`), visível só pra `tipo_perfil === admin`, com visão agregada de toda a equipe a partir dos dados de comissões (`comissoes_resumos_mensais`, `comissoes_lancamentos`, `comissoes_faixas`) - tela nova e separada de `ComissoesRepresentante.jsx` (que continua sendo a visão individual por representante), sem nenhuma migration nova (RLS dessas 3 tabelas já libera leitura total pra admin desde a auditoria de segurança do mesmo dia):
  - componentes de gráfico genéricos e reutilizáveis criados do zero em `src/bi/` (`LineChart.jsx`, `BarChart.jsx`, `StatTile.jsx`, `paletteBI.js`, `chartUtils.js`) - SVG/HTML inline, sem biblioteca de gráficos nova (o único precedente do app, `MinhaComissaoCard.jsx`, também não usa nenhuma). Seguido o skill de dataviz do Claude Code: paleta validada via `scripts/validate_palette.js` do skill (azul `#0057d8` do módulo Comissões + laranja `#eb6834`, ΔE CVD 29,4/normal 40,0 - todos os checks passam; ramp ordinal azul de 4 passos validada com `--ordinal` só pra faixas de meta, que têm ordem real - nunca usada pra representantes/clientes, que são categorias nominais), crosshair+tooltip em todo gráfico, toggle "Ver como tabela" em todos (par de acessibilidade), sem gráfico de eixo duplo em nenhum lugar
  - seções: KPI row (vendas líquidas, comissão prevista, custo de comissão %, representantes ativos, cada um com delta vs mês anterior); tendência de vendas líquidas (12 meses) e custo de comissão % (12 meses) como dois gráficos de linha **separados** em vez de um só com 2 séries - decisão tomada durante a implementação porque vendas (centenas de milhares) e comissão (milhares) no mesmo eixo ficariam ilegíveis, ou exigiriam um eixo duplo disfarçado - ambos os problemas banidos pelo skill; ranking de representantes (toggle vendas/comissão); distribuição por faixa de meta (calculada com a mesma lógica de "faixa atual" do `ComissoesRepresentante.jsx`); top 10 clientes por comissão; devoluções por mês
  - filtro único (Mês/Ano) no topo, escopando todos os gráficos; botão "Imprimir painel" reaproveitando o padrão `modo-impressao-*` já usado em Comissões
  - dois bugs achados e corrigidos durante o teste visual com Playwright (conta demo, dados reais de produção, sem inserir nada - tela é só leitura): (1) quando um mês tinha todos os valores zerados (ex.: nenhuma devolução no período), o eixo mostrava um tick falso "1" e os rótulos de valor de cada barra (mostrados incondicionalmente antes) se sobrepunham num emaranhado ilegível - corrigido tratando o caso "sem dados" no cálculo de ticks e escondendo rótulo por barra em gráficos de coluna com mais de 6 itens (tendência mensal), mantendo o rótulo só onde o item conta é pequeno (poucas categorias comparáveis, como faixas/ranking); (2) `BarChart` nunca tinha tooltip de hover implementado (só o estado "ativo" visual) - adicionado tooltip por barra/coluna, ancorado via DOM (elemento filho do próprio item hover, sem cálculo de posição do mouse)
  - fora de escopo por decisão: filtro por representante individual (a tela é visão de equipe; drill-down por representante já existe em Comissões), clique-drill-down nos gráficos, projeção/run-rate do mês corrente, quebra geográfica por UF - guardadas como ideias futuras
  - validado com `npm run build`/`npm run lint` limpos e Playwright com o usuário demo (admin): todos os gráficos renderizam e respondem a hover/foco, toggle de tabela funciona em todos, toggle de ranking recalcula corretamente, troca de mês/ano recalcula tudo, sem erro de console; testado também em viewport mobile (390px)
- [Concluído em 2026-08-25, mesmo bloco] Ajustes no Painel BI a partir de feedback do usuário testando ao vivo:
  - valor dos cards de KPI cortado entre ~1024-1300px de largura: o grid trocava pra 4 colunas cedo demais e o `font-size` do valor era calculado em `vw` (não acompanha a largura real do card, que depende da largura do menu lateral). Breakpoint de 4→2 colunas subido pra 1300px, `font-size` fixado em 24px com `white-space:nowrap` - testado de 900 a 1440px sem cortar
  - valor final dos gráficos de linha cortado (ex.: "R$ 589.032,4" em vez de "43") - a margem direita reservada dentro do SVG pro rótulo era pequena demais pra um valor em reais completo, o texto vazava e era recortado pelo próprio limite do `viewBox`. Margem aumentada em `LineChart.jsx`
  - impressão: botões "Vendas líquidas/Comissão" (toggle do ranking) e qualquer tooltip aberto no momento do clique não estavam na lista de elementos escondidos no `@media print` - corrigido em `bi-panel.css`
  - `nomeRepresentante()` passou a mostrar "Sem representante" (em vez de "-") quando `codigo_representante` vem vazio, sem excluir o valor do ranking/total - ver investigação abaixo sobre a origem desse cenário
- [Concluído em 2026-08-25, mesmo bloco] Investigação e correção, fora deste repositório, de por que faturamento sem representante podia sumir da sincronização - usuário perguntou se era o Painel BI que não considerava ou o sync que não exportava:
  - achado: a view Oracle `EX_MW_VW_RADAR_COMISSOES_LANC` (projeto `MWComissoesSync`, fora deste repo) tinha `WHERE TRIM(H.CD_REPRESENTANT) IS NOT NULL`, excluindo a nota inteira da sincronização quando não havia representante - `comissoes_resumos_mensais` (usada nos KPIs do Painel BI) nunca teve esse filtro, então o total já estava correto, só o detalhe por nota/cliente que sumia
  - corrigido em `MWComissoesSync/Sql/Oracle/001_ex_mw_vw_radar_comissoes.sql`: filtro removido, notas sem representante entram com `codigo_representante = ''`; todos os CTEs da view de resumo mensal normalizados do mesmo jeito (corrige de quebra um `LEFT JOIN` que nunca casava certo pra esse grupo, já que `NULL = NULL` não é verdadeiro em SQL)
  - a pedido do usuário, aproveitado o mesmo momento pra adicionar um resumo da rodada (notas novas importadas, sem criar tabela de histórico) colado no corpo do e-mail de execução disparado pelo `MWAgendador` - detalhe completo em `MWComissoesSync/MWCOMISSOESSYNC_ACOMPANHAMENTO.md` e `MWAgendador/MWAgendador_ACOMPANHAMENTO.md` (também registrado em `PHENIX_ECOSSISTEMA.md`, Nível 2, por mudar o fluxo Oracle→Supabase→App e a dependência entre MWComissoesSync e MWAgendador)
  - nada disso foi executado no Oracle real nem publicado - só código alterado e compilado localmente; **pendente rodar o script no SQL Developer**
- [Concluído em 2026-08-25, mesmo bloco] Causa raiz real do faturamento "sem representante" achada depois de o usuário confirmar, com uma nota real (10417, cliente Pamer), que a correção anterior não bastou - a view do Oracle nunca foi o problema principal:
  - `MWComissoes` (o desktop de conferência, fora deste repo) nunca persistia uma nota sem representante em `EX_MW_COMISSAO_NF` - mesmo com o filtro "Sem representante informado" (que já existia na tela) marcado, a nota aparecia na consulta e sumia de novo, sem nunca virar registro permanente; sem registro, não tem onde marcar `REVISADO_RADAR`, e sem isso a nota nunca sai do Oracle
  - corrigido em `MWComissoes/Repositories/ComissaoRepository.cs`: `Buscar()` passa a persistir também as notas sem representante; checagem de duplicata corrigida pra ser null-safe (senão toda consulta criaria uma linha em branco nova pra mesma nota); novo método `AtribuirRepresentanteAoHistorico` atualiza a linha já existente em vez de duplicar quando alguém atribui um representante depois; nova migration Oracle liberando `CD_REPRESENTANT` pra aceitar nulo
  - decisão explícita do usuário: caminho inverso (remover representante já atribuído) continua como está, fora de escopo
  - detalhe completo em `MWComissoes` (sem doc de acompanhamento próprio ainda - anotado no `MANUAL_USUARIO.md` e no `Scripts/Oracle/LEIA-ME.md` do projeto) e em `PHENIX_ECOSSISTEMA.md` (V007)
  - nada disso foi testado contra o Oracle real (sem acesso a partir daqui) - só compilado; pendente rodar a migration, testar ao vivo, revisar a nota 10417 e então sim confirmar que ela chega ao Painel BI
- [Concluído em 2026-08-26] Duas correções de contagem, achadas testando o fluxo "sem representante" ao vivo:
  - **Duas notas em branco duplicadas na apuração**: durante os testes da migração acima (revertida no mesmo dia, ver "Correção de rumo" logo abaixo), algumas notas ficaram gravadas em `EX_MW_COMISSAO_NF` com `CD_REPRESENTANT` nulo/branco. A view `EX_MW_VW_RADAR_COMISSOES_RES` agrupa com `NVL(...,'000000')`, então essas linhas caem no mesmo balde "sem representante" e somam junto com as corretas - Radar mostrando R$ 535.379,85 de "sem representante" em agosto/2026 contra R$ 291.319,47 reais na tela do MWComissoes (que filtra `IN ('000000')`, comparação exata, não enxerga linha em branco). Confirmado com o usuário via consulta direta (4 notas em branco somando exatamente a diferença, R$ 244.060,38) - limpeza pontual passada pro usuário rodar no SQL Developer, não é bug recorrente (código atual só grava `'000000'`, nunca mais nulo/branco)
  - **Faturamento contado 2x quando a nota tem mais de um representante**: reportado com a nota 10435 (TROMBINI EMBALAGENS, dois representantes). Cada representante corretamente recebe o valor integral da nota pra sua própria meta (regra proposital do MWComissoes) - o bug era no total agregado "toda a equipe": tanto o rodapé do MWComissoes (`AtualizarResumo` em `FrmPrincipal.cs`) quanto o Painel BI somavam o faturamento de todas as linhas sem descontar que a mesma nota física aparece 2x. Corrigido no MWComissoes agrupando por identidade física antes de somar (nota, ou parcela em Lançamentos financeiros). No Radar, como `comissoes_resumos_mensais` já vem agregado por representante (perde a granularidade de nota), a correção precisou de uma coluna nova calculada no próprio Oracle: `EX_MW_VW_RADAR_COMISSOES_RES` ganhou `VENDAS_BRUTAS_EMPRESA`/`VENDAS_LIQUIDAS_EMPRESA` (mesmo valor repetido em toda linha do mês, calculado com `DISTINCT` na chave física da nota, ignorando representante) - `MWComissoesSync/Program.cs` sincroniza pras colunas novas `vendas_brutas_empresa`/`vendas_liquidas_empresa` (migration `20260826120000_comissoes_vendas_empresa.sql`, aditiva, já aplicada no Supabase). `PainelBI.jsx` (`vendasEmpresa()`) passou a usar essas colunas pro KPI "Faturamento" e pros dois gráficos de tendência de 12 meses, com fallback pra soma antiga (por representante) enquanto a coluna nova ainda não veio de uma sincronização
  - detalhe completo em `MWComissoes/MWCOMISSOES_ACOMPANHAMENTO.md` e `MWComissoesSync/MWCOMISSOESSYNC_ACOMPANHAMENTO.md`
  - `npm run lint`/`npm run build` limpos aqui; **não testado contra o Oracle real** - o total corrigido só aparece no Painel BI depois de rodar `001_ex_mw_vw_radar_comissoes.sql` de novo no SQL Developer e uma rodada do `MWComissoesSync`
- [Concluído em 2026-08-26] Correção de rumo na investigação acima: testando a nota real (NF 10417) ao vivo, a abordagem de coluna nula continuava quebrando (mais dois lugares achados com `CD_REPRESENTANT = ?` nunca casando com nulo). O usuário sugeriu usar um **código fictício reservado (`000000`)** em vez de nulo pra representar "sem representante" - confirmado que nunca é/será um código real de empresa no CIGAM. Efeito: quase toda a correção anterior foi revertida (migration de coluna nula removida, ~6 comparações null-safe voltaram a ser simples, um método novo virou desnecessário) porque `000000` funciona como qualquer código real em toda a lógica que já existia - só a view do sync (`MWComissoesSync`) passou a preencher `000000` em vez de `''`. **Achado e corrigido um erro meu**: eu tinha afirmado que `normalizarCodigo("000000")` resultaria em código vazio - errado, a função tem um fallback que preserva de propósito um código só de zeros. `src/PainelBI.jsx` corrigido pra comparar com `"000000"` explicitamente (`nomeRepresentante`, contagem de "representantes ativos") em vez de checar "vazio". `npm run lint`/`npm run build` limpos. Detalhe completo em `MWComissoes/MWCOMISSOES_ACOMPANHAMENTO.md` (novo, o projeto não tinha documento de acompanhamento próprio) e `PHENIX_ECOSSISTEMA.md` (addendum 2 da V007) - nada testado contra Oracle real ainda.
- [Concluído em 2026-08-26] Achado numa rodada de homologação (agente dedicado testando a cadeia MWComissoes → MWComissoesSync → radar-clientes contra um Oracle local de homologação, ver `MWComissoes/MWCOMISSOES_ACOMPANHAMENTO.md`): os KPIs do Painel BI e da tela "Minha Comissão" (`ComissoesRepresentante.jsx`) vêm de `comissoes_resumos_mensais`, que soma **toda** nota que já virou histórico no MWComissoes, revisada ou não; os gráficos/tabelas de detalhe (Top clientes, Devoluções, lançamentos individuais) vêm de `comissoes_lancamentos`, que só inclui nota com `REVISADO_RADAR='S'`. As duas fontes divergem legitimamente enquanto a revisão está em andamento, sem nenhuma indicação visual disso - um diretor podia ver um KPI que não batia com o detalhe abaixo dele, sem saber por quê.
  - Avaliada e descartada a opção de padronizar tudo numa fonte só: `comissoes_resumos_mensais` já vem com o cálculo de faixa/meta de comissão variável pronto do lado do Oracle - reconstruir isso a partir de `comissoes_lancamentos` (dado por lançamento/parcela, não por nota) exigiria reimplementar essa lógica em JS, risco maior do que o problema em si. Adicionar o mesmo filtro `REVISADO_RADAR` na view `EX_MW_VW_RADAR_COMISSOES_RES` (Oracle) também foi descartada por agora - a view agrega por nota inteira, e uma nota pode ter parcelas com status de revisão diferentes; decidir "conta se qualquer parcela for revisada, ou só se todas forem" é uma decisão de design que fica pra outra sessão dedicada.
  - Solução aplicada: aviso visual de transparência (não muda nenhum cálculo existente). `PainelBI.jsx` ganhou `comissaoPendenteRevisao` (diferença entre o KPI "Comissão prevista" do mês e a soma de `comissoes_lancamentos` não-devolução com `data_emissao` no mesmo mês) e um banner amarelo abaixo dos KPIs quando esse valor é maior que zero. `ComissoesRepresentante.jsx` ganhou o mesmo aviso na aba "Metas", comparando `resumoMes.comissao_prevista` contra `totais.comissao` (já filtrado pelo mês selecionado). Classes novas `.bi-aviso-pendente` (`bi-panel.css`) e `.comissoes-aviso-pendente` (`comissoes-representante.css`).
  - É uma aproximação, não uma reconciliação exata nota a nota (as duas fontes nem usam o mesmo critério de "mês" - uma usa `DT_MOVIMENTO`/emissão, a outra às vezes `data_vencimento` da parcela) - serve como sinal de "algo ainda não foi revisado", não como número de auditoria.
  - `npm run lint`/`npm run build` limpos aqui. Não depende de nenhuma mudança no Oracle/MWComissoesSync - funciona com os dados que já chegam hoje no Supabase.
- [Concluído em 2026-08-26] Achado pelo usuário testando ao vivo (`npm run dev` local, aba "Metas da equipe"): a linha "sem representante" aparecia com o código bruto `000000`, não com um rótulo amigável. Causa: `nomeRepresentante()` em `ComissoesRepresentante.jsx` é uma implementação própria, separada da de `PainelBI.jsx` - só a de `PainelBI.jsx` tinha o tratamento especial pra `CODIGO_SEM_REPRESENTANTE`. Corrigido adicionando a mesma constante/checagem em `ComissoesRepresentante.jsx`; como as três tabelas do arquivo (lançamentos, metas da equipe, devoluções) chamam a mesma função, a correção cobre as três de uma vez. Validado com Playwright (usuário demo, dados reais): linha antes mostrando "000000" agora mostra "Sem representante"; console sem erros.
- [Concluído em 2026-08-26] Reorganização do menu lateral (`App.jsx`), a pedido do usuário ("funções parecidas em locais separados"): `Painel BI` e `Dashboard` (as duas telas de visão consolidada pra gestão) ficavam a 3 itens de distância uma da outra e usavam o mesmo ícone (`BarChart3`); `Alterar senha` (ação pessoal) e `Administração` (painel do sistema) também compartilhavam ícone (`Settings`); `Próximos` (visão de cliente) ficava separado de `Clientes`/`Clientes em Pauta` pelas telas de comissões no meio.
  - Os 13 itens foram agrupados em 5 blocos: Comercial (Meu Dia, Clientes, Clientes em Pauta, Próximos), Rotas (Rotas, Pesquisar rotas), Gestão e Análise (Dashboard, Painel BI, Comissões, Amostras), Conta (Alterar senha), Administração (Promoção 30 anos, Administração - só admin).
  - Cada bloco virou um grupo expansível/recolhível (componente novo `MenuGrupo`, ícone próprio por grupo, seta que gira) - depois de uma primeira versão com rótulo fixo em cima de cada grupo, o usuário pediu pra tirar o rótulo estático e deixar tudo com a mesma interação de expandir/recolher, sem duplicar nome de rótulo + botão. Estado por grupo (`gruposMenuAbertos`), todos abertos por padrão (não muda o comportamento de hoje, só adiciona a opção de recolher).
  - Ícones trocados pra não repetir: `Painel BI` ganhou `LineChart` (era `BarChart3`, igual ao Dashboard); `Alterar senha` ganhou `KeyRound` (era `Settings`, igual à Administração).
  - Mudança de acesso, a pedido do usuário: `Pesquisar rotas` deixou de ser exclusivo de admin - removida a checagem em `abrirPesquisaRotas()` (antes bloqueava com `alert`) e na renderização da tela. Sem risco novo de exposição de dado: `carregarRotas()` já limitava não-admin a ver só as próprias rotas (`usuario_responsavel`), então Pesquisar Rotas pra um não-admin só pesquisa dentro do que ele já podia ver em "Rotas".
  - `npm run lint`/`npm run build` limpos. Validado com Playwright (usuário demo admin): os 5 grupos renderizam com ícone próprio, expandem/recolhem, seta gira, nenhum erro de console nos dois estados (aberto e com alguns recolhidos).
- [Concluído em 2026-08-26] **CORREÇÃO DE SEGURANÇA** achada testando perfis/acessos a pedido do usuário (incluindo "usuário inativo consegue acessar?"): rodado `supabase db advisors --linked` (linter de segurança nativo) contra o projeto real e cruzado com o histórico de migrations.
  - Achado: `perfis`, `rotas`, `rota_clientes`, `visitas` e `importacoes` tinham policies `authenticated + using (true)` - documentadas (não criadas) por `20260825150000_baseline_tabelas_pre_migrations.sql` como parte de uma introspecção do banco real (a migration deixa isso explícito no comentário), mas nunca corrigidas de fato depois. A correção de segurança do mesmo dia (`20260825130000`) resolveu `clientes` e isolou o `calendario_token` de `perfis`, mas não cobriu a leitura geral de `perfis` nem nenhuma das outras quatro tabelas - ficaram assim desde sempre, não foi uma regressão de uma correção anterior.
  - Confirmado na prática, sem passar pela tela: criado um usuário de teste descartável ("representante", sem carteira, sem rota própria) e chamada a API REST do Supabase direto. `GET /rest/v1/perfis` devolvia os 13 perfis do sistema inteiro (nomes, tipo de perfil, status de todo mundo, inclusive admins); `GET /rest/v1/rotas` devolvia rotas de outros usuários. Marcado esse mesmo usuário `ativo=false`: o token antigo continuava lendo tudo, e um **login novo também era aceito normalmente** (o Supabase Auth não sabe da coluna `ativo` - só a tela, via `carregarPerfil()` em `App.jsx`, barra isso, e só se a pessoa realmente usar a tela em vez de chamar a API direto).
  - Corrigido em `supabase/migrations/20260826200000_corrige_acesso_aberto_perfis_rotas_visitas.sql`: `perfis` (select restrito ao próprio registro ou admin), `rotas`/`rota_clientes` (select/update/delete restritos ao dono - `usuario_responsavel = auth.uid()` - ou admin, igual ao filtro que `carregarRotas()` já aplicava só no front-end; `rota_clientes` verifica via join na rota dona), `visitas` (select restrito ao próprio registro ou admin - o insert restrito já existia, só ficava mascarado pela policy solta), `importacoes` (select restrito a admin, mesmo escopo do insert). Todas usando `radar_perfil_atual_tipo()`, a mesma função já usada pelas policies corretas de `clientes` (que já verifica `ativo=true` internamente).
  - `INSERT` de rotas/rota_clientes não foi restringido de propósito (admin às vezes cria rota em nome de outro responsável; o risco real estava em ler/editar/apagar dado alheio, não em inserir).
  - `clientes_geolocalizacao` foi deixada de fora de propósito - é um cache de geocodificação sem coluna de dono, e restringir sem estudar melhor o fluxo de "Próximos" tinha risco de quebrar o mapa sem benefício de segurança claro (não é dado pessoal, só endereço de cliente já semi-público). Fica registrado como pendência, não como parte desta correção.
  - Revalidado com um segundo usuário de teste descartável após aplicar a migration: `GET /rest/v1/perfis` passou a devolver só a própria linha; `GET /rest/v1/rotas` passou a devolver 0 (sem rota própria); marcado `ativo=false` de novo, o vazamento de dado de terceiros continuou fechado (o usuário inativo só enxerga, no máximo, a própria linha de `perfis` - nunca a de outro usuário). `supabase db advisors --linked` confirmou que `perfis` e `visitas` não aparecem mais no aviso de "multiple permissive policies". Usuários de teste (Auth + `perfis`) apagados ao final, nenhum dado real tocado.
  - Nota que fica registrada: o login em si (Supabase Auth) continua aceitando um usuário `ativo=false` - isso é inerente a como o GoTrue funciona (não conhece a coluna `ativo`) e não foi alterado por esta correção. O que fechou foi o vazamento de dado de **outros** usuários; revogar a sessão automaticamente ao desativar alguém seria uma melhoria adicional, não pedida ainda.
- [Concluído em 2026-08-26, mesmo bloco] Complemento da rodada de homologação acima: teste do menu lateral (`App.jsx`) por tipo de perfil, pra confirmar que a visibilidade de cada item bate com a regra de acesso no código (não só que os dados ficaram protegidos por RLS, mas que a UI já reflete isso corretamente).
  - Consultado `configuracoes_grupos` (`permite_menu_amostras`) antes do teste: hoje só `admin` tem `true`; `tecnico` e `representante` têm `false` - então nenhum dos dois perfis de teste deveria ver "Amostras".
  - Criados dois usuários de teste descartáveis via Auth Admin API: um `tipo_perfil: "tecnico"` e um `tipo_perfil: "representante"` com `piloto_comissoes: true`. Login real via Playwright, sidebar com todos os grupos expandidos (padrão atual) conferida contra a regra de cada item em `App.jsx`.
  - Técnico: viu Comercial (4 itens), Rotas (2 itens), Gestão e Análise com só "Dashboard", Conta - sem Painel BI, sem Comissões, sem Amostras, sem grupo Administração. Bate com o esperado (nenhum desses itens tem `tecnico` na lista de perfis permitidos).
  - Representante com `piloto_comissoes=true`: mesma base do técnico, mas com "Comissões" aparecendo em Gestão e Análise (a tela abriu normal, com os KPIs "Sua comissão"/"Faturamento"/"Comissões a receber" zerados por não ter dado real vinculado a esse representante fictício) - confirma que o gate de Comissões reage ao flag `piloto_comissoes`, não ao `tipo_perfil` em si.
  - Mesmo usuário com `piloto_comissoes` voltado pra `false` (via REST, mesma conta): "Comissões" some do menu, resto idêntico - confirma que é o flag, isoladamente, que decide.
  - Nenhum dos dois perfis de teste viu "Amostras" (bate com `configuracoes_grupos` consultado antes) nem o grupo "Administração" (`admin`-only, não testado por já estar coberto pela lógica óbvia de `tipo_perfil === "admin"` e pelos testes de RLS acima).
  - Os dois usuários de teste (Auth + `perfis`) apagados ao final via REST com a service role key, nenhum dado real tocado.
- [Concluído em 2026-08-26, mesmo bloco] **CORREÇÃO DE SEGURANÇA** complementar: fechada a pendência de `clientes_geolocalizacao` (cache de geocodificação), deixada de fora da correção anterior por não ter coluna de dono.
  - Achado: o front-end (`App.jsx`, carregamento de clientes) busca essa tabela **inteira**, sem filtro, e só depois cruza em JS com a lista de clientes já corretamente restrita por carteira. Como a policy de select era `authenticated + using (true)`, qualquer usuário autenticado - inclusive um representante sem carteira nenhuma - conseguia, via API direta, ler as coordenadas de **todos os clientes da empresa** (249 linhas), não só as suas. Não é dado pessoal, mas é o mapa/território comercial inteiro exposto a qualquer perfil.
  - Corrigido em `supabase/migrations/20260826220000_restringe_clientes_geolocalizacao_por_carteira.sql`: select passou a espelhar a mesma regra já usada em `clientes` (`clientes_select_por_clientes_representantes`, de `20260825130000`) - admin/técnico veem tudo; representante só cliente com `codigo_representante` batendo ou vínculo em `clientes_representantes`, unindo por `codigo_cliente`. Insert/update restritos a admin (única escrita real é da edge function `geocodificar-clientes`, que usa service role key e ignora RLS de qualquer forma - sem efeito colateral).
  - Validado com uma conta de teste descartável (representante, `codigo_representante` fictício, sem vínculo): antes de ter carteira, a leitura direta da API caiu de 249 linhas pra 0; depois de vincular 1 cliente real (`clientes_representantes`), passou a ver exatamente essa 1 linha; tentativa de `INSERT` direto como representante recebeu 403 (RLS bloqueando); conta admin de referência confirmada ainda vendo as 249 linhas normalmente (nada quebrou pro perfil que deveria ver tudo). Vínculo de teste, perfil e usuário Auth apagados ao final.
  - Sem mudança de comportamento esperada pra ninguém: qualquer cliente que já aparecia em `clientesData` (App.jsx) satisfaz, por definição, a mesma condição de carteira usada aqui - o mapa de "Próximos"/clientes continua mostrando tudo que já mostrava, só parou de vazar coordenada de cliente de fora da carteira.
- [Concluído em 2026-08-26] "Clientes em Pauta" movido do grupo "Comercial" pro grupo "Rotas" no menu lateral (`App.jsx`), entre "Rotas" e "Pesquisar rotas", a pedido do usuário - troca só de posição no JSX (o botão em si, o `onClick`, o ícone `Flag` e a tela `clientesEmPauta`/`PautaClientes.jsx` não mudaram nada).
  - Bateria de testes rodada nessa rotina (Playwright, viewport desktop 1400px e mobile 390px): ordem final do grupo Rotas confirmada `["Rotas", "Clientes em Pauta", "Pesquisar rotas"]` e Comercial confirmado sem mais o item (`["Meu Dia", "Clientes", "Próximos"]`); clique no novo local abre a tela normalmente (com destaque visual "ativo" correto); clique em "Pesquisar rotas" logo depois continua funcionando (garantindo que a reordenação dos botões vizinhos no JSX não quebrou nenhum handler); mesmo comportamento confirmado em mobile (menu fecha sozinho após o clique, como os demais itens); testado também com contas descartáveis de técnico e representante - ambos veem o item na mesma posição nova e conseguem abrir a tela sem erro de console (o item nunca teve gate de perfil, então isso já era esperado, só confirmado). `npm run lint`/`npm run build` limpos.
  - Achado no processo, não é bug e não foi alterado: um F5 puro (reload de página) sempre volta pra tela "Meu Dia", mesmo em telas listadas em `TELAS_PERSISTIDAS` - `carregarTelaSalva()` (linha ~233) sempre retorna `"home"` no mount, ignorando o valor gravado em `localStorage` (`radarClientes:telaAtual`); o mecanismo de `TELAS_PERSISTIDAS`/`window.history` existe só pra navegação por back/forward do navegador dentro da mesma sessão de página, não pra sobreviver a um reload. Isso é um comportamento do app inteiro, não específico de "Clientes em Pauta" nem introduzido por esta mudança - registrado aqui só porque apareceu durante o teste da rotina, não como algo a corrigir agora.
  - Duas contas de teste descartáveis (técnico e representante) criadas e apagadas ao final via REST com a service role key; nenhum dado real tocado.
