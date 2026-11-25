import { useState } from "react";
import { Printer } from "lucide-react";
import DetalheBI from "./DetalheBI.jsx";

// Base dos painéis BI Funil e entregas, Desempenho comercial e Crédito e caixa (25/11/2026):
// mesmos utilitários, cabeçalho e filtros do BI Faturamento, para todos terem a mesma cara.

export const pad = (v) => String(v).padStart(2, "0");
export const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const deIso = (v) => new Date(`${String(v).slice(0, 10)}T12:00:00`);
export const hoje = () => iso(new Date());
export const n = (v) => Number(v || 0);
export const moeda = (v) => n(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const moedaCurta = (v) => n(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
export const pct = (v) => (v === null || v === undefined || Number.isNaN(v) ? "—" : `${(v * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`);
export const dataBR = (v) => (v ? String(v).slice(0, 10).split("-").reverse().join("/") : "—");
export const entre = (d, a, b) => !!d && d >= a && d <= b;
export const diasEntre = (a, b) => Math.round((deIso(b) - deIso(a)) / 86400000);
export const somarDias = (v, q) => { const d = deIso(v); d.setDate(d.getDate() + q); return iso(d); };
export const codigoNormal = (v) => String(v ?? "").trim().replace(/^0+(?=.)/, "");
export const chave = (...partes) => partes.map((v) => String(v ?? "").trim()).join(":");
export const mediana = (l) => { if (!l.length) return null; const s = [...l].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
export const media = (l) => (l.length ? l.reduce((a, b) => a + b, 0) / l.length : null);
export const SEM_REPRESENTANTE = "000000";

// Controle do item de pedido no CIGAM (mesma tabela do BI Faturamento).
export const CONTROLES = {
  10: "Prospect/contato", 15: "Pendente", 20: "Orçamento", 30: "Aprovado",
  34: "Aguardando produção", 35: "Em produção", 36: "Produção cancelada",
  38: "Liberado p/ faturamento", 40: "Faturado parcial", 50: "Faturado",
  85: "Suspenso", 90: "Cancelado", 95: "Baixado",
};
export const ETAPAS = [
  { id: "negociacao", rotulo: "Em negociação (10 e 20)" },
  { id: "pendente", rotulo: "Aguardando aprovação (15)" },
  { id: "carteira", rotulo: "Aprovado, a faturar (30 a 40)" },
  { id: "faturado", rotulo: "Faturado (50)" },
  { id: "fora", rotulo: "Suspenso/cancelado (85 a 95)" },
];
export const etapaDoControle = (controle) => {
  if (controle === null || controle === undefined || controle === "") return "pendente";
  const c = Number(controle);
  if (c === 50) return "faturado";
  if (c === 10 || c === 20) return "negociacao";
  if (c === 15) return "pendente";
  if (c >= 85) return "fora";
  return "carteira";
};
export const chaveItemPedido = (p) => chave(p.codigo_cliente, p.cd_pedido, p.sequencia_item);
export const chaveOrigemNota = (x) => chave(x.codigo_cliente, x.pedido_origem, x.sequencia_pedido_origem);
// Família = grupo do material (3 primeiros dígitos do código); nomes vêm de cigam-acompanhamentos?bi=grupos.
export const grupoDe = (x) => String(x.codigo_material || "").trim().slice(0, 3) || "—";
export const nomeGrupo = (grupos, k) => (grupos[k] ? grupos[k].charAt(0) + grupos[k].slice(1).toLowerCase() : `Grupo ${k}`);

function atalho(tipo) {
  const d = new Date(); const a = d.getFullYear(); const m = d.getMonth();
  const fimMes = (ano, mes) => iso(new Date(ano, mes + 1, 0));
  if (tipo === "mes") return [iso(new Date(a, m, 1)), fimMes(a, m)];
  if (tipo === "trimestre") { const t = Math.floor(m / 3) * 3; return [iso(new Date(a, t, 1)), fimMes(a, t + 2)]; }
  if (tipo === "semestre") { const t = m < 6 ? 0 : 6; return [iso(new Date(a, t, 1)), fimMes(a, t + 5)]; }
  if (tipo === "12m") return [iso(new Date(a, m - 11, 1)), fimMes(a, m)];
  return [`${a}-01-01`, `${a}-12-31`];
}
const ATALHOS = [["mes", "Mês atual"], ["trimestre", "Trimestre"], ["semestre", "Semestre"], ["ano", "Ano"], ["12m", "Últimos 12 meses"]];

export function usePeriodoBI(padrao = "semestre") {
  const [[inicio, fim], setPeriodo] = useState(() => atalho(padrao));
  return { inicio, fim, setPeriodo, atalho };
}

// Detalhe (janela igual à dos outros BIs) com exportação para Excel.
export function useDetalheBI(arquivoBase) {
  const [detalhe, setDetalhe] = useState(null);
  const abrir = (titulo, colunas, linhas, subtitulo = "") => setDetalhe({ titulo, colunas, linhas: linhas.map((l, i) => ({ id: i, ...l })), subtitulo });
  const janela = detalhe && (
    <DetalheBI titulo={detalhe.titulo} subtitulo={detalhe.subtitulo} colunas={detalhe.colunas} linhas={detalhe.linhas}
      arquivo={`${arquivoBase}_${detalhe.titulo.normalize("NFD").replace(/[^A-Za-z0-9]+/g, "_").toLowerCase()}`} onFechar={() => setDetalhe(null)} />
  );
  return { abrir, janela };
}

export function CabecalhoBI({ titulo, descricao, periodo, representantes, representante, setRepresentante, ajuda, extra }) {
  const { inicio, fim, setPeriodo, atalho: at } = periodo;
  const ativo = ATALHOS.find(([t]) => { const [a, b] = at(t); return a === inicio && b === fim; })?.[0];
  return (
    <>
      <div className="bi-topo">
        <div>
          <span className="bi-sobretitulo">Área executiva</span>
          <h2>Painel BI · {titulo}</h2>
          <p>{descricao}</p>
        </div>
        <div className="bi-topo-acoes">
          <button type="button" className="bi-imprimir" onClick={() => window.print()}><Printer size={17} /> Imprimir painel</button>
        </div>
      </div>
      <div className="bi-filtros bi-filtros-fat">
        <div className="bi-linha-filtro">
          <span className="bi-linha-rotulo">Período</span>
          <div className="bi-atalhos" role="group" aria-label="Atalhos de período">
            {ATALHOS.map(([t, r]) => <button key={t} type="button" className={ativo === t ? "ativo" : ""} onClick={() => setPeriodo(at(t))}>{r}</button>)}
          </div>
          <label>De<input type="date" value={inicio} max={fim} onChange={(e) => setPeriodo([e.target.value, fim])} /></label>
          <label>Até<input type="date" value={fim} min={inicio} onChange={(e) => setPeriodo([inicio, e.target.value])} /></label>
        </div>
        {(representantes || extra) && (
          <div className="bi-linha-filtro">
            <span className="bi-linha-rotulo">Recortes</span>
            {representantes && (
              <label className="bi-campo-representante">Representante
                <select value={representante} onChange={(e) => setRepresentante(e.target.value)}>
                  <option value="">Todos</option>
                  {representantes.map(([c, nome]) => <option key={c} value={c}>{nome}</option>)}
                </select>
              </label>
            )}
            {extra}
          </div>
        )}
        <span className="bi-ajuda-filtro">{ajuda}</span>
      </div>
    </>
  );
}

// Tabela simples com linhas clicáveis (cada linha abre o detalhe).
export function TabelaBI({ titulo, colunas, linhas, aoClicar, nota }) {
  return (
    <section className="bi-tabela-bloco">
      <h4 className="bi-subtitulo">{titulo}</h4>
      <div className="bi-tabela-container">
        <table className="bi-tabela">
          <thead><tr>{colunas.map((c) => <th key={c.chave} className={c.num ? "num" : ""}>{c.rotulo}</th>)}</tr></thead>
          <tbody>{linhas.map((l, i) => (
            <tr key={l.chave ?? i} className={aoClicar ? "bi-linha-clicavel" : ""} onClick={aoClicar ? () => aoClicar(l) : undefined}
              tabIndex={aoClicar ? 0 : undefined} onKeyDown={aoClicar ? (e) => { if (e.key === "Enter") aoClicar(l); } : undefined}>
              {colunas.map((c) => <td key={c.chave} className={c.num ? "num" : ""}>{c.formatar ? c.formatar(l[c.chave], l) : l[c.chave]}</td>)}
            </tr>
          ))}</tbody>
        </table>
      </div>
      {nota && <p className="bi-comparativo">{nota}</p>}
    </section>
  );
}
