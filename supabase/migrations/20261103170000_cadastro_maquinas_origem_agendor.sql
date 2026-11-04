-- Máquinas e medidas: origem AGENDOR (máquinas e medidas importadas do Agendor CRM em 03/11/2026).
-- Mesma regra no Oracle: MWCadastroMaquinas/Sql/Oracle/005_origem_agendor.sql. Aditiva e idempotente.
-- A chave de não repetir a importação vai em id_feira_origem ('AGENDOR:<código da empresa>:<máquina>').
alter table public.cadastro_maquinas drop constraint if exists cadastro_maquinas_origem_check;
alter table public.cadastro_maquinas add constraint cadastro_maquinas_origem_check
  check (origem in ('RADAR', 'CIGAM', 'FEIRA', 'AGENDOR'));
alter table public.cadastro_maquinas_itens drop constraint if exists cadastro_maquinas_itens_origem_check;
alter table public.cadastro_maquinas_itens add constraint cadastro_maquinas_itens_origem_check
  check (origem in ('RADAR', 'CIGAM', 'FEIRA', 'AGENDOR'));
