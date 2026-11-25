-- Localização dos clientes do exterior pesquisada (cadastro CIGAM + sites/registros das empresas), 25/11/2026.
-- Motivo: a geocodificação automática força Brasil (countrycodes=br) e os endereços do exterior chegam sem cidade/país,
-- então esses clientes caíam em São Paulo, Barcelona ou no meio do Brasil. O RadarSync não toca nesta tabela.
-- precisao: endereco (rua e número), cidade (centro da cidade) ou pais (só o país: local aproximado no mapa).
create table if not exists public.clientes_localizacao_manual (
  codigo_cliente text primary key,
  pais text,
  cidade text,
  precisao text not null check (precisao in ('endereco', 'cidade', 'pais')),
  latitude double precision not null,
  longitude double precision not null,
  fonte text,
  atualizado_em timestamptz not null default now(),
  atualizado_por uuid default auth.uid()
);

alter table public.clientes_localizacao_manual enable row level security;
drop policy if exists clientes_localizacao_manual_select on public.clientes_localizacao_manual;
create policy clientes_localizacao_manual_select on public.clientes_localizacao_manual for select to authenticated
  using (exists (select 1 from public.clientes c where c.codigo_cliente = clientes_localizacao_manual.codigo_cliente));
drop policy if exists clientes_localizacao_manual_gerenciar on public.clientes_localizacao_manual;
create policy clientes_localizacao_manual_gerenciar on public.clientes_localizacao_manual for all to authenticated
  using ((select radar_pode('clientes.gerenciar'))) with check ((select radar_pode('clientes.gerenciar')));
grant select, insert, update, delete on public.clientes_localizacao_manual to authenticated;

-- A coordenada manual vale para o mapa: grava em clientes_geolocalizacao (cria a linha se faltar).
create or replace function public.aplicar_localizacao_manual()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into clientes_geolocalizacao (codigo_cliente, endereco_chave, latitude, longitude, geocodificado_em, geolocalizacao_pendente, erro_geocodificacao, geo_request_id, updated_at)
  values (new.codigo_cliente, coalesce((select upper(c.endereco_completo) from clientes c where c.codigo_cliente = new.codigo_cliente), ''),
          new.latitude, new.longitude, now(), false, null, null, now())
  on conflict (codigo_cliente) do update
    set latitude = excluded.latitude, longitude = excluded.longitude, geocodificado_em = now(),
        geolocalizacao_pendente = false, erro_geocodificacao = null, geo_request_id = null, updated_at = now();
  return new;
end;
$$;
revoke all on function public.aplicar_localizacao_manual() from public, anon, authenticated;
drop trigger if exists aplicar_localizacao_manual on public.clientes_localizacao_manual;
create trigger aplicar_localizacao_manual after insert or update on public.clientes_localizacao_manual
  for each row execute function public.aplicar_localizacao_manual();

