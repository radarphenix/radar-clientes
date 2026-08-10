alter table public.rota_clientes
  add column if not exists incluido_por uuid;

comment on column public.rota_clientes.incluido_por is
  'Usuario (auth.users.id) que incluiu este cliente na rota. A data de inclusao ja e registrada em created_at.';
