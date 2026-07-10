alter table public.configuracoes_grupos
add column if not exists permite_menu_amostras boolean not null default false;

insert into public.configuracoes_grupos (
  tipo_perfil,
  permite_aviso_whatsapp_rota,
  permite_menu_amostras
)
values
  ('admin', true, true),
  ('tecnico', true, false),
  ('representante', true, false)
on conflict (tipo_perfil) do update
set permite_menu_amostras = case
  when excluded.tipo_perfil = 'admin' then true
  else public.configuracoes_grupos.permite_menu_amostras
end;
