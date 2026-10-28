-- Acessos por menu (modelo do Galiê): catálogo de permissões, padrão por tipo de perfil e exceções
-- por pessoa. As regras de segurança (RLS) passam a perguntar "pode <menu>?" em vez de "é admin?".
-- O recorte dos dados NÃO muda: representante continua só com a carteira; rotas, só as que é
-- responsável; quem tem rotas.todas (admin) vê todas.
--
-- Ninguém ganha nem perde acesso: os padrões reproduzem o que cada tipo via em 27/10/2026, conferido
-- linha a linha (fotografia antes/depois por tipo). Script de volta em
-- .codex-backups/20261027_212752_inspecao_qualidade_inicio/VOLTA_regras_rls_antes_permissoes.sql
--
-- Compatibilidade com o Radar publicado (que ainda não tem a tela Acessos): o menu Amostras segue
-- a configuracoes_grupos.permite_menu_amostras e o menu Comissões segue perfis.piloto_comissoes,
-- lidos na hora por radar_pode(), até a tela nova substituir esses ajustes.
-- Idempotente.

-- ------------------------------------------------------------------ catálogo
create table if not exists public.radar_permissoes (
  codigo text primary key,
  nome text not null,
  grupo text not null,          -- grupo do menu (Comercial, Rotas, Gestão e Análise, Qualidade, Administração)
  ordem int not null default 0,
  descricao text not null default '',
  extras jsonb not null default '{}'::jsonb
);

create table if not exists public.radar_permissoes_perfil (
  tipo_perfil text not null,
  codigo text not null references public.radar_permissoes(codigo) on delete cascade,
  permitido boolean not null default false,
  primary key (tipo_perfil, codigo)
);

create table if not exists public.radar_permissoes_usuario (
  user_id uuid not null references auth.users(id) on delete cascade,
  codigo text not null references public.radar_permissoes(codigo) on delete cascade,
  permitido boolean not null,
  alterado_em timestamptz not null default now(),
  alterado_por uuid default auth.uid(),
  primary key (user_id, codigo)
);

-- histórico de quem mudou o quê (tela Acessos)
create table if not exists public.radar_permissoes_historico (
  id bigint generated always as identity primary key,
  quando timestamptz not null default now(),
  quem uuid default auth.uid(),
  alvo text not null,           -- 'perfil:<tipo>' ou 'usuario:<uuid>'
  codigo text not null,
  antes boolean,
  depois boolean
);

insert into public.radar_permissoes (codigo, nome, grupo, ordem, descricao) values
  ('meu_dia', 'Meu Dia', 'Comercial', 10, 'Tela inicial com a agenda do dia'),
  ('clientes', 'Clientes', 'Comercial', 20, 'Consultar clientes (representante: só a carteira)'),
  ('proximos', 'Próximos', 'Comercial', 30, 'Clientes próximos no mapa'),
  ('rotas', 'Rotas', 'Rotas', 40, 'Criar e acompanhar as próprias rotas'),
  ('clientes_em_pauta', 'Clientes em Pauta', 'Rotas', 50, 'Pauta de clientes para visitar'),
  ('pesquisa_rotas', 'Pesquisar rotas', 'Rotas', 60, 'Pesquisa e impressão de rotas'),
  ('rotas.todas', 'Rotas de todos', 'Rotas', 70, 'Ver e alterar rotas de outros usuários, inclusive finalizadas'),
  ('dashboard', 'Dashboard', 'Gestão e Análise', 80, 'Indicadores de rotas e pauta'),
  ('bi_comissoes', 'Painel BI - Comissões', 'Gestão e Análise', 90, 'Comissões de todos os representantes'),
  ('bi_faturamento', 'Painel BI - Faturamento', 'Gestão e Análise', 100, 'Pedidos, notas e financeiro'),
  ('comissoes', 'Comissões', 'Gestão e Análise', 110, 'Tela de comissões (representante: as próprias; demais: todas)'),
  ('comissoes.minha', 'Minha comissão', 'Gestão e Análise', 120, 'Card de comissão do representante no Meu Dia'),
  ('amostras', 'Amostras', 'Gestão e Análise', 130, 'Consulta de amostras'),
  ('inspecao.ver', 'Inspeções - ver', 'Qualidade', 140, 'Ver inspeções e relatórios'),
  ('inspecao.editar', 'Inspeções - editar', 'Qualidade', 150, 'Criar, editar e finalizar inspeções'),
  ('inspecao.aprovar', 'Inspeções - aprovar', 'Qualidade', 160, 'Reabrir e excluir inspeções'),
  ('clientes.gerenciar', 'Cadastro de clientes', 'Administração', 170, 'Cadastrar/alterar clientes, carteiras e importações'),
  ('promocao', 'Promoção 30 anos', 'Administração', 180, 'Promoção e cadastro de produtos da feira Veste Phenix'),
  ('administracao', 'Administração', 'Administração', 190, 'Usuários, acessos, configurações e log de acessos')
