// Paleta validada (scripts/validate_palette.js do skill dataviz) para o Painel BI.
// Categórica: azul do módulo de comissões + laranja de referência (ΔE CVD 29.4, normal 40.0).
export const CATEGORICAL = {
  vendas: "#0057d8",
  comissao: "#eb6834",
};

// Ramp ordinal azul (4 passos, claro->escuro) — só pra categorias com ordem real
// (faixas de meta). Nunca usar como ramp de valor em categorias nominais
// (representantes, clientes) — validado com --ordinal.
export const SEQUENCIAL_ORDINAL = ["#86b6ef", "#3987e5", "#256abf", "#104281"];

// Tokens de chrome do gráfico (texto/grid), do reference palette.md do skill.
export const TOKENS = {
  textoPrimario: "#0b0b0b",
  textoSecundario: "#52514e",
  textoMudo: "#898781",
  gridline: "#e1e0d9",
  eixo: "#c3c2b7",
  deltaBom: "#006300",
  deltaRuim: "#d03b3b",
  superficie: "#fcfcfb",
};
