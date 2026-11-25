import { useCallback, useEffect, useMemo, useState } from "react";
import { Printer, RefreshCw } from "lucide-react";
import StatTile from "./bi/StatTile.jsx";
import BarChart from "./bi/BarChart.jsx";
import DetalheBI from "./bi/DetalheBI.jsx";
import { CATEGORICAL } from "./bi/paletteBI.js";
import { chamarAcompanhamentosCigam } from "./lib/cigamAcompanhamentos.js";
import "./bi-panel.css";

// Painel BI · Pagamentos (24/11/2026): contas a pagar e fluxo de caixa projetado, ao vivo do CIGAM
// pela função cigam-acompanhamentos?bi=financeiro (somente leitura, permissão bi_pagamentos).
// Regras do CIGAM: pagar em aberto = Tipo P; pago = Tipo d (o CIGAM troca P -> d na liquidação);
// receber em aberto = Tipo R (entradas do fluxo). Lançamentos com "previsão" (ex.: histórico P60
// "previsão para fluxo de caixa") entram só no fluxo, e podem ser escondidos.

const pad = (v) => String(v).padStart(2, "0");
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const deIso = (v) => new Date(`${v}T12:00:00`);
const hoje = () => iso(new Date());
const fimDoMes = (a, m) => iso(new Date(a, m + 1, 0));
const n = (v) => Number(v || 0);
const moeda = (v) => n(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dataBR = (v) => (v ? deIso(v).toLocaleDateString("pt-BR") : "—");
const soma = (l, fn) => l.reduce((t, x) => t + fn(x), 0);
const diasEntre = (a, b) => Math.round((deIso(b) - deIso(a)) / 86400000);
const somarDias = (v, q) => { const d = deIso(v); d.setDate(d.getDate() + q); return iso(d); };
const entre = (d, a, b) => d && d >= a && d <= b;

function atalho(tipo) {
  const d = new Date();
  const a = d.getFullYear();
  const m = d.getMonth();
  if (tipo === "mes") return [iso(new Date(a, m, 1)), fimDoMes(a, m)];
  if (tipo === "mesAnterior") return [iso(new Date(a, m - 1, 1)), fimDoMes(a, m - 1)];
  if (tipo === "proximoMes") return [iso(new Date(a, m + 1, 1)), fimDoMes(a, m + 1)];
  if (tipo === "trimestre") { const t = Math.floor(m / 3) * 3; return [iso(new Date(a, t, 1)), fimDoMes(a, t + 2)]; }
  return [`${a}-01-01`, `${a}-12-31`];
}
const ATALHOS = [["mes", "Mês atual"], ["mesAnterior", "Mês anterior"], ["proximoMes", "Próximo mês"], ["trimestre", "Trimestre"], ["ano", "Ano"]];
const SEMANAS_FLUXO = 12;

function agruparTop(lista, chaveDe, rotuloDe, valorDe, limite = 10) {
  const mapa = new Map();
  lista.forEach((x) => {
    const k = chaveDe(x);
    const a = mapa.get(k) || { chave: k, rotulo: rotuloDe(x), valor: 0 };
    a.valor += valorDe(x);
    mapa.set(k, a);
  });
  return [...mapa.values()].filter((x) => x.valor > 0).sort((a, b) => b.valor - a.valor).slice(0, limite);
}

const COLUNAS = [
  { chave: "vencimento", rotulo: "Vencimento", tipo: "data" }, { chave: "pagamento", rotulo: "Pagamento", tipo: "data" },
  { chave: "fornecedor", rotulo: "Fornecedor" }, { chave: "historico", rotulo: "Histórico" }, { chave: "conta", rotulo: "Conta" },
  { chave: "documento", rotulo: "Documento" }, { chave: "valor", rotulo: "Valor", tipo: "moeda" },
  { chave: "saldo", rotulo: "Em aberto", tipo: "moeda" }, { chave: "atraso", rotulo: "Dias de atraso", tipo: "numero" },
];

export default function PainelBIPagamentos() {
  const [[inicio, fim], setPeriodo] = useState(() => atalho("mes"));
  const [busca, setBusca] = useState("");
  const [comPrevisoes, setComPrevisoes] = useState(true);
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState("");
  const [tentativa, setTentativa] = useState(0);
  const [detalhe, setDetalhe] = useState(null);
  const fecharDetalhe = useCallback(() => setDetalhe(null), []);

  useEffect(() => {
    let vivo = true;
    chamarAcompanhamentosCigam({ bi: "financeiro" })
      .then(async (r) => {
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error || `Erro ${r.status}`);
        if (vivo) { setDados(j); setErro(""); }
      })
      .catch((e) => vivo && setErro(e.message || "Falha na consulta."));
    return () => { vivo = false; };
  }, [tentativa]);

  const ref = hoje();
  const termo = busca.trim().toLowerCase();
  const casa = useCallback((x) => !termo || `${x.empresa} ${x.nome} ${x.historico_desc} ${x.conta_desc}`.toLowerCase().includes(termo), [termo]);
  const todos = useMemo(() => (dados?.lancamentos || []).filter((x) => comPrevisoes || !x.previsao), [dados, comPrevisoes]);
  const pagar = useMemo(() => todos.filter((x) => (x.tipo === "P" || x.tipo === "d") && casa(x)), [todos, casa]);
  const abertos = pagar.filter((x) => x.tipo === "P" && x.saldo > 0);
  const pagos = pagar.filter((x) => x.tipo === "d");
  const receberAbertos = todos.filter((x) => x.tipo === "R" && x.saldo > 0);

  const doPeriodo = pagar.filter((x) => entre(x.vencimento, inicio, fim));
  const pagoNoPeriodo = pagos.filter((x) => entre(x.pagamento, inicio, fim));
  const vencidos = abertos.filter((x) => x.vencimento && x.vencimento < ref);
  const prox30 = abertos.filter((x) => entre(x.vencimento, ref, somarDias(ref, 30)));

  // Pontualidade dos pagamentos feitos no período.
  const pontualidade = pagoNoPeriodo.reduce((a, x) => {
    if (!x.vencimento || !x.pagamento) return a;
    const d = diasEntre(x.vencimento, x.pagamento);
    a.total += 1; if (d <= 0) a.emDia += 1; else { a.atrasados += 1; a.somaAtraso += d; }
    return a;
  }, { total: 0, emDia: 0, atrasados: 0, somaAtraso: 0 });

  // Fluxo de caixa projetado em semanas fechadas (segunda a domingo), começando pela semana atual.
  // Vencidos (antes de hoje) aparecem à parte, então a semana atual só soma de hoje em diante.
  const fluxo = (() => {
    const segunda = somarDias(ref, -((new Date(`${ref}T12:00:00`).getDay() + 6) % 7));
    const semanas = Array.from({ length: SEMANAS_FLUXO }, (_, i) => {
      const de = somarDias(segunda, i * 7);
      const ate = somarDias(segunda, i * 7 + 6);
      const desde = de < ref ? ref : de;
      return {
        de, ate, desde,
        entradas: soma(receberAbertos.filter((x) => entre(x.vencimento, desde, ate)), (x) => x.saldo),
        saidas: soma(abertos.filter((x) => entre(x.vencimento, desde, ate)), (x) => x.saldo),
      };
    });
    let acumulado = 0;
    return semanas.map((s) => { acumulado += s.entradas - s.saidas; return { ...s, saldo: s.entradas - s.saidas, acumulado }; });
  })();
  const atrasadoReceber = soma(receberAbertos.filter((x) => x.vencimento && x.vencimento < ref), (x) => x.saldo);
  const atrasadoPagar = soma(vencidos, (x) => x.saldo);
  const maxFluxo = Math.max(1, ...fluxo.map((s) => Math.max(s.entradas, s.saidas)));

  const linhas = (lista) => lista.map((x) => ({
    id: x.id, vencimento: x.vencimento, pagamento: x.pagamento, fornecedor: x.nome,
    historico: x.historico_desc + (x.previsao ? " (previsão)" : ""), conta: x.conta_desc,
    documento: [x.nf ? `NF ${x.nf}` : "", x.documento || "", x.obs || ""].filter(Boolean).join(" · ") || "—",
    valor: x.valor, saldo: x.tipo === "P" ? x.saldo : 0,
    atraso: x.tipo === "P" && x.saldo > 0 && x.vencimento && x.vencimento < ref ? diasEntre(x.vencimento, ref) : 0,
  })).sort((a, b) => String(a.vencimento).localeCompare(String(b.vencimento)));
  const abrir = (titulo, lista, campoTotal = "valor", subtitulo = `${dataBR(inicio)} a ${dataBR(fim)}`) => {
    const l = linhas(lista);
    setDetalhe({ titulo, subtitulo, colunas: COLUNAS, linhas: l, total: soma(l, (x) => n(x[campoTotal])),
      arquivo: `bi_pagamentos_${titulo.normalize("NFD").replace(/[^A-Za-z0-9]+/g, "_").toLowerCase()}_${inicio}` });
  };

  const topFornecedores = agruparTop(abertos, (x) => x.empresa, (x) => x.nome, (x) => x.saldo);
  const topContas = agruparTop([...pagoNoPeriodo, ...abertos.filter((x) => entre(x.vencimento, inicio, fim))],
    (x) => x.conta || "-", (x) => x.conta_desc || "Sem conta", (x) => x.valor);
  const atalhoAtivo = ATALHOS.map(([t]) => t).find((t) => { const [a, b] = atalho(t); return a === inicio && b === fim; });
  const semanaBR = (s) => `${dataBR(s.de).slice(0, 5)} a ${dataBR(s.ate).slice(0, 5)}`;

  return <section className="painel bi-painel">
    <div className="bi-topo">
      <div>
        <span className="bi-sobretitulo">Área executiva</span>
        <h2>Painel BI · Pagamentos</h2>
        <p>Contas a pagar e fluxo de caixa projetado, com dados ao vivo do ERP.</p>
      </div>
      <div className="bi-topo-acoes">
        <button type="button" className="bi-imprimir" onClick={() => { setDados(null); setTentativa((t) => t + 1); }}><RefreshCw size={17} /> Atualizar</button>
        <button type="button" className="bi-imprimir" onClick={() => window.print()}><Printer size={17} /> Imprimir painel</button>
      </div>
    </div>

    <div className="bi-filtros bi-filtros-fat">
      <div className="bi-linha-filtro">
        <span className="bi-linha-rotulo">Período</span>
        <div className="bi-atalhos" role="group" aria-label="Atalhos de período">
          {ATALHOS.map(([t, r]) => <button key={t} type="button" className={atalhoAtivo === t ? "ativo" : ""} onClick={() => setPeriodo(atalho(t))}>{r}</button>)}
        </div>
        <label>De<input type="date" value={inicio} max={fim} onChange={(e) => setPeriodo(([, f]) => [e.target.value, f])} /></label>
        <label>Até<input type="date" value={fim} min={inicio} onChange={(e) => setPeriodo(([i]) => [i, e.target.value])} /></label>
      </div>
      <div className="bi-linha-filtro">
        <span className="bi-linha-rotulo">Recortes</span>
        <label className="bi-campo-cliente">Fornecedor, histórico ou conta
          <input type="search" placeholder="Nome ou código" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </label>
        <label className="bi-check"><input type="checkbox" checked={comPrevisoes} onChange={(e) => setComPrevisoes(e.target.checked)} /> Incluir previsões de fluxo</label>
      </div>
      <span className="bi-ajuda-filtro">
        Clique nos cards, barras e linhas para ver os lançamentos. Dados ao vivo do ERP
        {dados?.gerado_em && <> (consultado às {new Date(dados.gerado_em).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })})</>}.
      </span>
    </div>

    {erro && <div className="bi-aviso">Não foi possível carregar: {erro} <button type="button" className="bi-link" onClick={() => { setErro(""); setTentativa((t) => t + 1); }}>Tentar de novo</button></div>}
    {!dados && !erro ? <p className="bi-vazio">Buscando...</p> : dados && <>
      <h3 className="bi-secao-titulo">Contas a pagar</h3>
      <div className="bi-kpis">
        <StatTile label="A pagar no período (por vencimento)" valor={moeda(soma(doPeriodo, (x) => x.valor))} onClick={() => abrir("A pagar no período", doPeriodo)} />
        <StatTile label="Pago no período" valor={moeda(soma(pagoNoPeriodo, (x) => x.valor))} destaque onClick={() => abrir("Pago no período (pela data do pagamento)", pagoNoPeriodo)} />
        <StatTile label={`Vencido em aberto (${vencidos.length})`} valor={moeda(atrasadoPagar)} onClick={() => abrir("Vencido em aberto", vencidos, "saldo", `Posição em ${dataBR(ref)}`)} />
        <StatTile label="Vence nos próximos 30 dias" valor={moeda(soma(prox30, (x) => x.saldo))} onClick={() => abrir("Vence nos próximos 30 dias", prox30, "saldo", `${dataBR(ref)} a ${dataBR(somarDias(ref, 30))}`)} />
      </div>
      <p className="bi-comparativo">
        Pagos em dia no período (pela data da baixa no ERP): <strong>{pontualidade.total ? `${Math.round((pontualidade.emDia / pontualidade.total) * 100)}% de ${pontualidade.total}` : "—"}</strong>
        {pontualidade.atrasados > 0 && <>{" · "}atraso médio quando atrasa: <strong>{Math.round(pontualidade.somaAtraso / pontualidade.atrasados)} dias</strong></>}
        {" · "}Total em aberto: <button type="button" className="bi-link" onClick={() => abrir("Todo o contas a pagar em aberto", abertos, "saldo", `Posição em ${dataBR(ref)}`)}>{moeda(soma(abertos, (x) => x.saldo))} em {abertos.length} lançamento(s)</button>
      </p>

      <h3 className="bi-secao-titulo">Fluxo de caixa projetado</h3>
      <div className="bi-chart-card">
        <div className="bi-chart-cabecalho">
          <h3>Próximas {SEMANAS_FLUXO} semanas · a receber × a pagar em aberto</h3>
          <span className="bi-contagem">Fora da conta: vencidos a receber {moeda(atrasadoReceber)} · vencidos a pagar {moeda(atrasadoPagar)}</span>
        </div>
        <div className="bi-tabela-container"><table className="bi-tabela bi-fluxo">
          <thead><tr><th>Semana</th><th>Entradas</th><th>Saídas</th><th className="bi-fluxo-barras" aria-hidden="true"></th><th>Saldo da semana</th><th>Acumulado</th></tr></thead>
          <tbody>{fluxo.map((s) => <tr key={s.de}>
            <td>{semanaBR(s)}</td>
            <td><button type="button" className="bi-link" onClick={() => setDetalhe({ titulo: `A receber · ${semanaBR(s)}`, subtitulo: "Títulos a receber em aberto",
              colunas: COLUNAS.map((c) => (c.chave === "fornecedor" ? { ...c, rotulo: "Cliente" } : c)), linhas: linhas(receberAbertos.filter((x) => entre(x.vencimento, s.desde, s.ate))).map((l) => ({ ...l, saldo: l.valor })),
              total: s.entradas, arquivo: `bi_fluxo_receber_${s.de}` })}>{moeda(s.entradas)}</button></td>
            <td><button type="button" className="bi-link" onClick={() => abrir(`A pagar · ${semanaBR(s)}`, abertos.filter((x) => entre(x.vencimento, s.desde, s.ate)), "saldo", "Contas a pagar em aberto")}>{moeda(s.saidas)}</button></td>
            <td className="bi-fluxo-barras" aria-hidden="true">
              <span className="bi-fluxo-entrada" style={{ width: `${(s.entradas / maxFluxo) * 100}%` }} />
              <span className="bi-fluxo-saida" style={{ width: `${(s.saidas / maxFluxo) * 100}%` }} />
            </td>
            <td className={s.saldo >= 0 ? "bi-delta-bom" : "bi-delta-ruim"}>{moeda(s.saldo)}</td>
            <td className={s.acumulado >= 0 ? "bi-delta-bom" : "bi-delta-ruim"}><strong>{moeda(s.acumulado)}</strong></td>
          </tr>)}</tbody>
        </table></div>
        <p className="bi-comparativo">
          Entradas = títulos a receber em aberto pelo vencimento; saídas = contas a pagar em aberto pelo vencimento
          {comPrevisoes ? ", incluindo as previsões lançadas no ERP" : ", sem as previsões"}. Não considera o saldo bancário atual.
          {" "}Atenção: lançamento pago mas ainda não baixado no ERP aparece como vencido e fica fora da projeção.
        </p>
      </div>

      <div className="bi-graficos-grid">
        <BarChart titulo="Maiores fornecedores · em aberto" itens={topFornecedores} corPadrao={CATEGORICAL.comissao} formatarValor={moeda}
          onSelecionarItem={(item) => abrir(`Em aberto · ${item.rotulo}`, abertos.filter((x) => x.empresa === item.chave), "saldo", `Posição em ${dataBR(ref)}`)} />
        <BarChart titulo="Por conta financeira · pago e a pagar no período" itens={topContas} corPadrao={CATEGORICAL.vendas} formatarValor={moeda}
          onSelecionarItem={(item) => abrir(`Conta · ${item.rotulo}`, [...pagoNoPeriodo, ...abertos.filter((x) => entre(x.vencimento, inicio, fim))].filter((x) => (x.conta || "-") === item.chave))} />
      </div>
    </>}
    {detalhe && <DetalheBI {...detalhe} onFechar={fecharDetalhe} />}
  </section>;
}
