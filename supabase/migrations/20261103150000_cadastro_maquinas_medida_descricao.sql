-- Máquinas e medidas: vendas antigas sem CD_CARAC ganham a medida lida do texto do item da nota
-- (MWCadastroMaquinasSync, MedidaPelaDescricao). A marca deixa a tela mostrar que a medida é estimada.
-- Aditiva e idempotente.
alter table public.cadastro_maquinas_vendas
  add column if not exists medida_pela_descricao boolean not null default false;
