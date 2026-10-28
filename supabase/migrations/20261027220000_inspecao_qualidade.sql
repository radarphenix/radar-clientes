-- Inspeção de Qualidade no Radar (irmão do programa desktop MWInspecaoQualidade).
-- Tudo novo e isolado: tabelas inspecao_*, nenhuma tabela existente é alterada.
-- Idempotente: no período "Radar interno" foi aplicada por `supabase db query` (fora do
-- histórico de migrations); ao oficializar, o `db push` do workflow roda de novo sem efeito.
--
-- Colunas reservadas para evolução, em todas as tabelas de conteúdo:
--   extras jsonb        -> campos novos sem migration (o app lê/grava chaves livres)
--   reservado_texto_1..3, reservado_numero_1..2, reservado_data_1 -> para quando um campo
--   precisar de índice/filtro antes de ganhar nome próprio
--   versao_modelo int   -> versão do formato (para converter dados antigos ao abrir)

-- ---------------------------------------------------------------- acesso
create table if not exists public.inspecao_acessos (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nome text not null default '',
  email text not null default '',
  -- leitura < inspetor < aprovador < admin
  papel text not null default 'leitura' check (papel in ('leitura','inspetor','aprovador','admin')),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  criado_por uuid,
  extras jsonb not null default '{}'::jsonb,
  reservado_texto_1 text, reservado_texto_2 text, reservado_texto_3 text
);

-- Papel na Inspeção de quem está logado: o da tabela própria; admin ativo do Radar entra como admin.
create or replace function public.inspecao_papel_atual()
returns text language sql stable security definer set search_path = public as $$
  select coalesce(
    (select a.papel from inspecao_acessos a where a.user_id = auth.uid() and a.ativo),
    (select 'admin' from perfis p where p.user_id = auth.uid() and p.ativo and p.tipo_perfil = 'admin' limit 1)
  )
$$;

create or replace function public.inspecao_nivel(p text)
returns int language sql immutable as $$
  select case p when 'leitura' then 1 when 'inspetor' then 2 when 'aprovador' then 3 when 'admin' then 4 else 0 end
$$;

create or replace function public.inspecao_pode(minimo text)
returns boolean language sql stable security definer set search_path = public as $$
  select public.inspecao_nivel(public.inspecao_papel_atual()) >= public.inspecao_nivel(minimo)
$$;

-- ---------------------------------------------------------------- inspeções
create table if not exists public.inspecoes (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique,               -- aaaaMMdd-HHmmss, igual ao desktop; nunca muda
  revisao int not null default 0,
  ultima_revisao_finalizada int not null default -1,
  ultima_revisao_gerada int not null default -1,
  finalizado boolean not null default false,
  finalizado_em timestamptz,
  finalizado_por text not null default '',
  enviado_email_em timestamptz,
  enviado_email_revisao int not null default -1,
  titulo text not null default 'RELATÓRIO DE INSPEÇÃO DE QUALIDADE',
  -- listas de {rotulo, valor}, mesmo formato do inspecao.json do desktop
  dados_gerais jsonb not null default '[]'::jsonb,
  informacoes_tecnicas jsonb not null default '[]'::jsonb,
  informacoes_tecnicas_saida jsonb not null default '[]'::jsonb,
  conclusao text not null default '',
  elaborado_por text not null default '',
  aprovado_por text not null default '',
  setor text not null default 'Qualidade',
  -- cópias de campos de dados_gerais para busca/filtro/ligação com clientes (mantidas pelo app)
  cd_cliente text not null default '',
  cliente text not null default '',
  nota_fiscal text not null default '',
  data_inspecao text not null default '',
  produto text not null default '',
  -- trava de edição (substitui o arquivo .editando): renovada a cada minuto, vence em 10
  editando_por uuid,
  editando_nome text not null default '',
  editando_ate timestamptz,
  -- lixeira (substitui _lixeira\): some da lista; apagada de vez depois de 90 dias
  excluido_em timestamptz,
  excluido_por text not null default '',
  pasta_drive_id text not null default '',
  origem text not null default 'radar',      -- radar | desktop (importada)
  criado_em timestamptz not null default now(),
  criado_por uuid default auth.uid(),
  alterado_em timestamptz not null default now(),
  alterado_por uuid,
  versao_modelo int not null default 1,
  extras jsonb not null default '{}'::jsonb,
  reservado_texto_1 text, reservado_texto_2 text, reservado_texto_3 text,
  reservado_numero_1 numeric, reservado_numero_2 numeric,
  reservado_data_1 timestamptz
);
create index if not exists inspecoes_cd_cliente_idx on public.inspecoes (cd_cliente);
create index if not exists inspecoes_lista_idx on public.inspecoes (excluido_em, numero desc);

