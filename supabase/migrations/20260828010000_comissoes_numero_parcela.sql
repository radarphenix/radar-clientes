-- Numero real da parcela na CIGAM (FATURA/COMPLEMENTO, ex "1/001"), distinto
-- de codigo_lancamento (id interno sequencial da GFLANCAM, sem significado de
-- negocio). Permite detectar duplicidade de verdade: a mesma nota_fiscal +
-- representante nunca deveria ter duas linhas com o mesmo numero_parcela -
-- achado ao vivo em 28/08/2026 (NF 10415, lancamento fantasma da GFLANCAM
-- E01/E57 - ver MWComissoesSync/MWCOMISSOESSYNC_ACOMPANHAMENTO.md). Nulo para
-- as linhas sinteticas de desconto/ajuste manual, que nao tem FATURA/COMPLEMENTO.
alter table public.comissoes_lancamentos
  add column if not exists numero_parcela text;

comment on column public.comissoes_lancamentos.numero_parcela is
  'Numero real da parcela na CIGAM (FATURA/COMPLEMENTO). Nulo em linhas de desconto/ajuste manual. Nao confundir com codigo_lancamento (id interno, sem significado de negocio).';
