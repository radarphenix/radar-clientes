import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, FileSpreadsheet, X } from "lucide-react";
import * as XLSX from "xlsx";

const moeda = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dataBR = (v) => (v ? new Date(`${v}T12:00:00`).toLocaleDateString("pt-BR") : "—");

function formatar(coluna, valor) {
  if (coluna.tipo === "moeda") return moeda(valor);
  if (coluna.tipo === "data") return dataBR(valor);
  if (coluna.tipo === "numero") return Number(valor || 0).toLocaleString("pt-BR");
  return valor ?? "—";
}

// Janela de detalhe do Painel BI: mostra as linhas que compõem um número (card ou barra).
// colunas: [{ chave, rotulo, tipo: "texto" | "moeda" | "data" | "numero" }]; total opcional.
function DetalheBI({ titulo, subtitulo, colunas, linhas, total, arquivo, onFechar }) {
  const [ordem, setOrdem] = useState({ chave: null, desc: true });

  useEffect(() => {
    const aoTeclar = (e) => { if (e.key === "Escape") onFechar(); };
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [onFechar]);

  const ordenadas = useMemo(() => {
    if (!ordem.chave) return linhas;
    const coluna = colunas.find((c) => c.chave === ordem.chave);
    const numerica = coluna?.tipo === "moeda" || coluna?.tipo === "numero";
    return [...linhas].sort((a, b) => {
      const va = a[ordem.chave]; const vb = b[ordem.chave];
      const r = numerica ? Number(va || 0) - Number(vb || 0) : String(va ?? "").localeCompare(String(vb ?? ""), "pt-BR");
      return ordem.desc ? -r : r;
    });
  }, [linhas, colunas, ordem]);

  const ordenarPor = (chave) => setOrdem((o) => ({ chave, desc: o.chave === chave ? !o.desc : true }));

  function exportar() {
    const dados = ordenadas.map((l) => Object.fromEntries(colunas.map((c) => [c.rotulo, c.tipo === "data" ? dataBR(l[c.chave]) : l[c.chave]])));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dados), "Detalhe");
    XLSX.writeFile(wb, `${arquivo || "detalhe_bi"}.xlsx`);
  }

  return (
    <div className="bi-detalhe-fundo" onClick={onFechar}>
      <div className="bi-detalhe-janela" role="dialog" aria-modal="true" aria-label={titulo} onClick={(e) => e.stopPropagation()}>
        <div className="bi-detalhe-topo">
          <div>
            <h3>{titulo}</h3>
            <p>{subtitulo} · {linhas.length} linha(s){total !== undefined && <> · <strong>{moeda(total)}</strong></>}</p>
          </div>
          <div className="bi-detalhe-acoes">
            <button type="button" className="bi-botao-tabela" onClick={exportar} disabled={!linhas.length}><FileSpreadsheet size={13} /> Exportar Excel</button>
            <button type="button" className="bi-detalhe-fechar" onClick={onFechar} aria-label="Fechar"><X size={18} /></button>
          </div>
        </div>
        {linhas.length ? <div className="bi-tabela-container bi-detalhe-tabela"><table className="bi-tabela">
          <thead><tr>{colunas.map((c) => (
            <th key={c.chave} className={c.tipo === "moeda" || c.tipo === "numero" ? "num" : ""}>
              <button type="button" className="bi-th-ordenar" onClick={() => ordenarPor(c.chave)}>
                {c.rotulo}
                {ordem.chave === c.chave && (ordem.desc ? <ArrowDown size={11} /> : <ArrowUp size={11} />)}
              </button>
            </th>
          ))}</tr></thead>
          <tbody>{ordenadas.map((l, i) => <tr key={l.id ?? i}>{colunas.map((c) => (
            <td key={c.chave} className={c.tipo === "moeda" || c.tipo === "numero" ? "num" : ""} title={c.tipo === "texto" ? String(l[c.chave] ?? "") : undefined}>{formatar(c, l[c.chave])}</td>
          ))}</tr>)}</tbody>
        </table></div> : <p className="bi-vazio">Nada para mostrar neste recorte.</p>}
      </div>
    </div>
  );
}

export default DetalheBI;
