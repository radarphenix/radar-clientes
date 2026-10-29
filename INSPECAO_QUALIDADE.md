# Inspeção de Qualidade no Radar

Versão web do programa desktop **MWInspecaoQualidade** (irmão: regra e modelo iguais; mudança em
um vai ao outro na mesma entrega - ver `PHENIX_ECOSSISTEMA.md`, "Família Inspeção de Qualidade").

**Situação (27/10/2026): Radar interno.** Branch `inspecao-qualidade`, roda com `npm run dev`. Nada foi
para a `main` nem para o Cloudflare. Plano: completar aqui, testar, migrar os dados do desktop e virar.

## Onde está

É um **menu do Radar**: **Qualidade → Inspeções**, com página própria carregada só quando aberta
(`lazy`, pacote à parte de ~43 KB). Acesso pelas permissões do catálogo (ver `ACESSOS_RADAR.md`).

| Parte | Arquivo |
|---|---|
| Página (lista ao vivo + editor) | `src/inspecao/PaginaInspecao.jsx`, aberta por `App.jsx` (`telaAtual === "inspecao"`) |
| Editor (abas, salvamento automático, trava, revisões) | `src/inspecao/Editor.jsx` |
| Itens, pré-títulos, fotos, janela do QR | `src/inspecao/Detalhamentos.jsx` |
| Página do celular (QR Code, sem login) | `src/inspecao/Celular.jsx`, rota pública `/inspecao/celular?t=` em `main.jsx` |
| Regras (tradução de `Inspecao.cs`) | `src/inspecao/modelo.js` |
| Dados, trava, revisões, fotos, QR | `src/inspecao/api.js` |
| Estilo (tudo dentro de `.iq-raiz`, nada global) | `src/inspecao/inspecao.css` |
| Banco | `supabase/migrations/20261027220000_inspecao_qualidade.sql` (+ papel na `..._radar_permissoes_por_menu.sql`) |
| Funções | `inspecao-arquivos` (fotos no Drive, com login), `inspecao-celular` (QR, sem login) + `_shared/inspecao.ts` |

Em desenvolvimento o QR Code usa o IP da rede (o Vite descobre e sobe com `host: true`).

## Acesso

Permissões do catálogo: `inspecao.ver` (ver), `inspecao.editar` (criar, editar, finalizar),
`inspecao.aprovar` (reabrir, excluir); `administracao` vale como tudo. `inspecao_papel_atual()` traduz
para o papel usado pelas regras (leitura < inspetor < aprovador < admin).

**Usuário só da Inspeção:** criar na Administração do Radar com o perfil **Qualidade (só Inspeções)**.
Entra direto em Inspeções; o menu mostra só Qualidade e Conta; o banco não lhe mostra nada comercial.

## Banco (Supabase de produção, isolado)

Tabelas `inspecoes`, `inspecao_detalhamentos`, `inspecao_fotos`, `inspecao_revisoes`,
`inspecao_celular_sessoes`, `inspecao_config`. (`inspecao_acessos` existiu nas primeiras horas e foi
substituída pelo catálogo.)

- **Colunas para evolução** em todas as tabelas de conteúdo: `extras jsonb`, `reservado_texto_*`,
  `reservado_numero_*`, `reservado_data_1`, `versao_modelo`.
- Equivalências com o desktop: `.editando` -> `editando_*` (10 min); `historico\revNN.json` ->
  `inspecao_revisoes.retrato`; `_lixeira\` -> `excluido_em`; `_config\` -> `inspecao_config`;
  conferência da pasta a cada 5 s -> Realtime do Supabase.
- Aplicado com `supabase db query -f`, fora do histórico de migrations (o arquivo só existe neste branch).
  Idempotente. **Ao oficializar:** o `db push` roda de novo; se a `main` tiver migrations mais novas,
  renomear os arquivos para a data do merge (ou `--include-all`).

## Fotos no Google Drive

**Autorizar (feito uma vez, pelo usuário, com a conta `radarphenix@gmail.com`):**
1. console.cloud.google.com → projeto "Radar Inspecao" → APIs e serviços → ativar **Google Drive API**.
2. Google Auth Platform / Tela de permissão OAuth: Externo; escopo `.../auth/drive.file`; **Publicar app**
   ("Em produção").
3. Clientes/Credenciais → ID do cliente OAuth tipo **Aplicativo da Web**, redirecionamento
   `https://developers.google.com/oauthplayground`.
4. developers.google.com/oauthplayground → engrenagem → "Use your own OAuth credentials" → escopo
   `https://www.googleapis.com/auth/drive.file` → Authorize → Exchange → copiar o **Refresh token**.
