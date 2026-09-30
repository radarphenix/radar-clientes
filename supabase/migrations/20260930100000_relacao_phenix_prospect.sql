-- Relação com a Phenix passa a ter só três opções: Cliente, Ex-cliente e Prospect
-- ("Parceiro" e "Empresa convidada" saem do formulário e do regulamento).
-- Inscrições oficiais só começam em 06/10/2026; qualquer linha antiga com os valores
-- removidos é de teste e vira Prospect para não bloquear a nova constraint.
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.promocao_veste_phenix_30_anos'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%relacao_phenix%'
  loop
    execute format('alter table public.promocao_veste_phenix_30_anos drop constraint %I', c.conname);
  end loop;
end $$;

update public.promocao_veste_phenix_30_anos
   set relacao_phenix = 'Prospect'
 where relacao_phenix not in ('Cliente','Ex-cliente','Prospect');

alter table public.promocao_veste_phenix_30_anos
  add constraint promocao_veste_phenix_30_anos_relacao_phenix_check
  check (relacao_phenix in ('Cliente','Ex-cliente','Prospect'));
