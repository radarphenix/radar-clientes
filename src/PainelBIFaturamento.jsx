import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, FileSpreadsheet, Printer } from "lucide-react";
import * as XLSX from "xlsx";
import { supabase } from "./supabaseClient";
import StatTile from "./bi/StatTile.jsx";
import LineChart from "./bi/LineChart.jsx";
import BarChart from "./bi/BarChart.jsx";
import DetalheBI from "./bi/DetalheBI.jsx";
import { CATEGORICAL, SEQUENCIAL_ORDINAL } from "./bi/paletteBI.js";
import "./bi-panel.css";

const pad = (v) => String(v).padStart(2, "0");
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const deIso = (v) => new Date(`${v}T12:00:00`);
const hoje = () => iso(new Date());
const fimDoMes = (ano, mes) => iso(new Date(ano, mes + 1, 0));
const n = (v) => Number(v || 0);
const moeda = (v) => n(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const pct = (v) => `${(v * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
const dataBR = (v) => (v ? deIso(v).toLocaleDateString("pt-BR") : "—");
const dataHoraBR = (v) => (v ? new Date(v).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—");
const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const entre = (d, a, b) => d && d >= a && d <= b;
const soma = (linhas, fn) => linhas.reduce((total, linha) => total + fn(linha), 0);
const diasEntre = (a, b) => Math.round((deIso(b) - deIso(a)) / 86400000);
const SEM_REPRESENTANTE = "000000";

// Controle do item de pedido no CIGAM (tabela de controles informada pelo usuário em 09/10/2026).
const CONTROLES = {
  10: "Prospect/contato", 15: "Pendente", 20: "Orçamento", 30: "Aprovado",
  34: "Aguardando produção", 35: "Em produção", 36: "Produção cancelada",
  38: "Liberado p/ faturamento", 40: "Faturado parcial", 50: "Faturado",
  85: "Suspenso", 90: "Cancelado", 95: "Baixado",
};
// Etapas para o gestor. Tudo entra na previsão, menos suspenso/cancelado (85/90/95).
// Orçamento e prospect fazem parte da previsão (decisão do usuário em 09/10/2026).
const ETAPAS = {
  negociacao: { rotulo: "Em negociação", ordem: 0 },
  pendente: { rotulo: "Aguardando aprovação", ordem: 1 },
  carteira: { rotulo: "Carteira aprovada", ordem: 2 },
  faturado: { rotulo: "Faturado", ordem: 3 },
  fora: { rotulo: "Suspenso/cancelado", ordem: 4 },
};
const etapaDoControle = (controle) => {
  if (controle === null || controle === undefined || controle === "") return "pendente";
  const c = Number(controle);
  if (c === 50) return "faturado";
  if (c === 10 || c === 20) return "negociacao";
  if (c === 15) return "pendente";
  if (c >= 85) return "fora";
  return "carteira";
};
const PREVISTAS = new Set(["negociacao", "pendente", "carteira", "faturado"]);

// O Supabase devolve no máximo 1000 linhas por requisição, mesmo com .limit() maior.
// Pagina por id até esgotar, para os totais não ficarem truncados em silêncio.
async function buscarTodas(montarConsulta) {
  const pagina = 1000;
  const linhas = [];
  for (let de = 0; ; de += pagina) {
    const { data, error } = await montarConsulta().order("id").range(de, de + pagina - 1);
    if (error) return { data: null, error };
    linhas.push(...(data || []));
    if (!data || data.length < pagina) return { data: linhas, error: null };
  }
}

// Vínculo pedido–nota: cliente + pedido + sequência do item do pedido.
// A nota também tem sequencia_item, mas é a sequência dela própria; a do pedido
// vem em sequencia_pedido_origem (ESMOVIME.SEQ_PEDIDO_O).
const chave = (...partes) => partes.map((v) => String(v ?? "").trim()).join(":");
const chaveItemPedido = (p) => chave(p.codigo_cliente, p.cd_pedido, p.sequencia_item);
const chaveOrigemNota = (nota) => chave(nota.codigo_cliente, nota.pedido_origem, nota.sequencia_pedido_origem);
const chaveNotaFinanceiro = (x) => chave(x.nf, x.serie, x.cd_empresa);

// Períodos: atalhos fecham o mês/trimestre/ano inteiro, para a previsão do período aparecer completa.
function atalho(tipo) {
  const d = new Date();
  const a = d.getFullYear();
  const m = d.getMonth();
  if (tipo === "mes") return [iso(new Date(a, m, 1)), fimDoMes(a, m)];
  if (tipo === "mesAnterior") return [iso(new Date(a, m - 1, 1)), fimDoMes(a, m - 1)];
  if (tipo === "trimestre") { const t = Math.floor(m / 3) * 3; return [iso(new Date(a, t, 1)), fimDoMes(a, t + 2)]; }
  if (tipo === "semestre") { const t = m < 6 ? 0 : 6; return [iso(new Date(a, t, 1)), fimDoMes(a, t + 5)]; }
  return [`${a}-01-01`, `${a}-12-31`];
}
const ATALHOS = [["mes", "Mês atual"], ["mesAnterior", "Mês anterior"], ["trimestre", "Trimestre"], ["semestre", "Semestre"], ["ano", "Ano"]];

// Recorte dos títulos vencidos pelo vencimento: o padrão "do mês" evita que o atraso
// antigo (período em que a baixa não era controlada no CIGAM) domine a leitura.
const RECORTES_VENCIDOS = [["mes", "Do mês"], ["trimestre", "Do trimestre"], ["semestre", "Do semestre"], ["ano", "Do ano"], ["todos", "Todos"]];
function inicioRecorte(referencia, tipo) {
  const d = deIso(referencia);
  const a = d.getFullYear();
  const m = d.getMonth();
  if (tipo === "mes") return iso(new Date(a, m, 1));
  if (tipo === "trimestre") return iso(new Date(a, Math.floor(m / 3) * 3, 1));
  if (tipo === "semestre") return iso(new Date(a, m < 6 ? 0 : 6, 1));
  if (tipo === "ano") return `${a}-01-01`;
  return "";
}
const deslocarMeses = (valor, qtd) => {
  const d = deIso(valor);
  const alvo = new Date(d.getFullYear(), d.getMonth() + qtd, 1);
  const ultimo = new Date(alvo.getFullYear(), alvo.getMonth() + 1, 0).getDate();
  // Último dia do mês continua sendo o último dia (30/09 -> 31/08, não 30/08).
  const eraUltimo = d.getDate() === new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  return iso(new Date(alvo.getFullYear(), alvo.getMonth(), eraUltimo ? ultimo : Math.min(d.getDate(), ultimo)));
};
const deslocarDias = (valor, qtd) => { const d = deIso(valor); d.setDate(d.getDate() + qtd); return iso(d); };
// Comparativo justo: compara só até hoje (ou até o fim do filtro), com o mesmo recorte no período de referência.
function periodosComparacao(inicio, fim) {
  const fimEfetivo = fim < hoje() ? fim : hoje();
  if (fimEfetivo < inicio) return null;
  const alinhadoMes = inicio.endsWith("-01");
  const qtdMeses = (deIso(fim).getFullYear() - deIso(inicio).getFullYear()) * 12 + deIso(fim).getMonth() - deIso(inicio).getMonth() + 1;
  const anterior = alinhadoMes
    ? [deslocarMeses(inicio, -qtdMeses), deslocarMeses(fimEfetivo, -qtdMeses)]
    : [deslocarDias(inicio, -(diasEntre(inicio, fim) + 1)), deslocarDias(fimEfetivo, -(diasEntre(inicio, fim) + 1))];
  return { atual: [inicio, fimEfetivo], anterior, anoAnterior: [deslocarMeses(inicio, -12), deslocarMeses(fimEfetivo, -12)] };
}
const variacao = (atual, base) => (base > 0 ? (atual - base) / base : null);

const FAIXAS_ATRASO = [
  { rotulo: "1 a 30 dias", ate: 30 },
  { rotulo: "31 a 60 dias", ate: 60 },
  { rotulo: "61 a 90 dias", ate: 90 },
  { rotulo: "Mais de 90 dias", ate: Infinity },
];
const POR_PAGINA = 40;

function agruparTop(linhas, chaveDe, rotuloDe, valorDe, limite = 10) {
  const mapa = new Map();
  linhas.forEach((x) => {
    const k = chaveDe(x);
    const atual = mapa.get(k) || { chave: k, rotulo: rotuloDe(x), valor: 0 };
    atual.valor += valorDe(x);
    mapa.set(k, atual);
  });
  return [...mapa.values()].filter((x) => x.valor > 0).sort((a, b) => b.valor - a.valor).slice(0, limite);
}

export default function PainelBIFaturamento({ perfil }) {
  const [[inicio, fim], setPeriodo] = useState(() => atalho("mes"));
  const [cliente, setCliente] = useState("");
  const [representante, setRepresentante] = useState("");
  const [situacao, setSituacao] = useState("todas");
  const [pedidos, setPedidos] = useState([]);
  const [notas, setNotas] = useState([]);
  const [financeiro, setFinanceiro] = useState([]);
  const [devolucoes, setDevolucoes] = useState([]);
  const [recorteVencidos, setRecorteVencidos] = useState("mes");
  const [detalhe, setDetalhe] = useState(null);
  const fecharDetalhe = useCallback(() => setDetalhe(null), []);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [abertos, setAbertos] = useState(new Set());
  // A paginação da lista volta ao início quando qualquer filtro muda.
  const assinaturaFiltros = `${inicio}|${fim}|${cliente}|${representante}|${situacao}`;
  const [paginacao, setPaginacao] = useState({ assinatura: "", limite: POR_PAGINA });
  const limiteLista = paginacao.assinatura === assinaturaFiltros ? paginacao.limite : POR_PAGINA;
  const ano = inicio.slice(0, 4);
  const setInicio = (v) => setPeriodo(([, f]) => [v, f]);
  const setFim = (v) => setPeriodo(([i]) => [i, v]);

  useEffect(() => {
    let ativo = true;
    async function carregar() {
      setCarregando(true); setErro("");
      const [p, no, f, dv] = await Promise.all([
        buscarTodas(() => supabase.from("bi_pedidos_itens").select("*")),
        buscarTodas(() => supabase.from("bi_notas_itens").select("*")),
        buscarTodas(() => supabase.from("bi_lancamentos_financeiros").select("*")),
        buscarTodas(() => supabase.from("bi_devolucoes_itens").select("*")),
      ]);
      if (!ativo) return;
      if (p.error || no.error || f.error || dv.error) {
        setErro("Não foi possível consultar os dados comerciais e financeiros.");
        setPedidos([]); setNotas([]); setFinanceiro([]); setDevolucoes([]);
      } else {
        setPedidos(p.data || []); setNotas(no.data || []); setFinanceiro(f.data || []); setDevolucoes(dv.data || []);
      }
      setCarregando(false);
    }
    carregar();
    return () => { ativo = false; };
  }, []);

  const ultimaSincronizacao = useMemo(() => [...pedidos, ...notas, ...financeiro]
    .reduce((maior, x) => (x.sincronizado_em > maior ? x.sincronizado_em : maior), ""), [pedidos, notas, financeiro]);

  // Cadastros auxiliares para os filtros e para o financeiro (que não traz nome nem representante).
  const nomesClientes = useMemo(() => {
    const mapa = new Map();
    [...pedidos, ...notas, ...devolucoes].forEach((x) => { if (x.codigo_cliente && x.nome_cliente) mapa.set(x.codigo_cliente, x.nome_cliente); });
    return mapa;
  }, [pedidos, notas, devolucoes]);
  const representantes = useMemo(() => {
    const mapa = new Map();
    [...pedidos, ...notas, ...devolucoes].forEach((x) => {
      const cod = x.codigo_representante || SEM_REPRESENTANTE;
      mapa.set(cod, cod === SEM_REPRESENTANTE ? "Sem representante" : (x.nome_representante || cod));
    });
    return [...mapa.entries()].sort((a, b) => a[1].localeCompare(b[1], "pt-BR"));
  }, [pedidos, notas, devolucoes]);
  const nomeRepresentante = useCallback((cod) => (representantes.find(([c]) => c === cod)?.[1] || "Sem representante"), [representantes]);
  const representantePorNota = useMemo(() => {
    const mapa = new Map();
    notas.forEach((x) => mapa.set(chaveNotaFinanceiro(x), x.codigo_representante || SEM_REPRESENTANTE));
    return mapa;
  }, [notas]);

  const termoCliente = cliente.trim().toLowerCase();
  const casaCliente = useCallback((codigo) => !termoCliente
    || `${codigo} ${nomesClientes.get(codigo) || ""}`.toLowerCase().includes(termoCliente), [termoCliente, nomesClientes]);
  const casaRepresentante = useCallback((cod) => !representante || (cod || SEM_REPRESENTANTE) === representante, [representante]);

  // Filtros de cliente e representante valem para tudo: cards, gráficos, rankings e lista.
  const pedidosF = useMemo(() => pedidos.filter((x) => casaCliente(x.codigo_cliente) && casaRepresentante(x.codigo_representante)), [pedidos, casaCliente, casaRepresentante]);
  const notasF = useMemo(() => notas.filter((x) => casaCliente(x.codigo_cliente) && casaRepresentante(x.codigo_representante)), [notas, casaCliente, casaRepresentante]);
  const devolucoesF = useMemo(() => devolucoes.filter((x) => casaCliente(x.codigo_cliente) && casaRepresentante(x.codigo_representante)), [devolucoes, casaCliente, casaRepresentante]);
  const financeiroF = useMemo(() => financeiro.filter((x) => casaCliente(x.cd_empresa)
    && casaRepresentante(representantePorNota.get(chaveNotaFinanceiro(x)))), [financeiro, casaCliente, casaRepresentante, representantePorNota]);

  // "Não previsto" compara com todos os pedidos, não só com os filtrados: um filtro
  // de representante não pode transformar nota de pedido de outro representante em não prevista.
  const chavesPedidos = useMemo(() => new Set(pedidos.map(chaveItemPedido)), [pedidos]);
  const naoPrevista = useCallback((nota) => !nota.pedido_origem
    || nota.sequencia_pedido_origem == null
    || !chavesPedidos.has(chaveOrigemNota(nota)), [chavesPedidos]);
  const notasPorPedido = useMemo(() => notas.reduce((mapa, nota) => {
    if (!naoPrevista(nota)) {
      const k = chaveOrigemNota(nota);
      mapa.set(k, [...(mapa.get(k) || []), nota]);
    }
    return mapa;
  }, new Map()), [notas, naoPrevista]);
  const itensPedido = useMemo(() => pedidosF.map((p) => ({
    ...p,
    etapa: etapaDoControle(p.controle_item),
    valor: n(p.valor_liquido),
    notasVinculadas: notasPorPedido.get(chaveItemPedido(p)) || [],
  })), [pedidosF, notasPorPedido]);

  const periodo = useMemo(() => {
    const p = itensPedido.filter((x) => entre(x.data_previsao, inicio, fim));
    return {
      p,
      previstos: p.filter((x) => PREVISTAS.has(x.etapa)),
      no: notasF.filter((x) => entre(x.data_movimento, inicio, fim)),
      dv: devolucoesF.filter((x) => entre(x.data_movimento, inicio, fim)),
      pc: financeiroF.filter((x) => entre(x.data_vencimento, inicio, fim)),
      r: financeiroF.filter((x) => n(x.valor_saldo) === 0 && entre(x.data_ultima_liquidacao, inicio, fim)),
    };
  }, [itensPedido, notasF, devolucoesF, financeiroF, inicio, fim]);

  const porEtapa = (etapa) => soma(periodo.p.filter((x) => x.etapa === etapa), (x) => x.valor);
  const faturado = soma(periodo.no, (x) => n(x.valor_liquido));
  const devolvido = soma(periodo.dv, (x) => n(x.valor_liquido));
  const liquido = faturado - devolvido;
  const previsao = soma(periodo.previstos, (x) => x.valor);
  const atingida = porEtapa("faturado");
  const notasDistintas = new Set(periodo.no.map(chaveNotaFinanceiro)).size;
  const naoPrevistoValor = soma(periodo.no.filter(naoPrevista), (x) => n(x.valor_liquido));

  const comparacao = useMemo(() => {
    const per = periodosComparacao(inicio, fim);
    if (!per) return null;
    // Comparativo sobre o faturado líquido (notas de saída menos devoluções).
    const fat = ([a, b]) => soma(notasF.filter((x) => entre(x.data_movimento, a, b)), (x) => n(x.valor_liquido))
      - soma(devolucoesF.filter((x) => entre(x.data_movimento, a, b)), (x) => n(x.valor_liquido));
    const atual = fat(per.atual);
    return { periodos: per, atual, anterior: fat(per.anterior), anoAnterior: fat(per.anoAnterior) };
  }, [inicio, fim, notasF, devolucoesF]);
  const deltaAnterior = comparacao ? variacao(comparacao.atual, comparacao.anterior) : null;
  const deltaAno = comparacao ? variacao(comparacao.atual, comparacao.anoAnterior) : null;

  // Caixa: a posição de contas a receber é na data de referência (fim do filtro, no máximo hoje).
  const referencia = fim < hoje() ? fim : hoje();
  // Títulos com vencimento no período: previsão = recebido + vencido + a vencer, sempre.
  const titulosPeriodo = periodo.pc;
  const recebidoPeriodo = soma(titulosPeriodo, (x) => n(x.valor) - n(x.valor_saldo));
  const vencidoPeriodo = titulosPeriodo.filter((x) => n(x.valor_saldo) > 0 && x.data_vencimento < referencia);
  const aVencerPeriodo = titulosPeriodo.filter((x) => n(x.valor_saldo) > 0 && x.data_vencimento >= referencia);
  // Entradas de caixa: liquidações no período, inclusive de títulos que venciam em outros meses.
  const entradasCaixa = soma(periodo.r, (x) => n(x.valor));
  // Carteira vencida (estoque), com o recorte escolhido pelo vencimento.
  const emAberto = financeiroF.filter((x) => n(x.valor_saldo) > 0);
  const inicioVencidos = inicioRecorte(referencia, recorteVencidos);
  const rotuloRecorte = RECORTES_VENCIDOS.find(([t]) => t === recorteVencidos)[1].toLowerCase();
  const vencidos = emAberto.filter((x) => x.data_vencimento < referencia && (!inicioVencidos || x.data_vencimento >= inicioVencidos));
  const faixas = FAIXAS_ATRASO.map((faixa, i) => {
    const de = i === 0 ? 1 : FAIXAS_ATRASO[i - 1].ate + 1;
    return {
      chave: i,
      de,
      ate: faixa.ate,
      rotulo: faixa.rotulo,
      cor: SEQUENCIAL_ORDINAL[i],
      valor: soma(vencidos.filter((x) => { const d = diasEntre(x.data_vencimento, referencia); return d >= de && d <= faixa.ate; }), (x) => n(x.valor_saldo)),
    };
  });
  const devedores = (() => {
    const mapa = new Map();
    vencidos.forEach((x) => {
      const atual = mapa.get(x.cd_empresa) || { codigo: x.cd_empresa, nome: nomesClientes.get(x.cd_empresa) || x.cd_empresa, titulos: 0, valor: 0, maiorAtraso: 0 };
      atual.titulos += 1;
      atual.valor += n(x.valor_saldo);
      atual.maiorAtraso = Math.max(atual.maiorAtraso, diasEntre(x.data_vencimento, referencia));
      mapa.set(x.cd_empresa, atual);
    });
    return [...mapa.values()].sort((a, b) => b.valor - a.valor);
  })();

  const anual = useMemo(() => meses.map((rotulo, i) => {
    const mes = `${ano}-${pad(i + 1)}`;
    const em = (linhas, campo, fn) => soma(linhas.filter((x) => String(x[campo] || "").startsWith(mes)), fn);
    return {
      rotuloX: rotulo,
      pf: em(itensPedido.filter((x) => PREVISTAS.has(x.etapa)), "data_previsao", (x) => x.valor),
      fat: em(notasF, "data_movimento", (x) => n(x.valor_liquido)) - em(devolucoesF, "data_movimento", (x) => n(x.valor_liquido)),
      pr: em(financeiroF, "data_vencimento", (x) => n(x.valor)),
      // Mesma base dos cards de Caixa: títulos pelo mês de vencimento, recebido = valor - saldo.
      rec: em(financeiroF, "data_vencimento", (x) => n(x.valor) - n(x.valor_saldo)),
    };
  }), [ano, itensPedido, notasF, devolucoesF, financeiroF]);

  const rotuloCliente = (x) => x.nome_cliente || x.codigo_cliente;
  // Rankings no líquido: devolução entra com sinal negativo no cliente/representante.
  const movimentosLiquidos = [...periodo.no.map((x) => ({ ...x, sinal: 1 })), ...periodo.dv.map((x) => ({ ...x, sinal: -1 }))];
  const rankingFaturado = agruparTop(movimentosLiquidos, (x) => x.codigo_cliente, rotuloCliente, (x) => x.sinal * n(x.valor_liquido));
  const rankingCarteira = agruparTop(periodo.p.filter((x) => PREVISTAS.has(x.etapa) && x.etapa !== "faturado"), (x) => x.codigo_cliente, rotuloCliente, (x) => x.valor);
  const rankingRepresentantes = agruparTop(movimentosLiquidos, (x) => x.codigo_representante || SEM_REPRESENTANTE,
    (x) => nomeRepresentante(x.codigo_representante || SEM_REPRESENTANTE), (x) => x.sinal * n(x.valor_liquido), 12);

  // Lista por pedido: cada pedido traz suas notas. Notas do período sem pedido listado
  // (não previstas, ou de pedido previsto em outro período) entram como documento próprio.
  const documentos = useMemo(() => {
    const mapa = new Map();
    periodo.p.forEach((x) => {
      const k = `P|${x.codigo_cliente}|${x.cd_pedido}`;
      const doc = mapa.get(k) || { chave: k, tipo: "P", pedido: x.cd_pedido, data: x.data_previsao, codigo_cliente: x.codigo_cliente, nome_cliente: x.nome_cliente, codigo_representante: x.codigo_representante, itens: [], notas: new Map(), valor: 0 };
      doc.itens.push(x);
      if (x.data_previsao > doc.data) doc.data = x.data_previsao;
      if (x.etapa !== "fora") doc.valor += x.valor;
      x.notasVinculadas.forEach((nota) => doc.notas.set(nota.id, nota));
      mapa.set(k, doc);
    });
    const notasListadas = new Set([...mapa.values()].flatMap((d) => [...d.notas.keys()]));
    periodo.no.filter((x) => !notasListadas.has(x.id)).forEach((x) => {
      const k = `N|${x.nf}|${x.serie}|${x.cd_empresa}`;
      const doc = mapa.get(k) || { chave: k, tipo: "N", nf: x.nf, data: x.data_movimento, codigo_cliente: x.codigo_cliente, nome_cliente: x.nome_cliente, codigo_representante: x.codigo_representante, itens: [], notas: new Map(), valor: 0 };
      doc.itens.push(x);
      doc.valor += n(x.valor_liquido);
      mapa.set(k, doc);
    });
    periodo.dv.forEach((x) => {
      const k = `D|${x.nf}|${x.serie}|${x.codigo_cliente}`;
      const doc = mapa.get(k) || { chave: k, tipo: "D", nf: x.nf, data: x.data_movimento, codigo_cliente: x.codigo_cliente, nome_cliente: x.nome_cliente, codigo_representante: x.codigo_representante, nota_origem: x.nota_origem, itens: [], notas: new Map(), valor: 0 };
      doc.itens.push(x);
      doc.valor -= n(x.valor_liquido);
      mapa.set(k, doc);
    });
    return [...mapa.values()].map((doc) => {
      const notasDoc = [...doc.notas.values()];
      if (doc.tipo === "D") return { ...doc, notasDoc, etapa: "devolucao", selo: doc.nota_origem ? `Devolução da NF ${doc.nota_origem}` : "Devolução" };
      if (doc.tipo === "N") {
        const semPedido = doc.itens.every(naoPrevista);
        return { ...doc, notasDoc, etapa: semPedido ? "naoPrevisto" : "faturado", selo: semPedido ? "Não previsto" : "Faturado (pedido de outro período)" };
      }
      const ativos = doc.itens.filter((x) => x.etapa !== "fora");
      const etapa = ativos.length ? ativos.reduce((menor, x) => (ETAPAS[x.etapa].ordem < ETAPAS[menor].ordem ? x.etapa : menor), "faturado") : "fora";
      const parcial = etapa !== "faturado" && ativos.some((x) => x.etapa === "faturado");
      return { ...doc, notasDoc, etapa, selo: parcial ? `${ETAPAS[etapa].rotulo} · parcial` : ETAPAS[etapa].rotulo };
    }).sort((a, b) => String(b.data).localeCompare(String(a.data)));
  }, [periodo, naoPrevista]);
  const documentosFiltrados = documentos.filter((d) => (situacao === "todas" ? d.etapa !== "fora" : d.etapa === situacao));

  const alternar = (k) => setAbertos((atual) => {
    const proximo = new Set(atual); proximo.has(k) ? proximo.delete(k) : proximo.add(k); return proximo;
  });
  const selecionarMes = (i) => setPeriodo([`${ano}-${pad(i + 1)}-01`, fimDoMes(Number(ano), i)]);
  const limparFiltros = () => { setCliente(""); setRepresentante(""); setSituacao("todas"); };

  // ---- Detalhe ao clicar em cards, barras e clientes ----
  const nomeRep = (c) => nomeRepresentante(c || SEM_REPRESENTANTE);
  const COL_NOTAS = [
    { chave: "data", rotulo: "Data", tipo: "data" }, { chave: "documento", rotulo: "Documento" },
    { chave: "cliente", rotulo: "Cliente" }, { chave: "representante", rotulo: "Representante" },
    { chave: "pedido", rotulo: "Pedido(s)" }, { chave: "valor", rotulo: "Valor", tipo: "moeda" },
  ];
  const COL_PEDIDOS = [
    { chave: "data", rotulo: "Previsão", tipo: "data" }, { chave: "pedido", rotulo: "Pedido" },
    { chave: "cliente", rotulo: "Cliente" }, { chave: "representante", rotulo: "Representante" },
    { chave: "item", rotulo: "Item" }, { chave: "situacao", rotulo: "Situação" },
    { chave: "notas", rotulo: "Nota(s)" }, { chave: "valor", rotulo: "Valor", tipo: "moeda" },
  ];
  const COL_TITULOS = [
    { chave: "vencimento", rotulo: "Vencimento", tipo: "data" }, { chave: "liquidacao", rotulo: "Liquidação", tipo: "data" },
    { chave: "nf", rotulo: "NF" }, { chave: "lancamento", rotulo: "Lançamento" }, { chave: "cliente", rotulo: "Cliente" },
    { chave: "valor", rotulo: "Valor", tipo: "moeda" }, { chave: "recebido", rotulo: "Recebido", tipo: "moeda" },
    { chave: "saldo", rotulo: "Saldo", tipo: "moeda" }, { chave: "atraso", rotulo: "Dias de atraso", tipo: "numero" },
  ];
  function linhasNotas(notasLista, devLista = []) {
    const mapa = new Map();
    notasLista.forEach((x) => {
      const k = `N|${x.nf}|${x.serie}|${x.cd_empresa}`;
      const l = mapa.get(k) || { id: k, data: x.data_movimento, documento: `NF ${x.nf}`, cliente: x.nome_cliente || x.codigo_cliente, representante: nomeRep(x.codigo_representante), pedidos: new Set(), valor: 0 };
      l.valor += n(x.valor_liquido);
      if (x.pedido_origem) l.pedidos.add(x.pedido_origem);
      mapa.set(k, l);
    });
    devLista.forEach((x) => {
      const k = `D|${x.nf}|${x.serie}|${x.codigo_cliente}`;
      const l = mapa.get(k) || { id: k, data: x.data_movimento, documento: `Devolução ${x.nf}${x.nota_origem ? ` (da NF ${x.nota_origem})` : ""}`, cliente: x.nome_cliente || x.codigo_cliente, representante: nomeRep(x.codigo_representante), pedidos: new Set(), valor: 0 };
      l.valor -= n(x.valor_liquido);
      mapa.set(k, l);
    });
    return [...mapa.values()].map(({ pedidos: ped, ...l }) => ({ ...l, pedido: [...ped].join(", ") || "—" }))
      .sort((a, b) => String(b.data).localeCompare(String(a.data)));
  }
  const linhasPedidos = (itens) => itens.map((x) => ({
    id: x.id, data: x.data_previsao, pedido: x.cd_pedido, cliente: x.nome_cliente || x.codigo_cliente,
    representante: nomeRep(x.codigo_representante), item: `${x.codigo_material} · ${x.descricao_item}`,
    situacao: `${CONTROLES[x.controle_item] || "Controle"} (${x.controle_item ?? "—"})`,
    notas: x.notasVinculadas.map((nota) => nota.nf).join(", ") || "—", valor: x.valor,
  })).sort((a, b) => String(b.data).localeCompare(String(a.data)));
  const linhasTitulos = (lista) => lista.map((x) => ({
    id: x.id, vencimento: x.data_vencimento, liquidacao: x.data_ultima_liquidacao, nf: x.serie ? `${x.nf}/${x.serie}` : x.nf,
    lancamento: x.cd_lancamento, cliente: nomesClientes.get(x.cd_empresa) || x.cd_empresa,
    valor: n(x.valor), recebido: n(x.valor) - n(x.valor_saldo), saldo: n(x.valor_saldo),
    atraso: n(x.valor_saldo) > 0 && x.data_vencimento < referencia ? diasEntre(x.data_vencimento, referencia) : 0,
  })).sort((a, b) => String(a.vencimento).localeCompare(String(b.vencimento)));
  const abrir = (titulo, colunas, linhas, campoTotal = "valor", subtitulo = `${dataBR(inicio)} a ${dataBR(fim)}`) => setDetalhe({
    titulo, subtitulo, colunas, linhas, total: soma(linhas, (l) => n(l[campoTotal])),
    arquivo: `bi_${titulo.normalize("NFD").replace(/[^A-Za-z0-9]+/g, "_").toLowerCase()}_${inicio}`,
  });
  const doCliente = (c) => (x) => (x.codigo_cliente ?? x.cd_empresa) === c;
  const doRepresentante = (c) => (x) => (x.codigo_representante || SEM_REPRESENTANTE) === c;
  const detalheEtapa = (etapa, titulo) => abrir(titulo, COL_PEDIDOS, linhasPedidos(periodo.p.filter((x) => x.etapa === etapa)));

  const tituloDoc = (d) => (d.tipo === "P" ? `Pedido ${d.pedido}` : d.tipo === "D" ? `Devolução ${d.nf}` : `Nota ${d.nf}`);
  const valorItem = (d, x) => (d.tipo === "P" ? x.valor : d.tipo === "D" ? -n(x.valor_liquido) : n(x.valor_liquido));
  const situacaoItem = (d, x) => {
    if (d.tipo === "P") return `${CONTROLES[x.controle_item] || "Controle"} (${x.controle_item ?? "—"})`;
    if (d.tipo === "D") return x.nota_origem ? `Devolução da NF ${x.nota_origem}` : "Devolução sem nota de origem";
    return naoPrevista(x) ? "Faturado sem pedido" : `Pedido ${x.pedido_origem}`;
  };

  function exportarExcel() {
    const linhasDocs = documentosFiltrados.flatMap((d) => d.itens.map((x) => ({
      Tipo: d.tipo === "P" ? "Pedido" : d.tipo === "D" ? "Devolução" : "Nota",
      Data: dataBR(d.data),
      Pedido: d.tipo === "P" ? d.pedido : (x.pedido_origem || ""),
      "Nota(s)": d.tipo === "P" ? x.notasVinculadas.map((nota) => nota.nf).join(", ") : d.nf,
      Cliente: d.nome_cliente || d.codigo_cliente,
      Representante: nomeRepresentante(d.codigo_representante || SEM_REPRESENTANTE),
      Situação: situacaoItem(d, x),
      Material: x.codigo_material,
      Descrição: x.descricao_item,
      Quantidade: n(x.quantidade),
      Valor: valorItem(d, x),
    })));
    const linhasReceber = devedores.map((x) => ({
      Cliente: x.nome, Código: x.codigo, Títulos: x.titulos, "Valor vencido": x.valor, "Maior atraso (dias)": x.maiorAtraso, Recorte: `Vencidos ${rotuloRecorte}`,
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(linhasDocs), "Pedidos e notas");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(linhasReceber), "Vencidos por cliente");
    XLSX.writeFile(wb, `bi_faturamento_${inicio}_a_${fim}.xlsx`);
  }

  if (perfil?.tipo_perfil !== "admin") return null;
  const filtroAtivo = cliente || representante || situacao !== "todas";
  const atalhoAtivo = ATALHOS.map(([t]) => t).find((t) => { const [a, b] = atalho(t); return a === inicio && b === fim; });

  return <section className="painel bi-painel">
    <div className="bi-topo">
      <div>
        <span className="bi-sobretitulo">Área executiva</span>
        <h2>Painel BI · Comercial e Caixa</h2>
        <p>Previsão comercial, faturamento e caixa em competências distintas.</p>
      </div>
      <button type="button" className="bi-imprimir" onClick={() => window.print()}><Printer size={17} /> Imprimir painel</button>
    </div>

    <div className="bi-filtros bi-filtros-fat">
      <div className="bi-linha-filtro">
        <span className="bi-linha-rotulo">Período</span>
        <div className="bi-atalhos" role="group" aria-label="Atalhos de período">
          {ATALHOS.map(([t, r]) => (
            <button key={t} type="button" className={atalhoAtivo === t ? "ativo" : ""} onClick={() => setPeriodo(atalho(t))}>{r}</button>
          ))}
        </div>
        <label>De<input type="date" value={inicio} max={fim} onChange={(e) => setInicio(e.target.value)} /></label>
        <label>Até<input type="date" value={fim} min={inicio} onChange={(e) => setFim(e.target.value)} /></label>
      </div>
      <div className="bi-linha-filtro">
        <span className="bi-linha-rotulo">Recortes</span>
        <label className="bi-campo-cliente">Cliente
          <input type="search" list="bi-fat-clientes" placeholder="Nome ou código" value={cliente} onChange={(e) => setCliente(e.target.value)} />
          <datalist id="bi-fat-clientes">{[...nomesClientes.entries()].map(([c, nome]) => <option key={c} value={nome}>{c}</option>)}</datalist>
        </label>
        <label className="bi-campo-representante">Representante
          <select value={representante} onChange={(e) => setRepresentante(e.target.value)}>
            <option value="">Todos</option>
            {representantes.map(([c, nome]) => <option key={c} value={c}>{nome}</option>)}
          </select>
        </label>
        <label>Situação na lista
          <select value={situacao} onChange={(e) => setSituacao(e.target.value)}>
            <option value="todas">Todas</option>
            <option value="negociacao">Em negociação</option>
            <option value="pendente">Aguardando aprovação</option>
            <option value="carteira">Carteira aprovada</option>
            <option value="faturado">Faturado</option>
            <option value="naoPrevisto">Não previsto</option>
            <option value="devolucao">Devolução</option>
            <option value="fora">Suspenso/cancelado</option>
          </select>
        </label>
        {filtroAtivo && <button type="button" className="bi-limpar" onClick={limparFiltros}>Limpar recortes</button>}
      </div>
      <span className="bi-ajuda-filtro">
        Clique nos cards, nas barras e nos clientes para ver os documentos; num mês do gráfico para filtrar o período.
        {ultimaSincronizacao && <> Dados do CIGAM sincronizados em {dataHoraBR(ultimaSincronizacao)}.</>}
      </span>
    </div>

    {erro && <div className="bi-aviso">{erro}</div>}
    {carregando ? <p className="bi-vazio">Carregando...</p> : <>
      <h3 className="bi-secao-titulo">Comercial</h3>
      <div className="bi-kpis bi-kpis-5">
        <StatTile label="Previsão de faturamento" valor={moeda(previsao)} onClick={() => abrir("Previsão de faturamento", COL_PEDIDOS, linhasPedidos(periodo.previstos))} />
        <StatTile label="Faturado bruto" valor={moeda(faturado)} onClick={() => abrir("Faturado bruto", COL_NOTAS, linhasNotas(periodo.no))} />
        <StatTile label="Devoluções" valor={devolvido > 0 ? `− ${moeda(devolvido)}` : moeda(0)} onClick={() => abrir("Devoluções", COL_NOTAS, linhasNotas([], periodo.dv))} />
        <StatTile label="Faturado líquido" valor={moeda(liquido)} destaque onClick={() => abrir("Faturado líquido", COL_NOTAS, linhasNotas(periodo.no, periodo.dv))}
          delta={deltaAnterior === null ? null : `${pct(Math.abs(deltaAnterior))} vs período anterior`} deltaFavoravel={deltaAnterior >= 0} />
        <StatTile label="Atingimento da previsão" valor={previsao > 0 ? pct(atingida / previsao) : "—"} onClick={() => detalheEtapa("faturado", "Previsão já faturada (controle 50)")} />
      </div>
      {comparacao && <p className="bi-comparativo">
        Ticket médio por nota: <strong>{notasDistintas ? moeda(faturado / notasDistintas) : "—"}</strong>
        {" · "}Faturado líquido de {dataBR(comparacao.periodos.atual[0])} a {dataBR(comparacao.periodos.atual[1])}: <strong>{moeda(comparacao.atual)}</strong>
        {" · "}Período anterior ({dataBR(comparacao.periodos.anterior[0])} a {dataBR(comparacao.periodos.anterior[1])}): <strong>{moeda(comparacao.anterior)}</strong>
        {deltaAnterior !== null && <em className={deltaAnterior >= 0 ? "bi-delta-bom" : "bi-delta-ruim"}> {deltaAnterior >= 0 ? "+" : "−"}{pct(Math.abs(deltaAnterior))}</em>}
        {" · "}Mesmo período do ano anterior: <strong>{comparacao.anoAnterior > 0 ? moeda(comparacao.anoAnterior) : "sem dados"}</strong>
        {deltaAno !== null && <em className={deltaAno >= 0 ? "bi-delta-bom" : "bi-delta-ruim"}> {deltaAno >= 0 ? "+" : "−"}{pct(Math.abs(deltaAno))}</em>}
      </p>}
      <h4 className="bi-subtitulo">Previsão por etapa · faturado sem pedido</h4>
      <div className="bi-kpis bi-kpis-5">
        <StatTile label="Previsto já faturado (controle 50)" valor={moeda(atingida)} onClick={() => detalheEtapa("faturado", "Previsão já faturada (controle 50)")} />
        <StatTile label="Carteira aprovada (30 a 40)" valor={moeda(porEtapa("carteira"))} onClick={() => detalheEtapa("carteira", "Carteira aprovada")} />
        <StatTile label="Aguardando aprovação (15)" valor={moeda(porEtapa("pendente"))} onClick={() => detalheEtapa("pendente", "Aguardando aprovação")} />
        <StatTile label="Em negociação (10 e 20)" valor={moeda(porEtapa("negociacao"))} onClick={() => detalheEtapa("negociacao", "Em negociação")} />
        <StatTile label="Faturado não previsto" valor={moeda(naoPrevistoValor)} onClick={() => abrir("Faturado não previsto", COL_NOTAS, linhasNotas(periodo.no.filter(naoPrevista)))} />
      </div>
      {porEtapa("fora") > 0 && <p className="bi-comparativo">
        Fora da previsão: <strong>{moeda(porEtapa("fora"))}</strong> suspenso/cancelado (controles 85, 90 e 95).
      </p>}

      <div className="bi-graficos-grid">
        <LineChart titulo={`Comercial anual ${ano} · previsão × faturado líquido`} onSelecionarPonto={selecionarMes} series={[
          { nome: "Previsão", cor: CATEGORICAL.comissao, pontos: anual.map((x) => ({ rotuloX: x.rotuloX, valor: x.pf })) },
          { nome: "Faturado", cor: CATEGORICAL.vendas, pontos: anual.map((x) => ({ rotuloX: x.rotuloX, valor: x.fat })) },
        ]} formatarValor={moeda} />
        <LineChart titulo={`Caixa anual ${ano} · previsto × recebido, por vencimento`} onSelecionarPonto={selecionarMes} series={[
          { nome: "Previsto", cor: CATEGORICAL.comissao, pontos: anual.map((x) => ({ rotuloX: x.rotuloX, valor: x.pr })) },
          { nome: "Recebido", cor: CATEGORICAL.vendas, pontos: anual.map((x) => ({ rotuloX: x.rotuloX, valor: x.rec })) },
        ]} formatarValor={moeda} />
      </div>

      <div className="bi-graficos-grid">
        <BarChart titulo="Top 10 clientes · faturado líquido no período" itens={rankingFaturado} corPadrao={CATEGORICAL.vendas} formatarValor={moeda}
          onSelecionarItem={(item) => abrir(`Faturado líquido · ${item.rotulo}`, COL_NOTAS, linhasNotas(periodo.no.filter(doCliente(item.chave)), periodo.dv.filter(doCliente(item.chave))))} />
        <BarChart titulo="Top 10 clientes · carteira a faturar" itens={rankingCarteira} corPadrao={CATEGORICAL.comissao} formatarValor={moeda}
          onSelecionarItem={(item) => abrir(`Carteira a faturar · ${item.rotulo}`, COL_PEDIDOS, linhasPedidos(periodo.p.filter((x) => PREVISTAS.has(x.etapa) && x.etapa !== "faturado" && x.codigo_cliente === item.chave)))} />
      </div>
      {!representante && <BarChart titulo="Faturado líquido por representante" itens={rankingRepresentantes} corPadrao={CATEGORICAL.vendas} formatarValor={moeda}
        onSelecionarItem={(item) => abrir(`Faturado líquido · ${item.rotulo}`, COL_NOTAS, linhasNotas(periodo.no.filter(doRepresentante(item.chave)), periodo.dv.filter(doRepresentante(item.chave))))} />}

      <h3 className="bi-secao-titulo">Caixa</h3>
      <h4 className="bi-subtitulo">Títulos com vencimento no período</h4>
      <div className="bi-kpis">
        <StatTile label="Previsão de recebimento" valor={moeda(soma(titulosPeriodo, (x) => n(x.valor)))}
          onClick={() => abrir("Previsão de recebimento", COL_TITULOS, linhasTitulos(titulosPeriodo))} />
        <StatTile label="Recebido" valor={moeda(recebidoPeriodo)} destaque
          onClick={() => abrir("Recebido (títulos do período)", COL_TITULOS, linhasTitulos(titulosPeriodo.filter((x) => n(x.valor) - n(x.valor_saldo) > 0)), "recebido")} />
        <StatTile label="Vencido em aberto" valor={moeda(soma(vencidoPeriodo, (x) => n(x.valor_saldo)))}
          onClick={() => abrir("Vencido em aberto (títulos do período)", COL_TITULOS, linhasTitulos(vencidoPeriodo), "saldo")} />
        <StatTile label="A vencer" valor={moeda(soma(aVencerPeriodo, (x) => n(x.valor_saldo)))}
          onClick={() => abrir("A vencer (títulos do período)", COL_TITULOS, linhasTitulos(aVencerPeriodo), "saldo")} />
      </div>
      <p className="bi-comparativo">
        Previsão = recebido + vencido + a vencer, considerando os títulos que vencem de {dataBR(inicio)} a {dataBR(fim)} (posição em {dataBR(referencia)}).
        {" "}Entradas de caixa no período, inclusive de títulos de outros meses:{" "}
        <button type="button" className="bi-link" onClick={() => abrir("Entradas de caixa (liquidações no período)", COL_TITULOS, linhasTitulos(periodo.r))}>{moeda(entradasCaixa)}</button>.
      </p>

      <h4 className="bi-subtitulo">Carteira vencida</h4>
      <div className="bi-recorte">
        <span>Vencimento</span>
        <div className="bi-atalhos" role="group" aria-label="Recorte dos títulos vencidos">
          {RECORTES_VENCIDOS.map(([t, r]) => (
            <button key={t} type="button" className={recorteVencidos === t ? "ativo" : ""} onClick={() => setRecorteVencidos(t)}>{r}</button>
          ))}
        </div>
        <button type="button" className="bi-link bi-recorte-total" onClick={() => abrir(`Carteira vencida · ${rotuloRecorte}`, COL_TITULOS, linhasTitulos(vencidos), "saldo", `Posição em ${dataBR(referencia)}`)}>
          {moeda(soma(vencidos, (x) => n(x.valor_saldo)))} em {vencidos.length} título(s)
        </button>
        <small>{inicioVencidos ? `Vencimento de ${dataBR(inicioVencidos)} até ${dataBR(referencia)}` : `Todo o histórico até ${dataBR(referencia)}`}</small>
      </div>
      <div className="bi-aviso-pendente">
        Em validação: o saldo dos títulos vem do CIGAM (R01 com saldo em aberto). Títulos baixados por outro meio,
        fora do CIGAM, ainda aparecem como vencidos. Use o recorte para olhar só o período controlado.
      </div>
      <div className="bi-graficos-grid">
        <BarChart titulo={`Vencidos ${rotuloRecorte} por faixa de atraso · posição em ${dataBR(referencia)}`} itens={faixas} formatarValor={moeda}
          onSelecionarItem={(f) => abrir(`Vencidos ${rotuloRecorte} · ${f.rotulo}`, COL_TITULOS, linhasTitulos(vencidos.filter((x) => { const d = diasEntre(x.data_vencimento, referencia); return d >= f.de && d <= f.ate; })), "saldo", `Posição em ${dataBR(referencia)}`)} />
        <div className="bi-chart-card">
          <div className="bi-chart-cabecalho"><h3>Maiores saldos vencidos · {rotuloRecorte}</h3><span className="bi-contagem">{devedores.length} cliente(s)</span></div>
          {devedores.length ? <div className="bi-tabela-container"><table className="bi-tabela">
            <thead><tr><th>Cliente</th><th>Títulos</th><th>Vencido</th><th title="Maior atraso">Atraso máx.</th></tr></thead>
            <tbody>{devedores.slice(0, 10).map((x) => <tr key={x.codigo} className="bi-linha-clicavel" tabIndex={0} title="Ver títulos"
              onClick={() => abrir(`Vencidos ${rotuloRecorte} · ${x.nome}`, COL_TITULOS, linhasTitulos(vencidos.filter((t) => t.cd_empresa === x.codigo)), "saldo", `Posição em ${dataBR(referencia)}`)}
              onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.click(); }}>
              <td className="bi-celula-nome" title={x.nome}>{x.nome}</td><td>{x.titulos}</td><td>{moeda(x.valor)}</td><td>{x.maiorAtraso} d</td>
            </tr>)}</tbody>
          </table></div> : <p className="bi-vazio">Nenhum título vencido.</p>}
        </div>
      </div>

      <div className="bi-chart-card bi-detalhe-faturamento">
        <div className="bi-chart-cabecalho">
          <h3>Pedidos, notas e devoluções do período</h3>
          <div className="bi-acoes-lista">
            <span className="bi-contagem">{documentosFiltrados.length} documento(s){situacao !== "todas" && <> · {moeda(soma(documentosFiltrados, (d) => d.valor))}</>}</span>
            <button type="button" className="bi-botao-tabela" onClick={exportarExcel} disabled={!documentosFiltrados.length}><FileSpreadsheet size={13} /> Exportar Excel</button>
          </div>
        </div>
        {!documentosFiltrados.length && <p className="bi-vazio">Nenhum documento para os filtros escolhidos.</p>}
        {documentosFiltrados.slice(0, limiteLista).map((d) => <div className="bi-documento" key={d.chave}>
          <button type="button" className="bi-documento-resumo" onClick={() => alternar(d.chave)} aria-expanded={abertos.has(d.chave)}>
            {abertos.has(d.chave) ? <ChevronDown size={17} /> : <ChevronRight size={17} />}
            <span>
              <strong>{dataBR(d.data)} · {tituloDoc(d)}
                {d.tipo === "P" && d.notasDoc.length > 0 && <small className="bi-notas-do-pedido"> · NF {[...new Set(d.notasDoc.map((x) => x.nf))].join(", ")}</small>}
              </strong>
              <small>{d.nome_cliente || d.codigo_cliente} · {nomeRepresentante(d.codigo_representante || SEM_REPRESENTANTE)}</small>
            </span>
            <em className={`bi-selo-${d.etapa}`}>{d.selo}</em>
            <b>{moeda(d.valor)}</b>
          </button>
          {abertos.has(d.chave) && <div className="bi-documento-expansao"><div className="bi-tabela-container"><table className="bi-tabela">
            <thead><tr><th>Item</th><th>Qtd.</th><th>Valor</th><th>Situação</th>{d.tipo === "P" && <th>Nota fiscal</th>}</tr></thead>
            <tbody>{d.itens.map((x) => <tr key={x.id}>
              <td>{x.codigo_material} · {x.descricao_item}</td>
              <td>{n(x.quantidade).toLocaleString("pt-BR")}</td>
              <td>{moeda(valorItem(d, x))}</td>
              <td>{situacaoItem(d, x)}</td>
              {d.tipo === "P" && <td>{x.notasVinculadas.length ? x.notasVinculadas.map((nota) => `${nota.nf} em ${dataBR(nota.data_movimento)} (${moeda(nota.valor_liquido)})`).join("; ") : "—"}</td>}
            </tr>)}</tbody>
          </table></div></div>}
        </div>)}
        {documentosFiltrados.length > limiteLista && <button type="button" className="bi-mais" onClick={() => setPaginacao({ assinatura: assinaturaFiltros, limite: limiteLista + POR_PAGINA })}>
          Mostrar mais ({documentosFiltrados.length - limiteLista} restantes)
        </button>}
      </div>
    </>}
    {detalhe && <DetalheBI {...detalhe} onFechar={fecharDetalhe} />}
  </section>;
}