5. Colar os três valores em `.env.google-drive.local` (raiz do repo, ignorado pelo git). Depois o Claude
   grava os segredos (`supabase secrets set`, sem exibir) e testa.

Pasta `Inspecoes Radar/<ano>/<número> - <cliente>` na conta `radarphenix@gmail.com`, escopo `drive.file`.
Conta de serviço não serve (sem espaço no Drive de Gmail comum). Credenciais em `.env.google-drive.local`
(ignorado pelo git) -> segredos `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`.
Projeto do Google Cloud **Em produção** (em "Teste" a autorização expira em 7 dias). Arquivos privados.

## Testes de 27/10/2026

- `api.js` real contra o banco (usuário demo): 20 de 20 OK, dados apagados.
- Tela, em desktop 1920, notebook 1366 e celular 390 (Playwright): menu → Inspeções → nova (nasce com
  9 itens) → saída com "Phenix" automático → detalhamento → Títulos → janela do QR → voltar →
  Acessos; sem erros no navegador e sem rolagem lateral; 3 rodadas seguidas limpas.
- Perfil Qualidade (demo rebaixado e devolvido): entra direto em Inspeções, menu só Qualidade + Conta.
- **Tela redesenhada para web (27/10/2026, noite)**, no padrão do Radar: lista em cartões com faixa de
  status, busca e filtros (Todas / Rascunho / Finalizadas / Em edição); a inspeção abre como página com
  cabeçalho (cliente, nº, revisão, status) e atalhos fixos para as seções; seções numa página só
  (Identificação agrupada, Técnicas, Saída por interruptor "A Phenix forneceu esta tela", Detalhamento em
  cartões recolhíveis com fotos no próprio item e foto ampliada para legenda/ordem/mover/remover,
  Conclusão); barra fixa com o estado do salvamento e Finalizar; datas com calendário; no celular,
  botão Câmera. Mesmas funções do desktop, não o mesmo leiaute.
- **Bugs achados e corrigidos nos testes (os três apagavam o que acabara de ser digitado):**
  recarregamento ao vivo atrasado; leituras paralelas ao abrir chegando fora de ordem (agora a mais
  antiga é descartada); resposta do salvamento automático devolvendo campos antigos (agora só a revisão).
- **Não testado:** envio real de foto (falta a autorização do Google).

## Parte 2 (28/10/2026)

| Função | Onde | Observação |
|---|---|---|
| Cliente do cadastro | campo Cliente (busca ao digitar) | RPC `inspecao_buscar_clientes` (security definer, só código/nome/cidade/UF/e-mail, só com acesso à Inspeção): o perfil Qualidade não lê a tabela `clientes` |
| PDF e Word | botões no cabeçalho da inspeção | `relatorio.js`: tradução de PdfService/WordService (folha timbrada, quadro, seções, fotos 2 por linha, rodapé "página X de Y"); jsPDF e docx carregados só ao gerar; logo em `public/inspecao/logo_phenix.png` |
| E-mail individual e em lote | cabeçalho (finalizada) e lista → Mais | função `inspecao-email` (Gmail do Radar, segredos `PROMO_SMTP_*`, remetente "Qualidade Phenix"); PDFs gerados no navegador; até 12 MB por e-mail, divide em partes; destinatários em `inspecao_config` |
| Histórico + O que mudou | cabeçalho → Histórico | PDF/Word de qualquer revisão; `comparador.js` (tradução de Comparador.cs) |
| Corrigir texto | descrição de cada item e conclusão | `corretor.js` (LanguageTool direto do navegador) |
| Importar do desktop | lista → Mais | `troca.js`: pasta das inspeções ou `.zip`; mesmo número; itens, fotos com legenda, revisões; número existente é pulado (pode rodar de novo) |
| Exportar `.zip` | cabeçalho → Exportar | formato do desktop (o programa importa de volta) |
| Lixeira | lista → filtro Lixeira (aprovador) | Restaurar |
| Tipos de detalhamento | lista → Mais (aprovador) | tabela `inspecao_tipos_detalhamento`: padrão (toda nova nasce com eles) e outros; ordem, ativo. O desktop segue com a lista fixa |

Navegação: abrir uma inspeção é um passo no histórico do navegador (voltar/gesto do celular volta à
lista); com a Inspeção aberta o cabeçalho do Radar fica compacto no celular, o "Voltar" duplicado sai e o
cabeçalho da inspeção fica fixo ao rolar; menus fecham ao tocar fora ou com Esc.

