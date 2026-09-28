-- CNPJ deixa de ser obrigatório na inscrição. O check de 14 dígitos continua valendo quando informado
-- (check com valor null passa).
alter table public.promocao_veste_phenix_30_anos alter column cnpj drop not null;
