create table if not exists public.clientes_contatos (
    codigo_cliente text not null,
    codigo_contato text not null,
    nome text not null default '',
    cargo text not null default '',
    setor text not null default '',
    telefone text not null default '',
    celular text not null default '',
    whatsapp text not null,
    email text not null default '',
    ramal text not null default '',
    updated_at timestamptz not null default now(),
    constraint clientes_contatos_pkey primary key (codigo_cliente, codigo_contato),
    constraint clientes_contatos_cliente_fkey foreign key (codigo_cliente)
        references public.clientes (codigo_cliente)
        on update cascade
        on delete cascade,
    constraint clientes_contatos_whatsapp_check check (
        length(regexp_replace(whatsapp, '[^0-9]', '', 'g')) between 10 and 13
    )
);

create index if not exists clientes_contatos_codigo_cliente_idx
    on public.clientes_contatos (codigo_cliente);

alter table public.clientes_contatos enable row level security;

grant select on public.clientes_contatos to authenticated;

drop policy if exists "clientes_contatos_select_usuario_logado"
    on public.clientes_contatos;

create policy "clientes_contatos_select_usuario_logado"
    on public.clientes_contatos
    for select
    to authenticated
    using (
        exists (
            select 1
              from public.clientes c
             where c.codigo_cliente = clientes_contatos.codigo_cliente
        )
    );
