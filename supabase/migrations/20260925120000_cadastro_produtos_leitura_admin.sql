-- Relatório de cadastros de produtos da feira: somente administradores ativos podem ler.
-- Gravação continua exclusiva da Edge Function cadastrar-produto-feira (service role).
grant select on public.cadastro_produtos_feira_phenix to authenticated;

drop policy if exists "admin consulta cadastro produtos feira" on public.cadastro_produtos_feira_phenix;
create policy "admin consulta cadastro produtos feira" on public.cadastro_produtos_feira_phenix
  for select to authenticated
  using (exists(select 1 from public.perfis p where p.user_id=auth.uid() and p.tipo_perfil='admin' and p.ativo=true));
