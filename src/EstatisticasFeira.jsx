import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";
import BarChart from "./bi/BarChart.jsx";
import StatTile from "./bi/StatTile.jsx";
import { CATEGORICAL, SEQUENCIAL_ORDINAL } from "./bi/paletteBI.js";
import "./bi-panel.css";

// Aba "Estatísticas" do painel da promoção: números por dia da feira (horário de Brasília).
// Inscrições e cadastros de produtos vêm das próprias tabelas (leitura de admin); cliques e
// acessos vêm de eventos_por_hora_veste_phenix (já agrupados por dia/hora no banco).
const FUSO = "America/Sao_Paulo";
const fmtDia = new Intl.DateTimeFormat("en-CA", { timeZone: FUSO, year: "numeric", month: "2-digit", day: "2-digit" });
const fmtHora = new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, hour: "2-digit", hourCycle: "h23" });
const diaSP = (ts) => fmtDia.format(new Date(ts));
const horaSP = (ts) => Number(fmtHora.format(new Date(ts)));
const rotuloDia = (d) => {
  const [a, m, dd] = d.split("-").map(Number);
  const semana = new Date(a, m - 1, dd).toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
  return `${String(dd).padStart(2, "0")}/${String(m).padStart(2, "0")} (${semana})`;
};
const TODOS = "todos";

const NOME_EVENTO = {
  acesso_promocao: "Acessos à página (link/QR)",
  inscricao_concluida: "Inscrições concluídas",
  menu_veste_phenix: "Menu: Veste Phenix",
  menu_cadastro_produtos: "Menu: Cadastro de Produtos",
  menu_vestcontrol: "Menu: VestControl",
};

// Agrupa por texto livre ignorando caixa/acentos/espaços; mostra a grafia mais usada.
// chaveDe (opcional) define o agrupamento; sem ela, agrupa pelo próprio texto.
const normalizar = (t) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
function contarPor(linhas, campo, limite, chaveDe) {
  const grupos = new Map();
  for (const l of linhas) {
    const bruto = String(l[campo] ?? "").trim() || "Não informado";
    const chave = chaveDe ? chaveDe(l, bruto) : normalizar(bruto);
    const g = grupos.get(chave) || { valor: 0, grafias: new Map() };
    g.valor += 1;
    g.grafias.set(bruto, (g.grafias.get(bruto) || 0) + 1);
    grupos.set(chave, g);
  }
  // Com chaveDe (ex.: domínio do e-mail), a mesma empresa pode cair em grupos diferentes
  // (suzano.com.br e e-mail pessoal com "Suzano"); grupos com o mesmo nome exibido se juntam.
  const porNome = new Map();
  for (const g of grupos.values()) {
    const rotulo = [...g.grafias.entries()].sort((a, b) => b[1] - a[1])[0][0];
    const k = normalizar(rotulo);
    const atual = porNome.get(k) || { rotulo, valor: 0 };
    atual.valor += g.valor;
    porNome.set(k, atual);
  }
  const itens = [...porNome.values()]
    .sort((a, b) => b.valor - a.valor || a.rotulo.localeCompare(b.rotulo));
  return limite ? itens.slice(0, limite) : itens;
}

// Empresa: e-mail corporativo agrupa pelo domínio (ex.: "Fernandez" e "Fernandez Papel" juntos);
// e-mail pessoal (gmail, hotmail...) cai no nome digitado.
const PROVEDORES_PESSOAIS = /^(gmail|googlemail|hotmail|outlook|live|msn|yahoo|ymail|icloud|me|uol|bol|terra|ig|globo|globomail|r7|zipmail)\./;
const chaveEmpresa = (l, bruto) => {
  const dominio = String(l.email || "").split("@")[1]?.toLowerCase() || "";
  return dominio && !PROVEDORES_PESSOAIS.test(dominio) ? `@${dominio}` : normalizar(bruto);
};
// Cidade: ignora o sufixo de UF digitado junto ("Amparo SP", "Amparo-SP", "Amparo/SP").
const SUFIXO_UF = /\s*[-/,]?\s*\b([A-Za-z]{2})$/;
const semUF = (texto, uf) => {
  const m = texto.match(SUFIXO_UF);
  return m && texto.length > m[0].length && m[1].toUpperCase() === String(uf || "").toUpperCase() ? texto.slice(0, -m[0].length).trim() : texto;
};
const chaveCidade = (l, bruto) => normalizar(semUF(bruto, l.uf));
const rotuloCidade = (t) => t.replace(/\s*[-/,]\s*[A-Z]{2}$|\s+[A-Z]{2}$/, "").trim();

