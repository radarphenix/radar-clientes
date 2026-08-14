alter table public.perfis
  add column if not exists calendario_token uuid not null default gen_random_uuid();

create unique index if not exists perfis_calendario_token_idx
  on public.perfis (calendario_token);

comment on column public.perfis.calendario_token is
  'Token secreto usado para autenticar o feed de agenda (.ics) do usuario, sem exigir login.';
