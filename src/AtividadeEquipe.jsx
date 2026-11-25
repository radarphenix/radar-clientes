import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";

// Atividade da equipe (Dashboard): visitas por semana (rotas marcadas como visitado, pela data gravada
// em visitado_em), por pessoa (responsável da rota), conclusão das rotas finalizadas e cancelamentos
// com motivo. Cada um vê o que a RLS permite (representante: as próprias rotas).

const SEMANAS = 12;
const isoDia = (d) => d.toISOString().slice(0, 10);

function inicioSemana(d) {
  const x = new Date(d);
  x.setHours(12, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); // segunda-feira
  return isoDia(x);
}

export default function AtividadeEquipe({ usuarios = [] }) {
  const [dados, setDados] = useState(null);

  useEffect(() => {
    let vivo = true;
    Promise.all([
      supabase.from("rota_clientes").select("id, rota_id, status, visitado_em, motivo_cancelamento").range(0, 9999),
      supabase.from("rotas").select("id, nome, status, data_rota, usuario_responsavel, user_id").range(0, 9999),
    ]).then(([rc, ro]) => vivo && setDados({ itens: rc.data || [], rotas: ro.data || [] }));
    return () => { vivo = false; };
  }, []);

  const r = useMemo(() => {
    if (!dados) return null;
    const nome = new Map(usuarios.map((u) => [u.user_id, u.nome]));
    const rota = new Map(dados.rotas.map((x) => [x.id, x]));
    const resp = (rc) => { const ro = rota.get(rc.rota_id); return ro ? ro.usuario_responsavel || ro.user_id : null; };
    const hoje = new Date();
    const semanas = Array.from({ length: SEMANAS }, (_, i) => {
      const d = new Date(hoje);
      d.setDate(d.getDate() - (SEMANAS - 1 - i) * 7);
      return { inicio: inicioSemana(d), total: 0 };
    });
    const corte90 = isoDia(new Date(hoje.getTime() - 90 * 86400000));
    const corte30 = isoDia(new Date(hoje.getTime() - 30 * 86400000));
    const pessoas = new Map();
    const pessoa = (id) => {
      if (!pessoas.has(id)) pessoas.set(id, { id, nome: nome.get(id) || "Sem responsável", v30: 0, v90: 0, cancelados: 0, itensFinalizadas: 0, visitadosFinalizadas: 0, rotas: new Set() });
      return pessoas.get(id);
    };
    const motivos = new Map();
    for (const rc of dados.itens) {
      const p = pessoa(resp(rc));
      const ro = rota.get(rc.rota_id);
      if (ro) p.rotas.add(ro.id);
      if (rc.status === "VISITADO" && rc.visitado_em) {
        const dia = String(rc.visitado_em).slice(0, 10);
        if (dia >= corte30) p.v30++;
        if (dia >= corte90) p.v90++;
        const ini = inicioSemana(new Date(`${dia}T12:00:00`));
        const s = semanas.find((x) => x.inicio === ini);
        if (s) s.total++;
      }
      if (rc.status === "CANCELADO") {
        p.cancelados++;
        const m = String(rc.motivo_cancelamento || "Sem motivo informado").trim();
        motivos.set(m, (motivos.get(m) || 0) + 1);
      }
      if (ro?.status === "FINALIZADA") {
        p.itensFinalizadas++;
        if (rc.status === "VISITADO") p.visitadosFinalizadas++;
      }
    }
    const lista = [...pessoas.values()].filter((p) => p.rotas.size).sort((a, b) => b.v90 - a.v90 || b.v30 - a.v30);
    const itensF = lista.reduce((s, p) => s + p.itensFinalizadas, 0);
    const visF = lista.reduce((s, p) => s + p.visitadosFinalizadas, 0);
    return {
      semanas, lista,
      conclusao: itensF ? Math.round((visF / itensF) * 100) : null,
      motivos: [...motivos.entries()].sort((a, b) => b[1] - a[1]),
      totalCancelados: lista.reduce((s, p) => s + p.cancelados, 0),
      totalV90: lista.reduce((s, p) => s + p.v90, 0),
    };
  }, [dados, usuarios]);

  if (!r) return <p className="dcart-vazio">Carregando atividade…</p>;
  const max = Math.max(1, ...r.semanas.map((s) => s.total));

  return (
    <div className="dativ">
      <div className="dativ-kpis">
        <div className="dcart-kpi"><span>Visitas em 90 dias (rotas)</span><strong>{r.totalV90}</strong></div>
        <div className="dcart-kpi"><span>Conclusão das rotas finalizadas</span><strong>{r.conclusao === null ? "—" : `${r.conclusao}%`}</strong><small>clientes visitados ÷ incluídos</small></div>
        <div className="dcart-kpi"><span>Cancelamentos</span><strong>{r.totalCancelados}</strong><small>em todas as rotas</small></div>
      </div>

      <div className="dativ-grafico" role="img" aria-label="Visitas por semana">
        {r.semanas.map((s) => (
          <div key={s.inicio} className="dativ-barra" title={`Semana de ${s.inicio.split("-").reverse().join("/")}: ${s.total} visita(s)`}>
            <span>{s.total || ""}</span>
            <div><i style={{ height: `${(s.total / max) * 100}%` }} /></div>
            <small>{s.inicio.slice(8, 10)}/{s.inicio.slice(5, 7)}</small>
          </div>
        ))}
      </div>
      <p className="dcart-nota">Visitas por semana (início na segunda-feira), pelas rotas marcadas como "visitado".</p>

      <div className="dcart-grid">
        <div className="dativ-tabela">
          <table>
            <thead><tr><th>Pessoa</th><th>30 dias</th><th>90 dias</th><th>Cancel.</th><th title="Rotas finalizadas: visitados ÷ incluídos">Conclusão</th></tr></thead>
            <tbody>
              {r.lista.map((p) => (
                <tr key={p.id || "sem"}>
                  <td>{p.nome}<small>{p.rotas.size} rota(s)</small></td>
                  <td>{p.v30}</td><td>{p.v90}</td><td>{p.cancelados}</td>
                  <td>{p.itensFinalizadas ? `${Math.round((p.visitadosFinalizadas / p.itensFinalizadas) * 100)}%` : "—"}</td>
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
              {r.motivos.slice(0, 8).map(([m, q]) => <li key={m}><span>{m}</span><b>{q}</b></li>)}
            </ul>
          ) : <p className="dcart-vazio">Nenhum cancelamento.</p>}
        </div>
      </div>
    </div>
  );
}
