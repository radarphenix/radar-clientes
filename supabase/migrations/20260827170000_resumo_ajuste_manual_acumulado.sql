alter table public.comissoes_resumos_mensais
  add column if not exists valor_ajuste_percentual_manual numeric(15,2) not null default 0;

comment on column public.comissoes_resumos_mensais.valor_ajuste_percentual_manual is
  'Efeito mensal acumulado do ultimo percentual manual vigente; exibido somente no historico anual.';
