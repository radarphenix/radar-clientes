import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";
import { chamarAcompanhamentosCigam } from "./lib/cigamAcompanhamentos.js";
import StatTile from "./bi/StatTile.jsx";
import BarChart from "./bi/BarChart.jsx";
import { buscarTodas } from "./bi/buscarTodas.js";
import { CATEGORICAL } from "./bi/paletteBI.js";
import {
  CabecalhoBI, CONTROLES, ETAPAS, SEM_REPRESENTANTE, TabelaBI, chaveItemPedido, chaveOrigemNota, dataBR, diasEntre, entre,
  etapaDoControle, grupoDe, hoje, media, mediana, moeda, n, nomeGrupo, pct, useDetalheBI, usePeriodoBI,
} from "./bi/baseBI.jsx";
import "./bi-panel.css";

// Painel BI · Funil e entregas (pedido do usuário, 25/11/2026). Três perguntas:
// 1. Funil: dos pedidos lançados no período (data do pedido), quanto virou venda e quanto segue em aberto.
//    O CIGAM guarda só o controle ATUAL do item (não há tempo por etapa) e nenhum item com controle
//    85-95 chega ao Supabase (a confirmar no Oracle), então a conversão é venda ÷ lançado. Tempo pedido → nota ficou de fora: a maioria
//    dos pedidos é digitada no dia do faturamento (259 de 309 em 25/11/2026), o número não diria nada.
// 2. Entrega no prazo: notas do período ligadas a um item de pedido, nota emitida até a data de previsão.
// 3. Devoluções: devolvido ÷ faturado no período, por família, cliente e representante.
// Fontes: bi_pedidos_itens, bi_notas_itens, bi_devolucoes_itens (MWFaturamentoSync). Acesso: bi_funil.

const COL_PEDIDO = [
  { chave: "data_pedido", rotulo: "Pedido em", tipo: "data" },
  { chave: "cd_pedido", rotulo: "Pedido", tipo: "texto" },
  { chave: "cliente", rotulo: "Cliente", tipo: "texto" },
  { chave: "representante", rotulo: "Representante", tipo: "texto" },
  { chave: "familia", rotulo: "Família", tipo: "texto" },
  { chave: "item", rotulo: "Item", tipo: "texto" },
  { chave: "controle", rotulo: "Situação", tipo: "texto" },
  { chave: "data_previsao", rotulo: "Previsão", tipo: "data" },
  { chave: "valor", rotulo: "Valor", tipo: "moeda" },
];
const COL_ENTREGA = [
  { chave: "data_pedido", rotulo: "Pedido em", tipo: "data" },
  { chave: "data_previsao", rotulo: "Previsão", tipo: "data" },
  { chave: "data_nota", rotulo: "Nota em", tipo: "data" },
  { chave: "atraso", rotulo: "Atraso (dias)", tipo: "numero" },
  { chave: "dias", rotulo: "Pedido → nota (dias)", tipo: "numero" },
  { chave: "cliente", rotulo: "Cliente", tipo: "texto" },
  { chave: "familia", rotulo: "Família", tipo: "texto" },
  { chave: "nf", rotulo: "NF", tipo: "texto" },
  { chave: "valor", rotulo: "Valor", tipo: "moeda" },
];
const COL_DEV = [
  { chave: "data", rotulo: "Data", tipo: "data" },
  { chave: "nf", rotulo: "NF devolução", tipo: "texto" },
  { chave: "cliente", rotulo: "Cliente", tipo: "texto" },
  { chave: "representante", rotulo: "Representante", tipo: "texto" },
  { chave: "familia", rotulo: "Família", tipo: "texto" },
  { chave: "item", rotulo: "Item", tipo: "texto" },
  { chave: "valor", rotulo: "Valor", tipo: "moeda" },
];

