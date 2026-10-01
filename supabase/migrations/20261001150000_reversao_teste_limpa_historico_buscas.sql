-- Depois de testar "Desclassificar e buscar próximo" com inscrições de teste, a
-- reversão/limpeza marcava como revertida só a última busca: as anteriores
-- (desclassificadas) continuavam com revertida_em nulo e seguiam aparecendo no
-- painel em "Histórico de buscas — contemplados desclassificados".
-- Agora a reversão de teste desfaz a cadeia inteira de buscas, e a limpeza de
-- inscrições de teste marca como revertidas as apurações que elas venceram.
-- Nada é apagado: as linhas de _apuracoes continuam lá para auditoria.
-- Inscrições reais nunca são afetadas (tudo filtra por origem = formulario_teste).

create or replace function public.reverter_apuracao_teste_veste_phenix(p_apuracao_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  a public.promocao_veste_phenix_30_anos_apuracoes%rowtype;
  ant public.promocao_veste_phenix_30_anos_apuracoes%rowtype;
  venc public.promocao_veste_phenix_30_anos%rowtype;
  v_anterior uuid;
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

  -- Buscas anteriores da mesma cadeia (contemplados de teste desclassificados).
  v_anterior := a.apuracao_anterior_id;
  while v_anterior is not null loop
    select * into ant from public.promocao_veste_phenix_30_anos_apuracoes where id = v_anterior;
    exit when ant.id is null;

    update public.promocao_veste_phenix_30_anos
    set status = 'valida', motivo_status = null, atualizado_em = now()
    where id = ant.vencedor_inscricao_id and origem = 'formulario_teste' and status = 'desclassificada';

    if found or ant.vencedor_inscricao_id is null then
      update public.promocao_veste_phenix_30_anos_apuracoes
      set revertida_em = now(), revertida_por = auth.uid()
      where id = ant.id and revertida_em is null;
    end if;

    v_anterior := ant.apuracao_anterior_id;
  end loop;
end
$$;

create or replace function public.reverter_todos_contemplados_teste_veste_phenix()
returns integer language plpgsql security definer set search_path = public as $$
declare
  v_total integer;
begin
  if auth.role() <> 'service_role'
     and not exists (
       select 1 from public.perfis p
       where p.user_id = auth.uid() and p.tipo_perfil = 'admin' and p.ativo = true
     )
  then
    raise exception 'Acesso restrito';
  end if;

  -- Contemplados de teste ativos e os de teste desclassificados em buscas anteriores,
  -- além das apurações cuja inscrição de teste já foi removida.
  update public.promocao_veste_phenix_30_anos_apuracoes a
  set revertida_em = now(), revertida_por = auth.uid()
  where a.revertida_em is null
    and (
      (a.vencedor_inscricao_id is null and a.desclassificada_em is not null)
      or exists (
        select 1 from public.promocao_veste_phenix_30_anos v
        where v.id = a.vencedor_inscricao_id
          and v.origem = 'formulario_teste'
          and (v.status = 'contemplada' or (v.status = 'desclassificada' and a.desclassificada_em is not null))
      )
    );

  update public.promocao_veste_phenix_30_anos v
  set status = 'valida', motivo_status = null, atualizado_em = now()
  where v.origem = 'formulario_teste'
    and v.status = 'desclassificada'
    and exists (
      select 1 from public.promocao_veste_phenix_30_anos_apuracoes a
      where a.vencedor_inscricao_id = v.id and a.desclassificada_em is not null
    );

  update public.promocao_veste_phenix_30_anos
  set status = 'valida', atualizado_em = now()
  where status = 'contemplada' and origem = 'formulario_teste';

  get diagnostics v_total = row_count;
  return v_total;
end
$$;

create or replace function public.limpar_testes_veste_phenix()
returns bigint language plpgsql security definer set search_path = public as $$
declare v_total bigint;
begin
  if auth.role() <> 'service_role' and not exists(select 1 from public.perfis p where p.user_id=auth.uid() and p.tipo_perfil='admin' and p.ativo=true) then raise exception 'Acesso restrito'; end if;

  -- A inscrição some, então a apuração que ela venceu deixa de valer: fica só como auditoria.
  update public.promocao_veste_phenix_30_anos_apuracoes a
  set revertida_em = now(), revertida_por = auth.uid()
  from public.promocao_veste_phenix_30_anos v
  where a.vencedor_inscricao_id = v.id and v.origem = 'formulario_teste' and a.revertida_em is null;

  delete from public.promocao_veste_phenix_30_anos where origem='formulario_teste';
  get diagnostics v_total = row_count;
  return v_total;
end $$;

-- Sobras dos testes já feitos: buscas desclassificadas cuja inscrição (de teste)
-- foi removida e que ficaram presas no histórico do painel.
update public.promocao_veste_phenix_30_anos_apuracoes
set revertida_em = now()
where revertida_em is null and desclassificada_em is not null and vencedor_inscricao_id is null;
