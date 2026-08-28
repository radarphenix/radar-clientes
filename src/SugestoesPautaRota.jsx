import { ROTULO_CRITICIDADE, COR_CRITICIDADE } from "./lib/pautaCriticidade.js";

export function CartaoSugestao({ item, onAdicionar }) {
  const cliente = item.clientes;

  return (
    <div
      className="cartao-sugestao-pauta"
      style={{ borderLeftColor: COR_CRITICIDADE[item.criticidade] }}
    >
      <div className="cartao-sugestao-pauta-info">
        <strong>{cliente.cliente}</strong>
        <span>
          {cliente.cidade || "-"} / {cliente.uf || "-"}
          {typeof item.distancia_km === "number"
            ? ` · ${Math.round(item.distancia_km)} km`
            : ""}
        </span>
        <span
          className="cartao-sugestao-pauta-nivel"
          style={{ color: COR_CRITICIDADE[item.criticidade] }}
        >
          {ROTULO_CRITICIDADE[item.criticidade] || item.criticidade}
        </span>
      </div>

      <button type="button" onClick={() => onAdicionar(cliente)}>
        Adicionar
      </button>
    </div>
  );
}

function SugestoesPautaRota({ sugestoes, onAdicionar }) {
  if (!sugestoes) return null;

  const {
    mesmaUf,
    raio,
    carregando,
    referenciaClienteNome,
    referenciaClienteCidadeUf,
  } = sugestoes;
  const total = (mesmaUf?.length || 0) + (raio?.length || 0);

  return (
    <details className="painel-sugestoes-pauta" open={total > 0}>
      <summary>
        Clientes em pauta próximos {carregando ? "" : `(${total})`}
      </summary>

      {!carregando && referenciaClienteNome && (
        <p className="painel-sugestoes-pauta-referencia">
          Distâncias calculadas com base em: <strong>{referenciaClienteNome}</strong>
          {referenciaClienteCidadeUf ? ` (${referenciaClienteCidadeUf})` : ""}
        </p>
      )}

      {carregando ? (
        <p className="sugestoes-pauta-carregando">Buscando sugestões...</p>
      ) : total === 0 ? (
        <p className="sugestoes-pauta-carregando">
          Nenhum cliente em pauta encontrado por perto.
        </p>
      ) : (
        <div className="sugestoes-pauta-conteudo">
          {mesmaUf.length > 0 && (
            <div className="sugestoes-pauta-grupo">
              <h4>Mesmo estado</h4>
              {mesmaUf.map((item) => (
                <CartaoSugestao
                  key={item.id}
                  item={item}
                  onAdicionar={onAdicionar}
                />
              ))}
            </div>
          )}

          {raio.length > 0 && (
            <div className="sugestoes-pauta-grupo">
              <h4>Outros estados (até 300 km)</h4>
              {raio.map((item) => (
                <CartaoSugestao
                  key={item.id}
                  item={item}
                  onAdicionar={onAdicionar}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </details>
  );
}

export default SugestoesPautaRota;
