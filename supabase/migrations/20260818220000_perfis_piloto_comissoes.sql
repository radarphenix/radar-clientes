-- Flag de piloto controlado: representante com esta flag ativa enxerga o menu
-- Comissoes no Radar mesmo com a tela ainda restrita a admin para os demais.
alter table public.perfis
  add column if not exists piloto_comissoes boolean not null default false;

comment on column public.perfis.piloto_comissoes is
  'Libera o menu Comissoes no Radar para este representante especifico, antes da liberacao geral.';
