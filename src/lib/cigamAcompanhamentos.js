// Chamadas à função cigam-acompanhamentos (acompanhamentos do CIGAM, somente leitura).
import { supabase, supabaseAnonKey, supabaseUrl } from "../supabaseClient";

const FUNCAO = `${supabaseUrl}/functions/v1/cigam-acompanhamentos`;

export async function chamarAcompanhamentosCigam(params) {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  return fetch(`${FUNCAO}?${new URLSearchParams(params)}`, {
    headers: { Authorization: `Bearer ${token}`, apikey: supabaseAnonKey },
  });
}

/** Deixa a sessão do CIGAM pronta em segundo plano (o login no portal leva ~20 s). Uma vez por carga do app. */
let aquecido = false;
export function aquecerAcompanhamentosCigam() {
  if (aquecido) return;
  aquecido = true;
  chamarAcompanhamentosCigam({ aquecer: "1" }).catch(() => {
    aquecido = false;
  });
}
