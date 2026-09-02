import { useEffect, useMemo, useState } from "react";
import { BarChart3, CalendarDays, Printer, Target } from "lucide-react";
import { supabase } from "./supabaseClient";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const REPRESENTANTES_DEMO = [
  {
    user_id: "demo-meta",
    nome: "Representante com metas (simulação)",
    codigo_representante: "900001",
    tipo_perfil: "representante",
    ativo: true,
  },
  {
    user_id: "demo-fixa",
    nome: "Representante comissão fixa (simulação)",
    codigo_representante: "900002",
    tipo_perfil: "representante",
    ativo: true,
  },
];

function moeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function percentual(valor) {
  return `${Number(valor || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
}

function dataBr(valor) {
  if (!valor) return "-";
  const [ano, mes, dia] = String(valor).slice(0, 10).split("-");
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : "-";
}

function mesAnoOrigem(valor) {
  if (!valor) return "-";
  const [ano, mes] = String(valor).slice(0, 10).split("-");
  return ano && mes ? `${mes}/${ano}` : "-";
}

function rotuloLancamento(item) {
  if (item.tipo_lancamento === "DESCONTO") return "Desconto";
  if (item.tipo_lancamento === "AJUSTE_PERCENTUAL") return "Ajuste de percentual";
  if (item.tipo_lancamento === "DEVOLUCAO" || item.lancamento_devolucao) return "Devolução";
  return item.pago ? "Pago" : "A receber";
}

function normalizarCodigo(valor) {
  const apenasNumeros = String(valor || "").replace(/\D/g, "");
  return apenasNumeros.replace(/^0+/, "") || apenasNumeros;
}

// Código fictício que o MWComissoes grava quando a nota não tem representante
// (nunca é um código real de empresa/representante no CIGAM - ver
// ComissaoRepository.CodigoSemRepresentante, MWComissoes; mesmo tratamento já
// existente em PainelBI.jsx). normalizarCodigo NÃO reduz "000000" a vazio (o
// fallback `|| apenasNumeros` existe justamente pra não perder um código só
// de zeros), então a checagem precisa comparar com este valor explicitamente.
const CODIGO_SEM_REPRESENTANTE = "000000";

function dadosDemonstrativos(ano, mes, codigosRepresentantes) {
  const competencia = `${ano}-${String(mes).padStart(2, "0")}`;
  const codigos = codigosRepresentantes?.length
    ? codigosRepresentantes
    : ["000101", "000202", "000303"];
  const codigoComissaoFixa = codigos.length > 1 ? codigos[1] : codigos[0];
  const lancamentos = [
    ["10420", "Blendpaper Security Papéis Especiais", 59986.91, 2999.35, 13],
    ["10431", "Malharia Horizonte Ltda.", 28450.0, 1422.5, 18],
    ["10458", "Têxtil Vale do Sul", 41780.3, 2089.02, 22],
    ["10472", "Confecções Aurora", 17640.0, 882.0, 28],
  ].map(([nota, cliente, base, comissao, dia], indice) => {
    const codigoRepresentante = codigos[indice % codigos.length];
    const fixa = codigoRepresentante === codigoComissaoFixa;
    return {
      id: `demo-${indice}`,
      codigo_representante: codigoRepresentante,
      nota_fiscal: nota,
      nome_cliente: cliente,
      data_emissao: `${competencia}-${String(Math.max(1, dia - 5)).padStart(2, "0")}`,
      data_vencimento: `${competencia}-${String(dia).padStart(2, "0")}`,
      valor_parcela: base,
      valor_base_comissao: base,
      percentual_comissao: fixa ? 2.5 : 5,
      valor_comissao: fixa ? base * 0.025 : comissao,
      pago: false,
      situacao_financeira: indice === 0 ? "Liquidada" : "A vencer",
      tipo_comissao: fixa ? "F" : "V",
    };
  });

  if (Number(mes) === 7) {
    lancamentos.push({
      id: "demo-devolucao-julho",
      codigo_representante: codigos[0],
      nota_fiscal: "DEV-207",
      nota_origem_devolucao: "10382",
      competencia_origem_devolucao: `${ano}-01-01`,
      nome_cliente: "Têxtil Vale do Sul",
      data_emissao: `${competencia}-19`,
      data_vencimento: `${competencia}-19`,
      valor_parcela: -7800,
      valor_base_comissao: -21400,
      percentual_comissao: 4,
      valor_comissao: -856,
      estorno_comissao: 856,
      ajuste_faixa: 972,
      ajuste_faixa_pago: 648,
      ajuste_faixa_pendente: 324,
      comissao_futura_cancelada: 428,
      vendas_competencia_original: 105000,
      vendas_competencia_recalculada: 97200,
      percentual_faixa_original: 4,
      percentual_faixa_recalculado: 3,
      considerar: true,
      pago: false,
      situacao_financeira: "Devolução",
      tipo_comissao: "V",
      lancamento_devolucao: true,
    });
  }

  const resumos = codigos.flatMap((codigo, representanteIndice) =>
    MESES.map((_, indice) => {
      const vendas = indice > mes - 1 ? 0 : 105000 + indice * 9400 + representanteIndice * 13750;
      const devolucoes = codigo === codigos[0] && indice === 6 ? 7800 : 0;
      const devolucoesDaCompetencia = codigo === codigos[0] && indice === 0 ? 7800 : 0;
      const liquidas = Math.max(0, vendas - devolucoesDaCompetencia);
      const fixa = codigo === codigoComissaoFixa;
      const peAntes = fixa ? 2.5 : vendas >= 150000 ? 5 : vendas >= 100000 ? 4 : 3;
      const pe = fixa ? 2.5 : liquidas >= 150000 ? 5 : liquidas >= 100000 ? 4 : 3;
      const eventoDevolucao = codigo === codigos[0] && indice === 6;
      const ajusteFaixaPago = eventoDevolucao ? 648 : 0;
      const ajusteFaixaPendente = eventoDevolucao ? 324 : 0;
      const ajusteFaixa = ajusteFaixaPago + ajusteFaixaPendente;
      const comissaoFuturaCancelada = eventoDevolucao ? 428 : 0;
      const estornoComissao = eventoDevolucao ? 856 : 0;
      const valorFixo = !fixa && liquidas >= 150000 ? 800 : 0;
      const comissaoGerada = vendas ? vendas * peAntes / 100 + valorFixo : 0;
      return {
        codigo_representante: codigo,
        ano,
        mes: indice + 1,
        modalidade: fixa ? "F" : "V",
        vendas_brutas: vendas,
        devolucoes,
        vendas_liquidas: liquidas,
        meta_atingida: fixa ? 0 : liquidas >= 150000 ? 150000 : liquidas >= 100000 ? 100000 : 0,
        percentual_comissao: pe,
        valor_fixo: valorFixo,
        estorno_comissao: estornoComissao,
        ajuste_faixa: ajusteFaixa,
        ajuste_faixa_pago: ajusteFaixaPago,
        ajuste_faixa_pendente: ajusteFaixaPendente,
        comissao_futura_cancelada: comissaoFuturaCancelada,
        comissao_gerada: comissaoGerada,
        comissao_prevista: Math.max(0, comissaoGerada - estornoComissao),
        comissao_paga: indice < mes - 1 ? vendas * peAntes / 100 : 0,
      };
    }),
  );

  return {
    lancamentos,
    resumos,
    faixas: codigos.filter((codigo) => codigo !== codigoComissaoFixa).flatMap((codigo) => [
      { codigo_representante: codigo, valor_meta: 0, percentual_comissao: 3, valor_fixo: 0 },
      { codigo_representante: codigo, valor_meta: 100000, percentual_comissao: 4, valor_fixo: 0 },
      { codigo_representante: codigo, valor_meta: 150000, percentual_comissao: 5, valor_fixo: 800 },
      { codigo_representante: codigo, valor_meta: 200000, percentual_comissao: 6, valor_fixo: 1200 },
    ]),
  };
}

function CabecalhoRelatorio({ titulo, perfil, demonstrativo }) {
  return (
    <header className="comissoes-cabecalho-relatorio">
      <img
        src="https://phenixonline.com.br/wp-content/uploads/2021/05/Logo-Branco-1.png"
        alt="Phenix"
      />
      <div>
        <h1>{titulo}</h1>
        <p>{perfil?.nome || "Representante"}</p>
        <small>
          Código {perfil?.codigo_representante || "-"} · Gerado em{" "}
          {new Date().toLocaleString("pt-BR")}
        </small>
      </div>
      {demonstrativo && <strong>DADOS DEMONSTRATIVOS</strong>}
    </header>
  );
}

function ComissoesRepresentante({ perfil, usuariosPerfis = [] }) {
  const hoje = new Date();
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const [aba, setAba] = useState("receber");
  const [lancamentos, setLancamentos] = useState([]);
  const [resumos, setResumos] = useState([]);
  const [faixas, setFaixas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [mensagem, setMensagem] = useState("");
  const [demonstrativo, setDemonstrativo] = useState(false);
  const administrador = perfil?.tipo_perfil === "admin";
  const representantes = useMemo(
    () => usuariosPerfis
      .filter((usuario) => usuario.tipo_perfil === "representante" && usuario.ativo !== false && usuario.codigo_representante)
      .sort((a, b) => String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR")),
    [usuariosPerfis],
  );
  const representantesExibicao = useMemo(
    () => (administrador && demonstrativo ? REPRESENTANTES_DEMO : representantes),
    [administrador, demonstrativo, representantes],
  );
  const codigosRepresentantes = useMemo(
    () => representantesExibicao.map((item) => item.codigo_representante),
    [representantesExibicao],
  );
  const [representanteSelecionado, setRepresentanteSelecionado] = useState(
    administrador ? "todos" : perfil?.codigo_representante || "",
  );

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      setCarregando(true);
      setMensagem("");
      const inicio = `${ano}-${String(mes).padStart(2, "0")}-01`;
      const proximoMes = new Date(ano, mes, 1);
      const fim = `${proximoMes.getFullYear()}-${String(proximoMes.getMonth() + 1).padStart(2, "0")}-01`;

      const [retornoLancamentos, retornoResumos, retornoFaixas] =
        await Promise.all([
          supabase
            .from("comissoes_lancamentos")
            .select("*")
            .gte("data_vencimento", inicio)
            .lt("data_vencimento", fim)
            .order("data_vencimento", { ascending: true }),
          supabase
            .from("comissoes_resumos_mensais")
            .select("*")
            .eq("ano", ano)
            .order("mes", { ascending: true }),
          supabase
            .from("comissoes_faixas")
            .select("*")
            .order("valor_meta", { ascending: true }),
        ]);

      if (!ativo) return;
      const erro = retornoLancamentos.error || retornoResumos.error || retornoFaixas.error;

      if (erro) {
        if (import.meta.env.DEV) {
          const demo = dadosDemonstrativos(
            ano,
            mes,
            administrador
              ? codigosRepresentantes
              : [perfil?.codigo_representante].filter(Boolean),
          );
          setLancamentos(demo.lancamentos);
          setResumos(demo.resumos);
          setFaixas(demo.faixas);
          setDemonstrativo(true);
          setMensagem(
            "Prévia local: as tabelas consultivas ainda não foram aplicadas ao Supabase.",
          );
        } else {
          setLancamentos([]);
          setResumos([]);
          setFaixas([]);
          setDemonstrativo(false);
          setMensagem("Os dados de comissões ainda não estão disponíveis.");
        }
      } else {
        setLancamentos(retornoLancamentos.data || []);
        setResumos(retornoResumos.data || []);
        setFaixas(retornoFaixas.data || []);
        setDemonstrativo(false);
      }

      setCarregando(false);
    }

    carregar();
    return () => {
      ativo = false;
    };
  }, [ano, mes, administrador, codigosRepresentantes, perfil?.codigo_representante]);

  const codigoEmExibicao = administrador
    ? representanteSelecionado
    : perfil?.codigo_representante || "";
  const exibeEquipe = administrador && codigoEmExibicao === "todos";

  function pertenceAoSelecionado(item) {
    if (exibeEquipe) return true;
    return normalizarCodigo(item.codigo_representante) === normalizarCodigo(codigoEmExibicao);
  }

  const lancamentosVisiveis = useMemo(
    () => lancamentos.filter(pertenceAoSelecionado),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lancamentos, codigoEmExibicao, exibeEquipe],
  );
  const resumosVisiveis = useMemo(
    () => resumos.filter(pertenceAoSelecionado),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [resumos, codigoEmExibicao, exibeEquipe],
  );
  const faixasVisiveis = useMemo(
    () => faixas.filter(pertenceAoSelecionado),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [faixas, codigoEmExibicao, exibeEquipe],
  );

  const resumosHistorico = useMemo(() => {
    if (!exibeEquipe) return resumosVisiveis;
    return MESES.map((_, indice) => {
      const itens = resumosVisiveis.filter((item) => Number(item.mes) === indice + 1);
      const somar = (campo) => itens.reduce((total, item) => total + Number(item[campo] || 0), 0);
      const vendasLiquidas = somar("vendas_liquidas");
      const comissaoPrevista = somar("comissao_prevista");
      return {
        ano,
        mes: indice + 1,
        vendas_brutas: somar("vendas_brutas"),
        devolucoes: somar("devolucoes"),
        vendas_liquidas: vendasLiquidas,
        meta_atingida: somar("meta_atingida"),
        percentual_comissao: vendasLiquidas ? comissaoPrevista * 100 / vendasLiquidas : 0,
        estorno_comissao: somar("estorno_comissao"),
        ajuste_faixa: somar("ajuste_faixa"),
        ajuste_faixa_pago: somar("ajuste_faixa_pago"),
        ajuste_faixa_pendente: somar("ajuste_faixa_pendente"),
        comissao_futura_cancelada: somar("comissao_futura_cancelada"),
        comissao_gerada: somar("comissao_gerada"),
        comissao_prevista: comissaoPrevista,
        comissao_paga: somar("comissao_paga"),
      };
    });
  }, [ano, exibeEquipe, resumosVisiveis]);

  const resumoMes = useMemo(
    () => resumosHistorico.find((item) => Number(item.mes) === Number(mes)),
    [resumosHistorico, mes],
  );

  const totais = useMemo(() => {
    const validos = lancamentosVisiveis.filter((item) => item.considerar !== false);
    const descontos = validos.filter((item) => item.tipo_lancamento === "DESCONTO");
    const ajustesPercentual = validos.filter((item) => item.tipo_lancamento === "AJUSTE_PERCENTUAL");
    const comissoes = validos.filter((item) => item.tipo_lancamento !== "DESCONTO");
    return {
      base: validos.filter((item) => !item.tipo_lancamento || item.tipo_lancamento === "COMISSAO").reduce((soma, item) => soma + Number(item.valor_base_comissao || 0), 0),
      comissao: comissoes.reduce((soma, item) => soma + Number(item.valor_comissao || 0), 0),
      pago: validos.filter((item) => item.pago).reduce((soma, item) => soma + Number(item.valor_comissao || 0), 0),
      aReceber: validos.filter((item) => !item.pago).reduce((soma, item) => soma + Number(item.valor_comissao || 0), 0),
      descontos: descontos.reduce((soma, item) => soma + Math.abs(Number(item.valor_comissao || 0)), 0),
      ajustesPercentual: ajustesPercentual.reduce((soma, item) => soma + Number(item.valor_comissao || 0), 0),
    };
  }, [lancamentosVisiveis]);

  const faixaAtual = useMemo(() => {
    const vendas = Number(resumoMes?.vendas_liquidas || 0);
    return [...faixasVisiveis]
      .filter((faixa) => Number(faixa.valor_meta || 0) <= vendas)
      .sort((a, b) => Number(b.valor_meta) - Number(a.valor_meta))[0];
  }, [faixasVisiveis, resumoMes]);

  const proximaFaixa = useMemo(() => {
    const vendas = Number(resumoMes?.vendas_liquidas || 0);
    return [...faixasVisiveis]
      .filter((faixa) => Number(faixa.valor_meta || 0) > vendas)
      .sort((a, b) => Number(a.valor_meta) - Number(b.valor_meta))[0];
  }, [faixasVisiveis, resumoMes]);

  const perfilRelatorio = useMemo(() => {
    if (!administrador) return perfil;
    if (exibeEquipe) return { nome: "Toda a equipe", codigo_representante: "Todos" };
    return representantesExibicao.find(
      (item) => normalizarCodigo(item.codigo_representante) === normalizarCodigo(codigoEmExibicao),
    ) || { nome: "Representante", codigo_representante: codigoEmExibicao };
  }, [administrador, codigoEmExibicao, exibeEquipe, perfil, representantesExibicao]);

  function nomeRepresentante(codigo) {
    const normalizado = normalizarCodigo(codigo);
    if (!normalizado || normalizado === CODIGO_SEM_REPRESENTANTE) return "Sem representante";
    return representantesExibicao.find(
      (item) => normalizarCodigo(item.codigo_representante) === normalizado,
    )?.nome || codigo || "-";
  }

  const metasEquipe = useMemo(
    () => resumosVisiveis
      .filter((item) => Number(item.mes) === Number(mes))
      .sort((a, b) => Number(b.vendas_liquidas || 0) - Number(a.vendas_liquidas || 0)),
    [mes, resumosVisiveis],
  );

  function imprimir() {
    document.body.classList.add("modo-impressao-comissoes");
    window.print();
    document.body.classList.remove("modo-impressao-comissoes");
  }

  if (!["admin", "representante"].includes(perfil?.tipo_perfil)) {
    return null;
  }

  return (
    <section className="painel comissoes-painel">
      <div className="comissoes-topo">
        <div>
          <span className="comissoes-sobretitulo">Área consultiva</span>
          <h2>{administrador ? "Comissões da equipe" : "Minhas comissões"}</h2>
          <p>{administrador ? "Acompanhe a equipe ou selecione um representante." : "Acompanhe valores a receber, metas e evolução anual."}</p>
        </div>
        <button type="button" className="comissoes-imprimir" onClick={imprimir}>
          <Printer size={17} /> Imprimir / salvar PDF
        </button>
      </div>

      {mensagem && (
        <div className={demonstrativo ? "comissoes-aviso demo" : "comissoes-aviso"}>
          {mensagem}
        </div>
      )}

      <div className="comissoes-filtros">
        {administrador && (
          <label className="comissoes-filtro-representante">
            Representante
            <select
              value={representanteSelecionado}
              onChange={(evento) => setRepresentanteSelecionado(evento.target.value)}
            >
              <option value="todos">Toda a equipe</option>
              {representantesExibicao.map((item) => (
                <option key={item.user_id || item.codigo_representante} value={item.codigo_representante}>
                  {item.nome || item.codigo_representante}
                </option>
              ))}
            </select>
          </label>
        )}
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

      <div className="comissoes-abas" role="tablist">
        <button className={aba === "receber" ? "ativo" : ""} onClick={() => setAba("receber")}>
          <CalendarDays size={17} /> A receber
        </button>
        <button className={aba === "metas" ? "ativo" : ""} onClick={() => setAba("metas")}>
          <Target size={17} /> <span className="rotulo-completo">{administrador ? "Metas da equipe" : "Minhas metas"}</span><span className="rotulo-curto">Metas</span>
        </button>
        <button className={aba === "historico" ? "ativo" : ""} onClick={() => setAba("historico")}>
          <BarChart3 size={17} /> <span className="rotulo-completo">Histórico anual</span><span className="rotulo-curto">Histórico</span>
        </button>
      </div>

      {carregando ? (
        <p className="comissoes-vazio">Carregando comissões...</p>
      ) : (
        <div className={`comissoes-relatorio comissoes-relatorio-${aba}`}>
          <CabecalhoRelatorio
            titulo={aba === "receber" ? `Comissões a receber · ${MESES[mes - 1]} de ${ano}` : aba === "metas" ? `Metas · ${MESES[mes - 1]} de ${ano}` : `Histórico anual · ${ano}`}
            perfil={perfilRelatorio}
            demonstrativo={demonstrativo}
          />

          {aba === "receber" && (
            <>
              <div className="comissoes-indicadores">
                <article><span>Base de comissão</span><strong>{moeda(totais.base)}</strong></article>
                <article><span>Comissão do mês</span><strong>{moeda(totais.comissao)}</strong></article>
                <article className="destaque"><span>A receber</span><strong>{moeda(totais.aReceber)}</strong></article>
              </div>
              {(totais.descontos > 0 || Math.abs(totais.ajustesPercentual) > 0.005) && <div className="comissoes-composicao"><span>Ajustes por percentual manual <strong>{moeda(totais.ajustesPercentual)}</strong></span><span>Descontos <strong>- {moeda(totais.descontos)}</strong></span></div>}
              <div className="comissoes-tabela-container">
                <table className="comissoes-tabela">
                  <thead><tr>{exibeEquipe && <th>Representante</th>}<th>Vencimento</th><th>Mês origem</th><th>NF</th><th>Cliente</th><th>Base</th><th>%</th><th>Comissão</th><th>Situação</th></tr></thead>
                  <tbody>
                    {lancamentosVisiveis.map((item) => (
                      <tr key={item.id || `${item.codigo_lancamento}-${item.nota_fiscal}`}>
                        {exibeEquipe && <td data-label="Representante">{nomeRepresentante(item.codigo_representante)}</td>}
                        <td data-label="Vencimento">{dataBr(item.data_vencimento)}</td>
                        <td data-label="Mês origem">{mesAnoOrigem(item.data_emissao)}</td>
                        <td data-label="Nota fiscal">
                          {item.nota_fiscal || "-"}
                          {item.nota_origem_devolucao && <small className="comissoes-nf-origem">Origem: {item.nota_origem_devolucao}</small>}
                        </td>
                        <td data-label="Cliente">{item.tipo_lancamento === "DESCONTO" ? "Desconto na comissão" : item.tipo_lancamento === "AJUSTE_PERCENTUAL" ? "Ajuste de percentual" : item.nome_cliente || item.codigo_cliente || "-"}{item.motivo_ajuste && <small className="comissoes-motivo">Motivo: {item.motivo_ajuste}</small>}</td>
                        <td data-label="Base">{moeda(item.valor_base_comissao)}</td><td data-label="Percentual">{item.tipo_lancamento === "DESCONTO" || item.tipo_lancamento === "AJUSTE_PERCENTUAL" ? "-" : percentual(item.percentual_comissao)}{item.percentual_manual != null && item.tipo_lancamento === "COMISSAO" && <small className="comissoes-percentual-manual">Sistema: {percentual(item.percentual_sistema)} → manual: {percentual(item.percentual_manual)}</small>}</td><td data-label="Comissão"><strong>{moeda(item.valor_comissao)}</strong>{Math.abs(Number(item.valor_ajuste_manual || 0)) > 0.005 && item.tipo_lancamento === "COMISSAO" && <small className="comissoes-percentual-manual">Antes: {moeda(item.valor_comissao_antes)} · ajuste: {moeda(item.valor_ajuste_manual)}</small>}</td>
                        <td data-label="Situação">
                          <span className={`comissoes-status ${item.tipo_lancamento === "DESCONTO" ? "desconto" : item.tipo_lancamento === "AJUSTE_PERCENTUAL" ? "ajuste" : item.lancamento_devolucao ? "devolucao" : item.pago ? "pago" : "receber"}`}>
                            {rotuloLancamento(item)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!lancamentosVisiveis.length && <p className="comissoes-vazio">Nenhum lançamento encontrado no período.</p>}
              </div>
            </>
          )}

          {aba === "metas" && (
            <>
              {exibeEquipe ? (
                <div className="comissoes-tabela-container">
                  <table className="comissoes-tabela">
                    <thead><tr><th>Representante</th><th>Modalidade</th><th>Vendas líquidas</th><th>Meta atingida</th><th>% atual</th><th>Comissão prevista</th></tr></thead>
                    <tbody>
                      {metasEquipe.map((item) => (
                        <tr key={`${item.codigo_representante}-${item.ano}-${item.mes}`}>
                          <td data-label="Representante"><strong>{nomeRepresentante(item.codigo_representante)}</strong></td>
                          <td data-label="Modalidade">{item.modalidade === "V" ? "Por metas" : "Fixa"}</td>
                          <td data-label="Vendas líquidas">{moeda(item.vendas_liquidas)}</td>
                          <td data-label="Meta atingida">{item.modalidade === "V" ? moeda(item.meta_atingida) : "-"}</td>
                          <td data-label="Percentual atual">{percentual(item.percentual_comissao)}</td>
                          <td data-label="Comissão prevista"><strong>{moeda(item.comissao_prevista)}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!metasEquipe.length && <p className="comissoes-vazio">Nenhum resumo encontrado para a equipe.</p>}
                </div>
              ) : !faixasVisiveis.length ? (
                <p className="comissoes-vazio">Seu cadastro utiliza comissão fixa e não possui faixas de meta.</p>
              ) : (
                <>
                  <div className="comissoes-indicadores">
                    <article><span>Vendas líquidas</span><strong>{moeda(resumoMes?.vendas_liquidas)}</strong></article>
                    <article><span>Faixa atual</span><strong>{faixaAtual ? percentual(faixaAtual.percentual_comissao) : "-"}</strong></article>
                    <article className="destaque"><span>Comissão prevista</span><strong>{moeda(resumoMes?.comissao_prevista)}</strong></article>
                  </div>
                  {proximaFaixa && (
                    <div className="comissoes-progresso">
                      <div><span>Próxima meta: {moeda(proximaFaixa.valor_meta)}</span><strong>Faltam {moeda(Math.max(0, Number(proximaFaixa.valor_meta) - Number(resumoMes?.vendas_liquidas || 0)))}</strong></div>
                      <progress value={Number(resumoMes?.vendas_liquidas || 0)} max={Number(proximaFaixa.valor_meta)} />
                    </div>
                  )}
                  <div className="comissoes-faixas">
                    {faixasVisiveis.map((faixa) => (
                      <article className={faixaAtual?.valor_meta === faixa.valor_meta ? "atingida" : ""} key={faixa.id || faixa.valor_meta}>
                        <span>A partir de {moeda(faixa.valor_meta)}</span><strong>{percentual(faixa.percentual_comissao)}</strong><small>{Number(faixa.valor_fixo || 0) > 0 ? `+ ${moeda(faixa.valor_fixo)} fixos` : "Sem valor fixo"}</small>
                      </article>
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {aba === "historico" && (
            <div className="comissoes-historico-grid">
              {resumosHistorico.map((item) => {
                const descontoPago = Number(item.estorno_comissao || 0);
                const ajustePercentualManual = Number(item.valor_ajuste_percentual_manual || 0);
                const reducaoPendente = Number(item.comissao_futura_cancelada || 0);
                const comissaoGerada = Number(item.comissao_gerada || 0) || Number(item.comissao_prevista || 0) + descontoPago;
                const fixoPrevisto = Number(item.valor_fixo || 0);
                const comissaoPercentual = comissaoGerada - fixoPrevisto;
                const ajustesMes = lancamentosVisiveis.filter((lancamento) => {
                  if (!lancamento.lancamento_devolucao) return false;
                  const data = String(lancamento.data_emissao || "").slice(0, 10).split("-");
                  return Number(data[0]) === Number(item.ano) && Number(data[1]) === Number(item.mes)
                    && (exibeEquipe || normalizarCodigo(lancamento.codigo_representante) === normalizarCodigo(item.codigo_representante));
                });
                const devolucoesQueReduziramBase = lancamentosVisiveis.filter((lancamento) => {
                  if (!lancamento.lancamento_devolucao || !lancamento.competencia_origem_devolucao) return false;
                  const origem = String(lancamento.competencia_origem_devolucao).slice(0, 10).split("-");
                  return Number(origem[0]) === Number(item.ano) && Number(origem[1]) === Number(item.mes)
                    && (exibeEquipe || normalizarCodigo(lancamento.codigo_representante) === normalizarCodigo(item.codigo_representante));
                });
                return (
                <article className="comissoes-mes-card" key={`${item.codigo_representante || "equipe"}-${item.ano}-${item.mes}`}>
                  <header>
                    <div><span>Mês</span><strong>{MESES[Number(item.mes) - 1]}</strong></div>
                    <div className="comissoes-mes-prevista"><span>Líquido previsto</span><strong>{moeda(item.comissao_prevista)}</strong></div>
                  </header>
                  <section className="comissoes-mes-bloco">
                    <h4>Notas emitidas no mês</h4>
                    <dl>
                      <div><dt>Vendas emitidas</dt><dd>{moeda(item.vendas_brutas)}</dd></div>
                      {Number(item.vendas_liquidas) !== Number(item.vendas_brutas) && (
                        <div><dt>Base válida após devoluções posteriores</dt><dd>{moeda(item.vendas_liquidas)}</dd></div>
                      )}
                      <div>
                        <dt>{item.modalidade === "V" ? "Faixa válida atualmente" : "Modalidade"}</dt>
                        <dd>{item.modalidade === "V"
                          ? `${moeda(item.meta_atingida)} · ${percentual(item.percentual_comissao)}`
                          : item.modalidade === "F"
                            ? `Fixa · ${percentual(item.percentual_comissao)}`
                            : "-"}</dd>
                      </div>
                      <div><dt>Comissão percentual</dt><dd>{moeda(comissaoPercentual)}</dd></div>
                      {fixoPrevisto !== 0 && <div><dt>Fixo previsto</dt><dd>{moeda(fixoPrevisto)}</dd></div>}
                      <div className="linha-total"><dt>{fixoPrevisto !== 0 ? "Total comissão + fixo" : "Total comissão"}</dt><dd>{moeda(comissaoGerada)}</dd></div>
                      {item.percentual_manual != null && <div className="linha-detalhe"><dt>Ajuste manual vigente ({percentual(item.percentual_sistema)} → {percentual(item.percentual_manual)})</dt><dd>{moeda(ajustePercentualManual)}</dd></div>}
                      {item.percentual_manual != null && item.motivo_percentual_manual && <div className="linha-detalhe"><dt>Motivo do último ajuste manual</dt><dd>{item.motivo_percentual_manual}</dd></div>}
                    </dl>
                    {devolucoesQueReduziramBase.length > 0 && (
                      <details className="comissoes-origem-devolucoes">
                        <summary>
                          Nota{devolucoesQueReduziramBase.length > 1 ? "s" : ""} que reduziu{devolucoesQueReduziramBase.length > 1 ? "ram" : ""} a base neste mês
                        </summary>
                        {devolucoesQueReduziramBase.map((dev) => (
                          <div className="comissoes-ajuste-origem" key={dev.id}>
                            <strong>NF {dev.nota_origem_devolucao || "-"} · devolvida em {dataBr(dev.data_emissao)}</strong>
                            <span>Devolução {dev.nota_fiscal} · emissão da nota de origem: {dataBr(dev.competencia_origem_devolucao)}</span>
                            {exibeEquipe && <span>Representante: {nomeRepresentante(dev.codigo_representante)}</span>}
                            <span>Valor devolvido: {moeda(Math.abs(Number(dev.valor_parcela || 0)))} · percentual aplicado: {percentual(dev.percentual_comissao)}</span>
                          </div>
                        ))}
                      </details>
                    )}
                  </section>
                  <section className="comissoes-mes-bloco calculo ajustes-mes">
                    <h4>Ajustes por devoluções ocorridas neste mês</h4>
                    <dl>
                      <div className="linha-deducao"><dt>(−) Recuperar de valores já pagos</dt><dd>{moeda(descontoPago)}</dd></div>
                      <div><dt>Redução em lançamentos ainda pendentes</dt><dd>{moeda(reducaoPendente)}</dd></div>
                      <div className="linha-total destaque"><dt>(=) Líquido previsto neste mês</dt><dd>{moeda(item.comissao_prevista)}</dd></div>
                    </dl>
                    {ajustesMes.length ? ajustesMes.map((ajuste) => {
                      const faixaPaga = Number(ajuste.ajuste_faixa_pago || 0);
                      const faixaPendente = Number(ajuste.ajuste_faixa_pendente || 0);
                      return <div className="comissoes-ajuste-origem" key={ajuste.id}>
                        <strong>Devolução {ajuste.nota_fiscal} · origem {ajuste.nota_origem_devolucao || "-"}</strong>
                        <span>Competência original: {ajuste.competencia_origem_devolucao ? MESES[Number(String(ajuste.competencia_origem_devolucao).slice(5,7))-1] + "/" + String(ajuste.competencia_origem_devolucao).slice(0,4) : "-"}</span>
                        <span>Vendas da competência: {moeda(ajuste.vendas_competencia_original)} → {moeda(ajuste.vendas_competencia_recalculada)}</span>
                        <span>Faixa: {percentual(ajuste.percentual_faixa_original)} → {percentual(ajuste.percentual_faixa_recalculado)}</span>
                        <span>Nota devolvida — pago a recuperar: {moeda(Math.max(0,Number(ajuste.estorno_comissao || 0)-faixaPaga))} · pendente cancelado: {moeda(Math.max(0,Number(ajuste.comissao_futura_cancelada || 0)-faixaPendente))}</span>
                        <span>Demais notas da competência — pago a recuperar: {moeda(faixaPaga)} · pendente reduzido: {moeda(faixaPendente)}</span>
                      </div>;
                    }) : <p className="comissoes-sem-ajuste">Nenhuma devolução processada neste mês.</p>}
                  </section>
                  <footer><span>Comissão já marcada como paga nas notas deste mês</span><strong>{moeda(item.comissao_paga)}</strong></footer>
                </article>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default ComissoesRepresentante;
