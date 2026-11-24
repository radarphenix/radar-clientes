// Chamadas à função cigam-acompanhamentos (acompanhamentos do CIGAM, somente leitura).
import { useEffect, useState } from "react";
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

/**
 * Alertas do CIGAM para vários clientes de uma vez (rota do dia): título vencido e última compra.
 * Retorna { [codigo6]: { vencido, vencidos, maior_atraso, ultima_compra } }. Só consulta se `ativo`.
 */
export function useAlertasCigam(codigos, ativo) {
  const chave = ativo ? [...new Set((codigos || []).map(codigoCigam).filter(Boolean))].sort().join(",") : "";
  const [estado, setEstado] = useState({ chave: "", alertas: {} });
  useEffect(() => {
    if (!chave) return undefined;
    let vivo = true;
    chamarAcompanhamentosCigam({ alertas: chave })
      .then((r) => (r.ok ? r.json() : { alertas: {} }))
      .then((j) => vivo && setEstado({ chave, alertas: j.alertas || {} }))
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, [chave]);
  return estado.chave === chave ? estado.alertas : {};
}

export const codigoCigam = (codigo) => {
  const d = String(codigo || "").replace(/\D/g, "");
  return d && !/^0+$/.test(d) ? d.padStart(6, "0") : "";
};
