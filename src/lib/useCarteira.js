import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import { chamarAcompanhamentosCigam } from "./cigamAcompanhamentos.js";

// Carteira enriquecida (Dashboard e mapa do planejamento de rota): para cada cliente, a última visita
// (mais recente entre a rota marcada como visitado e o acompanhamento VISITA / VISITA TECNICA), quem
// visitou, a origem ("radar" = rota, "cigam" = acompanhamento), o país (exterior) e as compras
// (função cigam-acompanhamentos?dashboard=carteira, só com podeCompras).

const hojeISO = () => new Date().toISOString().slice(0, 10);
export const diasDesde = (de, ate = hojeISO()) =>
  Math.round((Date.parse(`${ate}T12:00:00`) - Date.parse(`${String(de).slice(0, 10)}T12:00:00`)) / 86400000);
export const cod6 = (c) => { const d = String(c || "").replace(/\D/g, ""); return d && !/^0+$/.test(d) ? d.padStart(6, "0") : ""; };

export function useCarteira(clientes, usuarios = [], podeCompras = false) {
  const [visitas, setVisitas] = useState(null); // rota: cliente_id -> { em, quem }
  const [visitasCigam, setVisitasCigam] = useState(new Map()); // acompanhamento: codigo6 -> { em, quem, titulo }
  const [locManual, setLocManual] = useState(new Map()); // exterior pesquisado: codigo -> { pais, cidade, precisao }
  const [compras, setCompras] = useState(null);
  const [erroCompras, setErroCompras] = useState("");

  useEffect(() => {
    let vivo = true;
    Promise.all([
      supabase.from("rota_clientes").select("cliente_id, rota_id, visitado_em").eq("status", "VISITADO").not("visitado_em", "is", null),
      supabase.from("rotas").select("id, usuario_responsavel, user_id"),
      supabase.from("cigam_visitas_clientes").select("codigo_cliente, ultima_visita, usuario, titulo").not("ultima_visita", "is", null),
      supabase.from("clientes_localizacao_manual").select("codigo_cliente, pais, cidade, precisao"),
    ]).then(([rc, ro, vc, lm]) => {
      if (!vivo) return;
      const resp = new Map((ro.data || []).map((r) => [r.id, r.usuario_responsavel || r.user_id]));
      const m = new Map();
      for (const v of rc.data || []) {
        const atual = m.get(v.cliente_id);
        if (!atual || v.visitado_em > atual.em) m.set(v.cliente_id, { em: v.visitado_em, quem: resp.get(v.rota_id) || null });
      }
      setVisitas(m);
      setLocManual(new Map((lm.data || []).map((x) => [cod6(x.codigo_cliente) || x.codigo_cliente, x])));
      setVisitasCigam(new Map((vc.data || []).map((x) => [x.codigo_cliente, { em: x.ultima_visita, quem: x.usuario, titulo: x.titulo }])));
    });
    return () => { vivo = false; };
  }, []);

  useEffect(() => {
    if (!podeCompras) return undefined;
    let vivo = true;
    chamarAcompanhamentosCigam({ dashboard: "carteira" })
      .then(async (r) => {
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error || `Erro ${r.status}`);
        if (vivo) setCompras(j);
      })
      .catch((e) => vivo && setErroCompras(e.message || "Falha na consulta."));
    return () => { vivo = false; };
  }, [podeCompras]);

  const nomeUsuario = useMemo(() => new Map(usuarios.map((u) => [u.user_id, u.nome])), [usuarios]);
  const lista = useMemo(() => (clientes || []).map((c) => {
    const codigo = cod6(c.codigo_cliente);
    const r = visitas?.get(c.id);
    const g = visitasCigam.get(codigo);
    const dataR = r ? String(r.em).slice(0, 10) : "";
    const dataG = g ? String(g.em).slice(0, 10) : "";
    const usaAcomp = dataG && dataG > dataR;
    const ultimaVisita = usaAcomp ? dataG : dataR || null;
    return {
      ...c, ultimaVisita, diasVisita: ultimaVisita ? diasDesde(ultimaVisita) : null,
      origemVisita: usaAcomp ? "cigam" : dataR ? "radar" : null,
      quemVisitou: usaAcomp ? g.quem : r ? nomeUsuario.get(r.quem) || null : null,
      // País: cadastro do CIGAM; se faltar, o da localização pesquisada (clientes do exterior sem UF).
      pais: compras?.paises?.[codigo] || locManual.get(codigo)?.pais || null,
      localAproximado: ["cidade", "pais"].includes(locManual.get(codigo)?.precisao) ? locManual.get(codigo).precisao : null,
      compra: compras?.clientes?.[codigo] || null,
    };
  }), [clientes, visitas, visitasCigam, compras, nomeUsuario, locManual]);

  return { lista, compras, erroCompras };
}
