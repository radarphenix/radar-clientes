# Views CIGAM — Painel BI de Faturamento

O sincronizador deve consultar exclusivamente estas views, nunca as tabelas operacionais diretamente.

- `VW_RADAR_BI_PEDIDOS`: previsão por item; une `FAPEDIDO` a `FAITEMPE` por `CD_PEDIDO`.
- `VW_RADAR_BI_NOTAS_SAIDA`: faturamento por item; lê `ESMOVIME` somente com `TIPO_MOVIMENTO = 'S'` e identifica a nota por `NF`, `SERIE`, `CD_EMPRESA`.
- `VW_RADAR_BI_FINANCEIRO`: parcela financeira; lê `GFLANCAM` pela mesma chave de nota.

O sync faz upsert nos espelhos `bi_pedidos_itens`, `bi_notas_itens` e `bi_lancamentos_financeiros` do Radar. A parcela é mantida em tabela própria para que um lançamento financeiro não seja repetido para cada item de uma nota.