on conflict (codigo) do update set nome = excluded.nome, grupo = excluded.grupo, ordem = excluded.ordem, descricao = excluded.descricao;

-- padrões = acesso de hoje (admin tudo; técnico e representante o comercial; representante a própria comissão)
insert into public.radar_permissoes_perfil (tipo_perfil, codigo, permitido)
select t.tipo, p.codigo,
  case
    when t.tipo = 'admin' then true
    when t.tipo in ('tecnico', 'representante') and p.codigo in ('meu_dia','clientes','proximos','rotas','clientes_em_pauta','pesquisa_rotas','dashboard') then true
    when t.tipo = 'representante' and p.codigo = 'comissoes.minha' then true
    when t.tipo = 'qualidade' and p.codigo in ('inspecao.ver','inspecao.editar') then true
    else false
  end
from (values ('admin'), ('tecnico'), ('representante'), ('qualidade')) t(tipo)
cross join public.radar_permissoes p
on conflict (tipo_perfil, codigo) do nothing;

-- ------------------------------------------------------------------ funções
-- Pode? exceção da pessoa > (compatibilidade: amostras/comissões) > padrão do tipo > não.
create or replace function public.radar_pode(p_codigo text)
returns boolean language sql stable security definer set search_path = public as $$
  with eu as (
    select p.tipo_perfil::text tipo, coalesce(p.piloto_comissoes, false) piloto
    from perfis p where p.user_id = auth.uid() and p.ativo limit 1
  )
  select coalesce(
    (select u.permitido from radar_permissoes_usuario u where u.user_id = auth.uid() and u.codigo = p_codigo),
    (select cg.permite_menu_amostras from configuracoes_grupos cg, eu
      where p_codigo = 'amostras' and eu.tipo <> 'admin' and cg.tipo_perfil = eu.tipo),
    -- piloto só valia para representante (técnico piloto via o menu, mas o banco não lhe mostrava nada)
    (select true from eu where p_codigo = 'comissoes' and eu.piloto and eu.tipo = 'representante'),
    (select pp.permitido from radar_permissoes_perfil pp, eu where pp.tipo_perfil = eu.tipo and pp.codigo = p_codigo),
    false)
  and exists (select 1 from eu)
$$;

-- Área comercial: os dados de clientes, pauta e rotas servem a vários menus (Meu Dia, Clientes,
-- Próximos, Rotas, Pauta, Pesquisa, Dashboard). Quem não tem nenhum deles (ex.: perfil Qualidade) não lê.
create or replace function public.radar_area_comercial()
returns boolean language sql stable security definer set search_path = public as $$
  select public.radar_pode('meu_dia') or public.radar_pode('clientes') or public.radar_pode('proximos')
      or public.radar_pode('rotas') or public.radar_pode('clientes_em_pauta') or public.radar_pode('pesquisa_rotas')
      or public.radar_pode('dashboard')
$$;

-- O mapa para a tela (menu): códigos que a pessoa pode.
create or replace function public.radar_minhas_permissoes()
returns text[] language sql stable security definer set search_path = public as $$
  select coalesce(array_agg(codigo order by ordem), '{}') from radar_permissoes where public.radar_pode(codigo)
$$;

-- Cliente na carteira do representante logado (mesma regra que já estava escrita em cada política).
create or replace function public.radar_na_minha_carteira(p_codigo_cliente text, p_codigo_representante text)
returns boolean language sql stable set search_path = public as $$
  select (p_codigo_representante = any (radar_codigos_numericos_equivalentes(radar_perfil_atual_codigo_representante())))
    or exists (select 1 from clientes_representantes cr
               where cr.codigo_cliente = any (radar_codigos_numericos_equivalentes(p_codigo_cliente))
                 and cr.codigo_representante = any (radar_codigos_numericos_equivalentes(radar_perfil_atual_codigo_representante())))
