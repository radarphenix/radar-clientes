import { useMemo } from "react";
import MapaCarteira from "./MapaCarteira.jsx";
import { useCarteira } from "./lib/useCarteira.js";

// Rotas → Planejamento → "Adicionar pelo mapa": o mesmo mapa da carteira do Dashboard, só com a cor por última
// visita (sem a visão financeira, pedido do usuário em 25/11/2026), em modo de seleção. Os escolhidos entram no fim da rota aberta, na
// ordem de menor trajeto entre eles; o "Ordenar por distância" da rota reorganiza o conjunto depois.
export default function MapaPlanejamentoRota({ clientes, clientesDaRota, usuarios, podeCompras, adicionarVariosNaRota }) {
  // Sem visão financeira: nem carrega as compras.
  const { lista } = useCarteira(clientes, usuarios, false);
  const jaNaRota = useMemo(() => new Set((clientesDaRota || []).map((x) => x.cliente_id)), [clientesDaRota]);
  return (
    <section className="dcart-bloco dmapa-planejamento">
      <h4>Adicionar clientes pelo mapa</h4>
      <MapaCarteira clientes={lista} onAdicionar={adicionarVariosNaRota} jaNaRota={jaNaRota} semFinanceiro />
    </section>
  );
}