insert into public.clientes_localizacao_manual (codigo_cliente, pais, cidade, precisao, latitude, longitude, fonte) values
  ('000104', 'Itália', 'Isola del Liri', 'cidade', 41.679248, 13.573077, 'Cadastro CIGAM'),
  ('003048', 'Itália', 'Arzano', 'endereco', 40.920224, 14.27429, 'Cadastro CIGAM'),
  ('002271', 'Paraguai', 'Ñemby', 'cidade', -25.392454, -57.547111, 'Cadastro CIGAM (rua Capitán Pelayo Pratt Gill 423)'),
  ('003002', 'Paraguai', 'Villeta', 'cidade', -25.504519, -57.569379, 'Pesquisa web: Kartotec (mesmo grupo), Amambay y Río Paraguay, Villeta'),
  ('002297', 'Argentina', 'Paraná', 'endereco', -31.714159, -60.499896, 'Cadastro CIGAM'),
  ('003026', 'Argentina', 'Buenos Aires', 'endereco', -34.610052, -58.373585, 'Cadastro CIGAM'),
  ('003034', 'Argentina', 'Don Torcuato', 'endereco', -34.493156, -58.627393, 'Cadastro CIGAM'),
  ('003096', 'Argentina', 'Berazategui', 'endereco', -34.80042, -58.200039, 'Cadastro CIGAM'),
  ('003099', 'Argentina', 'Quilmes', 'cidade', -34.725705, -58.263076, 'Cadastro CIGAM (cidade Quilmes)'),
  ('003095', 'Argentina', 'Buenos Aires', 'endereco', -34.615926, -58.425142, 'Cadastro CIGAM + pesquisa web (sede em Buenos Aires)'),
  ('003014', 'Argentina', 'General Pacheco', 'cidade', -34.453722, -58.635106, 'Pesquisa web (ZoomInfo: Pacheco, Buenos Aires)'),
  ('003031', 'Argentina', 'Buenos Aires', 'cidade', -34.609558, -58.38879, 'Pesquisa web (EMIS: sede em Buenos Aires)'),
  ('002293', 'Argentina', null, 'pais', -34.996496, -64.967282, 'Pesquisa web: só o país (indústria do NOA)'),
  ('003087', 'Uruguai', 'Montevidéu', 'endereco', -34.773395, -56.137129, 'Cadastro CIGAM'),
  ('003005', 'Uruguai', 'Mercedes', 'cidade', -33.24842, -58.029867, 'Cadastro CIGAM (Soriano)'),
  ('003072', 'Uruguai', 'Fray Bentos', 'cidade', -33.116517, -58.313098, 'País do CIGAM; fábrica UPM de Fray Bentos (aprox.)'),
  ('003078', 'Colômbia', 'Puerto Tejada', 'cidade', 3.228897, -76.419227, 'Cadastro CIGAM'),
  ('003088', 'Colômbia', 'Cali', 'endereco', 3.413425, -76.514595, 'Cadastro CIGAM + Empresite/EMIS (Calle 36 # 7-10, Cali)'),
  ('003093', 'Colômbia', 'Dosquebradas', 'cidade', 4.833955, -75.671301, 'Cadastro CIGAM'),
  ('002262', 'Chile', 'San Francisco de Mostazal', 'cidade', -33.979903, -70.712174, 'Pesquisa web (paper-world: COIPSA, San Francisco de Mostazal)'),
  ('002272', 'Chile', 'Isla de Maipo', 'cidade', -33.753739, -70.903932, 'Pesquisa web (SII: Av. Jaime Guzmán s/n, Isla de Maipo)'),
  ('003010', 'Chile', 'San Pedro de la Paz', 'endereco', -36.843286, -73.076649, 'Pesquisa web (SMA: Av. Pedro Aguirre Cerda 1054)'),
  ('003097', 'Bolívia', 'Vinto', 'cidade', -17.397, -66.314, 'Cadastro CIGAM (Zona Vinto Chico) (coordenada de Vinto/Quillacollo ajustada à mão)'),
  ('002232', 'Bolívia', 'Cochabamba', 'cidade', -17.401246, -66.167568, 'Pesquisa web (Rafael Mendoza s/n, Chacacollo, Cochabamba)'),
  ('003040', 'México', 'León', 'cidade', 21.121965, -101.682977, 'Pesquisa web (planta em León, Guanajuato)'),
  ('003032', 'Venezuela', 'Maracay', 'cidade', 10.237514, -67.589022, 'Pesquisa web (Av. Aragua c/ Mariño Sur, Maracay)'),
  ('003033', 'Venezuela', 'Guacara', 'cidade', 10.217213, -67.883618, 'Pesquisa web (Carretera Nacional Guacara-San Joaquín km 1)'),
  ('003006', 'Venezuela', null, 'pais', 8.001871, -66.560932, 'País do CIGAM; cidade não encontrada'),
  ('003065', 'Venezuela', null, 'pais', 8.351871, -66.110932, 'País do CIGAM; cidade não encontrada'),
  ('003075', 'Venezuela', null, 'pais', 7.651871, -66.110932, 'País do CIGAM; cidade não encontrada'),
  ('003013', 'Venezuela', null, 'pais', 8.001871, -65.660932, 'País do CIGAM; cidade não encontrada')
on conflict (codigo_cliente) do update set pais = excluded.pais, cidade = excluded.cidade, precisao = excluded.precisao,
  latitude = excluded.latitude, longitude = excluded.longitude, fonte = excluded.fonte, atualizado_em = now();
