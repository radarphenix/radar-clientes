-- Impede gerar um novo contemplado enquanto ja existir um ativo: cada
-- clique em "Realizar apuracao" escolhia sempre a proxima melhor inscricao
-- valida, entao repetir o clique produzia varios contemplados ao mesmo
-- tempo. Agora e preciso reverter a apuracao atual antes de apurar de novo.
create or replace function public.apurar_veste_phenix(
  p_numero_loteria bigint,
  p_data_extracao date,
  p_concurso text default null,
  p_fonte_url text default null
)
returns table(
  apuracao_id uuid,
  inscricao_id uuid,
  numero_sorte bigint,
  nome_completo text,
  diferenca bigint,
  criado_em timestamptz,
  total_empatados integer
)
language plpgsql security definer set search_path = public as $$
declare
  v public.promocao_veste_phenix_30_anos%rowtype;
  v_apuracao_id uuid;
  v_menor_diferenca bigint;
  v_total_empatados integer;
begin
  if auth.role() <> 'service_role'
     and not exists (
       select 1 from public.perfis p
       where p.user_id = auth.uid() and p.tipo_perfil = 'admin' and p.ativo = true
     )
  then
    raise exception 'Acesso restrito';
  end if;

  if exists (
    select 1 from public.promocao_veste_phenix_30_anos where status = 'contemplada'
  ) then
    raise exception 'Já existe uma inscrição contemplada. Reverta a apuração atual antes de realizar uma nova.';
  end if;

  select min(abs(t.numero_sorte - p_numero_loteria))
  into v_menor_diferenca
  from public.promocao_veste_phenix_30_anos t
  where t.status = 'valida';

  if v_menor_diferenca is null then
    raise exception 'Nenhuma inscrição válida';
  end if;

  select count(*)
  into v_total_empatados
  from public.promocao_veste_phenix_30_anos t
  where t.status = 'valida'
    and abs(t.numero_sorte - p_numero_loteria) = v_menor_diferenca;

  select t.* into v
  from public.promocao_veste_phenix_30_anos t
  where t.status = 'valida'
    and abs(t.numero_sorte - p_numero_loteria) = v_menor_diferenca
  order by t.criado_em, t.id
  limit 1;

  update public.promocao_veste_phenix_30_anos
  set status = 'contemplada', atualizado_em = now()
  where id = v.id;

  insert into public.promocao_veste_phenix_30_anos_apuracoes
    (numero_loteria, data_extracao, concurso, fonte_url, vencedor_inscricao_id, diferenca_absoluta)
  values
    (p_numero_loteria, p_data_extracao, p_concurso, p_fonte_url, v.id, v_menor_diferenca)
  returning id into v_apuracao_id;

  return query
    select v_apuracao_id, v.id, v.numero_sorte, v.nome_completo, v_menor_diferenca, v.criado_em, v_total_empatados;
end
$$;
