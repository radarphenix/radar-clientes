import { useMemo, useState } from "react";

function formatarData(data) {
  if (!data) return "-";
  const valor = String(data).slice(0, 10);
  const partes = valor.split("-");
  if (partes.length !== 3) return "-";
  const [ano, mes, dia] = partes;
  return `${dia}/${mes}/${ano}`;
}

const STATUS_TEXTO = {
  visita: "Visitado",
  cancelamento: "Cancelado",
  pendente: "Pendente",
};

const STATUS_COR = {
  visita: "visitado",
  cancelamento: "cancelado",
  pendente: "pendente",
};

function tituloEvento(evento) {
  if (evento.tipo === "visita") return "Visita realizada";
  if (evento.tipo === "cancelamento") return "Visita cancelada";
  if (evento.tipo === "pendente") return "Visita agendada";
  return `Amostra enviada${evento.produto ? ` — ${evento.produto}` : ""}`;
}

function mesAnoDoEvento(evento) {
  if (!evento.data) return "Sem data";
  const data = new Date(evento.data);
  if (Number.isNaN(data.getTime())) return "Sem data";
  return data
    .toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    .replace(/^./, (letra) => letra.toUpperCase());
}

function HistoricoCliente({
  cliente,
  eventos,
  permiteAmostras,
  carregandoAmostras,
}) {
  const [filtro, setFiltro] = useState("todos");

  const contagens = useMemo(() => {
    const visitas = eventos.filter(
      (evento) => evento.tipo === "visita" || evento.tipo === "pendente",
    ).length;
    const cancelamentos = eventos.filter(
      (evento) => evento.tipo === "cancelamento",
    ).length;
    const amostras = eventos.filter(
      (evento) => evento.tipo === "amostra",
    ).length;
    const ultimaVisita = eventos.find(
      (evento) => evento.tipo === "visita" || evento.tipo === "cancelamento",
    );

    return {
      total: eventos.length,
      visitas,
      cancelamentos,
      amostras,
      ultimaVisita: ultimaVisita ? formatarData(ultimaVisita.data) : "-",
    };
  }, [eventos]);

  const eventosFiltrados = useMemo(() => {
    if (filtro === "visitas") {
      return eventos.filter((evento) => evento.tipo !== "amostra");
    }
    if (filtro === "amostras") {
      return eventos.filter((evento) => evento.tipo === "amostra");
    }
    return eventos;
  }, [eventos, filtro]);

  return (
    <section className="painel historico-cliente-painel">
      <div className="historico-cliente-topo">
        <div>
          <h2>{cliente.cliente || "Cliente sem nome"}</h2>
          <p className="historico-cliente-sub">
            <span>
              <strong>Código:</strong> {cliente.codigo_cliente || "-"}
            </span>
            <span>
              <strong>Cidade:</strong> {cliente.cidade || "-"}
              {cliente.uf ? ` / ${cliente.uf}` : ""}
            </span>
          </p>
        </div>
      </div>

      <div className="historico-cliente-resumo">
        <div className="historico-cliente-resumo-item">
          <strong>{contagens.visitas}</strong>
          <span>Visitas realizadas</span>
        </div>
        <div className="historico-cliente-resumo-item">
          <strong>{contagens.cancelamentos}</strong>
          <span>Cancelamentos</span>
        </div>
        {permiteAmostras && (
          <div className="historico-cliente-resumo-item">
            <strong>{contagens.amostras}</strong>
            <span>Amostras enviadas</span>
          </div>
        )}
        <div className="historico-cliente-resumo-item">
          <strong>{contagens.ultimaVisita}</strong>
          <span>Última visita</span>
        </div>
      </div>

      <div className="historico-cliente-filtros">
        <button
          type="button"
          className="chip-historico"
          data-active={filtro === "todos"}
          onClick={() => setFiltro("todos")}
        >
          Tudo <span>{contagens.total}</span>
        </button>
        <button
          type="button"
          className="chip-historico"
          data-active={filtro === "visitas"}
          onClick={() => setFiltro("visitas")}
        >
          Visitas <span>{contagens.visitas + contagens.cancelamentos}</span>
        </button>
        {permiteAmostras && (
          <button
            type="button"
            className="chip-historico"
            data-active={filtro === "amostras"}
            onClick={() => setFiltro("amostras")}
          >
            Amostras <span>{contagens.amostras}</span>
          </button>
        )}
      </div>

      {permiteAmostras && carregandoAmostras && (
        <p className="historico-cliente-status">Carregando amostras...</p>
      )}

      {eventosFiltrados.length === 0 ? (
        <p className="historico-cliente-status">
          Nenhum evento encontrado para este cliente.
        </p>
      ) : (
        <div className="historico-cliente-timeline">
          {eventosFiltrados.map((evento, indice) => {
            const marco =
              indice === 0 ||
              mesAnoDoEvento(evento) !==
                mesAnoDoEvento(eventosFiltrados[indice - 1]);

            return (
              <div key={evento.chave}>
                {marco && (
                  <div className="historico-marco-mes">
                    {mesAnoDoEvento(evento)}
                  </div>
                )}

                <div className="historico-evento" data-tipo={evento.tipo}>
                  <div className="historico-evento-dot" />
                  <div className="historico-evento-card">
                    <div className="historico-evento-topo">
                      <span className="historico-evento-titulo">
                        {tituloEvento(evento)}
                      </span>
                      <span className="historico-evento-data">
                        {formatarData(evento.data)}
                        {evento.horario ? ` · ${evento.horario.slice(0, 5)}` : ""}
                      </span>
                    </div>

                    {evento.tipo !== "amostra" ? (
                      <>
                        <p className="historico-evento-meta">
                          Rota "{evento.rotaNome}"
                          {evento.responsavelNome
                            ? ` · técnico ${evento.responsavelNome}`
                            : ""}
                        </p>
                        <span
                          className={`badge-status-rota ${STATUS_COR[evento.tipo]}`}
                        >
                          {STATUS_TEXTO[evento.tipo]}
                        </span>
                        {evento.motivoCancelamento && (
                          <p className="historico-evento-motivo">
                            <strong>Motivo:</strong>{" "}
                            {evento.motivoCancelamento}
                          </p>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="historico-evento-meta">
                          {[
                            evento.maquina && `Máquina ${evento.maquina}`,
                            evento.fornecedor &&
                              `fornecedor ${evento.fornecedor}`,
                          ]
                            .filter(Boolean)
                            .join(" · ") || "Sem detalhes adicionais"}
                        </p>
                        <span
                          className={`amostra-origem amostra-origem-${evento.origemAmostra.toLowerCase()}`}
                        >
                          {evento.origemAmostra}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default HistoricoCliente;
