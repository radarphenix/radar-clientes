-- Explicita no Radar a origem dos ajustes de comissao sem alterar a RLS existente.
alter table public.comissoes_lancamentos
  add column if not exists tipo_lancamento text not null default 'COMISSAO',
  add column if not exists percentual_sistema numeric(7,4) not null default 0,
  add column if not exists percentual_manual numeric(7,4),
  add column if not exists motivo_ajuste text not null default '',
  add column if not exists valor_comissao_antes numeric(15,2) not null default 0,
  add column if not exists valor_ajuste_manual numeric(15,2) not null default 0;

alter table public.comissoes_resumos_mensais
  add column if not exists percentual_sistema numeric(7,4) not null default 0,
  add column if not exists percentual_manual numeric(7,4),
  add column if not exists motivo_percentual_manual text not null default '',
  add column if not exists valor_descontos numeric(15,2) not null default 0;

comment on column public.comissoes_lancamentos.tipo_lancamento is
  'COMISSAO, AJUSTE_PERCENTUAL, DESCONTO ou DEVOLUCAO.';
comment on column public.comissoes_lancamentos.motivo_ajuste is
  'Justificativa visivel ao representante para descontos e percentuais manuais.';
comment on column public.comissoes_resumos_mensais.percentual_sistema is
  'Percentual calculado originalmente pela faixa/meta, antes de override manual.';
comment on column public.comissoes_resumos_mensais.valor_descontos is
  'Descontos financeiros do mes; nao integram vendas, meta ou faixa.';
