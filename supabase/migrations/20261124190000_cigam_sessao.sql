-- Sessão do CIGAM reaproveitada pela função cigam-acompanhamentos (login no portal leva ~20 s).
-- Uma linha só. Sem políticas: só a service_role (a função) lê e grava; anon/authenticated não enxergam.
create table if not exists public.cigam_sessao (
  id smallint primary key default 1 check (id = 1),
  jar jsonb not null,
  token text not null,
  criada_em timestamptz not null default now(),
  validada_em timestamptz not null default now()
);

alter table public.cigam_sessao enable row level security;
revoke all on public.cigam_sessao from anon, authenticated;

comment on table public.cigam_sessao is
  'Cookies/token da sessão do Portal Representante do CIGAM usados pela função cigam-acompanhamentos. Só service_role.';
