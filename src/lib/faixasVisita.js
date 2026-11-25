// Faixas de cor do mapa da carteira pela última visita.
export const FAIXAS_VISITA = [
  { id: "verde", rotulo: "Até 30 dias", cor: "#16a34a" },
  { id: "amarelo", rotulo: "31 a 90 dias", cor: "#f59e0b" },
  { id: "vermelho", rotulo: "+90 dias ou nunca", cor: "#dc2626" },
];
export const faixaVisita = (c) => (c.diasVisita === null ? "vermelho" : c.diasVisita <= 30 ? "verde" : c.diasVisita <= 90 ? "amarelo" : "vermelho");
