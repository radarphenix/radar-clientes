import { useMemo, useState } from "react";

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

const STATUS_ROTA_TEXTO = {
  ABERTA: "Aberta",
  FECHADA: "Fechada",
  EM_ANDAMENTO: "Em andamento",
  FINALIZADA: "Finalizada",
};

function normalizarStatusCliente(status) {
  return status === "VISITADO" || status === "CANCELADO" ? status : "PENDENTE";
}

const CAMPOS_FILTROS_AVANCADOS = [
  "statusCliente",
  "statusRota",
  "responsavel",
  "incluidoPor",
  "cidade",
  "nomeRota",
  "dataInicio",
  "dataFim",
];

function contarFiltrosAvancadosAtivos(filtros) {
  return CAMPOS_FILTROS_AVANCADOS.filter((campo) => filtros[campo]).length;
}

function montarResumoFiltros(filtros, usuariosAtivos) {
  const partes = [];

  if (filtros.texto.trim()) partes.push(`Busca: "${filtros.texto.trim()}"`);
  if (filtros.statusCliente)
    partes.push(`Status do cliente: ${STATUS_CLIENTE_TEXTO[filtros.statusCliente]}`);
  if (filtros.statusRota)
    partes.push(`Status da rota: ${STATUS_ROTA_TEXTO[filtros.statusRota]}`);
  if (filtros.responsavel) {
    const usuario = usuariosAtivos.find((u) => u.user_id === filtros.responsavel);
    partes.push(`Responsável: ${usuario?.nome || filtros.responsavel}`);
  }
  if (filtros.incluidoPor) {
    const usuario = usuariosAtivos.find((u) => u.user_id === filtros.incluidoPor);
    partes.push(`Incluído por: ${usuario?.nome || filtros.incluidoPor}`);
  }
  if (filtros.cidade) partes.push(`Cidade/UF: ${filtros.cidade}`);
  if (filtros.nomeRota) partes.push(`Rota: ${filtros.nomeRota}`);
  if (filtros.dataInicio) partes.push(`De: ${formatarData(filtros.dataInicio)}`);
  if (filtros.dataFim) partes.push(`Até: ${formatarData(filtros.dataFim)}`);

  return partes.length ? `Filtros aplicados — ${partes.join(" · ")}` : "Sem filtros aplicados";
}

function RotasPesquisa({
  linhas,
  usuariosPerfis,
  filtros,
  setFiltros,
  limparFiltros,
  aplicarPeriodoPreset,
  abrirRotaDaPesquisa,
  imprimirLista,
  imprimirRoteiro,
}) {
  const [filtrosAvancadosAbertos, setFiltrosAvancadosAbertos] = useState(false);

  const usuariosAtivos = (usuariosPerfis || [])
    .filter((usuario) => usuario.ativo)
    .sort((a, b) => String(a.nome || "").localeCompare(String(b.nome || "")));

  const nomesRotasSugeridos = useMemo(() => {
    const nomes = new Set();
    (linhas || []).forEach((linha) => {
      if (linha.rota?.nome) nomes.add(linha.rota.nome);
    });
    return Array.from(nomes).sort((a, b) => a.localeCompare(b));
  }, [linhas]);

  const linhasFiltradas = useMemo(() => {
    const termo = filtros.texto.trim().toLowerCase();
    const cidade = filtros.cidade.trim().toLowerCase();
    const nomeRota = filtros.nomeRota.trim().toLowerCase();

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

      if (cidade) {
        const alvoCidade = [linha.cliente?.cidade, linha.cliente?.uf]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!alvoCidade.includes(cidade)) {
          return false;
        }
      }

      if (nomeRota) {
        if (!(linha.rota?.nome || "").toLowerCase().includes(nomeRota)) {
          return false;
        }
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

  const filtrosAvancadosAtivos = contarFiltrosAvancadosAtivos(filtros);

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

      <div className="pesquisa-rotas-busca-rapida">
        <input
          type="text"
          placeholder="Buscar por cliente, código, cidade ou rota"
          value={filtros.texto}
          onChange={(e) => setFiltros({ ...filtros, texto: e.target.value })}
        />

        <div className="pesquisa-rotas-periodo-presets">
          <button type="button" onClick={() => aplicarPeriodoPreset("hoje")}>
            Hoje
          </button>
          <button type="button" onClick={() => aplicarPeriodoPreset("semana")}>
            Esta semana
          </button>
          <button type="button" onClick={() => aplicarPeriodoPreset("mes")}>
            Este mês
          </button>
        </div>

        <button
          type="button"
          className="pesquisa-rotas-botao-imprimir"
          onClick={() =>
            imprimirLista(
              linhasFiltradas,
              montarResumoFiltros(filtros, usuariosAtivos),
            )
          }
        >
          Imprimir lista
        </button>
      </div>

      <details
        className="pesquisa-rotas-filtros-avancados"
        open={filtrosAvancadosAbertos}
        onToggle={(e) => setFiltrosAvancadosAbertos(e.target.open)}
      >
        <summary>
          Mais filtros
          {filtrosAvancadosAtivos > 0 && (
            <span className="pesquisa-rotas-badge-contagem">
              {filtrosAvancadosAtivos}
            </span>
          )}
        </summary>

        <div className="pesquisa-rotas-filtros">
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
            <label>Cidade/UF</label>
            <input
              type="text"
              placeholder="Ex: Sorocaba ou SC"
              value={filtros.cidade}
              onChange={(e) =>
                setFiltros({ ...filtros, cidade: e.target.value })
              }
            />
          </div>

          <div>
            <label>Nome da rota</label>
            <input
              type="text"
              list="pesquisa-rotas-sugestoes-nome-rota"
              placeholder="Ex: semana dia 10"
              value={filtros.nomeRota}
              onChange={(e) =>
                setFiltros({ ...filtros, nomeRota: e.target.value })
              }
            />
            <datalist id="pesquisa-rotas-sugestoes-nome-rota">
              {nomesRotasSugeridos.map((nome) => (
                <option key={nome} value={nome} />
              ))}
            </datalist>
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
      </details>

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
                    <button
                      type="button"
                      className="pesquisa-rotas-botao-secundario"
                      onClick={() => imprimirRoteiro(linha.rota)}
                    >
                      Imprimir roteiro
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
