import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, MapPinned, TrendingDown, Users } from "lucide-react";
import { supabase } from "./supabaseClient";
import { chamarAcompanhamentosCigam } from "./lib/cigamAcompanhamentos.js";
import "./dashboard-carteira.css";

// Dashboard · Carteira (24/11/2026): cobertura de visitas e oportunidades do CIGAM.
// - Carteira = clientes que o usuário enxerga (RLS: representante só a dele; admin todos, com filtro).
// - Visita = rota_clientes com status VISITADO; data em visitado_em (gravada pelo banco desde 24/11/2026).
// - Compras = função cigam-acompanhamentos?dashboard=carteira (uma consulta de notas para a carteira toda),
//   só para quem tem "Visão geral do cliente" ou "Pedidos e notas".

const hojeISO = () => new Date().toISOString().slice(0, 10);
const dias = (de, ate = hojeISO()) => Math.round((Date.parse(`${ate}T12:00:00`) - Date.parse(`${String(de).slice(0, 10)}T12:00:00`)) / 86400000);
const dataBR = (v) => (v ? String(v).slice(0, 10).split("-").reverse().join("/") : "—");
const moeda = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const cod6 = (c) => { const d = String(c || "").replace(/\D/g, ""); return d && !/^0+$/.test(d) ? d.padStart(6, "0") : ""; };
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
const LIMITE = 8;
// Cliente do exterior (UF "EX") mostra o país do cadastro do CIGAM no lugar de "EXTERIOR/EX".
const local = (c) => (c.pais ? c.pais : `${c.cidade || "-"}${c.uf ? `/${c.uf}` : ""}`);
const ORIGEM = { radar: "Radar", cigam: "CIGAM" };

function Lista({ itens, vazio, colunaExtra, abrirFicha }) {
  const [todos, setTodos] = useState(false);
  if (!itens.length) return <p className="dcart-vazio">{vazio}</p>;
  const mostrar = todos ? itens : itens.slice(0, LIMITE);
  return (
    <>
      <ul className="dcart-lista">
        {mostrar.map((c) => (
          <li key={c.id}>
            <div className="dcart-cli">
              <strong title={c.cliente}>{c.cliente || "Cliente sem nome"}</strong>
              <small>
                {local(c)} · visita: {c.ultimaVisita ? `há ${c.diasVisita} d (${ORIGEM[c.origemVisita]})` : "nunca"}
                {c.compra?.ultima && <> · compra: há {dias(c.compra.ultima)} d</>}
              </small>
            </div>
            <div className="dcart-extra">{colunaExtra(c)}</div>
            <button type="button" className="dcart-ficha" onClick={() => abrirFicha(c)}>Ficha</button>
          </li>
        ))}
      </ul>
      {itens.length > LIMITE && (
        <button type="button" className="dcart-mais" onClick={() => setTodos(!todos)}>
          {todos ? "mostrar menos" : `ver todos os ${itens.length}`}
        </button>
      )}
    </>
  );
}

