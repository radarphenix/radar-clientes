import { Fragment, useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "./supabaseClient";

const vazio = (v) => (v === null || v === undefined || v === "" ? "—" : v);
const dataHora = (v) => new Date(v).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
const semMedidas = (c) => !c.comprimento || !c.largura;

export default function RelatorioProdutosFeira() {
  const [cadastros, setCadastros] = useState([]);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [papel, setPapel] = useState("");
  const [produto, setProduto] = useState("");
  const [aberto, setAberto] = useState(null);

  async function carregar() {
    setCarregando(true);
    const { data, error } = await supabase
      .from("cadastro_produtos_feira_phenix")
      .select("*")
      .order("criado_em", { ascending: false });
    setCadastros(data || []);
    setErro(error ? "Não foi possível carregar os cadastros de produtos." : "");
    setCarregando(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carregamento inicial da lista
    carregar();
  }, []);

  const produtosDisponiveis = useMemo(
    () => [...new Set(cadastros.filter((c) => !papel || c.tipo_papel === papel).map((c) => c.produto).filter(Boolean))].sort(),
    [cadastros, papel],
  );

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return cadastros.filter(
      (c) =>
        (!papel || c.tipo_papel === papel) &&
        (!produto || c.produto === produto) &&
        (!termo ||
          [c.empresa, c.contato, c.maquina, c.responsavel, c.email, c.telefone]
            .filter(Boolean)
            .some((v) => v.toLowerCase().includes(termo))),
    );
  }, [cadastros, busca, papel, produto]);

  const empresas = new Set(filtrados.map((c) => c.empresa.trim().toLowerCase())).size;
  const incompletos = filtrados.filter(semMedidas).length;

  function exportar() {
    const linhas = filtrados.map((c) => ({
      "Cadastrado em": dataHora(c.criado_em),
      Empresa: c.empresa,
      Contato: c.contato,
      Telefone: c.telefone,
      "E-mail": c.email || "",
      "Quem cadastrou": c.responsavel,
      Máquina: c.maquina || "",
      "Tipo de papel": c.tipo_papel || "",
      Produto: c.produto || "",
      Modelo: c.modelo || "",
      Posição: c.posicao || "",
      Comprimento: c.comprimento || "",
      Largura: c.largura || "",
      Espessura: c.espessura || "",
      CFM: c.cfm || "",
      Gramatura: c.gramatura || "",
      Teflonada: c.produto === "Secadora Espiral" ? (c.teflonada ? "Sim" : "Não") : "",
      Durabilidade: c.durabilidade || "",
      "Velocidade da máquina": c.velocidade_maquina || "",
      "Informações adicionais": c.informacoes_adicionais || "",
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(linhas), "Cadastros");
    XLSX.writeFile(wb, `feira_cadastro_produtos_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  return (
    <div className="admin-bloco relatorio-produtos">
      <div className="relatorio-produtos-topo">
        <div>
          <h3>Cadastros de produtos da feira</h3>
          <p>Necessidades de máquinas registradas pelos representantes no atendimento da feira.</p>
        </div>
        <div className="relatorio-produtos-acoes">
          <button type="button" className="promocao-botao-secundario" onClick={carregar} disabled={carregando}>
            {carregando ? "Atualizando…" : "Atualizar"}
          </button>
          <button type="button" onClick={exportar} disabled={!filtrados.length}>
            Exportar Excel
          </button>
        </div>
      </div>

      <div className="relatorio-produtos-indicadores">
        <div><strong>{filtrados.length}</strong><span>cadastros</span></div>
        <div><strong>{empresas}</strong><span>empresas</span></div>
        <div className={incompletos ? "alerta" : ""}><strong>{incompletos}</strong><span>sem comprimento/largura</span></div>
      </div>

      <div className="relatorio-produtos-filtros">
        <input
          type="search"
          placeholder="Buscar empresa, contato, máquina, representante…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <select value={papel} onChange={(e) => { setPapel(e.target.value); setProduto(""); }}>
          <option value="">Todos os papéis</option>
          <option>Tissue</option>
          <option>Marrom</option>
        </select>
        <select value={produto} onChange={(e) => setProduto(e.target.value)}>
          <option value="">Todos os produtos</option>
          {produtosDisponiveis.map((p) => <option key={p}>{p}</option>)}
        </select>
      </div>

      {erro && <p className="mensagem-erro">{erro}</p>}
      {carregando ? (
        <p>Carregando…</p>
      ) : !filtrados.length ? (
        <p className="relatorio-produtos-vazio">
          {cadastros.length ? "Nenhum cadastro encontrado com esses filtros." : "Nenhum cadastro de produto registrado ainda."}
        </p>
      ) : (
        <div className="promocao-tabela-wrap">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Empresa / contato</th>
                <th>Máquina</th>
                <th>Produto</th>
                <th>Comp. × Larg.</th>
                <th>Cadastrado por</th>
                <th aria-label="Detalhes"></th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((c) => (
                <Fragment key={c.id}>
                  <tr className={aberto === c.id ? "aberto" : ""} onClick={() => setAberto(aberto === c.id ? null : c.id)}>
                    <td>{dataHora(c.criado_em)}</td>
                    <td>
                      <b>{c.empresa}</b>
                      <small>{c.contato} • {c.telefone}</small>
                    </td>
                    <td>{vazio(c.maquina)}</td>
                    <td>
                      {c.produto ? <>{c.produto}<small>{[c.tipo_papel, c.modelo, c.posicao].filter(Boolean).join(" • ")}</small></> : "—"}
                    </td>
                    <td>{semMedidas(c) ? <span className="relatorio-produtos-selo">não informado</span> : `${c.comprimento} × ${c.largura}`}</td>
                    <td>{c.responsavel}</td>
                    <td className="relatorio-produtos-seta">{aberto === c.id ? "▲" : "▼"}</td>
                  </tr>
                  {aberto === c.id && (
                    <tr className="relatorio-produtos-detalhe">
                      <td colSpan={7}>
                        <dl>
                          <div><dt>E-mail</dt><dd>{vazio(c.email)}</dd></div>
                          <div><dt>Comprimento</dt><dd>{vazio(c.comprimento)}</dd></div>
                          <div><dt>Largura</dt><dd>{vazio(c.largura)}</dd></div>
                          <div><dt>Espessura</dt><dd>{vazio(c.espessura)}</dd></div>
                          <div><dt>CFM</dt><dd>{vazio(c.cfm)}</dd></div>
                          <div><dt>Gramatura</dt><dd>{vazio(c.gramatura)}</dd></div>
                          {c.produto === "Secadora Espiral" && <div><dt>Teflonada</dt><dd>{c.teflonada ? "Sim" : "Não"}</dd></div>}
                          <div><dt>Durabilidade</dt><dd>{vazio(c.durabilidade)}</dd></div>
                          <div><dt>Velocidade da máquina</dt><dd>{vazio(c.velocidade_maquina)}</dd></div>
                          <div className="largo"><dt>Informações adicionais</dt><dd>{vazio(c.informacoes_adicionais)}</dd></div>
                        </dl>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
