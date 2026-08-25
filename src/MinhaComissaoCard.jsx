import { useEffect, useState } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { supabase } from "./supabaseClient";

const MESES_ABREV = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

function moeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function moedaCompacta(valor) {
  const numero = Number(valor || 0);
  if (Math.abs(numero) >= 1000) {
    return `R$ ${(numero / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}mil`;
  }
  return moeda(numero);
}

function percentual(valor) {
  return `${Number(valor || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  })}%`;
}

function GraficoMensal({ rotulo, titulo, serie, campo, aviso }) {
  const [indiceComparado, setIndiceComparado] = useState(null);

  const mesAtual = serie[serie.length - 1];
  const mesAnterior = serie[serie.length - 2];
  const valorAtual = Number(mesAtual?.[campo] || 0);
  const valorAnterior = Number(mesAnterior?.[campo] || 0);
  const variacao =
    mesAtual && mesAnterior && valorAnterior > 0
      ? ((valorAtual - valorAnterior) / valorAnterior) * 100
      : null;

  const maiorValor = Math.max(1, ...serie.map((item) => Number(item[campo] || 0)));
  const indiceAtivo = indiceComparado ?? serie.length - 1;
  const itemAtivo = serie[indiceAtivo] || mesAtual;

  return (
    <section className="meu-dia-painel meu-dia-painel-comissao">
      <header className="meu-dia-painel-titulo">
        <div>
          <span>{MESES_ABREV[(mesAtual?.mes || 1) - 1]} · {rotulo}</span>
          <h3>{titulo}</h3>
        </div>
      </header>

      <div className="comissao-card-hero">
        <strong>{moeda(valorAtual)}</strong>
        <span
          className={`comissao-card-delta ${
            variacao === null ? "invisivel" : variacao >= 0 ? "positivo" : "negativo"
          }`}
        >
          {variacao !== null && (variacao >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />)}
          {variacao !== null
            ? `${percentual(Math.abs(variacao))} vs ${MESES_ABREV[(mesAnterior?.mes || 1) - 1]}`
            : "—"}
        </span>
      </div>

      <div className={`comissao-card-faixa${aviso ? "" : " invisivel"}`}>
        {aviso || (
          <>
            <div className="comissao-card-faixa-linha">
              <span>—</span>
              <strong>—</strong>
            </div>
            <div className="comissao-card-progresso" />
          </>
        )}
      </div>

      <div className="comissao-card-grafico" aria-label={`${titulo} dos últimos 6 meses`}>
        {serie.map((item, indice) => {
          const valor = Number(item[campo] || 0);
          const altura = Math.max(6, (valor / maiorValor) * 100);
          const ativo = indice === indiceAtivo;
          return (
            <button
              type="button"
              key={`${item.ano}-${item.mes}`}
              className={`comissao-card-barra-item ${ativo ? "ativo" : ""}`}
              aria-label={`${MESES_ABREV[item.mes - 1]}: ${moeda(valor)}`}
              onMouseEnter={() => setIndiceComparado(indice)}
              onFocus={() => setIndiceComparado(indice)}
              onMouseLeave={() => setIndiceComparado(null)}
              onBlur={() => setIndiceComparado(null)}
            >
              <span className="comissao-card-barra-trilho">
                <span
                  className="comissao-card-barra"
                  style={{ height: `${altura}%` }}
                />
              </span>
              <small>{MESES_ABREV[item.mes - 1]}</small>
            </button>
          );
        })}
      </div>

      <div className="comissao-card-legenda">
        <span>{MESES_ABREV[(itemAtivo?.mes || 1) - 1]}</span>
        <strong>{moedaCompacta(itemAtivo?.[campo])}</strong>
      </div>
    </section>
  );
}

