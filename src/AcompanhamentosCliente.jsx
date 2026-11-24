import { useEffect, useMemo, useState } from "react";
import { supabase, supabaseAnonKey, supabaseUrl } from "./supabaseClient";

// Acompanhamentos do cliente lidos do CIGAM (somente leitura) pela função cigam-acompanhamentos.
// Detalhes da integração: INTEGRACAO_CIGAM_ESTUDO.md.

const FUNCAO = `${supabaseUrl}/functions/v1/cigam-acompanhamentos`;
const LIMITE_TEXTO = 420;

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

async function chamar(params) {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  return fetch(`${FUNCAO}?${new URLSearchParams(params)}`, {
    headers: { Authorization: `Bearer ${token}`, apikey: supabaseAnonKey },
  });
}

function Acompanhamento({ item, cliente }) {
  const [aberto, setAberto] = useState(false);
  const [baixando, setBaixando] = useState("");
  const longo = item.historico.length > LIMITE_TEXTO;
  const texto = longo && !aberto ? `${item.historico.slice(0, LIMITE_TEXTO).trimEnd()}…` : item.historico;
  const titulo = item.titulo || item.assunto || (item.automatico ? "Registro automático do CIGAM" : "Acompanhamento");
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

export default function AcompanhamentosCliente({ cliente }) {
  const [lista, setLista] = useState(null);
  const [erro, setErro] = useState("");
  const [filtro, setFiltro] = useState("comerciais");
  const [busca, setBusca] = useState("");
  const [tentativa, setTentativa] = useState(0);

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
      .catch((e) => ativo && setErro(e.message || "Falha ao consultar o CIGAM."));
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

  const grupos = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const filtrados = (lista || []).filter((a) => {
      if (filtro === "comerciais" && a.automatico) return false;
      if (filtro === "anexos" && !a.anexos.length) return false;
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
  }, [lista, filtro, busca]);

  return (
    <section className="painel acomp-painel">
      <div className="acomp-topo">
        <div>
          <span className="acomp-sobretitulo">Acompanhamentos CIGAM</span>
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
            <a href={urlPortal(cliente)} target="_blank" rel="noreferrer">Abrir no portal CIGAM</a>
          </div>
        </div>
      )}

      {!erro && lista === null && (
        <div className="acomp-carregando">
          <span className="acomp-spinner" aria-hidden="true" />
          <div>
            <strong>Buscando no CIGAM…</strong>
            <p>A primeira consulta do dia pode levar até 30 segundos.</p>
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

          {grupos.length === 0 ? (
            <div className="acomp-vazio">
              {contagem.total === 0
                ? "Este cliente ainda não tem acompanhamentos no CIGAM."
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
    </section>
  );
}
