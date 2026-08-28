-- Nota com mais de um representante grava uma linha de comissao por
-- representante (cada um usa o valor integral da nota pra sua propria meta -
-- proposital, ver MWCOMISSOES_ACOMPANHAMENTO.md). Isso faz com que somar
-- vendas_liquidas de todas as linhas de comissoes_resumos_mensais (visao "toda
-- a equipe" do Painel BI) conte essa nota duas vezes no faturamento total da
-- empresa. As colunas abaixo trazem o total ja calculado sem essa duplicacao
-- (EX_MW_VW_RADAR_COMISSOES_RES.VENDAS_BRUTAS_EMPRESA /
-- VENDAS_LIQUIDAS_EMPRESA, MWComissoesSync/Sql/Oracle/001) - o mesmo valor se
-- repete em todas as linhas de um mesmo ano/mes, pra o Painel BI poder ler de
-- qualquer uma delas em vez de somar por representante.
alter table public.comissoes_resumos_mensais
  add column if not exists vendas_brutas_empresa numeric(15,2) not null default 0,
  add column if not exists vendas_liquidas_empresa numeric(15,2) not null default 0;

comment on column public.comissoes_resumos_mensais.vendas_brutas_empresa is
  'Vendas brutas do mes contando cada nota fisica uma unica vez, mesmo com multiplos representantes - repete o mesmo valor em todas as linhas do ano/mes.';
comment on column public.comissoes_resumos_mensais.vendas_liquidas_empresa is
  'Vendas liquidas (brutas - devolucoes) do mes contando cada nota fisica uma unica vez - repete o mesmo valor em todas as linhas do ano/mes.';
