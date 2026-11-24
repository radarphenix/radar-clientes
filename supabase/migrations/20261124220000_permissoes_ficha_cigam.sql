-- Ficha 360° do cliente (dados do CIGAM, somente leitura, função cigam-acompanhamentos ?ficha=).
-- Decisão do usuário (24/11/2026): no início só admin; liberar depois em Administração → Acessos.
insert into public.radar_permissoes (codigo, nome, grupo, ordem, descricao) values
  ('clientes.cigam_vendas', 'Pedidos e notas do CIGAM no cliente', 'Comercial', 38, 'Abas Pedidos e Notas na ficha do cliente (botão Acomp.)'),
  ('clientes.cigam_financeiro', 'Títulos financeiros do CIGAM no cliente', 'Comercial', 39, 'Aba Financeiro (títulos a receber em aberto) na ficha do cliente')
on conflict (codigo) do update set nome = excluded.nome, grupo = excluded.grupo, ordem = excluded.ordem, descricao = excluded.descricao;

insert into public.radar_permissoes_perfil (tipo_perfil, codigo, permitido)
select t.tipo, p.codigo, t.tipo = 'admin'
from (values ('admin'), ('tecnico'), ('representante'), ('qualidade')) t(tipo)
cross join (values ('clientes.cigam_vendas'), ('clientes.cigam_financeiro')) p(codigo)
on conflict (tipo_perfil, codigo) do nothing;
