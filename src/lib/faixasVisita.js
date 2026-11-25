// Faixas de cor do mapa da carteira: pela última visita ou pelo valor comprado em 12 meses.
export const FAIXAS_VISITA = [
  { id: "verde", rotulo: "Até 30 dias", cor: "#16a34a" },
  { id: "amarelo", rotulo: "31 a 90 dias", cor: "#f59e0b" },
  { id: "vermelho", rotulo: "+90 dias ou nunca", cor: "#dc2626" },
];
export const faixaVisita = (c) => (c.diasVisita === null ? "vermelho" : c.diasVisita <= 30 ? "verde" : c.diasVisita <= 90 ? "amarelo" : "vermelho");

export const FAIXAS_VALOR = [
  { id: "v4", rotulo: "+R$ 300 mil", cor: "#4c1d95", min: 300000, raio: 12 },
  { id: "v3", rotulo: "R$ 100 a 300 mil", cor: "#7c3aed", min: 100000, raio: 10 },
  { id: "v2", rotulo: "R$ 30 a 100 mil", cor: "#a78bfa", min: 30000, raio: 8 },
  { id: "v1", rotulo: "Até R$ 30 mil", cor: "#c4b5fd", min: 0.01, raio: 7 },
  { id: "v0", rotulo: "Sem compra", cor: "#94a3b8", min: 0, raio: 5 },
];
export const faixaValor = (c) => {
  const v = Number(c.compra?.total12 || 0);
  return (FAIXAS_VALOR.find((f) => (f.id === "v0" ? v <= 0 : v >= f.min)) || FAIXAS_VALOR[4]).id;
};

// Distância em km entre dois pontos (fórmula de haversine).
export function distanciaKm(a, b) {
  const r = (x) => (x * Math.PI) / 180;
  const dLat = r(b.lat - a.lat), dLng = r(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

// Ordem de visita com menor trajeto aproximado: vizinho mais próximo a partir do primeiro escolhido,
// depois melhoria 2-opt (inverte trechos enquanto encurtar o caminho). Bom para até algumas dezenas de pontos.
export function ordenarMenorTrajeto(pontos) {
  if (pontos.length < 3) return [...pontos];
  const p = (c) => ({ lat: Number(c.latitude), lng: Number(c.longitude) });
  const resto = pontos.slice(1);
  const rota = [pontos[0]];
  while (resto.length) {
    const ult = p(rota[rota.length - 1]);
    let melhor = 0;
    for (let i = 1; i < resto.length; i++) if (distanciaKm(ult, p(resto[i])) < distanciaKm(ult, p(resto[melhor]))) melhor = i;
    rota.push(resto.splice(melhor, 1)[0]);
  }
  const d = (i, j) => distanciaKm(p(rota[i]), p(rota[j]));
  let melhorou = true;
  for (let volta = 0; melhorou && volta < 50; volta++) {
    melhorou = false;
    for (let i = 1; i < rota.length - 1; i++)
      for (let k = i + 1; k < rota.length; k++) {
        const antes = d(i - 1, i) + (k + 1 < rota.length ? d(k, k + 1) : 0);
        const depois = d(i - 1, k) + (k + 1 < rota.length ? d(i, k + 1) : 0);
        if (depois + 0.001 < antes) {
          rota.splice(i, k - i + 1, ...rota.slice(i, k + 1).reverse());
          melhorou = true;
        }
      }
  }
  return rota;
}

export function totalKm(lista) {
  let t = 0;
  for (let i = 1; i < lista.length; i++)
    t += distanciaKm({ lat: Number(lista[i - 1].latitude), lng: Number(lista[i - 1].longitude) }, { lat: Number(lista[i].latitude), lng: Number(lista[i].longitude) });
  return t;
}