export default function PainelBIFunil() {
  const periodo = usePeriodoBI("semestre");
  const { inicio, fim } = periodo;
  const [representante, setRepresentante] = useState("");
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState("");
  const [grupos, setGrupos] = useState({});
  const { abrir, janela } = useDetalheBI("bi_funil");

  useEffect(() => {
    let vivo = true;
    Promise.all([
      buscarTodas(() => supabase.from("bi_pedidos_itens").select("*")),
      buscarTodas(() => supabase.from("bi_notas_itens").select("*")),
      buscarTodas(() => supabase.from("bi_devolucoes_itens").select("*")),
    ]).then(([p, no, dv]) => {
      if (!vivo) return;
      const e = p.error || no.error || dv.error;
      if (e) setErro(e.message);
      setDados({ pedidos: p.data || [], notas: no.data || [], devolucoes: dv.data || [] });
    });
    chamarAcompanhamentosCigam({ bi: "grupos" }).then((r) => r.json()).then((j) => vivo && setGrupos(j?.grupos || {})).catch(() => {});
    return () => { vivo = false; };
  }, []);

  const r = useMemo(() => {
    if (!dados) return null;
    const rep = (x) => String(x.codigo_representante || "").trim() || SEM_REPRESENTANTE;
    const nomeRep = new Map();
    for (const x of [...dados.pedidos, ...dados.notas]) if (x.codigo_representante) nomeRep.set(rep(x), x.nome_representante || x.codigo_representante);
    nomeRep.set(SEM_REPRESENTANTE, "Sem representante");
    const casa = (x) => !representante || rep(x) === representante;
    const fam = (x) => nomeGrupo(grupos, grupoDe(x));
    const pedidoPorItem = new Map(dados.pedidos.map((p) => [chaveItemPedido(p), p]));

    // 1. Funil: itens de pedido lançados no período.
    const itens = dados.pedidos.filter((p) => casa(p) && entre(String(p.data_pedido || "").slice(0, 10), inicio, fim)).map((p) => ({
      ...p, etapa: etapaDoControle(p.controle_item), valor: n(p.valor_liquido), cliente: p.nome_cliente || p.codigo_cliente,
      representante: nomeRep.get(rep(p)) || "Sem representante", familia: fam(p), item: p.descricao_item || p.codigo_material,
      controle: CONTROLES[Number(p.controle_item)] || (p.controle_item ?? "—"),
    }));
    const porEtapa = Object.fromEntries(ETAPAS.map((e) => [e.id, itens.filter((x) => x.etapa === e.id)]));
    const soma = (l) => l.reduce((s, x) => s + x.valor, 0);
    const ganhos = [...porEtapa.carteira, ...porEtapa.faturado];
    const decididos = soma(ganhos) + soma(porEtapa.fora);
    const pedidosDistintos = new Set(itens.map((x) => `${x.codigo_cliente}:${x.cd_pedido}`)).size;
    // Conversão por representante: aprovado ÷ (aprovado + perdido), em valor.
    const porRep = new Map();
    for (const x of itens) {
      const k = rep(x); const a = porRep.get(k) || { chave: k, nome: nomeRep.get(k) || "Sem representante", total: 0, ganho: 0, perdido: 0, aberto: 0, itens: [] };
      a.total += x.valor; a.itens.push(x);
      if (x.etapa === "carteira" || x.etapa === "faturado") a.ganho += x.valor; else if (x.etapa === "fora") a.perdido += x.valor; else a.aberto += x.valor;
      porRep.set(k, a);
    }
    const reps = [...porRep.values()].map((a) => ({ ...a, conversao: a.total ? a.ganho / a.total : null })).sort((a, b) => b.total - a.total);

    // 2. Entregas: notas do período ligadas a item de pedido com previsão.
    const entregas = [];
    for (const no of dados.notas) {
      const d = String(no.data_movimento || "").slice(0, 10);
      if (!casa(no) || !entre(d, inicio, fim) || !no.pedido_origem) continue;
      const p = pedidoPorItem.get(chaveOrigemNota(no));
      if (!p) continue;
      const prev = p.data_previsao ? String(p.data_previsao).slice(0, 10) : null;
      const dp = p.data_pedido ? String(p.data_pedido).slice(0, 10) : null;
      entregas.push({
        data_pedido: dp, data_previsao: prev, data_nota: d, atraso: prev ? Math.max(0, diasEntre(prev, d)) : null,
        noPrazo: prev ? d <= prev : null, dias: dp ? diasEntre(dp, d) : null, cliente: no.nome_cliente || no.codigo_cliente,
        familia: fam(no), nf: no.nf, valor: n(no.valor_liquido),
      });
    }
    const comPrev = entregas.filter((x) => x.noPrazo !== null);
    const atrasadas = comPrev.filter((x) => !x.noPrazo);
    const porFamiliaEntrega = new Map();
    for (const x of comPrev) { const a = porFamiliaEntrega.get(x.familia) || { chave: x.familia, rotulo: x.familia, ok: 0, total: 0, linhas: [] }; a.total++; if (x.noPrazo) a.ok++; a.linhas.push(x); porFamiliaEntrega.set(x.familia, a); }
    const familiasEntrega = [...porFamiliaEntrega.values()].map((a) => ({ ...a, valor: Math.round((a.ok / a.total) * 1000) / 10 })).sort((a, b) => b.total - a.total);
    // Itens aprovados ainda não faturados com previsão vencida (atraso em aberto, sem filtro de período).
    const atrasoAberto = dados.pedidos.filter((p) => casa(p) && etapaDoControle(p.controle_item) === "carteira" && p.data_previsao && String(p.data_previsao).slice(0, 10) < hoje())
      .map((p) => ({ ...p, valor: n(p.valor_liquido), cliente: p.nome_cliente || p.codigo_cliente, representante: nomeRep.get(rep(p)) || "Sem representante",
        familia: fam(p), item: p.descricao_item || p.codigo_material, controle: CONTROLES[Number(p.controle_item)] || p.controle_item }));

    // 3. Devoluções do período.
    const faturado = dados.notas.filter((x) => casa(x) && entre(String(x.data_movimento || "").slice(0, 10), inicio, fim)).reduce((s, x) => s + n(x.valor_liquido), 0);
    const devs = dados.devolucoes.filter((x) => casa(x) && entre(String(x.data_movimento || "").slice(0, 10), inicio, fim)).map((x) => ({
      data: String(x.data_movimento).slice(0, 10), nf: x.nf, cliente: x.nome_cliente || x.codigo_cliente, representante: nomeRep.get(rep(x)) || x.nome_representante || "Sem representante",
      familia: fam(x), item: x.descricao_item || x.codigo_material, valor: n(x.valor_liquido),
    }));
    const agrupa = (l, campo) => { const m = new Map(); for (const x of l) { const a = m.get(x[campo]) || { chave: x[campo], rotulo: x[campo], valor: 0 }; a.valor += x.valor; m.set(x[campo], a); } return [...m.values()].sort((a, b) => b.valor - a.valor); };

    return {
      itens, porEtapa, soma, ganhos, decididos, pedidosDistintos, reps, nomeRep,
      entregas, comPrev, atrasadas, familiasEntrega, atrasoAberto,
      tempoMedio: media(entregas.map((x) => x.dias).filter((x) => x !== null)), tempoMediana: mediana(entregas.map((x) => x.dias).filter((x) => x !== null)),
      faturado, devs, devFamilia: agrupa(devs, "familia"), devCliente: agrupa(devs, "cliente"),
    };
  }, [dados, inicio, fim, representante, grupos]);

  const representantes = useMemo(() => (r ? [...r.nomeRep.entries()].sort((a, b) => String(a[1]).localeCompare(String(b[1]))) : []), [r]);
  const sub = `${dataBR(inicio)} a ${dataBR(fim)}`;
  const dias = (v) => (v === null ? "—" : `${Math.round(v)} dias`);
  const somaDev = r ? r.devs.reduce((s, x) => s + x.valor, 0) : 0;

  return (
    <section className="painel bi-painel">
      <CabecalhoBI titulo="Funil e entregas" descricao="Quanto dos pedidos vira venda, se a entrega sai no prazo e quanto volta em devolução."
        periodo={periodo} representantes={representantes} representante={representante} setRepresentante={setRepresentante}
        ajuda="Funil pela data do pedido; entregas e devoluções pela data da nota. Clique em qualquer número para ver os itens." />
      {erro && <div className="bi-aviso">{erro}</div>}
      {!r ? <p className="bi-vazio">Carregando...</p> : <>
        <h3 className="bi-secao-titulo">Funil de pedidos</h3>
        <div className="bi-kpis">
          <StatTile label={`Lançado no período (${r.pedidosDistintos} pedidos)`} valor={moeda(r.soma(r.itens))} onClick={() => abrir("Itens de pedido lançados no período", COL_PEDIDO, r.itens, sub)} />
          <StatTile label="Virou venda (aprovado ou faturado)" valor={moeda(r.soma(r.ganhos))} destaque onClick={() => abrir("Itens aprovados ou faturados", COL_PEDIDO, r.ganhos, sub)} />
          <StatTile label="Ainda em aberto (negociação + aguardando)" valor={moeda(r.soma(r.porEtapa.negociacao) + r.soma(r.porEtapa.pendente))} onClick={() => abrir("Itens em negociação ou aguardando aprovação", COL_PEDIDO, [...r.porEtapa.negociacao, ...r.porEtapa.pendente], sub)} />
          <StatTile label="Conversão (venda ÷ lançado)" valor={r.soma(r.itens) ? pct(r.soma(r.ganhos) / r.soma(r.itens)) : "—"} onClick={() => abrir("Itens aprovados ou faturados", COL_PEDIDO, r.ganhos, sub)} />
        </div>
        <div className="bi-graficos-grid">
          <BarChart titulo="Valor por situação atual do item" corPadrao={CATEGORICAL.vendas} formatarValor={moeda}
            itens={ETAPAS.map((e) => ({ chave: e.id, rotulo: e.rotulo, valor: r.soma(r.porEtapa[e.id]) })).filter((x) => x.valor > 0)}
            onSelecionarItem={(i) => abrir(ETAPAS.find((e) => e.id === i.chave).rotulo, COL_PEDIDO, r.porEtapa[i.chave], sub)} />
          <TabelaBI titulo="Conversão por representante (venda ÷ lançado)" linhas={r.reps}
            aoClicar={(l) => abrir(`Pedidos · ${l.nome}`, COL_PEDIDO, l.itens, sub)}
            colunas={[{ chave: "nome", rotulo: "Representante" }, { chave: "total", rotulo: "Lançado", num: true, formatar: moeda },
              { chave: "ganho", rotulo: "Venda", num: true, formatar: moeda }, { chave: "aberto", rotulo: "Em aberto", num: true, formatar: moeda },
              { chave: "conversao", rotulo: "Conversão", num: true, formatar: pct }]} />
        </div>
        <p className="bi-comparativo">O ERP guarda só a situação atual de cada item (não dá para medir o tempo de cada etapa) e itens cancelados não chegam ao Radar, por isso a conversão é venda ÷ lançado.</p>

        <h3 className="bi-secao-titulo">Entrega no prazo</h3>
        <div className="bi-kpis">
          <StatTile label={`Faturado no prazo (${r.comPrev.length - r.atrasadas.length} de ${r.comPrev.length} itens)`} valor={r.comPrev.length ? pct((r.comPrev.length - r.atrasadas.length) / r.comPrev.length) : "—"} destaque
            onClick={() => abrir("Itens faturados com previsão", COL_ENTREGA, r.comPrev, sub)} />
          <StatTile label={`Faturado com atraso (${r.atrasadas.length})`} valor={dias(media(r.atrasadas.map((x) => x.atraso)))} onClick={() => abrir("Itens faturados depois da previsão", COL_ENTREGA, [...r.atrasadas].sort((a, b) => b.atraso - a.atraso), sub)} />
          <StatTile label={`Aprovados com previsão vencida, não faturados (${r.atrasoAberto.length})`} valor={moeda(r.soma(r.atrasoAberto))} onClick={() => abrir("Aprovados com previsão vencida, ainda não faturados", COL_PEDIDO, [...r.atrasoAberto].sort((a, b) => String(a.data_previsao).localeCompare(String(b.data_previsao))), `posição em ${dataBR(hoje())}`)} />
        </div>
        {r.familiasEntrega.length > 0 && <div className="bi-graficos-grid">
          <BarChart titulo="% faturado no prazo por família" corPadrao={CATEGORICAL.comissao} formatarValor={(v) => `${v.toLocaleString("pt-BR")}%`}
            itens={r.familiasEntrega} onSelecionarItem={(i) => abrir(`Entregas · ${i.rotulo}`, COL_ENTREGA, r.familiasEntrega.find((f) => f.chave === i.chave).linhas, sub)} />
        </div>}

        <h3 className="bi-secao-titulo">Devoluções</h3>
        <div className="bi-kpis">
          <StatTile label={`Devolvido no período (${r.devs.length} itens)`} valor={moeda(somaDev)} onClick={() => abrir("Devoluções do período", COL_DEV, r.devs, sub)} />
          <StatTile label="Devolvido ÷ faturado" valor={r.faturado ? pct(somaDev / r.faturado) : "—"} onClick={() => abrir("Devoluções do período", COL_DEV, r.devs, sub)} />
        </div>
        {r.devs.length > 0 ? <div className="bi-graficos-grid">
          <BarChart titulo="Devolvido por família" corPadrao={CATEGORICAL.comissao} formatarValor={moeda} itens={r.devFamilia}
            onSelecionarItem={(i) => abrir(`Devoluções · ${i.rotulo}`, COL_DEV, r.devs.filter((x) => x.familia === i.chave), sub)} />
          <BarChart titulo="Devolvido por cliente" corPadrao={CATEGORICAL.comissao} formatarValor={moeda} itens={r.devCliente.slice(0, 10)}
            onSelecionarItem={(i) => abrir(`Devoluções · ${i.rotulo}`, COL_DEV, r.devs.filter((x) => x.cliente === i.chave), sub)} />
        </div> : <p className="bi-vazio">Nenhuma devolução no período. 👍</p>}
      </>}
      {janela}
    </section>
  );
}
