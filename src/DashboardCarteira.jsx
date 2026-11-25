import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, CalendarClock, Map as MapaIcone, MapPinned, TrendingDown, Users } from "lucide-react";
import MapaCarteira from "./MapaCarteira.jsx";
import AtividadeEquipe from "./AtividadeEquipe.jsx";
import { cod6, useCarteira } from "./lib/useCarteira.js";
import "./dashboard-carteira.css";

// Dashboard · Carteira (24/11/2026): cobertura de visitas e oportunidades do CIGAM.
// - Carteira = clientes que o usuário enxerga (RLS: representante só a dele; admin todos, com filtro).
// - Visita = rota_clientes com status VISITADO; data em visitado_em (gravada pelo banco desde 24/11/2026).
// - Compras = função cigam-acompanhamentos?dashboard=carteira (uma consulta de notas para a carteira toda),
//   só para quem tem "Visão geral do cliente" ou "Pedidos e notas".

const hojeISO = () => new Date().toISOString().slice(0, 10);
const dias = (de, ate = hojeISO()) => Math.round((Date.parse(`${ate}T12:00:00`) - Date.parse(`${String(de).slice(0, 10)}T12:00:00`)) / 86400000);
const dataBR = (v) => (v ? String(v).slice(0, 10).split("-").reverse().join("/") : "—");
const moeda = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
const LIMITE = 8;
// Filtros do Dashboard ficam salvos no navegador (representante, aba e UF do mapa) e voltam ao reabrir a tela.
const CHAVE_FILTROS = "radar.dashboard.filtros";
const lerFiltros = () => { try { return JSON.parse(localStorage.getItem(CHAVE_FILTROS) || "{}") || {}; } catch { return {}; } };
function useFiltroSalvo(nome, padrao) {
  const [valor, setValor] = useState(() => lerFiltros()[nome] ?? padrao);
  useEffect(() => {
    try { localStorage.setItem(CHAVE_FILTROS, JSON.stringify({ ...lerFiltros(), [nome]: valor })); } catch { /* navegador sem armazenamento */ }
  }, [nome, valor]);
  return [valor, setValor];
}
// Cliente do exterior (UF "EX") mostra o país do cadastro do CIGAM no lugar de "EXTERIOR/EX".
const local = (c) => (c.pais ? c.pais : `${c.cidade || "-"}${c.uf ? `/${c.uf}` : ""}`);
// Origem da visita, como o usuário pediu: "Rota" (marcada como visitado) ou "Acompanhamento" (VISITA/VISITA TECNICA).
const ORIGEM = { radar: "Rota", cigam: "Acompanhamento" };

// Ações do cliente: abrir a ficha, incluir numa rota aberta (escolhendo qual) ou colocar em pauta.
function Acoes({ c, acoes }) {
  const [escolhendo, setEscolhendo] = useState(false);
  const { abrirFicha, colocarPauta, adicionarNaRota, rotasAbertas = [] } = acoes;
  return (
    <div className="dcart-acoes">
      <button type="button" className="dcart-ficha" onClick={() => abrirFicha(c)}>Ficha</button>
      {adicionarNaRota && <button type="button" className="dcart-ficha" aria-expanded={escolhendo} onClick={() => setEscolhendo(!escolhendo)}>Rota</button>}
      {colocarPauta && <button type="button" className="dcart-ficha" onClick={() => colocarPauta(c)}>Pauta</button>}
      {escolhendo && (
        <div className="dcart-rotas" role="menu">
          {rotasAbertas.length ? rotasAbertas.map((r) => (
            <button key={r.id} type="button" role="menuitem" onClick={async () => { setEscolhendo(false); await adicionarNaRota(c, r); }}>
              {r.nome || `Rota ${r.id}`}<small>{r.status}{r.data_rota ? ` · ${dataBR(r.data_rota)}` : ""}</small>
            </button>
          )) : <p>Nenhuma rota aberta. Crie uma em Rotas.</p>}
        </div>
      )}
    </div>
  );
}

