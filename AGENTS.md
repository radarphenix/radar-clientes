# Orientações para agentes de IA

- Acesso ao Supabase CLI (migrations, `db query`, deploy de Edge Functions): siga **`ACESSO_SUPABASE_CLI.md`** antes de rodar qualquer comando `supabase`. Cada projeto deste computador usa uma chave própria num arquivo local não versionado; nunca use `supabase login`/`logout` nem exiba, peça no chat ou commite a chave.
- App da feira Veste Phenix, cadastro de produtos, relatório admin e **instalação de Radar e Veste Phenix como apps separados**: leia **`FEIRA_VESTE_PHENIX.md`** antes de mexer em `vite.config.js`, `src/main.jsx`, `feira/`, manifestos ou service worker. Nunca volte o `scope` do Radar para `/`.
- Toda migration aplicada no banco precisa estar versionada em `supabase/migrations/`; senão o workflow "Deploy Supabase Radar" falha.
- **Regra do usuário: toda mudança visível é testada em três larguras - desktop (1920), notebook (1366) e celular (390)** - com print de cada uma e conferindo a navegação entre telas (menu, voltar, abrir/fechar), para garantir navegação fluida, antes de ser dada como pronta.
- **Acessos por menu**: menu novo ou regra RLS nova usa o catálogo (`radar_pode('<código>')`), nunca `tipo_perfil = 'admin'`. Leia **`ACESSOS_RADAR.md`**.
- Inspeção de Qualidade (menu Qualidade → Inspeções, `src/inspecao/`, tabelas `inspecao_*`, funções `inspecao-*`): leia **`INSPECAO_QUALIDADE.md`** antes. É irmã do desktop MWInspecaoQualidade: regra mudou aqui, muda lá na mesma entrega.
- Contexto do projeto: `CONTEXTO_PROJETO.md` e `README.md`. Manual do usuário: `MANUAL_USUARIO.md` (atualizar junto com mudanças visíveis).
