-- PROJETO GLOBAL GEACOMP -> AMOSTRAS
-- MIGRATION PREPARADA, AINDA NAO APLICADA.
-- Deve ser implantada antes da versao do MWAmostrasSync que envia esses campos.

alter table public.amostras_phenix
    add column if not exists id_geacomp_origem bigint,
    add column if not exists chave_geacomp_origem text,
    add column if not exists sequencia_geacomp integer,
    add column if not exists status_geacomp text,
    add column if not exists comprimento numeric(12,3),
    add column if not exists largura numeric(12,3),
    add column if not exists modelo_concorrente text;

alter table public.amostras_phenix
    drop constraint if exists amostras_phenix_status_geacomp_check;

alter table public.amostras_phenix
    add constraint amostras_phenix_status_geacomp_check
    check (
        status_geacomp is null
        or status_geacomp in ('EM_ANALISE', 'CONCLUIDO', 'IGNORADO')
    );

create index if not exists amostras_phenix_chave_geacomp_origem_idx
    on public.amostras_phenix (chave_geacomp_origem, sequencia_geacomp);

comment on column public.amostras_phenix.id_geacomp_origem is
    'ID auxiliar do CIGAM.GEACOMP quando diferente de zero; nulo para ID zero ou cadastro manual.';

comment on column public.amostras_phenix.chave_geacomp_origem is
    'Chave canonica empresa|data AAAAMMDD|hora|lancamento|sequencia; nula para cadastro manual.';

comment on column public.amostras_phenix.sequencia_geacomp is
    'Sequencia da amostra dentro do mesmo acompanhamento.';

comment on column public.amostras_phenix.status_geacomp is
    'Estado do processamento no desktop: EM_ANALISE, CONCLUIDO ou IGNORADO.';

-- O assunto e o historico completo da GEACOMP nao devem ser sincronizados.
-- O Radar devera ocultar IGNORADO e qualquer futuro registro tecnico.
