const LOGO_PHENIX_URL =
  "https://phenixonline.com.br/wp-content/uploads/2021/05/Logo-Branco-1.png";

function formatarData(data) {
  if (!data) return "-";
  const valor = String(data).slice(0, 10);
  const partes = valor.split("-");
  if (partes.length !== 3) return "-";
  const [ano, mes, dia] = partes;
  return `${dia}/${mes}/${ano}`;
}

function formatarDataHora(data) {
  if (!data) return "-";
  const valor = new Date(data);
  if (Number.isNaN(valor.getTime())) return "-";
  return valor.toLocaleString("pt-BR");
}

const STATUS_TEXTO = {
  VISITADO: "Visitado",
  CANCELADO: "Cancelado",
  PENDENTE: "Pendente",
};

const STATUS_CLASSE = {
  VISITADO: "visitado",
  CANCELADO: "cancelado",
  PENDENTE: "pendente",
};

function statusTexto(status) {
  return STATUS_TEXTO[status] || "Pendente";
}

function statusClasse(status) {
  return STATUS_CLASSE[status] || "pendente";
}

function CabecalhoImpressao({ titulo, subtitulo, geradoEm }) {
  return (
    <header className="impressao-marca">
      <img className="impressao-logo" src={LOGO_PHENIX_URL} alt="Phenix" />
      <div className="impressao-marca-textos">
        <h1>{titulo}</h1>
        {subtitulo && <p>{subtitulo}</p>}
        <p className="impressao-marca-data">
          Gerado em {formatarDataHora(geradoEm)}
        </p>
      </div>
    </header>
  );
}

function ImpressaoPesquisaRotas({ impressao }) {
  if (!impressao) return null;

  if (impressao.tipo === "lista") {
    const { linhas, resumoFiltros, geradoEm } = impressao;

    return (
      <div className="area-impressao">
        <CabecalhoImpressao titulo="Pesquisa de Rotas" geradoEm={geradoEm} />

        <div className="impressao-resumo">
          <p className="impressao-filtros">
            {resumoFiltros || "Sem filtros aplicados"}
          </p>
          <p className="impressao-total">{linhas.length} resultado(s)</p>
        </div>

        <table className="impressao-tabela">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Código</th>
              <th>Cidade/UF</th>
              <th>Rota</th>
              <th>Responsável</th>
              <th>Status</th>
              <th>Data prevista</th>
              <th>Incluído por</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((linha) => (
              <tr key={linha.id}>
                <td>{linha.cliente?.cliente || "-"}</td>
                <td>{linha.cliente?.codigo_cliente || "-"}</td>
                <td>
                  {linha.cliente?.cidade || "-"}
                  {linha.cliente?.uf ? `/${linha.cliente.uf}` : ""}
                </td>
                <td>{linha.rota?.nome || "-"}</td>
                <td>{linha.rota?.responsavel_nome || "-"}</td>
                <td>
                  <span
                    className={`impressao-status impressao-status-${statusClasse(linha.status)}`}
                  >
                    {statusTexto(linha.status)}
                  </span>
                </td>
                <td>
                  {formatarData(linha.data_prevista_visita)}
                  {linha.horario_previsto_visita
                    ? ` ${linha.horario_previsto_visita.slice(0, 5)}`
                    : ""}
                </td>
                <td>{linha.incluidoPorNome || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <footer className="impressao-rodape">
          Radar de Clientes Phenix · Relatório gerado automaticamente
        </footer>
      </div>
    );
  }

  if (impressao.tipo === "roteiro") {
    const { rota, clientes, geradoEm } = impressao;
    const subtitulo = `Responsável: ${rota.responsavel_nome || "-"} · Status: ${rota.status || "-"}`;

    return (
      <div className="area-impressao">
        <CabecalhoImpressao
          titulo={`Roteiro da rota ${rota.nome || ""}`}
          subtitulo={subtitulo}
          geradoEm={geradoEm}
        />

        <div className="impressao-resumo">
          <p className="impressao-total">{clientes.length} cliente(s)</p>
        </div>

        <ol className="impressao-roteiro-lista">
          {clientes.map((linha, indice) => (
            <li key={linha.id} className="impressao-roteiro-item">
              <span className="impressao-roteiro-numero">{indice + 1}</span>
              <div className="impressao-roteiro-corpo">
                <div className="impressao-roteiro-topo">
                  <strong>
                    {linha.cliente?.cliente || "Cliente sem nome"}
                  </strong>
                  <span
                    className={`impressao-status impressao-status-${statusClasse(linha.status)}`}
                  >
                    {statusTexto(linha.status)}
                  </span>
                </div>
                <p className="impressao-roteiro-endereco">
                  {linha.cliente?.endereco_completo ||
                    "Endereço não informado"}
                </p>
                <p className="impressao-roteiro-meta">
                  Código: {linha.cliente?.codigo_cliente || "-"} · Cidade:{" "}
                  {linha.cliente?.cidade || "-"}
                  {linha.cliente?.uf ? `/${linha.cliente.uf}` : ""}
                  {linha.cliente?.telefone
                    ? ` · Telefone: ${linha.cliente.telefone}`
                    : ""}
                </p>
                <p className="impressao-roteiro-meta">
                  Data prevista: {formatarData(linha.data_prevista_visita)}
                  {linha.horario_previsto_visita
                    ? ` às ${linha.horario_previsto_visita.slice(0, 5)}`
                    : ""}
                </p>
                {linha.status === "CANCELADO" &&
                  linha.motivo_cancelamento && (
                    <p className="impressao-roteiro-motivo">
                      Motivo do cancelamento: {linha.motivo_cancelamento}
                    </p>
                  )}
              </div>
            </li>
          ))}
        </ol>

        <footer className="impressao-rodape">
          Radar de Clientes Phenix · Relatório gerado automaticamente
        </footer>
      </div>
    );
  }

  return null;
}

export default ImpressaoPesquisaRotas;
