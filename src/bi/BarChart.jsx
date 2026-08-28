import { useMemo, useState } from "react";
import { calcularTicksEixo, numeroEixo } from "./chartUtils.js";

function BarChart({ titulo, itens, orientacao = "horizontal", formatarValor = (v) => v, corPadrao, valoresInteiros }) {
  const [hoverIndice, setHoverIndice] = useState(null);
  const [modoTabela, setModoTabela] = useState(false);

  const valorMaximo = useMemo(
    () => Math.max(0, ...itens.map((item) => Number(item.valor) || 0)),
    [itens],
  );
  const ticks = useMemo(() => calcularTicksEixo(valorMaximo, 4, valoresInteiros), [valorMaximo, valoresInteiros]);
  const topo = ticks[ticks.length - 1] || 1;
  const rotularCadaBarra = orientacao === "horizontal" || itens.length <= 6;

  const corDe = (item) => item.cor || corPadrao;
  const proporcao = (valor) => {
    const numero = Number(valor) || 0;
    return numero > 0 ? Math.max(1, (numero / topo) * 100) : 0;
  };

  return (
    <div className="bi-chart-card">
      <div className="bi-chart-cabecalho">
        <h3>{titulo}</h3>
        <button type="button" className="bi-botao-tabela" onClick={() => setModoTabela((v) => !v)}>
          {modoTabela ? "Ver gráfico" : "Ver como tabela"}
        </button>
      </div>

      {!itens.length ? (
        <p className="bi-vazio">Sem dados para o período selecionado.</p>
      ) : modoTabela ? (
        <div className="bi-tabela-container">
          <table className="bi-tabela">
            <thead>
              <tr>
                <th>Item</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {itens.map((item) => (
                <tr key={item.rotulo}>
                  <td>{item.rotulo}</td>
                  <td>{formatarValor(item.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : orientacao === "horizontal" ? (
        <div className="bi-barh-corpo">
          <div className="bi-barh-overlay">
            <div className="bi-barh-overlay-trilho">
              {ticks.map((tick) => (
                <span key={tick} style={{ left: `${(tick / topo) * 100}%` }}>
                  <em>{numeroEixo(tick)}</em>
                </span>
              ))}
            </div>
          </div>
          <div className="bi-barh-linhas">
            {itens.map((item, indice) => (
              <div
                className={`bi-barh-linha${hoverIndice === indice ? " ativo" : ""}`}
                key={item.rotulo}
                tabIndex={0}
                onMouseEnter={() => setHoverIndice(indice)}
                onMouseLeave={() => setHoverIndice(null)}
                onFocus={() => setHoverIndice(indice)}
                onBlur={() => setHoverIndice(null)}
              >
                <span className="bi-barh-rotulo" title={item.rotulo}>{item.rotulo}</span>
                <div className="bi-barh-trilho">
                  <div
                    className="bi-barh-preenchimento"
                    style={{ width: `${proporcao(item.valor)}%`, background: corDe(item) }}
                  />
                </div>
                <strong className="bi-barh-valor">{formatarValor(item.valor)}</strong>
                {hoverIndice === indice && (
                  <div className="bi-tooltip bi-tooltip-barra">
                    <strong className="bi-tooltip-titulo">{item.rotulo}</strong>
                    <div className="bi-tooltip-linha">
                      <span className="bi-tooltip-chave" style={{ borderColor: corDe(item) }} />
                      <strong className="bi-tooltip-valor">{formatarValor(item.valor)}</strong>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bi-barv-corpo">
          <div className="bi-barv-plot">
            {ticks.map((tick) => (
              <div key={tick} className="bi-barv-gridline" style={{ bottom: `${(tick / topo) * 100}%` }}>
                <em>{numeroEixo(tick)}</em>
              </div>
            ))}
            <div className="bi-barv-colunas">
              {itens.map((item, indice) => (
                <div
                  className="bi-barv-coluna"
                  key={item.rotulo}
                  tabIndex={0}
                  onMouseEnter={() => setHoverIndice(indice)}
                  onMouseLeave={() => setHoverIndice(null)}
                  onFocus={() => setHoverIndice(indice)}
                  onBlur={() => setHoverIndice(null)}
                >
                  {rotularCadaBarra && <span className="bi-barv-valor">{formatarValor(item.valor)}</span>}
                  <div
                    className={`bi-barv-barra${hoverIndice === indice ? " ativo" : ""}`}
                    style={{ height: `${proporcao(item.valor)}%`, background: corDe(item) }}
                  />
                  {hoverIndice === indice && (
                    <div className="bi-tooltip bi-tooltip-coluna">
                      <strong className="bi-tooltip-titulo">{item.rotulo}</strong>
                      <div className="bi-tooltip-linha">
                        <span className="bi-tooltip-chave" style={{ borderColor: corDe(item) }} />
                        <strong className="bi-tooltip-valor">{formatarValor(item.valor)}</strong>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="bi-barv-rotulos">
            {itens.map((item) => (
              <span key={item.rotulo}>{item.rotulo}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default BarChart;
