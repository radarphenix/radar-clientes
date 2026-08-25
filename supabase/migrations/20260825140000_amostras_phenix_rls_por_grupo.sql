-- A tela Amostras deveria ser condicionada a configuracoes_grupos.permite_menu_amostras
-- por grupo (regra de negocio ja registrada no projeto), mas a unica policy
-- de leitura encontrada em producao era "select true" para qualquer
-- autenticado -- ou seja, a flag so escondia o menu na UI, e qualquer
-- usuario logado conseguia ler os dados de Amostras direto pela API do
-- Supabase mesmo com o grupo dele desativado.

drop policy if exists "amostras_phenix_select_authenticated" on public.amostras_phenix;

create policy "amostras_phenix_select_conforme_config_grupo"
on public.amostras_phenix
for select
to authenticated
using (
  public.radar_perfil_atual_tipo() = 'admin'
  or exists (
    select 1
    from public.configuracoes_grupos cg
    where cg.tipo_perfil = public.radar_perfil_atual_tipo()
      and cg.permite_menu_amostras = true
  )
);
