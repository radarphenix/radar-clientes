import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "../supabaseClient";
import { chamarAcompanhamentosCigam } from "../lib/cigamAcompanhamentos.js";
import StatTile from "./StatTile.jsx";
import BarChart from "./BarChart.jsx";
import { CATEGORICAL } from "./paletteBI.js";

// Análise da carteira no BI Faturamento (pedido do usuário, 25/11/2026):
// - concentração (curva ABC): quantos clientes fazem 80% do faturado e quanto pesam os maiores;
// - ganhos e perdidos: quem comprou no período e não no anterior (e vice-versa);
// - faturado por família (grupo de material = 3 primeiros dígitos do código);
// - mapa e ranking por estado/país.
// Tudo no faturado líquido do período filtrado (notas - devoluções), com os mesmos filtros do painel.
// Todo número abre o detalhe (DetalheBI) com as linhas que o compõem.

const n = (v) => Number(v || 0);
const moeda = (v) => n(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const pct = (v) => `${(v * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
const codigoNormal = (v) => String(v ?? "").trim().replace(/^0+(?=.)/, "");
const entre = (d, a, b) => d && d >= a && d <= b;
const dataBR = (v) => (v ? String(v).slice(0, 10).split("-").reverse().join("/") : "");

const COL_ABC = [
  { chave: "posicao", rotulo: "#", tipo: "numero" },
  { chave: "cliente", rotulo: "Cliente", tipo: "texto" },
  { chave: "valor", rotulo: "Faturado líquido", tipo: "moeda" },
  { chave: "participacao", rotulo: "% do total", tipo: "texto" },
  { chave: "acumulado", rotulo: "% acumulado", tipo: "texto" },
  { chave: "classe", rotulo: "Classe", tipo: "texto" },
];
const COL_MOV = [
  { chave: "cliente", rotulo: "Cliente", tipo: "texto" },
  { chave: "anterior", rotulo: "Período anterior", tipo: "moeda" },
  { chave: "valor", rotulo: "Período atual", tipo: "moeda" },
  { chave: "diferenca", rotulo: "Diferença", tipo: "moeda" },
];
const COL_UF = [
  { chave: "cliente", rotulo: "Cliente", tipo: "texto" },
  { chave: "local", rotulo: "Cidade/UF", tipo: "texto" },
  { chave: "valor", rotulo: "Faturado líquido", tipo: "moeda" },
];

// Mapa de bolhas: cada cliente é um círculo do tamanho do faturado.
function MapaFaturamento({ pontos, aoClicar }) {
  const clique = useRef(aoClicar);
  clique.current = aoClicar;
  const caixa = useRef(null);
  const mapa = useRef(null);
  const camada = useRef(null);
  useEffect(() => {
    if (!caixa.current || mapa.current) return undefined;
    mapa.current = L.map(caixa.current, { scrollWheelZoom: false, preferCanvas: true }).setView([-15, -52], 4);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(mapa.current);
    camada.current = L.layerGroup().addTo(mapa.current);
    return () => { mapa.current?.remove(); mapa.current = null; };
  }, []);
  useEffect(() => {
    if (!camada.current) return;
    camada.current.clearLayers();
    const max = Math.max(1, ...pontos.map((p) => p.valor));
    for (const p of [...pontos].sort((a, b) => b.valor - a.valor)) {
      const m = L.circleMarker([p.lat, p.lng], {
        radius: 5 + Math.sqrt(p.valor / max) * 22, color: "#fff", weight: 1, fillColor: CATEGORICAL.vendas, fillOpacity: 0.55,
      });
      m.bindTooltip(`${p.cliente}<br>${moeda(p.valor)}`, { direction: "top" });
      m.on("click", () => clique.current(p));
      m.addTo(camada.current);
    }
    if (pontos.length) mapa.current.fitBounds(pontos.map((p) => [p.lat, p.lng]), { padding: [24, 24], maxZoom: 7 });
  }, [pontos]);
  return <div ref={caixa} className="bi-mapa" role="region" aria-label="Mapa do faturamento" />;
}

export default function AnaliseCarteiraBI({ noPeriodo, dvPeriodo, notasF, devolucoesF, periodos, abrir, abrirNotas }) {
  const [cadastro, setCadastro] = useState(new Map());
  const [grupos, setGrupos] = useState({});

  useEffect(() => {
    let vivo = true;
    // Coordenada vem de clientes_geolocalizacao (geocodificação e localização manual do exterior), como nas outras telas.
    Promise.all([
      supabase.from("clientes").select("codigo_cliente, cliente, cidade, uf").range(0, 9999),
      supabase.from("clientes_geolocalizacao").select("codigo_cliente, latitude, longitude").not("latitude", "is", null).range(0, 9999),
    ]).then(([cl, geo]) => {
      if (!vivo) return;
      const pos = new Map((geo.data || []).map((g) => [codigoNormal(g.codigo_cliente), g]));
      setCadastro(new Map((cl.data || []).map((c) => { const k = codigoNormal(c.codigo_cliente); return [k, { ...c, latitude: pos.get(k)?.latitude, longitude: pos.get(k)?.longitude }]; })));
    });
    chamarAcompanhamentosCigam({ bi: "grupos" }).then((r) => r.json()).then((j) => vivo && setGrupos(j?.grupos || {})).catch(() => {});
    return () => { vivo = false; };
  }, []);

  const nome = (codigo, x) => x?.nome_cliente || cadastro.get(codigoNormal(codigo))?.cliente || codigo;

  // Faturado líquido por cliente num intervalo.
  const porCliente = (no, dv) => {
    const m = new Map();
    for (const x of no) { const k = codigoNormal(x.codigo_cliente); const a = m.get(k) || { codigo: k, cliente: nome(x.codigo_cliente, x), valor: 0 }; a.valor += n(x.valor_liquido); m.set(k, a); }
    for (const x of dv) { const k = codigoNormal(x.codigo_cliente); const a = m.get(k) || { codigo: k, cliente: nome(x.codigo_cliente, x), valor: 0 }; a.valor -= n(x.valor_liquido); m.set(k, a); }
    return m;
  };
  const doCliente = (k) => (x) => codigoNormal(x.codigo_cliente) === k;

  // ---------------------------------------------------------------- Concentração (ABC)
  const abc = useMemo(() => {
    const lista = [...porCliente(noPeriodo, dvPeriodo).values()].filter((x) => x.valor > 0).sort((a, b) => b.valor - a.valor);
    const total = lista.reduce((s, x) => s + x.valor, 0);
    let acc = 0;
    const linhas = lista.map((x, i) => {
      const antes = acc; acc += x.valor;
      const classe = antes / total < 0.8 ? "A" : antes / total < 0.95 ? "B" : "C";
      return { ...x, posicao: i + 1, participacao: pct(x.valor / total), acumulado: pct(acc / total), classe };
    });
    const top5 = lista.slice(0, 5).reduce((s, x) => s + x.valor, 0);
    return { linhas, total, a: linhas.filter((x) => x.classe === "A"), top5: total ? top5 / total : 0, maior: linhas[0] };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noPeriodo, dvPeriodo, cadastro]);

  // ---------------------------------------------------------------- Ganhos e perdidos
  const mov = useMemo(() => {
    if (!periodos) return null;
    const [a0, a1] = periodos.anterior;
    const atual = porCliente(noPeriodo, dvPeriodo);
    const ant = porCliente(notasF.filter((x) => entre(x.data_movimento, a0, a1)), devolucoesF.filter((x) => entre(x.data_movimento, a0, a1)));
    const linha = (k) => { const v = atual.get(k)?.valor || 0, p = ant.get(k)?.valor || 0; return { codigo: k, cliente: atual.get(k)?.cliente || ant.get(k)?.cliente || k, anterior: p, valor: v, diferenca: v - p }; };
    const chaves = new Set([...atual.keys(), ...ant.keys()]);
    const todas = [...chaves].map(linha);
    return {
      ganhos: todas.filter((x) => x.valor > 0 && x.anterior <= 0).sort((a, b) => b.valor - a.valor),
      perdidos: todas.filter((x) => x.anterior > 0 && x.valor <= 0).sort((a, b) => b.anterior - a.anterior),
      cresceram: todas.filter((x) => x.valor > 0 && x.anterior > 0 && x.diferenca > 0).sort((a, b) => b.diferenca - a.diferenca),
      cairam: todas.filter((x) => x.valor > 0 && x.anterior > 0 && x.diferenca < 0).sort((a, b) => a.diferenca - b.diferenca),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodos, noPeriodo, dvPeriodo, notasF, devolucoesF, cadastro]);
  const somaV = (l, c = "valor") => l.reduce((s, x) => s + x[c], 0);

  // ---------------------------------------------------------------- Família de produto
  const grupoDe = (x) => String(x.codigo_material || "").trim().slice(0, 3) || "—";
  const familias = useMemo(() => {
    const m = new Map();
    const add = (x, sinal) => { const k = grupoDe(x); const a = m.get(k) || { chave: k, rotulo: grupos[k] ? grupos[k].charAt(0) + grupos[k].slice(1).toLowerCase() : `Grupo ${k}`, valor: 0 }; a.valor += sinal * n(x.valor_liquido); m.set(k, a); };
    noPeriodo.forEach((x) => add(x, 1)); dvPeriodo.forEach((x) => add(x, -1));
    return [...m.values()].filter((x) => x.valor > 0).sort((a, b) => b.valor - a.valor);
  }, [noPeriodo, dvPeriodo, grupos]);

  // ---------------------------------------------------------------- Estado/país e mapa
  const regiao = useMemo(() => {
    const uf = new Map(); const pontos = [];
    for (const x of abc.linhas) {
      const c = cadastro.get(x.codigo);
      const k = String(c?.uf || "").trim().toUpperCase() || "Sem UF";
      const r = uf.get(k) || { chave: k, rotulo: k === "EX" ? "Exterior" : k, valor: 0, clientes: [] };
      r.valor += x.valor; r.clientes.push({ ...x, local: c ? `${c.cidade || "-"}/${c.uf || ""}` : "" }); uf.set(k, r);
      if (Number(c?.latitude) && Number(c?.longitude)) pontos.push({ ...x, lat: Number(c.latitude), lng: Number(c.longitude) });
    }
    return { ufs: [...uf.values()].sort((a, b) => b.valor - a.valor), pontos };
  }, [abc, cadastro]);

  const abrirClientes = (titulo, linhas, colunas = COL_MOV) => abrir(titulo, colunas, linhas.map((x) => ({ ...x, id: x.codigo })));
  const notasDoCliente = (p) => abrirNotas(`Faturado líquido · ${p.cliente}`, noPeriodo.filter(doCliente(p.codigo)), dvPeriodo.filter(doCliente(p.codigo)));

  if (!abc.linhas.length) return null;
  return (
    <>
      <h3 className="bi-secao-titulo">Análise da carteira</h3>

      <h4 className="bi-subtitulo">Concentração · curva ABC do faturado líquido no período</h4>
      <div className="bi-kpis">
        <StatTile label={`Clientes que fazem 80% (classe A)`} valor={`${abc.a.length} de ${abc.linhas.length}`}
          onClick={() => abrirClientes("Classe A · clientes que fazem 80% do faturado", abc.a, COL_ABC)} />
        <StatTile label="Peso dos 5 maiores" valor={pct(abc.top5)} onClick={() => abrirClientes("5 maiores clientes", abc.linhas.slice(0, 5), COL_ABC)} />
        <StatTile label={`Maior cliente · ${abc.maior.cliente}`} valor={pct(abc.maior.valor / abc.total)} onClick={() => notasDoCliente(abc.maior)} />
        <StatTile label="Curva completa (A, B e C)" valor={`${abc.linhas.length} clientes`} onClick={() => abrirClientes("Curva ABC completa", abc.linhas, COL_ABC)} />
      </div>

      {mov && <>
        <h4 className="bi-subtitulo">Ganhos e perdidos · {dataBR(periodos.atual[0])} a {dataBR(periodos.atual[1])} comparado a {dataBR(periodos.anterior[0])} a {dataBR(periodos.anterior[1])}</h4>
        <div className="bi-kpis">
          <StatTile label={`Novos ou recuperados (${mov.ganhos.length})`} valor={moeda(somaV(mov.ganhos))} onClick={() => abrirClientes("Compraram agora e não no período anterior", mov.ganhos)} />
          <StatTile label={`Não compraram neste período (${mov.perdidos.length})`} valor={moeda(somaV(mov.perdidos, "anterior"))} onClick={() => abrirClientes("Compraram no período anterior e não agora", mov.perdidos)} />
          <StatTile label={`Compraram mais (${mov.cresceram.length})`} valor={`+ ${moeda(somaV(mov.cresceram, "diferenca"))}`} onClick={() => abrirClientes("Compraram mais que no período anterior", mov.cresceram)} />
          <StatTile label={`Compraram menos (${mov.cairam.length})`} valor={`− ${moeda(Math.abs(somaV(mov.cairam, "diferenca")))}`} onClick={() => abrirClientes("Compraram menos que no período anterior", mov.cairam)} />
        </div>
      </>}

      <div className="bi-graficos-grid">
        <BarChart titulo="Faturado líquido por família de produto" itens={familias.slice(0, 12)} corPadrao={CATEGORICAL.vendas} formatarValor={moeda}
          onSelecionarItem={(item) => abrirNotas(`Família · ${item.rotulo}`, noPeriodo.filter((x) => grupoDe(x) === item.chave), dvPeriodo.filter((x) => grupoDe(x) === item.chave))} />
        <BarChart titulo="Faturado líquido por estado / exterior" itens={regiao.ufs.slice(0, 12)} corPadrao={CATEGORICAL.comissao} formatarValor={moeda}
          onSelecionarItem={(item) => abrirClientes(`Clientes · ${item.rotulo}`, regiao.ufs.find((u) => u.chave === item.chave)?.clientes || [], COL_UF)} />
      </div>

      <section className="bi-mapa-bloco">
        <h4 className="bi-subtitulo">Mapa do faturamento · cada círculo é um cliente, do tamanho do que faturou (clique para ver as notas)</h4>
        <MapaFaturamento pontos={regiao.pontos} aoClicar={notasDoCliente} />
        {abc.linhas.length > regiao.pontos.length && <p className="bi-comparativo">{abc.linhas.length - regiao.pontos.length} cliente(s) sem localização não aparecem no mapa.</p>}
      </section>
    </>
  );
}
