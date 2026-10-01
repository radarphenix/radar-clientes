import { useEffect, useMemo, useState } from "react";
import { Printer } from "lucide-react";
import { supabase } from "./supabaseClient";
import StatTile from "./bi/StatTile.jsx";
import LineChart from "./bi/LineChart.jsx";
import BarChart from "./bi/BarChart.jsx";
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

// O PostgREST devolve no máximo 1000 linhas por chamada: sem paginar, o painel
// passaria a somar só uma parte dos lançamentos quando a tabela crescesse.
async function buscarTudo(tabela, ordem) {
  const tamanho = 1000;
  let todos = [];
  for (let de = 0; ; de += tamanho) {
    let consulta = supabase.from(tabela).select("*");
    ordem.forEach((coluna) => { consulta = consulta.order(coluna); });
    const { data, error } = await consulta.range(de, de + tamanho - 1);
    if (error) return { data: null, error };
    todos = todos.concat(data || []);
    if (!data || data.length < tamanho) return { data: todos, error: null };
  }
}

// Mesma regra da aba Comissões e do MWComissoes (Lançamentos financeiros): o lançamento
// entra no mês da competência de pagamento - liquidação quando o título já foi pago,
// senão vencimento. Só conta o que está marcado para pagar (considerar).
function lancamentosDaCompetencia(lancamentos, ano, mes) {
  const inicio = `${ano}-${String(mes).padStart(2, "0")}-01`;
  const proximoMes = new Date(ano, mes, 1);
  const fim = `${proximoMes.getFullYear()}-${String(proximoMes.getMonth() + 1).padStart(2, "0")}-01`;
  return lancamentos.filter((item) => {
    const competencia = item.data_competencia_pagamento || item.data_vencimento;
    return item.considerar !== false && competencia >= inicio && competencia < fim;
  });
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

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      setCarregando(true);
      setMensagemErro("");
      const [retornoResumos, retornoLancamentos, retornoFaixas] = await Promise.all([
        buscarTudo("comissoes_resumos_mensais", ["ano", "mes", "codigo_representante"]),
        buscarTudo("comissoes_lancamentos", ["id"]),
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

  const lancamentosDoMes = useMemo(() => lancamentosDaCompetencia(lancamentos, ano, mes), [lancamentos, ano, mes]);
  const lancamentosMesAnterior = useMemo(() => lancamentosDaCompetencia(lancamentos, anoAnt, mesAnt), [lancamentos, anoAnt, mesAnt]);

  const kpis = useMemo(() => {
    const vendas = vendasEmpresa(resumosDoMes);
    // comissao: gerada pelas notas faturadas no mês (base do custo sobre vendas).
    // aPagar: o que entra para pagamento no mês, pela competência de pagamento.
    const comissao = somar(resumosDoMes, "comissao_prevista");
    const aPagar = somar(lancamentosDoMes, "valor_comissao");
    const aPagarAnt = somar(lancamentosMesAnterior, "valor_comissao");
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
      vendas, comissao, aPagar, custo, repsAtivos,
      deltaAPagar: calcularDelta(aPagar, aPagarAnt),
      deltaVendas: calcularDelta(vendas, vendasAnt),
      deltaComissao: calcularDelta(comissao, comissaoAnt),
      deltaCusto: calcularDelta(custo, custoAnt),
      deltaReps: calcularDelta(repsAtivos, repsAnt),
    };
  }, [resumosDoMes, resumosMesAnterior, lancamentosDoMes, lancamentosMesAnterior]);

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
      porRepresentante.set(codigo, atual);
    });
    // Comissão do ranking = a pagar no mês (competência de pagamento), como no MWComissoes.
    lancamentosDoMes.forEach((item) => {
      const codigo = normalizarCodigo(item.codigo_representante);
      const atual = porRepresentante.get(codigo) || { vendas: 0, comissao: 0, codigo: item.codigo_representante };
      atual.comissao += Number(item.valor_comissao || 0);
      porRepresentante.set(codigo, atual);
    });
    return [...porRepresentante.values()]
      .map((item) => ({
        rotulo: nomeRepresentante(item.codigo),
        valor: ordenarRankingPor === "vendas" ? item.vendas : item.comissao,
      }))
      .filter((item) => Math.abs(item.valor) > 0.005)
      .sort((a, b) => b.valor - a.valor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumosDoMes, lancamentosDoMes, ordenarRankingPor, usuariosPerfis]);

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
        rotulo: valorMeta > 0 ? `A partir de ${moedaCompacta(valorMeta)}` : "Faixa inicial",
        valor: quantidade,
        cor: SEQUENCIAL_ORDINAL[Math.min(indice, SEQUENCIAL_ORDINAL.length - 1)],
      }));
  }, [resumosDoMes, faixas]);

  const topClientes = useMemo(() => {
    const porCliente = new Map();
    lancamentosDoMes.forEach((item) => {
      const chave = item.nome_cliente || item.codigo_cliente || "Não identificado";
      porCliente.set(chave, (porCliente.get(chave) || 0) + Number(item.valor_comissao || 0));
    });
    return [...porCliente.entries()]
      .filter(([, valor]) => valor > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([rotulo, valor]) => ({ rotulo, valor }));
  }, [lancamentosDoMes]);

  const devolucoesPorMes = useMemo(
    () => janela.map(({ ano: a, mes: m }) => {
      const competencia = `${a}-${String(m).padStart(2, "0")}`;
      const valor = lancamentos
        .filter((item) => item.lancamento_devolucao && String(item.data_emissao || "").startsWith(competencia))
        .reduce((total, item) => total + Math.abs(Number(item.valor_parcela || 0)), 0);
      return { rotulo: `${MESES_ABREV[m - 1]}/${String(a).slice(2)}`, valor };
    }),
    [janela, lancamentos],
  );

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
      </div>

      {carregando ? (
        <p className="bi-vazio">Carregando painel...</p>
      ) : (
        <>
          <p className="bi-nota-competencia" style={{ margin: "0 0 12px", color: "#526b86", fontSize: 13 }}>
            <b>Comissão a pagar no mês</b>, o ranking por comissão e o Top 10 clientes seguem a competência de pagamento
            (título liquidado entra no mês em que foi pago; em aberto, no mês do vencimento), igual aos Lançamentos financeiros do
            MWComissoes. Vendas, comissão gerada, custo sobre vendas e faixas seguem o mês de faturamento das notas.
          </p>
          <div className="bi-kpis" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
            <StatTile
              label="Vendas líquidas"
              valor={moeda(kpis.vendas)}
              delta={kpis.deltaVendas !== null ? `${percentual(Math.abs(kpis.deltaVendas))} vs mês anterior` : null}
              deltaFavoravel={kpis.deltaVendas >= 0}
            />
            <StatTile
              label="Comissão a pagar no mês"
              valor={moeda(kpis.aPagar)}
              delta={kpis.deltaAPagar !== null ? `${percentual(Math.abs(kpis.deltaAPagar))} vs mês anterior` : null}
              deltaFavoravel={kpis.deltaAPagar >= 0}
              destaque
            />
            <StatTile
              label="Comissão gerada pelas vendas"
              valor={moeda(kpis.comissao)}
              delta={kpis.deltaComissao !== null ? `${percentual(Math.abs(kpis.deltaComissao))} vs mês anterior` : null}
              deltaFavoravel={kpis.deltaComissao >= 0}
            />
            <StatTile
              label="Custo de comissão sobre vendas"
              valor={percentual(kpis.custo)}
              delta={kpis.deltaCusto !== null ? `${percentual(Math.abs(kpis.deltaCusto))} vs mês anterior` : null}
              deltaFavoravel={kpis.deltaCusto <= 0}
            />
            <StatTile label="Representantes ativos" valor={kpis.repsAtivos} />
          </div>

          <div className="bi-graficos-grid">
            <LineChart
              titulo="Tendência de vendas líquidas (12 meses)"
              series={[{ nome: "Vendas líquidas", cor: CATEGORICAL.vendas, pontos: serieVendas }]}
              formatarValor={moeda}
            />
            <LineChart
              titulo="Custo de comissão — % sobre vendas (12 meses)"
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
                Comissão a pagar
              </button>
            </div>
            <BarChart
              titulo={`Ranking de representantes · ${MESES[mes - 1]} de ${ano}`}
              itens={ranking}
              orientacao="horizontal"
              formatarValor={moeda}
              corPadrao={CATEGORICAL.vendas}
            />
          </div>

          <div className="bi-graficos-grid">
            <BarChart
              titulo="Distribuição por faixa de meta"
              itens={distribuicaoFaixas}
              orientacao="vertical"
              formatarValor={(v) => `${v} rep.${v === 1 ? "" : "s"}`}
              valoresInteiros
            />
            <BarChart
              titulo="Devoluções por mês (12 meses)"
              itens={devolucoesPorMes}
              orientacao="vertical"
              formatarValor={moeda}
              corPadrao={CATEGORICAL.vendas}
            />
          </div>

          <BarChart
            titulo={`Top 10 clientes por comissão · ${MESES[mes - 1]} de ${ano}`}
            itens={topClientes}
            orientacao="horizontal"
            formatarValor={moeda}
            corPadrao={CATEGORICAL.vendas}
          />
        </>
      )}
    </section>
  );
}

export default PainelBI;
