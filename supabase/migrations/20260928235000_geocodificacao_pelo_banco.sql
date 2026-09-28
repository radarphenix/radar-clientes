-- Geocodificação de clientes feita pelo próprio banco (pg_net), não mais pela Edge Function:
-- o Nominatim devolve 403 para as Edge Functions do Supabase, mas atende as chamadas do banco.
--
-- Funcionamento: o job pg_cron "geocodificar-clientes" roda a cada minuto SÓ enquanto há pendentes.
-- Cada passo lê a resposta do pedido anterior e dispara no máximo 1 novo pedido (1 consulta/minuto,
-- bem dentro da política do Nominatim). Sem pendentes, o job se remove sozinho; um gatilho na tabela
-- o recria quando aparece cliente novo sem coordenada ou quando o endereço muda.

alter table public.clientes_geolocalizacao
  add column if not exists geo_request_id bigint,
  add column if not exists geo_tentativa smallint not null default 0,
  add column if not exists geo_pedido_em timestamptz;

comment on column public.clientes_geolocalizacao.geo_tentativa is '1 = endereço completo; 2 = só cidade/UF (fallback).';

create or replace function public.geocodificar_clientes_passo()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pedido record;
  v_resp record;
  v_json jsonb;
  v_prox record;
  v_tentativa smallint;
  v_busca text;
  v_endereco text;
  v_id bigint;
begin
  -- 1) Resposta do pedido em andamento (no máximo um por vez).
  select g.codigo_cliente, g.geo_request_id, g.geo_tentativa, g.geo_pedido_em
    into v_pedido
    from clientes_geolocalizacao g
   where g.geo_request_id is not null
   order by g.geo_pedido_em
   limit 1;

  if found then
    select r.status_code, r.content, r.error_msg
      into v_resp
      from net._http_response r
     where r.id = v_pedido.geo_request_id;

    if not found then
      -- Ainda sem resposta: espera até 10 minutos; depois disso descarta o pedido e tenta de novo.
      if v_pedido.geo_pedido_em > now() - interval '10 minutes' then
        return;
      end if;
      update clientes_geolocalizacao
         set geo_request_id = null, updated_at = now()
       where codigo_cliente = v_pedido.codigo_cliente;
    else
      begin
        v_json := v_resp.content::jsonb;
      exception when others then
        v_json := null;
      end;

      if v_resp.status_code = 200 and jsonb_typeof(v_json) = 'array' and jsonb_array_length(v_json) > 0 then
        update clientes_geolocalizacao
           set latitude = (v_json -> 0 ->> 'lat')::numeric,
               longitude = (v_json -> 0 ->> 'lon')::numeric,
               geocodificado_em = now(),
               geolocalizacao_pendente = false,
               erro_geocodificacao = null,
               geo_request_id = null,
               geo_tentativa = 0,
               updated_at = now()
         where codigo_cliente = v_pedido.codigo_cliente;
      elsif v_resp.status_code = 200 and v_pedido.geo_tentativa = 1 then
        -- Endereço completo não encontrado: próxima tentativa só com cidade/UF.
        update clientes_geolocalizacao
           set geo_request_id = null, geo_tentativa = 2, updated_at = now()
         where codigo_cliente = v_pedido.codigo_cliente;
      else
        update clientes_geolocalizacao
           set geo_request_id = null,
               geo_tentativa = 0,
               geolocalizacao_pendente = true,
               erro_geocodificacao = case
                 when v_resp.status_code = 200 then 'Endereço não localizado'
                 when v_resp.status_code is not null then 'Nominatim recusou (HTTP ' || v_resp.status_code || ')'
                 else 'Falha na consulta: ' || coalesce(v_resp.error_msg, 'sem resposta')
               end,
               updated_at = now()
         where codigo_cliente = v_pedido.codigo_cliente;
      end if;
    end if;
  end if;

  -- 2) Próximo pendente: sem coordenada, sem pedido em andamento e sem erro registrado.
  select g.codigo_cliente, g.geo_tentativa, c.endereco, c.numero, c.cidade, c.uf
    into v_prox
    from clientes_geolocalizacao g
    join clientes c on c.codigo_cliente = g.codigo_cliente
   where g.latitude is null
     and g.geo_request_id is null
     and g.erro_geocodificacao is null
   order by g.geo_tentativa desc, g.updated_at nulls first
   limit 1;

  if not found then
    -- Nada pendente: o job se remove (o gatilho recria quando surgir pendente).
    if not exists (select 1 from clientes_geolocalizacao where geo_request_id is not null)
       and exists (select 1 from cron.job where jobname = 'geocodificar-clientes') then
      perform cron.unschedule('geocodificar-clientes');
    end if;
    return;
  end if;

  v_tentativa := case when v_prox.geo_tentativa = 2 then 2 else 1 end;
  if v_tentativa = 1 then
    -- Mesma limpeza de abreviações da antiga Edge Function (R → Rua, AV → Avenida, EST. → Estrada).
    v_endereco := trim(coalesce(v_prox.endereco, ''));
    v_endereco := regexp_replace(v_endereco, '^R\.?\s+', 'Rua ', 'i');
    v_endereco := regexp_replace(v_endereco, '^AV\.?\s+', 'Avenida ', 'i');
    v_endereco := regexp_replace(v_endereco, '^EST\.\s+', 'Estrada ', 'i');
    v_busca := concat_ws(', ', nullif(trim(v_endereco || ' ' || coalesce(v_prox.numero, '')), ''), nullif(trim(v_prox.cidade), ''), nullif(trim(v_prox.uf), ''), 'Brasil');
  else
    v_busca := concat_ws(', ', nullif(trim(v_prox.cidade), ''), nullif(trim(v_prox.uf), ''), 'Brasil');
  end if;

  v_id := net.http_get(
    url := 'https://nominatim.openstreetmap.org/search',
    params := jsonb_build_object('q', v_busca, 'format', 'json', 'limit', '1', 'countrycodes', 'br'),
    headers := jsonb_build_object('User-Agent', 'RadarClientesPhenix/1.0 (phenix@phenixonline.com.br)', 'Accept', 'application/json'),
    timeout_milliseconds := 20000
  );

  update clientes_geolocalizacao
     set geo_request_id = v_id, geo_tentativa = v_tentativa, geo_pedido_em = now()
   where codigo_cliente = v_prox.codigo_cliente;
