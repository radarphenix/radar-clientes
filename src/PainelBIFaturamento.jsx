import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Printer } from "lucide-react";
import { supabase } from "./supabaseClient";
import StatTile from "./bi/StatTile.jsx";
import LineChart from "./bi/LineChart.jsx";
import { CATEGORICAL } from "./bi/paletteBI.js";
import "./bi-panel.css";

const hoje = () => new Date().toISOString().slice(0, 10);
const inicioMes = () => `${hoje().slice(0, 7)}-01`;
const n = (v) => Number(v || 0);
const moeda = (v) => n(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dataBR = (v) => v ? new Date(`${v}T12:00:00`).toLocaleDateString("pt-BR") : "—";
const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const entre = (d, a, b) => d && d >= a && d <= b;
const soma = (linhas, fn) => linhas.reduce((total, linha) => total + fn(linha), 0);

export default function PainelBIFaturamento({ perfil }) {
  const [inicio, setInicio] = useState(inicioMes);
  const [fim, setFim] = useState(hoje);
  const [pedidos, setPedidos] = useState([]);
  const [notas, setNotas] = useState([]);
  const [financeiro, setFinanceiro] = useState([]);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [abertos, setAbertos] = useState(new Set());
  const ano = inicio.slice(0, 4);

  useEffect(() => {
    let ativo = true;
    async function carregar() {
      setCarregando(true); setErro("");
      const ate = `${ano}-12-31`;
      const [p, no, f] = await Promise.all([
        supabase.from("bi_pedidos_itens").select("*").limit(10000),
        supabase.from("bi_notas_itens").select("*").lte("data_movimento", ate).limit(10000),
        supabase.from("bi_lancamentos_financeiros").select("*").lte("data_vencimento", ate).limit(10000),
      ]);
      if (!ativo) return;
      if (p.error || no.error || f.error) {
        setErro("Não foi possível consultar os dados comerciais e financeiros.");
        setPedidos([]); setNotas([]); setFinanceiro([]);
      } else {
        setPedidos(p.data || []); setNotas(no.data || []); setFinanceiro(f.data || []);
      }
      setCarregando(false);
    }
    carregar();
    return () => { ativo = false; };
  }, [ano]);

  const chavePedido = (x) => [x.codigo_cliente, x.cd_pedido || x.pedido_origem, x.sequencia_item ?? x.sequencia_pedido_origem]
    .map((v) => String(v ?? "").trim()).join(":");
  const notasPorPedido = useMemo(() => notas.reduce((mapa, nota) => {
    if (nota.pedido_origem && nota.sequencia_pedido_origem != null) {
      const chave = chavePedido(nota);
      mapa.set(chave, [...(mapa.get(chave) || []), nota]);
    }
    return mapa;
  }, new Map()), [notas]);
  const previstos = useMemo(() => pedidos.map((pedido) => {
    const faturados = notasPorPedido.get(chavePedido(pedido)) || [];
    const qtdFaturada = soma(faturados, (nota) => n(nota.quantidade));
    return {
      ...pedido,
      valorPrevisto: n(pedido.valor_liquido),
      qtdFaturada,
      valorFaturado: soma(faturados, (nota) => n(nota.valor_liquido)),
      // Regra operacional do CIGAM: controle 50 é o item faturado.
      // A nota vinculada audita o documento, mas não decide a situação do pedido.
      atingido: n(pedido.controle_item) === 50,
    };
  }), [pedidos, notasPorPedido]);
  // 0 = 1: houve nota faturada, porém não existe pedido/item correspondente.
  // A ausência de nota para um pedido é tratada acima como 1 = 0, nunca aqui.
  const notasNaoPrevistas = useMemo(() => notas.filter((nota) => !nota.pedido_origem
    || nota.sequencia_pedido_origem == null
    || !pedidos.some((pedido) => chavePedido(pedido) === chavePedido(nota))), [notas, pedidos]);
  const periodo = useMemo(() => ({
    p: previstos.filter((x) => entre(x.data_previsao, inicio, fim)),
    no: notas.filter((x) => entre(x.data_movimento, inicio, fim)),
    naoPrevistas: notasNaoPrevistas.filter((x) => entre(x.data_movimento, inicio, fim)),
    pc: financeiro.filter((x) => entre(x.data_vencimento, inicio, fim)),
    r: financeiro.filter((x) => n(x.valor_saldo) === 0 && entre(x.data_ultima_liquidacao, inicio, fim)),
  }), [previstos, notas, notasNaoPrevistas, financeiro, inicio, fim]);
  const k = {
    pf: soma(periodo.p, (x) => x.valorPrevisto),
    fat: soma(periodo.no, (x) => n(x.valor_liquido)),
    atingida: soma(periodo.p.filter((x) => x.atingido), (x) => x.valorPrevisto),
    pendente: soma(periodo.p.filter((x) => !x.atingido), (x) => x.valorPrevisto),
    naoPrevisto: soma(periodo.naoPrevistas, (x) => n(x.valor_liquido)),
    pr: soma(periodo.pc, (x) => n(x.valor)),
    rec: soma(periodo.r, (x) => n(x.valor)),
    atr: soma(financeiro.filter((x) => n(x.valor_saldo) > 0 && x.data_vencimento < fim), (x) => n(x.valor_saldo)),
  };
  const anual = useMemo(() => meses.map((rotulo, i) => {
    const mes = `${ano}-${String(i + 1).padStart(2, "0")}`;
    const em = (linhas, campo, fn) => soma(linhas.filter((x) => String(x[campo] || "").startsWith(mes)), fn);
    return {
      rotuloX: rotulo,
      pf: em(previstos, "data_previsao", (x) => x.valorPrevisto),
      fat: em(notas, "data_movimento", (x) => n(x.valor_liquido)),
      pr: em(financeiro, "data_vencimento", (x) => n(x.valor)),
      rec: em(financeiro.filter((x) => n(x.valor_saldo) === 0), "data_ultima_liquidacao", (x) => n(x.valor)),
    };
  }), [ano, previstos, notas, financeiro]);
  const docs = useMemo(() => {
    const mapa = new Map();
    const incluir = (x, tipo) => {
      const chave = tipo === "P" ? `P|${x.codigo_cliente}|${x.cd_pedido}` : `N|${x.nf}|${x.serie}|${x.cd_empresa}`;
      const doc = mapa.get(chave) || { ...x, chave, tipo, itens: [], valor: 0, data: tipo === "P" ? x.data_previsao : x.data_movimento };
      doc.itens.push(x); doc.valor += tipo === "P" ? x.valorPrevisto : n(x.valor_liquido); mapa.set(chave, doc);
    };
    periodo.p.forEach((x) => incluir(x, "P")); periodo.no.forEach((x) => incluir(x, "N"));
    return [...mapa.values()].sort((a, b) => String(b.data).localeCompare(String(a.data)));
  }, [periodo]);
  const selecionarMes = (i) => {
    const mes = `${ano}-${String(i + 1).padStart(2, "0")}`;
    setInicio(`${mes}-01`); setFim(`${mes}-${new Date(Number(ano), i + 1, 0).getDate()}`);
  };
  const alternar = (chave) => setAbertos((atual) => {
    const proximo = new Set(atual); proximo.has(chave) ? proximo.delete(chave) : proximo.add(chave); return proximo;
  });

  if (perfil?.tipo_perfil !== "admin") return null;
  return <section className="painel bi-painel">
    <div className="bi-topo"><div><span className="bi-sobretitulo">Área executiva</span><h2>Painel BI · Comercial e Caixa</h2><p>Previsão comercial, faturamento e caixa em competências distintas.</p></div><button type="button" className="bi-imprimir" onClick={() => window.print()}><Printer size={17} /> Imprimir painel</button></div>
    <div className="bi-filtros"><label>De<input type="date" value={inicio} max={fim} onChange={(e) => setInicio(e.target.value)} /></label><label>Até<input type="date" value={fim} min={inicio} onChange={(e) => setFim(e.target.value)} /></label><span className="bi-ajuda-filtro">Clique em um mês do gráfico para detalhar o período.</span></div>
    {erro && <div className="bi-aviso">{erro}</div>}
    {carregando ? <p className="bi-vazio">Carregando...</p> : <>
      <h3 className="bi-secao-titulo">Comercial</h3><div className="bi-kpis"><StatTile label="Previsão de faturamento" valor={moeda(k.pf)} /><StatTile label="Total faturado" valor={moeda(k.fat)} destaque /><StatTile label="Previsão atingida (1 = 1)" valor={moeda(k.atingida)} /><StatTile label="Previsão pendente (1 = 0)" valor={moeda(k.pendente)} /><StatTile label="Faturado não previsto (0 = 1)" valor={moeda(k.naoPrevisto)} /></div>
      <h3 className="bi-secao-titulo">Caixa</h3><div className="bi-kpis"><StatTile label="Previsão de recebimento" valor={moeda(k.pr)} /><StatTile label="Recebido" valor={moeda(k.rec)} destaque /><StatTile label="Em atraso até o fim" valor={moeda(k.atr)} /></div>
      <div className="bi-graficos-grid"><LineChart titulo={`Comercial anual ${ano} · previsão × faturado`} onSelecionarPonto={selecionarMes} series={[{ nome: "Previsão", cor: CATEGORICAL.comissao, pontos: anual.map((x) => ({ rotuloX: x.rotuloX, valor: x.pf })) }, { nome: "Faturado", cor: CATEGORICAL.vendas, pontos: anual.map((x) => ({ rotuloX: x.rotuloX, valor: x.fat })) }]} formatarValor={moeda} /><LineChart titulo={`Caixa anual ${ano} · previsto × recebido`} onSelecionarPonto={selecionarMes} series={[{ nome: "Previsto", cor: "#eb6834", pontos: anual.map((x) => ({ rotuloX: x.rotuloX, valor: x.pr })) }, { nome: "Recebido", cor: "#15803d", pontos: anual.map((x) => ({ rotuloX: x.rotuloX, valor: x.rec })) }]} formatarValor={moeda} /></div>
      <div className="bi-chart-card bi-detalhe-faturamento"><div className="bi-chart-cabecalho"><h3>Pedidos e notas do período</h3><span>{docs.length} documento(s)</span></div>{docs.map((d) => <div className="bi-documento" key={d.chave}><button type="button" className="bi-documento-resumo" onClick={() => alternar(d.chave)}>{abertos.has(d.chave) ? <ChevronDown size={17} /> : <ChevronRight size={17} />}<span><strong>{dataBR(d.data)} · {d.tipo === "P" ? `Pedido ${d.cd_pedido}` : `Nota ${d.nf}`}</strong><small>{d.nome_cliente || d.codigo_cliente || d.cd_empresa}</small></span><em className={d.tipo === "P" ? (d.itens.every((x) => x.atingido) ? "bi-selo-faturado" : "bi-selo-previsto") : "bi-selo-faturado"}>{d.tipo === "P" ? (d.itens.every((x) => x.atingido) ? "Atingido" : "Previsão") : (d.pedido_origem ? "Faturado" : "Não previsto")}</em><b>{moeda(d.valor)}</b></button>{abertos.has(d.chave) && <div className="bi-documento-expansao"><div className="bi-tabela-container"><table className="bi-tabela"><thead><tr><th>Item</th><th>Qtd.</th><th>Valor</th><th>Situação</th></tr></thead><tbody>{d.itens.map((x) => <tr key={x.id}><td>{x.codigo_material} · {x.descricao_item}</td><td>{n(x.quantidade).toLocaleString("pt-BR")}</td><td>{moeda(d.tipo === "P" ? x.valorPrevisto : x.valor_liquido)}</td><td>{d.tipo === "P" ? (x.atingido ? "Faturada (controle 50)" : `Pendente (controle ${x.controle_item ?? "—"})`) : (x.pedido_origem ? `Pedido ${x.pedido_origem}` : "Faturado sem pedido")}</td></tr>)}</tbody></table></div></div>}</div>)}</div>
    </>}
  </section>;
}