const pct = (parte, total) => (total ? `${Math.round((parte / total) * 100)}%` : "—");

function MapaCalor({ inscricoes, dias }) {
  const [hover, setHover] = useState(null);
  const contagem = new Map();
  for (const i of inscricoes) {
    const k = `${diaSP(i.criado_em)}|${horaSP(i.criado_em)}`;
    contagem.set(k, (contagem.get(k) || 0) + 1);
  }
  const horas = inscricoes.map((i) => horaSP(i.criado_em));
  const hIni = Math.min(8, ...horas);
  const hFim = Math.max(19, ...horas);
  const colunas = Array.from({ length: hFim - hIni + 1 }, (_, i) => hIni + i);
  const maximo = Math.max(1, ...contagem.values());
  // Faixas de quantidade (ordinal): 0 = vazio; 1..4 = passos do azul, claro -> escuro.
  const faixa = (v) => (v ? Math.min(3, Math.floor(((v - 1) / maximo) * 4)) : -1);
  const limites = [1, 2, 3, 4].map((n) => Math.ceil((maximo * n) / 4));

  return (
    <div className="bi-chart-card estat-mapa">
      <div className="bi-chart-cabecalho">
        <h3>Inscrições por dia e hora</h3>
      </div>
      {!inscricoes.length ? (
        <p className="bi-vazio">Sem inscrições ainda.</p>
      ) : (
        <>
          <div className="estat-mapa-rolagem">
            <table className="estat-mapa-grade">
              <thead>
                <tr>
                  <th />
                  {colunas.map((h) => (
                    <th key={h}>{String(h).padStart(2, "0")}h</th>
                  ))}
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {dias.map((d) => {
                  const total = colunas.reduce((s, h) => s + (contagem.get(`${d}|${h}`) || 0), 0);
                  return (
                    <tr key={d}>
                      <th>{rotuloDia(d)}</th>
                      {colunas.map((h) => {
                        const v = contagem.get(`${d}|${h}`) || 0;
                        const f = faixa(v);
                        const ativo = hover === `${d}|${h}`;
                        return (
                          <td key={h}>
                            <span
                              className={`estat-celula${f >= 2 ? " escura" : ""}${ativo ? " ativo" : ""}`}
                              style={{ background: f < 0 ? undefined : SEQUENCIAL_ORDINAL[f] }}
                              tabIndex={v ? 0 : -1}
                              onMouseEnter={() => setHover(`${d}|${h}`)}
                              onMouseLeave={() => setHover(null)}
                              onFocus={() => setHover(`${d}|${h}`)}
                              onBlur={() => setHover(null)}
                              aria-label={`${rotuloDia(d)}, ${h}h: ${v} inscrições`}
                            >
                              {v || ""}
                              {ativo && (
                                <span className="bi-tooltip estat-tooltip">
                                  <strong className="bi-tooltip-titulo">{rotuloDia(d)} · {String(h).padStart(2, "0")}h–{String(h + 1).padStart(2, "0")}h</strong>
                                  <span className="bi-tooltip-linha">{v} {v === 1 ? "inscrição" : "inscrições"}</span>
                                </span>
                              )}
                            </span>
                          </td>
                        );
                      })}
                      <td className="estat-total">{total}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="estat-legenda">
            <span>Menos</span>
            {SEQUENCIAL_ORDINAL.map((c, i) => (
              <span key={c} className="estat-legenda-item">
                <i style={{ background: c }} />
                {i === 0 ? `1–${limites[0]}` : `${limites[i - 1] + 1}–${limites[i]}`}
              </span>
            )).filter((_, i) => i === 0 || limites[i] > limites[i - 1])}
            <span>Mais</span>
          </div>
        </>
      )}
    </div>
  );
}

export default function EstatisticasFeira() {
  const [inscricoes, setInscricoes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [dia, setDia] = useState(null);
  const [atualizadoEm, setAtualizadoEm] = useState(null);

  async function carregar() {
    setCarregando(true);
    const [ri, rp, re] = await Promise.all([
      supabase
        .from("promocao_veste_phenix_30_anos")
        .select("criado_em,empresa,email,segmento,uf,cidade,relacao_phenix,aceite_marketing,email_status,status,origem")
        .neq("origem", "formulario_teste")
        .order("criado_em"),
      supabase.from("cadastro_produtos_feira_phenix").select("criado_em,grupo_id,empresa,produto").is("excluido_em", null),
      supabase.rpc("eventos_por_hora_veste_phenix"),
    ]);
    setErro(ri.error ? "Não foi possível carregar as inscrições." : "");
    if (!ri.error) setInscricoes(ri.data || []);
    if (!rp.error) setProdutos(rp.data || []);
    if (!re.error) setEventos(re.data || []);
    setAtualizadoEm(new Date());
    setCarregando(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carregamento inicial
    carregar();
  }, []);

  // Dias com algum movimento (inscrição, cadastro ou clique), do mais antigo ao mais novo.
  const dias = useMemo(() => {
    const s = new Set([
      ...inscricoes.map((i) => diaSP(i.criado_em)),
      ...produtos.map((p) => diaSP(p.criado_em)),
      ...eventos.map((e) => e.dia),
    ]);
    return [...s].sort();
  }, [inscricoes, produtos, eventos]);
  const diaAtivo = dia ?? (dias.length ? dias[dias.length - 1] : TODOS);
  const noDia = (d) => diaAtivo === TODOS || d === diaAtivo;

  const insc = useMemo(() => inscricoes.filter((i) => noDia(diaSP(i.criado_em))), [inscricoes, diaAtivo]); // eslint-disable-line react-hooks/exhaustive-deps
  const prod = useMemo(() => produtos.filter((p) => noDia(diaSP(p.criado_em))), [produtos, diaAtivo]); // eslint-disable-line react-hooks/exhaustive-deps
  const ev = useMemo(() => eventos.filter((e) => noDia(e.dia)), [eventos, diaAtivo]); // eslint-disable-line react-hooks/exhaustive-deps
  const somaEvento = (nome, origem) =>
    ev.filter((e) => e.evento === nome && (!origem || e.origem === origem)).reduce((s, e) => s + Number(e.total), 0);

  const porHora = useMemo(() => {
    const c = new Map();
    for (const i of insc) c.set(horaSP(i.criado_em), (c.get(horaSP(i.criado_em)) || 0) + 1);
    const hs = [...c.keys()];
    const ini = Math.min(8, ...hs);
    const fim = Math.max(19, ...hs);
    return Array.from({ length: fim - ini + 1 }, (_, k) => ({ rotulo: `${String(ini + k).padStart(2, "0")}h`, valor: c.get(ini + k) || 0 }));
  }, [insc]);
  const pico = porHora.reduce((m, h) => (h.valor > m.valor ? h : m), { rotulo: "—", valor: 0 });

  const acessos = somaEvento("acesso_promocao");
  const inscViaLink = somaEvento("inscricao_concluida", "direto") + somaEvento("inscricao_concluida", "qrcode");
  const maquinas = new Set(prod.map((p) => p.grupo_id)).size;
  const falhasEmail = insc.filter((i) => ["falhou", "aguardando_configuracao"].includes(i.email_status)).length;
  const cor = CATEGORICAL.vendas;
  const comCor = (itens) => itens.map((i) => ({ ...i, cor }));

  const cliques = Object.entries(NOME_EVENTO).map(([chave, rotulo]) => ({ rotulo, valor: somaEvento(chave), cor }));

  // Imprimir/PDF: o CSS de impressão (promocao.css) mostra só esta aba enquanto a classe estiver no body.
  function imprimir() {
    document.body.classList.add("modo-impressao-estat");
    window.print();
    document.body.classList.remove("modo-impressao-estat");
  }
  const periodo = diaAtivo === TODOS
    ? dias.length ? `Período todo: ${rotuloDia(dias[0])} a ${rotuloDia(dias[dias.length - 1])}` : "Período todo"
    : `Dia ${rotuloDia(diaAtivo)}`;

  return (
    <div className="bi-painel estat-feira">
      <header className="estat-cabecalho-impressao">
        <img src="/phenix-30-anos-transparente.png" alt="Phenix 30 anos" />
        <div>
          <h2>Veste Phenix 30 anos · Estatísticas da feira</h2>
          <p>{periodo} · gerado em {new Date().toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</p>
        </div>
      </header>
      <div className="estat-filtros">
        <div className="estat-dias" role="group" aria-label="Dia da feira">
          {dias.map((d) => (
            <button key={d} type="button" className={diaAtivo === d ? "ativo" : ""} onClick={() => setDia(d)}>
              {rotuloDia(d)}
            </button>
          ))}
          <button type="button" className={diaAtivo === TODOS ? "ativo" : ""} onClick={() => setDia(TODOS)}>
            Período todo
          </button>
        </div>
        <button type="button" className="promocao-botao-secundario" onClick={carregar} disabled={carregando}>
          {carregando ? "Atualizando…" : "Atualizar"}
        </button>
        <button type="button" onClick={imprimir} disabled={carregando}>
          Imprimir / PDF
        </button>
        {atualizadoEm && <span className="estat-atualizado">atualizado às {atualizadoEm.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>}
      </div>
      {erro && <p className="mensagem-erro">{erro}</p>}

      <div className="bi-kpis">
        <StatTile destaque label="Inscrições" valor={insc.length} />
        <StatTile label="Empresas diferentes" valor={contarPor(insc, "empresa", 0, chaveEmpresa).length} />
        <StatTile label="Acessos à página (link/QR)" valor={acessos} />
        <StatTile label="Conversão link/QR → inscrição" valor={pct(inscViaLink, acessos)} />
        <StatTile label="Horário de pico" valor={pico.valor ? `${pico.rotulo} (${pico.valor})` : "—"} />
        <StatTile label="Aceitaram receber novidades" valor={pct(insc.filter((i) => i.aceite_marketing).length, insc.length)} />
        <StatTile label="E-mails com falha" valor={falhasEmail} />
        <StatTile label="Cadastros de produtos" valor={maquinas ? `${maquinas} (${prod.length} itens)` : 0} />
      </div>

      <div className="bi-graficos-grid">
        <BarChart titulo="Inscrições por hora" orientacao="vertical" itens={porHora} corPadrao={cor} valoresInteiros />
        <BarChart titulo="Segmento" itens={comCor(contarPor(insc, "segmento"))} valoresInteiros />
        <BarChart titulo="Estado (UF)" itens={comCor(contarPor(insc, "uf"))} valoresInteiros />
        <BarChart titulo="Relação com a Phenix" itens={comCor(contarPor(insc, "relacao_phenix"))} valoresInteiros />
        <BarChart titulo="Empresas com mais inscrições" itens={comCor(contarPor(insc, "empresa", 10, chaveEmpresa))} valoresInteiros />
        <BarChart titulo="Cliques no menu da feira e acessos" itens={cliques} valoresInteiros />
        <BarChart titulo="Cadastros de produtos por produto" itens={comCor(contarPor(prod, "produto"))} valoresInteiros />
        <BarChart titulo="Cidades" itens={comCor(contarPor(insc, "cidade", 10, chaveCidade).map((c) => ({ ...c, rotulo: rotuloCidade(c.rotulo) })))} valoresInteiros />
      </div>

      <MapaCalor inscricoes={inscricoes} dias={dias.filter((d) => inscricoes.some((i) => diaSP(i.criado_em) === d))} />
      <p className="estat-nota">
        Empresas são agrupadas pelo domínio do e-mail corporativo (quem usou e-mail pessoal entra pelo nome digitado);
        cidades ignoram maiúsculas, acentos e a sigla do estado digitada junto. Os cliques e acessos começaram a ser contados em 06/10 às 15h.
      </p>
    </div>
  );
}
