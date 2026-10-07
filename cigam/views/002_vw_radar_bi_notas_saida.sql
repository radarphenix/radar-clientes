-- A chave de sincronizacao deve conter tambem a sequencia do item. Uma mesma
-- nota/movimento pode ter varios itens e cada linha precisa de ID proprio.
create or replace view VW_RADAR_BI_NOTAS_SAIDA as
select
  m.nf, m.serie, m.cd_empresa, m.movimento, m.sequencia_dia as sequencia_item,
  m.dt_movimento as data_movimento, m.tipo_movimento, m.documento as documento_origem,
  m.cd_material as codigo_material, m.descricao as descricao_item,
  m.quantidade, m.pr_unitario as valor_unitario, m.pr_total_item as valor_liquido
from esmovime m
where m.tipo_movimento = 'S'
  and m.nf is not null;
