-- Vários produtos por máquina: cada produto continua sendo uma linha; grupo_id junta as linhas
-- salvas juntas (mesma máquina) e item numera até 3 unidades do mesmo produto (ex.: Feltro 1, 2, 3).
alter table public.cadastro_produtos_feira_phenix
  add column if not exists grupo_id uuid,
  add column if not exists item smallint check (item between 1 and 3);

create index if not exists cadastro_produtos_feira_grupo_idx on public.cadastro_produtos_feira_phenix (grupo_id);
