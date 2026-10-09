-- Devoluções de venda para o BI de Faturamento (faturado líquido = notas de saída - devoluções).
-- Origem: CIGAM.EX_MW_VW_RADAR_FATURAMENTO_DEVOLUCOES (ESMOVIME 'E' com CFOP 1201/2201/3201,
-- mesma regra do MWComissoes). Leitura só de admin, como os outros espelhos bi_*.
create table if not exists public.bi_devolucoes_itens (
  id text primary key,
  nf text not null,
  serie text not null default '',
  codigo_cliente text not null,
  nome_cliente text not null default '',
  movimento numeric,
  sequencia_item numeric not null default 0,
  data_movimento date not null,
  cfop text not null default '',
  cd_operacao text not null default '',
  nota_origem text,
  codigo_material text not null default '',
  descricao_item text not null default '',
  quantidade numeric(15,4) not null default 0,
  valor_unitario numeric(15,4) not null default 0,
  valor_liquido numeric(15,2) not null default 0,
  codigo_representante text not null default '000000',
  nome_representante text not null default '',
  sincronizado_em timestamptz not null default timezone('utc', now())
);

create index if not exists bi_devolucoes_itens_data_idx on public.bi_devolucoes_itens (data_movimento);
create index if not exists bi_devolucoes_itens_origem_idx on public.bi_devolucoes_itens (codigo_cliente, nota_origem);

alter table public.bi_devolucoes_itens enable row level security;
revoke all on public.bi_devolucoes_itens from anon, authenticated;
grant select on public.bi_devolucoes_itens to authenticated;
grant all on public.bi_devolucoes_itens to service_role;
create policy "admin consulta devolucoes bi" on public.bi_devolucoes_itens
  for select to authenticated using (public.radar_perfil_atual_tipo() = 'admin');
