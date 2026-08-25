-- Espelho exclusivamente consultivo das comissoes apuradas no CIGAM.
-- Somente o RadarSync (service_role) grava. Usuarios autenticados apenas leem
-- as linhas do codigo de representante associado ao proprio perfil ativo.

create table if not exists public.comissoes_lancamentos (
  id text primary key,
  codigo_representante text not null,
  codigo_lancamento bigint not null,
  nota_fiscal text not null,
  nota_origem_devolucao text,
  serie text not null default '',
  unidade text not null default '',
  codigo_cliente text not null,
  nome_cliente text not null default '',
  data_emissao date not null,
  data_vencimento date not null,
  valor_parcela numeric(15,2) not null default 0,
  saldo_parcela numeric(15,2) not null default 0,
  valor_base_comissao numeric(15,2) not null default 0,
  percentual_comissao numeric(7,4) not null default 0,
  valor_comissao numeric(15,2) not null default 0,
  estorno_comissao numeric(15,2) not null default 0,
  ajuste_faixa numeric(15,2) not null default 0,
  comissao_futura_cancelada numeric(15,2) not null default 0,
  lancamento_devolucao boolean not null default false,
  considerar boolean not null default true,
  pago boolean not null default false,
  data_pagamento date,
  situacao_financeira text not null default '',
  tipo_comissao text not null default 'F',
  sincronizado_em timestamptz not null default timezone('utc', now()),
  constraint comissoes_lancamentos_representante_lancamento_uk
    unique (codigo_representante, codigo_lancamento)
);

create table if not exists public.comissoes_resumos_mensais (
  codigo_representante text not null,
  ano integer not null,
  mes integer not null check (mes between 1 and 12),
  modalidade text not null default 'F' check (modalidade in ('F', 'V')),
  vendas_brutas numeric(15,2) not null default 0,
  devolucoes numeric(15,2) not null default 0,
  vendas_liquidas numeric(15,2) not null default 0,
  meta_atingida numeric(15,2) not null default 0,
  percentual_comissao numeric(7,4) not null default 0,
  valor_fixo numeric(15,2) not null default 0,
  estorno_comissao numeric(15,2) not null default 0,
  ajuste_faixa numeric(15,2) not null default 0,
  comissao_futura_cancelada numeric(15,2) not null default 0,
  comissao_prevista numeric(15,2) not null default 0,
  comissao_paga numeric(15,2) not null default 0,
  sincronizado_em timestamptz not null default timezone('utc', now()),
  primary key (codigo_representante, ano, mes)
);

create table if not exists public.comissoes_faixas (
  id text primary key,
  codigo_representante text not null,
  valor_meta numeric(15,2) not null default 0,
  percentual_comissao numeric(7,4) not null default 0,
  valor_fixo numeric(15,2) not null default 0,
  sincronizado_em timestamptz not null default timezone('utc', now()),
  constraint comissoes_faixas_representante_meta_uk
    unique (codigo_representante, valor_meta)
);

create index if not exists comissoes_lancamentos_rep_vencimento_idx
  on public.comissoes_lancamentos (codigo_representante, data_vencimento);
create index if not exists comissoes_resumos_rep_ano_idx
  on public.comissoes_resumos_mensais (codigo_representante, ano, mes);
create index if not exists comissoes_faixas_rep_meta_idx
  on public.comissoes_faixas (codigo_representante, valor_meta);

alter table public.comissoes_lancamentos enable row level security;
alter table public.comissoes_resumos_mensais enable row level security;
alter table public.comissoes_faixas enable row level security;

revoke all on public.comissoes_lancamentos from anon, authenticated;
revoke all on public.comissoes_resumos_mensais from anon, authenticated;
revoke all on public.comissoes_faixas from anon, authenticated;
grant select on public.comissoes_lancamentos to authenticated;
grant select on public.comissoes_resumos_mensais to authenticated;
grant select on public.comissoes_faixas to authenticated;
grant all on public.comissoes_lancamentos to service_role;
grant all on public.comissoes_resumos_mensais to service_role;
grant all on public.comissoes_faixas to service_role;

drop policy if exists "representante consulta proprios lancamentos"
  on public.comissoes_lancamentos;
create policy "representante consulta proprios lancamentos"
on public.comissoes_lancamentos for select to authenticated
using (
  public.radar_perfil_atual_tipo() = 'admin'
  or (
    public.radar_perfil_atual_tipo() = 'representante'
    and codigo_representante = any(
      public.radar_codigos_numericos_equivalentes(
        public.radar_perfil_atual_codigo_representante()
      )
    )
  )
);

drop policy if exists "representante consulta proprio resumo"
  on public.comissoes_resumos_mensais;
create policy "representante consulta proprio resumo"
on public.comissoes_resumos_mensais for select to authenticated
using (
  public.radar_perfil_atual_tipo() = 'admin'
  or (
    public.radar_perfil_atual_tipo() = 'representante'
    and codigo_representante = any(
      public.radar_codigos_numericos_equivalentes(
        public.radar_perfil_atual_codigo_representante()
      )
    )
  )
);

drop policy if exists "representante consulta proprias faixas"
  on public.comissoes_faixas;
create policy "representante consulta proprias faixas"
on public.comissoes_faixas for select to authenticated
using (
  public.radar_perfil_atual_tipo() = 'admin'
  or (
    public.radar_perfil_atual_tipo() = 'representante'
    and codigo_representante = any(
      public.radar_codigos_numericos_equivalentes(
        public.radar_perfil_atual_codigo_representante()
      )
    )
  )
);

comment on table public.comissoes_lancamentos is
  'Espelho consultivo de parcelas de comissao geradas no CIGAM';
comment on table public.comissoes_resumos_mensais is
  'Resumo mensal congelado para metas e historico anual do representante';
comment on table public.comissoes_faixas is
  'Faixas de meta da comissao variavel, somente para consulta no Radar';