$$;

grant execute on function public.radar_pode(text), public.radar_area_comercial(), public.radar_minhas_permissoes(),
  public.radar_na_minha_carteira(text, text) to authenticated;

-- ------------------------------------------------------------------ RLS do catálogo
alter table public.radar_permissoes enable row level security;
alter table public.radar_permissoes_perfil enable row level security;
alter table public.radar_permissoes_usuario enable row level security;
alter table public.radar_permissoes_historico enable row level security;
drop policy if exists "permissoes ler" on public.radar_permissoes;
create policy "permissoes ler" on public.radar_permissoes for select to authenticated using (true);
drop policy if exists "permissoes perfil ler" on public.radar_permissoes_perfil;
create policy "permissoes perfil ler" on public.radar_permissoes_perfil for select to authenticated using (true);
drop policy if exists "permissoes perfil admin" on public.radar_permissoes_perfil;
create policy "permissoes perfil admin" on public.radar_permissoes_perfil for all to authenticated
  using ((select radar_pode('administracao'))) with check ((select radar_pode('administracao')));
drop policy if exists "permissoes usuario ler" on public.radar_permissoes_usuario;
create policy "permissoes usuario ler" on public.radar_permissoes_usuario for select to authenticated
  using (user_id = auth.uid() or (select radar_pode('administracao')));
drop policy if exists "permissoes usuario admin" on public.radar_permissoes_usuario;
create policy "permissoes usuario admin" on public.radar_permissoes_usuario for all to authenticated
  using ((select radar_pode('administracao'))) with check ((select radar_pode('administracao')));
drop policy if exists "permissoes historico admin" on public.radar_permissoes_historico;
create policy "permissoes historico admin" on public.radar_permissoes_historico for select to authenticated
  using ((select radar_pode('administracao')));
grant select on public.radar_permissoes, public.radar_permissoes_perfil to authenticated;
grant select, insert, update, delete on public.radar_permissoes_usuario to authenticated;
grant insert, update, delete on public.radar_permissoes_perfil to authenticated;
grant select on public.radar_permissoes_historico to authenticated;

create or replace function public.radar_permissoes_registrar()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into radar_permissoes_historico (alvo, codigo, antes, depois)
  values (
    case when tg_table_name = 'radar_permissoes_perfil' then 'perfil:' || coalesce(new.tipo_perfil, old.tipo_perfil)
         else 'usuario:' || coalesce(new.user_id, old.user_id)::text end,
    coalesce(new.codigo, old.codigo),
    case when tg_op = 'INSERT' then null else old.permitido end,
    case when tg_op = 'DELETE' then null else new.permitido end);
  return coalesce(new, old);
end $$;
drop trigger if exists radar_permissoes_perfil_hist on public.radar_permissoes_perfil;
create trigger radar_permissoes_perfil_hist after insert or update or delete on public.radar_permissoes_perfil
  for each row execute function public.radar_permissoes_registrar();
drop trigger if exists radar_permissoes_usuario_hist on public.radar_permissoes_usuario;
create trigger radar_permissoes_usuario_hist after insert or update or delete on public.radar_permissoes_usuario
  for each row execute function public.radar_permissoes_registrar();

-- ------------------------------------------------------------------ regras das tabelas do Radar
-- Amostras
drop policy if exists amostras_phenix_select_conforme_config_grupo on public.amostras_phenix;
create policy amostras_phenix_select_conforme_config_grupo on public.amostras_phenix for select to authenticated
  using ((select radar_pode('amostras')));

-- BI de faturamento
drop policy if exists "admin consulta devolucoes bi" on public.bi_devolucoes_itens;
create policy "admin consulta devolucoes bi" on public.bi_devolucoes_itens for select to authenticated using ((select radar_pode('bi_faturamento')));
drop policy if exists "admin consulta financeiro bi" on public.bi_lancamentos_financeiros;
create policy "admin consulta financeiro bi" on public.bi_lancamentos_financeiros for select to authenticated using ((select radar_pode('bi_faturamento')));
drop policy if exists "admin consulta notas bi" on public.bi_notas_itens;
create policy "admin consulta notas bi" on public.bi_notas_itens for select to authenticated using ((select radar_pode('bi_faturamento')));
drop policy if exists "admin consulta pedidos bi" on public.bi_pedidos_itens;
create policy "admin consulta pedidos bi" on public.bi_pedidos_itens for select to authenticated using ((select radar_pode('bi_faturamento')));

