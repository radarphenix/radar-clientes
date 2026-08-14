-- "Limpar inscricoes de teste" falhava com violacao de foreign key quando a
-- inscricao apagada era vencedora de alguma apuracao (mesmo ja revertida),
-- pois promocao_veste_phenix_30_anos_apuracoes.vencedor_inscricao_id
-- bloqueava a exclusao. A apuracao e um registro de auditoria e nao pode
-- ser apagada junto; a solucao e permitir que a referencia fique nula
-- quando a inscricao de origem for removida, preservando uma copia dos
-- dados do vencedor na propria linha da apuracao.

alter table public.promocao_veste_phenix_30_anos_apuracoes
  add column if not exists vencedor_nome_completo text,
  add column if not exists vencedor_numero_sorte bigint,
  add column if not exists vencedor_cpf text;

-- Preenche o historico ja existente antes de soltar a constraint atual.
update public.promocao_veste_phenix_30_anos_apuracoes a
set vencedor_nome_completo = v.nome_completo,
    vencedor_numero_sorte = v.numero_sorte,
    vencedor_cpf = v.cpf
from public.promocao_veste_phenix_30_anos v
where a.vencedor_inscricao_id = v.id
  and a.vencedor_nome_completo is null;

alter table public.promocao_veste_phenix_30_anos_apuracoes
  drop constraint if exists promocao_veste_phenix_30_anos_apurac_vencedor_inscricao_id_fkey;

alter table public.promocao_veste_phenix_30_anos_apuracoes
  add constraint promocao_veste_phenix_30_anos_apurac_vencedor_inscricao_id_fkey
  foreign key (vencedor_inscricao_id)
  references public.promocao_veste_phenix_30_anos(id)
  on delete set null;

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
    (numero_loteria, data_extracao, concurso, fonte_url, vencedor_inscricao_id,
     diferenca_absoluta, vencedor_nome_completo, vencedor_numero_sorte, vencedor_cpf)
  values
    (p_numero_loteria, p_data_extracao, p_concurso, p_fonte_url, v.id,
     v_menor_diferenca, v.nome_completo, v.numero_sorte, v.cpf)
  returning id into v_apuracao_id;

  return query
    select v_apuracao_id, v.id, v.numero_sorte, v.nome_completo, v_menor_diferenca, v.criado_em, v_total_empatados;
end
$$;
