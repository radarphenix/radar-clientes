-- Contadores sem PII em claro: a Edge Function envia chaves SHA-256.
create table if not exists public.promocao_veste_phenix_rate_limits (
  chave text primary key,
  inicio_janela timestamptz not null default now(),
  quantidade integer not null default 0 check (quantidade >= 0),
  atualizado_em timestamptz not null default now()
);

alter table public.promocao_veste_phenix_rate_limits enable row level security;
revoke all on public.promocao_veste_phenix_rate_limits from anon, authenticated;

create or replace function public.registrar_tentativa_veste_phenix(
  p_chave text, p_limite integer, p_janela_segundos integer
) returns boolean
language plpgsql security definer set search_path=public as $$
declare v_quantidade integer;
begin
  if auth.role() <> 'service_role' then raise exception 'Acesso restrito'; end if;
  if length(p_chave) > 128 or p_limite < 1 or p_janela_segundos < 1 then raise exception 'Parâmetros inválidos'; end if;
  insert into public.promocao_veste_phenix_rate_limits(chave,inicio_janela,quantidade,atualizado_em)
  values(p_chave,now(),1,now())
  on conflict (chave) do update set
    inicio_janela=case when now()-promocao_veste_phenix_rate_limits.inicio_janela >= make_interval(secs=>p_janela_segundos) then now() else promocao_veste_phenix_rate_limits.inicio_janela end,
    quantidade=case when now()-promocao_veste_phenix_rate_limits.inicio_janela >= make_interval(secs=>p_janela_segundos) then 1 else promocao_veste_phenix_rate_limits.quantidade+1 end,
    atualizado_em=now()
  returning quantidade into v_quantidade;
  return v_quantidade <= p_limite;
end $$;

revoke all on function public.registrar_tentativa_veste_phenix(text,integer,integer) from public, anon, authenticated;
grant execute on function public.registrar_tentativa_veste_phenix(text,integer,integer) to service_role;
