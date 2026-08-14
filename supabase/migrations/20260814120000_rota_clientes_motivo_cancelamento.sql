alter table public.rota_clientes
  add column if not exists motivo_cancelamento text;

comment on column public.rota_clientes.motivo_cancelamento is
  'Motivo informado pelo tecnico ao cancelar a visita ao cliente na execucao da rota.';
