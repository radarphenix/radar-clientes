-- Visitas registradas no CIGAM (acompanhamentos com título C10 VISITA ou C15 VISITA TECNICA,
-- decisão do usuário em 24/11/2026) para a cobertura da carteira no Dashboard.
-- A API do CIGAM só busca acompanhamentos por cliente: a função cigam-acompanhamentos?sync=visitas
-- percorre os clientes em lotes (os mais desatualizados primeiro) e grava aqui.
create table if not exists public.cigam_visitas_clientes (
  codigo_cliente text primary key,
  ultima_visita date,
  titulo text,
  usuario text,
  atualizado_em timestamptz not null default now()
);

alter table public.cigam_visitas_clientes enable row level security;
revoke all on public.cigam_visitas_clientes from anon;
revoke insert, update, delete on public.cigam_visitas_clientes from authenticated;
grant select on public.cigam_visitas_clientes to authenticated;

-- Lê só quem enxerga o cliente (a subconsulta em clientes já aplica o recorte de carteira da RLS).
drop policy if exists "visitas cigam de clientes visiveis" on public.cigam_visitas_clientes;
create policy "visitas cigam de clientes visiveis" on public.cigam_visitas_clientes
  for select to authenticated
  using (exists (
    select 1 from public.clientes c
     where lpad(regexp_replace(c.codigo_cliente, '\D', '', 'g'), 6, '0') = cigam_visitas_clientes.codigo_cliente
  ));

comment on table public.cigam_visitas_clientes is
  'Última visita (C10/C15) por cliente lida do CIGAM pela função cigam-acompanhamentos?sync=visitas. Escrita só service_role.';

-- Agendamento: 01h a 04h (horário de Brasília = 04h a 07h UTC), a cada 10 min; cada chamada atualiza
-- um lote (~100 s). Autorização: x-sync-token (segredo no Vault, nome cigam_sync_token, igual ao
-- secret CIGAM_SYNC_TOKEN da função). A chave anon abaixo é pública (é a mesma do app).
select cron.unschedule('cigam-visitas-clientes') where exists (select 1 from cron.job where jobname = 'cigam-visitas-clientes');
select cron.schedule('cigam-visitas-clientes', '*/10 4-7 * * *', $cron$
  select net.http_post(
    url := 'https://ujrvncptcymootpyalpd.supabase.co/functions/v1/cigam-acompanhamentos?sync=visitas',
    headers := jsonb_build_object(
      'Authorization', 'Bearer sb_publishable_IIfj4bdD--ggfXg-UK6WkA_WTQuk5zr',
      'apikey', 'sb_publishable_IIfj4bdD--ggfXg-UK6WkA_WTQuk5zr',
      'x-sync-token', (select decrypted_secret from vault.decrypted_secrets where name = 'cigam_sync_token')
    ),
    timeout_milliseconds := 150000
  );
$cron$);
