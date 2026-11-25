import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { FAIXAS_VALOR, FAIXAS_VISITA, faixaValor, faixaVisita, ordenarMenorTrajeto, totalKm } from "./lib/faixasVisita.js";

// Mapa da carteira (Dashboard). Cor por última visita (verde/amarelo/vermelho) ou por valor comprado em
// 12 meses (roxo, ponto maior = compra mais). Modo "Montar rota": clicar nos pontos (ou "selecionar o que
// está na tela") e criar a rota já na ordem de menor trajeto (ajuste fino depois em Rotas → Reordenar).
// Mapa aberto (OpenStreetMap). O enquadramento inicial ignora clientes do exterior.

const hojeISO = () => new Date().toISOString().slice(0, 10);

function PainelRota({ escolhidos, setEscolhidos, criarRota, usuarios, podeEscolherResponsavel, usuarioAtual }) {
  const [nome, setNome] = useState("");
  const [data, setData] = useState(hojeISO());
  const [responsavel, setResponsavel] = useState(usuarioAtual || "");
  const [gravando, setGravando] = useState(false);
  const ordem = useMemo(() => ordenarMenorTrajeto(escolhidos), [escolhidos]);
  const km = totalKm(ordem);
  async function criar() {
    if (!ordem.length) return;
    setGravando(true);
    const nomeFinal = nome.trim() || `Rota ${ordem[0].cidade || ""} ${data.split("-").reverse().join("/")}`.replace(/\s+/g, " ").trim();
    const ok = await criarRota({ nome: nomeFinal, data, responsavel: responsavel || usuarioAtual, clientes: ordem });
    setGravando(false);
    if (ok) { setEscolhidos([]); setNome(""); }
  }
  return (
    <div className="dmapa-painel">
      <div className="dmapa-painel-topo">
        <strong>{ordem.length} cliente(s) na rota</strong>
        {ordem.length > 1 && <small>~{Math.round(km)} km em linha reta, na ordem sugerida</small>}
      </div>
      {!ordem.length ? <p className="dcart-vazio">Clique nos pontos do mapa para incluir clientes, ou use "Selecionar o que está na tela".</p> : (
        <ol className="dmapa-ordem">
          {ordem.map((c, i) => (
            <li key={c.id}>
              <span className="dmapa-n">{i + 1}</span>
              <div><strong title={c.cliente}>{c.cliente}</strong><small>{c.pais || `${c.cidade || "-"}/${c.uf || ""}`}</small></div>
              <button type="button" className="dmapa-tirar" aria-label={`Tirar ${c.cliente}`} onClick={() => setEscolhidos(escolhidos.filter((x) => x.id !== c.id))}>×</button>
            </li>
          ))}
        </ol>
      )}
      <div className="dmapa-form">
        <label>Nome da rota<input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Oeste de SC - dezembro" /></label>
        <label>Data prevista<input type="date" value={data} onChange={(e) => setData(e.target.value)} /></label>
        {podeEscolherResponsavel && (
          <label>Responsável
            <select value={responsavel} onChange={(e) => setResponsavel(e.target.value)}>
              {usuarios.filter((u) => u.ativo !== false).map((u) => <option key={u.user_id} value={u.user_id}>{u.nome}</option>)}
            </select>
          </label>
        )}
        <div className="dmapa-botoes">
          <button type="button" className="dmapa-criar" disabled={!ordem.length || gravando} onClick={criar}>{gravando ? "Criando…" : "Criar rota"}</button>
          {ordem.length > 0 && <button type="button" className="dcart-mais" onClick={() => setEscolhidos([])}>limpar</button>}
        </div>
      </div>
    </div>
  );
}

