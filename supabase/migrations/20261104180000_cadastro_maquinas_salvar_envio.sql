-- Cadastro de Máquinas: gravação única (máquina + itens + removidos) numa transação, idempotente por envio_id.
-- Serve ao salvar online e à fila offline do Radar: o aparelho gera o envio_id ao salvar; se a mesma
-- gravação chegar duas vezes (resposta perdida, reenvio da fila), a segunda só devolve o id já gravado.
-- Roda como quem chama (security invoker): RLS, auditoria e faixa de IDs continuam valendo como antes.
-- Aditiva: só cria tabela e função; o sync com o CIGAM não lê nada daqui.

create table if not exists public.cadastro_maquinas_envios (
  envio_id uuid primary key,
  id_maquina bigint not null references public.cadastro_maquinas (id),
  user_id uuid not null default auth.uid(),
  criado_em timestamptz not null default now()
);
alter table public.cadastro_maquinas_envios enable row level security;
revoke all on public.cadastro_maquinas_envios from anon, authenticated;
grant select, insert on public.cadastro_maquinas_envios to authenticated;
grant all on public.cadastro_maquinas_envios to service_role;
drop policy if exists cadastro_maquinas_envios_select on public.cadastro_maquinas_envios;
create policy cadastro_maquinas_envios_select on public.cadastro_maquinas_envios for select to authenticated
  using (user_id = auth.uid());
drop policy if exists cadastro_maquinas_envios_insert on public.cadastro_maquinas_envios;
create policy cadastro_maquinas_envios_insert on public.cadastro_maquinas_envios for insert to authenticated
  with check (user_id = auth.uid() and (select radar_pode('maquinas.editar')));

create or replace function public.cadastro_maquinas_salvar_envio(
  p_envio_id uuid, p_maquina jsonb, p_itens jsonb default '[]'::jsonb, p_removidos bigint[] default '{}'
) returns bigint
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_id bigint;
  v_item jsonb;
begin
  if p_envio_id is null then raise exception 'envio_id obrigatório'; end if;
  select id_maquina into v_id from cadastro_maquinas_envios where envio_id = p_envio_id;
  if found then return v_id; end if;

  v_id := nullif(p_maquina->>'id', '')::bigint;
  if v_id is null then
    insert into cadastro_maquinas (codigo_cliente, nome_prospect, cidade_prospect, uf_prospect, contato_prospect, telefone_prospect,
      nome_maquina, numero_maquina_pedido, tipo_papel, velocidade_maquina, observacoes)
    values (p_maquina->>'codigo_cliente', p_maquina->>'nome_prospect', p_maquina->>'cidade_prospect', p_maquina->>'uf_prospect',
      p_maquina->>'contato_prospect', p_maquina->>'telefone_prospect', p_maquina->>'nome_maquina', p_maquina->>'numero_maquina_pedido',
      p_maquina->>'tipo_papel', p_maquina->>'velocidade_maquina', p_maquina->>'observacoes')
    returning id into v_id;
  else
    update cadastro_maquinas set
      codigo_cliente = p_maquina->>'codigo_cliente', nome_prospect = p_maquina->>'nome_prospect',
      cidade_prospect = p_maquina->>'cidade_prospect', uf_prospect = p_maquina->>'uf_prospect',
      contato_prospect = p_maquina->>'contato_prospect', telefone_prospect = p_maquina->>'telefone_prospect',
      nome_maquina = p_maquina->>'nome_maquina', numero_maquina_pedido = p_maquina->>'numero_maquina_pedido',
      tipo_papel = p_maquina->>'tipo_papel', velocidade_maquina = p_maquina->>'velocidade_maquina', observacoes = p_maquina->>'observacoes'
    where id = v_id;
    -- sem linha = não existe ou o RLS não deixa: não grava nada
    if not found then raise exception 'Máquina % não encontrada ou sem permissão para alterar.', v_id; end if;
  end if;

  for v_item in select * from jsonb_array_elements(coalesce(p_itens, '[]'::jsonb)) loop
    if nullif(v_item->>'id', '') is null then
      insert into cadastro_maquinas_itens (id_maquina, produto, nome_produto_outros, modelo, posicao, comprimento, largura, espessura,
        cfm, gramatura, durabilidade, teflonada, observacoes)
      values (v_id, v_item->>'produto', v_item->>'nome_produto_outros', v_item->>'modelo', v_item->>'posicao',
        (v_item->>'comprimento')::numeric, (v_item->>'largura')::numeric, (v_item->>'espessura')::numeric,
        (v_item->>'cfm')::numeric, (v_item->>'gramatura')::numeric, v_item->>'durabilidade',
        (v_item->>'teflonada')::boolean, v_item->>'observacoes');
    else
      update cadastro_maquinas_itens set
        produto = v_item->>'produto', nome_produto_outros = v_item->>'nome_produto_outros', modelo = v_item->>'modelo',
        posicao = v_item->>'posicao', comprimento = (v_item->>'comprimento')::numeric, largura = (v_item->>'largura')::numeric,
        espessura = (v_item->>'espessura')::numeric, cfm = (v_item->>'cfm')::numeric, gramatura = (v_item->>'gramatura')::numeric,
        durabilidade = v_item->>'durabilidade', teflonada = (v_item->>'teflonada')::boolean, observacoes = v_item->>'observacoes'
      where id = (v_item->>'id')::bigint and id_maquina = v_id;
    end if;
  end loop;

  if coalesce(array_length(p_removidos, 1), 0) > 0 then
    update cadastro_maquinas_itens set ativo = false where id = any(p_removidos) and id_maquina = v_id;
  end if;

  insert into cadastro_maquinas_envios (envio_id, id_maquina) values (p_envio_id, v_id);
  return v_id;
end;
$$;

revoke all on function public.cadastro_maquinas_salvar_envio(uuid, jsonb, jsonb, bigint[]) from public, anon;
grant execute on function public.cadastro_maquinas_salvar_envio(uuid, jsonb, jsonb, bigint[]) to authenticated;
