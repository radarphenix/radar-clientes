# CONTEXTO_PROJETO

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

- Data: 2026-08-10
- Branch atual: `main`
- Situacao de sincronizacao: lote de commits (reordenacao de rotas, Meu Dia
  mobile, menu mobile, Promocao Veste Phenix e documentacao) enviado para
  `origin/main` em 2026-08-05; alteracoes posteriores (horario previsto de
  chegada na rota) commitadas apenas localmente no git, aguardando push
  oficial para o GitHub - a migration correspondente ja foi aplicada no
  Supabase remoto para permitir teste local.
- Backup pre-alteracoes mais recente: `.codex-backups/20260724_102912_visitas_agendadas_meu_dia`
- Backup da evolucao de repeticao e reordenacao:
  `.codex-backups/20260727_173924_rotas_repeticao_reordenacao`.
- Migration de Amostras aplicada no Supabase remoto via `supabase db push --linked` em 2026-07-03.
- Ajuste de contraste global aplicado em `src/app-global.css` e `src/index.css` para melhorar leitura de titulos e campos de busca.
- Cabecalho de contexto padronizado em `src/App.jsx` com estilo compartilhado em `src/app-global.css` para clientes, amostras, dashboard, administracao e alterar senha.

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

## Meu Dia

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
  - `MANUAL_USUARIO.md`
- Supabase:
  - `supabase/migrations/20260629190000_configuracoes_grupos_whatsapp_rotas.sql`
  - `supabase/migrations/20260629234500_configuracoes_grupos_menu_amostras.sql`

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
