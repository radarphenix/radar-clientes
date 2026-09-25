-- Na feira, só empresa, contato, telefone e responsável são obrigatórios.
-- Os demais dados da máquina/produto podem ficar em branco (gravados como null).
alter table public.cadastro_produtos_feira_phenix
  alter column email drop not null,
  alter column maquina drop not null,
  alter column tipo_papel drop not null,
  alter column produto drop not null,
  alter column comprimento drop not null,
  alter column largura drop not null,
  alter column cfm drop not null,
  alter column gramatura drop not null,
  alter column espessura drop not null,
  alter column durabilidade drop not null,
  alter column velocidade_maquina drop not null;

alter table public.cadastro_produtos_feira_phenix
  drop constraint if exists cadastro_produtos_feira_phenix_email_check,
  drop constraint if exists cadastro_produtos_feira_phenix_maquina_check,
  drop constraint if exists cadastro_produtos_feira_phenix_tipo_papel_check;

alter table public.cadastro_produtos_feira_phenix
  add constraint cadastro_produtos_feira_phenix_email_check check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  add constraint cadastro_produtos_feira_phenix_maquina_check check (maquina is null or char_length(maquina) between 1 and 160),
  add constraint cadastro_produtos_feira_phenix_tipo_papel_check check (tipo_papel is null or tipo_papel in ('Tissue','Marrom'));
