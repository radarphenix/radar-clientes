-- Números da sorte uniformemente distribuídos entre 00000 e 99999.
-- A restrição única existente continua sendo a garantia final contra colisões.
alter table public.promocao_veste_phenix_30_anos
  alter column numero_sorte drop identity if exists,
  alter column numero_sorte drop default;

alter table public.promocao_veste_phenix_30_anos
  drop constraint if exists promocao_veste_phenix_numero_faixa_check;

alter table public.promocao_veste_phenix_30_anos
  add constraint promocao_veste_phenix_numero_faixa_check
  check (numero_sorte between 0 and 99999);

comment on column public.promocao_veste_phenix_30_anos.numero_sorte is
  'Número aleatório uniforme entre 00000 e 99999, exclusivo por inscrição.';

create or replace function public.limpar_testes_veste_phenix()
returns bigint language plpgsql security definer set search_path=public as $$
declare v_total bigint;
begin
  if auth.role() <> 'service_role' and not exists(select 1 from public.perfis p where p.user_id=auth.uid() and p.tipo_perfil='admin' and p.ativo=true) then raise exception 'Acesso restrito'; end if;
  delete from public.promocao_veste_phenix_30_anos where origem='formulario_teste';
  get diagnostics v_total = row_count;
  return v_total;
end $$;

grant execute on function public.limpar_testes_veste_phenix() to authenticated;
