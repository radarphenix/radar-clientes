-- Representante no espelho do BI de Faturamento, para o filtro dos gestores.
-- Pedido: FAPEDIDO.CD_REPRESENTANT. Nota: FANFISCA.CD_REPRESENTANT.
-- '000000' = venda sem representante (mesma convenção das comissões).
alter table public.bi_pedidos_itens
  add column if not exists codigo_representante text not null default '000000',
  add column if not exists nome_representante text not null default '';

alter table public.bi_notas_itens
  add column if not exists codigo_representante text not null default '000000',
  add column if not exists nome_representante text not null default '';

create index if not exists bi_pedidos_itens_representante_idx
  on public.bi_pedidos_itens (codigo_representante);
create index if not exists bi_notas_itens_representante_idx
  on public.bi_notas_itens (codigo_representante);
