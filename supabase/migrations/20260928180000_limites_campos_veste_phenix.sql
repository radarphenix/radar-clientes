-- Reforço no banco dos limites já validados pela Edge Function inscrever-veste-phenix.
alter table public.promocao_veste_phenix_30_anos
  add constraint promocao_veste_phenix_email_tamanho check (char_length(email) <= 254),
  add constraint promocao_veste_phenix_telefone_tamanho check (char_length(telefone) between 8 and 30),
  add constraint promocao_veste_phenix_empresa_tamanho check (char_length(empresa) between 1 and 160),
  add constraint promocao_veste_phenix_cargo_tamanho check (char_length(cargo) between 1 and 120),
  add constraint promocao_veste_phenix_cidade_tamanho check (char_length(cidade) between 1 and 120),
  add constraint promocao_veste_phenix_uf_valida check (uf in ('AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO')),
  add constraint promocao_veste_phenix_segmento_tamanho check (char_length(segmento) between 1 and 80);
