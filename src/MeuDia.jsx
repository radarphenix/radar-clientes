import {
  AlertTriangle,
  CalendarDays,
  CheckCircle,
  ChevronRight,
  Clock3,
  Route,
  Search,
  UserCheck,
} from "lucide-react";
import "./meu-dia.css";

function chaveDataLocal(data = new Date()) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function formatarData(data) {
  if (!data) return "Sem data";
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

function saudacaoAtual() {
  const hora = new Date().getHours();
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

function itemPendente(item) {
  return !item.status || item.status === "PENDENTE";
}

function MeuDia({
  nomeUsuario,
  rotas,
  clientes,
  administrador,
  usuarios,
  usuarioSelecionadoId,
  visaoEquipe,
  selecionarUsuario,
  abrirRota,
  abrirListaRotas,
  abrirPesquisaRotas,
}) {
  const hoje = chaveDataLocal();
  const mapaClientes = new Map(
    (clientes || []).map((cliente) => [cliente.id, cliente]),
  );
  const agenda = rotas.flatMap((rota) =>
    (rota.clientes_agendados || []).map((item) => ({
      ...item,
      rota,
      cliente: mapaClientes.get(item.cliente_id) || null,
    })),
  );
  const prioridadeStatusRota = { EM_ANDAMENTO: 0, ABERTA: 1, FECHADA: 2 };
  const rotasAtivas = rotas
    .filter((rota) => rota.status !== "FINALIZADA")
    .sort((a, b) => {
      const diferencaStatus =
        (prioridadeStatusRota[a.status] ?? 9) -
        (prioridadeStatusRota[b.status] ?? 9);
      return (
        diferencaStatus ||
        Number(b.total_pendentes || 0) - Number(a.total_pendentes || 0)
      );
    });
  const rotasComVisitados = rotasAtivas
    .map((rota) => {
      const visitados = (rota.clientes_agendados || [])
        .filter((item) => item.status === "VISITADO" || item.visitado === true)
        .map((item) => ({
          ...item,
          rota,
          cliente: mapaClientes.get(item.cliente_id) || null,
        }))
        .sort((a, b) => Number(a.sequencia || 0) - Number(b.sequencia || 0));

      return {
        ...rota,
        visitados,
        totalVisitados: visitados.length,
      };
    })
    .filter((rota) => rota.totalVisitados > 0)
    .slice(0, 4);
  const mapaUsuarios = new Map(
    (usuarios || []).map((usuario) => [usuario.user_id, usuario]),
  );
  const consolidadoRotasAtivas = Array.from(
    rotasAtivas
      .reduce((mapa, rota) => {
        const responsavel =
          mapaUsuarios.get(rota.usuario_responsavel)?.nome ||
          rota.responsavel_nome ||
          "Sem responsável";
        const atual = mapa.get(responsavel) || {
          responsavel,
          rotas: 0,
          clientes: 0,
          pendentes: 0,
        };
        atual.rotas += 1;
        atual.clientes += Number(rota.total_clientes || 0);
        atual.pendentes += Number(rota.total_pendentes || 0);
        mapa.set(responsavel, atual);
        return mapa;
      }, new Map())
      .values(),
  ).sort((a, b) => b.pendentes - a.pendentes);
  const clientesHoje = agenda.filter(
    (item) =>
      item.data_prevista_visita === hoje &&
      item.status !== "CANCELADO" &&
      item.rota.status !== "FINALIZADA",
  );
  const atrasados = agenda.filter(
    (item) =>
      item.data_prevista_visita &&
      item.data_prevista_visita < hoje &&
      itemPendente(item) &&
      item.rota.status !== "FINALIZADA",
  );
  const visitadosHoje = clientesHoje.filter(
    (item) => item.status === "VISITADO" || item.visitado === true,
  );
  const semData = agenda.filter(
    (item) =>
      !item.data_prevista_visita &&
      itemPendente(item) &&
      item.rota.status !== "FINALIZADA",
  );
  const proximos = agenda
    .filter(
      (item) =>
        item.data_prevista_visita > hoje &&
        itemPendente(item) &&
        item.rota.status !== "FINALIZADA",
    )
    .sort((a, b) =>
      `${a.data_prevista_visita}-${a.sequencia || 0}`.localeCompare(
        `${b.data_prevista_visita}-${b.sequencia || 0}`,
      ),
    );
  const visitasAgendadas = proximos.length;
  atrasados.sort((a, b) =>
    `${a.data_prevista_visita}-${a.sequencia || 0}`.localeCompare(
      `${b.data_prevista_visita}-${b.sequencia || 0}`,
    ),
  );
  clientesHoje.sort(
    (a, b) => Number(a.sequencia || 0) - Number(b.sequencia || 0),
  );
  semData.sort((a, b) => {
    const rotaA = String(a.rota.nome || "");
    const rotaB = String(b.rota.nome || "");
    return (
      rotaA.localeCompare(rotaB, "pt-BR") ||
      Number(a.sequencia || 0) - Number(b.sequencia || 0)
    );
  });

  const primeiroNome = String(nomeUsuario || "Usuário")
    .trim()
    .split(/\s+/)[0];
  const dataAtual = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(new Date());
  const usuariosDisponiveis = (usuarios || [])
    .filter((usuario) => usuario.user_id && usuario.ativo !== false)
    .sort((a, b) =>
      String(a.nome || a.email || "").localeCompare(
        String(b.nome || b.email || ""),
        "pt-BR",
      ),
    );
  const usuarioSelecionadoEstaNaLista = usuariosDisponiveis.some(
    (usuario) => usuario.user_id === usuarioSelecionadoId,
  );

  function renderizarClienteAgenda(item, tipo = "hoje") {
    return (
      <button
        type="button"
        className="meu-dia-cliente"
        key={item.id}
        onClick={() => abrirRota(item.rota)}
      >
        <span className={`meu-dia-cliente-data ${tipo}`}>
          {tipo === "atrasado"
            ? `Atrasado ${formatarData(item.data_prevista_visita)}`
            : formatarData(item.data_prevista_visita)}
        </span>
        <span className="meu-dia-cliente-info">
          <strong>{item.cliente?.cliente || "Cliente sem nome"}</strong>
          <small>
            {item.rota.nome} · {item.cliente?.cidade || "Cidade não informada"}
            {item.cliente?.uf ? `/${item.cliente.uf}` : ""}
            {item.horario_previsto_visita
              ? ` · ${item.horario_previsto_visita.slice(0, 5)}`
              : ""}
          </small>
        </span>
        <span className="meu-dia-cliente-sequencia">
          {item.sequencia || "-"}º
        </span>
        <ChevronRight size={18} />
      </button>
    );
  }

  return (
    <main className="meu-dia">
      <section className="meu-dia-boas-vindas">
        <div>
          <span className="meu-dia-data">
            <CalendarDays size={16} /> {dataAtual}
          </span>
          <h2>
            {visaoEquipe
              ? "Agenda da equipe"
              : `${saudacaoAtual()}, ${primeiroNome}`}
          </h2>
          <p>
            {visaoEquipe
              ? "Acompanhe os clientes previstos de toda a equipe."
              : "Acompanhe os clientes previstos e organize as visitas do dia."}
          </p>
        </div>

        <div className="meu-dia-controles">
          {administrador && (
            <label>
              <span>Meu Dia de</span>
              <select
                value={usuarioSelecionadoId}
                onChange={(evento) => selecionarUsuario(evento.target.value)}
              >
                {!usuarioSelecionadoEstaNaLista &&
                  usuarioSelecionadoId !== "todos" && (
                    <option value={usuarioSelecionadoId}>{nomeUsuario}</option>
                  )}
                <option value="todos">Toda a equipe</option>
                {usuariosDisponiveis.map((usuario) => (
                  <option key={usuario.user_id} value={usuario.user_id}>
                    {usuario.nome || usuario.email}
                  </option>
                ))}
              </select>
            </label>
          )}
          <button type="button" onClick={abrirListaRotas}>
            <Route size={18} /> Ver todas as rotas
          </button>
          {administrador && (
            <button type="button" onClick={abrirPesquisaRotas}>
              <Search size={18} /> Pesquisar rotas
            </button>
          )}
        </div>
      </section>

      <section className="meu-dia-indicadores" aria-label="Agenda de visitas">
        <article>
          <span className="azul">
            <CalendarDays size={20} />
          </span>
          <div>
            <small>Clientes para hoje</small>
            <strong>{clientesHoje.length}</strong>
          </div>
        </article>
        <article>
          <span className="verde">
            <UserCheck size={20} />
          </span>
          <div>
            <small>Visitados hoje</small>
            <strong>{visitadosHoje.length}</strong>
          </div>
        </article>
        <article>
          <span className="roxo">
            <Clock3 size={20} />
          </span>
          <div>
            <small>Visitas agendadas</small>
            <strong>{visitasAgendadas}</strong>
          </div>
        </article>
        <article>
          <span className="laranja">
            <AlertTriangle size={20} />
          </span>
          <div>
            <small>Atrasados</small>
            <strong>{atrasados.length}</strong>
          </div>
        </article>
      </section>

      <div className="meu-dia-conteudo meu-dia-conteudo-agenda">
        <section className="meu-dia-painel">
          <header className="meu-dia-painel-titulo">
            <div>
              <span>Fora do prazo</span>
              <h3>Clientes atrasados</h3>
            </div>
            <strong className="meu-dia-total-atrasados">
              {atrasados.length}
            </strong>
          </header>

          {atrasados.length ? (
            <div className="meu-dia-lista-clientes">
              {atrasados
                .slice(0, 10)
                .map((item) => renderizarClienteAgenda(item, "atrasado"))}
            </div>
          ) : (
            <div className="meu-dia-vazio compacto">
              <CheckCircle size={34} />
              <strong>Nenhum cliente atrasado</strong>
            </div>
          )}

          <div className="meu-dia-secao-hoje">
            <header className="meu-dia-painel-titulo">
              <div>
                <span>Data de hoje</span>
                <h3>Clientes agendados para hoje</h3>
              </div>
              <strong className="meu-dia-total-hoje">
                {clientesHoje.length}
              </strong>
            </header>

            {clientesHoje.length ? (
              <div className="meu-dia-lista-clientes">
                {clientesHoje
                  .slice(0, 10)
                  .map((item) => renderizarClienteAgenda(item, "hoje"))}
              </div>
            ) : (
              <div className="meu-dia-vazio compacto">
                <CalendarDays size={34} />
                <strong>Nenhum cliente agendado para hoje</strong>
                <p>Defina a data no Planejamento da rota.</p>
                <button type="button" onClick={abrirListaRotas}>
                  Planejar visitas
                </button>
              </div>
            )}
          </div>

          <div className="meu-dia-secao-hoje meu-dia-secao-sem-data">
            <header className="meu-dia-painel-titulo">
              <div>
                <span>Planejamento pendente</span>
                <h3>Clientes sem data</h3>
              </div>
              <strong className="meu-dia-total-sem-data">
                {semData.length}
              </strong>
            </header>

            {semData.length ? (
              <div className="meu-dia-lista-clientes">
                {semData
                  .slice(0, 10)
                  .map((item) => renderizarClienteAgenda(item, "semdata"))}
              </div>
            ) : (
              <div className="meu-dia-vazio compacto">
                <CheckCircle size={34} />
                <strong>Todos os clientes pendentes possuem data</strong>
              </div>
            )}
          </div>
        </section>

        <aside className="meu-dia-coluna-lateral">
          <section className="meu-dia-painel">
            <header className="meu-dia-painel-titulo">
              <div>
                <span>
                  {visaoEquipe ? "Consolidado da equipe" : "Visão geral"}
                </span>
                <h3>{visaoEquipe ? "Rotas da equipe" : "Minhas rotas"}</h3>
              </div>
              <strong className="meu-dia-total-rotas-abertas">
                {rotasAtivas.length}
              </strong>
            </header>

            {visaoEquipe && consolidadoRotasAtivas.length > 0 && (
              <div className="meu-dia-consolidado-rotas">
                {consolidadoRotasAtivas.map((item) => (
                  <div key={item.responsavel}>
                    <strong>{item.responsavel}</strong>
                    <span>
                      {item.rotas} rota(s) · {item.clientes} clientes ·{" "}
                      {item.pendentes} pendentes
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="meu-dia-bloco-visitados">
              <div className="meu-dia-bloco-visitados-topo">
                <span>Clientes visitados por rota</span>
                <strong>
                  {rotasComVisitados.reduce(
                    (total, rota) => total + rota.totalVisitados,
                    0,
                  )}
                </strong>
              </div>

              {rotasComVisitados.length ? (
                <div className="meu-dia-lista-visitados-rotas">
                  {rotasComVisitados.slice(0, 5).map((rota) => (
                    <div key={rota.id} className="meu-dia-rota-visitados">
                      <button
                        type="button"
                        className="meu-dia-rota-visitados-cabecalho"
                        onClick={() => abrirRota(rota)}
                      >
                        <span>
                          <strong>{rota.nome}</strong>
                          <small>
                            {rota.responsavel_nome || "Sem responsável"} ·{" "}
                            {rota.totalVisitados} visitado(s)
                          </small>
                        </span>
                        <ChevronRight size={16} />
                      </button>
                      <ul>
                        {rota.visitados.slice(0, 3).map((item) => (
                          <li key={item.id}>
                            <CheckCircle size={14} />
                            <span>
                              {item.cliente?.cliente || "Cliente sem nome"}
                              {item.data_prevista_visita
                                ? ` · ${formatarData(item.data_prevista_visita)}`
                                : ""}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="meu-dia-texto-vazio">
                  Ainda não há clientes visitados nas rotas ativas.
                </p>
              )}
            </div>

            {rotasAtivas.length ? (
              <div className="meu-dia-lista-rotas-abertas">
                {rotasAtivas.slice(0, 8).map((rota) => (
                  <button
                    type="button"
                    key={rota.id}
                    onClick={() => abrirRota(rota)}
                  >
                    <Route size={18} />
                    <span>
                      <strong>{rota.nome}</strong>
                      <small>
                        {visaoEquipe
                          ? `${
                              mapaUsuarios.get(rota.usuario_responsavel)
                                ?.nome ||
                              rota.responsavel_nome ||
                              "Sem responsável"
                            } · `
                          : ""}
                        {String(rota.status || "ABERTA").replaceAll("_", " ")} ·{" "}
                        {rota.total_clientes || 0} clientes ·{" "}
                        {rota.total_pendentes || 0} pendentes
                      </small>
                    </span>
                    <ChevronRight size={18} />
                  </button>
                ))}
              </div>
            ) : (
              <p className="meu-dia-texto-vazio">
                Nenhuma rota ativa encontrada.
              </p>
            )}
          </section>

          <section className="meu-dia-painel">
            <header className="meu-dia-painel-titulo">
              <div>
                <span>Próximos dias</span>
                <h3>Visitas agendadas</h3>
              </div>
            </header>
            {proximos.length ? (
              <div className="meu-dia-lista-clientes compacta">
                {proximos
                  .slice(0, 5)
                  .map((item) => renderizarClienteAgenda(item, "futuro"))}
              </div>
            ) : (
              <p className="meu-dia-texto-vazio">
                Nenhuma visita futura agendada.
              </p>
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}

export default MeuDia;
