import { ArrowUpDown, MapPin, Lock, Flag, RotateCcw } from "lucide-react";

function RotasPlanejamento({
  rotaSelecionada,
  clientesDaRota,
  clientes,
  buscaClienteRota,
  setBuscaClienteRota,
  buscarCliente,
  adicionarClienteNaRota,
  removerClienteDaRota,
  alterarSequenciaClienteRota,
  alterarDataPrevistaClienteRota,
  fecharRota,
  modoReordenar,
  setModoReordenar,
  ordenarRotaPorDistancia,
  perfil,
  usuarioId,
  reabrirRota,
  usuariosPerfis,
  alterarResponsavelRota,
  reenviarAvisoWhatsAppCliente,
  permiteAvisoWhatsAppRotaGrupoAtual,
  finalizarRota,
}) {
  return (
    <div className="painel-planejamento-rota">
      <h2>Planejamento da Rota</h2>

      <p>
        Use esta área para adicionar clientes, organizar sequência e preparar a
        rota antes da execução.
      </p>

      <div className="planejamento-busca">
        <input
          type="text"
          className="input-busca-rota"
          placeholder="Buscar cliente para adicionar..."
          value={buscaClienteRota}
          onChange={(e) => setBuscaClienteRota(e.target.value)}
        />
      </div>

      {perfil?.tipo_perfil === "admin" && (
        <div className="painel-responsavel-rota">
          <label>Responsável pela rota</label>

          <select
            value={rotaSelecionada.usuario_responsavel || ""}
            onChange={(e) =>
              alterarResponsavelRota(rotaSelecionada, e.target.value)
            }
            className="select-responsavel-planejamento"
          >
            {usuariosPerfis
              .filter((usuario) => usuario.ativo)
              .map((usuario) => (
                <option key={usuario.user_id} value={usuario.user_id}>
                  {usuario.nome} ({usuario.tipo_perfil})
                </option>
              ))}
          </select>
        </div>
      )}

      <div className="planejamento-acoes-principais">
        {rotaSelecionada.status !== "FINALIZADA" && (
          <>
            <button
              type="button"
              className="btn-rota-acao"
              onClick={() => setModoReordenar(!modoReordenar)}
            >
              <ArrowUpDown size={18} />
              {modoReordenar ? "Finalizar reordenação" : "Reordenar rota"}
            </button>

            <button
              type="button"
              className="btn-rota-acao"
              onClick={() => ordenarRotaPorDistancia(rotaSelecionada)}
            >
              <MapPin size={18} />
              Ordenar por distância
            </button>

            {rotaSelecionada.status === "ABERTA" && (
              <button
                type="button"
                className="btn-rota-acao"
                onClick={() => fecharRota(rotaSelecionada)}
              >
                <Lock size={18} />
                Fechar rota
              </button>
            )}

            {(rotaSelecionada.status === "FECHADA" ||
              rotaSelecionada.status === "EM_ANDAMENTO") && (
              <button
                type="button"
                className="btn-rota-acao"
                onClick={() => finalizarRota(rotaSelecionada)}
              >
                <Flag size={18} />
                Finalizar rota
              </button>
            )}
          </>
        )}

        {rotaSelecionada.status === "FINALIZADA" &&
          (perfil?.tipo_perfil === "admin" ||
            rotaSelecionada.criado_por === usuarioId) && (
            <button
              type="button"
              className="btn-rota-acao"
              onClick={() => reabrirRota(rotaSelecionada)}
            >
              <RotateCcw size={18} />
              Reabrir rota
            </button>
          )}
      </div>

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

                <p>
                  <strong>Código:</strong> {cliente.codigo_cliente}
                </p>

                <p>
                  <strong>Cidade:</strong> {cliente.cidade} / {cliente.uf}
                </p>

                {rotaSelecionada.status !== "FINALIZADA" && (
                  <button
                    type="button"
                    onClick={() => adicionarClienteNaRota(cliente)}
                  >
                    Adicionar
                  </button>
                )}
              </div>
            ))}
        </div>
      )}

      <div className="clientes-planejados-rota">
        <h3>Clientes da Rota</h3>

        {clientesDaRota.length === 0 ? (
          <p>Nenhum cliente adicionado nesta rota.</p>
        ) : (
          <div className="lista-planejamento-rota">
            {clientesDaRota.map((item) => {
              const cliente = buscarCliente(item);

              return (
                <div className="linha-planejamento-rota" key={item.id}>
                  {modoReordenar ? (
                    <input
                      type="text"
                      inputMode="numeric"
                      className="input-sequencia-mini"
                      value={item.sequencia || ""}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) =>
                        alterarSequenciaClienteRota(item, e.target.value)
                      }
                    />
                  ) : (
                    <strong>{item.sequencia || "-"}</strong>
                  )}

                  <div>
                    <strong>{cliente?.cliente || "Cliente sem nome"}</strong>
                    <span>
                      {cliente?.cidade || "-"} / {cliente?.uf || "-"}
                    </span>
                    {item.aviso_whatsapp_em && (
                      <span className="badge-aviso-whatsapp">
                        Avisado no WhatsApp
                      </span>
                    )}
                  </div>

                  <label className="data-prevista-cliente-rota">
                    <span>Data prevista</span>
                    <input
                      type="date"
                      value={item.data_prevista_visita || ""}
                      disabled={rotaSelecionada.status === "FINALIZADA"}
                      onChange={(evento) =>
                        alterarDataPrevistaClienteRota(
                          item,
                          evento.target.value,
                        )
                      }
                    />
                  </label>

                  {rotaSelecionada.status !== "FINALIZADA" && (
                    <div className="acoes-planejamento-rota">
                      <button
                        type="button"
                        className="btn-mini-status whatsapp"
                        disabled={!permiteAvisoWhatsAppRotaGrupoAtual}
                        onClick={() => reenviarAvisoWhatsAppCliente(item)}
                      >
                        {item.aviso_whatsapp_em
                          ? "Reenviar aviso"
                          : "Primeiro aviso"}
                      </button>

                      <button
                        type="button"
                        className="btn-mini-status remover"
                        onClick={() => removerClienteDaRota(item)}
                      >
                        Remover
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default RotasPlanejamento;