-- Promoção 30 anos / feira
drop policy if exists "admin consulta cadastro produtos feira" on public.cadastro_produtos_feira_phenix;
create policy "admin consulta cadastro produtos feira" on public.cadastro_produtos_feira_phenix for select to authenticated using ((select radar_pode('promocao')));
drop policy if exists "admin corrige cadastro produtos feira" on public.cadastro_produtos_feira_phenix;
create policy "admin corrige cadastro produtos feira" on public.cadastro_produtos_feira_phenix for update to authenticated
  using ((select radar_pode('promocao'))) with check ((select radar_pode('promocao')));
drop policy if exists "admin consulta auditoria cadastro produtos feira" on public.cadastro_produtos_feira_phenix_auditoria;
create policy "admin consulta auditoria cadastro produtos feira" on public.cadastro_produtos_feira_phenix_auditoria for select to authenticated using ((select radar_pode('promocao')));
drop policy if exists "admin atualiza promocao" on public.promocao_veste_phenix_30_anos;
create policy "admin atualiza promocao" on public.promocao_veste_phenix_30_anos for update to authenticated
  using ((select radar_pode('promocao'))) with check ((select radar_pode('promocao')));
drop policy if exists "admin consulta promocao" on public.promocao_veste_phenix_30_anos;
create policy "admin consulta promocao" on public.promocao_veste_phenix_30_anos for select to authenticated using ((select radar_pode('promocao')));
drop policy if exists "admin consulta apuracoes" on public.promocao_veste_phenix_30_anos_apuracoes;
create policy "admin consulta apuracoes" on public.promocao_veste_phenix_30_anos_apuracoes for select to authenticated using ((select radar_pode('promocao')));
drop policy if exists "admin consulta auditoria" on public.promocao_veste_phenix_30_anos_auditoria;
create policy "admin consulta auditoria" on public.promocao_veste_phenix_30_anos_auditoria for select to authenticated using ((select radar_pode('promocao')));
drop policy if exists "admin consulta numeros" on public.promocao_veste_phenix_30_anos_numeros;
create policy "admin consulta numeros" on public.promocao_veste_phenix_30_anos_numeros for select to authenticated using ((select radar_pode('promocao')));

-- Clientes: ler = área comercial (representante: só a carteira); gravar = cadastro de clientes
drop policy if exists clientes_select_por_clientes_representantes on public.clientes;
create policy clientes_select_por_clientes_representantes on public.clientes for select to authenticated
  using ((select radar_area_comercial()) and (radar_perfil_atual_tipo() <> 'representante'
         or radar_na_minha_carteira(codigo_cliente::text, codigo_representante::text)));
drop policy if exists clientes_insert_admin on public.clientes;
create policy clientes_insert_admin on public.clientes for insert to authenticated with check ((select radar_pode('clientes.gerenciar')));
drop policy if exists clientes_update_admin on public.clientes;
create policy clientes_update_admin on public.clientes for update to authenticated
  using ((select radar_pode('clientes.gerenciar'))) with check ((select radar_pode('clientes.gerenciar')));
drop policy if exists clientes_delete_admin on public.clientes;
create policy clientes_delete_admin on public.clientes for delete to authenticated using ((select radar_pode('clientes.gerenciar')));
-- clientes_contatos segue a visibilidade de clientes (política inalterada)

drop policy if exists clientes_geolocalizacao_select_por_carteira on public.clientes_geolocalizacao;
create policy clientes_geolocalizacao_select_por_carteira on public.clientes_geolocalizacao for select to authenticated
  using ((select radar_area_comercial()) and (radar_perfil_atual_tipo() <> 'representante' or exists (
    select 1 from clientes c
    where c.codigo_cliente::text = any (radar_codigos_numericos_equivalentes(clientes_geolocalizacao.codigo_cliente::text))
      and radar_na_minha_carteira(c.codigo_cliente::text, c.codigo_representante::text))));
