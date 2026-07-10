grant insert, update, delete on table public.clientes_representantes to authenticated;

drop policy if exists "clientes_representantes_write_admin" on public.clientes_representantes;

create policy "clientes_representantes_write_admin"
on public.clientes_representantes
for all
to authenticated
using (
  public.radar_perfil_atual_tipo() = 'admin'
)
with check (
  public.radar_perfil_atual_tipo() = 'admin'
);
