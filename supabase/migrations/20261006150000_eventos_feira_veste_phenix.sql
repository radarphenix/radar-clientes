-- Contador de cliques do menu da feira e de acessos à página da promoção (QR code, links).
-- Sem dados pessoais: só o tipo de evento, a origem (?origem= do link) e o horário.
create table if not exists public.veste_phenix_eventos (
  id bigint generated always as identity primary key,
  evento text not null check (evento in (
    'menu_veste_phenix', 'menu_cadastro_produtos', 'menu_vestcontrol',
    'acesso_promocao', 'inscricao_concluida'
  )),
  origem text not null default 'direto' check (origem ~ '^[a-z0-9_-]{1,40}$'),
  criado_em timestamptz not null default now()
);

create index if not exists veste_phenix_eventos_evento_idx on public.veste_phenix_eventos (evento, criado_em);

alter table public.veste_phenix_eventos enable row level security;
revoke all on public.veste_phenix_eventos from anon, authenticated;

-- Gravação pública (páginas sem login) só por esta função, que valida evento e origem.
create or replace function public.registrar_evento_veste_phenix(p_evento text, p_origem text default 'direto')
returns void
language plpgsql security definer set search_path = public as $$
declare v_origem text := lower(coalesce(nullif(trim(p_origem), ''), 'direto'));
begin
  if v_origem !~ '^[a-z0-9_-]{1,40}$' then v_origem := 'outro'; end if;
  insert into public.veste_phenix_eventos (evento, origem) values (p_evento, v_origem);
end $$;

revoke all on function public.registrar_evento_veste_phenix(text, text) from public;
grant execute on function public.registrar_evento_veste_phenix(text, text) to anon, authenticated;

-- Resumo para o painel admin: total e hoje (horário de Brasília) por evento e origem.
create or replace function public.resumo_eventos_veste_phenix()
returns table (evento text, origem text, total bigint, hoje bigint)
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.perfis p where p.user_id = auth.uid() and p.tipo_perfil = 'admin' and p.ativo) then
    raise exception 'Acesso restrito';
  end if;
  return query
    select e.evento, e.origem, count(*),
           count(*) filter (where (e.criado_em at time zone 'America/Sao_Paulo')::date = (now() at time zone 'America/Sao_Paulo')::date)
      from public.veste_phenix_eventos e
     group by e.evento, e.origem
     order by e.evento, count(*) desc;
end $$;

revoke all on function public.resumo_eventos_veste_phenix() from public, anon;
grant execute on function public.resumo_eventos_veste_phenix() to authenticated;
