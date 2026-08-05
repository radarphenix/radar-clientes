alter table public.promocao_veste_phenix_30_anos
  add column if not exists email_status text not null default 'pendente'
    check (email_status in ('pendente','enviando','enviado','falhou','aguardando_configuracao')),
  add column if not exists email_tentativas integer not null default 0 check (email_tentativas >= 0),
  add column if not exists email_ultimo_erro text;

create index if not exists promocao_veste_phenix_email_pendente_idx
  on public.promocao_veste_phenix_30_anos (email_status, criado_em)
  where email_status in ('pendente','falhou','aguardando_configuracao');

comment on column public.promocao_veste_phenix_30_anos.email_status is
  'O envio ocorre em segundo plano e nunca bloqueia a confirmação do cadastro.';
