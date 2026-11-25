-- Local onde a pessoa estava ao marcar o cliente como "visitado" (pedido do usuário, 25/11/2026).
-- Só guarda os dados, sem aviso na tela. Preenchido pelo navegador logo após marcar visitado, se o
-- aparelho permitir a localização; se negar ou falhar, fica nulo e nada muda no fluxo.
alter table public.rota_clientes
  add column if not exists visitado_latitude double precision,
  add column if not exists visitado_longitude double precision,
  add column if not exists visitado_precisao_m double precision,
  add column if not exists visitado_local_em timestamptz;

comment on column public.rota_clientes.visitado_latitude is 'Latitude do aparelho ao marcar visitado (nulo se o aparelho não permitiu).';
comment on column public.rota_clientes.visitado_longitude is 'Longitude do aparelho ao marcar visitado.';
comment on column public.rota_clientes.visitado_precisao_m is 'Precisão informada pelo aparelho, em metros.';
comment on column public.rota_clientes.visitado_local_em is 'Momento em que a localização foi lida.';
