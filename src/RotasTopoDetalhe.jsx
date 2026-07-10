function RotasTopoDetalhe({
  rotaSelecionada,
  clientesDaRota,
  abrirRota,
  setModoTelaRota,
}) {
  return (
    <>
      <div className="topo-detalhe-rota">
        <button
          type="button"
          className="btn-voltar-rota"
          onClick={() => {
            abrirRota(null);
            setModoTelaRota("lista");
          }}
        >
          ← Voltar para rotas
        </button>

        <div className="info-topo-rota">
          <div className="info-rota-box">
            <strong>
              {rotaSelecionada.data_rota || "25/05/2026"}
            </strong>

            <span>Data da Rota</span>
          </div>

          <div className="info-rota-box">
            <strong
              className={`status-rota-topo status-${rotaSelecionada.status}`}
            >
              ● {rotaSelecionada.status}
            </strong>

            <span>Status da Rota</span>
          </div>

          <div className="info-rota-box">
            <strong>{clientesDaRota.length}</strong>

            <span>Total de clientes</span>
          </div>
        </div>
      </div>
    </>
  );
}

export default RotasTopoDetalhe;