function MinhaComissaoCard({ perfil }) {
  const [carregando, setCarregando] = useState(true);
  const [historico, setHistorico] = useState([]);
  const [faixas, setFaixas] = useState([]);

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      setCarregando(true);

      const agora = new Date();
      const meses = [];
      for (let i = 5; i >= 0; i -= 1) {
        const data = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
        meses.push({ ano: data.getFullYear(), mes: data.getMonth() + 1 });
      }
      const anosEnvolvidos = [...new Set(meses.map((item) => item.ano))];
      const inicioJanela = `${meses[0].ano}-${String(meses[0].mes).padStart(2, "0")}-01`;
      const proximoMesFinal = new Date(meses[5].ano, meses[5].mes, 1);
      const fimJanela = `${proximoMesFinal.getFullYear()}-${String(
        proximoMesFinal.getMonth() + 1,
      ).padStart(2, "0")}-01`;

      const [retornoResumos, retornoFaixas, retornoLancamentos] = await Promise.all([
        supabase
          .from("comissoes_resumos_mensais")
          .select("*")
          .eq("codigo_representante", perfil.codigo_representante)
          .in("ano", anosEnvolvidos),
        supabase
          .from("comissoes_faixas")
          .select("*")
          .eq("codigo_representante", perfil.codigo_representante)
          .order("valor_meta", { ascending: true }),
        supabase
          .from("comissoes_lancamentos")
          .select("data_vencimento, valor_comissao, considerar, pago")
          .eq("codigo_representante", perfil.codigo_representante)
          .gte("data_vencimento", inicioJanela)
          .lt("data_vencimento", fimJanela),
      ]);

      if (!ativo) return;

      const resumos = retornoResumos.data || [];
      const lancamentos = retornoLancamentos.data || [];
      const serie = meses.map(({ ano, mes }) => {
        const item = resumos.find(
          (linha) => Number(linha.ano) === ano && Number(linha.mes) === mes,
        );
        const comissaoAReceber = lancamentos
          .filter((lancamento) => {
            const [anoVenc, mesVenc] = String(lancamento.data_vencimento || "")
              .slice(0, 7)
              .split("-")
              .map(Number);
            return (
              anoVenc === ano &&
              mesVenc === mes &&
              lancamento.considerar !== false &&
              !lancamento.pago
            );
          })
          .reduce((soma, lancamento) => soma + Number(lancamento.valor_comissao || 0), 0);
        return {
          ano,
          mes,
          comissaoPrevista: Number(item?.comissao_prevista || 0),
          comissaoAReceber,
          vendasLiquidas: Number(item?.vendas_liquidas || 0),
          modalidade: item?.modalidade || "F",
        };
      });

      setHistorico(serie);
      setFaixas(retornoFaixas.data || []);
      setCarregando(false);
    }

    if (perfil?.codigo_representante) {
      carregar();
    }

    return () => {
      ativo = false;
    };
  }, [perfil?.codigo_representante]);

  if (!perfil?.codigo_representante) return null;
  if (carregando) {
    return (
      <section className="meu-dia-painel meu-dia-painel-comissao">
        <header className="meu-dia-painel-titulo">
          <div>
            <span>Este mês</span>
            <h3>Sua comissão</h3>
          </div>
        </header>
        <p className="meu-dia-texto-vazio">Carregando comissão...</p>
      </section>
    );
  }

  const mesAtual = historico[historico.length - 1];

  const faixaAtual = [...faixas]
    .filter((faixa) => Number(faixa.valor_meta || 0) <= (mesAtual?.vendasLiquidas || 0))
    .sort((a, b) => Number(b.valor_meta) - Number(a.valor_meta))[0];
  const proximaFaixa = [...faixas]
    .filter((faixa) => Number(faixa.valor_meta || 0) > (mesAtual?.vendasLiquidas || 0))
    .sort((a, b) => Number(a.valor_meta) - Number(b.valor_meta))[0];

  const mostraFaixa =
    mesAtual?.modalidade === "V" && proximaFaixa && Number(proximaFaixa.valor_meta) > 0;
  const baseFaixa = Number(faixaAtual?.valor_meta || 0);
  const progressoFaixa = mostraFaixa
    ? Math.min(
        100,
        Math.max(
          0,
          ((mesAtual.vendasLiquidas - baseFaixa) /
            (Number(proximaFaixa.valor_meta) - baseFaixa)) *
            100,
        ),
      )
    : 0;
  const faltamParaFaixa = mostraFaixa
    ? Math.max(0, Number(proximaFaixa.valor_meta) - mesAtual.vendasLiquidas)
    : 0;

  const avisoFaixa = mostraFaixa && (
    <>
      <div className="comissao-card-faixa-linha">
        <span>Próxima faixa</span>
        <strong>{moeda(faltamParaFaixa)} restantes</strong>
      </div>
      <div className="comissao-card-progresso">
        <div
          className="comissao-card-progresso-fill"
          style={{ width: `${progressoFaixa}%` }}
        />
      </div>
    </>
  );

  return (
    <>
      <GraficoMensal
        rotulo="comissão prevista"
        titulo="Sua comissão"
        serie={historico}
        campo="comissaoPrevista"
        aviso={avisoFaixa}
      />
      <GraficoMensal
        rotulo="faturamento líquido"
        titulo="Faturamento"
        serie={historico}
        campo="vendasLiquidas"
      />
      <GraficoMensal
        rotulo="a vencer no mês"
        titulo="Comissões a receber"
        serie={historico}
        campo="comissaoAReceber"
      />
    </>
  );
}

export default MinhaComissaoCard;
