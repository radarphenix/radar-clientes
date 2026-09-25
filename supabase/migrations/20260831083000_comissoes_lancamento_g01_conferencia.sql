-- Lancamento companheiro G01 encontrado para a mesma parcela R01.
-- Campo apenas informativo, usado pelo sync para alertar a duplicidade sem
-- enviar o G01 como uma segunda parcela comissionavel.
alter table public.comissoes_lancamentos
  add column if not exists codigo_lancamento_g01_conferencia bigint;

comment on column public.comissoes_lancamentos.codigo_lancamento_g01_conferencia is
  'Codigo do lancamento G01 correspondente, usado somente para conferencia de duplicidade.';
