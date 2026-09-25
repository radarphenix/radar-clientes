# Orientações para agentes de IA

- Acesso ao Supabase CLI (migrations, `db query`, deploy de Edge Functions): siga **`ACESSO_SUPABASE_CLI.md`** antes de rodar qualquer comando `supabase`. Cada projeto deste computador usa uma chave própria num arquivo local não versionado; nunca use `supabase login`/`logout` nem exiba, peça no chat ou commite a chave.
- App da feira Veste Phenix, cadastro de produtos, relatório admin e **instalação de Radar e Veste Phenix como apps separados**: leia **`FEIRA_VESTE_PHENIX.md`** antes de mexer em `vite.config.js`, `src/main.jsx`, `feira/`, manifestos ou service worker. Nunca volte o `scope` do Radar para `/`.
- Toda migration aplicada no banco precisa estar versionada em `supabase/migrations/`; senão o workflow "Deploy Supabase Radar" falha.
- Contexto do projeto: `CONTEXTO_PROJETO.md` e `README.md`. Manual do usuário: `MANUAL_USUARIO.md` (atualizar junto com mudanças visíveis).
