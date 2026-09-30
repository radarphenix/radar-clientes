-- Vínculo explícito da nota ao item do pedido de origem (ESMOVIME).
-- Permite separar faturamento previsto atingido, pendente e não previsto.
alter table public.bi_notas_itens
  add column if not exists codigo_cliente text,
  add column if not exists nome_cliente text not null default '',
  add column if not exists pedido_origem text,
  add column if not exists sequencia_pedido_origem numeric;

create index if not exists bi_notas_itens_origem_pedido_idx
  on public.bi_notas_itens (codigo_cliente, pedido_origem, sequencia_pedido_origem);

comment on column public.bi_notas_itens.pedido_origem is
  'Pedido comercial de origem informado pela ESMOVIME.PEDIDO_OC.';
comment on column public.bi_notas_itens.sequencia_pedido_origem is
  'Sequência do item de origem informada pela ESMOVIME.SEQ_PEDIDO_O.';
