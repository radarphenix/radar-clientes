-- Aba "Estatísticas" do painel da promoção: cliques/acessos agrupados por dia e hora
-- (horário de Brasília), para filtrar por dia da feira e montar o mapa de calor.
create or replace function public.eventos_por_hora_veste_phenix()
returns table (dia date, hora integer, evento text, origem text, total bigint)
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.perfis p where p.user_id = auth.uid() and p.tipo_perfil = 'admin' and p.ativo) then
    raise exception 'Acesso restrito';
  end if;
  return query
    select (e.criado_em at time zone 'America/Sao_Paulo')::date,
           extract(hour from e.criado_em at time zone 'America/Sao_Paulo')::integer,
           e.evento, e.origem, count(*)
      from public.veste_phenix_eventos e
     group by 1, 2, 3, 4
     order by 1, 2;
end $$;

revoke all on function public.eventos_por_hora_veste_phenix() from public, anon;
grant execute on function public.eventos_por_hora_veste_phenix() to authenticated;
