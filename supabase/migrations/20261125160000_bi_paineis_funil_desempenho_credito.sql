-- Três painéis BI novos (pedido do usuário, 25/11/2026), cada um com seu acesso, para não poluir os atuais:
--   bi_funil      = Funil e entregas (funil de pedidos, entrega no prazo, devoluções)
--   bi_desempenho = Desempenho comercial (eficiência por representante: visitas x compras)
--   bi_credito    = Crédito e caixa (matriz valor x pagamento, caixa futuro pela carteira de pedidos)
-- Padrão: só admin liberado; os demais perfis escolhem em Administração → Acessos.
insert into public.radar_permissoes (codigo, nome, grupo, ordem, descricao) values
  ('bi_funil', 'Painel BI - Funil e entregas', 'Gestão e Análise', 106, 'Funil de pedidos, entrega no prazo e devoluções'),
  ('bi_desempenho', 'Painel BI - Desempenho comercial', 'Gestão e Análise', 107, 'Visitas x compras e faturado por representante'),
  ('bi_credito', 'Painel BI - Crédito e caixa', 'Gestão e Análise', 108, 'Matriz valor x pagamento e caixa futuro pela carteira de pedidos')
on conflict (codigo) do update set nome = excluded.nome, grupo = excluded.grupo, ordem = excluded.ordem, descricao = excluded.descricao;

insert into public.radar_permissoes_perfil (tipo_perfil, codigo, permitido)
select t.tipo, p.codigo, t.tipo = 'admin'
from (values ('admin'), ('tecnico'), ('representante'), ('qualidade')) t(tipo)
cross join (values ('bi_funil'), ('bi_desempenho'), ('bi_credito')) p(codigo)
on conflict (tipo_perfil, codigo) do nothing;

-- Leitura das tabelas do BI para os painéis novos (as condições antigas continuam valendo).
drop policy if exists "admin consulta pedidos bi" on public.bi_pedidos_itens;
create policy "admin consulta pedidos bi" on public.bi_pedidos_itens for select to authenticated
  using ((select radar_pode('bi_faturamento')) or (select radar_pode('bi_funil')) or (select radar_pode('bi_credito')));

drop policy if exists "admin consulta notas bi" on public.bi_notas_itens;
create policy "admin consulta notas bi" on public.bi_notas_itens for select to authenticated
  using ((select radar_pode('bi_faturamento')) or (select radar_pode('bi_recebimentos'))
      or (select radar_pode('bi_funil')) or (select radar_pode('bi_desempenho')) or (select radar_pode('bi_credito')));

drop policy if exists "admin consulta devolucoes bi" on public.bi_devolucoes_itens;
create policy "admin consulta devolucoes bi" on public.bi_devolucoes_itens for select to authenticated
  using ((select radar_pode('bi_faturamento')) or (select radar_pode('bi_recebimentos'))
      or (select radar_pode('bi_funil')) or (select radar_pode('bi_desempenho')) or (select radar_pode('bi_credito')));

drop policy if exists "admin consulta financeiro bi" on public.bi_lancamentos_financeiros;
create policy "admin consulta financeiro bi" on public.bi_lancamentos_financeiros for select to authenticated
  using ((select radar_pode('bi_faturamento')) or (select radar_pode('bi_recebimentos')) or (select radar_pode('bi_credito')));

-- Histórico de visitas por acompanhamento (12 meses) para o Desempenho comercial: a sincronização das
-- visitas (cigam-acompanhamentos?sync=visitas) passa a guardar a lista, não só a última.
alter table public.cigam_visitas_clientes add column if not exists visitas_12m jsonb not null default '[]'::jsonb;
comment on column public.cigam_visitas_clientes.visitas_12m is
  'Visitas (acompanhamentos VISITA / VISITA TECNICA) dos últimos 12 meses: [{"data":"aaaa-mm-dd","usuario":"..."}], um por dia.';
