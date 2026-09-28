-- Registro dos comunicados ao contemplado (e-mail e WhatsApp via WAHA), disparados pelo painel admin
-- através da Edge Function inscrever-veste-phenix. Evita reenvio sem querer e deixa histórico.
alter table public.promocao_veste_phenix_30_anos_apuracoes
  add column if not exists comunicado_email_em timestamptz,
  add column if not exists comunicado_email_por uuid,
  add column if not exists comunicado_whatsapp_em timestamptz,
  add column if not exists comunicado_whatsapp_por uuid,
  add column if not exists comunicado_ultimo_erro text;
