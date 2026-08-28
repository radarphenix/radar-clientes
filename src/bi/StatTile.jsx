import { ArrowDown, ArrowUp } from "lucide-react";

function StatTile({ label, valor, delta, deltaFavoravel, destaque }) {
  const temDelta = delta !== undefined && delta !== null && delta !== "";
  return (
    <article className={`bi-stat-tile${destaque ? " destaque" : ""}`}>
      <span>{label}</span>
      <strong>{valor}</strong>
      {temDelta && (
        <small className={deltaFavoravel ? "bi-delta-bom" : "bi-delta-ruim"}>
          {deltaFavoravel ? <ArrowUp size={13} /> : <ArrowDown size={13} />}
          {delta}
        </small>
      )}
    </article>
  );
}

export default StatTile;
