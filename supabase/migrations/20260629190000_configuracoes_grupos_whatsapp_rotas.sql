create table if not exists public.configuracoes_grupos (
  tipo_perfil text primary key,
  permite_aviso_whatsapp_rota boolean not null default true,
  atualizado_por uuid references auth.users(id),
  atualizado_em timestamptz not null default timezone('utc', now())
);

insert into public.configuracoes_grupos (tipo_perfil, permite_aviso_whatsapp_rota)
values
  ('admin', true),
  ('tecnico', true),
  ('representante', true)
on conflict (tipo_perfil) do nothing;

alter table public.configuracoes_grupos enable row level security;

drop policy if exists "configuracoes_grupos_select"
on public.configuracoes_grupos;

create policy "configuracoes_grupos_select"
on public.configuracoes_grupos
for select
to authenticated
using (
  public.radar_perfil_atual_tipo() = 'admin'
  or tipo_perfil = public.radar_perfil_atual_tipo()
);

drop policy if exists "configuracoes_grupos_admin_write"
on public.configuracoes_grupos;

create policy "configuracoes_grupos_admin_write"
on public.configuracoes_grupos
for all
to authenticated
using (public.radar_perfil_atual_tipo() = 'admin')
with check (public.radar_perfil_atual_tipo() = 'admin');