drop policy if exists clientes_geolocalizacao_insert_admin on public.clientes_geolocalizacao;
create policy clientes_geolocalizacao_insert_admin on public.clientes_geolocalizacao for insert to authenticated with check ((select radar_pode('clientes.gerenciar')));
drop policy if exists clientes_geolocalizacao_update_admin on public.clientes_geolocalizacao;
create policy clientes_geolocalizacao_update_admin on public.clientes_geolocalizacao for update to authenticated
  using ((select radar_pode('clientes.gerenciar'))) with check ((select radar_pode('clientes.gerenciar')));

drop policy if exists clientes_representantes_select_admin_representante on public.clientes_representantes;
create policy clientes_representantes_select_admin_representante on public.clientes_representantes for select to authenticated
  using ((select radar_pode('clientes.gerenciar')) or ((select radar_area_comercial()) and radar_perfil_atual_tipo() = 'representante'
         and codigo_representante = any (radar_codigos_numericos_equivalentes(radar_perfil_atual_codigo_representante()))));
drop policy if exists clientes_representantes_write_admin on public.clientes_representantes;
create policy clientes_representantes_write_admin on public.clientes_representantes for all to authenticated
  using ((select radar_pode('clientes.gerenciar'))) with check ((select radar_pode('clientes.gerenciar')));

-- Clientes em pauta
drop policy if exists clientes_em_pauta_select on public.clientes_em_pauta;
create policy clientes_em_pauta_select on public.clientes_em_pauta for select to authenticated
  using ((select radar_area_comercial()) and (radar_perfil_atual_tipo() <> 'representante' or exists (
    select 1 from clientes c where c.id = clientes_em_pauta.cliente_id
      and radar_na_minha_carteira(c.codigo_cliente::text, c.codigo_representante::text))));
drop policy if exists clientes_em_pauta_insert on public.clientes_em_pauta;
create policy clientes_em_pauta_insert on public.clientes_em_pauta for insert to authenticated
  with check (criado_por = auth.uid() and (select radar_area_comercial()) and (radar_perfil_atual_tipo() <> 'representante' or exists (
    select 1 from clientes c where c.id = clientes_em_pauta.cliente_id
      and radar_na_minha_carteira(c.codigo_cliente::text, c.codigo_representante::text))));
drop policy if exists clientes_em_pauta_update on public.clientes_em_pauta;
create policy clientes_em_pauta_update on public.clientes_em_pauta for update to authenticated
  using ((select radar_area_comercial()) and (radar_perfil_atual_tipo() <> 'representante' or exists (
    select 1 from clientes c where c.id = clientes_em_pauta.cliente_id
      and radar_na_minha_carteira(c.codigo_cliente::text, c.codigo_representante::text))))
  with check ((select radar_area_comercial()) and (radar_perfil_atual_tipo() <> 'representante' or exists (
    select 1 from clientes c where c.id = clientes_em_pauta.cliente_id
      and radar_na_minha_carteira(c.codigo_cliente::text, c.codigo_representante::text))));
drop policy if exists clientes_em_pauta_delete_admin on public.clientes_em_pauta;
create policy clientes_em_pauta_delete_admin on public.clientes_em_pauta for delete to authenticated using ((select radar_pode('clientes.gerenciar')));

-- Comissões: todas = BI de comissões, ou a tela Comissões fora do perfil representante;
-- representante = só as próprias, pela tela ou pelo card "Minha comissão"
drop policy if exists "representante consulta proprias faixas" on public.comissoes_faixas;
create policy "representante consulta proprias faixas" on public.comissoes_faixas for select to authenticated
  using ((select radar_pode('bi_comissoes')) or ((select radar_pode('comissoes')) and radar_perfil_atual_tipo() <> 'representante')
         or (((select radar_pode('comissoes')) or (select radar_pode('comissoes.minha'))) and radar_perfil_atual_tipo() = 'representante'
             and codigo_representante = any (radar_codigos_numericos_equivalentes(radar_perfil_atual_codigo_representante()))));
drop policy if exists "representante consulta proprios lancamentos" on public.comissoes_lancamentos;
create policy "representante consulta proprios lancamentos" on public.comissoes_lancamentos for select to authenticated
  using ((select radar_pode('bi_comissoes')) or ((select radar_pode('comissoes')) and radar_perfil_atual_tipo() <> 'representante')
         or (((select radar_pode('comissoes')) or (select radar_pode('comissoes.minha'))) and radar_perfil_atual_tipo() = 'representante'
             and considerar is not false
             and codigo_representante = any (radar_codigos_numericos_equivalentes(radar_perfil_atual_codigo_representante()))));
