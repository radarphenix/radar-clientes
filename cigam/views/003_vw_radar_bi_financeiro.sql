create or replace view VW_RADAR_BI_FINANCEIRO as
select
  f.cd_lancamento, f.nf, f.serie, f.cd_empresa, f.dt_emissao as data_emissao,
  f.dt_vencimento as data_vencimento, f.dt_ultima_liqui as data_ultima_liquidacao,
  f.valor, f.vl_saldo as valor_saldo, f.situacao, f.cd_tipo as tipo, f.documento
from gflancam f
where f.nf is not null;
