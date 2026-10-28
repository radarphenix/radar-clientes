-- Corrige o histórico de acessos: a mesma função atende perfil (sem user_id) e usuário (com user_id);
-- new.user_id quebrava ao salvar acesso de perfil ("record new has no field user_id").
create or replace function public.radar_permissoes_registrar()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  linha jsonb := to_jsonb(coalesce(new, old));
begin
  insert into radar_permissoes_historico (alvo, codigo, antes, depois)
  values (
    case when tg_table_name = 'radar_permissoes_perfil' then 'perfil:' || (linha->>'tipo_perfil')
         else 'usuario:' || (linha->>'user_id') end,
    linha->>'codigo',
    case when tg_op = 'INSERT' then null else old.permitido end,
    case when tg_op = 'DELETE' then null else new.permitido end);
  return coalesce(new, old);
end $$;