function Lista({ itens, vazio, colunaExtra, acoes }) {
  const [todos, setTodos] = useState(false);
  if (!itens.length) return <p className="dcart-vazio">{vazio}</p>;
  const mostrar = todos ? itens : itens.slice(0, LIMITE);
  return (
    <>
      <ul className="dcart-lista">
        {mostrar.map((c) => (
          <li key={c.id}>
            <div className="dcart-cli">
              <strong title={c.cliente}>{c.cliente || "Cliente sem nome"}</strong>
              <small>
                {local(c)} · visita: {c.ultimaVisita ? `há ${c.diasVisita} d (${ORIGEM[c.origemVisita]})` : "nunca"}
                {c.compra?.ultima && <> · compra: há {dias(c.compra.ultima)} d</>}
              </small>
            </div>
            <div className="dcart-extra">{colunaExtra(c)}</div>
            <Acoes c={c} acoes={acoes} />
          </li>
        ))}
      </ul>
      {itens.length > LIMITE && (
        <button type="button" className="dcart-mais" onClick={() => setTodos(!todos)}>
          {todos ? "mostrar menos" : `ver todos os ${itens.length}`}
        </button>
      )}
    </>
  );
}

export default function DashboardCarteira({ clientes, usuarios = [], podeCompras, mostrarValores = false, verTodos, abrirFicha, colocarPauta, adicionarNaRota, rotasAbertas }) {
  const acoes = { abrirFicha, colocarPauta, adicionarNaRota, rotasAbertas };
  const [noMapa, setNoMapa] = useState(null);
  const selecionarNoMapa = useCallback((c) => setNoMapa(c), []);
  const [detalhe, setDetalhe] = useState(null); // card aberto
  const [representanteSalvo, setRepresentante] = useFiltroSalvo("representante", "");
  const [aba, setAba] = useFiltroSalvo("aba", "pararam");
  const [ufMapa, setUfMapa] = useFiltroSalvo("ufMapa", "");
  const { lista, compras, erroCompras } = useCarteira(clientes, usuarios, podeCompras);

  const nomesRep = useMemo(() => {
    const m = new Map();
    for (const u of usuarios) if (u.codigo_representante) m.set(cod6(u.codigo_representante), u.nome);
    return m;
  }, [usuarios]);
  const representantes = useMemo(() => {
    const s = new Set((clientes || []).map((c) => cod6(c.codigo_representante)).filter(Boolean));
    return [...s].map((c) => [c, nomesRep.get(c) || `Representante ${c}`]).sort((a, b) => a[1].localeCompare(b[1], "pt-BR"));
  }, [clientes, nomesRep]);

  // Representante salvo que não existe mais na carteira (ou usuário sem "ver todos") volta para toda a carteira.
  const representante = verTodos && representantes.some(([c]) => c === representanteSalvo) ? representanteSalvo : "";
  const carteira = useMemo(() => lista.filter((c) => !representante || cod6(c.codigo_representante) === representante), [lista, representante]);
  const ufs = useMemo(() => [...new Set(carteira.map((c) => String(c.uf || "").toUpperCase()).filter(Boolean))].sort(), [carteira]);
  const ufAtiva = ufs.includes(ufMapa) ? ufMapa : "";
  const carteiraMapa = useMemo(() => (ufAtiva ? carteira.filter((c) => String(c.uf || "").toUpperCase() === ufAtiva) : carteira), [carteira, ufAtiva]);

  const total = carteira.length;
  const visitadosEm = (d) => carteira.filter((c) => c.diasVisita !== null && c.diasVisita <= d).length;
  const v30 = visitadosEm(30), v60 = visitadosEm(60), v90 = visitadosEm(90);
  const nunca = carteira.filter((c) => !c.ultimaVisita).length;
  const semVisita90 = carteira.filter((c) => c.diasVisita === null || c.diasVisita > 90);

  const hoje = hojeISO();
  // Sem "Dashboard: mostrar valores" o servidor não manda R$: usa comprou12, queda_pct e a posição no ranking.
  const comprou = (c) => (c.compra ? (c.compra.comprou12 ?? c.compra.total12 > 0) : false);
  const ordenarValor = (a, b) => (mostrarValores
    ? (b.compra?.total12 || 0) - (a.compra?.total12 || 0)
    : (a.compra?.posicao || Infinity) - (b.compra?.posicao || Infinity));
  const valor12 = (c) => (mostrarValores
    ? (c.compra?.total12 ? <><strong>{moeda(c.compra.total12)}</strong><small>em 12 meses</small></> : <small>sem compras</small>)
    : (comprou(c) ? <><strong>comprou</strong><small>nos últimos 12 meses</small></> : <small>sem compras em 12 meses</small>));
  const compramSemVisita = semVisita90.filter(comprou).sort(ordenarValor);
  // Atrasada = cliente com ritmo confiável (3+ compras) que comprou nos últimos 90 dias e já passou da
  // próxima compra prevista. Quem está há mais de 90 dias sem comprar vai para "Parados".
  const atrasada = carteira.filter((c) => c.compra?.proxima && c.compra.proxima < hoje && c.compra.compras >= 3 && dias(c.compra.ultima) <= 90)
    .sort((a, b) => dias(b.compra.proxima) - dias(a.compra.proxima));
  const parados = carteira.filter((c) => c.compra?.ultima && dias(c.compra.ultima) > 90).sort(ordenarValor);
  const pctQueda = (c) => (mostrarValores ? pct(c.compra.total24 - c.compra.total12, c.compra.total24) : c.compra.queda_pct);
  const queda = carteira.filter((c) => (mostrarValores ? c.compra?.total24 > 0 && c.compra.total12 < c.compra.total24 * 0.7 : c.compra?.queda_pct != null))
    .sort((a, b) => (mostrarValores ? (b.compra.total24 - b.compra.total12) - (a.compra.total24 - a.compra.total12) : pctQueda(b) - pctQueda(a)));

  // Pararam de comprar = cliente frequente (4+ compras, uma a cada 60 dias ou menos) que está sem comprar
  // há mais que o dobro do seu ritmo (mínimo 45 dias). Alerta antes de virar "parado".
  const pararam = carteira.filter((c) => c.compra?.frequencia && c.compra.compras >= 4 && c.compra.frequencia <= 60
    && dias(c.compra.ultima) >= Math.max(45, c.compra.frequencia * 2))
    .sort(ordenarValor);
  // Visita sem pedido = visitado entre 15 e 90 dias atrás e sem nenhuma compra desde a visita.
  const visitaSemPedido = carteira.filter((c) => c.diasVisita !== null && c.diasVisita >= 15 && c.diasVisita <= 90
    && (!c.compra?.ultima || c.compra.ultima < c.ultimaVisita))
    .sort((a, b) => ordenarValor(a, b) || b.diasVisita - a.diasVisita);

  const abas = [
    ["pararam", "Pararam de comprar", pararam],
    ["visitaSemPedido", "Visita sem pedido", visitaSemPedido],
    ["atrasada", "Compra atrasada", atrasada],
    ["parados", "Parados +90 dias", parados],
    ["queda", "Queda vs ano anterior", queda],
  ];

  return (
    <div className="dcart">
      <div className="dcart-topo">
        <h3><Users size={22} /> Carteira</h3>
        {verTodos && representantes.length > 1 && (
          <label className="dcart-filtro">
            Representante
            <select value={representante} onChange={(e) => setRepresentante(e.target.value)}>
              <option value="">Toda a carteira</option>
              {representantes.map(([c, nome]) => <option key={c} value={c}>{nome}</option>)}
            </select>
          </label>
        )}
      </div>

      <div className="dcart-kpis">
        <button type="button" className="dcart-kpi" data-aberto={detalhe === "nunca"} onClick={() => setDetalhe(detalhe === "nunca" ? null : "nunca")}>
          <span>Clientes na carteira</span><strong>{total}</strong><small>{nunca} nunca visitados · ver lista</small>
        </button>
        {[[30, v30], [60, v60], [90, v90]].map(([d, v]) => (
          <button key={d} type="button" className="dcart-kpi" data-aberto={detalhe === d} onClick={() => setDetalhe(detalhe === d ? null : d)}>
            <span>Visitados em {d} dias</span>
            <strong>{pct(v, total)}%</strong>
            <div className="dcart-barra"><i style={{ width: `${pct(v, total)}%` }} /></div>
            <small>{v} de {total} · ver quem</small>
          </button>
        ))}
      </div>
      {detalhe !== null && (
        <section className="dcart-bloco dcart-detalhe">
          <div className="dcart-bloco-topo">
            <h4>{detalhe === "nunca" ? `Nunca visitados (${nunca})` : `Visitados nos últimos ${detalhe} dias (${visitadosEm(detalhe)})`}</h4>
            <button type="button" className="dcart-mais" onClick={() => setDetalhe(null)}>fechar</button>
          </div>
          {detalhe === "nunca" ? (
            <Lista itens={carteira.filter((c) => !c.ultimaVisita).sort(ordenarValor)} acoes={acoes} vazio="Todos os clientes já foram visitados."
              colunaExtra={valor12} />
          ) : (
            <Lista itens={carteira.filter((c) => c.diasVisita !== null && c.diasVisita <= detalhe).sort((a, b) => b.ultimaVisita.localeCompare(a.ultimaVisita))}
              acoes={acoes} vazio="Nenhuma visita no período."
              colunaExtra={(c) => <><strong>{dataBR(c.ultimaVisita)}</strong><small>{c.quemVisitou || "—"} · {ORIGEM[c.origemVisita]}</small></>} />
          )}
        </section>
      )}
      <p className="dcart-nota">
        Visita = rota marcada como "visitado" ou acompanhamento VISITA / VISITA TÉCNICA (acompanhamentos atualizados às 7h, 12h e 17h). Vale a mais recente.
      </p>

      <div className="dcart-grid">
        {podeCompras && (
          <section className="dcart-bloco dcart-destaque">
            <h4><AlertTriangle size={18} /> Compram e não são visitados há +90 dias</h4>
            {compras ? (
              <Lista itens={compramSemVisita} acoes={acoes} vazio="Nenhum cliente comprador sem visita. 👍"
                colunaExtra={valor12} />
            ) : <p className="dcart-vazio">{erroCompras ? `Não foi possível buscar as compras: ${erroCompras}` : "Buscando compras…"}</p>}
          </section>
        )}

        <section className="dcart-bloco">
          <h4><MapPinned size={18} /> Sem visita há +90 dias{podeCompras && compras ? " · demais clientes" : ""}</h4>
          <Lista itens={semVisita90.filter((c) => !(podeCompras && compras && comprou(c))).sort(podeCompras ? ordenarValor : (a, b) => (b.diasVisita ?? 9999) - (a.diasVisita ?? 9999))}
            acoes={acoes} vazio="Toda a carteira foi visitada nos últimos 90 dias. 👍"
            colunaExtra={(c) => <><strong>{c.ultimaVisita ? dataBR(c.ultimaVisita) : "nunca"}</strong><small>última visita</small></>} />
        </section>
      </div>

      {podeCompras && (
        <section className="dcart-bloco">
          <div className="dcart-bloco-topo">
            <h4><CalendarClock size={18} /> Oportunidades de compra</h4>
            {compras?.historico_desde && <small>Notas desde {dataBR(compras.historico_desde)}</small>}
          </div>
          <div className="dcart-abas" role="tablist">
            {abas.map(([id, nome, lista]) => (
              <button key={id} type="button" role="tab" aria-selected={aba === id} data-active={aba === id} onClick={() => setAba(id)}>
                {nome} <span>{compras ? lista.length : "…"}</span>
              </button>
            ))}
          </div>
          {!compras ? <p className="dcart-vazio">{erroCompras ? `Não foi possível buscar as compras: ${erroCompras}` : "Buscando compras…"}</p> : (
            <>
              {aba === "pararam" && <Lista itens={pararam} acoes={acoes} vazio="Nenhum cliente frequente parou de comprar. 👍"
                colunaExtra={(c) => <><strong className="dcart-ruim">{dias(c.compra.ultima)} d sem comprar</strong><small>comprava a cada {c.compra.frequencia} d</small></>} />}
              {aba === "visitaSemPedido" && <Lista itens={visitaSemPedido} acoes={acoes} vazio="Toda visita dos últimos 90 dias teve pedido depois. 👍"
                colunaExtra={(c) => <><strong>visita {dataBR(c.ultimaVisita)}</strong><small>{c.compra?.ultima ? `últ. compra ${dataBR(c.compra.ultima)}` : "sem compras"}</small></>} />}
              {aba === "atrasada" && <Lista itens={atrasada} acoes={acoes} vazio="Nenhum cliente com compra atrasada."
                colunaExtra={(c) => <><strong className="dcart-ruim">{dias(c.compra.proxima)} d de atraso</strong><small>compra a cada {c.compra.frequencia} d</small></>} />}
              {aba === "parados" && <Lista itens={parados} acoes={acoes} vazio="Nenhum cliente parado há mais de 90 dias."
                colunaExtra={(c) => <><strong>{mostrarValores ? moeda(c.compra.total12) : `${dias(c.compra.ultima)} d`}</strong><small>últ. compra {dataBR(c.compra.ultima)}</small></>} />}
              {aba === "queda" && <Lista itens={queda} acoes={acoes}
                vazio={compras.historico_desde && dias(compras.historico_desde) < 395 ? "Ainda não há 2 anos de notas para comparar." : "Nenhum cliente com queda relevante."}
                colunaExtra={(c) => <><strong className="dcart-ruim"><TrendingDown size={14} /> {pctQueda(c)}%</strong><small>{mostrarValores ? `${moeda(c.compra.total12)} vs ${moeda(c.compra.total24)}` : "12 meses vs 12 anteriores"}</small></>} />}
            </>
          )}
        </section>
      )}

      <section className="dcart-bloco">
        <div className="dcart-bloco-topo">
          <h4><MapaIcone size={18} /> Mapa da carteira · última visita</h4>
          {ufs.length > 1 && (
            <label className="dcart-filtro">
              Região (UF)
              <select value={ufAtiva} onChange={(e) => { setUfMapa(e.target.value); setNoMapa(null); }}>
                <option value="">Todas</option>
                {ufs.map((u) => <option key={u} value={u}>{u === "EX" ? "Exterior" : u}</option>)}
              </select>
            </label>
          )}
        </div>
        <MapaCarteira key={ufAtiva || "todas"} clientes={carteiraMapa} onSelecionar={selecionarNoMapa} semFinanceiro={!mostrarValores} />
        {noMapa && (
          <ul className="dcart-lista dcart-mapa-sel">
            <li>
              <div className="dcart-cli">
                <strong title={noMapa.cliente}>{noMapa.cliente}</strong>
                <small>{local(noMapa)} · visita: {noMapa.ultimaVisita ? `${dataBR(noMapa.ultimaVisita)} (${ORIGEM[noMapa.origemVisita]}${noMapa.quemVisitou ? ` · ${noMapa.quemVisitou}` : ""})` : "nunca"}</small>
              </div>
              <div className="dcart-extra">{noMapa.compra ? valor12(noMapa) : null}</div>
              <Acoes c={noMapa} acoes={acoes} />
            </li>
          </ul>
        )}
      </section>

      <section className="dcart-bloco">
        <h4><Activity size={18} /> Atividade da equipe</h4>
        <AtividadeEquipe usuarios={usuarios} />
      </section>
    </div>
  );
}
