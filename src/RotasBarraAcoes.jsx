import {
  Lock,
  ArrowUpDown,
  ClipboardList,
  Wrench,
} from "lucide-react";

function RotasBarraAcoes({
  rotaSelecionada,
  buscaClienteRota,
  setBuscaClienteRota,
  fecharRota,
  reabrirRota,
  finalizarRota,
  modoReordenar,
  setModoReordenar,
  abaRota,
  setAbaRota,
}) {
  return (
    <div className="barra-acoes-rota">
      <input
        type="text"
        className="input-busca-rota"
        placeholder="Buscar cliente..."
        value={buscaClienteRota}
        onChange={(e) => setBuscaClienteRota(e.target.value)}
      />

      {rotaSelecionada.status === "ABERTA" && (
        <button
          type="button"
          className="btn-status-rota"
          onClick={() => fecharRota(rotaSelecionada)}
        >
          <Lock size={16} />
          Fechar rota
        </button>
      )}

      {(rotaSelecionada.status === "FECHADA" ||
        rotaSelecionada.status === "EM_ANDAMENTO") && (
        <button
          type="button"
          className="btn-status-rota"
          onClick={() => finalizarRota(rotaSelecionada)}
        >
          <Lock size={16} />
          Finalizar rota
        </button>
      )}

      {rotaSelecionada.status === "FINALIZADA" && (
        <button
          type="button"
          className="btn-status-rota"
          onClick={() => reabrirRota(rotaSelecionada)}
        >
          <Lock size={16} />
          Reabrir rota
        </button>
      )}

      <div className="grupo-botoes-rota">
        {rotaSelecionada.status !== "FINALIZADA" && (
          <button
            type="button"
            className="btn-rota-acao"
            onClick={() => setModoReordenar(!modoReordenar)}
          >
            <ArrowUpDown size={16} />
            {modoReordenar ? "Finalizar reordenação" : "Reordenar rota"}
          </button>
        )}

        <button
          type="button"
          className={abaRota === "operacao" ? "aba-rota ativa" : "aba-rota"}
          onClick={() => setAbaRota("operacao")}
        >
          <ClipboardList size={16} />
          Operação
        </button>

        <button
          type="button"
          className={abaRota === "manutencao" ? "aba-rota ativa" : "aba-rota"}
          onClick={() => setAbaRota("manutencao")}
        >
          <Wrench size={16} />
          Manutenção
        </button>
      </div>
    </div>
  );
}

export default RotasBarraAcoes;
