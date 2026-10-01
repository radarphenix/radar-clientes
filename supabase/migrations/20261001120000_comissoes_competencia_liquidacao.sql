-- Competencia de pagamento pela liquidacao do titulo (decisao de 01/10/2026, ver
-- MWComissoes/MWCOMISSOES_ACOMPANHAMENTO.md): boleto que vence no mes X e e' pago no mes
-- Y entra no mes Y. Ate aqui o Radar decidia o mes do lancamento so' por data_vencimento.
--
-- data_liquidacao: data em que o titulo foi liquidado no CIGAM (nulo enquanto em aberto e
-- nas linhas de desconto/ajuste/devolucao).
-- data_competencia_pagamento: mes em que o lancamento aparece - a liquidacao quando
-- existe, senao o vencimento. Vem pronta da view EX_MW_VW_RADAR_COMISSOES_LANC.
--
-- Aplicar ANTES de publicar o MWComissoesSync e o front que usam essas colunas.
alter table public.comissoes_lancamentos
  add column if not exists data_liquidacao date,
  add column if not exists data_competencia_pagamento date;

-- Linhas ja sincronizadas continuam no mes em que estavam ate o proximo sync.
update public.comissoes_lancamentos
   set data_competencia_pagamento = data_vencimento
 where data_competencia_pagamento is null;

-- Um MWComissoesSync ainda na versao anterior nao envia a coluna nova: sem este padrao,
-- o lancamento que ele inserir ficaria sem competencia e sumiria de todas as telas.
create or replace function public.comissoes_lancamentos_competencia_padrao()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.data_competencia_pagamento is null then
    new.data_competencia_pagamento := new.data_vencimento;
  end if;
  return new;
end;
$$;

drop trigger if exists comissoes_lancamentos_competencia_padrao on public.comissoes_lancamentos;
create trigger comissoes_lancamentos_competencia_padrao
  before insert or update on public.comissoes_lancamentos
  for each row execute function public.comissoes_lancamentos_competencia_padrao();

create index if not exists comissoes_lancamentos_rep_competencia_idx
  on public.comissoes_lancamentos (codigo_representante, data_competencia_pagamento);

comment on column public.comissoes_lancamentos.data_liquidacao is
  'Data de liquidacao do titulo no CIGAM. Nulo enquanto o titulo esta em aberto.';
comment on column public.comissoes_lancamentos.data_competencia_pagamento is
  'Mes em que o lancamento entra para pagamento: liquidacao quando existe, senao vencimento.';
