-- Correção e limpeza dos cadastros de produtos da feira pelo painel admin.
-- Até aqui a tabela era só leitura para o admin. Agora o admin pode corrigir os
-- campos e excluir cadastros (teste, duplicado, digitado errado).
-- A exclusão é lógica (excluido_em): a linha sai do relatório e do Excel, mas pode
-- ser restaurada. Toda alteração fica registrada em _auditoria (antes/depois).

alter table public.cadastro_produtos_feira_phenix
  add column if not exists atualizado_em timestamptz,
  add column if not exists atualizado_por uuid,
  add column if not exists excluido_em timestamptz,
  add column if not exists excluido_por uuid;

create table if not exists public.cadastro_produtos_feira_phenix_auditoria (
  id bigint generated always as identity primary key,
  cadastro_id uuid not null,
  acao text not null,
  antes jsonb not null,
  depois jsonb,
  feito_por uuid,
  feito_em timestamptz not null default now()
);

comment on table public.cadastro_produtos_feira_phenix_auditoria is 'Histórico das correções e exclusões feitas pelo admin nos cadastros de produtos da feira.';
create index if not exists cadastro_produtos_feira_auditoria_cadastro_idx on public.cadastro_produtos_feira_phenix_auditoria (cadastro_id, feito_em desc);
alter table public.cadastro_produtos_feira_phenix_auditoria enable row level security;
revoke all on public.cadastro_produtos_feira_phenix_auditoria from anon, authenticated;
grant select on public.cadastro_produtos_feira_phenix_auditoria to authenticated;

drop policy if exists "admin consulta auditoria cadastro produtos feira" on public.cadastro_produtos_feira_phenix_auditoria;
create policy "admin consulta auditoria cadastro produtos feira" on public.cadastro_produtos_feira_phenix_auditoria
  for select to authenticated
  using (exists (select 1 from public.perfis p where p.user_id = auth.uid() and p.tipo_perfil = 'admin' and p.ativo = true));

create or replace function public.auditar_cadastro_produtos_feira()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    insert into public.cadastro_produtos_feira_phenix_auditoria (cadastro_id, acao, antes, feito_por)
    values (old.id, 'removido', to_jsonb(old), auth.uid());
    return old;
  end if;

  new.atualizado_em := now();
  new.atualizado_por := auth.uid();
  if new.excluido_em is not null and old.excluido_em is null then
    new.excluido_por := auth.uid();
  elsif new.excluido_em is null then
    new.excluido_por := null;
  end if;

  insert into public.cadastro_produtos_feira_phenix_auditoria (cadastro_id, acao, antes, depois, feito_por)
  values (
    old.id,
    case
      when new.excluido_em is not null and old.excluido_em is null then 'excluido'
      when new.excluido_em is null and old.excluido_em is not null then 'restaurado'
      else 'corrigido'
    end,
    to_jsonb(old), to_jsonb(new), auth.uid()
  );
  return new;
end $$;

drop trigger if exists cadastro_produtos_feira_auditoria on public.cadastro_produtos_feira_phenix;
create trigger cadastro_produtos_feira_auditoria
  before update or delete on public.cadastro_produtos_feira_phenix
  for each row execute function public.auditar_cadastro_produtos_feira();

-- Só UPDATE: não há DELETE para o painel, a exclusão é sempre lógica.
grant update on public.cadastro_produtos_feira_phenix to authenticated;

drop policy if exists "admin corrige cadastro produtos feira" on public.cadastro_produtos_feira_phenix;
create policy "admin corrige cadastro produtos feira" on public.cadastro_produtos_feira_phenix
  for update to authenticated
  using (exists (select 1 from public.perfis p where p.user_id = auth.uid() and p.tipo_perfil = 'admin' and p.ativo = true))
  with check (exists (select 1 from public.perfis p where p.user_id = auth.uid() and p.tipo_perfil = 'admin' and p.ativo = true));
