-- Acesso próprio para a aba "Visão geral" da Ficha CIGAM (pedido do usuário, 24/11/2026).
-- Início só admin, como os demais da ficha.
insert into public.radar_permissoes (codigo, nome, grupo, ordem, descricao) values
  ('clientes.cigam_visao', 'Visão geral do cliente (CIGAM)', 'Comercial', 38, 'Aba Visão geral na ficha do cliente: indicadores de compra, gráfico mensal, pedidos em aberto e produtos mais comprados')
on conflict (codigo) do update set nome = excluded.nome, grupo = excluded.grupo, ordem = excluded.ordem, descricao = excluded.descricao;

update public.radar_permissoes set ordem = 39 where codigo = 'clientes.cigam_vendas';
update public.radar_permissoes set ordem = 40 where codigo = 'clientes.cigam_financeiro';

insert into public.radar_permissoes_perfil (tipo_perfil, codigo, permitido)
select t.tipo, 'clientes.cigam_visao', t.tipo = 'admin'
from (values ('admin'), ('tecnico'), ('representante'), ('qualidade')) t(tipo)
on conflict (tipo_perfil, codigo) do nothing;
