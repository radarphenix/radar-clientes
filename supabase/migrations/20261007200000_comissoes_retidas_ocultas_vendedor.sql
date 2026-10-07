-- Parcela retida (CONSIDERAR = 'N' no MWComissoes, "Pagar" desmarcado) nao aparece para o
-- representante (decisao do usuario, 07/10/2026).
--
-- Visao micro (vendedor): so ve o que vai receber. Se o gestor tira uma parcela depois de
-- revisada, ela some da tela dele sem rastro - nem linha, nem total, nem no card "Minha
-- comissao". O filtro fica na policy (e nao so na tela) para a linha nem chegar ao
-- navegador do representante.
-- Visao macro (admin): continua vendo tudo; a tela de Comissoes mostra "Retida" e o Painel
-- BI mostra a comissao retida do mes.
--
-- So muda a policy de SELECT de comissoes_lancamentos. Resumos mensais (vendas, meta) e
-- faixas nao mudam: a venda aconteceu e continua contando na meta.

drop policy if exists "representante consulta proprios lancamentos"
  on public.comissoes_lancamentos;
create policy "representante consulta proprios lancamentos"
on public.comissoes_lancamentos for select to authenticated
using (
  public.radar_perfil_atual_tipo() = 'admin'
  or (
    public.radar_perfil_atual_tipo() = 'representante'
    and considerar is not false
    and codigo_representante = any(
      public.radar_codigos_numericos_equivalentes(
        public.radar_perfil_atual_codigo_representante()
      )
    )
  )
);
