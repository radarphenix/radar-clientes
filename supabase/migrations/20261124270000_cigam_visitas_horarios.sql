-- Visitas dos acompanhamentos: atualiza às 07h, 12h e 17h de Brasília (10h, 15h e 20h UTC),
-- pedido do usuário em 24/11/2026 (antes: madrugada). Cada rodada leva ~30 s para a carteira toda.
select cron.unschedule('cigam-visitas-clientes') where exists (select 1 from cron.job where jobname = 'cigam-visitas-clientes');
select cron.schedule('cigam-visitas-clientes', '0 10,15,20 * * *', $cron$
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
