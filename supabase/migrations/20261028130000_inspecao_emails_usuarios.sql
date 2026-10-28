-- Sugestões de destinatários no e-mail da Inspeção: nome e e-mail dos usuários ativos do Radar.
-- O perfil Qualidade não lê a tabela perfis (só o próprio); esta função devolve só nome/e-mail
-- e só para quem tem acesso à Inspeção.
create or replace function public.inspecao_emails_usuarios()
returns table (nome text, email text)
language sql stable security definer set search_path = public as $$
  select p.nome::text, lower(trim(p.email))::text
  from perfis p
  where public.inspecao_pode('leitura')
    and p.ativo
    and coalesce(trim(p.email), '') like '%@%'
  order by p.nome
$$;
grant execute on function public.inspecao_emails_usuarios() to authenticated;
