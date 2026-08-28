-- CORRECAO DE SEGURANCA (2026-08-26): clientes_geolocalizacao (cache de
-- geocodificacao) tinha policies "authenticated + using (true)" desde a
-- criacao (baseline via introspecao, 20260825150000) -- deixada de fora de
-- proposito na correcao anterior (20260826200000) por nao ter coluna de
-- dono e por risco de quebrar o mapa de "Proximos" sem uma regra de escopo
-- clara.
--
-- Confirmado o vazamento real: o front-end (App.jsx, carregamento de
-- clientes) busca a tabela inteira sem filtro, e so depois cruza em JS com
-- a lista de clientes que o usuario ja pode ver (essa sim restrita por
-- carteira via clientes_select_por_clientes_representantes, de
-- 20260825130000). Ou seja, qualquer usuario autenticado -- inclusive um
-- representante sem carteira -- conseguia, via API direta, ler as
-- coordenadas de todos os clientes da empresa, nao so os seus.
--
-- Esta migration aplica a MESMA regra de carteira ja usada em "clientes"
-- (admin/tecnico veem tudo; representante so ve cliente com
-- codigo_representante batendo ou vinculo em clientes_representantes),
-- unindo por codigo_cliente. Sem efeito colateral esperado: qualquer
-- cliente que ja aparece em clientesData (App.jsx) satisfaz, por
-- definicao, a mesma condicao aqui -- entao nenhum cliente visivel hoje
-- some do mapa; so para de vazar coordenada de cliente fora da carteira.
--
-- INSERT/UPDATE restritos a admin: a unica escrita real e da edge function
-- geocodificar-clientes, que usa a service role key (ignora RLS de
-- qualquer forma) -- sem efeito colateral esperado tambem.

drop policy if exists "usuarios_logados_podem_ler_geolocalizacao" on public.clientes_geolocalizacao;

create policy "clientes_geolocalizacao_select_por_carteira"
on public.clientes_geolocalizacao
for select
to authenticated
using (
  public.radar_perfil_atual_tipo() in ('admin', 'tecnico')
  or (
    public.radar_perfil_atual_tipo() = 'representante'
    and exists (
      select 1
      from public.clientes c
      where c.codigo_cliente = any(
        public.radar_codigos_numericos_equivalentes(clientes_geolocalizacao.codigo_cliente)
      )
      and (
        c.codigo_representante = any(
          public.radar_codigos_numericos_equivalentes(
            public.radar_perfil_atual_codigo_representante()
          )
        )
        or exists (
          select 1
          from public.clientes_representantes cr
          where cr.codigo_cliente = any(
            public.radar_codigos_numericos_equivalentes(c.codigo_cliente)
          )
            and cr.codigo_representante = any(
              public.radar_codigos_numericos_equivalentes(
                public.radar_perfil_atual_codigo_representante()
              )
            )
        )
      )
    )
  )
);

drop policy if exists "usuarios_logados_podem_inserir_geolocalizacao" on public.clientes_geolocalizacao;

create policy "clientes_geolocalizacao_insert_admin"
on public.clientes_geolocalizacao
for insert
to authenticated
with check (public.radar_perfil_atual_tipo() = 'admin');

drop policy if exists "usuarios_logados_podem_atualizar_geolocalizacao" on public.clientes_geolocalizacao;

create policy "clientes_geolocalizacao_update_admin"
on public.clientes_geolocalizacao
for update
to authenticated
using (public.radar_perfil_atual_tipo() = 'admin')
with check (public.radar_perfil_atual_tipo() = 'admin');
