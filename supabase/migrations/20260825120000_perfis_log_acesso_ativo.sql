alter table public.perfis
  add column if not exists log_acesso_ativo boolean not null default false;

comment on column public.perfis.log_acesso_ativo is
  'Quando true, o Radar grava login/logout/navegacao de telas deste usuario em public.log_acessos.';
