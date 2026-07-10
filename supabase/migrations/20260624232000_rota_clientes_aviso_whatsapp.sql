alter table public.rota_clientes
  add column if not exists aviso_whatsapp_em timestamptz,
  add column if not exists aviso_whatsapp_por uuid,
  add column if not exists aviso_whatsapp_mensagem text;
