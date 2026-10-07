import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "./supabaseClient";
import RelatorioProdutosFeira from "./RelatorioProdutosFeira.jsx";
import EstatisticasFeira from "./EstatisticasFeira.jsx";

const formatarTelefone = (t) => {
  const d = String(t || "").replace(/\D/g, "");
  return d.length === 11 ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}` : d.length === 10 ? `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}` : t;
};

// API pública de resultados da Caixa (responde com CORS liberado, então o painel consulta direto).
const API_LOTERIA_FEDERAL = "https://servicebus2.caixa.gov.br/portaldeloterias/api/federal";
const PAGINA_LOTERIA_FEDERAL = "https://loterias.caixa.gov.br/Paginas/Federal.aspx";

// Contador da feira (tabela veste_phenix_eventos): nome de cada evento no painel.
const EVENTOS_FEIRA = [
  ["menu_veste_phenix", "Botão Veste Phenix (menu da feira)"],
  ["menu_cadastro_produtos", "Botão Cadastro de Produtos (menu da feira)"],
  ["menu_vestcontrol", "Botão VestControl (menu da feira)"],
  ["acesso_promocao", "Acessos à página da promoção (link/QR code)"],
  ["inscricao_concluida", "Inscrições concluídas"],
];
const NOME_ORIGEM = { stand: "tablets do stand", qrcode: "QR code", direto: "link direto (sem origem)" };

export default function PromocaoVestePhenix() {
  const [aba, setAba] = useState("promocao");
  const [inscricoes, setInscricoes] = useState([]);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [numero, setNumero] = useState("");
  const [data, setData] = useState("2026-11-04");
  const [resultado, setResultado] = useState(null);
  const [limpando, setLimpando] = useState(false);
  const [resultadoLimpeza, setResultadoLimpeza] = useState("");
  const [revertendo, setRevertendo] = useState(false);
  const [revertendoTodos, setRevertendoTodos] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const [apuracaoVigente, setApuracaoVigente] = useState(null);
  const [buscasAnteriores, setBuscasAnteriores] = useState([]);
  const [buscandoProximo, setBuscandoProximo] = useState(false);
  const [comunicando, setComunicando] = useState("");
  const [resultadoComunicado, setResultadoComunicado] = useState("");
  const [resultadoReenvio, setResultadoReenvio] = useState("");
  const [concurso, setConcurso] = useState("");
  const [sorteios, setSorteios] = useState(null);
  const [buscandoSorteios, setBuscandoSorteios] = useState(false);
  const [erroSorteios, setErroSorteios] = useState("");
  const [atualizando, setAtualizando] = useState(false);
  const [atualizadoEm, setAtualizadoEm] = useState(null);
  const [eventos, setEventos] = useState([]);

  // silencioso: recarga automática/botão Atualizar — mantém a tabela na tela e,
  // se a rede falhar, preserva a última lista carregada.
  async function carregar({ silencioso = false } = {}) {
    if (!silencioso) setCarregando(true);
    else setAtualizando(true);
    const { data: d, error } = await supabase
      .from("promocao_veste_phenix_30_anos_com_numeros")
      .select("*")
      .order("criado_em");
    if (!error || !silencioso) setInscricoes(d || []);
    setErro(error ? "Não foi possível carregar as inscrições." : "");
    if (!error) setAtualizadoEm(new Date());
    const { data: ev, error: erroEventos } = await supabase.rpc("resumo_eventos_veste_phenix");
    if (!erroEventos) setEventos(ev || []);
    const { data: ap } = await supabase
      .from("promocao_veste_phenix_30_anos_apuracoes")
      .select("*")
      .is("revertida_em", null)
      .order("executado_em", { ascending: false });
    // Vigente = a busca mais recente ainda não desclassificada; as desclassificadas
    // ficam como histórico (registro permanente das buscas anteriores).
    setApuracaoVigente((ap || []).find((a) => !a.desclassificada_em) || null);
    setBuscasAnteriores((ap || []).filter((a) => a.desclassificada_em).sort((a, b) => a.ordem_busca - b.ordem_busca));
    setCarregando(false);
    setAtualizando(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carregamento inicial da lista
    carregar();
  }, []);

  // Durante a feira as inscrições chegam com o painel aberto: recarrega a cada minuto
  // (só com a aba visível) e ao voltar para a aba.
  useEffect(() => {
    const recarregar = () => {
      if (document.visibilityState === "visible") carregar({ silencioso: true });
    };
    const timer = setInterval(recarregar, 60000);
    document.addEventListener("visibilitychange", recarregar);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", recarregar);
    };
  }, []);

  const falhasEmail = inscricoes.filter((i) => ["falhou", "aguardando_configuracao"].includes(i.email_status)).length;

  // Reenvia em lotes as confirmações que falharam (ex.: cota diária do Gmail esgotada durante a feira).
  async function reenviarEmails() {
    setReenviando(true);
    setResultadoReenvio("");
    let enviados = 0;
    let restantes = falhasEmail;
    try {
      for (let lote = 0; lote < 10 && restantes > 0; lote++) {
        const { data, error } = await supabase.functions.invoke("inscrever-veste-phenix", { body: { acao: "reenviar_emails" } });
        if (error || !data?.ok) {
          let msg = "Não foi possível reenviar agora.";
          try { const corpo = await error?.context?.json?.(); if (corpo?.mensagem) msg = corpo.mensagem; } catch { /* sem JSON */ }
          setResultadoReenvio(msg);
          return;
        }
        enviados += data.enviados;
        restantes = data.restantes;
        if (!data.enviados) break;
      }
      setResultadoReenvio(
        `${enviados} ${enviados === 1 ? "e-mail reenviado" : "e-mails reenviados"}.` +
          (restantes ? ` ${restantes} ainda sem envio — provavelmente a cota diária do Gmail; tente de novo mais tarde.` : ""),
      );
    } finally {
      setReenviando(false);
      carregar();
    }
  }

  function exportar() {
    const linhas = inscricoes.map((i) => ({
      "Números da sorte": i.numeros_sorte
        .map((n) => String(n).padStart(5, "0"))
        .join(", "),
      Nome: i.nome_completo,
      CPF: i.cpf,
      "E-mail": i.email,
      WhatsApp: i.telefone,
      Empresa: i.empresa,
      CNPJ: i.cnpj,
      Cargo: i.cargo,
      Cidade: i.cidade,
      UF: i.uf,
      Segmento: i.segmento,
      "Relação Phenix": i.relacao_phenix,
      Status: i.status,
      "Inscrição em": i.criado_em,
      "E-mail enviado em": i.email_confirmacao_enviado_em || "",
      "Status do e-mail": i.email_status || "",
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(linhas),
      "Inscrições",
    );
    XLSX.writeFile(
      wb,
      `veste_phenix_30_anos_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  }

  // Extrações da Loteria Federal dos últimos 30 dias, para conferência do número apurado.
  // A API só devolve um concurso por chamada; percorre do mais recente para trás.
  async function buscarSorteios() {
    setBuscandoSorteios(true);
    setErroSorteios("");
    const limite = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const lista = [];
    try {
      let url = API_LOTERIA_FEDERAL;
      for (let i = 0; i < 12; i++) {
        const resp = await fetch(url, { headers: { Accept: "application/json" } });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const j = await resp.json();
        const [dia, mes, ano] = String(j.dataApuracao).split("/");
        const dataIso = `${ano}-${mes}-${dia}`;
        if (new Date(`${dataIso}T12:00:00`).getTime() < limite) break;
        lista.push({
          concurso: j.numero,
          data: dataIso,
          premios: (j.listaDezenas || []).map((n) => String(n).slice(-5).padStart(5, "0")),
        });
        if (!j.numeroConcursoAnterior) break;
        url = `${API_LOTERIA_FEDERAL}/${j.numeroConcursoAnterior}`;
      }
      setSorteios(lista);
    } catch {
      setSorteios(lista.length ? lista : null);
      setErroSorteios("Não foi possível consultar a Caixa agora. Tente de novo em instantes ou confira no site oficial.");
    } finally {
      setBuscandoSorteios(false);
    }
  }

  function usarSorteio(s) {
    setNumero(s.premios[0]);
    setData(s.data);
    setConcurso(String(s.concurso));
    setErro("");
  }

  async function apurar() {
    if (!/^\d+$/.test(numero)) {
      return setErro(
        "Informe somente os algarismos do resultado da Loteria Federal.",
      );
    }
    if (!confirm("Esta ação registra oficialmente a apuração. Deseja continuar?")) {
      return;
    }
    const { data: r, error } = await supabase.rpc("apurar_veste_phenix", {
      p_numero_loteria: Number(numero),
      p_data_extracao: data,
      p_concurso: concurso || null,
      p_fonte_url: concurso ? PAGINA_LOTERIA_FEDERAL : null,
    });
    if (error) return setErro(error.message);
    setResultado(r?.[0]);
    setErro("");
    await carregar();
  }

  // Comunicado ao contemplado: disparo manual, por e-mail ou WhatsApp (WAHA), pela Edge Function.
  async function comunicar(canal) {
    if (!apuracaoVigente || !contemplado) return;
    const jaEnviado = canal === "email" ? apuracaoVigente.comunicado_email_em : apuracaoVigente.comunicado_whatsapp_em;
    const destino = canal === "email" ? contemplado.email : formatarTelefone(contemplado.telefone);
    const pergunta = jaEnviado
      ? `O ${canal === "email" ? "e-mail" : "WhatsApp"} já foi enviado em ${new Date(jaEnviado).toLocaleString("pt-BR")}. Enviar de novo para ${destino}?`
      : `Enviar o comunicado de contemplado por ${canal === "email" ? "e-mail" : "WhatsApp"} para ${destino}?`;
    if (!confirm(pergunta)) return;
    setComunicando(canal);
    setResultadoComunicado("");
    const { data: r, error } = await supabase.functions.invoke("inscrever-veste-phenix", {
      body: { acao: "comunicar_contemplado", apuracao_id: apuracaoVigente.id, canal },
    });
    let msg = r?.mensagem;
    if (error && !msg) { try { msg = (await error.context?.json?.())?.mensagem; } catch { /* sem JSON */ } }
    setResultadoComunicado(error || !r?.ok ? msg || "Não foi possível enviar agora." : `${canal === "email" ? "E-mail" : "WhatsApp"} enviado ao contemplado.`);
    setComunicando("");
    await carregar();
  }

  // Prévia do e-mail de contemplado (marcada como TESTE) para conferir o texto antes do envio real.
  async function enviarPrevia() {
    const para = prompt("Enviar a prévia do e-mail do contemplado para qual endereço?");
    if (!para) return;
    setComunicando("previa");
    setResultadoComunicado("");
    const { data: r, error } = await supabase.functions.invoke("inscrever-veste-phenix", {
      body: { acao: "previa_contemplado", para },
    });
    let msg = r?.mensagem;
    if (error && !msg) { try { msg = (await error.context?.json?.())?.mensagem; } catch { /* sem JSON */ } }
    setResultadoComunicado(error || !r?.ok ? msg || "Não foi possível enviar a prévia." : `Prévia enviada para ${para}.`);
    setComunicando("");
  }

  // Contemplado não atende aos critérios do regulamento: desclassifica com motivo
  // registrado e passa ao número válido seguinte mais próximo do mesmo resultado.
  async function buscarProximo() {
    if (!apuracaoVigente?.id || !contemplado) return;
    const motivo = prompt(
      `Motivo da desclassificação de ${contemplado.nome_completo} (fica registrado no histórico e na auditoria):

Ex.: informação falsa sobre a empresa; não respondeu no prazo de 10 dias úteis; impedido de participar (seção 4).`,
    );
    if (motivo === null) return;
    if (motivo.trim().length < 10) return setErro("Descreva o motivo da desclassificação (mínimo de 10 caracteres).");
    if (
      !confirm(
        `Desclassificar ${contemplado.nome_completo} e buscar o próximo número mais próximo de ${String(apuracaoVigente.numero_loteria).padStart(5, "0")}?

Esta ação é definitiva e fica registrada.`,
      )
    ) {
      return;
    }
    setBuscandoProximo(true);
    setErro("");
    setResultadoComunicado("");
    const { data: r, error } = await supabase.rpc("nova_busca_veste_phenix", {
      p_apuracao_id: apuracaoVigente.id,
      p_motivo: motivo.trim(),
    });
    if (error) {
      setErro(error.message);
    } else {
      setResultado(r?.[0]);
      await carregar();
    }
    setBuscandoProximo(false);
  }

  async function reverterApuracao() {
    if (!apuracaoVigente?.id) return;
    if (
      !confirm(
        "Isso desfaz esta apuração de teste: o contemplado volta para válida e a apuração fica marcada como revertida no histórico (nunca é apagada). Deseja continuar?",
      )
    ) {
      return;
    }
    setRevertendo(true);
    setErro("");
    const { error } = await supabase.rpc(
      "reverter_apuracao_teste_veste_phenix",
      { p_apuracao_id: apuracaoVigente.id },
    );
    if (error) {
      setErro(error.message);
    } else {
      setResultado(null);
      await carregar();
    }
    setRevertendo(false);
  }

  async function reverterTodosContemplados() {
    if (
      !confirm(
        "Isso reverte TODOS os contemplados de teste ainda ativos (voltam para válida) e marca as respectivas apurações como revertidas no histórico. Inscrições reais nunca são afetadas. Deseja continuar?",
      )
    ) {
      return;
    }
    setRevertendoTodos(true);
    setErro("");
    const { data: total, error } = await supabase.rpc(
      "reverter_todos_contemplados_teste_veste_phenix",
    );
    if (error) {
      setErro(error.message);
    } else {
      setResultado(null);
      setResultadoLimpeza(`${total} contemplado(s) de teste revertido(s).`);
      await carregar();
    }
    setRevertendoTodos(false);
  }

  async function limparTestes() {
    if (
      !confirm(
        "Isso remove definitivamente todas as inscrições de teste (origem = formulário de teste). Inscrições reais nunca são afetadas, e cada remoção fica registrada na auditoria. Deseja continuar?",
      )
    ) {
      return;
    }
    setLimpando(true);
    setErro("");
    setResultadoLimpeza("");
    const { data: total, error } = await supabase.rpc(
      "limpar_testes_veste_phenix",
    );
    if (error) {
      setErro(error.message);
    } else {
      setResultadoLimpeza(
        `${total} inscrição(ões) de teste removida(s). O histórico continua disponível na auditoria.`,
      );
      await carregar();
    }
    setLimpando(false);
  }

  const contemplado = apuracaoVigente ? inscricoes.find((i) => i.id === apuracaoVigente.vencedor_inscricao_id) : null;
  const quandoEnviado = (v) => (v ? `enviado em ${new Date(v).toLocaleString("pt-BR")}` : "não enviado");

  const numerosOrdenados = inscricoes
    .flatMap((i) => i.numeros_sorte.map((numero) => ({ ...i, numero })))
    .sort((a, b) => a.numero - b.numero);

  return (
    <section className="painel-admin promocao-admin">
      <div className="secao-contexto">
        <div>
          <h2>Veste Phenix — 30 anos</h2>
          <p>Inscrições, auditoria, exportação e apuração da promoção sazonal.</p>
        </div>
      </div>

      <div className="veste-abas" role="tablist">
        <button type="button" role="tab" aria-selected={aba === "promocao"} className={aba === "promocao" ? "ativa" : ""} onClick={() => setAba("promocao")}>
          Promoção
        </button>
        <button type="button" role="tab" aria-selected={aba === "produtos"} className={aba === "produtos" ? "ativa" : ""} onClick={() => setAba("produtos")}>
          Cadastros de produtos
        </button>
        <button type="button" role="tab" aria-selected={aba === "estatisticas"} className={aba === "estatisticas" ? "ativa" : ""} onClick={() => setAba("estatisticas")}>
          Estatísticas
        </button>
      </div>

      {aba === "produtos" ? <RelatorioProdutosFeira /> : aba === "estatisticas" ? <EstatisticasFeira /> : <>

      <div className="admin-bloco">
        <h3>Apuração pela Loteria Federal</h3>
        <p>
          O sistema seleciona a menor diferença absoluta; havendo empate,
          vence a inscrição válida mais antiga.
        </p>
        <div className="promocao-apuracao">
          <label>
            Número apurado
            <input
              value={numero}
              inputMode="numeric"
              onChange={(e) => { setNumero(e.target.value.replace(/\D/g, "")); setConcurso(""); }}
            />
          </label>
          <label>
            Data da extração
            <input
              type="date"
              value={data}
              onChange={(e) => { setData(e.target.value); setConcurso(""); }}
            />
          </label>
          <button type="button" onClick={apurar}>
            Realizar apuração
          </button>
          <button type="button" className="promocao-botao-secundario" onClick={enviarPrevia} disabled={Boolean(comunicando)}>
            {comunicando === "previa" ? "Enviando…" : "Prévia do e-mail do contemplado"}
          </button>
          <button type="button" className="promocao-botao-secundario" onClick={sorteios ? () => setSorteios(null) : buscarSorteios} disabled={buscandoSorteios}>
            {buscandoSorteios ? "Consultando a Caixa…" : sorteios ? "Ocultar sorteios" : "Buscar sorteios dos últimos 30 dias"}
          </button>
        </div>
        {erroSorteios && <p className="mensagem-erro">{erroSorteios}</p>}
        {sorteios && (
          <div className="promocao-sorteios">
            <b>Loteria Federal — extrações dos últimos 30 dias</b>
            {sorteios.length === 0 ? (
              <p>Nenhuma extração encontrada no período.</p>
            ) : (
              <div className="promocao-tabela-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Concurso</th>
                      <th>Data</th>
                      <th>1º prêmio</th>
                      <th>2º ao 5º prêmio</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorteios.map((s) => (
                      <tr key={s.concurso} className={String(s.concurso) === concurso ? "selecionado" : ""}>
                        <td>{s.concurso}</td>
                        <td>{new Date(`${s.data}T12:00:00`).toLocaleDateString("pt-BR")}</td>
                        <td>
                          <b>{s.premios[0]}</b>
                        </td>
                        <td>{s.premios.slice(1).join(" • ")}</td>
                        <td>
                          <button type="button" className="promocao-botao-secundario" onClick={() => usarSorteio(s)}>
                            Usar na apuração
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <small>
              Fonte: Caixa Econômica Federal. Vale o 1º prêmio. “Usar na apuração” só preenche os campos — confira no{" "}
              <a href={PAGINA_LOTERIA_FEDERAL} target="_blank" rel="noreferrer">site oficial</a> antes de realizar a apuração.
            </small>
          </div>
        )}
        {resultadoComunicado && !apuracaoVigente && <p className="promocao-resultado-limpeza">{resultadoComunicado}</p>}
        {apuracaoVigente && contemplado && (
          <div className="promocao-vencedor">
            <b>
              Contemplado{apuracaoVigente.ordem_busca > 1 ? ` (${apuracaoVigente.ordem_busca}ª busca)` : ""}: {contemplado.nome_completo}
            </b>
            <span>
              Número {String(apuracaoVigente.vencedor_numero_sorte).padStart(5, "0")} • Loteria Federal{" "}
              {String(apuracaoVigente.numero_loteria).padStart(5, "0")} de{" "}
              {new Date(`${apuracaoVigente.data_extracao}T12:00:00`).toLocaleDateString("pt-BR")} • diferença{" "}
              {apuracaoVigente.diferenca_absoluta}
            </span>
            {resultado?.apuracao_id === apuracaoVigente.id && resultado.total_empatados > 1 && (
              <span>
                Desempate por data de inscrição — {resultado.total_empatados} inscrições empataram na diferença{" "}
                {resultado.diferenca}; venceu a mais antiga, inscrita em{" "}
                {new Date(resultado.criado_em).toLocaleString("pt-BR")}.
              </span>
            )}
            <span>
              {contemplado.empresa} • CPF {contemplado.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}
            </span>
            <span>
              {contemplado.email} • WhatsApp {formatarTelefone(contemplado.telefone)}
            </span>
            {contemplado.origem === "formulario_teste" && (
              <span className="promocao-contemplado-teste">Inscrição de teste — o comunicado sai marcado como TESTE.</span>
            )}
            <div className="promocao-comunicado">
              <button type="button" onClick={() => comunicar("email")} disabled={Boolean(comunicando)}>
                {comunicando === "email" ? "Enviando…" : apuracaoVigente.comunicado_email_em ? "Reenviar e-mail" : "Enviar e-mail ao contemplado"}
              </button>
              <button type="button" onClick={() => comunicar("whatsapp")} disabled={Boolean(comunicando)}>
                {comunicando === "whatsapp" ? "Enviando…" : apuracaoVigente.comunicado_whatsapp_em ? "Reenviar WhatsApp" : "Enviar WhatsApp ao contemplado"}
              </button>
            </div>
            <small>
              E-mail: {quandoEnviado(apuracaoVigente.comunicado_email_em)} • WhatsApp:{" "}
              {quandoEnviado(apuracaoVigente.comunicado_whatsapp_em)}
            </small>
            {resultadoComunicado && <span>{resultadoComunicado}</span>}
            {apuracaoVigente.comunicado_ultimo_erro && !resultadoComunicado && (
              <span className="mensagem-erro">Último erro: {apuracaoVigente.comunicado_ultimo_erro}</span>
            )}
            <div className="promocao-comunicado">
              <button type="button" className="promocao-botao-perigo" onClick={buscarProximo} disabled={buscandoProximo}>
                {buscandoProximo ? "Buscando…" : "Desclassificar e buscar próximo"}
              </button>
              {contemplado.origem === "formulario_teste" && (
                <button
                  type="button"
                  className="promocao-botao-secundario"
                  onClick={reverterApuracao}
                  disabled={revertendo}
                >
                  {revertendo ? "Revertendo…" : "Reverter apuração (teste)"}
                </button>
              )}
            </div>
          </div>
        )}
        {buscasAnteriores.length > 0 && (
          <div className="promocao-historico-buscas">
            <b>Histórico de buscas — contemplados desclassificados</b>
            <ol>
              {buscasAnteriores.map((b) => (
                <li key={b.id}>
                  <strong>{b.ordem_busca}ª busca:</strong> {b.vencedor_nome_completo} • número{" "}
                  {String(b.vencedor_numero_sorte).padStart(5, "0")} • diferença {b.diferenca_absoluta}
                  <br />
                  Desclassificado em {new Date(b.desclassificada_em).toLocaleString("pt-BR")} — {b.motivo_desclassificacao}
                </li>
              ))}
            </ol>
          </div>
        )}

        <div className="promocao-manutencao">
          <div>
            <h3>Manutenção de testes</h3>
            <p>
              Só pode existir um contemplado por vez. Reverte todos os
              contemplados de teste ainda ativos, mesmo que o resultado não
              esteja mais na tela; inscrições reais nunca são afetadas.
            </p>
          </div>
          <button
            type="button"
            className="promocao-botao-secundario"
            onClick={reverterTodosContemplados}
            disabled={revertendoTodos}
          >
            {revertendoTodos
              ? "Revertendo…"
              : "Reverter todos os contemplados de teste"}
          </button>
        </div>

        <div className="promocao-manutencao">
          <div>
            <h3>Limpeza de inscrições de teste</h3>
            <p>
              Remove somente inscrições feitas em modo teste (nunca afeta
              inscrições reais). A remoção fica registrada na auditoria.
            </p>
          </div>
          <button
            type="button"
            className="promocao-botao-perigo"
            onClick={limparTestes}
            disabled={limpando}
          >
            {limpando ? "Limpando…" : "Limpar inscrições de teste"}
          </button>
        </div>
        {resultadoLimpeza && (
          <p className="promocao-resultado-limpeza">{resultadoLimpeza}</p>
        )}
        {erro && <p className="mensagem-erro">{erro}</p>}
      </div>

      <div className="admin-bloco">
        <h3>Contador da feira</h3>
        <div className="promocao-tabela-wrap">
          <table>
            <thead>
              <tr>
                <th>Evento</th>
                <th>Origem</th>
                <th>Hoje</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {EVENTOS_FEIRA.map(([chave, nome]) => {
                const linhas = eventos.filter((e) => e.evento === chave);
                if (!linhas.length) return (
                  <tr key={chave}>
                    <td>{nome}</td>
                    <td>—</td>
                    <td>0</td>
                    <td>0</td>
                  </tr>
                );
                return linhas.map((e, i) => (
                  <tr key={`${chave}-${e.origem}`}>
                    <td>{i === 0 ? nome : ""}</td>
                    <td>{NOME_ORIGEM[e.origem] || e.origem}</td>
                    <td>{e.hoje}</td>
                    <td>{e.total}</td>
                  </tr>
                ));
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-bloco">
        <div className="promocao-resumo">
          <strong>{inscricoes.length}</strong>
          <span>inscrições totais</span>
          <strong>{inscricoes.filter((i) => i.status === "valida").length}</strong>
          <span>válidas</span>
          <strong>{falhasEmail}</strong>
          <span>e-mails com falha</span>
          <button type="button" onClick={exportar} disabled={!inscricoes.length}>
            Exportar Excel
          </button>
          <button type="button" className="promocao-botao-secundario" onClick={() => carregar({ silencioso: true })} disabled={atualizando || carregando}>
            {atualizando ? "Atualizando…" : "Atualizar"}
          </button>
          {atualizadoEm && <span>atualizado às {atualizadoEm.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>}
          <button type="button" className="promocao-botao-secundario" onClick={reenviarEmails} disabled={!falhasEmail || reenviando}>
            {reenviando ? "Reenviando…" : "Reenviar e-mails com falha"}
          </button>
        </div>
        {resultadoReenvio && <p className="promocao-resultado-limpeza">{resultadoReenvio}</p>}
        {carregando ? (
          <p>Carregando…</p>
        ) : (
          <div className="promocao-tabela-wrap">
            <table>
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Participante</th>
                  <th>Empresa</th>
                  <th>CPF</th>
                  <th>Data/hora</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {numerosOrdenados.map((i) => (
                  <tr key={`${i.id}-${i.numero}`}>
                    <td>
                      <b>{String(i.numero).padStart(5, "0")}</b>
                    </td>
                    <td>
                      {i.nome_completo}
                      <small>{i.email}</small>
                    </td>
                    <td>{i.empresa}</td>
                    <td>
                      {i.cpf.replace(
                        /(\d{3})(\d{3})(\d{3})(\d{2})/,
                        "$1.$2.$3-$4",
                      )}
                    </td>
                    <td>{new Date(i.criado_em).toLocaleString("pt-BR")}</td>
                    <td>{i.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </>}
    </section>
  );
}
