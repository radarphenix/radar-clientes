-- O controle do item de pedido é a regra comercial de faturamento.
-- Controle 50 significa item efetivamente faturado no CIGAM.
alter table public.bi_pedidos_itens
  add column if not exists situacao_item text not null default '',
  add column if not exists controle_item numeric;

create index if not exists bi_pedidos_itens_controle_idx
  on public.bi_pedidos_itens (controle_item);
