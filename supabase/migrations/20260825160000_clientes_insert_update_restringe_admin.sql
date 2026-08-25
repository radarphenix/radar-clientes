-- As unicas duas escritas reais em "clientes" no app (importarPlanilha, que
-- APAGA a base inteira e reinsere a partir do Excel, e a atualizacao de
-- coordenadas via geocodificacao) ja sao restritas a admin na tela. A
-- policy solta abaixo nao protegia nenhum fluxo legitimo -- so deixava
-- qualquer usuario autenticado repetir a mesma operacao destrutiva direto
-- pela API REST, sem passar pela tela.

drop policy if exists "usuarios_logados_podem_inserir_clientes" on public.clientes;
drop policy if exists "usuarios_logados_podem_atualizar_clientes" on public.clientes;

-- clientes_insert_admin / clientes_update_admin (radar_perfil_atual_tipo() = 'admin')
-- ja existem desde 20260825130000_seguranca_clientes_perfis_rls.sql e passam
-- a ser as unicas policies de escrita.
