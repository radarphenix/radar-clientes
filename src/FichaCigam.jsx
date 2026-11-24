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

const numero = (v) => Number(v || 0).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
// Medidas do configurador do CIGAM: "2,95 × 42,49 m · CFM 350 · 1.750 g/m² · esp. 2,1 mm".
function textoMedidas(m) {
  if (!m) return "";
  const n = (v) => Number(v).toLocaleString("pt-BR", { maximumFractionDigits: 3 });
  const partes = [];
  if (m.largura && m.comprimento) partes.push(`${n(m.largura)} × ${n(m.comprimento)} m`);
  else if (m.largura) partes.push(`larg. ${n(m.largura)} m`);
  else if (m.comprimento) partes.push(`comp. ${n(m.comprimento)} m`);
  if (m.cfm) partes.push(`CFM ${n(m.cfm)}`);
  if (m.gramatura) partes.push(`${n(m.gramatura)} g/m²`);
  if (m.espessura) partes.push(`esp. ${n(m.espessura)}`);
  return partes.join(" · ");
}

const hojeISO = () => new Date().toISOString().slice(0, 10);

function diasEntre(de, ate) {
  return Math.round((new Date(`${ate}T12:00:00`) - new Date(`${de}T12:00:00`)) / 86400000);
}

// Cache por cliente+parte (5 min): Visão geral e as abas usam os mesmos dados sem consultar o CIGAM de novo.
const cache = new Map();
function buscar(cliente, parte, forcar) {
  const chave = `${cliente}|${parte}`;
  const c = cache.get(chave);
  if (c && !forcar && Date.now() - c.em < 300000) return c.promessa;
  const promessa = chamar({ cliente, ficha: parte }).then(async (r) => {
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || `Erro ${r.status}`);
    return j.itens || [];
  });
  promessa.catch(() => cache.delete(chave));
  cache.set(chave, { promessa, em: Date.now() });
  return promessa;
}

function useFicha(cliente, parte, ativo = true) {
  const [estado, setEstado] = useState({ itens: null, erro: "" });
  const [tentativa, setTentativa] = useState(0);
  useEffect(() => {
    if (!ativo) return undefined;
    let vivo = true;
    buscar(cliente, parte, tentativa > 0)
      .then((itens) => vivo && setEstado({ itens, erro: "" }))
      .catch((e) => vivo && setEstado({ itens: null, erro: e.message || "Falha na consulta." }));
    return () => {
      vivo = false;
    };
  }, [cliente, parte, tentativa, ativo]);
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
        <p>Não foi possível carregar: {estado.erro}</p>
        <div>
          <button type="button" onClick={repetir}>Tentar de novo</button>
        </div>
      </div>
    );
  if (estado.itens === null)
    return (
      <div className="acomp-carregando">
        <span className="acomp-spinner" aria-hidden="true" />
        <div><strong>Buscando…</strong></div>
      </div>
    );
  if (!estado.itens.length) return <div className="acomp-vazio">{vazio}</div>;
  return children;
}

function ItensPedido({ itens }) {
  if (!itens.length) return <div className="ficha-itens vazio">Pedido sem itens.</div>;
  return (
    <div className="ficha-itens" onClick={(e) => e.stopPropagation()}>
      {itens.map((i) => (
        <div key={i.seq} className="ficha-item">
          <div className="ficha-item-nome">
            <strong>{i.descricao}</strong>
            {i.medidas && <span className="ficha-medidas">{textoMedidas(i.medidas)}</span>}
            <small>Cód. {i.material}{i.prazo ? ` · entrega ${data(i.prazo)}` : ""}</small>
          </div>
          <div className="ficha-item-num">
            <span>{numero(i.qtd)} {i.un || ""} × {moeda(i.preco)}{i.desconto ? ` (−${numero(i.desconto)}%)` : ""}</span>
            <strong>{moeda(i.total)}</strong>
          </div>
        </div>
      ))}
    </div>
  );
}

