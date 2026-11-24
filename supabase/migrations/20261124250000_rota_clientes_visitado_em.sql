-- Data da visita (24/11/2026): até aqui marcar "visitado" só mudava o status, sem data.
-- O Dashboard (cobertura da carteira) precisa saber QUANDO cada cliente foi visitado.
alter table public.rota_clientes add column if not exists visitado_em timestamptz;

-- Visitas antigas: melhor estimativa = data prevista da visita, senão fim/data da rota, senão inclusão.
update public.rota_clientes rc
   set visitado_em = coalesce(rc.data_prevista_visita::timestamp, r.finalizada_em, r.data_rota::timestamp, rc.created_at)
  from public.rotas r
 where r.id = rc.rota_id
   and rc.status = 'VISITADO'
   and rc.visitado_em is null;

-- Daqui em diante o banco grava sozinho (vale para o app publicado sem mudança de tela).
create or replace function public.rota_clientes_marcar_visitado_em()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.status = 'VISITADO' and (tg_op = 'INSERT' or old.status is distinct from 'VISITADO') then
    new.visitado_em := coalesce(new.visitado_em, now());
  elsif new.status is distinct from 'VISITADO' then
    new.visitado_em := null;
  end if;
  return new;
end $$;
revoke execute on function public.rota_clientes_marcar_visitado_em() from public, anon, authenticated;

drop trigger if exists rota_clientes_visitado_em on public.rota_clientes;
create trigger rota_clientes_visitado_em
  before insert or update of status on public.rota_clientes
  for each row execute function public.rota_clientes_marcar_visitado_em();

create index if not exists rota_clientes_visitado_em_idx on public.rota_clientes (cliente_id, visitado_em desc) where status = 'VISITADO';
