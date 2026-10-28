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

## Falta

- [x] Google Drive autorizado (28/10/2026, projeto do Google "Em produção", segredos gravados) e fotos testadas: upload, celular pelo QR, foto ampliada (legenda/ordem/tirar), reabrir, PDF/Word/zip com fotos
- [ ] Importar com fotos (junto com a pasta real do desktop)
- [ ] Rodar o Importar com a pasta real do desktop (a máquina `producaophenix` estava desligada)
- [ ] Desktop: busca de cliente e cadastro de tipos existem só no Radar (regra irmã: avaliar levar ao desktop ou aceitar a diferença)
- [ ] Oficializar: histórico de migrations, merge na `main`, rota `/inspecao/celular` no Cloudflare