// ------------------------------------------------------------------ Pedidos
export function PedidosCigam({ cliente }) {
  const [estado, repetir] = useFicha(cliente, "pedidos");
  const [soAbertos, setSoAbertos] = useState(true);
  const [abertoPedido, setAbertoPedido] = useState(null);
  const itens = estado.itens || [];
  const abertos = itens.filter((p) => p.situacao !== "F");
  const lista = soAbertos ? abertos : itens;
  const hoje = hojeISO();

  return (
    <Estado estado={estado} repetir={repetir} vazio="Nenhum pedido deste cliente.">
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
            const aberto = abertoPedido === p.codigo;
            return (
              <article
                key={p.codigo}
                className="ficha-linha ficha-linha-clicavel"
                data-aberto={aberto}
                role="button"
                tabIndex={0}
                aria-expanded={aberto}
                onClick={() => setAbertoPedido(aberto ? null : p.codigo)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setAbertoPedido(aberto ? null : p.codigo))}
              >
                <div className="ficha-linha-principal">
                  <strong>Pedido {p.codigo}</strong>
                  <span className={`ficha-selo sit-${(p.situacao || "").toLowerCase()}`}>{p.situacao_descricao || p.situacao}</span>
                  {atrasado && <span className="ficha-selo alerta">Prazo vencido</span>}
                </div>
                <div className="ficha-linha-detalhe">
                  <span>Emitido {data(p.data)}</span>
                  <span>Entrega {data(p.prazo_entrega)}</span>
                  {p.tipo && p.tipo !== "Normal" && <span>{p.tipo}</span>}
                  <span>{p.itens?.length || 0} {p.itens?.length === 1 ? "item" : "itens"} {aberto ? "▴" : "▾"}</span>
                </div>
                <strong className="ficha-valor">{moeda(p.total)}</strong>
                {aberto && <ItensPedido itens={p.itens || []} />}
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
    <Estado estado={estado} repetir={repetir} vazio="Nenhuma nota fiscal deste cliente.">
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
      <p className="ficha-nota">Mostra até as 200 notas mais recentes.</p>
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

// ------------------------------------------------------------------ Visão geral
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const moedaCurta = (v) => {
  const n = Number(v || 0);
  if (n >= 1e6) return `${(n / 1e6).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mi`;
  if (n >= 1e3) return `${(n / 1e3).toLocaleString("pt-BR", { maximumFractionDigits: 0 })} mil`;
  return n ? n.toLocaleString("pt-BR", { maximumFractionDigits: 0 }) : "";
};
function somarDias(iso, dias) {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

function calcular(pedidos, notas, abertos, pagos) {
  const hoje = hojeISO();
  const ha12 = somarDias(hoje, -365);
  const ha24 = somarDias(hoje, -730);
  const r = {};

  // Compras (notas)
  const n12 = notas.filter((n) => (n.emissao || "") >= ha12);
  const n24 = notas.filter((n) => (n.emissao || "") >= ha24 && (n.emissao || "") < ha12);
  r.total12 = n12.reduce((s, n) => s + n.total, 0);
  r.total24 = n24.reduce((s, n) => s + n.total, 0);
  r.variacao = r.total24 > 0 ? ((r.total12 - r.total24) / r.total24) * 100 : null;
  r.primeiraNota = notas.length ? notas[notas.length - 1].emissao : null;
  r.ticket = n12.length ? r.total12 / n12.length : 0;
  r.qtd12 = n12.length;
  const datas = [...new Set(notas.map((n) => n.emissao).filter(Boolean))].sort();
  const intervalos = datas.slice(1).map((d, i) => diasEntre(datas[i], d)).slice(-10);
  r.frequencia = intervalos.length ? Math.round(intervalos.reduce((s, x) => s + x, 0) / intervalos.length) : null;
  r.ultima = datas[datas.length - 1] || null;
  r.diasSemComprar = r.ultima ? diasEntre(r.ultima, hoje) : null;
  r.proxima = r.ultima && r.frequencia ? somarDias(r.ultima, r.frequencia) : null;

  // Compras por mês (últimos 12 meses, mês atual incluso)
  const base = new Date(`${hoje}T12:00:00`);
  r.meses = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(base.getFullYear(), base.getMonth() - 11 + i, 1);
    const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return { chave, rotulo: MESES[d.getMonth()], ano: d.getFullYear(), total: 0 };
  });
  for (const n of notas) {
    const m = r.meses.find((x) => (n.emissao || "").startsWith(x.chave));
    if (m) m.total += n.total;
  }

  // Produtos (itens dos pedidos)
  const prod = new Map();
  for (const p of pedidos)
    for (const i of p.itens || []) {
      // Mesmo produto em tamanho diferente é outra peça para o cliente: agrupa por produto + medidas.
      const medidas = textoMedidas(i.medidas);
      const k = `${i.material || i.descricao}|${medidas}`;
      const a = prod.get(k) || { chave: k, descricao: i.descricao, medidas, material: i.material, un: i.un, qtd: 0, valor: 0, pedidos: 0, ultima: "", preco: 0 };
      a.qtd += i.qtd;
      a.valor += i.total;
      a.pedidos += 1;
      if ((p.data || "") >= a.ultima) {
        a.ultima = p.data || "";
        a.preco = i.preco;
      }
      prod.set(k, a);
    }
  r.produtos = [...prod.values()].sort((a, b) => b.valor - a.valor);

  // Pedidos em aberto
  const ab = pedidos.filter((p) => p.situacao !== "F");
  r.abertos = ab.length;
  r.abertosValor = ab.reduce((s, p) => s + p.total, 0);
  r.atrasados = ab.filter((p) => p.prazo_entrega && p.prazo_entrega < hoje).length;
  r.proximaEntrega = ab.map((p) => p.prazo_entrega).filter((d) => d && d >= hoje).sort()[0] || null;

  // Financeiro
  if (abertos) {
    r.emAberto = abertos.reduce((s, t) => s + t.saldo, 0);
    const venc = abertos.filter((t) => t.vencimento && t.vencimento < hoje);
    r.vencido = venc.reduce((s, t) => s + t.saldo, 0);
    r.qtdVencidos = venc.length;
  }
  // Sem título pago ainda: pontualidade fica vazia (antes saía "undefined% de undefined").
  r.pontualidade = null;
  r.atrasoMedio = 0;
  r.qtdPagos = 0;
  if (pagos && pagos.length) {
    const atrasos = pagos.filter((t) => t.vencimento && t.pagamento).map((t) => diasEntre(t.vencimento, t.pagamento));
    const emDia = atrasos.filter((d) => d <= 0).length;
    const atrasados = atrasos.filter((d) => d > 0);
    r.pontualidade = atrasos.length ? Math.round((emDia / atrasos.length) * 100) : null;
    r.atrasoMedio = atrasados.length ? Math.round(atrasados.reduce((s, d) => s + d, 0) / atrasados.length) : 0;
    r.qtdPagos = atrasos.length;
  }
  return r;
}

function GraficoMeses({ meses }) {
  const max = Math.max(...meses.map((m) => m.total), 1);
  return (
    <div className="ficha-grafico" role="img" aria-label="Compras por mês nos últimos 12 meses">
      {meses.map((m) => (
        <div key={m.chave} className="ficha-barra" title={`${m.rotulo}/${m.ano}: ${moeda(m.total)}`}>
          <span className="ficha-barra-valor">{moedaCurta(m.total)}</span>
          <div className="ficha-barra-trilho">
            <div className="ficha-barra-cheia" style={{ height: `${(m.total / max) * 100}%` }} />
          </div>
          <span className="ficha-barra-mes">{m.rotulo}</span>
        </div>
      ))}
    </div>
  );
}

export function VisaoGeralCigam({ cliente, podeFinanceiro, podeVendas, irPara }) {
  const [ped, repPed] = useFicha(cliente, "pedidos");
  const [nf, repNf] = useFicha(cliente, "notas");
  const [tit] = useFicha(cliente, "titulos", podeFinanceiro);
  const [pag] = useFicha(cliente, "pagos", podeFinanceiro);
  const [todosProdutos, setTodosProdutos] = useState(false);

  const r = useMemo(
    () =>
      ped.itens && nf.itens
        ? calcular(ped.itens, nf.itens, podeFinanceiro ? tit.itens : null, podeFinanceiro ? pag.itens : null)
        : null,
    [ped.itens, nf.itens, tit.itens, pag.itens, podeFinanceiro],
  );

  const erro = ped.erro || nf.erro;
  if (erro)
    return (
      <Estado
        estado={{ itens: null, erro }}
        repetir={() => {
          repPed();
          repNf();
        }}
      />
    );
  if (!r) return <Estado estado={{ itens: null, erro: "" }} />;
  if (!ped.itens.length && !nf.itens.length)
    return <div className="acomp-vazio">Este cliente ainda não tem pedidos nem notas.</div>;

  const atrasadaProxima = r.proxima && r.proxima < hojeISO();
  const produtos = todosProdutos ? r.produtos : r.produtos.slice(0, 6);

  return (
    <div className="ficha-visao">
      <div className="ficha-kpis">
        <div className="ficha-kpi">
          <span>Comprado em 12 meses</span>
          <strong>{moeda(r.total12)}</strong>
          {r.variacao !== null ? (
            <small className={r.variacao >= 0 ? "positivo" : "negativo"}>
              {r.variacao >= 0 ? "▲" : "▼"} {Math.abs(r.variacao).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}% vs. 12 meses anteriores
            </small>
          ) : (
            <small>{r.primeiraNota ? `Histórico desde ${data(r.primeiraNota)}` : "Sem notas"}</small>
          )}
        </div>
        <div className="ficha-kpi">
          <span>Valor médio por nota</span>
          <strong>{moeda(r.ticket)}</strong>
          <small>{r.qtd12} nota{r.qtd12 === 1 ? "" : "s"} em 12 meses</small>
        </div>
        <div className="ficha-kpi">
          <span>Última compra</span>
          <strong>{r.ultima ? data(r.ultima) : "-"}</strong>
          <small className={r.diasSemComprar >= 90 ? "negativo" : ""}>
            {r.diasSemComprar !== null ? `há ${r.diasSemComprar} dia${r.diasSemComprar === 1 ? "" : "s"}` : "sem compras"}
          </small>
        </div>
        <div className="ficha-kpi">
          <span>Ritmo de compra</span>
          <strong>{r.frequencia ? `a cada ${r.frequencia} dias` : "-"}</strong>
          <small className={atrasadaProxima ? "negativo" : ""}>
            {r.proxima
              ? `${atrasadaProxima ? "próxima compra atrasada desde" : "próxima prevista para"} ${data(r.proxima)}`
              : "poucas compras para estimar"}
          </small>
        </div>
      </div>

      <section className="ficha-bloco">
        <h3>Compras por mês (notas)</h3>
        <GraficoMeses meses={r.meses} />
      </section>

      <div className="ficha-colunas">
        <section className="ficha-bloco">
          <div className="ficha-bloco-topo">
            <h3>Pedidos em aberto</h3>
            {podeVendas && (
              <button type="button" className="ficha-link" onClick={() => irPara("pedidos")}>ver pedidos</button>
            )}
          </div>
          {r.abertos ? (
            <ul className="ficha-fatos">
              <li><span>Pedidos</span><strong>{r.abertos}</strong></li>
              <li><span>Valor</span><strong>{moeda(r.abertosValor)}</strong></li>
              <li><span>Com prazo vencido</span><strong className={r.atrasados ? "negativo" : ""}>{r.atrasados}</strong></li>
              <li><span>Próxima entrega</span><strong>{data(r.proximaEntrega)}</strong></li>
            </ul>
          ) : (
            <p className="ficha-nota">Nenhum pedido em aberto.</p>
          )}
        </section>

        {podeFinanceiro && (
          <section className="ficha-bloco">
            <div className="ficha-bloco-topo">
              <h3>Financeiro</h3>
              <button type="button" className="ficha-link" onClick={() => irPara("titulos")}>ver títulos</button>
            </div>
            {tit.itens === null && !tit.erro ? (
              <p className="ficha-nota">Carregando…</p>
            ) : (
              <ul className="ficha-fatos">
                <li><span>Em aberto</span><strong>{moeda(r.emAberto)}</strong></li>
                <li>
                  <span>Vencido</span>
                  <strong className={r.vencido ? "negativo" : ""}>
                    {moeda(r.vencido)}
                    {r.qtdVencidos ? ` (${r.qtdVencidos})` : ""}
                  </strong>
                </li>
                <li>
                  <span>Pagou em dia</span>
                  <strong className={r.pontualidade === null ? "" : r.pontualidade < 70 ? "negativo" : "positivo"}>
                    {r.pontualidade !== null ? `${r.pontualidade}% de ${r.qtdPagos}` : "nenhum título pago ainda"}
                  </strong>
                </li>
                <li><span>Atraso médio quando atrasa</span><strong>{r.atrasoMedio ? `${r.atrasoMedio} dias` : "-"}</strong></li>
              </ul>
            )}
          </section>
        )}
      </div>

      <section className="ficha-bloco">
        <div className="ficha-bloco-topo">
          <h3>Produtos mais comprados</h3>
          <small>{r.produtos.length} produto{r.produtos.length === 1 ? "" : "s"} nos pedidos</small>
        </div>
        {r.produtos.length ? (
          <div className="ficha-produtos">
            {produtos.map((p, i) => (
              <div key={p.chave} className="ficha-produto">
                <span className="ficha-produto-pos">{i + 1}</span>
                <div className="ficha-produto-nome">
                  <strong>{p.descricao}</strong>
                  {p.medidas && <span className="ficha-medidas">{p.medidas}</span>}
                  <small>
                    {numero(p.qtd)} {p.un || ""} em {p.pedidos} pedido{p.pedidos === 1 ? "" : "s"} · último em {data(p.ultima)} a{" "}
                    {moeda(p.preco)}
                  </small>
                </div>
                <strong className="ficha-valor">{moeda(p.valor)}</strong>
              </div>
            ))}
          </div>
        ) : (
          <p className="ficha-nota">Pedidos sem itens.</p>
        )}
        {r.produtos.length > 6 && (
          <button type="button" className="ficha-link" onClick={() => setTodosProdutos(!todosProdutos)}>
            {todosProdutos ? "mostrar menos" : `ver todos os ${r.produtos.length}`}
          </button>
        )}
      </section>
    </div>
  );
}
