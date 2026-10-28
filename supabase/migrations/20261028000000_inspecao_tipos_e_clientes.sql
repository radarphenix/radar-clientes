-- Inspeção de Qualidade, parte 2: cadastro dos tipos de detalhamento e busca de clientes.
-- Idempotente; aplicado por `supabase db query -f` no período "Radar interno".

-- ---------------------------------------------------------------- tipos de detalhamento
-- padrao = toda inspeção nova já nasce com ele; os demais aparecem em "Adicionar item".
-- (O desktop MWInspecaoQualidade tem a mesma lista fixa em Inspecao.cs; ao mudar aqui, avaliar lá.)
create table if not exists public.inspecao_tipos_detalhamento (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  padrao boolean not null default false,
  ordem int not null default 0,
  ativo boolean not null default true,
  descricao text not null default '',     -- dica do que observar no item (aparece no cartão)
  criado_em timestamptz not null default now(),
  extras jsonb not null default '{}'::jsonb,
  reservado_texto_1 text
);
create unique index if not exists inspecao_tipos_detalhamento_nome_idx on public.inspecao_tipos_detalhamento (lower(nome));

insert into public.inspecao_tipos_detalhamento (nome, padrao, ordem) values
  ('Condições gerais', true, 10), ('Embalagem', true, 20), ('Lateral esquerda', true, 30),
  ('Lateral direita', true, 40), ('Superior', true, 50), ('Inferior', true, 60), ('Centro', true, 70),
  ('Emenda', true, 80), ('Acessórios', true, 90),
  ('Identificação / etiqueta', false, 110), ('Dimensões', false, 120), ('Costura', false, 130),
  ('Ourela / bordas', false, 140), ('Furos / rasgos', false, 150), ('Desgaste / abrasão', false, 160),
  ('Manchas / contaminação', false, 170), ('Deformação / enrugamento', false, 180), ('Colmatação', false, 190),
  ('Permeabilidade (CFM)', false, 200), ('Amostra coletada', false, 210), ('Documentação', false, 220)
on conflict do nothing;

alter table public.inspecao_tipos_detalhamento enable row level security;
drop policy if exists "inspecao tipos ler" on public.inspecao_tipos_detalhamento;
create policy "inspecao tipos ler" on public.inspecao_tipos_detalhamento for select to authenticated
  using ((select public.inspecao_pode('leitura')));
drop policy if exists "inspecao tipos gerenciar" on public.inspecao_tipos_detalhamento;
create policy "inspecao tipos gerenciar" on public.inspecao_tipos_detalhamento for all to authenticated
  using ((select public.inspecao_pode('aprovador'))) with check ((select public.inspecao_pode('aprovador')));
grant select, insert, update, delete on public.inspecao_tipos_detalhamento to authenticated;
revoke all on public.inspecao_tipos_detalhamento from anon;

-- ---------------------------------------------------------------- busca de clientes
-- Quem só tem a Inspeção (perfil Qualidade) não lê a tabela clientes; esta busca devolve só o
-- necessário para preencher Cliente e Código cliente, e só para quem tem acesso às Inspeções.
create or replace function public.inspecao_buscar_clientes(p_termo text)
returns table (codigo_cliente text, cliente text, cidade text, uf text, email text)
language sql stable security definer set search_path = public as $$
  select c.codigo_cliente::text, c.cliente::text, c.cidade::text, c.uf::text, c.email::text
  from clientes c
  where public.inspecao_pode('leitura')
    and length(trim(coalesce(p_termo, ''))) >= 2
    and (c.cliente ilike '%' || trim(p_termo) || '%' or c.codigo_cliente::text ilike trim(p_termo) || '%')
  order by (c.codigo_cliente::text = trim(p_termo)) desc, c.cliente
  limit 15
$$;
grant execute on function public.inspecao_buscar_clientes(text) to authenticated;

-- lixeira: quem restaura precisa achar as excluídas (já cobertas pela política de leitura)
create index if not exists inspecoes_lixeira_idx on public.inspecoes (excluido_em) where excluido_em is not null;
