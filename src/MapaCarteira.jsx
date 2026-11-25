import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Mapa da carteira (Dashboard): cada cliente com coordenadas vira um ponto colorido pela última visita
// (verde até 30 dias, amarelo até 90, vermelho acima de 90 ou nunca). Mapa aberto (OpenStreetMap).
// O enquadramento inicial ignora clientes do exterior para não abrir o mapa-múndi; o botão mostra todos.

import { FAIXAS_VISITA, faixaVisita } from "./lib/faixasVisita.js";

const corDe = (id) => FAIXAS_VISITA.find((f) => f.id === id).cor;

export default function MapaCarteira({ clientes, onSelecionar }) {
  const caixa = useRef(null);
  const mapa = useRef(null);
  const camada = useRef(null);
  const [mostrarExterior, setMostrarExterior] = useState(false);
  const [ocultas, setOcultas] = useState([]);

  useEffect(() => {
    if (!caixa.current || mapa.current) return undefined;
    mapa.current = L.map(caixa.current, { scrollWheelZoom: false, preferCanvas: true }).setView([-27, -51], 5);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(mapa.current);
    camada.current = L.layerGroup().addTo(mapa.current);
    return () => {
      mapa.current?.remove();
      mapa.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapa.current || !camada.current) return;
    camada.current.clearLayers();
    const pontos = [];
    for (const c of clientes) {
      const lat = Number(c.latitude), lng = Number(c.longitude);
      if (!lat || !lng) continue;
      const faixa = faixaVisita(c);
      if (ocultas.includes(faixa)) continue;
      const m = L.circleMarker([lat, lng], { radius: 7, color: "#fff", weight: 1.5, fillColor: corDe(faixa), fillOpacity: 0.9 });
      m.bindTooltip(`${c.cliente}<br>${c.ultimaVisita ? `visita há ${c.diasVisita} d` : "nunca visitado"}`, { direction: "top" });
      m.on("click", () => onSelecionar(c));
      m.addTo(camada.current);
      const exterior = String(c.uf || "").trim().toUpperCase() === "EX" || !!c.pais || lat > 6 || lat < -34 || lng > -34 || lng < -74;
      if (mostrarExterior || !exterior) pontos.push([lat, lng]);
    }
    if (pontos.length) mapa.current.fitBounds(pontos, { padding: [24, 24], maxZoom: 9 });
  }, [clientes, onSelecionar, mostrarExterior, ocultas]);

  const contagem = (id) => clientes.filter((c) => Number(c.latitude) && faixaVisita(c) === id).length;
  const semCoordenada = clientes.filter((c) => !Number(c.latitude)).length;

  return (
    <div className="dcart-mapa-wrap">
      <div className="dcart-mapa-legenda">
        {FAIXAS_VISITA.map((f) => (
          <button key={f.id} type="button" data-off={ocultas.includes(f.id)}
            onClick={() => setOcultas((o) => (o.includes(f.id) ? o.filter((x) => x !== f.id) : [...o, f.id]))}>
            <i style={{ background: f.cor }} /> {f.rotulo} <b>{contagem(f.id)}</b>
          </button>
        ))}
        <label className="dcart-mapa-ext"><input type="checkbox" checked={mostrarExterior} onChange={(e) => setMostrarExterior(e.target.checked)} /> enquadrar exterior</label>
      </div>
      <div ref={caixa} className="dcart-mapa" role="region" aria-label="Mapa da carteira" />
      {semCoordenada > 0 && <small className="dcart-nota">{semCoordenada} cliente(s) sem localização não aparecem no mapa.</small>}
    </div>
  );
}