**Bugs achados nos testes e corrigidos:** releitura ao vivo lendo os itens antes de serem gravados
(apagava a descrição); reabrir + alterar + finalizar fechando a revisão antiga (00 em vez de 01); botão
dentro de `<label>` roubando o rótulo da caixa de texto; Inspeção fora das telas do histórico do Radar
(qualquer "voltar" ia para o Meu Dia); cabeçalho fixo anulado pelo `overflow-x: hidden` do celular; menu
do celular cobrindo o próprio botão sem como fechar.

**Testes (28/10/2026, madrugada):** navegação em desktop/notebook/celular sem erros; 12 funções no
navegador: cliente do cadastro, corrigir texto, PDF (conferido visualmente), Word (conteúdo conferido),
finalizar → reabrir → rev 01 → histórico → o que mudou, PDF da revisão antiga, **e-mail real** (para a
própria conta do Radar), exportar `.zip`, voltar/avançar do navegador, tipos, lixeira/restaurar,
importar (inspeção de exemplo no formato do desktop: 12 itens e 1 revisão; as fotos falharam como
esperado porque o Drive não está autorizado). Dados de teste apagados.

## Parte 3 (28/10/2026, tarde)

| Função | Onde | Observação |
|---|---|---|
| Lote no card | lista de inspeções | chip destacado na cor do status (verde = finalizada, âmbar = em edição), lido de `dados_gerais` (rótulo "Lote"). A query da lista (`api.js`) passou a trazer `dados_gerais`; sem coluna nova nem migração, vale para existentes e importadas. Pedido do usuário: "o lote é crucial e deve aparecer" |
| Busca por lote | campo de busca da lista | o filtro passou a considerar o lote; placeholder atualizado |

Irmão desktop: o "Lote" já existia lá (origem do dado); aqui só passou a ser exibido — nada a levar junto.

**Importação real (28/10/2026):** rodada a importação da pasta real do desktop
(`\\100.91.50.50\Inspecoes\Inspecoes`), subindo **só a inspeção nova** nº `20261028-165038`
(cliente Fitesa, finalizada rev 00, 5 detalhamentos, **7 fotos** enviadas ao Google Drive, 1 revisão
no histórico). Feita pela própria tela do Radar (Mais → Importar do programa desktop), com sessão de
admin — nada de inserção direta no banco. Idempotente: número que já existe é pulado, então dá para
apontar a pasta inteira que só as novas entram. Commits: `d1d9680` (Lote + busca + largura).

## Parte 4 (29/10/2026): medidas informadas x aferidas

Recebimento com dois grupos de medidas: **Medidas informadas** (`CFM informado`, `Espessura informada`,
`Gramatura informada`, `Largura informada`, `Comprimento informado`, `Largura da emenda informada`) e
**Medidas aferidas (Phenix)**, que mantêm os rótulos antigos (`CFM`, `Espessura`, ...): inspeções gravadas
e o formato do `inspecao.json` não mudam, sem migração. **`Largura da emenda`** virou campo padrão (já
existia como "outro campo" com esse rótulo exato, que passa a cair no campo padrão). A saída usa
`CAMPOS_TECNICOS_SAIDA` (só aferidas). Campo padrão preenchido numa inspeção antiga entra na ordem do
padrão (o relatório segue a ordem da lista).

Irmão desktop alterado na mesma entrega: `Inspecao.cs` (`CamposTecnicosPadrao` + `CamposTecnicosSaidaPadrao`)
e `MainForm.cs` (cartão do recebimento com 6 linhas); publicado em `Publicar\MWInspecaoQualidade`
(falta rodar `Atualizar.cmd` para levar à rede). No desktop os campos ficam numa grade única, sem os títulos
dos grupos; os rótulos distinguem.

## Parte 5 (29/10/2026): fotos do relatório padronizadas

Antes: moldura deitada 8,2 × 6,2 (foto sozinha 13 × 9,5) e encolhimento até 60% no fim da página. Como
63 de 89 fotos são em pé bem compridas (0,46) e 15 deitadas bem largas (2,17), os tamanhos variavam muito.
Agora (escolha do usuário): **moldura única em pé 7,5 × 10 cm (3:4), duas por linha** (três deixaria foto de
documento ilegível), linha incompleta centralizada, foto inteira sem corte e sobra cinza (`FUNDO_MOLDURA`),
no PDF, sem espaço no fim da página, a **linha inteira encolhe junto até 60%** (molduras da linha seguem
iguais); abaixo disso vai para a próxima. O Word não encolhe (quem pagina é o Word). `MOLDURA_FOTO` em
`modelo.js` = `LayoutFotos.Moldura` no desktop (Word com uma tabela por linha). Conferido no PDF da inspeção
real 20261028-165038: 4 páginas (sem encolher seriam 6).

## Parte 6 (29/10/2026): checklist para impressão e menu volta à lista

