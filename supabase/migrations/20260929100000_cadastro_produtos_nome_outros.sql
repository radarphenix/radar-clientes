-- Produto "Outros": nome do produto digitado pelo atendente (só preenchido quando produto = 'Outros').
alter table public.cadastro_produtos_feira_phenix
  add column if not exists nome_produto_outros text check (nome_produto_outros is null or char_length(nome_produto_outros) <= 160);
