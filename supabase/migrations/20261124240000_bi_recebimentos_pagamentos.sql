-- BI separado em Faturamento (comercial), Recebimentos (contas a receber) e Pagamentos
-- (contas a pagar + fluxo de caixa projetado), pedido do usuário em 24/11/2026.
-- Pagamentos lê ao vivo da API do CIGAM (função cigam-acompanhamentos ?bi=financeiro), sem tabela.
insert into public.radar_permissoes (codigo, nome, grupo, ordem, descricao) values
  ('bi_recebimentos', 'Painel BI - Recebimentos', 'Gestão e Análise', 102, 'Contas a receber: previsto x recebido, vencidos, devedores, pontualidade'),
  ('bi_pagamentos', 'Painel BI - Pagamentos', 'Gestão e Análise', 104, 'Contas a pagar e fluxo de caixa projetado (dados ao vivo do CIGAM)')
on conflict (codigo) do update set nome = excluded.nome, grupo = excluded.grupo, ordem = excluded.ordem, descricao = excluded.descricao;

insert into public.radar_permissoes_perfil (tipo_perfil, codigo, permitido)
select t.tipo, p.codigo, t.tipo = 'admin'
from (values ('admin'), ('tecnico'), ('representante'), ('qualidade')) t(tipo)
cross join (values ('bi_recebimentos'), ('bi_pagamentos')) p(codigo)
on conflict (tipo_perfil, codigo) do nothing;

-- Recebimentos usa títulos, notas (nome do cliente e representante da NF) e devoluções.
drop policy if exists "admin consulta financeiro bi" on public.bi_lancamentos_financeiros;
create policy "admin consulta financeiro bi" on public.bi_lancamentos_financeiros for select to authenticated
  using ((select radar_pode('bi_faturamento')) or (select radar_pode('bi_recebimentos')));

drop policy if exists "admin consulta notas bi" on public.bi_notas_itens;
create policy "admin consulta notas bi" on public.bi_notas_itens for select to authenticated
  using ((select radar_pode('bi_faturamento')) or (select radar_pode('bi_recebimentos')));

drop policy if exists "admin consulta devolucoes bi" on public.bi_devolucoes_itens;
create policy "admin consulta devolucoes bi" on public.bi_devolucoes_itens for select to authenticated
  using ((select radar_pode('bi_faturamento')) or (select radar_pode('bi_recebimentos')));
