-- Veste Phenix 30 anos: data de nascimento opcional, coletada a partir de 09/10/2026 para as
-- mensagens de aniversário. As inscrições anteriores ficam com null.
-- A Edge Function inscrever-veste-phenix grava a data logo depois da RPC de inscrição (que não muda)
-- e valida data real e idade >= 18. Aqui só o limite inferior, porque CHECK não aceita current_date.
alter table public.promocao_veste_phenix_30_anos
  add column if not exists data_nascimento date;

alter table public.promocao_veste_phenix_30_anos
  drop constraint if exists promocao_veste_phenix_data_nascimento_check;
alter table public.promocao_veste_phenix_30_anos
  add constraint promocao_veste_phenix_data_nascimento_check
  check (data_nascimento is null or data_nascimento >= date '1900-01-01');

comment on column public.promocao_veste_phenix_30_anos.data_nascimento is
  'Opcional, informada no formulário desde 09/10/2026; uso: mensagens de aniversário.';
