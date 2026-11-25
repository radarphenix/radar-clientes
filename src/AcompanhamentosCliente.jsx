import { useEffect, useMemo, useState } from "react";
import { chamarAcompanhamentosCigam as chamar } from "./lib/cigamAcompanhamentos.js";
import { NotasCigam, PedidosCigam, TitulosCigam, VisaoGeralCigam } from "./FichaCigam.jsx";

// Acompanhamentos do cliente lidos do CIGAM (somente leitura) pela função cigam-acompanhamentos.
// Detalhes da integração: INTEGRACAO_CIGAM_ESTUDO.md.

const LIMITE_TEXTO = 420;
const CHAVE_TITULOS = "radar.acompanhamentos.titulos";

const tituloDe = (a) => a.titulo || (a.automatico ? "Registro automático" : "Sem título");

function lerTitulosSalvos() {
  try {
    const v = JSON.parse(localStorage.getItem(CHAVE_TITULOS) || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function salvarTitulos(lista) {
  try {
    if (lista.length) localStorage.setItem(CHAVE_TITULOS, JSON.stringify(lista));
    else localStorage.removeItem(CHAVE_TITULOS);
  } catch {
    /* sem armazenamento: vale só nesta tela */
  }
}

const codigoCigam = (cliente) => String(cliente?.codigo_cliente || "").replace(/\D/g, "").padStart(6, "0");
const urlPortal = (cliente) =>
  `https://phenixportais.cigam.cloud/portalrepresentante/ge/acompanhamento/pesquisa/${codigoCigam(cliente)}`;

function formatarData(data) {
  if (!data) return "-";
  const [ano, mes, dia] = String(data).slice(0, 10).split("-");
  return dia ? `${dia}/${mes}/${ano}` : "-";
}

function mesAno(data) {
  if (!data) return "Sem data";
  const d = new Date(`${String(data).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "Sem data";
  return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }).replace(/^./, (l) => l.toUpperCase());
}

function iniciais(nome) {
  const partes = String(nome || "?").replace(/^.*? - /, "").split(/\s+/).filter(Boolean);
  return ((partes[0]?.[0] || "?") + (partes.length > 1 ? partes[partes.length - 1][0] : "")).toUpperCase();
}

function tipoArquivo(nome) {
  const ext = String(nome).split(".").pop().toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp", "bmp", "heic"].includes(ext)) return "imagem";
  if (ext === "pdf") return "pdf";
  if (["xls", "xlsx", "csv"].includes(ext)) return "planilha";
  if (["doc", "docx", "txt", "rtf"].includes(ext)) return "texto";
  if (["zip", "rar", "7z"].includes(ext)) return "compactado";
  return "arquivo";
}

const ROTULO_ARQUIVO = { imagem: "IMG", pdf: "PDF", planilha: "XLS", texto: "DOC", compactado: "ZIP", arquivo: "ARQ" };

function Acompanhamento({ item, cliente }) {
  const [aberto, setAberto] = useState(false);
  const [baixando, setBaixando] = useState("");
  const longo = item.historico.length > LIMITE_TEXTO;
  const texto = longo && !aberto ? `${item.historico.slice(0, LIMITE_TEXTO).trimEnd()}…` : item.historico;
  const titulo = item.titulo || item.assunto || (item.automatico ? "Registro automático" : "Acompanhamento");
  const assuntoExtra = item.titulo && item.assunto ? item.assunto : "";

  async function baixar(nome) {
    setBaixando(nome);
    try {
      const r = await chamar({ cliente: codigoCigam(cliente), arquivo: nome });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error || `Erro ${r.status}`);
      }
      const url = URL.createObjectURL(await r.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = nome;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (e) {
      alert(`Não foi possível baixar o anexo: ${e.message}`);
    } finally {
      setBaixando("");
    }
  }

  return (
    <article className="acomp-item" data-automatico={item.automatico}>
      <span className="acomp-dot" aria-hidden="true" />
      <div className="acomp-card">
        <header className="acomp-card-topo">
          <span className="acomp-avatar" title={item.usuario}>{iniciais(item.usuario)}</span>
          <div className="acomp-card-titulos">
            <strong className="acomp-titulo">{titulo}</strong>
            <span className="acomp-meta">
              {item.usuario || "Usuário não informado"}
              {item.contato ? ` · com ${item.contato}` : ""}
            </span>
          </div>
          <time className="acomp-data">
            {formatarData(item.data)}
            {item.hora ? <small>{item.hora}</small> : null}
          </time>
        </header>

        {assuntoExtra && <p className="acomp-assunto">{assuntoExtra}</p>}

        {texto && (
          <p className="acomp-texto">
            {texto}
            {longo && (
              <button type="button" className="acomp-ver-mais" onClick={() => setAberto(!aberto)}>
                {aberto ? "ver menos" : "ver mais"}
              </button>
            )}
          </p>
        )}

        {(item.data_prevista || item.data_realizada || item.automatico) && (
          <div className="acomp-etiquetas">
            {item.automatico && <span className="acomp-etiqueta neutra">Automático</span>}
            {item.data_prevista && <span className="acomp-etiqueta">Previsto {formatarData(item.data_prevista)}</span>}
            {item.data_realizada && <span className="acomp-etiqueta ok">Realizado {formatarData(item.data_realizada)}</span>}
          </div>
        )}

        {(item.anexos.length > 0 || item.link) && (
          <div className="acomp-anexos">
            {item.anexos.map((nome) => {
              const tipo = tipoArquivo(nome);
              return (
                <button
                  type="button"
                  key={nome}
                  className="acomp-anexo"
                  onClick={() => baixar(nome)}
                  disabled={baixando === nome}
                  title={`Baixar ${nome}`}
                >
                  <span className={`acomp-anexo-icone ${tipo}`}>{ROTULO_ARQUIVO[tipo]}</span>
                  <span className="acomp-anexo-nome">{baixando === nome ? "Baixando…" : nome}</span>
                </button>
              );
            })}
            {item.link && (
              <a className="acomp-anexo" href={item.link} target="_blank" rel="noreferrer">
                <span className="acomp-anexo-icone arquivo">URL</span>
                <span className="acomp-anexo-nome">Abrir link</span>
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

export default function AcompanhamentosCliente({ cliente, podeVendas = false, podeVisao = false, podeFinanceiro = false }) {
  const abas = [
    ...(podeVisao ? [{ id: "visao", nome: "Visão geral", curto: "Geral" }] : []),
    { id: "acomp", nome: "Acompanhamentos", curto: "Acomp." },
    ...(podeVendas ? [{ id: "pedidos", nome: "Pedidos" }, { id: "notas", nome: "Notas" }] : []),
    ...(podeFinanceiro ? [{ id: "titulos", nome: "Financeiro", curto: "Financ." }] : []),
  ];
  const inicial = podeVisao ? "visao" : "acomp";
  const [aba, setAba] = useState(inicial);
  // Aba já aberta fica montada (escondida) para não consultar o CIGAM de novo ao voltar nela.
  const [visitadas, setVisitadas] = useState(["acomp", inicial]);
  function abrirAba(id) {
    setAba(id);
    if (!visitadas.includes(id)) setVisitadas([...visitadas, id]);
  }
  const [lista, setLista] = useState(null);
  const [erro, setErro] = useState("");
  const [filtro, setFiltro] = useState("comerciais");
  const [busca, setBusca] = useState("");
  const [tentativa, setTentativa] = useState(0);
  // Títulos escolhidos (vazio = todos). Fica salvo no aparelho e vale para os próximos clientes.
  const [titulosSel, setTitulosSel] = useState(lerTitulosSalvos);

  function alternarTitulo(t) {
    const novo = titulosSel.includes(t) ? titulosSel.filter((x) => x !== t) : [...titulosSel, t];
    setTitulosSel(novo);
    salvarTitulos(novo);
  }

  function limparTitulos() {
    setTitulosSel([]);
    salvarTitulos([]);
  }

  useEffect(() => {
    let ativo = true;
    chamar({ cliente: codigoCigam(cliente) })
      .then(async (r) => {
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error || `Erro ${r.status}`);
        if (!ativo) return;
        const recebidos = j.acompanhamentos || [];
        // Sem acompanhamentos "comerciais", abre já em "Tudo" para não mostrar a tela vazia.
        if (recebidos.length && !recebidos.some((a) => !a.automatico)) setFiltro("todos");
        setLista(recebidos);
      })
      .catch((e) => ativo && setErro(e.message || "Falha na consulta."));
    return () => {
      ativo = false;
    };
  }, [cliente, tentativa]);

  const contagem = useMemo(() => {
    const l = lista || [];
    const comerciais = l.filter((a) => !a.automatico);
    return {
      total: l.length,
      comerciais: comerciais.length,
      anexos: l.filter((a) => a.anexos.length).length,
      ultimo: comerciais[0]?.data || l[0]?.data || null,
    };
  }, [lista]);

  // Títulos presentes neste cliente (respeitando Comerciais/Com anexos/Tudo), com contagem.
  const titulos = useMemo(() => {
    const mapa = new Map();
    for (const a of lista || []) {
      if (filtro === "comerciais" && a.automatico) continue;
      if (filtro === "anexos" && !a.anexos.length) continue;
      const t = tituloDe(a);
      mapa.set(t, (mapa.get(t) || 0) + 1);
    }
    return [...mapa.entries()].sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0], "pt-BR"));
  }, [lista, filtro]);

  // Só valem os títulos escolhidos que existem neste cliente; senão a tela ficaria vazia sem motivo aparente.
  const titulosAtivos = useMemo(
    () => titulosSel.filter((t) => titulos.some(([nome]) => nome === t)),
    [titulosSel, titulos],
  );

  const grupos = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const filtrados = (lista || []).filter((a) => {
      if (filtro === "comerciais" && a.automatico) return false;
      if (filtro === "anexos" && !a.anexos.length) return false;
      if (titulosAtivos.length && !titulosAtivos.includes(tituloDe(a))) return false;
      if (!termo) return true;
      return [a.titulo, a.assunto, a.historico, a.usuario, a.contato, ...a.anexos].join(" ").toLowerCase().includes(termo);
    });
    const mapa = new Map();
    for (const a of filtrados) {
      const chave = mesAno(a.data);
      if (!mapa.has(chave)) mapa.set(chave, []);
      mapa.get(chave).push(a);
    }
    return [...mapa.entries()];
  }, [lista, filtro, busca, titulosAtivos]);

  return (
    <section className="painel acomp-painel">
      <div className="acomp-topo">
        <div>
          {abas.length === 1 && <span className="acomp-sobretitulo">Acompanhamentos</span>}
          <h2>{cliente.cliente || "Cliente sem nome"}</h2>
          <p className="acomp-sub">
            <span><strong>Código:</strong> {codigoCigam(cliente)}</span>
            <span>
              <strong>Cidade:</strong> {cliente.cidade || "-"}
              {cliente.uf ? ` / ${cliente.uf}` : ""}
            </span>
          </p>
        </div>
        <a className="acomp-portal" href={urlPortal(cliente)} target="_blank" rel="noreferrer">
          Abrir no portal
        </a>
      </div>

      {abas.length > 1 && (
        <nav className="ficha-abas" role="tablist">
          {abas.map((a) => (
            <button key={a.id} type="button" role="tab" aria-selected={aba === a.id} data-active={aba === a.id} onClick={() => abrirAba(a.id)}>
              {a.curto ? (
                <>
                  <span className="ficha-aba-longo">{a.nome}</span>
                  <span className="ficha-aba-curto">{a.curto}</span>
                </>
              ) : (
                a.nome
              )}
            </button>
          ))}
        </nav>
      )}

      {visitadas.includes("visao") && (
        <div hidden={aba !== "visao"}>
          <VisaoGeralCigam cliente={codigoCigam(cliente)} clienteId={cliente?.id} acompanhamentos={erro ? [] : lista} podeFinanceiro={podeFinanceiro} podeVendas={podeVendas} irPara={abrirAba} />
        </div>
      )}
      {visitadas.includes("pedidos") && <div hidden={aba !== "pedidos"}><PedidosCigam cliente={codigoCigam(cliente)} /></div>}
      {visitadas.includes("notas") && <div hidden={aba !== "notas"}><NotasCigam cliente={codigoCigam(cliente)} /></div>}
      {visitadas.includes("titulos") && <div hidden={aba !== "titulos"}><TitulosCigam cliente={codigoCigam(cliente)} /></div>}

      <div hidden={aba !== "acomp"}>
      {erro && (
        <div className="acomp-aviso erro">
          <p>Não foi possível carregar os acompanhamentos: {erro}</p>
          <div>
            <button
              type="button"
              onClick={() => {
                setErro("");
                setLista(null);
                setTentativa((t) => t + 1);
              }}
            >
              Tentar de novo
            </button>
            <a href={urlPortal(cliente)} target="_blank" rel="noreferrer">Abrir no portal</a>
          </div>
        </div>
      )}

      {!erro && lista === null && (
        <div className="acomp-carregando">
          <span className="acomp-spinner" aria-hidden="true" />
          <div>
            <strong>Buscando acompanhamentos…</strong>
            <p>Se a conexão tiver expirado, pode levar até 20 segundos.</p>
          </div>
        </div>
      )}

      {lista && (
        <>
          <div className="acomp-resumo">
            <div><strong>{contagem.comerciais}</strong><span>Acompanhamentos</span></div>
            <div><strong>{contagem.anexos}</strong><span>Com anexos</span></div>
            <div><strong>{formatarData(contagem.ultimo)}</strong><span>Último registro</span></div>
          </div>

          <div className="acomp-filtros">
            <div className="acomp-chips">
              <button type="button" className="chip-historico" data-active={filtro === "comerciais"} onClick={() => setFiltro("comerciais")}>
                Comerciais <span>{contagem.comerciais}</span>
              </button>
              <button type="button" className="chip-historico" data-active={filtro === "anexos"} onClick={() => setFiltro("anexos")}>
                Com anexos <span>{contagem.anexos}</span>
              </button>
              <button type="button" className="chip-historico" data-active={filtro === "todos"} onClick={() => setFiltro("todos")}>
                Tudo <span>{contagem.total}</span>
              </button>
            </div>
            <input
              type="search"
              className="acomp-busca"
              placeholder="Buscar no texto, usuário ou anexo"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          {titulos.length > 1 && (
            <div className="acomp-titulos">
              <div className="acomp-titulos-topo">
                <span>
                  Títulos <small>{titulosAtivos.length ? `${titulosAtivos.length} selecionado(s)` : "todos"}</small>
                </span>
                {titulosAtivos.length > 0 && (
                  <button type="button" className="acomp-titulos-limpar" onClick={limparTitulos}>
                    Mostrar todos
                  </button>
                )}
              </div>
              <div className="acomp-chips">
                {titulos.map(([nome, qtd]) => (
                  <button
                    type="button"
                    key={nome}
                    className="chip-historico"
                    data-active={titulosAtivos.includes(nome)}
                    aria-pressed={titulosAtivos.includes(nome)}
                    onClick={() => alternarTitulo(nome)}
                  >
                    {nome} <span>{qtd}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {grupos.length === 0 ? (
            <div className="acomp-vazio">
              {contagem.total === 0
                ? "Este cliente ainda não tem acompanhamentos."
                : "Nenhum acompanhamento com esse filtro."}
            </div>
          ) : (
            grupos.map(([mes, itens]) => (
              <div key={mes} className="acomp-grupo">
                <div className="historico-marco-mes">{mes}</div>
                <div className="acomp-timeline">
                  {itens.map((item) => (
                    <Acompanhamento key={item.id} item={item} cliente={cliente} />
                  ))}
                </div>
              </div>
            ))
          )}
        </>
      )}
      </div>
    </section>
  );
}
