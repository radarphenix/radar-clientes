alter table public.rota_clientes
  add column if not exists data_prevista_visita date;

comment on column public.rota_clientes.data_prevista_visita is
  'Data prevista para visitar o cliente dentro da rota.';

create index if not exists rota_clientes_data_prevista_visita_idx
  on public.rota_clientes (data_prevista_visita, status);
