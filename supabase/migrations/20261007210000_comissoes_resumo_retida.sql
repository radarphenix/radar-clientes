-- Comissao retida no resumo mensal (decisao do usuario, 07/10/2026).
--
-- A view EX_MW_VW_RADAR_COMISSOES_RES (MWComissoesSync) passou a descontar de
-- comissao_gerada e comissao_prevista a comissao das parcelas com "Pagar" desmarcado no
-- MWComissoes, para o representante ver a mesma regra em todo lugar (a linha da parcela ja
-- e' escondida dele pela policy de comissoes_lancamentos, migration 20261007200000). O
-- valor descontado vem nesta coluna, que so a tela do gestor e o Painel BI mostram.
--
-- Precisa estar aplicada ANTES do MWComissoesSync novo rodar (ele envia a coluna).

alter table public.comissoes_resumos_mensais
  add column if not exists comissao_retida numeric(15,2) not null default 0;
