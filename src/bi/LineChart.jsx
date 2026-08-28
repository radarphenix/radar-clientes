import { useMemo, useRef, useState } from "react";
import { calcularTicksEixo, numeroEixo } from "./chartUtils.js";
import { TOKENS } from "./paletteBI.js";

const VB_W = 760;
const VB_H = 300;
const ML = 60;
const MR = 150;
const MT = 18;
const MB = 34;
const PLOT_W = VB_W - ML - MR;
const PLOT_H = VB_H - MT - MB;

function LineChart({ titulo, series, formatarValor = (v) => v, area }) {
  const svgRef = useRef(null);
  const [hoverIndex, setHoverIndex] = useState(null);
  const [modoTabela, setModoTabela] = useState(false);

  const n = series[0]?.pontos?.length || 0;
  const mostrarArea = area ?? series.length === 1;

  const valorMaximo = useMemo(
    () => Math.max(0, ...series.flatMap((s) => s.pontos.map((p) => Number(p.valor) || 0))),
    [series],
  );
  const ticks = useMemo(() => calcularTicksEixo(valorMaximo, 4), [valorMaximo]);
  const topo = ticks[ticks.length - 1] || 1;

  function x(indice) {
    if (n <= 1) return ML;
    return ML + (indice / (n - 1)) * PLOT_W;
  }
  function y(valor) {
    return MT + PLOT_H - (Number(valor || 0) / topo) * PLOT_H;
  }

  const rotulosX = series[0]?.pontos?.map((p) => p.rotuloX) || [];
  const mostrarTodosRotulos = n <= 8;

  const linhas = series.map((serie) => ({
    ...serie,
    d: serie.pontos
      .map((p, indice) => `${indice === 0 ? "M" : "L"} ${x(indice)} ${y(p.valor)}`)
      .join(" "),
    areaD:
      serie.pontos
        .map((p, indice) => `${indice === 0 ? "M" : "L"} ${x(indice)} ${y(p.valor)}`)
        .join(" ") + ` L ${x(n - 1)} ${MT + PLOT_H} L ${x(0)} ${MT + PLOT_H} Z`,
  }));

  const rotulosFim = useMemo(() => {
    const brutos = series.map((serie) => ({
      nome: serie.nome,
      cor: serie.cor,
      valor: serie.pontos[n - 1]?.valor,
      y: y(serie.pontos[n - 1]?.valor),
    }));
    const ordenados = [...brutos].sort((a, b) => a.y - b.y);
    for (let i = 1; i < ordenados.length; i += 1) {
      if (ordenados[i].y - ordenados[i - 1].y < 14) {
        ordenados[i].y = ordenados[i - 1].y + 14;
      }
    }
    return ordenados;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [series, topo, n]);

  function indicePorPonteiro(clienteX) {
    const svg = svgRef.current;
    if (!svg || n <= 1) return 0;
    const rect = svg.getBoundingClientRect();
    const xViewBox = ((clienteX - rect.left) / rect.width) * VB_W;
    const relativo = (xViewBox - ML) / PLOT_W;
    return Math.min(n - 1, Math.max(0, Math.round(relativo * (n - 1))));
  }

  function aoMoverPonteiro(evento) {
    setHoverIndex(indicePorPonteiro(evento.clientX));
  }

  function aoTeclar(evento) {
    if (evento.key === "ArrowRight") {
      evento.preventDefault();
      setHoverIndex((atual) => Math.min(n - 1, (atual ?? -1) + 1));
    } else if (evento.key === "ArrowLeft") {
      evento.preventDefault();
      setHoverIndex((atual) => Math.max(0, (atual ?? n) - 1));
    } else if (evento.key === "Escape") {
      setHoverIndex(null);
    }
  }

  const tooltipVisivel = hoverIndex !== null && hoverIndex !== undefined;
  const tooltipEsquerda = tooltipVisivel ? (x(hoverIndex) / VB_W) * 100 : 0;
  const tooltipAlinharDireita = tooltipEsquerda > 60;

  return (
    <div className="bi-chart-card">
      <div className="bi-chart-cabecalho">
        <h3>{titulo}</h3>
        <button type="button" className="bi-botao-tabela" onClick={() => setModoTabela((v) => !v)}>
          {modoTabela ? "Ver gráfico" : "Ver como tabela"}
        </button>
      </div>

      {series.length >= 2 && (
        <div className="bi-legenda">
          {series.map((serie) => (
            <span key={serie.nome}>
              <i style={{ background: serie.cor }} />
              {serie.nome}
            </span>
          ))}
        </div>
      )}

      {modoTabela ? (
        <div className="bi-tabela-container">
          <table className="bi-tabela">
            <thead>
              <tr>
                <th>Período</th>
                {series.map((serie) => (
                  <th key={serie.nome}>{serie.nome}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rotulosX.map((rotulo, indice) => (
                <tr key={rotulo}>
                  <td>{rotulo}</td>
                  {series.map((serie) => (
                    <td key={serie.nome}>{formatarValor(serie.pontos[indice]?.valor)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bi-chart-svg-wrap">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            className="bi-svg"
            role="img"
            aria-label={titulo}
          >
            {ticks.map((tick) => (
              <g key={tick}>
                <line
                  x1={ML}
                  x2={VB_W - MR}
                  y1={y(tick)}
                  y2={y(tick)}
                  stroke={TOKENS.gridline}
                  strokeWidth="1"
                />
                <text x={ML - 10} y={y(tick) + 4} textAnchor="end" className="bi-eixo-texto">
                  {numeroEixo(tick)}
                </text>
              </g>
            ))}

            {rotulosX.map((rotulo, indice) => {
              if (!mostrarTodosRotulos && indice % 2 !== 0 && indice !== n - 1) return null;
              return (
                <text
                  key={`${rotulo}-${indice}`}
                  x={x(indice)}
                  y={MT + PLOT_H + 20}
                  textAnchor="middle"
                  className="bi-eixo-texto"
                >
                  {rotulo}
                </text>
              );
            })}

            {linhas.map(
              (serie) =>
                mostrarArea && (
                  <path key={`area-${serie.nome}`} d={serie.areaD} fill={serie.cor} opacity="0.1" />
                ),
            )}

            {linhas.map((serie) => (
              <path
                key={serie.nome}
                d={serie.d}
                fill="none"
                stroke={serie.cor}
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ))}

            {series.map((serie) => (
              <circle
                key={`fim-${serie.nome}`}
                cx={x(n - 1)}
                cy={y(serie.pontos[n - 1]?.valor)}
                r="5"
                fill={serie.cor}
                stroke={TOKENS.superficie}
                strokeWidth="2"
              />
            ))}

            {rotulosFim.map((rotulo) => (
              <text
                key={`rotulo-${rotulo.nome}`}
                x={x(n - 1) + 12}
                y={rotulo.y + 4}
                className="bi-rotulo-fim"
                fill={TOKENS.textoPrimario}
              >
                {formatarValor(rotulo.valor)}
              </text>
            ))}

            {tooltipVisivel && (
              <line
                x1={x(hoverIndex)}
                x2={x(hoverIndex)}
                y1={MT}
                y2={MT + PLOT_H}
                stroke={TOKENS.eixo}
                strokeWidth="1"
              />
            )}

            {tooltipVisivel &&
              series.map((serie) => (
                <circle
                  key={`hover-${serie.nome}`}
                  cx={x(hoverIndex)}
                  cy={y(serie.pontos[hoverIndex]?.valor)}
                  r="6"
                  fill={serie.cor}
                  stroke={TOKENS.superficie}
                  strokeWidth="2"
                />
              ))}

            <rect
              x={ML}
              y={MT}
              width={PLOT_W}
              height={PLOT_H}
              fill="transparent"
              tabIndex={0}
              onPointerMove={aoMoverPonteiro}
              onPointerLeave={() => setHoverIndex(null)}
              onFocus={() => setHoverIndex((atual) => (atual === null ? n - 1 : atual))}
              onBlur={() => setHoverIndex(null)}
              onKeyDown={aoTeclar}
              style={{ cursor: "crosshair" }}
            />
          </svg>

          {tooltipVisivel && (
            <div
              className="bi-tooltip"
              style={{
                left: `${tooltipEsquerda}%`,
                transform: tooltipAlinharDireita ? "translateX(-100%)" : "none",
              }}
            >
              <strong className="bi-tooltip-titulo">{rotulosX[hoverIndex]}</strong>
              {series.map((serie) => (
                <div className="bi-tooltip-linha" key={serie.nome}>
                  <span className="bi-tooltip-chave" style={{ borderColor: serie.cor }} />
                  <span className="bi-tooltip-nome">{serie.nome}</span>
                  <strong className="bi-tooltip-valor">
                    {formatarValor(serie.pontos[hoverIndex]?.valor)}
                  </strong>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default LineChart;
