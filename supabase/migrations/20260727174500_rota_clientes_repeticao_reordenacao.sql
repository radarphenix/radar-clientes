do $$
declare
  restricao record;
begin
  for restricao in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'rota_clientes'
      and con.contype = 'u'
      and (
        select array_agg(att.attname order by chave.ordinalidade)
        from unnest(con.conkey) with ordinality as chave(attnum, ordinalidade)
        join pg_attribute att
          on att.attrelid = rel.oid
         and att.attnum = chave.attnum
      ) = array['rota_id', 'cliente_id']::name[]
  loop
    execute format(
      'alter table public.rota_clientes drop constraint %I',
      restricao.conname
    );
  end loop;
end
$$;

create index if not exists rota_clientes_rota_cliente_idx
  on public.rota_clientes (rota_id, cliente_id);

create or replace function public.reordenar_clientes_rota(
  p_rota_id bigint,
  p_itens bigint[]
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  total_rota integer;
  total_informado integer;
begin
  select count(*)
    into total_rota
  from public.rota_clientes
  where rota_id = p_rota_id;

  select count(distinct item_id)
    into total_informado
  from unnest(p_itens) as item_id;

  if total_rota <> coalesce(array_length(p_itens, 1), 0)
     or total_rota <> total_informado
     or exists (
       select 1
       from unnest(p_itens) as item_id
       where not exists (
         select 1
         from public.rota_clientes rc
         where rc.id = item_id
           and rc.rota_id = p_rota_id
       )
     ) then
    raise exception 'A lista informada não corresponde aos clientes da rota.';
  end if;

  update public.rota_clientes rc
     set sequencia = -ord.posicao
    from unnest(p_itens) with ordinality as ord(item_id, posicao)
   where rc.id = ord.item_id
     and rc.rota_id = p_rota_id;

  update public.rota_clientes rc
     set sequencia = ord.posicao
    from unnest(p_itens) with ordinality as ord(item_id, posicao)
   where rc.id = ord.item_id
     and rc.rota_id = p_rota_id;
end;
$$;

comment on function public.reordenar_clientes_rota(bigint, bigint[]) is
  'Reordena atomicamente todos os itens de uma rota e normaliza as sequências de 1 a N.';
