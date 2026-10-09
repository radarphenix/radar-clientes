// O Supabase devolve no máximo 1000 linhas por requisição, mesmo com .limit() maior.
// Pagina por id até esgotar, para os totais dos painéis BI não ficarem truncados em silêncio.
// montarConsulta: () => supabase.from(...).select(...)[.filtros] (uma consulta nova por página).
export async function buscarTodas(montarConsulta, campoOrdem = "id") {
  const pagina = 1000;
  const linhas = [];
  for (let de = 0; ; de += pagina) {
    const { data, error } = await montarConsulta().order(campoOrdem).range(de, de + pagina - 1);
    if (error) return { data: null, error };
    linhas.push(...(data || []));
    if (!data || data.length < pagina) return { data: linhas, error: null };
  }
}