export default function DashboardCarteira({ clientes, usuarios = [], podeCompras, verTodos, abrirFicha }) {
  const [visitas, setVisitas] = useState(null); // Radar: cliente_id -> { em, quem }
  const [visitasCigam, setVisitasCigam] = useState(new Map()); // codigo6 -> { em, quem, titulo }
  const [detalhe, setDetalhe] = useState(null); // card aberto
  const [compras, setCompras] = useState(null);
  const [erroCompras, setErroCompras] = useState("");
  const [representante, setRepresentante] = useState("");
  const [aba, setAba] = useState("atrasada");

  useEffect(() => {
    let vivo = true;
    Promise.all([
      supabase.from("rota_clientes").select("cliente_id, rota_id, visitado_em").eq("status", "VISITADO").not("visitado_em", "is", null),
      supabase.from("rotas").select("id, usuario_responsavel, user_id"),
      supabase.from("cigam_visitas_clientes").select("codigo_cliente, ultima_visita, usuario, titulo").not("ultima_visita", "is", null),
    ]).then(([rc, ro, vc]) => {
      if (!vivo) return;
      const resp = new Map((ro.data || []).map((r) => [r.id, r.usuario_responsavel || r.user_id]));
      const m = new Map();
      for (const v of rc.data || []) {
        const atual = m.get(v.cliente_id);
        if (!atual || v.visitado_em > atual.em) m.set(v.cliente_id, { em: v.visitado_em, quem: resp.get(v.rota_id) || null });
      }
      setVisitas(m);
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
      .catch((e) => vivo && setErroCompras(e.message || "Falha ao consultar o CIGAM."));
    return () => { vivo = false; };
  }, [podeCompras]);

  const nomesRep = useMemo(() => {
    const m = new Map();
    for (const u of usuarios) if (u.codigo_representante) m.set(cod6(u.codigo_representante), u.nome);
    return m;
  }, [usuarios]);
  const representantes = useMemo(() => {
    const s = new Set((clientes || []).map((c) => cod6(c.codigo_representante)).filter(Boolean));
    return [...s].map((c) => [c, nomesRep.get(c) || `Representante ${c}`]).sort((a, b) => a[1].localeCompare(b[1], "pt-BR"));
  }, [clientes, nomesRep]);

  const nomeUsuario = useMemo(() => new Map(usuarios.map((u) => [u.user_id, u.nome])), [usuarios]);
  // Visita mais recente entre o Radar (rota marcada como visitada) e o CIGAM (acompanhamento VISITA / VISITA TECNICA).
  const carteira = useMemo(() => (clientes || [])
    .filter((c) => !representante || cod6(c.codigo_representante) === representante)
    .map((c) => {
      const codigo = cod6(c.codigo_cliente);
      const r = visitas?.get(c.id);
      const g = visitasCigam.get(codigo);
      const dataR = r ? String(r.em).slice(0, 10) : "";
      const dataG = g ? String(g.em).slice(0, 10) : "";
      const usaCigam = dataG && dataG > dataR;
      const ultimaVisita = usaCigam ? dataG : dataR || null;
      return {
        ...c, ultimaVisita, diasVisita: ultimaVisita ? dias(ultimaVisita) : null,
        origemVisita: usaCigam ? "cigam" : dataR ? "radar" : null,
        quemVisitou: usaCigam ? g.quem : r ? nomeUsuario.get(r.quem) || null : null,
        pais: compras?.paises?.[codigo] || null,
        compra: compras?.clientes?.[codigo] || null,
      };
    }), [clientes, representante, visitas, visitasCigam, compras, nomeUsuario]);

  const total = carteira.length;
  const visitadosEm = (d) => carteira.filter((c) => c.diasVisita !== null && c.diasVisita <= d).length;
  const v30 = visitadosEm(30), v60 = visitadosEm(60), v90 = visitadosEm(90);
  const nunca = carteira.filter((c) => !c.ultimaVisita).length;
  const semVisita90 = carteira.filter((c) => c.diasVisita === null || c.diasVisita > 90);

  const hoje = hojeISO();
  const ordenarValor = (a, b) => (b.compra?.total12 || 0) - (a.compra?.total12 || 0);
  const compramSemVisita = semVisita90.filter((c) => c.compra?.total12 > 0).sort(ordenarValor);
  // Atrasada = cliente com ritmo confiável (3+ compras) que comprou nos últimos 90 dias e já passou da
  // próxima compra prevista. Quem está há mais de 90 dias sem comprar vai para "Parados".
  const atrasada = carteira.filter((c) => c.compra?.proxima && c.compra.proxima < hoje && c.compra.compras >= 3 && dias(c.compra.ultima) <= 90)
    .sort((a, b) => dias(b.compra.proxima) - dias(a.compra.proxima));
  const parados = carteira.filter((c) => c.compra?.ultima && dias(c.compra.ultima) > 90).sort(ordenarValor);
  const queda = carteira.filter((c) => c.compra?.total24 > 0 && c.compra.total12 < c.compra.total24 * 0.7)
    .sort((a, b) => (b.compra.total24 - b.compra.total12) - (a.compra.total24 - a.compra.total12));

  const abas = [
    ["atrasada", "Compra atrasada", atrasada],
    ["parados", "Parados +90 dias", parados],
    ["queda", "Queda vs ano anterior", queda],
  ];

  return (
    <div className="dcart">
      <div className="dcart-topo">
        <h3><Users size={22} /> Carteira</h3>
        {verTodos && representantes.length > 1 && (
          <label className="dcart-filtro">
            Representante
            <select value={representante} onChange={(e) => setRepresentante(e.target.value)}>
              <option value="">Toda a carteira</option>
              {representantes.map(([c, nome]) => <option key={c} value={c}>{nome}</option>)}
            </select>
          </label>
        )}
      </div>

      <div className="dcart-kpis">
        <button type="button" className="dcart-kpi" data-aberto={detalhe === "nunca"} onClick={() => setDetalhe(detalhe === "nunca" ? null : "nunca")}>
          <span>Clientes na carteira</span><strong>{total}</strong><small>{nunca} nunca visitados · ver lista</small>
        </button>
        {[[30, v30], [60, v60], [90, v90]].map(([d, v]) => (
          <button key={d} type="button" className="dcart-kpi" data-aberto={detalhe === d} onClick={() => setDetalhe(detalhe === d ? null : d)}>
            <span>Visitados em {d} dias</span>
            <strong>{pct(v, total)}%</strong>
            <div className="dcart-barra"><i style={{ width: `${pct(v, total)}%` }} /></div>
            <small>{v} de {total} · ver quem</small>
          </button>
        ))}
      </div>
      {detalhe !== null && (
        <section className="dcart-bloco dcart-detalhe">
          <div className="dcart-bloco-topo">
            <h4>{detalhe === "nunca" ? `Nunca visitados (${nunca})` : `Visitados nos últimos ${detalhe} dias (${visitadosEm(detalhe)})`}</h4>
            <button type="button" className="dcart-mais" onClick={() => setDetalhe(null)}>fechar</button>
          </div>
          {detalhe === "nunca" ? (
            <Lista itens={carteira.filter((c) => !c.ultimaVisita).sort(ordenarValor)} abrirFicha={abrirFicha} vazio="Todos os clientes já foram visitados."
              colunaExtra={(c) => (c.compra?.total12 ? <><strong>{moeda(c.compra.total12)}</strong><small>em 12 meses</small></> : <small>sem compras</small>)} />
          ) : (
            <Lista itens={carteira.filter((c) => c.diasVisita !== null && c.diasVisita <= detalhe).sort((a, b) => b.ultimaVisita.localeCompare(a.ultimaVisita))}
              abrirFicha={abrirFicha} vazio="Nenhuma visita no período."
              colunaExtra={(c) => <><strong>{dataBR(c.ultimaVisita)}</strong><small>{c.quemVisitou || "—"} · {ORIGEM[c.origemVisita]}</small></>} />
          )}
        </section>
      )}
      <p className="dcart-nota">
        Visita = rota marcada como "visitado" no Radar ou acompanhamento VISITA / VISITA TECNICA no CIGAM (atualizado toda madrugada). Vale a mais recente.
      </p>

      <div className="dcart-grid">
        {podeCompras && (
          <section className="dcart-bloco dcart-destaque">
            <h4><AlertTriangle size={18} /> Compram e não são visitados há +90 dias</h4>
            {compras ? (
              <Lista itens={compramSemVisita} abrirFicha={abrirFicha} vazio="Nenhum cliente comprador sem visita. 👍"
                colunaExtra={(c) => <><strong>{moeda(c.compra.total12)}</strong><small>em 12 meses</small></>} />
            ) : <p className="dcart-vazio">{erroCompras ? `CIGAM: ${erroCompras}` : "Buscando compras no CIGAM…"}</p>}
          </section>
        )}

        <section className="dcart-bloco">
          <h4><MapPinned size={18} /> Sem visita há +90 dias{podeCompras && compras ? " · demais clientes" : ""}</h4>
          <Lista itens={semVisita90.filter((c) => !(podeCompras && compras && c.compra?.total12 > 0)).sort(podeCompras ? ordenarValor : (a, b) => (b.diasVisita ?? 9999) - (a.diasVisita ?? 9999))}
            abrirFicha={abrirFicha} vazio="Toda a carteira foi visitada nos últimos 90 dias. 👍"
            colunaExtra={(c) => <><strong>{c.ultimaVisita ? dataBR(c.ultimaVisita) : "nunca"}</strong><small>última visita</small></>} />
        </section>
      </div>

      {podeCompras && (
        <section className="dcart-bloco">
          <div className="dcart-bloco-topo">
            <h4><CalendarClock size={18} /> Oportunidades no CIGAM</h4>
            {compras?.historico_desde && <small>Notas desde {dataBR(compras.historico_desde)}</small>}
          </div>
          <div className="dcart-abas" role="tablist">
            {abas.map(([id, nome, lista]) => (
              <button key={id} type="button" role="tab" aria-selected={aba === id} data-active={aba === id} onClick={() => setAba(id)}>
                {nome} <span>{compras ? lista.length : "…"}</span>
              </button>
            ))}
          </div>
          {!compras ? <p className="dcart-vazio">{erroCompras ? `CIGAM: ${erroCompras}` : "Buscando compras no CIGAM…"}</p> : (
            <>
              {aba === "atrasada" && <Lista itens={atrasada} abrirFicha={abrirFicha} vazio="Nenhum cliente com compra atrasada."
                colunaExtra={(c) => <><strong className="dcart-ruim">{dias(c.compra.proxima)} d de atraso</strong><small>compra a cada {c.compra.frequencia} d</small></>} />}
              {aba === "parados" && <Lista itens={parados} abrirFicha={abrirFicha} vazio="Nenhum cliente parado há mais de 90 dias."
                colunaExtra={(c) => <><strong>{moeda(c.compra.total12)}</strong><small>últ. compra {dataBR(c.compra.ultima)}</small></>} />}
              {aba === "queda" && <Lista itens={queda} abrirFicha={abrirFicha}
                vazio={compras.historico_desde && dias(compras.historico_desde) < 395 ? "Ainda não há 2 anos de notas no CIGAM para comparar." : "Nenhum cliente com queda relevante."}
                colunaExtra={(c) => <><strong className="dcart-ruim"><TrendingDown size={14} /> {pct(c.compra.total24 - c.compra.total12, c.compra.total24)}%</strong><small>{moeda(c.compra.total12)} vs {moeda(c.compra.total24)}</small></>} />}
            </>
          )}
        </section>
      )}
    </div>
  );
}
