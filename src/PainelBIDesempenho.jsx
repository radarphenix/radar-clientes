import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";
import StatTile from "./bi/StatTile.jsx";
import BarChart from "./bi/BarChart.jsx";
import { buscarTodas } from "./bi/buscarTodas.js";
import { CATEGORICAL } from "./bi/paletteBI.js";
import { CabecalhoBI, SEM_REPRESENTANTE, TabelaBI, codigoNormal, dataBR, entre, moeda, moedaCurta, n, pct, useDetalheBI, usePeriodoBI } from "./bi/baseBI.jsx";
import "./bi-panel.css";

// Painel BI · Desempenho comercial (pedido do usuário, 25/11/2026): visitas × compras por representante.
// Visita = rota marcada como visitado (rota_clientes) ou acompanhamento VISITA / VISITA TECNICA
// (cigam_visitas_clientes.visitas_12m, gravado pela sincronização das 7h/12h/17h); mesmo dia conta uma vez.
// O representante é o do cadastro do cliente (carteira). Faturado = notas - devoluções do período.
// Acesso: bi_desempenho. Cada um vê os clientes que a RLS de clientes permite.

const COL_CLI = [
  { chave: "cliente", rotulo: "Cliente", tipo: "texto" },
  { chave: "codigo", rotulo: "Código", tipo: "texto" },
  { chave: "representante", rotulo: "Representante", tipo: "texto" },
  { chave: "visitas", rotulo: "Visitas no período", tipo: "numero" },
  { chave: "ultimaVisita", rotulo: "Última visita no período", tipo: "data" },
  { chave: "ultimaCompra", rotulo: "Última compra no período", tipo: "data" },
  { chave: "valor", rotulo: "Faturado líquido", tipo: "moeda" },
];

