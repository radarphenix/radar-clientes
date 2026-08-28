import { CartaoSugestao } from "./SugestoesPautaRota.jsx";

function PainelTodaPauta({ aberto, itens, carregando, onAdicionar }) {
  if (!aberto) return null;

  return (
    <div className="painel-sugestoes-pauta painel-toda-pauta">
      <p className="painel-sugestoes-pauta-referencia">
        Todos os clientes em pauta, ordenados por criticidade.
      </p>

      {carregando ? (
        <p className="sugestoes-pauta-carregando">Carregando...</p>
      ) : itens.length === 0 ? (
        <p className="sugestoes-pauta-carregando">
          Nenhum cliente em pauta no momento.
        </p>
      ) : (
        <div className="sugestoes-pauta-conteudo">
          <div className="sugestoes-pauta-grupo">
            {itens.map((item) => (
              <CartaoSugestao key={item.id} item={item} onAdicionar={onAdicionar} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default PainelTodaPauta;
