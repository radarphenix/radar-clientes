import { useEffect, useState } from "react";
import RotasLista from "./RotasLista.jsx";
import RotasTopoDetalhe from "./RotasTopoDetalhe.jsx";
import RotasOperacao from "./RotasOperacao.jsx";
import RotasManutencao from "./RotasManutencao.jsx";
import RotasPlanejamento from "./RotasPlanejamento.jsx";
import RotasBarraAcoes from "./RotasBarraAcoes.jsx";
import { MessageCircle } from "lucide-react";

const MODO_TELA_ROTA_STORAGE_KEY = "radarClientes:modoTelaRota";
const MODOS_TELA_ROTA = new Set(["lista", "execucao", "planejamento"]);

function carregarModoTelaRotaSalvo() {
  const modoSalvo = window.localStorage.getItem(MODO_TELA_ROTA_STORAGE_KEY);

  return MODOS_TELA_ROTA.has(modoSalvo) ? modoSalvo : "lista";
}

function Rotas({
  rotas,
  nomeNovaRota,
  setNomeNovaRota,
  criarRota,
  abrirRota,
  rotaSelecionada,
  clientesDaRota,
  historicoWhatsAppRota,
  buscaClienteRota,
  setBuscaClienteRota,
  clientes,
  adicionarClienteNaRota,
  abrirMaps,
  removerClienteDaRota,
  fecharRota,
  alterarStatusClienteRota,
  excluirRota,
  reabrirRota,
  abrirRotaCompleta,
  alterarSequenciaClienteRota,
finalizarRota,
perfil,
usuarioId,
abrirAcompanhamento,
avisarProximoClienteRota,
reenviarAvisoWhatsAppCliente,
permiteAvisoWhatsAppRotaGrupoAtual,
ordenarRotaPorDistancia,
usuariosPerfis,
usuarioResponsavelRota,
setUsuarioResponsavelRota,
filtroResponsavelRotas,
setFiltroResponsavelRotas,
alterarResponsavelRota,
filtroStatusRotas,
setFiltroStatusRotas,
}) {
  const [modoReordenar, setModoReordenar] = useState(false);
const clienteAtual = clientesDaRota.find(
  (item) =>
    item.status === "PENDENTE" ||
    !item.status
);

const [abaRota, setAbaRota] = useState("operacao");
const [modoTelaRota, setModoTelaRota] = useState(carregarModoTelaRotaSalvo);
const [modalHistoricoWhatsAppAberto, setModalHistoricoWhatsAppAberto] = useState(false);

useEffect(() => {
  window.localStorage.setItem(MODO_TELA_ROTA_STORAGE_KEY, modoTelaRota);
}, [modoTelaRota]);

const proximosClientes = clientesDaRota.filter(
  (item) =>
    item.id !== clienteAtual?.id &&
    (item.status === "PENDENTE" || !item.status)
);

const totalClientes = clientesDaRota.length;

const totalVisitados = clientesDaRota.filter(
  (item) => item.status === "VISITADO"
).length;

const totalCancelados = clientesDaRota.filter(
  (item) => item.status === "CANCELADO"
).length;

const totalPendentes = clientesDaRota.filter(
  (item) =>
    item.status === "PENDENTE" ||
    !item.status
).length;

const totalAvisosPendentes = clientesDaRota.filter(
  (item) =>
    (item.status === "PENDENTE" || !item.status) &&
    !item.aviso_whatsapp_em
).length;

const totalAvisadosWhatsApp = clientesDaRota.filter(
  (item) => item.aviso_whatsapp_em
).length;

const percentualConcluido =
  totalClientes > 0
    ? Math.round(
        ((totalVisitados + totalCancelados) /
          totalClientes) *
          100
      )
    : 0;

  function formatarDataHoraAviso(valor) {
    if (!valor) {
      return "Data indisponivel";
    }

    const data = new Date(valor);

    if (Number.isNaN(data.getTime())) {
      return "Data invalida";
    }

    return data.toLocaleString("pt-BR");
  }

  function rotuloStatusAviso(status) {
    if (status === "ENVIADO_ABERTURA") {
      return "Enviado por abertura";
    }

    return status || "Status nao informado";
  }


  function buscarCliente(item) {
    return clientes.find((cli) => cli.id === item.cliente_id);
  }



  return (
  <section className="painel">
    {!rotaSelecionada ? (
      <RotasLista
  rotas={rotas}
  nomeNovaRota={nomeNovaRota}
  setNomeNovaRota={setNomeNovaRota}
  criarRota={criarRota}
  abrirRota={abrirRota}
  abrirRotaCompleta={abrirRotaCompleta}
  excluirRota={excluirRota}
  perfil={perfil}
usuariosPerfis={usuariosPerfis}
usuarioResponsavelRota={usuarioResponsavelRota}
setUsuarioResponsavelRota={setUsuarioResponsavelRota}
  setAbaRota={setAbaRota}
  setModoTelaRota={setModoTelaRota}
  filtroResponsavelRotas={filtroResponsavelRotas}
setFiltroResponsavelRotas={setFiltroResponsavelRotas}
filtroStatusRotas={filtroStatusRotas}
setFiltroStatusRotas={setFiltroStatusRotas}
/>
      ) : (
        <>
        <RotasTopoDetalhe
  rotaSelecionada={rotaSelecionada}
  clientesDaRota={clientesDaRota}
  abrirRota={abrirRota}
  setModoTelaRota={setModoTelaRota}
      />


          {rotaSelecionada.observacao && (
  <div className="historico-rota">
    <strong>Histórico:</strong>
    <span>{rotaSelecionada.observacao}</span>
  </div>
)}

<div className="painel-aviso-whatsapp-rota">
  <div>
    <strong>Aviso de visita por WhatsApp</strong>
    <span>
      {totalAvisadosWhatsApp} avisados · {totalAvisosPendentes} pendentes
    </span>
    {!permiteAvisoWhatsAppRotaGrupoAtual && (
      <span>
        Envio desativado para o grupo {perfil?.tipo_perfil || "usuario"}.
      </span>
    )}
  </div>

  <button
    type="button"
    onClick={avisarProximoClienteRota}
    disabled={!totalAvisosPendentes || !permiteAvisoWhatsAppRotaGrupoAtual}
  >
    <MessageCircle size={16} />
    Avisar proximo cliente
  </button>

  <button
    type="button"
    className="btn-secundario-whatsapp"
    onClick={() => setModalHistoricoWhatsAppAberto(true)}
  >
    Ver historico
  </button>
</div>

{modoTelaRota === "execucao" && (
  <>
          

          {buscaClienteRota.trim() !== "" && (
            <div className="grid-clientes">
              {clientes
                .filter((cliente) => {
                  const termo = buscaClienteRota.toLowerCase();

                  return (
                    cliente.cliente?.toLowerCase().includes(termo) ||
                    cliente.codigo_cliente?.toLowerCase().includes(termo) ||
                    cliente.cidade?.toLowerCase().includes(termo)
                  );
                })
                .slice(0, 20)
                .map((cliente) => (
                  <div className="card-cliente" key={cliente.id}>
                    <h3>{cliente.cliente}</h3>
                    <p><strong>Código:</strong> {cliente.codigo_cliente}</p>
                    <p><strong>Cidade:</strong> {cliente.cidade} / {cliente.uf}</p>

                    <button type="button" onClick={() => adicionarClienteNaRota(cliente)}>
                      Adicionar
                    </button>
                  </div>
                ))}
            </div>
          )}

          <RotasBarraAcoes
  rotaSelecionada={rotaSelecionada}
  buscaClienteRota={buscaClienteRota}
  setBuscaClienteRota={setBuscaClienteRota}
  fecharRota={fecharRota}
  reabrirRota={reabrirRota}
  finalizarRota={finalizarRota}
  modoReordenar={modoReordenar}
  setModoReordenar={setModoReordenar}
  abaRota={abaRota}
  setAbaRota={setAbaRota}
/>

{abaRota === "operacao" && (
  <RotasOperacao
    rotaSelecionada={rotaSelecionada}
    clientesDaRota={clientesDaRota}
    buscaClienteRota={buscaClienteRota}
    setBuscaClienteRota={setBuscaClienteRota}
    clientes={clientes}
    adicionarClienteNaRota={adicionarClienteNaRota}
    fecharRota={fecharRota}
    modoReordenar={modoReordenar}
    setModoReordenar={setModoReordenar}
    abaRota={abaRota}
    setAbaRota={setAbaRota}
    clienteAtual={clienteAtual}
    proximosClientes={proximosClientes}
    totalClientes={totalClientes}
    totalVisitados={totalVisitados}
    totalPendentes={totalPendentes}
    totalCancelados={totalCancelados}
    percentualConcluido={percentualConcluido}
    buscarCliente={buscarCliente}
    alterarSequenciaClienteRota={alterarSequenciaClienteRota}
    alterarStatusClienteRota={alterarStatusClienteRota}
    abrirMaps={abrirMaps}
    abrirAcompanhamento={abrirAcompanhamento}
    reenviarAvisoWhatsAppCliente={reenviarAvisoWhatsAppCliente}
    permiteAvisoWhatsAppRotaGrupoAtual={permiteAvisoWhatsAppRotaGrupoAtual}
    reabrirRota={reabrirRota}
  />

)}

{abaRota === "manutencao" && (
  <RotasManutencao
    clientesDaRota={clientesDaRota}
    rotaSelecionada={rotaSelecionada}
    buscarCliente={buscarCliente}
    modoReordenar={modoReordenar}
    alterarSequenciaClienteRota={alterarSequenciaClienteRota}
    alterarStatusClienteRota={alterarStatusClienteRota}
    abrirMaps={abrirMaps}
    removerClienteDaRota={removerClienteDaRota}
  />
)} 
  </>
)}

{modoTelaRota === "planejamento" && (
  <RotasPlanejamento
    rotaSelecionada={rotaSelecionada}
    clientesDaRota={clientesDaRota}
    clientes={clientes}
    buscaClienteRota={buscaClienteRota}
    setBuscaClienteRota={setBuscaClienteRota}
    buscarCliente={buscarCliente}
    adicionarClienteNaRota={adicionarClienteNaRota}
    removerClienteDaRota={removerClienteDaRota}
    alterarSequenciaClienteRota={alterarSequenciaClienteRota}
    fecharRota={fecharRota}
    modoReordenar={modoReordenar}
    setModoReordenar={setModoReordenar}
    reabrirRota={reabrirRota}
perfil={perfil}
usuarioId={usuarioId}
ordenarRotaPorDistancia={ordenarRotaPorDistancia}
usuariosPerfis={usuariosPerfis}
alterarResponsavelRota={alterarResponsavelRota}
reenviarAvisoWhatsAppCliente={reenviarAvisoWhatsAppCliente}
permiteAvisoWhatsAppRotaGrupoAtual={permiteAvisoWhatsAppRotaGrupoAtual}
finalizarRota={finalizarRota}
  />
)}

{modalHistoricoWhatsAppAberto && (
  <div className="modal-historico-whatsapp-overlay" onClick={() => setModalHistoricoWhatsAppAberto(false)}>
    <div className="modal-historico-whatsapp" onClick={(e) => e.stopPropagation()}>
      <div className="modal-historico-whatsapp-topo">
        <div>
          <h3>Historico de envios do WhatsApp</h3>
          <span>{historicoWhatsAppRota.length} registro(s)</span>
        </div>

        <button
          type="button"
          className="btn-fechar-modal-historico"
          onClick={() => setModalHistoricoWhatsAppAberto(false)}
        >
          Fechar
        </button>
      </div>

      {historicoWhatsAppRota.length === 0 ? (
        <p className="painel-historico-whatsapp-vazio">
          Nenhum envio de WhatsApp registrado para esta rota.
        </p>
      ) : (
        <div className="lista-historico-whatsapp-rota">
          {historicoWhatsAppRota.slice(0, 40).map((evento) => (
            <div className="item-historico-whatsapp-rota" key={evento.id || `${evento.rota_cliente_id}-${evento.enviado_em}`}>
              <div>
                <strong>{evento.cliente_nome || "Cliente sem nome"}</strong>
                <span>{rotuloStatusAviso(evento.status)}</span>
              </div>

              <div>
                <strong>{formatarDataHoraAviso(evento.enviado_em)}</strong>
                <span>
                  {evento.criado_por === usuarioId ? "por voce" : "por usuario"}
                  {evento.telefone ? ` · ${evento.telefone}` : ""}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
)}

  </>
)}
    </section>
  );
}

export default Rotas;