end;
$$;

revoke all on function public.geocodificar_clientes_passo() from public, anon, authenticated;

-- Endereço mudou: limpa o erro anterior para tentar de novo.
create or replace function public.geocodificacao_endereco_mudou()
returns trigger
language plpgsql
as $$
begin
  if new.endereco_chave is distinct from old.endereco_chave then
    new.erro_geocodificacao := null;
    new.geo_tentativa := 0;
  end if;
  return new;
end;
$$;

-- Surgiu pendente: garante o job agendado.
create or replace function public.agendar_geocodificacao()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.latitude is null and new.geo_request_id is null and new.erro_geocodificacao is null
     and not exists (select 1 from cron.job where jobname = 'geocodificar-clientes') then
    perform cron.schedule('geocodificar-clientes', '* * * * *', 'select public.geocodificar_clientes_passo()');
  end if;
  return null;
end;
$$;

revoke all on function public.agendar_geocodificacao() from public, anon, authenticated;

drop trigger if exists geocodificacao_endereco_mudou on public.clientes_geolocalizacao;
create trigger geocodificacao_endereco_mudou
  before update on public.clientes_geolocalizacao
  for each row execute function public.geocodificacao_endereco_mudou();

drop trigger if exists agendar_geocodificacao on public.clientes_geolocalizacao;
create trigger agendar_geocodificacao
  after insert or update on public.clientes_geolocalizacao
  for each row execute function public.agendar_geocodificacao();

-- Job antigo (chamava a Edge Function, bloqueada pelo Nominatim) sai de cena.
select cron.unschedule('geocodificar-clientes-4x-dia')
 where exists (select 1 from cron.job where jobname = 'geocodificar-clientes-4x-dia');

-- Clientes do exterior não são geocodificáveis: marca uma vez e deixa de tentar.
update public.clientes_geolocalizacao g
   set erro_geocodificacao = 'Cliente no exterior — sem geocodificação',
       geolocalizacao_pendente = false,
       updated_at = now()
  from public.clientes c
 where c.codigo_cliente = g.codigo_cliente
   and g.latitude is null
   and upper(coalesce(c.uf, '')) = 'EX';

-- Pendentes do Brasil com erro das tentativas antigas (403 da Edge Function) voltam para a fila;
-- o gatilho acima agenda o job.
update public.clientes_geolocalizacao
   set erro_geocodificacao = null, geo_tentativa = 0, geolocalizacao_pendente = true, updated_at = now()
 where latitude is null
   and erro_geocodificacao is not null
   and erro_geocodificacao <> 'Cliente no exterior — sem geocodificação';
