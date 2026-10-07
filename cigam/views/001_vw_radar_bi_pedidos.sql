create or replace view VW_RADAR_BI_PEDIDOS as
select
  p.cd_pedido, i.sequencia as sequencia_item, p.dt_pedido as data_pedido,
  coalesce(i.dt_prazo_entreg, p.dt_prazo_entreg, p.dt_prazo_progra) as data_previsao,
  p.situacao as situacao_pedido, p.cd_cliente as codigo_cliente, i.cd_empresa as codigo_empresa,
  i.cd_material as codigo_material, i.descricao as descricao_item,
  i.quantidade, i.qt_saldo as quantidade_saldo, i.pr_unitario as valor_unitario,
  coalesce(i.vl_total_item_l, i.quantidade * i.pr_unitario) as valor_liquido
from fapedido p
join faitempe i on i.cd_pedido = p.cd_pedido;
