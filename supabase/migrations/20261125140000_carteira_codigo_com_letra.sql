-- Carteira do representante: código de cliente com letra (ex.: 03017A) só casa com ele mesmo.
-- Antes, radar_codigos_numericos_equivalentes('03017A') gerava '3017'/'003017' e o cliente aparecia para quem
-- tem o vínculo do 003017 (João e Romeu). Decisão do usuário (25/11/2026): não deve aparecer.
-- Códigos só com dígitos continuam com a equivalência (000123 = 123), como antes.
create or replace function public.radar_na_minha_carteira(p_codigo_cliente text, p_codigo_representante text)
returns boolean language sql stable set search_path = public as $$
  select (p_codigo_representante = any (radar_codigos_numericos_equivalentes(radar_perfil_atual_codigo_representante())))
    or exists (select 1 from clientes_representantes cr
               where cr.codigo_cliente = any (
                       case when trim(coalesce(p_codigo_cliente, '')) ~ '[^0-9]'
                            then array[trim(p_codigo_cliente)]
                            else radar_codigos_numericos_equivalentes(p_codigo_cliente) end)
                 and cr.codigo_representante = any (radar_codigos_numericos_equivalentes(radar_perfil_atual_codigo_representante())))
$$;

grant execute on function public.radar_na_minha_carteira(text, text) to authenticated;
