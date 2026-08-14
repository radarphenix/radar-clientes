create table if not exists public.configuracoes_agenda_geral (
  id boolean primary key default true,
  token uuid not null default gen_random_uuid(),
  atualizado_por uuid references auth.users(id),
  atualizado_em timestamptz not null default timezone('utc', now()),
  constraint configuracoes_agenda_geral_linha_unica check (id)
);

insert into public.configuracoes_agenda_geral (id)
values (true)
on conflict (id) do nothing;

comment on table public.configuracoes_agenda_geral is
  'Configuracao de linha unica com o token do feed .ics agregando as visitas de todos os tecnicos (agenda geral, uso de diretores).';

alter table public.configuracoes_agenda_geral enable row level security;

drop policy if exists "configuracoes_agenda_geral_admin_select"
on public.configuracoes_agenda_geral;

create policy "configuracoes_agenda_geral_admin_select"
on public.configuracoes_agenda_geral
for select
to authenticated
using (public.radar_perfil_atual_tipo() = 'admin');

drop policy if exists "configuracoes_agenda_geral_admin_write"
on public.configuracoes_agenda_geral;

create policy "configuracoes_agenda_geral_admin_write"
on public.configuracoes_agenda_geral
for update
to authenticated
using (public.radar_perfil_atual_tipo() = 'admin')
with check (public.radar_perfil_atual_tipo() = 'admin');
