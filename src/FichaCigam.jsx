import { useEffect, useMemo, useState } from "react";
import { chamarAcompanhamentosCigam as chamar } from "./lib/cigamAcompanhamentos.js";

// Abas Pedidos / Notas / Financeiro da ficha do cliente (CIGAM, somente leitura).
// Função: cigam-acompanhamentos?cliente=&ficha=pedidos|notas|titulos. Permissões:
// clientes.cigam_vendas (pedidos e notas) e clientes.cigam_financeiro (títulos), conferidas no servidor.

const moeda = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function data(d) {
  if (!d) return "-";
  const [a, m, dia] = String(d).slice(0, 10).split("-");
  return dia ? `${dia}/${m}/${a}` : "-";
}

const hojeISO = () => new Date().toISOString().slice(0, 10);

function diasEntre(de, ate) {
  return Math.round((new Date(`${ate}T12:00:00`) - new Date(`${de}T12:00:00`)) / 86400000);
}

function useFicha(cliente, parte) {
  const [estado, setEstado] = useState({ itens: null, erro: "" });
  const [tentativa, setTentativa] = useState(0);
  useEffect(() => {
    let ativo = true;
    chamar({ cliente, ficha: parte })
      .then(async (r) => {
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error || `Erro ${r.status}`);
        if (ativo) setEstado({ itens: j.itens || [], erro: "" });
      })
      .catch((e) => ativo && setEstado({ itens: null, erro: e.message || "Falha ao consultar o CIGAM." }));
    return () => {
      ativo = false;
    };
  }, [cliente, parte, tentativa]);
  const repetir = () => {
    setEstado({ itens: null, erro: "" });
    setTentativa((t) => t + 1);
  };
  return [estado, repetir];
}

function Estado({ estado, repetir, vazio, children }) {
  if (estado.erro)
    return (
      <div className="acomp-aviso erro">
        <p>Não foi possível consultar o CIGAM: {estado.erro}</p>
        <div>
          <button type="button" onClick={repetir}>Tentar de novo</button>
        </div>
      </div>
    );
  if (estado.itens === null)
    return (
      <div className="acomp-carregando">
        <span className="acomp-spinner" aria-hidden="true" />
        <div><strong>Buscando no CIGAM…</strong></div>
      </div>
    );
  if (!estado.itens.length) return <div className="acomp-vazio">{vazio}</div>;
  return children;
}

// ------------------------------------------------------------------ Pedidos
export function PedidosCigam({ cliente }) {
  const [estado, repetir] = useFicha(cliente, "pedidos");
  const [soAbertos, setSoAbertos] = useState(true);
  const itens = estado.itens || [];
  const abertos = itens.filter((p) => p.situacao !== "F");
  const lista = soAbertos ? abertos : itens;
  const hoje = hojeISO();

  return (
    <Estado estado={estado} repetir={repetir} vazio="Nenhum pedido deste cliente no CIGAM.">
      <div className="acomp-resumo">
        <div><strong>{abertos.length}</strong><span>Em aberto</span></div>
        <div><strong>{moeda(abertos.reduce((s, p) => s + p.total, 0))}</strong><span>Total em aberto</span></div>
        <div><strong>{data(itens[0]?.data)}</strong><span>Último pedido</span></div>
      </div>
      <div className="acomp-chips ficha-chips">
        <button type="button" className="chip-historico" data-active={soAbertos} onClick={() => setSoAbertos(true)}>
          Em aberto <span>{abertos.length}</span>
        </button>
        <button type="button" className="chip-historico" data-active={!soAbertos} onClick={() => setSoAbertos(false)}>
          Todos <span>{itens.length}</span>
        </button>
      </div>
      {lista.length === 0 ? (
        <div className="acomp-vazio">Nenhum pedido em aberto. 👍</div>
      ) : (
        <div className="ficha-lista">
          {lista.map((p) => {
            const atrasado = p.situacao !== "F" && p.prazo_entrega && p.prazo_entrega < hoje;
            return (
              <article key={p.codigo} className="ficha-linha">
                <div className="ficha-linha-principal">
                  <strong>Pedido {p.codigo}</strong>
                  <span className={`ficha-selo sit-${(p.situacao || "").toLowerCase()}`}>{p.situacao_descricao || p.situacao}</span>
                  {atrasado && <span className="ficha-selo alerta">Prazo vencido</span>}
                </div>
                <div className="ficha-linha-detalhe">
                  <span>Emitido {data(p.data)}</span>
                  <span>Entrega {data(p.prazo_entrega)}</span>
                  {p.tipo && p.tipo !== "Normal" && <span>{p.tipo}</span>}
                </div>
                <strong className="ficha-valor">{moeda(p.total)}</strong>
              </article>
            );
          })}
        </div>
      )}
    </Estado>
  );
}

