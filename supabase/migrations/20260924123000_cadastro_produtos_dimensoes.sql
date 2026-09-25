alter table public.cadastro_produtos_feira_phenix
  add column if not exists comprimento text,
  add column if not exists largura text;

update public.cadastro_produtos_feira_phenix
set comprimento = coalesce(comprimento, ''), largura = coalesce(largura, '')
where comprimento is null or largura is null;

alter table public.cadastro_produtos_feira_phenix
  alter column comprimento set not null,
  alter column largura set not null;
