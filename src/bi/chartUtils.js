export function calcularTicksEixo(valorMaximo, quantidade = 4, inteiro = false) {
  if (!valorMaximo || valorMaximo <= 0) return [0];
  const passoBruto = valorMaximo / quantidade;
  const potencia = 10 ** Math.floor(Math.log10(passoBruto));
  const normalizado = passoBruto / potencia;
  let passo;
  if (normalizado <= 1) passo = potencia;
  else if (normalizado <= 2) passo = 2 * potencia;
  else if (normalizado <= 5) passo = 5 * potencia;
  else passo = 10 * potencia;
  if (inteiro) passo = Math.max(1, Math.round(passo));

  const topo = Math.ceil(valorMaximo / passo) * passo;
  const ticks = [];
  for (let v = 0; v <= topo + passo / 2; v += passo) {
    ticks.push(Math.round(v * 100) / 100);
  }
  return ticks;
}

export function numeroEixo(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", { maximumFractionDigits: 0 });
}
