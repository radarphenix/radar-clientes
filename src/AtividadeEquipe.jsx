import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";

// Atividade da equipe (Dashboard): visitas por semana (rotas marcadas como visitado, pela data gravada
// em visitado_em), por pessoa (responsável da rota), conclusão das rotas finalizadas e cancelamentos
// com motivo. Cada um vê o que a RLS permite (representante: as próprias rotas).
// Todo número é clicável e abre a lista de clientes/rotas que gerou aquele valor (pedido do usuário, 25/11/2026).

const SEMANAS = 12;
const isoDia = (d) => d.toISOString().slice(0, 10);
const dataBR = (v) => (v ? String(v).slice(0, 10).split("-").reverse().join("/") : "—");
const STATUS = { VISITADO: "Visitado", CANCELADO: "Cancelado", PENDENTE: "Pendente" };

function inicioSemana(d) {
  const x = new Date(d);
  x.setHours(12, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); // segunda-feira
  return isoDia(x);
}

// Número clicável: abre o detalhe com as linhas que o compõem.
function Num({ itens, titulo, abrir, children }) {
  if (!itens?.length) return <span>{children}</span>;
  return <button type="button" className="dativ-num" title="Ver o que gerou este número" onClick={() => abrir(titulo, itens)}>{children}</button>;
}

// Painel com as linhas por trás do número clicado.
function DetalheAtividade({ detalhe, fechar }) {
  const itens = [...detalhe.itens].sort((a, b) => String(b.data || "").localeCompare(String(a.data || "")));
  const temMotivo = itens.some((x) => x.motivo);
  return (
    <section className="dcart-bloco dcart-detalhe dativ-detalhe">
      <div className="dcart-bloco-topo">
        <h4>{detalhe.titulo} ({itens.length})</h4>
        <button type="button" className="dcart-mais" onClick={fechar}>fechar</button>
      </div>
      <div className="dativ-tabela dativ-tabela-detalhe">
        <table>
          <thead><tr><th>Data</th><th>Cliente</th><th>Rota</th><th>Pessoa</th><th>Situação</th>{temMotivo && <th>Motivo</th>}</tr></thead>
          <tbody>{itens.map((x) => (
            <tr key={x.id}>
              <td>{dataBR(x.data)}</td>
              <td>{x.cliente}<small>{[x.codigo, x.local].filter(Boolean).join(" · ")}</small></td>
              <td>{x.rota}<small>{x.rotaStatus}</small></td>
              <td>{x.pessoa}</td>
              <td>{x.status}</td>
              {temMotivo && <td>{x.motivo || "—"}</td>}
            </tr>
          ))}</tbody>
        </table>
      </div>
    </section>
  );
}

