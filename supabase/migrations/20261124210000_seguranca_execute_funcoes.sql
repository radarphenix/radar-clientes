-- Segurança (advisors do Supabase, 2026-11-24): defesa em profundidade nas funções do schema public.
-- Todas as funções abaixo já checam permissão por dentro (radar_pode/admin/service_role) ou são de gatilho,
-- então nada era explorável; aqui só se fecha a porta de chamada via /rest/v1/rpc para quem não precisa.
-- Nenhuma policy RLS para anon usa estas funções (conferido em pg_policies: todas são TO authenticated).

-- 1) anon não executa nada do Radar, exceto o que o formulário público da Veste Phenix usa.
do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as assinatura
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prokind = 'f'
      and p.proname not in ('inscrever_veste_phenix_completo', 'registrar_evento_veste_phenix')
      and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e') -- ignora funções de extensões
  loop
    execute format('revoke execute on function %s from anon, public', f.assinatura);
  end loop;
end $$;

-- Funções criadas daqui em diante também não nascem executáveis por anon.
alter default privileges in schema public revoke execute on functions from anon, public;

-- 2) Funções de gatilho não precisam ser chamadas por ninguém via RPC (o gatilho roda sem esse direito).
revoke execute on function public.auditar_cadastro_produtos_feira() from authenticated;
revoke execute on function public.auditar_promocao_veste_phenix() from authenticated;
revoke execute on function public.auditar_promocao_veste_phenix_numeros() from authenticated;
revoke execute on function public.cadastro_maquinas_auditoria() from authenticated;
revoke execute on function public.radar_permissoes_registrar() from authenticated;

-- 3) usuario_admin() é legada (tabela perfis_usuarios sem sync desde 2026-08); nenhuma policy nem tela usa.
--    Não apaga (reversível): só tira o direito de execução.
revoke execute on function public.usuario_admin() from authenticated;

-- 4) search_path fixo (lint function_search_path_mutable).
do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as assinatura
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('geocodificacao_endereco_mudou', 'usuario_admin', 'inspecao_nivel', 'validar_cpf')
  loop
    execute format('alter function %s set search_path = public', f.assinatura);
  end loop;
end $$;
