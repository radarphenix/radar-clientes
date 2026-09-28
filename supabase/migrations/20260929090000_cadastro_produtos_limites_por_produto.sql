-- Limite de unidades por produto passa a variar: formadora até 5, secadora espiral até 14,
-- os demais (inclusive "Outros") seguem até 3. O limite fino fica na Edge Function.
alter table public.cadastro_produtos_feira_phenix
  drop constraint if exists cadastro_produtos_feira_phenix_item_check,
  add constraint cadastro_produtos_feira_phenix_item_check check (item between 1 and 14);
