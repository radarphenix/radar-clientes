import { useMemo } from "react";

function formatarData(data) {
  if (!data) return "-";
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

function formatarDataHora(valor) {
  if (!valor) return "-";
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "-";
  return data.toLocaleString("pt-BR");
}

const STATUS_CLIENTE_TEXTO = {
  VISITADO: "Visitado",
  CANCELADO: "Cancelado",
  PENDENTE: "Pendente",
};

const STATUS_CLIENTE_COR = {
  VISITADO: "visitado",
  CANCELADO: "cancelado",
  PENDENTE: "pendente",
};

function normalizarStatusCliente(status) {
  return status === "VISITADO" || status === "CANCELADO" ? status : "PENDENTE";
}

function RotasPesquisa({
  linhas,
  usuariosPerfis,
  filtros,
  setFiltros,
  limparFiltros,
  abrirRotaDaPesquisa,
}) {
  const usuariosAtivos = (usuariosPerfis || [])
    .filter((usuario) => usuario.ativo)
    .sort((a, b) => String(a.nome || "").localeCompare(String(b.nome || "")));

  const linhasFiltradas = useMemo(() => {
    const termo = filtros.texto.trim().toLowerCase();

    return (linhas || []).filter((linha) => {
      const statusCliente = normalizarStatusCliente(linha.status);

      if (filtros.statusCliente && statusCliente !== filtros.statusCliente) {
        return false;
      }

      if (filtros.statusRota && linha.rota?.status !== filtros.statusRota) {
        return false;
      }

      if (
        filtros.responsavel &&
        linha.rota?.usuario_responsavel !== filtros.responsavel
      ) {
        return false;
      }

      if (filtros.incluidoPor && linha.incluido_por !== filtros.incluidoPor) {
        return false;
      }

      if (filtros.dataInicio && (!linha.data_prevista_visita || linha.data_prevista_visita < filtros.dataInicio)) {
        return false;
      }

      if (filtros.dataFim && (!linha.data_prevista_visita || linha.data_prevista_visita > filtros.dataFim)) {
        return false;
      }

      if (termo) {
        const alvo = [
          linha.cliente?.cliente,
          linha.cliente?.codigo_cliente,
          linha.cliente?.cidade,
          linha.rota?.nome,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!alvo.includes(termo)) {
          return false;
        }
      }

      return true;
    });
  }, [linhas, filtros]);

  return (
    <section className="painel pesquisa-rotas-painel">
      <div className="pesquisa-rotas-topo">
        <div>
          <h2>Pesquisa de Rotas</h2>
          <p>
            Busque clientes dentro de qualquer rota, com detalhe de status,
            agendamento e quem incluiu cada um.
          </p>
        </div>

        <strong className="pesquisa-rotas-contador">
          {linhasFiltradas.length} encontrado(s)
        </strong>
      </div>

      <div className="pesquisa-rotas-filtros">
        <div>
          <label>Buscar</label>
          <input
            type="text"
            placeholder="Cliente, código ou cidade"
            value={filtros.texto}
            onChange={(e) =>
              setFiltros({ ...filtros, texto: e.target.value })
            }
          />
        </div>

        <div>
          <label>Status do cliente</label>
          <select
            value={filtros.statusCliente}
            onChange={(e) =>
              setFiltros({ ...filtros, statusCliente: e.target.value })
            }
          >
            <option value="">Todos</option>
            <option value="PENDENTE">Pendente</option>
            <option value="VISITADO">Visitado</option>
            <option value="CANCELADO">Cancelado</option>
          </select>
        </div>

        <div>
          <label>Status da rota</label>
          <select
            value={filtros.statusRota}
            onChange={(e) =>
              setFiltros({ ...filtros, statusRota: e.target.value })
            }
          >
            <option value="">Todas</option>
            <option value="ABERTA">Aberta</option>
            <option value="FECHADA">Fechada</option>
            <option value="EM_ANDAMENTO">Em andamento</option>
            <option value="FINALIZADA">Finalizada</option>
          </select>
        </div>

        <div>
          <label>Responsável pela rota</label>
          <select
            value={filtros.responsavel}
            onChange={(e) =>
              setFiltros({ ...filtros, responsavel: e.target.value })
            }
          >
            <option value="">Todos</option>
            {usuariosAtivos.map((usuario) => (
              <option key={usuario.user_id} value={usuario.user_id}>
                {usuario.nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Incluído por</label>
          <select
            value={filtros.incluidoPor}
            onChange={(e) =>
              setFiltros({ ...filtros, incluidoPor: e.target.value })
            }
          >
            <option value="">Todos</option>
            {usuariosAtivos.map((usuario) => (
              <option key={usuario.user_id} value={usuario.user_id}>
                {usuario.nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Data prevista de</label>
          <input
            type="date"
            value={filtros.dataInicio}
            onChange={(e) =>
              setFiltros({ ...filtros, dataInicio: e.target.value })
            }
          />
        </div>

        <div>
          <label>Data prevista até</label>
          <input
            type="date"
            value={filtros.dataFim}
            onChange={(e) =>
              setFiltros({ ...filtros, dataFim: e.target.value })
            }
          />
        </div>
      </div>

      <div className="pesquisa-rotas-acoes">
        <button type="button" onClick={limparFiltros}>
          Limpar filtros
        </button>
      </div>

      {linhasFiltradas.length === 0 ? (
        <p className="pesquisa-rotas-status">
          Nenhum cliente encontrado com esses filtros.
        </p>
      ) : (
        <div className="pesquisa-rotas-lista">
          {linhasFiltradas.map((linha) => {
            const statusCliente = normalizarStatusCliente(linha.status);

            return (
              <details className="pesquisa-rotas-card" key={linha.id}>
                <summary>
                  <span className="pesquisa-rotas-card-principal">
                    <span className="pesquisa-rotas-card-cliente">
                      {linha.cliente?.cliente || "Cliente sem nome"}
                    </span>
                    <span className="pesquisa-rotas-card-sub">
                      {linha.rota?.nome || "Rota sem nome"} ·{" "}
                      {linha.cliente?.cidade || "Cidade não informada"}
                      {linha.cliente?.uf ? `/${linha.cliente.uf}` : ""}
                    </span>
                  </span>

                  <span className="pesquisa-rotas-card-meta">
                    <span
                      className={`badge-status-rota ${STATUS_CLIENTE_COR[statusCliente]}`}
                    >
                      {STATUS_CLIENTE_TEXTO[statusCliente]}
                    </span>
                    <span className="pesquisa-rotas-card-data">
                      {formatarData(linha.data_prevista_visita)}
                      {linha.horario_previsto_visita
                        ? ` · ${linha.horario_previsto_visita.slice(0, 5)}`
                        : ""}
                    </span>
                    <span className="pesquisa-rotas-card-expandir">
                      Detalhes
                    </span>
                  </span>
                </summary>

                <dl className="pesquisa-rotas-card-detalhes">
                  <div>
                    <dt>Status da rota</dt>
                    <dd>{linha.rota?.status || "-"}</dd>
                  </div>

                  <div>
                    <dt>Responsável pela rota</dt>
                    <dd>{linha.rota?.responsavel_nome || "Sem responsável"}</dd>
                  </div>

                  <div>
                    <dt>Sequência</dt>
                    <dd>{linha.sequencia || "-"}</dd>
                  </div>

                  <div>
                    <dt>Incluído por</dt>
                    <dd>{linha.incluidoPorNome || "-"}</dd>
                  </div>

                  <div>
                    <dt>Incluído em</dt>
                    <dd>{formatarDataHora(linha.created_at)}</dd>
                  </div>

                  <div className="pesquisa-rotas-card-abrir">
                    <button
                      type="button"
                      onClick={() => abrirRotaDaPesquisa(linha.rota)}
                    >
                      Abrir rota
                    </button>
                  </div>
                </dl>
              </details>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default RotasPesquisa;
