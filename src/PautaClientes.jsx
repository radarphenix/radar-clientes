import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";
import {
  NIVEIS_CRITICIDADE,
  ROTULO_CRITICIDADE,
  ROTULO_STATUS_PAUTA,
  COR_CRITICIDADE,
} from "./lib/pautaCriticidade.js";
import "./pauta.css";

function diasDesde(dataIso) {
  const diffMs = Date.now() - new Date(dataIso).getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function formatarDias(dias) {
  if (dias <= 0) return "hoje";
  if (dias === 1) return "há 1 dia";
  return `há ${dias} dias`;
}

function formatarDataHora(dataIso) {
  if (!dataIso) return "-";
  return new Date(dataIso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const LIMITE_DIAS_ATRASO = 15;

function PautaClientes({ onEditar, onRemover, onNovoCadastro, sincronizarQuando }) {
  const [itens, setItens] = useState([]);
  const [nomesPorUsuario, setNomesPorUsuario] = useState(new Map());
  const [rotaInfoPorPautaId, setRotaInfoPorPautaId] = useState(new Map());
  const [carregando, setCarregando] = useState(true);
  const [mostrarHistorico, setMostrarHistorico] = useState(false);
  const [filtroTexto, setFiltroTexto] = useState("");
  const [filtroCriticidade, setFiltroCriticidade] = useState("");
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    let cancelado = false;

    async function carregar() {
      setCarregando(true);

      let consulta = supabase
        .from("clientes_em_pauta")
        .select(
          "id, criticidade, status, observacao, motivo_remocao, criado_por, criado_em, atualizado_por, atualizado_em, resolvido_em, cliente_id, rota_cliente_id, clientes(id, cliente, codigo_cliente, cidade, uf)",
        );

      consulta = mostrarHistorico
        ? consulta.order("criado_em", { ascending: false })
        : consulta
            .in("status", ["ATIVO", "EM_ROTA"])
            .order("criticidade_peso", { ascending: true });

      const { data, error } = await consulta;

      if (cancelado) return;

      if (error) {
        console.warn("Falha ao carregar clientes em pauta:", error.message);
        setItens([]);
        setCarregando(false);
        return;
      }

      const linhas = data || [];
      setItens(linhas);

      const idsUsuarios = [
        ...new Set(
          linhas.flatMap((item) =>
            [item.criado_por, item.atualizado_por].filter(Boolean),
          ),
        ),
      ];

      if (idsUsuarios.length) {
        const { data: perfis } = await supabase
          .from("perfis")
          .select("user_id, nome")
          .in("user_id", idsUsuarios);

        if (!cancelado) {
          setNomesPorUsuario(
            new Map((perfis || []).map((item) => [item.user_id, item.nome])),
          );
        }
      }

      const idsRotaCliente = linhas
        .filter((item) => item.status === "EM_ROTA" && item.rota_cliente_id)
        .map((item) => item.rota_cliente_id);

      if (idsRotaCliente.length) {
        const { data: rotaClientesEncontrados } = await supabase
          .from("rota_clientes")
          .select("id, rota_id")
          .in("id", idsRotaCliente);

        const rotaIdPorRotaClienteId = new Map(
          (rotaClientesEncontrados || []).map((item) => [item.id, item.rota_id]),
        );

        const idsRotas = [
          ...new Set((rotaClientesEncontrados || []).map((item) => item.rota_id)),
        ];

        if (idsRotas.length && !cancelado) {
          const { data: rotasEncontradas } = await supabase
            .from("rotas")
            .select("id, nome, status")
            .in("id", idsRotas);

          const rotaPorId = new Map(
            (rotasEncontradas || []).map((item) => [item.id, item]),
          );

          if (!cancelado) {
            setRotaInfoPorPautaId(
              new Map(
                linhas
                  .filter(
                    (item) => item.status === "EM_ROTA" && item.rota_cliente_id,
                  )
                  .map((item) => [
                    item.id,
                    rotaPorId.get(
                      rotaIdPorRotaClienteId.get(item.rota_cliente_id),
                    ),
                  ])
                  .filter(([, rota]) => rota),
              ),
            );
          }
        }
      } else {
        setRotaInfoPorPautaId(new Map());
      }

      setCarregando(false);
    }

    carregar();

    return () => {
      cancelado = true;
    };
  }, [mostrarHistorico, versao, sincronizarQuando]);

  const itensFiltrados = useMemo(() => {
    const termo = filtroTexto.trim().toLowerCase();

    return itens.filter((item) => {
      if (filtroCriticidade && item.criticidade !== filtroCriticidade) {
        return false;
      }

      if (!termo) return true;

      const cliente = item.clientes;
      return (
        cliente?.cliente?.toLowerCase().includes(termo) ||
        cliente?.codigo_cliente?.toLowerCase().includes(termo) ||
        cliente?.cidade?.toLowerCase().includes(termo) ||
        cliente?.uf?.toLowerCase().includes(termo)
      );
    });
  }, [itens, filtroTexto, filtroCriticidade]);

  async function handleRemover(item) {
    const sucesso = await onRemover(item);
    if (sucesso) setVersao((atual) => atual + 1);
  }

  const presosEmRotaAberta = itens.filter((item) => {
    if (item.status !== "EM_ROTA") return false;
    const rota = rotaInfoPorPautaId.get(item.id);
    if (!rota || rota.status === "FINALIZADA") return false;
    return diasDesde(item.atualizado_em) >= LIMITE_DIAS_ATRASO;
  });

  return (
    <div className="painel-pauta-clientes">
      <div className="pauta-clientes-cabecalho">
        <div>
          <h2>Clientes em Pauta</h2>
          <p>
            Clientes sinalizados manualmente por criticidade, compartilhado
            com a equipe.
          </p>
        </div>

        <button type="button" onClick={onNovoCadastro}>
          Cadastrar novo
        </button>
      </div>

      {presosEmRotaAberta.length > 0 && !mostrarHistorico && (
        <div className="pauta-clientes-alerta-presos">
          <strong>{presosEmRotaAberta.length}</strong> cliente
          {presosEmRotaAberta.length > 1
            ? "s em pauta estão presos"
            : " em pauta está preso"}{" "}
          há {LIMITE_DIAS_ATRASO}+ dias numa rota que ainda não foi finalizada -
          a visita pode ter sido esquecida.
        </div>
      )}

      <div className="pauta-clientes-filtros">
        <input
          type="text"
          className="campo-busca"
          placeholder="Buscar por cliente, código, cidade, UF..."
          value={filtroTexto}
          onChange={(e) => setFiltroTexto(e.target.value)}
        />

        <select
          value={filtroCriticidade}
          onChange={(e) => setFiltroCriticidade(e.target.value)}
        >
          <option value="">Todos os níveis</option>
          {NIVEIS_CRITICIDADE.map((nivel) => (
            <option key={nivel} value={nivel}>
              {ROTULO_CRITICIDADE[nivel]}
            </option>
          ))}
        </select>

        <label className="pauta-clientes-toggle-historico">
          <input
            type="checkbox"
            checked={mostrarHistorico}
            onChange={(e) => setMostrarHistorico(e.target.checked)}
          />
          Mostrar histórico (atendidos/descartados)
        </label>
      </div>

      {carregando ? (
        <p className="pauta-clientes-vazio">Carregando...</p>
      ) : itensFiltrados.length === 0 ? (
        <p className="pauta-clientes-vazio">Nenhum cliente encontrado.</p>
      ) : (
        <div className="lista-pauta-clientes">
          {itensFiltrados.map((item) => {
            const podeGerenciar =
              item.status === "ATIVO" || item.status === "EM_ROTA";
            const dias = diasDesde(item.criado_em);
            const nomeCriador = nomesPorUsuario.get(item.criado_por) || "-";
            const rotaVinculada = rotaInfoPorPautaId.get(item.id);
            const diasEmRota = diasDesde(item.atualizado_em);
            const presoNaRota =
              item.status === "EM_ROTA" &&
              rotaVinculada &&
              rotaVinculada.status !== "FINALIZADA" &&
              diasEmRota >= LIMITE_DIAS_ATRASO;
            const atrasado =
              podeGerenciar && (dias >= LIMITE_DIAS_ATRASO || presoNaRota);

            return (
              <div
                className={`cartao-pauta-clientes${atrasado ? " atrasado" : ""}`}
                key={item.id}
              >
                <div
                  className="cartao-pauta-clientes-faixa"
                  style={{ background: COR_CRITICIDADE[item.criticidade] }}
                />

                <div className="cartao-pauta-clientes-corpo">
                  <div className="cartao-pauta-clientes-topo">
                    <strong>{item.clientes?.cliente || "Cliente removido"}</strong>
                    <span
                      className="cartao-pauta-clientes-nivel"
                      style={{ color: COR_CRITICIDADE[item.criticidade] }}
                    >
                      {ROTULO_CRITICIDADE[item.criticidade] || item.criticidade}
                    </span>
                  </div>

                  <p className="cartao-pauta-clientes-info">
                    {item.clientes?.codigo_cliente} · {item.clientes?.cidade} /{" "}
                    {item.clientes?.uf}
                  </p>

                  {item.observacao && (
                    <p className="cartao-pauta-clientes-observacao">
                      {item.observacao}
                    </p>
                  )}

                  <p className="cartao-pauta-clientes-meta">
                    Cadastrado por <strong>{nomeCriador}</strong>,{" "}
                    {formatarDias(dias)} ({formatarDataHora(item.criado_em)})
                    {atrasado && (
                      <span className="cartao-pauta-clientes-alerta">
                        {" "}
                        · aguardando há {dias} dias
                      </span>
                    )}
                  </p>

                  {item.status === "EM_ROTA" && (
                    <p className="cartao-pauta-clientes-status status-em-rota">
                      {ROTULO_STATUS_PAUTA.EM_ROTA}
                      {rotaVinculada ? ` - ${rotaVinculada.nome}` : ""}
                      {presoNaRota && (
                        <span className="cartao-pauta-clientes-alerta">
                          {" "}
                          · rota parada há {diasEmRota} dias, ainda não
                          finalizada
                        </span>
                      )}
                    </p>
                  )}

                  {!podeGerenciar && (
                    <p className="cartao-pauta-clientes-status">
                      {ROTULO_STATUS_PAUTA[item.status] || item.status}
                      {item.resolvido_em
                        ? ` em ${formatarDataHora(item.resolvido_em)}`
                        : ""}
                      {item.motivo_remocao
                        ? ` · Motivo: ${item.motivo_remocao}`
                        : ""}
                    </p>
                  )}
                </div>

                {podeGerenciar && (
                  <div className="cartao-pauta-clientes-acoes">
                    <button type="button" onClick={() => onEditar(item)}>
                      Editar
                    </button>

                    <button
                      type="button"
                      className="botao-remover-pauta"
                      onClick={() => handleRemover(item)}
                    >
                      Remover
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default PautaClientes;
