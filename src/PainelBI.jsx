import { useCallback, useEffect, useMemo, useState } from "react";
import { Printer } from "lucide-react";
import { supabase } from "./supabaseClient";
import StatTile from "./bi/StatTile.jsx";
import LineChart from "./bi/LineChart.jsx";
import BarChart from "./bi/BarChart.jsx";
import DetalheBI from "./bi/DetalheBI.jsx";
import { buscarTodas } from "./bi/buscarTodas.js";
import { CATEGORICAL, SEQUENCIAL_ORDINAL } from "./bi/paletteBI.js";
import "./bi-panel.css";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const MESES_ABREV = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function moeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function moedaCompacta(valor) {
  const numero = Number(valor || 0);
  if (numero >= 1000) return `R$ ${(numero / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 0 })} mil`;
  return moeda(numero);
}

function percentual(valor) {
  return `${Number(valor || 0).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

function normalizarCodigo(valor) {
  const apenasNumeros = String(valor || "").replace(/\D/g, "");
  return apenasNumeros.replace(/^0+/, "") || apenasNumeros;
}

// Código fictício que o MWComissoes grava quando a nota não tem representante
// (nunca é um código real de empresa/representante no CIGAM - ver
// ComissaoRepository.CodigoSemRepresentante, MWComissoes). normalizarCodigo
// NÃO reduz "000000" a vazio (o fallback `|| apenasNumeros` existe
// justamente pra não perder um código só de zeros), então a checagem
// precisa comparar com este valor explicitamente, não com "código vazio".
const CODIGO_SEM_REPRESENTANTE = "000000";

function janela12Meses(anoRef, mesRef) {
  const lista = [];
  for (let i = 11; i >= 0; i -= 1) {
    const data = new Date(anoRef, mesRef - 1 - i, 1);
    lista.push({ ano: data.getFullYear(), mes: data.getMonth() + 1 });
  }
  return lista;
}

function mesAnterior(ano, mes) {
  return mes === 1 ? { ano: ano - 1, mes: 12 } : { ano, mes: mes - 1 };
}

function calcularDelta(atual, anterior) {
  if (!anterior) return null;
  return ((atual - anterior) / anterior) * 100;
}

function somar(lista, campo) {
  return lista.reduce((total, item) => total + Number(item[campo] || 0), 0);
}

// Nota com mais de um representante grava uma linha de comissoes_resumos_mensais
// por representante (cada um usa o valor integral pra sua propria meta - isso
// esta correto e nao muda). Somar vendas_liquidas de todas as linhas pra um
// total "toda a equipe" contaria essa nota duas vezes. vendas_liquidas_empresa
// ja vem calculada sem essa duplicacao (mesmo valor repetido em toda linha do
// ano/mes - ver EX_MW_VW_RADAR_COMISSOES_RES). Se ainda nao veio de um sync
// atualizado (coluna zerada), cai de volta pra soma antiga.
function vendasEmpresa(lista) {
  const jaCalculada = lista.find((item) => Number(item.vendas_liquidas_empresa || 0) > 0);
  return jaCalculada ? Number(jaCalculada.vendas_liquidas_empresa || 0) : somar(lista, "vendas_liquidas");
}

function PainelBI({ perfil, usuariosPerfis = [] }) {
  const hoje = new Date();
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const [resumos, setResumos] = useState([]);
  const [lancamentos, setLancamentos] = useState([]);
  const [faixas, setFaixas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [mensagemErro, setMensagemErro] = useState("");
  const [ordenarRankingPor, setOrdenarRankingPor] = useState("vendas");
  const [detalhe, setDetalhe] = useState(null);
  const fecharDetalhe = useCallback(() => setDetalhe(null), []);

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      setCarregando(true);
      setMensagemErro("");
      const [retornoResumos, retornoLancamentos, retornoFaixas] = await Promise.all([
        supabase.from("comissoes_resumos_mensais").select("*"),
        buscarTodas(() => supabase.from("comissoes_lancamentos").select("*")),
        supabase.from("comissoes_faixas").select("*"),
      ]);
      if (!ativo) return;
      const erro = retornoResumos.error || retornoLancamentos.error || retornoFaixas.error;
      if (erro) {
        setResumos([]);
        setLancamentos([]);
        setFaixas([]);
        setMensagemErro("Os dados de comissões ainda não estão disponíveis.");
      } else {
        setResumos(retornoResumos.data || []);
        setLancamentos(retornoLancamentos.data || []);
        setFaixas(retornoFaixas.data || []);
      }
      setCarregando(false);
    }

    carregar();
    return () => {
      ativo = false;
    };
  }, []);

  function nomeRepresentante(codigo) {
    const normalizado = normalizarCodigo(codigo);
    if (!normalizado || normalizado === CODIGO_SEM_REPRESENTANTE) return "Sem representante";
    return usuariosPerfis.find(
      (item) => normalizarCodigo(item.codigo_representante) === normalizado,
    )?.nome || codigo;
  }

  const resumosDoMes = useMemo(
    () => resumos.filter((item) => Number(item.ano) === Number(ano) && Number(item.mes) === Number(mes)),
    [resumos, ano, mes],
  );

  const { ano: anoAnt, mes: mesAnt } = mesAnterior(ano, mes);
  const resumosMesAnterior = useMemo(
    () => resumos.filter((item) => Number(item.ano) === anoAnt && Number(item.mes) === mesAnt),
    [resumos, anoAnt, mesAnt],
  );

  const kpis = useMemo(() => {
    const vendas = vendasEmpresa(resumosDoMes);
    const comissao = somar(resumosDoMes, "comissao_prevista");
    const custo = vendas ? (comissao * 100) / vendas : 0;
    const repsAtivos = new Set(
      resumosDoMes
        .map((item) => normalizarCodigo(item.codigo_representante))
        .filter((codigo) => codigo && codigo !== CODIGO_SEM_REPRESENTANTE),
    ).size;

    const vendasAnt = vendasEmpresa(resumosMesAnterior);
    const comissaoAnt = somar(resumosMesAnterior, "comissao_prevista");
    const custoAnt = vendasAnt ? (comissaoAnt * 100) / vendasAnt : 0;
    const repsAnt = new Set(
      resumosMesAnterior
        .map((item) => normalizarCodigo(item.codigo_representante))
        .filter((codigo) => codigo && codigo !== CODIGO_SEM_REPRESENTANTE),
    ).size;

    return {
      vendas, comissao, custo, repsAtivos,
      deltaVendas: calcularDelta(vendas, vendasAnt),
      deltaComissao: calcularDelta(comissao, comissaoAnt),
      deltaCusto: calcularDelta(custo, custoAnt),
      deltaReps: calcularDelta(repsAtivos, repsAnt),
    };
  }, [resumosDoMes, resumosMesAnterior]);

  const janela = useMemo(() => janela12Meses(ano, mes), [ano, mes]);

  const serieVendas = useMemo(
    () => janela.map(({ ano: a, mes: m }) => ({
      rotuloX: `${MESES_ABREV[m - 1]}/${String(a).slice(2)}`,
      valor: vendasEmpresa(resumos.filter((item) => Number(item.ano) === a && Number(item.mes) === m)),
    })),
    [janela, resumos],
  );

  const serieCustoComissao = useMemo(
    () => janela.map(({ ano: a, mes: m }) => {
      const doMes = resumos.filter((item) => Number(item.ano) === a && Number(item.mes) === m);
      const vendas = vendasEmpresa(doMes);
      const comissao = somar(doMes, "comissao_prevista");
      return {
        rotuloX: `${MESES_ABREV[m - 1]}/${String(a).slice(2)}`,
        valor: vendas ? (comissao * 100) / vendas : 0,
      };
    }),
    [janela, resumos],
  );

  const ranking = useMemo(() => {
    const porRepresentante = new Map();
    resumosDoMes.forEach((item) => {
      const codigo = normalizarCodigo(item.codigo_representante);
      const atual = porRepresentante.get(codigo) || { vendas: 0, comissao: 0, codigo: item.codigo_representante };
      atual.vendas += Number(item.vendas_liquidas || 0);
      atual.comissao += Number(item.comissao_prevista || 0);
      porRepresentante.set(codigo, atual);
    });
    return [...porRepresentante.values()]
      .map((item) => ({
        chave: item.codigo,
        rotulo: nomeRepresentante(item.codigo),
        valor: ordenarRankingPor === "vendas" ? item.vendas : item.comissao,
      }))
      .sort((a, b) => b.valor - a.valor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumosDoMes, ordenarRankingPor, usuariosPerfis]);

  const distribuicaoFaixas = useMemo(() => {
    const contagem = new Map();
    resumosDoMes
      .filter((item) => item.modalidade === "V")
      .forEach((item) => {
        const faixasDoRep = faixas.filter(
          (f) => normalizarCodigo(f.codigo_representante) === normalizarCodigo(item.codigo_representante),
        );
        const faixaAtual = [...faixasDoRep]
          .filter((f) => Number(f.valor_meta || 0) <= Number(item.vendas_liquidas || 0))
          .sort((a, b) => Number(b.valor_meta) - Number(a.valor_meta))[0];
        if (!faixaAtual) return;
        const chave = Number(faixaAtual.valor_meta || 0);
        contagem.set(chave, (contagem.get(chave) || 0) + 1);
      });
    return [...contagem.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([valorMeta, quantidade], indice) => ({
        chave: valorMeta,
        rotulo: valorMeta > 0 ? `A partir de ${moedaCompacta(valorMeta)}` : "Faixa inicial",
        valor: quantidade,
        cor: SEQUENCIAL_ORDINAL[Math.min(indice, SEQUENCIAL_ORDINAL.length - 1)],
      }));
  }, [resumosDoMes, faixas]);

  const topClientes = useMemo(() => {
    const inicio = `${ano}-${String(mes).padStart(2, "0")}-01`;
    const proximoMes = new Date(ano, mes, 1);
    const fim = `${proximoMes.getFullYear()}-${String(proximoMes.getMonth() + 1).padStart(2, "0")}-01`;
    // Competência de pagamento: liquidação quando o título já foi pago, senão vencimento.
    const doPeriodo = lancamentos.filter((item) => {
      const competencia = item.data_competencia_pagamento || item.data_vencimento;
      return item.considerar !== false && competencia >= inicio && competencia < fim;
    });
    const porCliente = new Map();
    doPeriodo.forEach((item) => {
      const chave = item.nome_cliente || item.codigo_cliente || "Não identificado";
      porCliente.set(chave, (porCliente.get(chave) || 0) + Number(item.valor_comissao || 0));
    });
    return [...porCliente.entries()]
      .filter(([, valor]) => valor > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([rotulo, valor]) => ({ rotulo, valor }));
  }, [lancamentos, ano, mes]);

  // Parcelas retidas ("Pagar" desmarcado no MWComissoes) - o representante nao as ve (policy
  // do Supabase, migration 20261007200000); o gestor ve o quanto esta retido no mes e onde.
  // Mes da NOTA (data_emissao), o mesmo do resumo: a view ja tira a retida da "Comissao
  // prevista" desse mes (coluna comissao_retida), entao prevista + retida fecha o total.
  // "Pagar" desmarcado a mao grava comissao zero, entao vale base x percentual da parcela.
  const retidas = useMemo(() => {
    const competencia = `${ano}-${String(mes).padStart(2, "0")}`;
    return lancamentos
      .filter((item) => item.considerar === false && !item.lancamento_devolucao
        && normalizarCodigo(item.codigo_representante) !== CODIGO_SEM_REPRESENTANTE
        && String(item.data_emissao || "").startsWith(competencia))
      .map((item) => ({
        ...item,
        comissaoRetida: Number(item.valor_comissao || 0)
          || Math.round(Number(item.valor_base_comissao || 0) * Number(item.percentual_comissao || 0)) / 100,
      }))
      .sort((a, b) => b.comissaoRetida - a.comissaoRetida);
  }, [lancamentos, ano, mes]);
  const totalRetido = useMemo(() => retidas.reduce((total, item) => total + item.comissaoRetida, 0), [retidas]);

  const devolucoesPorMes = useMemo(
    () => janela.map(({ ano: a, mes: m }) => {
      const competencia = `${a}-${String(m).padStart(2, "0")}`;
      const valor = lancamentos
        .filter((item) => item.lancamento_devolucao && String(item.data_emissao || "").startsWith(competencia))
        .reduce((total, item) => total + Math.abs(Number(item.valor_parcela || 0)), 0);
      return { chave: competencia, rotulo: `${MESES_ABREV[m - 1]}/${String(a).slice(2)}`, valor };
    }),
    [janela, lancamentos],
  );

  // ---- Detalhe ao clicar em cards e barras (mesma janela do BI de Faturamento) ----
  const rotuloMes = `${MESES[mes - 1]} de ${ano}`;
  const competenciaMes = `${ano}-${String(mes).padStart(2, "0")}`;
  const faixaDoRepresentante = (item) => [...faixas]
    .filter((f) => normalizarCodigo(f.codigo_representante) === normalizarCodigo(item.codigo_representante)
      && Number(f.valor_meta || 0) <= Number(item.vendas_liquidas || 0))
    .sort((a, b) => Number(b.valor_meta) - Number(a.valor_meta))[0];
  const COL_REPRESENTANTES = [
    { chave: "representante", rotulo: "Representante" }, { chave: "modalidade", rotulo: "Modalidade" },
    { chave: "vendasBrutas", rotulo: "Vendas brutas", tipo: "moeda" }, { chave: "devolucoes", rotulo: "Devoluções", tipo: "moeda" },
    { chave: "vendas", rotulo: "Vendas líquidas", tipo: "moeda" }, { chave: "percentual", rotulo: "% comissão", tipo: "numero" },
    { chave: "comissao", rotulo: "Comissão prevista", tipo: "moeda" }, { chave: "custo", rotulo: "Custo (% vendas)", tipo: "numero" },
    { chave: "retida", rotulo: "Retida", tipo: "moeda" },
  ];
  const linhasRepresentantes = (lista) => lista.map((item) => {
    const vendas = Number(item.vendas_liquidas || 0);
    const comissao = Number(item.comissao_prevista || 0);
    return {
      id: item.codigo_representante,
      representante: nomeRepresentante(item.codigo_representante),
      modalidade: item.modalidade === "V" ? "Variável" : item.modalidade === "F" ? "Fixa" : (item.modalidade || "—"),
      vendasBrutas: Number(item.vendas_brutas || 0), devolucoes: Number(item.devolucoes || 0), vendas,
      percentual: Number(item.percentual_comissao || 0), comissao,
      custo: vendas ? Math.round((comissao * 10000) / vendas) / 100 : 0,
      retida: Number(item.comissao_retida || 0),
    };
  }).sort((a, b) => b.vendas - a.vendas);
  const COL_PARCELAS = [
    { chave: "emissao", rotulo: "Emissão", tipo: "data" }, { chave: "nf", rotulo: "NF (parcela)" },
    { chave: "cliente", rotulo: "Cliente" }, { chave: "representante", rotulo: "Representante" },
    { chave: "vencimento", rotulo: "Vencimento", tipo: "data" }, { chave: "situacao", rotulo: "Situação do título" },
    { chave: "parcela", rotulo: "Parcela", tipo: "moeda" }, { chave: "base", rotulo: "Base", tipo: "moeda" },
    { chave: "percentual", rotulo: "%", tipo: "numero" }, { chave: "comissao", rotulo: "Comissão", tipo: "moeda" },
    { chave: "pagar", rotulo: "Pagar" },
  ];
  const linhasParcelas = (lista, valorComissao = (item) => Number(item.valor_comissao || 0)) => lista.map((item) => ({
    id: item.id,
    emissao: item.data_emissao, nf: `${item.nota_fiscal}${item.numero_parcela ? ` (${item.numero_parcela})` : ""}`,
    cliente: item.nome_cliente || item.codigo_cliente, representante: nomeRepresentante(item.codigo_representante),
    vencimento: item.data_vencimento, situacao: item.lancamento_devolucao ? "Devolução" : (item.situacao_financeira || "—"),
    parcela: Number(item.valor_parcela || 0), base: Number(item.valor_base_comissao || 0),
    percentual: Number(item.percentual_comissao || 0), comissao: valorComissao(item),
    pagar: item.considerar === false ? "Retida" : (item.pago ? "Paga" : "Sim"),
  })).sort((a, b) => String(a.emissao).localeCompare(String(b.emissao)));
  const abrir = (titulo, subtitulo, colunas, linhas, total) => setDetalhe({
    titulo, subtitulo, colunas, linhas, total,
    arquivo: `bi_comissoes_${titulo.normalize("NFD").replace(/[^A-Za-z0-9]+/g, "_").toLowerCase()}_${competenciaMes}`,
  });
  const repsDoMes = () => resumosDoMes.filter((item) => normalizarCodigo(item.codigo_representante) !== CODIGO_SEM_REPRESENTANTE || Number(item.vendas_liquidas || 0) > 0);
  function detalheVendas() {
    const linhas = linhasRepresentantes(repsDoMes());
    const somaReps = linhas.reduce((t, l) => t + l.vendas, 0);
    const repetida = Math.abs(somaReps - kpis.vendas) > 0.009;
    abrir("Vendas líquidas por representante", `${rotuloMes}${repetida ? ` · notas com mais de um representante contam para cada um; o total da empresa (${moeda(kpis.vendas)}) desconta a repetição` : ""}`, COL_REPRESENTANTES, linhas, kpis.vendas);
  }
  const detalheComissao = (titulo) => abrir(titulo, rotuloMes, COL_REPRESENTANTES, linhasRepresentantes(repsDoMes()), kpis.comissao);
  const detalheRepresentante = (item) => {
    const doRep = lancamentos.filter((l) => normalizarCodigo(l.codigo_representante) === normalizarCodigo(item.chave)
      && String(l.data_emissao || "").startsWith(competenciaMes));
    abrir(`Notas de ${item.rotulo}`, `${rotuloMes} · parcelas das notas do mês; a comissão prevista do resumo inclui também valor fixo e ajustes de faixa`,
      COL_PARCELAS, linhasParcelas(doRep), doRep.reduce((t, l) => t + Number(l.valor_comissao || 0), 0));
  };
  const detalheCliente = (item) => {
    const inicio = `${competenciaMes}-01`;
    const proximo = new Date(ano, mes, 1);
    const fim = `${proximo.getFullYear()}-${String(proximo.getMonth() + 1).padStart(2, "0")}-01`;
    const doCliente = lancamentos.filter((l) => {
      const competencia = l.data_competencia_pagamento || l.data_vencimento;
      return l.considerar !== false && competencia >= inicio && competencia < fim
        && (l.nome_cliente || l.codigo_cliente || "Não identificado") === item.rotulo;
    });
    abrir(`Comissão · ${item.rotulo}`, `${rotuloMes} · pela competência de pagamento (liquidação, ou vencimento se ainda não pago)`,
      COL_PARCELAS, linhasParcelas(doCliente), item.valor);
  };
  const detalheDevolucoes = (item) => {
    const doMes = lancamentos.filter((l) => l.lancamento_devolucao && String(l.data_emissao || "").startsWith(item.chave));
    abrir(`Devoluções · ${item.rotulo}`, "Parcelas de devolução pela data de emissão", COL_PARCELAS, linhasParcelas(doMes), item.valor);
  };
  const detalheFaixa = (item) => {
    const naFaixa = resumosDoMes.filter((r) => r.modalidade === "V" && Number(faixaDoRepresentante(r)?.valor_meta ?? -1) === Number(item.chave));
    const linhas = linhasRepresentantes(naFaixa);
    abrir(`Faixa de meta · ${item.rotulo}`, rotuloMes, COL_REPRESENTANTES, linhas, linhas.reduce((t, l) => t + l.comissao, 0));
  };
  const detalheRetidas = () => abrir("Comissão retida", `${rotuloMes} · "Pagar" desmarcado no MWComissoes; invisível ao representante`,
    COL_PARCELAS, linhasParcelas(retidas, (item) => item.comissaoRetida), totalRetido);
  const selecionarMesSerie = (i) => { const alvo = janela[i]; if (alvo) { setAno(alvo.ano); setMes(alvo.mes); } };

  function imprimir() {
    document.body.classList.add("modo-impressao-bi");
    window.print();
    document.body.classList.remove("modo-impressao-bi");
  }

  if (perfil?.tipo_perfil !== "admin") return null;

  return (
    <section className="painel bi-painel">
      <div className="bi-topo">
        <div>
          <span className="bi-sobretitulo">Área executiva</span>
          <h2>Painel BI · Comissões</h2>
          <p>Visão consolidada da equipe de vendas para diretores.</p>
        </div>
        <button type="button" className="bi-imprimir" onClick={imprimir}>
          <Printer size={17} /> Imprimir painel
        </button>
      </div>

      {mensagemErro && <div className="bi-aviso">{mensagemErro}</div>}

      <div className="bi-filtros">
        <label>
          Mês
          <select value={mes} onChange={(evento) => setMes(Number(evento.target.value))}>
            {MESES.map((nome, indice) => (
              <option key={nome} value={indice + 1}>{nome}</option>
            ))}
          </select>
        </label>
        <label>
          Ano
          <select value={ano} onChange={(evento) => setAno(Number(evento.target.value))}>
            {[ano - 2, ano - 1, ano, ano + 1].filter((valor, indice, lista) => lista.indexOf(valor) === indice).map((valor) => (
              <option key={valor} value={valor}>{valor}</option>
            ))}
          </select>
        </label>
        <span className="bi-ajuda-filtro">Clique nos cards e nas barras para ver os representantes, notas e parcelas; num mês do gráfico para mudar o mês.</span>
      </div>

      {carregando ? (
        <p className="bi-vazio">Carregando painel...</p>
      ) : (
        <>
          <div className="bi-kpis">
            <StatTile
              label="Vendas líquidas"
              valor={moeda(kpis.vendas)}
              onClick={detalheVendas}
              delta={kpis.deltaVendas !== null ? `${percentual(Math.abs(kpis.deltaVendas))} vs mês anterior` : null}
              deltaFavoravel={kpis.deltaVendas >= 0}
            />
            <StatTile
              label="Comissão prevista"
              valor={moeda(kpis.comissao)}
              onClick={() => detalheComissao("Comissão prevista por representante")}
              delta={kpis.deltaComissao !== null ? `${percentual(Math.abs(kpis.deltaComissao))} vs mês anterior` : null}
              deltaFavoravel={kpis.deltaComissao >= 0}
              destaque
            />
            <StatTile
              label="Custo de comissão"
              valor={percentual(kpis.custo)}
              onClick={() => detalheComissao("Custo de comissão por representante")}
              delta={kpis.deltaCusto !== null ? `${percentual(Math.abs(kpis.deltaCusto))} vs mês anterior` : null}
              deltaFavoravel={kpis.deltaCusto <= 0}
            />
            <StatTile label="Representantes ativos" valor={kpis.repsAtivos} onClick={() => abrir("Representantes ativos", rotuloMes, COL_REPRESENTANTES, linhasRepresentantes(resumosDoMes.filter((item) => normalizarCodigo(item.codigo_representante) !== CODIGO_SEM_REPRESENTANTE)), kpis.comissao)} />
            <StatTile label={`Comissão retida (${retidas.length} parcela${retidas.length === 1 ? "" : "s"})`} valor={moeda(totalRetido)} onClick={detalheRetidas} />
          </div>

          <div className="bi-graficos-grid">
            <LineChart
              titulo="Tendência de vendas líquidas (12 meses)"
              onSelecionarPonto={selecionarMesSerie}
              series={[{ nome: "Vendas líquidas", cor: CATEGORICAL.vendas, pontos: serieVendas }]}
              formatarValor={moeda}
            />
            <LineChart
              titulo="Custo de comissão — % sobre vendas (12 meses)"
              onSelecionarPonto={selecionarMesSerie}
              series={[{ nome: "Custo de comissão", cor: CATEGORICAL.comissao, pontos: serieCustoComissao }]}
              formatarValor={percentual}
            />
          </div>

          <div className="bi-chart-card-wrap">
            <div className="bi-ranking-toggle">
              <button
                type="button"
                className={ordenarRankingPor === "vendas" ? "ativo" : ""}
                onClick={() => setOrdenarRankingPor("vendas")}
              >
                Vendas líquidas
              </button>
              <button
                type="button"
                className={ordenarRankingPor === "comissao" ? "ativo" : ""}
                onClick={() => setOrdenarRankingPor("comissao")}
              >
                Comissão
              </button>
            </div>
            <BarChart
              titulo={`Ranking de representantes · ${MESES[mes - 1]} de ${ano}`}
              itens={ranking}
              orientacao="horizontal"
              formatarValor={moeda}
              corPadrao={CATEGORICAL.vendas}
              onSelecionarItem={detalheRepresentante}
            />
          </div>

          <div className="bi-graficos-grid">
            <BarChart
              titulo="Distribuição por faixa de meta"
              itens={distribuicaoFaixas}
              orientacao="vertical"
              formatarValor={(v) => `${v} rep.${v === 1 ? "" : "s"}`}
              valoresInteiros
              onSelecionarItem={detalheFaixa}
            />
            <BarChart
              titulo="Devoluções por mês (12 meses)"
              itens={devolucoesPorMes}
              orientacao="vertical"
              formatarValor={moeda}
              corPadrao={CATEGORICAL.vendas}
              onSelecionarItem={detalheDevolucoes}
            />
          </div>

          <BarChart
            titulo={`Top 10 clientes por comissão · ${MESES[mes - 1]} de ${ano}`}
            itens={topClientes}
            orientacao="horizontal"
            formatarValor={moeda}
            corPadrao={CATEGORICAL.vendas}
            onSelecionarItem={detalheCliente}
          />

          {retidas.length > 0 && (
            <div className="bi-chart-card">
              <div className="bi-chart-cabecalho">
                <h3>{`Parcelas retidas · ${MESES[mes - 1]} de ${ano}`}</h3>
                <span>{`${moeda(totalRetido)} · fora dos totais e invisível ao representante`}</span>
              </div>
              <div className="bi-tabela-container">
                <table className="bi-tabela">
                  <thead><tr><th>Representante</th><th>NF</th><th>Cliente</th><th>Vencimento</th><th>Situação do título</th><th>Base</th><th>%</th><th>Comissão retida</th></tr></thead>
                  <tbody>
                    {retidas.map((item) => (
                      <tr key={item.id || `${item.codigo_representante}-${item.codigo_lancamento}`}>
                        <td>{nomeRepresentante(item.codigo_representante)}</td>
                        <td>{item.nota_fiscal}{item.numero_parcela ? ` (${item.numero_parcela})` : ""}</td>
                        <td>{item.nome_cliente || item.codigo_cliente}</td>
                        <td>{item.data_vencimento ? item.data_vencimento.split("-").reverse().join("/") : "-"}</td>
                        <td>{item.situacao_financeira || "-"}</td>
                        <td>{moeda(item.valor_base_comissao)}</td>
                        <td>{percentual(item.percentual_comissao)}</td>
                        <td><strong>{moeda(item.comissaoRetida)}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
      {detalhe && <DetalheBI {...detalhe} onFechar={fecharDetalhe} />}
    </section>
  );
}

export default PainelBI;