drop policy if exists "representante consulta proprio resumo" on public.comissoes_resumos_mensais;
create policy "representante consulta proprio resumo" on public.comissoes_resumos_mensais for select to authenticated
  using ((select radar_pode('bi_comissoes')) or ((select radar_pode('comissoes')) and radar_perfil_atual_tipo() <> 'representante')
         or (((select radar_pode('comissoes')) or (select radar_pode('comissoes.minha'))) and radar_perfil_atual_tipo() = 'representante'
             and codigo_representante = any (radar_codigos_numericos_equivalentes(radar_perfil_atual_codigo_representante()))));

-- Administração (configurações, importações, log, usuários)
drop policy if exists configuracoes_agenda_geral_admin_select on public.configuracoes_agenda_geral;
create policy configuracoes_agenda_geral_admin_select on public.configuracoes_agenda_geral for select to authenticated using ((select radar_pode('administracao')));
drop policy if exists configuracoes_agenda_geral_admin_write on public.configuracoes_agenda_geral;
create policy configuracoes_agenda_geral_admin_write on public.configuracoes_agenda_geral for update to authenticated
  using ((select radar_pode('administracao'))) with check ((select radar_pode('administracao')));
drop policy if exists configuracoes_grupos_admin_write on public.configuracoes_grupos;
create policy configuracoes_grupos_admin_write on public.configuracoes_grupos for all to authenticated
  using ((select radar_pode('administracao'))) with check ((select radar_pode('administracao')));
drop policy if exists configuracoes_grupos_select on public.configuracoes_grupos;
create policy configuracoes_grupos_select on public.configuracoes_grupos for select to authenticated
  using ((select radar_pode('administracao')) or tipo_perfil = radar_perfil_atual_tipo());
drop policy if exists importacoes_insert_admin on public.importacoes;
create policy importacoes_insert_admin on public.importacoes for insert to authenticated with check ((select radar_pode('clientes.gerenciar')));
drop policy if exists importacoes_select_admin on public.importacoes;
create policy importacoes_select_admin on public.importacoes for select to authenticated using ((select radar_pode('clientes.gerenciar')));
drop policy if exists log_acessos_select_admin on public.log_acessos;
create policy log_acessos_select_admin on public.log_acessos for select to authenticated using ((select radar_pode('administracao')));
drop policy if exists perfis_insert_admin on public.perfis;
create policy perfis_insert_admin on public.perfis for insert to authenticated with check ((select radar_pode('administracao')));
drop policy if exists perfis_select_proprio_ou_admin on public.perfis;
create policy perfis_select_proprio_ou_admin on public.perfis for select to authenticated
  using (user_id = auth.uid() or (select radar_pode('administracao')));
drop policy if exists perfis_update_admin on public.perfis;
create policy perfis_update_admin on public.perfis for update to authenticated
  using ((select radar_pode('administracao'))) with check ((select radar_pode('administracao')));
drop policy if exists perfis_tokens_select_proprio_ou_admin on public.perfis_tokens;
create policy perfis_tokens_select_proprio_ou_admin on public.perfis_tokens for select to authenticated
  using (user_id = auth.uid() or (select radar_pode('administracao')));
drop policy if exists perfis_tokens_update_admin on public.perfis_tokens;
create policy perfis_tokens_update_admin on public.perfis_tokens for update to authenticated
  using ((select radar_pode('administracao'))) with check ((select radar_pode('administracao')));
-- log_acessos insert próprio, perfis_usuarios próprio e visitas próprias: inalterados (dono do dado)
drop policy if exists visitas_select_proprio_ou_admin on public.visitas;
create policy visitas_select_proprio_ou_admin on public.visitas for select to authenticated
  using (user_id = auth.uid() or (select radar_pode('rotas.todas')));

-- Rotas: as próprias (responsável) com a área comercial; todas com rotas.todas
drop policy if exists rotas_select on public.rotas;
create policy rotas_select on public.rotas for select to authenticated
  using ((select radar_pode('rotas.todas')) or ((select radar_area_comercial()) and usuario_responsavel = auth.uid()));
