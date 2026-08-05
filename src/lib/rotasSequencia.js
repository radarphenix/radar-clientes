export function calcularSequenciasPendentes(
  itens,
  indiceAtual = -1,
  posicaoDesejada = -1,
) {
  const pendentes = [...itens]
    .filter(
      (item) =>
        !item?.status || String(item.status).toUpperCase() === "PENDENTE",
    )
    .sort((a, b) => {
      const sequenciaA = Number(a.sequencia || 0);
      const sequenciaB = Number(b.sequencia || 0);

      if (sequenciaA !== sequenciaB) {
        return sequenciaA - sequenciaB;
      }

      return new Date(a.created_at || 0) - new Date(b.created_at || 0);
    });

  const resultado = [...itens];
  const baseSequencia =
    itens.filter(
      (item) =>
        item?.status && String(item.status).toUpperCase() !== "PENDENTE",
    ).length + 1;

  if (indiceAtual < 0 || posicaoDesejada < 0) {
    pendentes.forEach((item, indice) => {
      const indexNoOriginal = resultado.findIndex(
        (entry) => entry.id === item.id,
      );
      if (indexNoOriginal >= 0) {
        resultado[indexNoOriginal] = {
          ...resultado[indexNoOriginal],
          sequencia: baseSequencia + indice,
        };
      }
    });

    return resultado;
  }

  const alvo = Math.max(0, posicaoDesejada - baseSequencia);

  if (indiceAtual === alvo) {
    pendentes.forEach((item, indice) => {
      const indexNoOriginal = resultado.findIndex(
        (entry) => entry.id === item.id,
      );
      if (indexNoOriginal >= 0) {
        resultado[indexNoOriginal] = {
          ...resultado[indexNoOriginal],
          sequencia: baseSequencia + indice,
        };
      }
    });

    return resultado;
  }

  const [itemMovido] = pendentes.splice(indiceAtual, 1);
  pendentes.splice(alvo, 0, itemMovido);

  pendentes.forEach((item, indice) => {
    const indexNoOriginal = resultado.findIndex(
      (entry) => entry.id === item.id,
    );
    if (indexNoOriginal >= 0) {
      resultado[indexNoOriginal] = {
        ...resultado[indexNoOriginal],
        sequencia: baseSequencia + indice,
      };
    }
  });

  return resultado;
}
