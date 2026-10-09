import { ArrowDown, ArrowUp } from "lucide-react";

// onClick é opcional: quando informado, o card vira um botão que abre o detalhe do número.
function StatTile({ label, valor, delta, deltaFavoravel, destaque, onClick }) {
  const temDelta = delta !== undefined && delta !== null && delta !== "";
  const clicavel = typeof onClick === "function";
  const propsClique = clicavel ? {
    role: "button",
    tabIndex: 0,
    title: "Ver detalhes",
    onClick,
    onKeyDown: (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } },
  } : {};
  return (
    <article className={`bi-stat-tile${destaque ? " destaque" : ""}${clicavel ? " clicavel" : ""}`} {...propsClique}>
      <span>{label}</span>
      <strong>{valor}</strong>
      {temDelta && (
        <small className={deltaFavoravel ? "bi-delta-bom" : "bi-delta-ruim"}>
          {deltaFavoravel ? <ArrowUp size={13} /> : <ArrowDown size={13} />}
          {delta}
        </small>
      )}
      {clicavel && <em className="bi-stat-ver">Ver detalhes ›</em>}
    </article>
  );
}

export default StatTile;