export default function MapaCarteira({ clientes, onSelecionar, criarRota, usuarios = [], podeEscolherResponsavel, usuarioAtual }) {
  const caixa = useRef(null);
  const mapa = useRef(null);
  const camada = useRef(null);
  const [mostrarExterior, setMostrarExterior] = useState(false);
  const [ocultas, setOcultas] = useState([]);
  const [modoCor, setModoCor] = useState("visita");
  const [montando, setMontando] = useState(false);
  const [escolhidos, setEscolhidos] = useState([]);
  const faixas = modoCor === "visita" ? FAIXAS_VISITA : FAIXAS_VALOR;
  const faixaDe = modoCor === "visita" ? faixaVisita : faixaValor;
  const idsEscolhidos = useMemo(() => new Set(escolhidos.map((c) => c.id)), [escolhidos]);
  const comCoordenada = useMemo(() => clientes.filter((c) => Number(c.latitude) && Number(c.longitude)), [clientes]);
  const visiveis = useMemo(() => comCoordenada.filter((c) => !ocultas.includes(faixaDe(c))), [comCoordenada, ocultas, faixaDe]);

  useEffect(() => {
    if (!caixa.current || mapa.current) return undefined;
    mapa.current = L.map(caixa.current, { scrollWheelZoom: false, preferCanvas: true }).setView([-27, -51], 5);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(mapa.current);
    camada.current = L.layerGroup().addTo(mapa.current);
    return () => { mapa.current?.remove(); mapa.current = null; };
  }, []);

  // Painel de montagem muda a largura do mapa: avisa o Leaflet para redesenhar.
  useEffect(() => { setTimeout(() => mapa.current?.invalidateSize(), 50); }, [montando]);

  // Enquadramento só quando a carteira ou a opção do exterior muda (não a cada clique de seleção).
  useEffect(() => {
    if (!mapa.current) return;
    const pontos = comCoordenada.filter((c) => {
      const lat = Number(c.latitude), lng = Number(c.longitude);
      const exterior = String(c.uf || "").trim().toUpperCase() === "EX" || !!c.pais || lat > 6 || lat < -34 || lng > -34 || lng < -74;
      return mostrarExterior || !exterior;
    }).map((c) => [Number(c.latitude), Number(c.longitude)]);
    if (pontos.length) mapa.current.fitBounds(pontos, { padding: [24, 24], maxZoom: 9 });
  }, [comCoordenada, mostrarExterior]);

  useEffect(() => {
    if (!camada.current) return;
    camada.current.clearLayers();
    for (const c of visiveis) {
      const faixa = faixas.find((f) => f.id === faixaDe(c));
      const escolhido = idsEscolhidos.has(c.id);
      const m = L.circleMarker([Number(c.latitude), Number(c.longitude)], {
        radius: (faixa.raio || 7) + (escolhido ? 2 : 0), color: escolhido ? "#0f172a" : "#fff", weight: escolhido ? 3 : 1.5,
        fillColor: faixa.cor, fillOpacity: 0.9,
      });
      const valor = c.compra?.total12 ? ` · ${Number(c.compra.total12).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })} em 12 meses` : "";
      m.bindTooltip(`${c.cliente}<br>${c.ultimaVisita ? `visita há ${c.diasVisita} d` : "nunca visitado"}${valor}`, { direction: "top" });
      m.on("click", () => {
        if (montando) setEscolhidos((e) => (e.some((x) => x.id === c.id) ? e.filter((x) => x.id !== c.id) : [...e, c]));
        else onSelecionar(c);
      });
      m.addTo(camada.current);
    }
  }, [visiveis, faixas, faixaDe, idsEscolhidos, montando, onSelecionar]);

  function selecionarNaTela() {
    const b = mapa.current?.getBounds();
    if (!b) return;
    const naTela = visiveis.filter((c) => b.contains([Number(c.latitude), Number(c.longitude)]));
    setEscolhidos((e) => [...e, ...naTela.filter((c) => !e.some((x) => x.id === c.id))].slice(0, 60));
  }

  const contagem = (id) => comCoordenada.filter((c) => faixaDe(c) === id).length;
  const semCoordenada = clientes.length - comCoordenada.length;

  return (
    <div className="dcart-mapa-wrap">
      <div className="dcart-mapa-legenda">
        <div className="dmapa-modo" role="group" aria-label="Cor dos pontos">
          <button type="button" data-active={modoCor === "visita"} onClick={() => { setModoCor("visita"); setOcultas([]); }}>Última visita</button>
          <button type="button" data-active={modoCor === "valor"} onClick={() => { setModoCor("valor"); setOcultas([]); }}>Valor de compra</button>
        </div>
        {faixas.map((f) => (
          <button key={f.id} type="button" data-off={ocultas.includes(f.id)}
            onClick={() => setOcultas((o) => (o.includes(f.id) ? o.filter((x) => x !== f.id) : [...o, f.id]))}>
            <i style={{ background: f.cor }} /> {f.rotulo} <b>{contagem(f.id)}</b>
          </button>
        ))}
        <label className="dcart-mapa-ext"><input type="checkbox" checked={mostrarExterior} onChange={(e) => setMostrarExterior(e.target.checked)} /> enquadrar exterior</label>
      </div>
      {criarRota && (
        <div className="dmapa-acoes">
          <button type="button" className={montando ? "dmapa-criar" : "dcart-ficha"} onClick={() => setMontando(!montando)}>
            {montando ? "Sair de montar rota" : "Montar rota pelo mapa"}
          </button>
          {montando && <button type="button" className="dcart-ficha" onClick={selecionarNaTela}>Selecionar o que está na tela</button>}
          {montando && <small>Clique nos pontos para incluir ou tirar. As cores escondidas na legenda não entram.</small>}
        </div>
      )}
      <div className={montando ? "dmapa-layout montando" : "dmapa-layout"}>
        <div ref={caixa} className="dcart-mapa" role="region" aria-label="Mapa da carteira" />
        {montando && <PainelRota escolhidos={escolhidos} setEscolhidos={setEscolhidos} criarRota={criarRota} usuarios={usuarios}
          podeEscolherResponsavel={podeEscolherResponsavel} usuarioAtual={usuarioAtual} />}
      </div>
      {semCoordenada > 0 && <small className="dcart-nota">{semCoordenada} cliente(s) sem localização não aparecem no mapa.</small>}
    </div>
  );
}
