import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { ROTULO_CRITICIDADE, COR_CRITICIDADE } from "./lib/pautaCriticidade.js";

const LIMITE_DIAS_ATRASO = 15;

function diasDesde(dataIso) {
  const diffMs = Date.now() - new Date(dataIso).getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function tempoDesde(dias) {
  if (dias <= 0) return "hoje";
  if (dias === 1) return "há 1 dia";
  return `há ${dias} dias`;
}

function ClientesEmPauta({ perfil, visaoEquipe, onCadastrarNovo, onVerTodos }) {
  const [itens, setItens] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let cancelado = false;

    async function carregar() {
      setCarregando(true);

      const { data, error } = await supabase
        .from("clientes_em_pauta")
        .select(
          "id, criticidade, status, criado_em, clientes(id, cliente, codigo_cliente, cidade, uf)",
        )
        .eq("status", "ATIVO")
        .order("criado_em", { ascending: false })
        .limit(5);

      if (cancelado) return;

      if (error) {
        console.warn("Falha ao carregar clientes em pauta:", error.message);
        setItens([]);
        setCarregando(false);
        return;
      }

      setItens(data || []);
      setCarregando(false);
    }

    carregar();

    return () => {
      cancelado = true;
    };
  }, [perfil?.user_id, perfil?.tipo_perfil, perfil?.codigo_representante, visaoEquipe]);

  if (!perfil && !visaoEquipe) return null;

  return (
    <section className="meu-dia-painel">
      <header className="meu-dia-painel-titulo">
        <div>
          <span>Sinalizados manualmente</span>
          <h3>Clientes em Pauta</h3>
        </div>
      </header>

      <div className="meu-dia-pauta-rodape">
        {onVerTodos && (
          <button
            type="button"
            className="meu-dia-botao-secundario"
            onClick={onVerTodos}
          >
            Ver todos
          </button>
        )}

        {onCadastrarNovo && (
          <button
            type="button"
            className="meu-dia-botao-secundario"
            onClick={onCadastrarNovo}
          >
            Cadastrar
          </button>
        )}
      </div>

      {carregando ? (
        <p className="meu-dia-texto-vazio">Carregando...</p>
      ) : itens.length ? (
        <div className="meu-dia-lista-clientes compacta">
          {itens.map((item) => {
            const dias = diasDesde(item.criado_em);
            const atrasado = dias >= LIMITE_DIAS_ATRASO;

            return (
              <div
                className={`cartao-pauta-meu-dia${atrasado ? " atrasado" : ""}`}
                key={item.id}
              >
                <span
                  className="cartao-pauta-meu-dia-nivel"
                  style={{ color: COR_CRITICIDADE[item.criticidade] }}
                >
                  {ROTULO_CRITICIDADE[item.criticidade] || item.criticidade}
                </span>
                <strong>{item.clientes?.cliente || "Cliente sem nome"}</strong>
                <span>
                  {item.clientes?.cidade || "-"} / {item.clientes?.uf || "-"} ·{" "}
                  {tempoDesde(dias)}
                  {atrasado && " · aguardando há muito tempo"}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="meu-dia-texto-vazio">
          Nenhum cliente em pauta no momento.
        </p>
      )}
    </section>
  );
}

export default ClientesEmPauta;