create table if not exists public.inspecao_detalhamentos (
  id uuid primary key default gen_random_uuid(),
  inspecao_id uuid not null references public.inspecoes(id) on delete cascade,
  ordem int not null default 0,
  titulo text not null default '',
  texto text not null default '',
  criado_em timestamptz not null default now(),
  extras jsonb not null default '{}'::jsonb,
  reservado_texto_1 text, reservado_texto_2 text,
  reservado_numero_1 numeric
);
create index if not exists inspecao_detalhamentos_insp_idx on public.inspecao_detalhamentos (inspecao_id, ordem);

create table if not exists public.inspecao_fotos (
  id uuid primary key default gen_random_uuid(),
  inspecao_id uuid not null references public.inspecoes(id) on delete cascade,
  detalhamento_id uuid not null references public.inspecao_detalhamentos(id) on delete cascade,
  ordem int not null default 0,
  legenda text not null default '',
  drive_file_id text not null default '',
  nome_arquivo text not null default '',
  largura int, altura int, tamanho_bytes int,
  origem text not null default 'upload',     -- upload | celular | importacao
  -- como no desktop: tirar a foto do relatório não apaga o arquivo (revisões antigas o usam)
  removida boolean not null default false,
  criado_em timestamptz not null default now(),
  criado_por uuid,
  extras jsonb not null default '{}'::jsonb,
  reservado_texto_1 text, reservado_numero_1 numeric
);
create index if not exists inspecao_fotos_det_idx on public.inspecao_fotos (detalhamento_id, ordem);

-- retrato de cada revisão finalizada (substitui historico\revNN.json); nunca apagado
create table if not exists public.inspecao_revisoes (
  id uuid primary key default gen_random_uuid(),
  inspecao_id uuid not null references public.inspecoes(id) on delete cascade,
  revisao int not null,
  finalizado_em timestamptz not null default now(),
  finalizado_por text not null default '',
  retrato jsonb not null,
  extras jsonb not null default '{}'::jsonb,
  unique (inspecao_id, revisao)
);

-- QR Code "Do celular": vale só enquanto a janela está aberta no computador
create table if not exists public.inspecao_celular_sessoes (
  token text primary key,
  inspecao_id uuid not null references public.inspecoes(id) on delete cascade,
  detalhamento_id uuid not null references public.inspecao_detalhamentos(id) on delete cascade,
  criado_por uuid default auth.uid(),
  criado_em timestamptz not null default now(),
  expira_em timestamptz not null default now() + interval '2 hours',
  encerrada boolean not null default false,
  recebidas int not null default 0
);

-- configuração compartilhada (substitui _config\): destinatários do e-mail etc.
create table if not exists public.inspecao_config (
  chave text primary key,
  valor jsonb not null default '{}'::jsonb,
  alterado_em timestamptz not null default now()
);

-- ---------------------------------------------------------------- RLS
alter table public.inspecao_acessos enable row level security;
alter table public.inspecoes enable row level security;
alter table public.inspecao_detalhamentos enable row level security;
alter table public.inspecao_fotos enable row level security;
alter table public.inspecao_revisoes enable row level security;
alter table public.inspecao_celular_sessoes enable row level security;
alter table public.inspecao_config enable row level security;

do $$
declare t text;
begin
  -- leitura: qualquer papel; escrita: inspetor ou acima (regras finas no app, como no desktop)
  foreach t in array array['inspecoes','inspecao_detalhamentos','inspecao_fotos','inspecao_revisoes','inspecao_celular_sessoes','inspecao_config'] loop
    execute format('drop policy if exists "inspecao ler" on public.%I', t);
    execute format('create policy "inspecao ler" on public.%I for select to authenticated using (public.inspecao_pode(''leitura''))', t);
    execute format('drop policy if exists "inspecao gravar" on public.%I', t);
    execute format('create policy "inspecao gravar" on public.%I for all to authenticated using (public.inspecao_pode(''inspetor'')) with check (public.inspecao_pode(''inspetor''))', t);
  end loop;
end $$;

drop policy if exists "inspecao acessos proprio" on public.inspecao_acessos;
create policy "inspecao acessos proprio" on public.inspecao_acessos for select to authenticated
  using (user_id = auth.uid() or public.inspecao_pode('admin'));
drop policy if exists "inspecao acessos admin" on public.inspecao_acessos;
create policy "inspecao acessos admin" on public.inspecao_acessos for all to authenticated
  using (public.inspecao_pode('admin')) with check (public.inspecao_pode('admin'));

grant select, insert, update, delete on public.inspecao_acessos, public.inspecoes, public.inspecao_detalhamentos,
  public.inspecao_fotos, public.inspecao_revisoes, public.inspecao_celular_sessoes, public.inspecao_config to authenticated;
grant execute on function public.inspecao_papel_atual(), public.inspecao_pode(text), public.inspecao_nivel(text) to authenticated;
revoke all on public.inspecao_acessos, public.inspecoes, public.inspecao_detalhamentos, public.inspecao_fotos,
  public.inspecao_revisoes, public.inspecao_celular_sessoes, public.inspecao_config from anon;

-- atualização ao vivo (substitui a conferência da pasta a cada 5 s)
do $$
declare t text;
begin
  foreach t in array array['inspecoes','inspecao_detalhamentos','inspecao_fotos'] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