export default function AtividadeEquipe({ usuarios = [] }) {
  const [dados, setDados] = useState(null);
  const [detalhe, setDetalhe] = useState(null);
  const abrir = (titulo, itens) => setDetalhe({ titulo, itens });

  useEffect(() => {
    let vivo = true;
    Promise.all([
      supabase.from("rota_clientes").select("id, rota_id, cliente_id, status, visitado_em, motivo_cancelamento").range(0, 9999),
      supabase.from("rotas").select("id, nome, status, data_rota, usuario_responsavel, user_id").range(0, 9999),
      supabase.from("clientes").select("id, cliente, codigo_cliente, cidade, uf").range(0, 9999),
    ]).then(([rc, ro, cl]) => vivo && setDados({ itens: rc.data || [], rotas: ro.data || [], clientes: cl.data || [] }));
    return () => { vivo = false; };
  }, []);

  const r = useMemo(() => {
    if (!dados) return null;
    const nome = new Map(usuarios.map((u) => [u.user_id, u.nome]));
    const rota = new Map(dados.rotas.map((x) => [x.id, x]));
    const cliente = new Map(dados.clientes.map((c) => [c.id, c]));
    const resp = (rc) => { const ro = rota.get(rc.rota_id); return ro ? ro.usuario_responsavel || ro.user_id : null; };
    // Linha do detalhe: o que está por trás de cada número.
    const linha = (rc) => {
      const ro = rota.get(rc.rota_id);
      const c = cliente.get(rc.cliente_id);
      return {
        id: rc.id, data: rc.visitado_em || ro?.data_rota || null,
        cliente: c ? c.cliente : "Cliente fora da sua carteira", codigo: c?.codigo_cliente || "",
        local: c ? `${c.cidade || "-"}${c.uf ? `/${c.uf}` : ""}` : "",
        rota: ro?.nome || `Rota ${rc.rota_id}`, rotaStatus: ro?.status || "",
        pessoa: nome.get(resp(rc)) || "Sem responsável", status: STATUS[rc.status] || rc.status, motivo: rc.motivo_cancelamento || "",
      };
    };
    const hoje = new Date();
    const semanas = Array.from({ length: SEMANAS }, (_, i) => {
      const d = new Date(hoje);
      d.setDate(d.getDate() - (SEMANAS - 1 - i) * 7);
      return { inicio: inicioSemana(d), total: 0, itens: [] };
    });
    const corte90 = isoDia(new Date(hoje.getTime() - 90 * 86400000));
    const corte30 = isoDia(new Date(hoje.getTime() - 30 * 86400000));
    const pessoas = new Map();
    const pessoa = (id) => {
      if (!pessoas.has(id)) {
        pessoas.set(id, { id, nome: nome.get(id) || "Sem responsável", v30: 0, v90: 0, cancelados: 0, itensFinalizadas: 0, visitadosFinalizadas: 0,
          rotas: new Set(), l30: [], l90: [], lCanc: [], lFin: [] });
      }
      return pessoas.get(id);
    };
    const motivos = new Map();
    for (const rc of dados.itens) {
      const p = pessoa(resp(rc));
      const ro = rota.get(rc.rota_id);
      if (ro) p.rotas.add(ro.id);
      const l = linha(rc);
      if (rc.status === "VISITADO" && rc.visitado_em) {
        const dia = String(rc.visitado_em).slice(0, 10);
        if (dia >= corte30) { p.v30++; p.l30.push(l); }
        if (dia >= corte90) { p.v90++; p.l90.push(l); }
        const ini = inicioSemana(new Date(`${dia}T12:00:00`));
        const s = semanas.find((x) => x.inicio === ini);
        if (s) { s.total++; s.itens.push(l); }
      }
      if (rc.status === "CANCELADO") {
        p.cancelados++;
        p.lCanc.push(l);
        const m = String(rc.motivo_cancelamento || "Sem motivo informado").trim();
        motivos.set(m, [...(motivos.get(m) || []), l]);
      }
      if (ro?.status === "FINALIZADA") {
        p.itensFinalizadas++;
        p.lFin.push(l);
        if (rc.status === "VISITADO") p.visitadosFinalizadas++;
      }
    }
    const lista = [...pessoas.values()].filter((p) => p.rotas.size).sort((a, b) => b.v90 - a.v90 || b.v30 - a.v30);
    const itensF = lista.reduce((s, p) => s + p.itensFinalizadas, 0);
    const visF = lista.reduce((s, p) => s + p.visitadosFinalizadas, 0);
    return {
      semanas, lista,
      conclusao: itensF ? Math.round((visF / itensF) * 100) : null,
      motivos: [...motivos.entries()].sort((a, b) => b[1].length - a[1].length),
      totalCancelados: lista.reduce((s, p) => s + p.cancelados, 0),
      totalV90: lista.reduce((s, p) => s + p.v90, 0),
      l90: lista.flatMap((p) => p.l90), lFin: lista.flatMap((p) => p.lFin), lCanc: lista.flatMap((p) => p.lCanc),
    };
  }, [dados, usuarios]);

  if (!r) return <p className="dcart-vazio">Carregando atividade…</p>;
  const max = Math.max(1, ...r.semanas.map((s) => s.total));
  const abrirSemana = (s) => s.total && abrir(`Visitas da semana de ${dataBR(s.inicio)}`, s.itens);

  return (
    <div className="dativ">
      <div className="dativ-kpis">
        <button type="button" className="dcart-kpi" disabled={!r.l90.length} onClick={() => abrir("Visitas nos últimos 90 dias", r.l90)}>
          <span>Visitas em 90 dias (rotas)</span><strong>{r.totalV90}</strong><small>ver quais</small>
        </button>
        <button type="button" className="dcart-kpi" disabled={!r.lFin.length} onClick={() => abrir("Clientes das rotas finalizadas", r.lFin)}>
          <span>Conclusão das rotas finalizadas</span><strong>{r.conclusao === null ? "—" : `${r.conclusao}%`}</strong><small>clientes visitados ÷ incluídos · ver quais</small>
        </button>
        <button type="button" className="dcart-kpi" disabled={!r.lCanc.length} onClick={() => abrir("Cancelamentos", r.lCanc)}>
          <span>Cancelamentos</span><strong>{r.totalCancelados}</strong><small>em todas as rotas · ver quais</small>
        </button>
      </div>
      {detalhe && <DetalheAtividade detalhe={detalhe} fechar={() => setDetalhe(null)} />}

      <div className="dativ-grafico" role="group" aria-label="Visitas por semana">
        {r.semanas.map((s) => (
          <div key={s.inicio} className={`dativ-barra${s.total ? " dativ-barra-clicavel" : ""}`}
            title={`Semana de ${dataBR(s.inicio)}: ${s.total} visita(s)${s.total ? " · clique para ver" : ""}`}
            role={s.total ? "button" : undefined} tabIndex={s.total ? 0 : undefined}
            onClick={() => abrirSemana(s)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); abrirSemana(s); } }}>
            <span>{s.total || ""}</span>
            <div><i style={{ height: `${(s.total / max) * 100}%` }} /></div>
            <small>{s.inicio.slice(8, 10)}/{s.inicio.slice(5, 7)}</small>
          </div>
        ))}
      </div>
      <p className="dcart-nota">Visitas por semana (início na segunda-feira), pelas rotas marcadas como "visitado". Clique em qualquer número para ver o que o gerou.</p>

      <div className="dcart-grid">
        <div className="dativ-tabela">
          <table>
            <thead><tr><th>Pessoa</th><th>30 dias</th><th>90 dias</th><th>Cancel.</th><th title="Rotas finalizadas: visitados ÷ incluídos">Conclusão</th></tr></thead>
            <tbody>
              {r.lista.map((p) => (
                <tr key={p.id || "sem"}>
                  <td>{p.nome}<small>{p.rotas.size} rota(s)</small></td>
                  <td><Num itens={p.l30} titulo={`${p.nome} · visitas em 30 dias`} abrir={abrir}>{p.v30}</Num></td>
                  <td><Num itens={p.l90} titulo={`${p.nome} · visitas em 90 dias`} abrir={abrir}>{p.v90}</Num></td>
                  <td><Num itens={p.lCanc} titulo={`${p.nome} · cancelamentos`} abrir={abrir}>{p.cancelados}</Num></td>
                  <td>
                    <Num itens={p.lFin} titulo={`${p.nome} · clientes das rotas finalizadas`} abrir={abrir}>
                      {p.itensFinalizadas ? `${Math.round((p.visitadosFinalizadas / p.itensFinalizadas) * 100)}%` : "—"}
                    </Num>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!r.lista.length && <p className="dcart-vazio">Nenhuma rota ainda.</p>}
        </div>
        <div>
          <h5 className="dativ-sub">Motivos de cancelamento</h5>
          {r.motivos.length ? (
            <ul className="dativ-motivos">
              {r.motivos.slice(0, 8).map(([m, itens]) => (
                <li key={m}><span>{m}</span><Num itens={itens} titulo={`Cancelamentos · ${m}`} abrir={abrir}><b>{itens.length}</b></Num></li>
              ))}
            </ul>
          ) : <p className="dcart-vazio">Nenhum cancelamento.</p>}
        </div>
      </div>
    </div>
  );
}
