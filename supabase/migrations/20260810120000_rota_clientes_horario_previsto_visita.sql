alter table public.rota_clientes
  add column if not exists horario_previsto_visita time;

comment on column public.rota_clientes.horario_previsto_visita is
  'Horario previsto de chegada do tecnico no cliente dentro da rota.';
