-- O job pg_cron "geocodificar-clientes-4x-dia" chama a Edge Function via net.http_post (extensão pg_net),
-- mas a extensão nunca foi habilitada: todas as execuções desde 04/06/2026 falharam com
-- 'schema "net" does not exist' e a geocodificação de clientes parou.
create extension if not exists pg_net;