export default function PainelBIDesempenho() {
  const periodo = usePeriodoBI("semestre");
  const { inicio, fim } = periodo;
  const [representante, setRepresentante] = useState("");
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState("");
  const { abrir, janela } = useDetalheBI("bi_desempenho");

  useEffect(() => {
    let vivo = true;
    Promise.all([
      supabase.from("clientes").select("id, codigo_cliente, cliente, codigo_representante").range(0, 9999),
      supabase.from("rota_clientes").select("cliente_id, visitado_em").eq("status", "VISITADO").not("visitado_em", "is", null).range(0, 9999),
      supabase.from("cigam_visitas_clientes").select("codigo_cliente, visitas_12m").range(0, 9999),
      buscarTodas(() => supabase.from("bi_notas_itens").select("id, codigo_cliente, data_movimento, valor_liquido, codigo_representante, nome_representante")),
      buscarTodas(() => supabase.from("bi_devolucoes_itens").select("id, codigo_cliente, data_movimento, valor_liquido")),
      supabase.from("perfis").select("nome, codigo_representante").not("codigo_representante", "is", null),
    ]).then(([cl, rc, cv, no, dv, pf]) => {
      if (!vivo) return;
      const e = cl.error || rc.error || cv.error || no.error || dv.error;
      if (e) setErro(e.message);
      setDados({ clientes: cl.data || [], rotas: rc.data || [], cigam: cv.data || [], notas: no.data || [], devolucoes: dv.data || [], perfis: pf.data || [] });
    });
    return () => { vivo = false; };
  }, []);

  const r = useMemo(() => {
    if (!dados) return null;
    const repDe = (v) => codigoNormal(String(v ?? "").replace(/\D/g, "")) || SEM_REPRESENTANTE;
    const nomeRep = new Map();
    for (const x of dados.notas) if (x.codigo_representante && x.nome_representante) nomeRep.set(repDe(x.codigo_representante), x.nome_representante);
    for (const p of dados.perfis) if (p.codigo_representante && !nomeRep.has(repDe(p.codigo_representante))) nomeRep.set(repDe(p.codigo_representante), p.nome);
    const nome = (k) => (k === SEM_REPRESENTANTE ? "Sem representante" : nomeRep.get(k) || `Representante ${k}`);

    // Uma linha por cliente da carteira (código só com dígitos; código com letra fica com o próprio texto).
    const clientes = new Map();
    const idParaCodigo = new Map();
    for (const c of dados.clientes) {
      const k = /^\d+$/.test(String(c.codigo_cliente || "").trim()) ? codigoNormal(c.codigo_cliente) : String(c.codigo_cliente || "").trim();
      if (!k) continue;
      idParaCodigo.set(c.id, k);
      if (!clientes.has(k)) clientes.set(k, { codigo: k, cliente: c.cliente, rep: repDe(c.codigo_representante), dias: new Set(), compras: [], valor: 0 });
    }
    for (const v of dados.rotas) { const k = idParaCodigo.get(v.cliente_id); const d = String(v.visitado_em).slice(0, 10); if (k && entre(d, inicio, fim)) clientes.get(k).dias.add(d); }
    for (const v of dados.cigam) { const c = clientes.get(codigoNormal(v.codigo_cliente)); if (c) for (const x of v.visitas_12m || []) if (entre(x.data, inicio, fim)) c.dias.add(x.data); }
    for (const x of dados.notas) { const c = clientes.get(codigoNormal(x.codigo_cliente)); const d = String(x.data_movimento || "").slice(0, 10); if (c && entre(d, inicio, fim)) { c.valor += n(x.valor_liquido); c.compras.push(d); } }
    for (const x of dados.devolucoes) { const c = clientes.get(codigoNormal(x.codigo_cliente)); const d = String(x.data_movimento || "").slice(0, 10); if (c && entre(d, inicio, fim)) c.valor -= n(x.valor_liquido); }

    const linhas = [...clientes.values()].filter((c) => !representante || c.rep === representante).map((c) => {
      const dias = [...c.dias].sort();
      const compras = c.compras.sort();
      const primeira = dias[0];
      return {
        ...c, representante: nome(c.rep), visitas: dias.length, ultimaVisita: dias[dias.length - 1] || null, ultimaCompra: compras[compras.length - 1] || null,
        visitado: dias.length > 0, comprou: c.valor > 0, comprouDepois: !!primeira && compras.some((d) => d >= primeira),
      };
    });
    const porRep = new Map();
    for (const c of linhas) {
      const a = porRep.get(c.rep) || { chave: c.rep, nome: c.representante, carteira: 0, visitados: 0, visitas: 0, compraram: 0, convertidos: 0, valor: 0, valorVisitados: 0, parados: 0, clientes: [] };
      a.carteira++; a.clientes.push(c);
      if (c.visitado) { a.visitados++; a.visitas += c.visitas; a.valorVisitados += Math.max(0, c.valor); }
      if (c.comprou) a.compraram++;
      if (c.comprouDepois) a.convertidos++;
      if (!c.visitado && !c.comprou) a.parados++;
      a.valor += c.valor;
      porRep.set(c.rep, a);
    }
    const reps = [...porRep.values()].map((a) => ({
      ...a, cobertura: a.carteira ? a.visitados / a.carteira : null, conversao: a.visitados ? a.convertidos / a.visitados : null,
      porVisita: a.visitas ? a.valorVisitados / a.visitas : null,
    })).sort((a, b) => b.valor - a.valor);
    const tot = (campo) => reps.reduce((s, a) => s + a[campo], 0);
    return { linhas, reps, tot, nomeRep };
  }, [dados, inicio, fim, representante]);

  const representantes = useMemo(() => (r ? [...r.nomeRep.entries()].sort((a, b) => String(a[1]).localeCompare(String(b[1]))) : []), [r]);
  const sub = `${dataBR(inicio)} a ${dataBR(fim)}`;
  const lista = (titulo, f) => abrir(titulo, COL_CLI, r.linhas.filter(f).sort((a, b) => b.valor - a.valor), sub);

  return (
    <section className="painel bi-painel">
      <CabecalhoBI titulo="Desempenho comercial" descricao="Visitas × compras da carteira de cada representante."
        periodo={periodo} representantes={representantes} representante={representante} setRepresentante={setRepresentante}
        ajuda="Visita = rota marcada como visitado ou acompanhamento VISITA / VISITA TÉCNICA (mesmo dia conta uma vez). Representante = o do cadastro do cliente. Clique para ver os clientes." />
      {erro && <div className="bi-aviso">{erro}</div>}
      {!r ? <p className="bi-vazio">Carregando...</p> : <>
        <div className="bi-kpis">
          <StatTile label={`Carteira visitada (${r.tot("visitados")} de ${r.tot("carteira")})`} valor={pct(r.tot("carteira") ? r.tot("visitados") / r.tot("carteira") : null)} destaque
            onClick={() => lista("Clientes visitados no período", (c) => c.visitado)} />
          <StatTile label={`Visitados que compraram depois (${r.tot("convertidos")})`} valor={pct(r.tot("visitados") ? r.tot("convertidos") / r.tot("visitados") : null)}
            onClick={() => lista("Visitados que compraram depois da visita", (c) => c.comprouDepois)} />
          <StatTile label={`Faturado por visita (${r.tot("visitas")} visitas)`} valor={r.tot("visitas") ? moedaCurta(r.tot("valorVisitados") / r.tot("visitas")) : "—"}
            onClick={() => lista("Clientes visitados no período", (c) => c.visitado)} />
          <StatTile label={`Carteira parada (${r.tot("parados")})`} valor={pct(r.tot("carteira") ? r.tot("parados") / r.tot("carteira") : null)}
            onClick={() => lista("Sem visita e sem compra no período", (c) => !c.visitado && !c.comprou)} />
        </div>
        <div className="bi-kpis">
          <StatTile label="Visitados e não compraram" valor={String(r.linhas.filter((c) => c.visitado && !c.comprouDepois).length)}
            onClick={() => lista("Visitados que não compraram depois da visita", (c) => c.visitado && !c.comprouDepois)} />
          <StatTile label="Compraram sem visita no período" valor={String(r.linhas.filter((c) => !c.visitado && c.comprou).length)}
            onClick={() => lista("Compraram sem visita no período", (c) => !c.visitado && c.comprou)} />
          <StatTile label="Faturado líquido da carteira" valor={moeda(r.tot("valor"))} onClick={() => lista("Clientes que compraram no período", (c) => c.comprou)} />
        </div>

        <TabelaBI titulo="Por representante (clique na linha para ver os clientes)" linhas={r.reps}
          aoClicar={(l) => abrir(`Carteira · ${l.nome}`, COL_CLI, [...l.clientes].sort((a, b) => b.valor - a.valor), sub)}
          colunas={[
            { chave: "nome", rotulo: "Representante" }, { chave: "carteira", rotulo: "Clientes", num: true },
            { chave: "cobertura", rotulo: "% visitada", num: true, formatar: pct }, { chave: "visitas", rotulo: "Visitas", num: true },
            { chave: "conversao", rotulo: "Visitados que compraram", num: true, formatar: pct },
            { chave: "porVisita", rotulo: "Faturado por visita", num: true, formatar: (v) => (v === null ? "—" : moedaCurta(v)) },
            { chave: "parados", rotulo: "Parados", num: true }, { chave: "valor", rotulo: "Faturado líquido", num: true, formatar: moedaCurta },
          ]}
          nota="Faturado por visita = faturado dos clientes visitados ÷ número de visitas. Parados = sem visita e sem compra no período." />
        <div className="bi-graficos-grid">
          <BarChart titulo="% da carteira visitada" corPadrao={CATEGORICAL.vendas} formatarValor={(v) => `${v.toLocaleString("pt-BR")}%`}
            itens={r.reps.filter((a) => a.carteira).map((a) => ({ chave: a.chave, rotulo: a.nome, valor: Math.round((a.cobertura || 0) * 1000) / 10 }))}
            onSelecionarItem={(i) => lista(`Visitados · ${r.reps.find((a) => a.chave === i.chave).nome}`, (c) => c.rep === i.chave && c.visitado)} />
          <BarChart titulo="Faturado por visita" corPadrao={CATEGORICAL.comissao} formatarValor={moedaCurta}
            itens={r.reps.filter((a) => a.porVisita).map((a) => ({ chave: a.chave, rotulo: a.nome, valor: Math.round(a.porVisita) }))}
            onSelecionarItem={(i) => lista(`Visitados · ${r.reps.find((a) => a.chave === i.chave).nome}`, (c) => c.rep === i.chave && c.visitado)} />
        </div>
      </>}
      {janela}
    </section>
  );
}