- **Checklist:** botão na lista (raiz), para todos com acesso. `checklist.js` (jsPDF, carregado só ao
  gerar) monta um PDF em branco: identificação, `GRUPOS_TEC` (agora em `modelo.js`, mesmos grupos da tela)
  e os itens em `titulosDetalhamentoPadrao()` (`api.js`, a mesma ordem com que a inspeção nova nasce:
  tipos padrão do cadastro ou a lista fixa), cada um com OK / Não conforme / N.A. / Foto + linhas; outros
  itens, conclusão e assinatura. Abre em nova aba (aberta no clique, senão o navegador bloqueia); sem aba,
  baixa o arquivo. Só no Radar: o desktop não tem (avaliar se precisa).
- **Menu Inspeções → lista:** o Radar soma 1 em `irParaLista` a cada clique; a página tira `?inspecao` da
  barra e volta à lista. O Editor, ao desmontar, salva o pendente e libera a trava (nada se perde).
- Testado em 1920/1366/390: abrir inspeção → menu → lista, sem erros; celular com Nova inspeção em cima e
  Checklist/Mais embaixo.

## Parte 7 (29/10/2026): campos adicionais "Imprimir", PDF interno e recebimento dividido

- **Imprimir:** cada campo de "Outros campos" (identificação, técnicas e saída) tem a caixa Imprimir. Gravado
  no próprio item do jsonb (`{ rotulo, valor, imprimir }`; no desktop `Campo.Imprimir`, `bool?`). Regra
  (`imprimeParaCliente` / `Inspecao.CamposRelatorio`): campo padrão sempre sai; adicional só com
  `imprimir === true`. **Os existentes, sem a marca, ficam "não imprimir"** - por isso não houve migration nem
  alteração nos `inspecao.json` do desktop. Campo novo nasce **desmarcado** (decisão do usuário).
- **Adicionais em bloco próprio na impressão:** em cada seção (saída, dados gerais, técnicas) os adicionais saem
  depois dos padrão, sob o subtítulo **Informações adicionais** (`separarAdicionais` / `Inspecao.SoAdicionais`);
  na versão do cliente só os marcados, no PDF interno todos.
- **Versão do cliente x interna:** PDF, Word e o e-mail (anexo e a tabela do corpo) são a versão do cliente,
  sem os "não imprimir". **PDF interno** (cabeçalho da inspeção e Histórico no Radar; botão no rodapé do
  desktop) sai completo, com a faixa vermelha "VERSÃO INTERNA - USO EXCLUSIVO PHENIX - NÃO ENVIAR AO CLIENTE" e
  arquivo `..._INTERNO.pdf`. No desktop o PDF interno não conta como "revisão gerada". O Histórico do desktop
  segue só com a versão do cliente.
- **Recebimento dividido na impressão:** "Informações técnicas" ganhou subtítulos - **Informações do
  cliente** (equipamento, medidas informadas, material) e **Medições internas (Phenix)**
  (`MEDIDAS_AFERIDAS`). A saída continua com uma tabela só (só tem medidas da Phenix).
- **Lote no e-mail:** a frase do corpo (uma inspeção) e a tabela (várias) mostram o Lote, no Radar e no desktop.
- Importar/Exportar `.zip` (`troca.js`) leva a marca nos dois sentidos (`Imprimir` no formato do desktop).
- Desktop irmão alterado na mesma entrega: `Inspecao.cs`, `PdfService`, `WordService`, `MainForm` (coluna
  Imprimir na grade de outros campos, botão PDF interno, corpo do e-mail). Publicado em `Publicar` (falta o
  `Atualizar.cmd`).
- Testado: PDF do cliente x interno com campo antigo, desmarcado e marcado (só o marcado sai no do
  cliente), Word gerado; tela em 1920/1366/390 sem erros nem rolagem lateral, voltar à lista ok.

## Falta

- [x] Google Drive autorizado (28/10/2026, projeto do Google "Em produção", segredos gravados) e fotos testadas: upload, celular pelo QR, foto ampliada (legenda/ordem/tirar), reabrir, PDF/Word/zip com fotos
- [x] Importar com fotos (junto com a pasta real do desktop) — nº 20261028-165038, 7 fotos ao Drive, sem avisos (28/10/2026)
- [x] Rodar o Importar com a pasta real do desktop — pasta `\\100.91.50.50\Inspecoes\Inspecoes` (28/10/2026)
- [ ] Desktop: busca de cliente e cadastro de tipos existem só no Radar (regra irmã: avaliar levar ao desktop ou aceitar a diferença)
- [ ] Oficializar: histórico de migrations, merge na `main`, rota `/inspecao/celular` no Cloudflare
