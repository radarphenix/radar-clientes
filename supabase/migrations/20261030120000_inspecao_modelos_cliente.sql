-- Inspeção de Qualidade: modelo de itens por cliente.
-- Inspeção nova de um cliente com modelo nasce (ao escolher o cliente, com os itens ainda vazios)
-- com os itens do modelo; cliente sem modelo fica com o padrão geral (tipos marcados como padrão).
-- Só no Radar: o desktop MWInspecaoQualidade segue com a lista fixa (diferença aceita em 30/10/2026).
-- Idempotente (aplicado antes por `supabase db query -f`; o `db push` do workflow roda de novo sem efeito).

create table if not exists public.inspecao_modelos_cliente (
  codigo_cliente text primary key,           -- inspecoes.cd_cliente / clientes.codigo_cliente
  cliente text not null default '',          -- nome, só para a lista de modelos
  titulos jsonb not null default '[]'::jsonb, -- nomes dos itens, na ordem
  alterado_em timestamptz not null default now(),
  alterado_por uuid default auth.uid(),
  extras jsonb not null default '{}'::jsonb,
  reservado_texto_1 text
);

alter table public.inspecao_modelos_cliente enable row level security;
drop policy if exists "inspecao modelos ler" on public.inspecao_modelos_cliente;
create policy "inspecao modelos ler" on public.inspecao_modelos_cliente for select to authenticated
  using ((select public.inspecao_pode('leitura')));
drop policy if exists "inspecao modelos gerenciar" on public.inspecao_modelos_cliente;
create policy "inspecao modelos gerenciar" on public.inspecao_modelos_cliente for all to authenticated
  using ((select public.inspecao_pode('aprovador'))) with check ((select public.inspecao_pode('aprovador')));
grant select, insert, update, delete on public.inspecao_modelos_cliente to authenticated;
revoke all on public.inspecao_modelos_cliente from anon;
