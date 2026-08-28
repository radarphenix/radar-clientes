-- CORRECAO DE SEGURANCA (2026-08-26): as tabelas perfis, rotas, rota_clientes,
-- visitas e importacoes tinham policies "authenticated + using (true)" -
-- documentadas (nao criadas) por 20260825150000_baseline_tabelas_pre_migrations.sql
-- como parte de introspeccao do banco real, mas nunca corrigidas de fato. A
-- migration de seguranca do mesmo dia (20260825130000) resolveu clientes e o
-- calendario_token de perfis, mas nao cobriu a leitura geral de perfis nem
-- nenhuma dessas outras tabelas.
--
-- Confirmado com um usuario de teste descartavel (representante, sem
-- vinculo, sem rota propria) chamando a API REST direto (sem passar pela
-- tela): GET /rest/v1/perfis devolvia os perfis de TODOS os usuarios; GET
-- /rest/v1/rotas devolvia rotas de OUTROS usuarios; e isso continuava
-- funcionando mesmo depois do usuario de teste ser marcado ativo=false (a
-- tela bloqueia o login nesse caso, via ComissaoRepository... nao, via
-- App.jsx carregarPerfil(), mas a API por baixo nao verifica nada).
--
-- Esta migration substitui as policies "true" por regras equivalentes ao
-- que o proprio front-end ja assume (dono do registro ve/edita o que e
-- seu; admin ve/edita tudo), usando radar_perfil_atual_tipo() -- a mesma
-- funcao ja usada pelas policies corretas de "clientes" (que ja aplica
-- ativo=true internamente).
--
-- clientes_geolocalizacao (cache de geocodificacao, sem coluna de dono) foi
-- deixada de fora de proposito - nao ha um jeito obvio e de baixo risco de
-- restringi-la sem estudar melhor o fluxo de "Proximos"/geocodificacao;
-- fica como pendencia registrada, nao como parte desta correcao.

-- ============================================================
-- perfis: leitura restrita ao proprio registro ou admin.
-- (insert/update ja eram restritos a admin desde o baseline - sem mudanca.)
-- ============================================================
drop policy if exists "perfis_select" on public.perfis;
drop policy if exists "usuario_logado_pode_ler_perfis" on public.perfis;

create policy "perfis_select_proprio_ou_admin"
on public.perfis
for select
to authenticated
using (
  user_id = auth.uid()
  or public.radar_perfil_atual_tipo() = 'admin'
);

-- ============================================================
-- rotas: admin ve/edita tudo; qualquer outro perfil so o que e seu
-- (usuario_responsavel = auth.uid()), igual ao filtro que o front-end
-- (carregarRotas() em App.jsx) ja aplica pra nao-admin. Insert deixado como
-- estava (with check (true)) - admin as vezes cria rota em nome de outro
-- responsavel; o risco real estava em ler/editar/apagar rota alheia, nao em
-- inserir uma rota extra.
-- ============================================================
drop policy if exists "rotas_select" on public.rotas;
create policy "rotas_select"
on public.rotas
for select
to authenticated
using (
  public.radar_perfil_atual_tipo() = 'admin'
  or usuario_responsavel = auth.uid()
);

drop policy if exists "rotas_update" on public.rotas;
create policy "rotas_update"
on public.rotas
for update
to authenticated
using (
  public.radar_perfil_atual_tipo() = 'admin'
  or usuario_responsavel = auth.uid()
)
with check (
  public.radar_perfil_atual_tipo() = 'admin'
  or usuario_responsavel = auth.uid()
);

-- A policy RESTRICTIVE "rotas_delete_restringe_finalizada" (de
-- 20260819120000_rotas_delete_restringe_finalizada.sql) continua
-- aplicando por cima desta, sem nenhuma mudanca aqui.
drop policy if exists "rotas_delete" on public.rotas;
create policy "rotas_delete"
on public.rotas
for delete
to authenticated
using (
  public.radar_perfil_atual_tipo() = 'admin'
  or usuario_responsavel = auth.uid()
);

-- ============================================================
-- rota_clientes: mesma regra de rotas, verificada via join na rota dona
-- (rota_clientes nao tem coluna de responsavel proprio).
-- ============================================================
drop policy if exists "rota_clientes_select" on public.rota_clientes;
create policy "rota_clientes_select"
on public.rota_clientes
for select
to authenticated
using (
  exists (
    select 1 from public.rotas r
    where r.id = rota_clientes.rota_id
      and (
        public.radar_perfil_atual_tipo() = 'admin'
        or r.usuario_responsavel = auth.uid()
      )
  )
);

drop policy if exists "rota_clientes_update" on public.rota_clientes;
create policy "rota_clientes_update"
on public.rota_clientes
for update
to authenticated
using (
  exists (
    select 1 from public.rotas r
    where r.id = rota_clientes.rota_id
      and (
        public.radar_perfil_atual_tipo() = 'admin'
        or r.usuario_responsavel = auth.uid()
      )
  )
)
with check (
  exists (
    select 1 from public.rotas r
    where r.id = rota_clientes.rota_id
      and (
        public.radar_perfil_atual_tipo() = 'admin'
        or r.usuario_responsavel = auth.uid()
      )
  )
);

-- A policy RESTRICTIVE "rota_clientes_delete_restringe_finalizada" continua
-- aplicando por cima desta, sem nenhuma mudanca aqui.
drop policy if exists "rota_clientes_delete" on public.rota_clientes;
create policy "rota_clientes_delete"
on public.rota_clientes
for delete
to authenticated
using (
  exists (
    select 1 from public.rotas r
    where r.id = rota_clientes.rota_id
      and (
        public.radar_perfil_atual_tipo() = 'admin'
        or r.usuario_responsavel = auth.uid()
      )
  )
);

-- ============================================================
-- visitas: leitura restrita ao proprio registro (user_id) ou admin. O
-- insert restrito ja existia (visitas_insert_autenticado, user_id =
-- auth.uid()) mas ficava mascarado pela policy solta antiga - removida
-- agora, entao a regra restrita passa a valer de verdade.
-- ============================================================
drop policy if exists "usuarios_logados_podem_ler_visitas" on public.visitas;
drop policy if exists "visitas_select_autenticado" on public.visitas;
create policy "visitas_select_proprio_ou_admin"
on public.visitas
for select
to authenticated
using (
  user_id = auth.uid()
  or public.radar_perfil_atual_tipo() = 'admin'
);

drop policy if exists "usuarios_logados_podem_inserir_visitas" on public.visitas;
-- "visitas_insert_autenticado" (user_id = auth.uid()) mantida como esta.

-- ============================================================
-- importacoes: leitura restrita a admin (mesmo escopo do insert, ja
-- corrigido em 20260825130000, e da propria aba "Importacao de clientes"
-- na tela, que so admin ve).
-- ============================================================
drop policy if exists "importacoes_select_autenticado" on public.importacoes;
create policy "importacoes_select_admin"
on public.importacoes
for select
to authenticated
using (public.radar_perfil_atual_tipo() = 'admin');
