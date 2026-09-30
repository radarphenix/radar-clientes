-- Espelhos consultivos do CIGAM para o Painel BI de Faturamento.
-- FAPEDIDO.CD_PEDIDO = FAITEMPE.CD_PEDIDO; ESMOVIME.NF + SERIE + CD_EMPRESA;
-- GFLANCAM.NF + SERIE + CD_EMPRESA. O sync traz ESMOVIME só em saída ('S').
create table if not exists public.bi_pedidos_itens (
 id text primary key, cd_pedido text not null, sequencia_item numeric not null default 0, data_pedido date not null, data_previsao date, situacao_pedido text not null default '', codigo_cliente text not null, codigo_empresa text, nome_cliente text not null default '', codigo_material text not null default '', descricao_item text not null default '', quantidade numeric(15,4) not null default 0, quantidade_saldo numeric(15,4) not null default 0, valor_unitario numeric(15,4) not null default 0, valor_liquido numeric(15,2) not null default 0, sincronizado_em timestamptz not null default timezone('utc', now())
);
create table if not exists public.bi_notas_itens (
 id text primary key, nf text not null, serie text not null default '', cd_empresa text not null, movimento numeric, sequencia_item numeric not null default 0, data_movimento date not null, tipo_movimento text not null check (tipo_movimento = 'S'), documento_origem text, codigo_material text not null default '', descricao_item text not null default '', quantidade numeric(15,4) not null default 0, valor_unitario numeric(15,4) not null default 0, valor_liquido numeric(15,2) not null default 0, sincronizado_em timestamptz not null default timezone('utc', now())
);
create table if not exists public.bi_lancamentos_financeiros (
 id text primary key, cd_lancamento text not null unique, nf text not null, serie text not null default '', cd_empresa text not null, data_emissao date, data_vencimento date not null, data_ultima_liquidacao date, valor numeric(15,2) not null default 0, valor_saldo numeric(15,2) not null default 0, situacao text not null default '', tipo text not null default '', documento text, sincronizado_em timestamptz not null default timezone('utc', now())
);
create index if not exists bi_pedidos_itens_data_idx on public.bi_pedidos_itens (data_pedido);
create index if not exists bi_notas_itens_nota_idx on public.bi_notas_itens (nf, serie, cd_empresa);
create index if not exists bi_notas_itens_data_idx on public.bi_notas_itens (data_movimento);
create index if not exists bi_financeiro_nota_idx on public.bi_lancamentos_financeiros (nf, serie, cd_empresa);
create index if not exists bi_financeiro_vencimento_idx on public.bi_lancamentos_financeiros (data_vencimento);
alter table public.bi_pedidos_itens enable row level security; alter table public.bi_notas_itens enable row level security; alter table public.bi_lancamentos_financeiros enable row level security;
revoke all on public.bi_pedidos_itens, public.bi_notas_itens, public.bi_lancamentos_financeiros from anon, authenticated;
grant select on public.bi_pedidos_itens, public.bi_notas_itens, public.bi_lancamentos_financeiros to authenticated;
grant all on public.bi_pedidos_itens, public.bi_notas_itens, public.bi_lancamentos_financeiros to service_role;
create policy "admin consulta pedidos bi" on public.bi_pedidos_itens for select to authenticated using (public.radar_perfil_atual_tipo() = 'admin');
create policy "admin consulta notas bi" on public.bi_notas_itens for select to authenticated using (public.radar_perfil_atual_tipo() = 'admin');
create policy "admin consulta financeiro bi" on public.bi_lancamentos_financeiros for select to authenticated using (public.radar_perfil_atual_tipo() = 'admin');
