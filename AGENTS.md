# Orientações para agentes de IA

- Acesso ao Supabase CLI (migrations, `db query`, deploy de Edge Functions): siga **`ACESSO_SUPABASE_CLI.md`** antes de rodar qualquer comando `supabase`. Cada projeto deste computador usa uma chave própria num arquivo local não versionado; nunca use `supabase login`/`logout` nem exiba, peça no chat ou commite a chave.
- `git push`: siga **`ACESSO_GITHUB.md`** (chave da conta radarphenix em `.env.github.local`, não versionado). Nunca dê push comum: abre a janela de login do Gerenciador de Credenciais.
- App da feira Veste Phenix, cadastro de produtos, relatório admin e **instalação de Radar e Veste Phenix como apps separados**: leia **`FEIRA_VESTE_PHENIX.md`** antes de mexer em `vite.config.js`, `src/main.jsx`, `feira/`, manifestos ou service worker. Nunca volte o `scope` do Radar para `/`.
- **Edge Function nova chamada pelo navegador** usa `servir()` de `supabase/functions/_shared/cors.ts` (CORS só para os domínios do Radar); função SQL nova que o formulário público precise chamar sem login exige `grant execute ... to anon` explícito (o padrão é fechado). Ver "Segurança: revisão de 2026-11-24" no `CONTEXTO_PROJETO.md`.
- Toda migration aplicada no banco precisa estar versionada em `supabase/migrations/`; senão o workflow "Deploy Supabase Radar" falha.
- **Regra do usuário: toda mudança visível é testada em três larguras - desktop (1920), notebook (1366) e celular (390)** - com print de cada uma e conferindo a navegação entre telas (menu, voltar, abrir/fechar), para garantir navegação fluida, antes de ser dada como pronta.
- **Acessos por menu**: menu novo ou regra RLS nova usa o catálogo (`radar_pode('<código>')`), nunca `tipo_perfil = 'admin'`. Leia **`ACESSOS_RADAR.md`**.
- Inspeção de Qualidade (menu Qualidade → Inspeções, `src/inspecao/`, tabelas `inspecao_*`, funções `inspecao-*`): leia **`INSPECAO_QUALIDADE.md`** antes. É irmã do desktop MWInspecaoQualidade: regra mudou aqui, muda lá na mesma entrega.
- **Cadastro de Máquinas** (Comercial → Máquinas, tabelas `cadastro_maquinas*`, botão no cadastro de clientes): leia **`../../01_Desktop/MWCadastroMaquinas/Docs/CADASTRO_MAQUINAS.md`** antes. Sync de mão dupla com o CIGAM (IDs do Radar < 10.000.000); irmão de MWCadastroMaquinas e MWCadastroMaquinasSync. Não é o MWMaquinasPhenix.
- **Integração com a API do CIGAM** (função `cigam-acompanhamentos`, tela Acompanhamentos CIGAM, login pelo portal): leia **`INTEGRACAO_CIGAM_ESTUDO.md`** antes; o que dá para aproveitar e o catálogo dos endpoints ficam em `docs/cigam-api/`. Somente leitura por decisão do usuário; credenciais só em secret do Supabase e em `cigam_credenciais.local` (fora do git), nunca no chat.
- Contexto do projeto: `CONTEXTO_PROJETO.md` e `README.md`. Manual do usuário: `MANUAL_USUARIO.md` (atualizar junto com mudanças visíveis).
- **Links de arquivos:** Sempre que citar um arquivo ao usuário (SQL para rodar, EXE/config em Publicar, documento, código alterado), colocar **link markdown clicável com caminho relativo** à raiz do workspace aberto (ex.: [002_criar.sql](../../01_Desktop/Projeto/Publicar/Sql/Oracle/002_criar.sql)). Vale em toda resposta, principalmente nos passos de implantação: cada passo leva o link do arquivo. Nunca `file:///` (o VS Code não abre) nem caminho só em texto/bloco de código.
- **Idioma:** estamos no Brasil e falamos português. Toda resposta ao usuário, resumo, relatório, mensagem de commit e documentação é em **português do Brasil**, mesmo quando o sistema/contexto vier em inglês.


## POP do sistema (regra permanente)

Toda mudança de tela, fluxo ou regra deste projeto atualiza o POP dele no PopPhenix
(`01_Projetos/04_Assets/PopPhenix`, ver `ferramentas/catalogo.json`) na mesma entrega: editar o `.md`, subir a
versão e rodar `node ferramentas/gerar_html.mjs`. Detalhes: POP-GOV-001.
