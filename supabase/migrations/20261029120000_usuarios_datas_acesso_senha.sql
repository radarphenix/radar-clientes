-- Administração -> Usuários: o admin vê, ao lado de cada usuário, o último acesso e a última senha
-- definida (combinado em 28/10/2026, ver SEGURANCA.md 4.5). Aditiva e idempotente.
--
-- Último acesso: auth.users.last_sign_in_at (o Supabase já guarda).
-- Senha definida: o Supabase não tem um campo confiável (updated_at muda por vários motivos), então o
-- Radar grava o carimbo nas duas telas onde a senha é definida (link do e-mail e "trocar senha").
-- Vale daqui pra frente: quem ainda não definiu desde hoje aparece como "—".

alter table public.perfis add column if not exists senha_definida_em timestamptz;

-- O próprio usuário carimba a sua senha (a RLS de perfis não precisa abrir update para isso).
create or replace function public.radar_registrar_senha_definida()
returns void language sql volatile security definer set search_path = public as $$
  update perfis set senha_definida_em = now() where user_id = auth.uid();
$$;

-- Datas de todos os usuários, só para quem tem o menu Administração (catálogo, ACESSOS_RADAR.md).
create or replace function public.radar_usuarios_datas()
returns table (user_id uuid, ultimo_acesso timestamptz, senha_definida_em timestamptz)
language sql stable security definer set search_path = public, auth as $$
  select p.user_id, u.last_sign_in_at, p.senha_definida_em
  from perfis p
  join auth.users u on u.id = p.user_id
  where public.radar_pode('administracao');
$$;

revoke all on function public.radar_registrar_senha_definida(), public.radar_usuarios_datas() from public, anon;
grant execute on function public.radar_registrar_senha_definida(), public.radar_usuarios_datas() to authenticated;
