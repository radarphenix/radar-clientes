create extension if not exists pgcrypto;

create table if not exists public.promocao_veste_phenix_30_anos (
  id uuid primary key default gen_random_uuid(),
  numero_sorte bigint generated always as identity (start with 1) unique not null,
  nome_completo text not null check (char_length(nome_completo) between 5 and 160),
  cpf text not null unique check (cpf ~ '^\d{11}$'),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  telefone text not null,
  empresa text not null,
  cnpj text not null check (cnpj ~ '^\d{14}$'),
  cargo text not null,
  cidade text not null,
  uf char(2) not null,
  segmento text not null,
  relacao_phenix text not null check (relacao_phenix in ('Cliente','Ex-cliente','Parceiro','Empresa convidada')),
  maior_18 boolean not null check (maior_18),
  aceite_regulamento boolean not null check (aceite_regulamento),
  aceite_privacidade boolean not null check (aceite_privacidade),
  aceite_marketing boolean not null default false,
  versao_regulamento text not null default '2026-08-04-pre-aprovacao',
  versao_privacidade text not null default '2026-08-04',
  status text not null default 'valida' check (status in ('valida','desclassificada','contemplada','suplente')),
  motivo_status text,
  email_confirmacao_enviado_em timestamptz,
  origem text not null default 'formulario_web',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

comment on table public.promocao_veste_phenix_30_anos is 'Inscrições auditáveis da campanha Veste Phenix - 30 anos';
create index if not exists promocao_veste_phenix_criado_em_idx on public.promocao_veste_phenix_30_anos (criado_em);
create index if not exists promocao_veste_phenix_status_numero_idx on public.promocao_veste_phenix_30_anos (status, numero_sorte);

create table if not exists public.promocao_veste_phenix_30_anos_auditoria (
  id bigint generated always as identity primary key,
  inscricao_id uuid,
  operacao text not null,
  dados_anteriores jsonb,
  dados_novos jsonb,
  usuario_id uuid default auth.uid(),
  ocorrido_em timestamptz not null default now()
);

create table if not exists public.promocao_veste_phenix_30_anos_apuracoes (
  id uuid primary key default gen_random_uuid(),
  numero_loteria bigint not null check (numero_loteria >= 0),
  data_extracao date not null,
  concurso text,
  fonte_url text,
  comprovante_path text,
  vencedor_inscricao_id uuid references public.promocao_veste_phenix_30_anos(id),
  diferenca_absoluta bigint,
  executado_por uuid default auth.uid(),
  executado_em timestamptz not null default now(),
  observacoes text
);

create or replace function public.validar_cpf(p_cpf text) returns boolean language plpgsql immutable as $$
declare c text := regexp_replace(coalesce(p_cpf,''),'\D','','g'); s int; d1 int; d2 int; i int;
begin
  if length(c) <> 11 or c ~ '^(\d)\1{10}$' then return false; end if;
  s := 0; for i in 1..9 loop s := s + substring(c,i,1)::int * (11-i); end loop;
  d1 := (s * 10) % 11; if d1 = 10 then d1 := 0; end if;
  s := 0; for i in 1..10 loop s := s + substring(c,i,1)::int * (12-i); end loop;
  d2 := (s * 10) % 11; if d2 = 10 then d2 := 0; end if;
  return d1 = substring(c,10,1)::int and d2 = substring(c,11,1)::int;
end $$;

create or replace function public.auditar_promocao_veste_phenix() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.promocao_veste_phenix_30_anos_auditoria(inscricao_id,operacao,dados_anteriores,dados_novos)
  values(coalesce(new.id,old.id),tg_op,case when tg_op<>'INSERT' then to_jsonb(old) end,case when tg_op<>'DELETE' then to_jsonb(new) end);
  return coalesce(new,old);
end $$;
drop trigger if exists promocao_veste_phenix_auditoria on public.promocao_veste_phenix_30_anos;
create trigger promocao_veste_phenix_auditoria after insert or update or delete on public.promocao_veste_phenix_30_anos for each row execute function public.auditar_promocao_veste_phenix();

alter table public.promocao_veste_phenix_30_anos enable row level security;
alter table public.promocao_veste_phenix_30_anos_auditoria enable row level security;
alter table public.promocao_veste_phenix_30_anos_apuracoes enable row level security;
revoke all on public.promocao_veste_phenix_30_anos from anon, authenticated;
revoke all on public.promocao_veste_phenix_30_anos_auditoria from anon, authenticated;
revoke all on public.promocao_veste_phenix_30_anos_apuracoes from anon, authenticated;
grant select, update on public.promocao_veste_phenix_30_anos to authenticated;
grant select on public.promocao_veste_phenix_30_anos_auditoria, public.promocao_veste_phenix_30_anos_apuracoes to authenticated;
create policy "admin consulta promocao" on public.promocao_veste_phenix_30_anos for select to authenticated using (exists(select 1 from public.perfis p where p.user_id=auth.uid() and p.tipo_perfil='admin' and p.ativo=true));
create policy "admin atualiza promocao" on public.promocao_veste_phenix_30_anos for update to authenticated using (exists(select 1 from public.perfis p where p.user_id=auth.uid() and p.tipo_perfil='admin' and p.ativo=true)) with check (exists(select 1 from public.perfis p where p.user_id=auth.uid() and p.tipo_perfil='admin' and p.ativo=true));
create policy "admin consulta auditoria" on public.promocao_veste_phenix_30_anos_auditoria for select to authenticated using (exists(select 1 from public.perfis p where p.user_id=auth.uid() and p.tipo_perfil='admin' and p.ativo=true));
create policy "admin consulta apuracoes" on public.promocao_veste_phenix_30_anos_apuracoes for select to authenticated using (exists(select 1 from public.perfis p where p.user_id=auth.uid() and p.tipo_perfil='admin' and p.ativo=true));

create or replace function public.apurar_veste_phenix(p_numero_loteria bigint,p_data_extracao date,p_concurso text default null,p_fonte_url text default null)
returns table(inscricao_id uuid,numero_sorte bigint,nome_completo text,diferenca bigint) language plpgsql security definer set search_path=public as $$
declare v public.promocao_veste_phenix_30_anos%rowtype;
begin
  if auth.role() <> 'service_role' and not exists(select 1 from public.perfis p where p.user_id=auth.uid() and p.tipo_perfil='admin' and p.ativo=true) then raise exception 'Acesso restrito'; end if;
  select * into v from public.promocao_veste_phenix_30_anos where status='valida' order by abs(numero_sorte-p_numero_loteria),criado_em,id limit 1;
  if v.id is null then raise exception 'Nenhuma inscrição válida'; end if;
  update public.promocao_veste_phenix_30_anos set status='contemplada',atualizado_em=now() where id=v.id;
  insert into public.promocao_veste_phenix_30_anos_apuracoes(numero_loteria,data_extracao,concurso,fonte_url,vencedor_inscricao_id,diferenca_absoluta) values(p_numero_loteria,p_data_extracao,p_concurso,p_fonte_url,v.id,abs(v.numero_sorte-p_numero_loteria));
  return query select v.id,v.numero_sorte,v.nome_completo,abs(v.numero_sorte-p_numero_loteria);
end $$;
grant execute on function public.apurar_veste_phenix(bigint,date,text,text) to authenticated;

create or replace function public.limpar_testes_veste_phenix()
returns bigint language plpgsql security definer set search_path=public as $$
declare v_total bigint;
begin
  if auth.role() <> 'service_role' and not exists(select 1 from public.perfis p where p.user_id=auth.uid() and p.tipo_perfil='admin' and p.ativo=true) then raise exception 'Acesso restrito'; end if;
  if exists(select 1 from public.promocao_veste_phenix_30_anos where origem <> 'formulario_teste') then raise exception 'Existem inscrições de produção; a sequência não pode ser reiniciada automaticamente'; end if;
  delete from public.promocao_veste_phenix_30_anos where origem='formulario_teste';
  get diagnostics v_total = row_count;
  alter table public.promocao_veste_phenix_30_anos alter column numero_sorte restart with 1;
  return v_total;
end $$;
grant execute on function public.limpar_testes_veste_phenix() to authenticated;

-- A inscrição pública é feita exclusivamente pela Edge Function com service role.
-- Isso impede leitura pública de CPF/e-mail e evita contornar as validações.
