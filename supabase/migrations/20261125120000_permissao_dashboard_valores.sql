-- Dashboard: mostrar valores em R$ (compras de 12 meses, queda vs ano anterior, mapa por valor de compra).
-- Pedido do usuário (25/11/2026): escolher em Administração → Acessos quais perfis veem os valores.
-- Padrão: só admin. Quem não tem continua vendo as listas (dias sem comprar, visitas), sem os valores;
-- a função cigam-acompanhamentos?dashboard=carteira também deixa de enviar os valores (conferido no servidor).
insert into public.radar_permissoes (codigo, nome, grupo, ordem, descricao) values
  ('dashboard.valores', 'Dashboard: mostrar valores', 'Gestão e Análise', 81,
   'Valores em R$ no Dashboard (compras em 12 meses, queda vs ano anterior e mapa por valor de compra)')
on conflict (codigo) do update set nome = excluded.nome, grupo = excluded.grupo, ordem = excluded.ordem, descricao = excluded.descricao;

insert into public.radar_permissoes_perfil (tipo_perfil, codigo, permitido)
select t.tipo, 'dashboard.valores', t.tipo = 'admin'
from (values ('admin'), ('tecnico'), ('representante'), ('qualidade')) t(tipo)
on conflict (tipo_perfil, codigo) do nothing;
