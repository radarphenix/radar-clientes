import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "./supabaseClient";
import RelatorioProdutosFeira from "./RelatorioProdutosFeira.jsx";

const formatarTelefone = (t) => {
  const d = String(t || "").replace(/\D/g, "");
  return d.length === 11 ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}` : d.length === 10 ? `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}` : t;
};

export default function PromocaoVestePhenix() {
  const [aba, setAba] = useState("promocao");
  const [inscricoes, setInscricoes] = useState([]);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [numero, setNumero] = useState("");
  const [data, setData] = useState("2026-10-10");
  const [resultado, setResultado] = useState(null);
  const [limpando, setLimpando] = useState(false);
  const [resultadoLimpeza, setResultadoLimpeza] = useState("");
  const [revertendo, setRevertendo] = useState(false);
  const [revertendoTodos, setRevertendoTodos] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const [apuracaoVigente, setApuracaoVigente] = useState(null);
  const [comunicando, setComunicando] = useState("");
  const [resultadoComunicado, setResultadoComunicado] = useState("");
  const [resultadoReenvio, setResultadoReenvio] = useState("");

  async function carregar() {
    setCarregando(true);
    const { data: d, error } = await supabase
      .from("promocao_veste_phenix_30_anos_com_numeros")
      .select("*")
      .order("criado_em");
    setInscricoes(d || []);
    setErro(error ? "Não foi possível carregar as inscrições." : "");
    const { data: ap } = await supabase
      .from("promocao_veste_phenix_30_anos_apuracoes")
      .select("*")
      .is("revertida_em", null)
      .order("executado_em", { ascending: false })
      .limit(1);
    setApuracaoVigente(ap?.[0] || null);
    setCarregando(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carregamento inicial da lista
    carregar();
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
      p_concurso: null,
      p_fonte_url: null,
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
      </div>

      {aba === "produtos" ? <RelatorioProdutosFeira /> : <>

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
              onChange={(e) => setNumero(e.target.value.replace(/\D/g, ""))}
            />
          </label>
          <label>
            Data da extração
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
            />
          </label>
          <button type="button" onClick={apurar}>
            Realizar apuração
          </button>
          <button type="button" className="promocao-botao-secundario" onClick={enviarPrevia} disabled={Boolean(comunicando)}>
            {comunicando === "previa" ? "Enviando…" : "Prévia do e-mail do contemplado"}
          </button>
        </div>
        {resultadoComunicado && !apuracaoVigente && <p className="promocao-resultado-limpeza">{resultadoComunicado}</p>}
        {apuracaoVigente && contemplado && (
          <div className="promocao-vencedor">
            <b>Contemplado: {contemplado.nome_completo}</b>
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
            <button
              type="button"
              className="promocao-botao-secundario"
              onClick={reverterApuracao}
              disabled={revertendo}
            >
              {revertendo ? "Revertendo…" : "Reverter apuração (teste)"}
            </button>
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
