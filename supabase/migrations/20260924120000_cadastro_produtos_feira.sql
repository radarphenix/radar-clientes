create extension if not exists pgcrypto;

create table if not exists public.cadastro_produtos_feira_phenix (
  id uuid primary key default gen_random_uuid(),
  empresa text not null check (char_length(empresa) between 2 and 160),
  contato text not null check (char_length(contato) between 2 and 160),
  telefone text not null check (char_length(telefone) between 8 and 30),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  responsavel text not null check (char_length(responsavel) between 2 and 160),
  maquina text not null check (char_length(maquina) between 1 and 160),
  tipo_papel text not null check (tipo_papel in ('Tissue','Marrom')),
  produto text not null,
  modelo text,
  posicao text,
  cfm text not null,
  gramatura text not null,
  espessura text not null,
  teflonada boolean not null default false,
  durabilidade text not null,
  velocidade_maquina text not null,
  informacoes_adicionais text not null default '' check (char_length(informacoes_adicionais) <= 5000),
  criado_em timestamptz not null default now()
);

comment on table public.cadastro_produtos_feira_phenix is 'Cadastros de produtos e máquinas realizados por representantes na feira Veste Phenix.';
create index if not exists cadastro_produtos_feira_criado_em_idx on public.cadastro_produtos_feira_phenix (criado_em desc);
alter table public.cadastro_produtos_feira_phenix enable row level security;
revoke all on public.cadastro_produtos_feira_phenix from anon, authenticated;
