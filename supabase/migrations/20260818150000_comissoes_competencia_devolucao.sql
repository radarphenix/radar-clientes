-- Memoria consultiva da competencia original afetada por devolucoes.

alter table public.comissoes_lancamentos
  add column if not exists competencia_origem_devolucao date,
  add column if not exists ajuste_faixa_pago numeric(15,2) not null default 0,
  add column if not exists ajuste_faixa_pendente numeric(15,2) not null default 0,
  add column if not exists vendas_competencia_original numeric(15,2) not null default 0,
  add column if not exists vendas_competencia_recalculada numeric(15,2) not null default 0,
  add column if not exists percentual_faixa_original numeric(7,4) not null default 0,
  add column if not exists percentual_faixa_recalculado numeric(7,4) not null default 0;

alter table public.comissoes_resumos_mensais
  add column if not exists ajuste_faixa_pago numeric(15,2) not null default 0,
  add column if not exists ajuste_faixa_pendente numeric(15,2) not null default 0,
  add column if not exists comissao_gerada numeric(15,2) not null default 0;

comment on column public.comissoes_lancamentos.competencia_origem_devolucao is
  'Mes da nota de venda cuja comissao foi revisada pela devolucao';
comment on column public.comissoes_resumos_mensais.comissao_gerada is
  'Comissao original das notas emitidas no mes, antes dos descontos processados no proprio mes';