// ------------------------------------------------------------------ Notas
export function NotasCigam({ cliente }) {
  const [estado, repetir] = useFicha(cliente, "notas");
  const itens = useMemo(() => estado.itens || [], [estado.itens]);
  const resumo = useMemo(() => {
    const limite = new Date();
    limite.setFullYear(limite.getFullYear() - 1);
    const corte = limite.toISOString().slice(0, 10);
    const ano = itens.filter((n) => (n.emissao || "") >= corte);
    return { total12: ano.reduce((s, n) => s + n.total, 0), qtd12: ano.length };
  }, [itens]);

  return (
    <Estado estado={estado} repetir={repetir} vazio="Nenhuma nota fiscal deste cliente no CIGAM.">
      <div className="acomp-resumo">
        <div><strong>{moeda(resumo.total12)}</strong><span>Comprado em 12 meses</span></div>
        <div><strong>{resumo.qtd12}</strong><span>Notas em 12 meses</span></div>
        <div><strong>{data(itens[0]?.emissao)}</strong><span>Última compra</span></div>
      </div>
      <div className="ficha-lista">
        {itens.map((n) => (
          <article key={`${n.serie}-${n.nf}`} className="ficha-linha">
            <div className="ficha-linha-principal">
              <strong>NF {n.nf}</strong>
              {n.tipo && n.tipo !== "Normal" && <span className="ficha-selo">{n.tipo}</span>}
            </div>
            <div className="ficha-linha-detalhe">
              <span>Emitida {data(n.emissao)}</span>
              {n.pedido && <span>Pedido {n.pedido}</span>}
              {n.frete && <span>Frete {n.frete}</span>}
            </div>
            <strong className="ficha-valor">{moeda(n.total)}</strong>
          </article>
        ))}
      </div>
      <p className="ficha-nota">Mostra as 40 notas mais recentes.</p>
    </Estado>
  );
}

// ------------------------------------------------------------------ Financeiro
export function TitulosCigam({ cliente }) {
  const [estado, repetir] = useFicha(cliente, "titulos");
  const itens = estado.itens || [];
  const hoje = hojeISO();
  const vencidos = itens.filter((t) => t.vencimento && t.vencimento < hoje);
  const maiorAtraso = vencidos.reduce((m, t) => Math.max(m, diasEntre(t.vencimento, hoje)), 0);

  return (
    <Estado estado={estado} repetir={repetir} vazio="Nenhum título em aberto. Cliente em dia. 👍">
      <div className="acomp-resumo">
        <div><strong>{moeda(itens.reduce((s, t) => s + t.saldo, 0))}</strong><span>Em aberto ({itens.length})</span></div>
        <div className={vencidos.length ? "ficha-resumo-alerta" : ""}>
          <strong>{moeda(vencidos.reduce((s, t) => s + t.saldo, 0))}</strong>
          <span>Vencido ({vencidos.length})</span>
        </div>
        <div className={maiorAtraso > 0 ? "ficha-resumo-alerta" : ""}>
          <strong>{maiorAtraso ? `${maiorAtraso} dias` : "-"}</strong>
          <span>Maior atraso</span>
        </div>
      </div>
      <div className="ficha-lista">
        {itens.map((t) => {
          const dias = t.vencimento ? diasEntre(hoje, t.vencimento) : null;
          const vencido = dias !== null && dias < 0;
          return (
            <article key={t.codigo} className="ficha-linha" data-vencido={vencido}>
              <div className="ficha-linha-principal">
                <strong>{t.nf ? `NF ${t.nf}${t.parcela ? ` · parcela ${t.parcela}` : ""}` : `Título ${t.codigo}`}</strong>
                {vencido ? (
                  <span className="ficha-selo alerta">Vencido há {-dias} dia{dias === -1 ? "" : "s"}</span>
                ) : (
                  <span className="ficha-selo">{dias === 0 ? "Vence hoje" : `Vence em ${dias} dia${dias === 1 ? "" : "s"}`}</span>
                )}
              </div>
              <div className="ficha-linha-detalhe">
                <span>Vencimento {data(t.vencimento)}</span>
                <span>Emissão {data(t.emissao)}</span>
                {t.saldo !== t.valor && <span>Valor original {moeda(t.valor)}</span>}
              </div>
              <strong className="ficha-valor">{moeda(t.saldo)}</strong>
            </article>
          );
        })}
      </div>
    </Estado>
  );
}
