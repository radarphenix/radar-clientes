create or replace function public.radar_codigos_numericos_equivalentes(codigo text)
returns text[]
language sql
immutable
set search_path = public
as $$
  select coalesce(array_agg(distinct variante), array[]::text[])
  from (
    select nullif(trim(coalesce(codigo, '')), '') as variante
    union all
    select nullif(regexp_replace(coalesce(codigo, ''), '\D', '', 'g'), '') as variante
    union all
    select lpad(nullif(regexp_replace(coalesce(codigo, ''), '\D', '', 'g'), ''), 6, '0') as variante
    union all
    select nullif(regexp_replace(regexp_replace(coalesce(codigo, ''), '\D', '', 'g'), '^0+', ''), '') as variante
    union all
    select lpad(
      nullif(regexp_replace(regexp_replace(coalesce(codigo, ''), '\D', '', 'g'), '^0+', ''), ''),
      6,
      '0'
    ) as variante
  ) variantes
  where variante is not null;
$$;

create or replace function public.radar_perfil_atual_tipo()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select p.tipo_perfil
  from public.perfis p
  where p.user_id = auth.uid()
    and p.ativo = true
  limit 1;
$$;

create or replace function public.radar_perfil_atual_codigo_representante()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select p.codigo_representante
  from public.perfis p
  where p.user_id = auth.uid()
    and p.ativo = true
  limit 1;
$$;

grant execute on function public.radar_codigos_numericos_equivalentes(text) to authenticated;
grant execute on function public.radar_perfil_atual_tipo() to authenticated;
grant execute on function public.radar_perfil_atual_codigo_representante() to authenticated;
grant select on table public.clientes_representantes to authenticated;

alter table public.clientes_representantes enable row level security;

drop policy if exists "clientes_representantes_select_admin_representante" on public.clientes_representantes;

create policy "clientes_representantes_select_admin_representante"
on public.clientes_representantes
for select
to authenticated
using (
  public.radar_perfil_atual_tipo() = 'admin'
  or (
    public.radar_perfil_atual_tipo() = 'representante'
    and codigo_representante = any(
      public.radar_codigos_numericos_equivalentes(
        public.radar_perfil_atual_codigo_representante()
      )
    )
  )
);

drop policy if exists "clientes_select_por_clientes_representantes" on public.clientes;

create policy "clientes_select_por_clientes_representantes"
on public.clientes
for select
to authenticated
using (
  public.radar_perfil_atual_tipo() = 'admin'
  or (
    public.radar_perfil_atual_tipo() = 'representante'
    and (
      codigo_representante = any(
        public.radar_codigos_numericos_equivalentes(
          public.radar_perfil_atual_codigo_representante()
        )
      )
      or exists (
        select 1
        from public.clientes_representantes cr
        where cr.codigo_cliente = any(
          public.radar_codigos_numericos_equivalentes(clientes.codigo_cliente)
        )
          and cr.codigo_representante = any(
            public.radar_codigos_numericos_equivalentes(
              public.radar_perfil_atual_codigo_representante()
            )
          )
      )
    )
  )
);
