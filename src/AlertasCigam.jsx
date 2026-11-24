import { codigoCigam } from "./lib/cigamAcompanhamentos.js";

// Selos de alerta do CIGAM no cliente da rota: título vencido e tempo sem comprar.
// Dados: useAlertasCigam (função cigam-acompanhamentos?alertas=), respeitando as permissões da ficha.

export const DIAS_SEM_COMPRA_ALERTA = 90;

const moedaCurta = (v) =>
  Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function diasDesde(data) {
  if (!data) return null;
  return Math.floor((Date.now() - new Date(`${data}T12:00:00`).getTime()) / 86400000);
}

export default function AlertasCigam({ alertas, codigo }) {
  const a = alertas?.[codigoCigam(codigo)];
  if (!a) return null;
  const selos = [];
  if (a.vencido > 0) {
    selos.push(
      <span key="v" className="alerta-cigam vencido" title={`${a.vencidos} título(s) vencido(s); maior atraso ${a.maior_atraso} dias`}>
        {moedaCurta(a.vencido)} vencido · {a.maior_atraso}d
      </span>,
    );
  }
  if ("ultima_compra" in a) {
    const dias = diasDesde(a.ultima_compra);
    if (dias === null) selos.push(<span key="c" className="alerta-cigam compra">Sem compras</span>);
    else if (dias >= DIAS_SEM_COMPRA_ALERTA)
      selos.push(
        <span key="c" className="alerta-cigam compra" title={`Última nota em ${a.ultima_compra.split("-").reverse().join("/")}`}>
          {dias} dias sem comprar
        </span>,
      );
  }
  return selos.length ? <div className="alertas-cigam">{selos}</div> : null;
}
