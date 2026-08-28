-- Feature "Clientes em Pauta": cadastro manual de clientes que precisam de
-- atencao (nivel de criticidade), que reaparecem como sugestao quando uma
-- rota e planejada perto deles. Ver detalhes do ciclo de vida no plano da
-- feature (2026-08-25).

create table public.clientes_em_pauta (
  id bigint generated always as identity primary key,
  cliente_id bigint not null references public.clientes (id) on delete cascade,
  criticidade text not null check (
    criticidade in ('URGENTE', 'CRITICO', 'IMPORTANTE', 'APROVEITAMENTO_ROTA')
  ),
  criticidade_peso smallint generated always as (
    case criticidade
      when 'URGENTE' then 1
      when 'CRITICO' then 2
      when 'IMPORTANTE' then 3
      when 'APROVEITAMENTO_ROTA' then 4
    end
  ) stored,
  status text not null default 'ATIVO' check (
    status in ('ATIVO', 'EM_ROTA', 'ATENDIDO', 'DESCARTADO')
  ),
  observacao text,
  rota_cliente_id bigint references public.rota_clientes (id) on delete set null,
  criado_por uuid not null references auth.users (id),
  criado_em timestamptz not null default now(),
  atualizado_por uuid references auth.users (id),
  atualizado_em timestamptz not null default now(),
  resolvido_em timestamptz
);

comment on table public.clientes_em_pauta is
  'Clientes sinalizados manualmente por criticidade (urgente/critico/importante/aproveitamento de rota). ATIVO = aguardando, na lista; EM_ROTA = ja incluido numa rota ainda nao visitada, some da lista; ATENDIDO = visita concluida, resolvido; DESCARTADO = visita cancelada e usuario optou por nao devolver a pauta. Historico nunca e apagado.';

create unique index uq_clientes_em_pauta_ativo_por_cliente
  on public.clientes_em_pauta (cliente_id)
  where status in ('ATIVO', 'EM_ROTA');

create index idx_clientes_em_pauta_status_peso
  on public.clientes_em_pauta (status, criticidade_peso);

create index idx_clientes_em_pauta_rota_cliente_id
  on public.clientes_em_pauta (rota_cliente_id)
  where rota_cliente_id is not null;

alter table public.clientes_em_pauta enable row level security;

revoke all on public.clientes_em_pauta from anon, authenticated;
grant select, insert, update, delete on public.clientes_em_pauta to authenticated;

create policy "clientes_em_pauta_select"
on public.clientes_em_pauta
for select
to authenticated
using (
  public.radar_perfil_atual_tipo() in ('admin', 'tecnico')
  or (
    public.radar_perfil_atual_tipo() = 'representante'
    and exists (
      select 1
      from public.clientes c
      where c.id = clientes_em_pauta.cliente_id
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

create policy "clientes_em_pauta_insert"
on public.clientes_em_pauta
for insert
to authenticated
with check (
  criado_por = auth.uid()
  and (
    public.radar_perfil_atual_tipo() in ('admin', 'tecnico')
    or (
      public.radar_perfil_atual_tipo() = 'representante'
      and exists (
        select 1
        from public.clientes c
        where c.id = clientes_em_pauta.cliente_id
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
  )
);

create policy "clientes_em_pauta_update"
on public.clientes_em_pauta
for update
to authenticated
using (
  public.radar_perfil_atual_tipo() in ('admin', 'tecnico')
  or (
    public.radar_perfil_atual_tipo() = 'representante'
    and exists (
      select 1
      from public.clientes c
      where c.id = clientes_em_pauta.cliente_id
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
)
with check (
  public.radar_perfil_atual_tipo() in ('admin', 'tecnico')
  or (
    public.radar_perfil_atual_tipo() = 'representante'
    and exists (
      select 1
      from public.clientes c
      where c.id = clientes_em_pauta.cliente_id
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

-- Delete e so escape hatch de correcao manual (typo de criticidade,
-- duplicidade, etc.) - o fluxo normal do app nunca apaga, so muda status.
create policy "clientes_em_pauta_delete_admin"
on public.clientes_em_pauta
for delete
to authenticated
using (public.radar_perfil_atual_tipo() = 'admin');
