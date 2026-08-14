-- Corrige "column reference numero_sorte is ambiguous": o RETURNS TABLE da
-- funcao declara uma saida numero_sorte que colidia com a coluna de mesmo
-- nome da tabela. A partir de agora toda referencia de coluna e qualificada.
drop function if exists public.apurar_veste_phenix(bigint, date, text, text);

create function public.apurar_veste_phenix(
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
  diferenca bigint
)
language plpgsql security definer set search_path = public as $$
declare
  v public.promocao_veste_phenix_30_anos%rowtype;
  v_apuracao_id uuid;
begin
  if auth.role() <> 'service_role'
     and not exists (
       select 1 from public.perfis p
       where p.user_id = auth.uid() and p.tipo_perfil = 'admin' and p.ativo = true
     )
  then
    raise exception 'Acesso restrito';
  end if;

  select t.* into v
  from public.promocao_veste_phenix_30_anos t
  where t.status = 'valida'
  order by abs(t.numero_sorte - p_numero_loteria), t.criado_em, t.id
  limit 1;

  if v.id is null then
    raise exception 'Nenhuma inscrição válida';
  end if;

  update public.promocao_veste_phenix_30_anos
  set status = 'contemplada', atualizado_em = now()
  where id = v.id;

  insert into public.promocao_veste_phenix_30_anos_apuracoes
    (numero_loteria, data_extracao, concurso, fonte_url, vencedor_inscricao_id, diferenca_absoluta)
  values
    (p_numero_loteria, p_data_extracao, p_concurso, p_fonte_url, v.id, abs(v.numero_sorte - p_numero_loteria))
  returning id into v_apuracao_id;

  return query
    select v_apuracao_id, v.id, v.numero_sorte, v.nome_completo, abs(v.numero_sorte - p_numero_loteria);
end
$$;

grant execute on function public.apurar_veste_phenix(bigint, date, text, text) to authenticated;

-- Reversao de apuracoes de teste: mantem o registro da apuracao (nunca
-- apaga) para auditoria, apenas marca quando e por quem foi revertida, e
-- devolve a inscricao vencedora para o status valida.
alter table public.promocao_veste_phenix_30_anos_apuracoes
  add column if not exists revertida_em timestamptz,
  add column if not exists revertida_por uuid;

create or replace function public.reverter_apuracao_teste_veste_phenix(p_apuracao_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  a public.promocao_veste_phenix_30_anos_apuracoes%rowtype;
  venc public.promocao_veste_phenix_30_anos%rowtype;
begin
  if auth.role() <> 'service_role'
     and not exists (
       select 1 from public.perfis p
       where p.user_id = auth.uid() and p.tipo_perfil = 'admin' and p.ativo = true
     )
  then
    raise exception 'Acesso restrito';
  end if;

  select * into a from public.promocao_veste_phenix_30_anos_apuracoes where id = p_apuracao_id;
  if a.id is null then
    raise exception 'Apuração não encontrada';
  end if;
  if a.revertida_em is not null then
    raise exception 'Esta apuração já foi revertida';
  end if;

  select * into venc from public.promocao_veste_phenix_30_anos where id = a.vencedor_inscricao_id;
  if venc.id is null or venc.origem <> 'formulario_teste' then
    raise exception 'Só é possível reverter apurações de inscrições de teste';
  end if;

  update public.promocao_veste_phenix_30_anos
  set status = 'valida', atualizado_em = now()
  where id = venc.id;

  update public.promocao_veste_phenix_30_anos_apuracoes
  set revertida_em = now(), revertida_por = auth.uid()
  where id = a.id;
end
$$;

grant execute on function public.reverter_apuracao_teste_veste_phenix(uuid) to authenticated;
