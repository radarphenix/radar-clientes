-- Nova busca de contemplado (regulamento, seções 4, 18 e 19): quando o contemplado
-- não atende aos critérios (informação falsa, sem resposta no prazo, impedido...),
-- ele é desclassificado com motivo registrado e o prêmio passa ao número válido
-- seguinte mais próximo do mesmo resultado da Loteria Federal — quantas vezes for
-- preciso. Nada é apagado: cada busca é uma linha nova em _apuracoes, ligada à
-- anterior, e a desclassificação fica na própria apuração e na inscrição (e na
-- auditoria, pelo trigger já existente).

alter table public.promocao_veste_phenix_30_anos_apuracoes
  add column if not exists ordem_busca integer not null default 1,
  add column if not exists apuracao_anterior_id uuid references public.promocao_veste_phenix_30_anos_apuracoes(id),
  add column if not exists desclassificada_em timestamptz,
  add column if not exists desclassificada_por uuid,
  add column if not exists motivo_desclassificacao text;

create or replace function public.nova_busca_veste_phenix(p_apuracao_id uuid, p_motivo text)
returns table(apuracao_id uuid, inscricao_id uuid, numero_sorte bigint, nome_completo text, diferenca bigint, criado_em timestamptz, total_empatados integer, ordem_busca integer)
language plpgsql security definer set search_path = public as $$
declare
  a public.promocao_veste_phenix_30_anos_apuracoes%rowtype;
  r record;
  v_motivo text := btrim(coalesce(p_motivo, ''));
begin
  if auth.role() <> 'service_role' and not exists (
    select 1 from public.perfis p where p.user_id = auth.uid() and p.tipo_perfil = 'admin' and p.ativo = true
  ) then
    raise exception 'Acesso restrito';
  end if;

  if char_length(v_motivo) < 10 then
    raise exception 'Descreva o motivo da desclassificação (mínimo de 10 caracteres).';
  end if;

  select * into a from public.promocao_veste_phenix_30_anos_apuracoes where id = p_apuracao_id for update;
  if a.id is null then
    raise exception 'Apuração não encontrada';
  end if;
  if a.revertida_em is not null or a.desclassificada_em is not null then
    raise exception 'Esta apuração não é mais a vigente. Atualize a tela.';
  end if;
  if a.vencedor_inscricao_id is null or not exists (
    select 1 from public.promocao_veste_phenix_30_anos where id = a.vencedor_inscricao_id and status = 'contemplada'
  ) then
    raise exception 'O contemplado desta apuração não está mais ativo.';
  end if;
  if not exists (
    select 1 from public.promocao_veste_phenix_30_anos where status = 'valida' and id <> a.vencedor_inscricao_id
  ) then
    raise exception 'Não há outra inscrição válida para uma nova busca.';
  end if;

  update public.promocao_veste_phenix_30_anos
     set status = 'desclassificada',
         motivo_status = format('Desclassificado na %sª busca (apuração %s): %s', a.ordem_busca, a.id, v_motivo),
         atualizado_em = now()
   where id = a.vencedor_inscricao_id;

  update public.promocao_veste_phenix_30_anos_apuracoes
     set desclassificada_em = now(), desclassificada_por = auth.uid(), motivo_desclassificacao = v_motivo
   where id = a.id;

  -- Mesmas regras da apuração original (menor diferença entre os 10 números de cada
  -- inscrição válida; empate vai para a inscrição mais antiga), com o mesmo resultado.
  select * into r from public.apurar_veste_phenix(a.numero_loteria, a.data_extracao, a.concurso, a.fonte_url);

  update public.promocao_veste_phenix_30_anos_apuracoes
     set ordem_busca = a.ordem_busca + 1, apuracao_anterior_id = a.id
   where id = r.apuracao_id;

  return query select r.apuracao_id, r.inscricao_id, r.numero_sorte, r.nome_completo, r.diferenca, r.criado_em, r.total_empatados, a.ordem_busca + 1;
end $$;

revoke all on function public.nova_busca_veste_phenix(uuid, text) from public, anon;
grant execute on function public.nova_busca_veste_phenix(uuid, text) to authenticated;
