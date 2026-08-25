create table if not exists public.log_acessos (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  evento text not null,
  tela text,
  criado_em timestamptz not null default now(),
  constraint log_acessos_evento_check check (evento in ('LOGIN', 'LOGOUT', 'TELA'))
);

create index if not exists log_acessos_user_id_criado_em_idx
  on public.log_acessos (user_id, criado_em desc);

create index if not exists log_acessos_evento_criado_em_idx
  on public.log_acessos (evento, criado_em desc);

alter table public.log_acessos enable row level security;

drop policy if exists "log_acessos_insert_proprio" on public.log_acessos;

create policy "log_acessos_insert_proprio"
on public.log_acessos
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "log_acessos_select_admin" on public.log_acessos;

create policy "log_acessos_select_admin"
on public.log_acessos
for select
to authenticated
using (public.radar_perfil_atual_tipo() = 'admin');

grant insert, select on table public.log_acessos to authenticated;
