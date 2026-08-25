-- CORRECAO DE SEGURANCA: as tabelas base "clientes" e "perfis" foram criadas
-- direto no Studio antes de este projeto adotar migrations versionadas, e
-- acumularam policies antigas "libera tudo para autenticado/anon" que nunca
-- foram removidas quando as regras corretas (representante ve so a propria
-- carteira, token de agenda e privado) foram adicionadas depois. Resultado
-- confirmado em producao via `supabase db query --linked` + `pg_policies`:
--   - clientes: role "anon" conseguia ler a tabela inteira (SELECT true);
--     qualquer usuario autenticado conseguia ler/editar/apagar qualquer
--     cliente, inclusive fora da propria carteira do representante;
--   - perfis: qualquer usuario autenticado conseguia ler o perfil de
--     qualquer outro usuario, inclusive a coluna calendario_token (o
--     "segredo" que autentica o feed .ics pessoal sem login) -- ou seja,
--     qualquer representante podia sequestrar a agenda de outro tecnico.
--
-- Esta migration:
--   1) isola calendario_token da tabela perfis numa tabela propria com RLS
--      restrita a admin ou ao proprio dono da linha;
--   2) remove as policies soltas de clientes (anon e "true" para
--      authenticated) e garante que a policy correta cubra tecnico (que
--      sempre viu todos os clientes, so representante era restrito -- ver
--      CONTEXTO_PROJETO.md, bloco "Ajuste da regra de visibilidade de
--      clientes para perfil representante");
--   3) troca as policies de escrita restrita a admin (delete/insert/update
--      de clientes, insert de importacoes) da funcao legada usuario_admin()
--      (le a tabela perfis_usuarios, parada em 2 linhas, sem trigger de
--      sincronizacao com perfis) para radar_perfil_atual_tipo(), a mesma
--      funcao usada por todas as policies novas -- sem essa troca, qualquer
--      admin criado depois da funcao criar-usuario ficaria bloqueado dessas
--      acoes assim que as policies soltas fossem removidas.

-- 1) Isola o token de agenda pessoal numa tabela com RLS proprio.
create table if not exists public.perfis_tokens (
  user_id uuid primary key references public.perfis (user_id) on delete cascade,
  calendario_token uuid not null default gen_random_uuid()
);

insert into public.perfis_tokens (user_id, calendario_token)
select user_id, calendario_token
from public.perfis
on conflict (user_id) do nothing;

create unique index if not exists perfis_tokens_calendario_token_idx
  on public.perfis_tokens (calendario_token);

alter table public.perfis_tokens enable row level security;

drop policy if exists "perfis_tokens_select_proprio_ou_admin" on public.perfis_tokens;

create policy "perfis_tokens_select_proprio_ou_admin"
on public.perfis_tokens
for select
to authenticated
using (
  user_id = auth.uid()
  or public.radar_perfil_atual_tipo() = 'admin'
);

drop policy if exists "perfis_tokens_update_admin" on public.perfis_tokens;

create policy "perfis_tokens_update_admin"
on public.perfis_tokens
for update
to authenticated
using (public.radar_perfil_atual_tipo() = 'admin')
with check (public.radar_perfil_atual_tipo() = 'admin');

revoke all on public.perfis_tokens from anon, authenticated;
grant select, update on public.perfis_tokens to authenticated;

comment on table public.perfis_tokens is
  'Token secreto do feed de agenda (.ics) de cada usuario, isolado de perfis para nao vazar via policies amplas de leitura de perfil.';

alter table public.perfis drop column if exists calendario_token;

-- 2) Remove exposicao publica e vazamento entre representantes em clientes.
drop policy if exists "clientes_select_anon_teste" on public.clientes;
drop policy if exists "usuarios_logados_podem_ler_clientes" on public.clientes;
drop policy if exists "clientes_select_autenticado" on public.clientes;
drop policy if exists "usuarios_logados_podem_excluir_clientes" on public.clientes;

drop policy if exists "clientes_select_por_clientes_representantes" on public.clientes;

create policy "clientes_select_por_clientes_representantes"
on public.clientes
for select
to authenticated
using (
  public.radar_perfil_atual_tipo() in ('admin', 'tecnico')
  or (
    public.radar_perfil_atual_tipo() = 'representante'
    and (
      codigo_representante = any(
        public.radar_codigos_numericos_equivalentes(
          public.radar_perfil_atual_codigo_representante()
        )
      )
      or exists (
        select 1
        from public.clientes_representantes cr
        where cr.codigo_cliente = any(
          public.radar_codigos_numericos_equivalentes(clientes.codigo_cliente)
        )
          and cr.codigo_representante = any(
            public.radar_codigos_numericos_equivalentes(
              public.radar_perfil_atual_codigo_representante()
            )
          )
      )
    )
  )
);

-- 3) Moderniza as policies de escrita restrita a admin (paravam de
--    funcionar para admins novos por dependerem da tabela legada).
drop policy if exists "clientes_delete_admin" on public.clientes;

create policy "clientes_delete_admin"
on public.clientes
for delete
to authenticated
using (public.radar_perfil_atual_tipo() = 'admin');

drop policy if exists "clientes_insert_admin" on public.clientes;

create policy "clientes_insert_admin"
on public.clientes
for insert
to authenticated
with check (public.radar_perfil_atual_tipo() = 'admin');

drop policy if exists "clientes_update_admin" on public.clientes;

create policy "clientes_update_admin"
on public.clientes
for update
to authenticated
using (public.radar_perfil_atual_tipo() = 'admin')
with check (public.radar_perfil_atual_tipo() = 'admin');

drop policy if exists "importacoes_insert_admin" on public.importacoes;

create policy "importacoes_insert_admin"
on public.importacoes
for insert
to authenticated
with check (public.radar_perfil_atual_tipo() = 'admin');

-- Nota: INSERT/UPDATE de clientes por qualquer usuario autenticado
-- (usuarios_logados_podem_inserir_clientes / usuarios_logados_podem_atualizar_clientes)
-- foi mantido de proposito -- representante/tecnico cadastram e corrigem
-- dados de cliente em campo como parte do fluxo normal do Radar. Revisar
-- com o cliente do produto se isso deve ser restrito tambem.
