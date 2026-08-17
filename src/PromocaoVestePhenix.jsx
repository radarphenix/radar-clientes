import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "./supabaseClient";

export default function PromocaoVestePhenix() {
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

  async function carregar() {
    setCarregando(true);
    const { data: d, error } = await supabase
      .from("promocao_veste_phenix_30_anos_com_numeros")
      .select("*")
      .order("criado_em");
    setInscricoes(d || []);
    setErro(error ? "Não foi possível carregar as inscrições." : "");
    setCarregando(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carregamento inicial da lista
    carregar();
  }, []);

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

  async function reverterApuracao() {
    if (!resultado?.apuracao_id) return;
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
      { p_apuracao_id: resultado.apuracao_id },
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

  return (
    <section className="painel-admin promocao-admin">
      <div className="secao-contexto">
        <div>
          <h2>Veste Phenix — 30 anos</h2>
          <p>Inscrições, auditoria, exportação e apuração da promoção sazonal.</p>
        </div>
      </div>

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
        </div>
        {resultado && (
          <div className="promocao-vencedor">
            <b>Contemplado: {resultado.nome_completo}</b>
            <span>
              Número {String(resultado.numero_sorte).padStart(5, "0")} •
              diferença {resultado.diferenca}
            </span>
            {resultado.total_empatados > 1 && (
              <span>
                Desempate por data de inscrição — {resultado.total_empatados}{" "}
                inscrições empataram na diferença {resultado.diferenca}; venceu
                a mais antiga, inscrita em{" "}
                {new Date(resultado.criado_em).toLocaleString("pt-BR")}.
              </span>
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
          <button type="button" onClick={exportar} disabled={!inscricoes.length}>
            Exportar Excel
          </button>
        </div>
        {carregando ? (
          <p>Carregando…</p>
        ) : (
          <div className="promocao-tabela-wrap">
            <table>
              <thead>
                <tr>
                  <th>Números</th>
                  <th>Participante</th>
                  <th>Empresa</th>
                  <th>CPF</th>
                  <th>Data/hora</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {inscricoes.map((i) => (
                  <tr key={i.id}>
                    <td className="promocao-numeros">
                      {i.numeros_sorte
                        .map((n) => String(n).padStart(5, "0"))
                        .join(", ")}
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
    </section>
  );
}
