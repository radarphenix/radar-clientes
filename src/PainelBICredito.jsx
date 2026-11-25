import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";
import StatTile from "./bi/StatTile.jsx";
import BarChart from "./bi/BarChart.jsx";
import { buscarTodas } from "./bi/buscarTodas.js";
import { CATEGORICAL } from "./bi/paletteBI.js";
import {
  CabecalhoBI, TabelaBI, codigoNormal, dataBR, diasEntre, entre, etapaDoControle, hoje, media, moeda, moedaCurta, n, pad, pct, somarDias,
  useDetalheBI, usePeriodoBI,
} from "./bi/baseBI.jsx";
import "./bi-panel.css";

// Painel BI · Crédito e caixa (pedido do usuário, 25/11/2026).
// 1. Matriz valor × pagamento: cada cliente que faturou no período entra num quadrante:
//    tamanho = curva ABC do faturado (classe A = os que fazem 80%); pagamento = paga bem se pagou em dia
//    (até 5 dias de tolerância) pelo menos 80% dos títulos com vencimento no período e nenhum título do
//    período está vencido há mais de 30 dias.
// 2. Caixa futuro: títulos a vencer (já emitidos) + pedidos aprovados e não faturados (controles 30 a 40),
//    projetados pela previsão do pedido + prazo médio do cliente (vencimento - emissão dos títulos dele).
// Fontes: bi_lancamentos_financeiros, bi_notas_itens, bi_devolucoes_itens, bi_pedidos_itens. Acesso: bi_credito.

