-- Rota finalizada so pode ser excluida por admin.
-- Politica RESTRITIVA: soma-se a qualquer politica permissiva ja existente
-- em "rotas"/"rota_clientes" (nao remove nem depende de saber o nome delas),
-- apenas adiciona a exigencia extra "admin OU rota nao finalizada" para DELETE.

alter table public.rotas enable row level security;
alter table public.rota_clientes enable row level security;

drop policy if exists "rotas_delete_restringe_finalizada" on public.rotas;

create policy "rotas_delete_restringe_finalizada"
on public.rotas
as restrictive
for delete
to authenticated
using (
  public.radar_perfil_atual_tipo() = 'admin'
  or status is distinct from 'FINALIZADA'
);

drop policy if exists "rota_clientes_delete_restringe_finalizada" on public.rota_clientes;

create policy "rota_clientes_delete_restringe_finalizada"
on public.rota_clientes
as restrictive
for delete
to authenticated
using (
  public.radar_perfil_atual_tipo() = 'admin'
  or exists (
    select 1 from public.rotas r
    where r.id = rota_clientes.rota_id
      and r.status is distinct from 'FINALIZADA'
  )
);
