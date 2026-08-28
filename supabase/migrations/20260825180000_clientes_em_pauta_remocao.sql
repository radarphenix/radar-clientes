-- Suporte a remocao manual de um cliente da pauta (fora do fluxo de rota):
-- se quem remove nao foi quem cadastrou, a justificativa fica registrada.
alter table public.clientes_em_pauta
  add column if not exists motivo_remocao text;

comment on column public.clientes_em_pauta.motivo_remocao is
  'Preenchido quando um usuario remove manualmente uma pauta cadastrada por outro usuario (status vira DESCARTADO); obrigatorio nesse caso, nulo quando quem remove e quem cadastrou.';