const QUADRANTES = [
  { id: "proteger", rotulo: "Proteger", desc: "grandes que pagam bem" },
  { id: "atencao", rotulo: "Atenção", desc: "grandes que pagam mal" },
  { id: "crescer", rotulo: "Crescer", desc: "menores que pagam bem" },
  { id: "revisar", rotulo: "Revisar crédito", desc: "menores que pagam mal" },
];
const COL_MATRIZ = [
  { chave: "cliente", rotulo: "Cliente", tipo: "texto" },
  { chave: "classe", rotulo: "Classe ABC", tipo: "texto" },
  { chave: "valor", rotulo: "Faturado líquido", tipo: "moeda" },
  { chave: "emDia", rotulo: "Pagou em dia", tipo: "texto" },
  { chave: "titulos", rotulo: "Títulos vencidos no período", tipo: "numero" },
  { chave: "vencido30", rotulo: "Vencido há +30 dias", tipo: "moeda" },
  { chave: "maiorAtraso", rotulo: "Maior atraso (dias)", tipo: "numero" },
];
const COL_CAIXA = [
  { chave: "origem", rotulo: "Origem", tipo: "texto" },
  { chave: "data", rotulo: "Recebimento previsto", tipo: "data" },
  { chave: "cliente", rotulo: "Cliente", tipo: "texto" },
  { chave: "documento", rotulo: "Documento", tipo: "texto" },
  { chave: "base", rotulo: "Base da projeção", tipo: "texto" },
  { chave: "valor", rotulo: "Valor", tipo: "moeda" },
];
const TOLERANCIA = 5; // dias depois do vencimento que ainda contam como "em dia" na matriz
const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export default function PainelBICredito() {
  const periodo = usePeriodoBI("semestre");
  const { inicio, fim } = periodo;
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState("");
  const { abrir, janela } = useDetalheBI("bi_credito");

  useEffect(() => {
    let vivo = true;
    Promise.all([
      buscarTodas(() => supabase.from("bi_lancamentos_financeiros").select("*")),
      buscarTodas(() => supabase.from("bi_notas_itens").select("id, codigo_cliente, nome_cliente, data_movimento, valor_liquido")),
      buscarTodas(() => supabase.from("bi_devolucoes_itens").select("id, codigo_cliente, data_movimento, valor_liquido")),
      buscarTodas(() => supabase.from("bi_pedidos_itens").select("*")),
    ]).then(([fi, no, dv, pe]) => {
      if (!vivo) return;
      const e = fi.error || no.error || dv.error || pe.error;
      if (e) setErro(e.message);
      setDados({ fin: fi.data || [], notas: no.data || [], devolucoes: dv.data || [], pedidos: pe.data || [] });
    });
    return () => { vivo = false; };
  }, []);

  const r = useMemo(() => {
    if (!dados) return null;
    const hj = hoje();
    const nomes = new Map();
    for (const x of [...dados.notas, ...dados.pedidos]) if (x.nome_cliente) nomes.set(codigoNormal(x.codigo_cliente), x.nome_cliente);
    const nome = (k) => nomes.get(k) || k;

    // ---------------------------------------------------- Matriz valor × pagamento
    const fat = new Map();
    for (const x of dados.notas) { const d = String(x.data_movimento || "").slice(0, 10); if (entre(d, inicio, fim)) { const k = codigoNormal(x.codigo_cliente); fat.set(k, (fat.get(k) || 0) + n(x.valor_liquido)); } }
    for (const x of dados.devolucoes) { const d = String(x.data_movimento || "").slice(0, 10); if (entre(d, inicio, fim)) { const k = codigoNormal(x.codigo_cliente); fat.set(k, (fat.get(k) || 0) - n(x.valor_liquido)); } }
    const ordem = [...fat.entries()].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
    const total = ordem.reduce((s, [, v]) => s + v, 0);
    const pag = new Map();
    for (const t of dados.fin) {
      const k = codigoNormal(t.cd_empresa);
      const a = pag.get(k) || { titulos: 0, emDia: 0, vencido30: 0, maiorAtraso: 0 };
      const venc = String(t.data_vencimento || "").slice(0, 10);
      const liq = t.data_ultima_liquidacao ? String(t.data_ultima_liquidacao).slice(0, 10) : null;
      if (entre(venc, inicio, fim) && venc < hj) {
        a.titulos++;
        // Tolerância de 5 dias: compensação bancária e fim de semana (74 de 328 títulos do 2º semestre/2026
        // foram pagos de 1 a 5 dias depois do vencimento; sem tolerância quase todo cliente grande "pagava mal").
        const pagoEmDia = n(t.valor_saldo) === 0 && liq && diasEntre(venc, liq) <= TOLERANCIA;
        if (pagoEmDia) a.emDia++;
        const atraso = n(t.valor_saldo) > 0 ? diasEntre(venc, hj) : liq ? Math.max(0, diasEntre(venc, liq)) : 0;
        a.maiorAtraso = Math.max(a.maiorAtraso, atraso);
      }
      // Só títulos que venceram no período: o atraso antigo (início de 2026, quando a baixa não era controlada
      // no ERP) não pode marcar um cliente como mau pagador num período em que ele pagou em dia.
      if (n(t.valor_saldo) > 0 && entre(venc, inicio, fim) && diasEntre(venc, hj) > 30) a.vencido30 += n(t.valor_saldo);
      pag.set(k, a);
    }
    let acc = 0;
    const matriz = ordem.map(([k, v]) => {
      const antes = acc; acc += v;
      const classe = antes / total < 0.8 ? "A" : antes / total < 0.95 ? "B" : "C";
      const p = pag.get(k) || { titulos: 0, emDia: 0, vencido30: 0, maiorAtraso: 0 };
      const taxa = p.titulos ? p.emDia / p.titulos : null;
      const pagaBem = (taxa === null || taxa >= 0.8) && p.vencido30 === 0;
      const grande = classe === "A";
      return { codigo: k, cliente: nome(k), valor: v, classe, ...p, emDia: taxa === null ? "sem títulos vencidos" : pct(taxa),
        quadrante: grande ? (pagaBem ? "proteger" : "atencao") : (pagaBem ? "crescer" : "revisar") };
    });

    // ---------------------------------------------------- Caixa futuro
    const prazo = new Map();
    for (const t of dados.fin) {
      if (!t.data_emissao || !t.data_vencimento) continue;
      const k = codigoNormal(t.cd_empresa); const d = diasEntre(String(t.data_emissao).slice(0, 10), String(t.data_vencimento).slice(0, 10));
      if (d >= 0 && d < 400) prazo.set(k, [...(prazo.get(k) || []), d]);
    }
    const prazoGeral = Math.round(media([...prazo.values()].flat()) ?? 30);
    const prazoDe = (k) => Math.round(media(prazo.get(k) || []) ?? prazoGeral);
    const fluxo = [];
    const vencidosAbertos = [];
    for (const t of dados.fin) {
      if (n(t.valor_saldo) <= 0) continue;
      const venc = String(t.data_vencimento || "").slice(0, 10);
      const linha = { origem: "Título emitido", data: venc, cliente: nome(codigoNormal(t.cd_empresa)), documento: `NF ${t.nf || "-"} · lanç. ${t.cd_lancamento || "-"}`, base: "vencimento do título", valor: n(t.valor_saldo) };
      if (venc < hj) vencidosAbertos.push(linha); else fluxo.push(linha);
    }
    for (const p of dados.pedidos) {
      if (etapaDoControle(p.controle_item) !== "carteira") continue;
      const qtd = n(p.quantidade); const saldo = p.quantidade_saldo === null || p.quantidade_saldo === undefined ? qtd : n(p.quantidade_saldo);
      const valor = n(p.valor_liquido) * (qtd > 0 ? Math.min(1, saldo / qtd) : 1);
      if (valor <= 0) continue;
      const k = codigoNormal(p.codigo_cliente);
      const prev = p.data_previsao ? String(p.data_previsao).slice(0, 10) : hj;
      const baseData = prev < hj ? hj : prev;
      const pz = prazoDe(k);
      fluxo.push({ origem: "Pedido aprovado (a faturar)", data: somarDias(baseData, pz), cliente: nome(k), documento: `Pedido ${p.cd_pedido} item ${p.sequencia_item}`,
        base: `${prev < hj ? "previsão vencida → hoje" : `previsão ${dataBR(prev)}`} + ${pz} dias de prazo`, valor });
    }
    const d0 = new Date(); const meses = Array.from({ length: 6 }, (_, i) => { const d = new Date(d0.getFullYear(), d0.getMonth() + i, 1); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; });
    const porMes = meses.map((m) => {
      const l = fluxo.filter((x) => x.data.startsWith(m));
      const tit = l.filter((x) => x.origem === "Título emitido"); const ped = l.filter((x) => x.origem !== "Título emitido");
      const s = (q) => q.reduce((a, x) => a + x.valor, 0);
      return { chave: m, rotulo: `${MESES[Number(m.slice(5)) - 1]}/${m.slice(2, 4)}`, titulos: s(tit), pedidos: s(ped), valor: s(l), linhas: l };
    });
    const depois = fluxo.filter((x) => x.data.slice(0, 7) > meses[5]);
    return { matriz, total, porMes, depois, vencidosAbertos, prazoGeral, fluxoPedidos: fluxo.filter((x) => x.origem !== "Título emitido") };
  }, [dados, inicio, fim]);

  const sub = `${dataBR(inicio)} a ${dataBR(fim)}`;
  const somaV = (l) => l.reduce((s, x) => s + x.valor, 0);

  return (
    <section className="painel bi-painel">
      <CabecalhoBI titulo="Crédito e caixa" descricao="Quem compra muito e paga bem (ou mal), e quanto deve entrar de caixa nos próximos meses."
        periodo={periodo} ajuda="O período vale para a matriz (faturado e títulos vencidos nele). O caixa futuro é sempre a partir de hoje. Clique em qualquer número para ver os clientes ou documentos." />
      {erro && <div className="bi-aviso">{erro}</div>}
      {!r ? <p className="bi-vazio">Carregando...</p> : <>
        <h3 className="bi-secao-titulo">Matriz valor × pagamento</h3>
        <div className="bi-kpis">
          {QUADRANTES.map((q) => {
            const l = r.matriz.filter((x) => x.quadrante === q.id);
            return <StatTile key={q.id} label={`${q.rotulo} · ${q.desc} (${l.length})`} valor={moedaCurta(somaV(l))} destaque={q.id === "atencao" && l.length > 0}
              onClick={() => abrir(`${q.rotulo} · ${q.desc}`, COL_MATRIZ, l, sub)} />;
          })}
        </div>
        <p className="bi-comparativo">Grande = classe A da curva ABC (os clientes que fazem 80% do faturado no período). Paga bem = pagou em dia (até 5 dias depois do vencimento, por causa da compensação bancária) pelo menos 80% dos títulos que venceram no período e nenhum título do período está vencido há mais de 30 dias. Cuidado com períodos que incluam o início de 2026: há títulos daquela época ainda em aberto por falta de baixa no ERP.</p>

        <h3 className="bi-secao-titulo">Caixa futuro · próximos 6 meses</h3>
        <div className="bi-kpis">
          <StatTile label="Títulos emitidos a vencer (6 meses)" valor={moedaCurta(r.porMes.reduce((s, m) => s + m.titulos, 0))} onClick={() => abrir("Títulos a vencer nos próximos 6 meses", COL_CAIXA, r.porMes.flatMap((m) => m.linhas.filter((x) => x.origem === "Título emitido")))} />
          <StatTile label="Pedidos aprovados projetados (6 meses)" valor={moedaCurta(r.porMes.reduce((s, m) => s + m.pedidos, 0))} destaque onClick={() => abrir("Pedidos aprovados projetados nos próximos 6 meses", COL_CAIXA, r.porMes.flatMap((m) => m.linhas.filter((x) => x.origem !== "Título emitido")))} />
          <StatTile label={`Vencidos em aberto (${r.vencidosAbertos.length})`} valor={moedaCurta(somaV(r.vencidosAbertos))} onClick={() => abrir("Títulos vencidos em aberto", COL_CAIXA, r.vencidosAbertos)} />
          <StatTile label="Depois de 6 meses" valor={moedaCurta(somaV(r.depois))} onClick={() => abrir("Previsto para depois de 6 meses", COL_CAIXA, r.depois)} />
        </div>
        <div className="bi-graficos-grid">
          <BarChart titulo="Entrada prevista por mês (títulos + pedidos)" corPadrao={CATEGORICAL.vendas} formatarValor={moedaCurta}
            orientacao="vertical" itens={r.porMes} onSelecionarItem={(i) => abrir(`Entrada prevista · ${i.rotulo}`, COL_CAIXA, r.porMes.find((m) => m.chave === i.chave).linhas)} />
          <TabelaBI titulo="Mês a mês" linhas={r.porMes} aoClicar={(l) => abrir(`Entrada prevista · ${l.rotulo}`, COL_CAIXA, l.linhas)}
            colunas={[{ chave: "rotulo", rotulo: "Mês" }, { chave: "titulos", rotulo: "Títulos", num: true, formatar: moedaCurta },
              { chave: "pedidos", rotulo: "Pedidos", num: true, formatar: moedaCurta }, { chave: "valor", rotulo: "Total", num: true, formatar: moedaCurta }]}
            nota={`Pedido = valor do saldo a faturar, previsto para a data de previsão (vencida → hoje) + o prazo médio do cliente (vencimento − emissão dos títulos dele; sem histórico, ${r.prazoGeral} dias, a média geral). Vencidos em aberto ficam fora do gráfico.`} />
        </div>
      </>}
      {janela}
    </section>
  );
}
