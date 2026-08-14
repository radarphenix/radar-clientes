-- Reverte de uma vez todos os contemplados de teste ainda ativos. Serve
-- tanto para destravar a apuracao apos testes repetidos anteriores a esta
-- migration quanto para o dia a dia (o botao "Reverter apuracao" isolado
-- so sabe reverter o resultado ainda guardado na tela).
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

  update public.promocao_veste_phenix_30_anos_apuracoes a
  set revertida_em = now(), revertida_por = auth.uid()
  from public.promocao_veste_phenix_30_anos v
  where a.vencedor_inscricao_id = v.id
    and v.status = 'contemplada'
    and v.origem = 'formulario_teste'
    and a.revertida_em is null;

  update public.promocao_veste_phenix_30_anos
  set status = 'valida', atualizado_em = now()
  where status = 'contemplada' and origem = 'formulario_teste';

  get diagnostics v_total = row_count;
  return v_total;
end
$$;

grant execute on function public.reverter_todos_contemplados_teste_veste_phenix() to authenticated;