drop policy if exists rotas_insert on public.rotas;
create policy rotas_insert on public.rotas for insert to authenticated with check ((select radar_area_comercial()));
drop policy if exists rotas_update on public.rotas;
create policy rotas_update on public.rotas for update to authenticated
  using ((select radar_pode('rotas.todas')) or ((select radar_area_comercial()) and usuario_responsavel = auth.uid()))
  with check ((select radar_pode('rotas.todas')) or ((select radar_area_comercial()) and usuario_responsavel = auth.uid()));
drop policy if exists rotas_delete on public.rotas;
create policy rotas_delete on public.rotas for delete to authenticated
  using ((select radar_pode('rotas.todas')) or ((select radar_area_comercial()) and usuario_responsavel = auth.uid()));
drop policy if exists rotas_delete_restringe_finalizada on public.rotas;
create policy rotas_delete_restringe_finalizada on public.rotas as restrictive for delete to authenticated
  using ((select radar_pode('rotas.todas')) or status::text is distinct from 'FINALIZADA');

drop policy if exists rota_clientes_select on public.rota_clientes;
create policy rota_clientes_select on public.rota_clientes for select to authenticated
  using (exists (select 1 from rotas r where r.id = rota_clientes.rota_id
                 and ((select radar_pode('rotas.todas')) or ((select radar_area_comercial()) and r.usuario_responsavel = auth.uid()))));
drop policy if exists rota_clientes_insert on public.rota_clientes;
create policy rota_clientes_insert on public.rota_clientes for insert to authenticated with check ((select radar_area_comercial()));
drop policy if exists rota_clientes_update on public.rota_clientes;
create policy rota_clientes_update on public.rota_clientes for update to authenticated
  using (exists (select 1 from rotas r where r.id = rota_clientes.rota_id
                 and ((select radar_pode('rotas.todas')) or ((select radar_area_comercial()) and r.usuario_responsavel = auth.uid()))))
  with check (exists (select 1 from rotas r where r.id = rota_clientes.rota_id
                 and ((select radar_pode('rotas.todas')) or ((select radar_area_comercial()) and r.usuario_responsavel = auth.uid()))));
drop policy if exists rota_clientes_delete on public.rota_clientes;
create policy rota_clientes_delete on public.rota_clientes for delete to authenticated
  using (exists (select 1 from rotas r where r.id = rota_clientes.rota_id
                 and ((select radar_pode('rotas.todas')) or ((select radar_area_comercial()) and r.usuario_responsavel = auth.uid()))));
drop policy if exists rota_clientes_delete_restringe_finalizada on public.rota_clientes;
create policy rota_clientes_delete_restringe_finalizada on public.rota_clientes as restrictive for delete to authenticated
  using ((select radar_pode('rotas.todas')) or exists (select 1 from rotas r where r.id = rota_clientes.rota_id
                                              and r.status::text is distinct from 'FINALIZADA'));

drop policy if exists hist_whatsapp_select_participantes on public.rota_clientes_whatsapp_historico;
create policy hist_whatsapp_select_participantes on public.rota_clientes_whatsapp_historico for select to authenticated
  using ((select radar_pode('rotas.todas')) or ((select radar_area_comercial()) and exists (select 1 from rotas r
         where r.id = rota_clientes_whatsapp_historico.rota_id and (r.criado_por = auth.uid() or r.usuario_responsavel = auth.uid()))));
drop policy if exists hist_whatsapp_insert_participantes on public.rota_clientes_whatsapp_historico;
create policy hist_whatsapp_insert_participantes on public.rota_clientes_whatsapp_historico for insert to authenticated
  with check (criado_por = auth.uid() and ((select radar_pode('rotas.todas')) or ((select radar_area_comercial()) and exists (select 1 from rotas r
         where r.id = rota_clientes_whatsapp_historico.rota_id and (r.criado_por = auth.uid() or r.usuario_responsavel = auth.uid())))));

-- ------------------------------------------------------------------ Inspeção passa a usar o catálogo
create or replace function public.inspecao_papel_atual()
returns text language sql stable security definer set search_path = public as $$
  select case
    when (select radar_pode('administracao')) then 'admin'
    when (select radar_pode('inspecao.aprovar')) then 'aprovador'
    when (select radar_pode('inspecao.editar')) then 'inspetor'
    when (select radar_pode('inspecao.ver')) then 'leitura'
  end
$$;
drop table if exists public.inspecao_acessos;
