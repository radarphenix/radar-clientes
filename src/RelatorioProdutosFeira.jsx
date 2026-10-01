import { Fragment, useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "./supabaseClient";

const TABELA = "cadastro_produtos_feira_phenix";
const vazio = (v) => (v === null || v === undefined || v === "" ? "—" : v);
const dataHora = (v) => new Date(v).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
const semMedidas = (c) => !c.comprimento || !c.largura;

// Mesmas opções do formulário da feira (CadastroProdutos.jsx).
const PRODUTOS = {
  Tissue: ["Tela Formadora", "Feltro", "Tela DNT", "Tela Acabadora", "Outros"],
  Marrom: ["Tela Tecida", "Formadora", "Feltro", "Feltro com emenda", "Camisa", "Engrossador", "Secadora Espiral", "Outros"],
};
// Dados da máquina/atendimento: valem para todos os produtos salvos juntos (mesmo grupo_id).
const CAMPOS_GRUPO = ["empresa", "contato", "telefone", "email", "responsavel", "maquina", "tipo_papel", "velocidade_maquina", "informacoes_adicionais"];
const CAMPOS_ITEM = ["produto", "nome_produto_outros", "modelo", "posicao", "comprimento", "largura", "espessura", "cfm", "gramatura", "durabilidade"];
const ROTULOS = {
  empresa: "Empresa", contato: "Contato", telefone: "Telefone", email: "E-mail", responsavel: "Quem cadastrou", maquina: "Máquina",
  tipo_papel: "Tipo de papel", velocidade_maquina: "Velocidade da máquina", informacoes_adicionais: "Informações adicionais",
  produto: "Produto", nome_produto_outros: "Nome do produto (Outros)", modelo: "Modelo", posicao: "Posição", comprimento: "Comprimento",
  largura: "Largura", espessura: "Espessura", cfm: "CFM", gramatura: "Gramatura", durabilidade: "Durabilidade",
};
const paraForm = (c) => ({ ...Object.fromEntries([...CAMPOS_GRUPO, ...CAMPOS_ITEM].map((k) => [k, c[k] ?? ""])), teflonada: Boolean(c.teflonada) });
const limpo = (v) => { const t = String(v ?? "").trim(); return t === "" ? null : t; };

export default function RelatorioProdutosFeira() {
  const [cadastros, setCadastros] = useState([]);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [papel, setPapel] = useState("");
  const [produto, setProduto] = useState("");
  const [aberto, setAberto] = useState(null);
  const [lixeira, setLixeira] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(null);
  const [gravando, setGravando] = useState(false);
  const [aviso, setAviso] = useState("");

  async function carregar() {
    setCarregando(true);
    const { data, error } = await supabase
      .from(TABELA)
      .select("*")
      .order("criado_em", { ascending: false })
      // Produtos salvos juntos (mesma máquina) têm o mesmo criado_em: ficam agrupados, em ordem (Feltro 1, 2, 3).
      .order("produto", { ascending: true })
      .order("item", { ascending: true });
    setCadastros(data || []);
    setErro(error ? "Não foi possível carregar os cadastros de produtos." : "");
    setCarregando(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carregamento inicial da lista
    carregar();
  }, []);

  const excluidos = cadastros.filter((c) => c.excluido_em).length;
  // A lixeira mostra só os excluídos; o relatório normal (e o Excel), só os ativos.
  const base = useMemo(() => cadastros.filter((c) => Boolean(c.excluido_em) === lixeira), [cadastros, lixeira]);

  const produtosDisponiveis = useMemo(
    () => [...new Set(base.filter((c) => !papel || c.tipo_papel === papel).map((c) => c.produto).filter(Boolean))].sort(),
    [base, papel],
  );

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return base.filter(
      (c) =>
        (!papel || c.tipo_papel === papel) &&
        (!produto || c.produto === produto) &&
        (!termo ||
          [c.empresa, c.contato, c.maquina, c.responsavel, c.email, c.telefone, c.nome_produto_outros]
            .filter(Boolean)
            .some((v) => v.toLowerCase().includes(termo))),
    );
  }, [base, busca, papel, produto]);

  const empresas = new Set(filtrados.map((c) => c.empresa.trim().toLowerCase())).size;
  const incompletos = filtrados.filter(semMedidas).length;
  const maquinas = new Set(filtrados.map((c) => c.grupo_id || c.id)).size;
  const filtroAtivo = Boolean(busca.trim() || papel || produto);
  const doGrupo = (c) => (c.grupo_id ? cadastros.filter((x) => x.grupo_id === c.grupo_id && Boolean(x.excluido_em) === Boolean(c.excluido_em)) : [c]);

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
      "Nº": c.item || "",
      "Nome do produto (Outros)": c.nome_produto_outros || "",
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

  function editar(c) {
    setEditando(c.id);
    setForm(paraForm(c));
    setErro("");
    setAviso("");
  }

  function cancelarEdicao() {
    setEditando(null);
    setForm(null);
    setErro("");
  }

  async function salvar(c) {
    const f = form;
    if (String(f.empresa).trim().length < 2) return setErro("Informe a empresa.");
    if (String(f.contato).trim().length < 2) return setErro("Informe o contato.");
    if (String(f.responsavel).trim().length < 2) return setErro("Informe quem fez o cadastro.");
    if (String(f.telefone).trim().length < 8) return setErro("Informe o telefone.");
    if (limpo(f.email) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(f.email).trim())) return setErro("E-mail inválido.");

    const grupo = {
      ...Object.fromEntries(CAMPOS_GRUPO.map((k) => [k, limpo(f[k])])),
      empresa: f.empresa.trim(),
      contato: f.contato.trim(),
      telefone: f.telefone.trim(),
      responsavel: f.responsavel.trim(),
      informacoes_adicionais: String(f.informacoes_adicionais ?? "").trim(),
    };
    const item = {
      ...Object.fromEntries(CAMPOS_ITEM.map((k) => [k, limpo(f[k])])),
      teflonada: f.produto === "Secadora Espiral" ? Boolean(f.teflonada) : false,
    };
    if (item.produto !== "Outros") item.nome_produto_outros = null;

    setGravando(true);
    setErro("");
    let { error } = await supabase.from(TABELA).update({ ...grupo, ...item }).eq("id", c.id);
    // Empresa, contato, máquina etc. são os mesmos para todos os produtos da máquina.
    if (!error && c.grupo_id) {
      ({ error } = await supabase.from(TABELA).update(grupo).eq("grupo_id", c.grupo_id).neq("id", c.id));
    }
    setGravando(false);
    if (error) return setErro(`Não foi possível salvar a correção: ${error.message}`);
    setEditando(null);
    setForm(null);
    setAviso("Correção salva.");
    await carregar();
  }

  // Exclusão lógica: sai do relatório e do Excel, fica na lixeira e pode ser restaurado.
  async function marcarExclusao(ids, excluir, mensagem) {
    if (!ids.length) return;
    setGravando(true);
    setErro("");
    const { error } = await supabase.from(TABELA).update({ excluido_em: excluir ? new Date().toISOString() : null }).in("id", ids);
    setGravando(false);
    if (error) return setErro(`Não foi possível ${excluir ? "excluir" : "restaurar"}: ${error.message}`);
    setAberto(null);
    setEditando(null);
    setAviso(mensagem);
    await carregar();
  }

  function excluir(c) {
    if (!confirm(`Excluir o cadastro de ${c.produto || "produto"}${c.item ? ` ${c.item}` : ""} — ${c.empresa}?\n\nEle sai do relatório e do Excel, mas pode ser restaurado na lixeira.`)) return;
    marcarExclusao([c.id], true, "Cadastro excluído. Ele fica na lixeira e pode ser restaurado.");
  }

  function excluirMaquina(c) {
    const grupo = doGrupo(c);
    if (!confirm(`Excluir os ${grupo.length} produtos da máquina ${c.maquina || "(sem nome)"} — ${c.empresa}?\n\nEles saem do relatório e do Excel, mas podem ser restaurados na lixeira.`)) return;
    marcarExclusao(grupo.map((x) => x.id), true, `${grupo.length} cadastros excluídos. Eles ficam na lixeira e podem ser restaurados.`);
  }

  function excluirFiltrados() {
    if (!confirm(`Excluir os ${filtrados.length} cadastros que estão na lista (filtro atual)?\n\nEles saem do relatório e do Excel, mas podem ser restaurados na lixeira.`)) return;
    marcarExclusao(filtrados.map((x) => x.id), true, `${filtrados.length} cadastros excluídos. Eles ficam na lixeira e podem ser restaurados.`);
  }

  function restaurar(lista) {
    marcarExclusao(lista.map((x) => x.id), false, lista.length === 1 ? "Cadastro restaurado." : `${lista.length} cadastros restaurados.`);
  }

  function alternarLixeira() {
    setLixeira(!lixeira);
    setAberto(null);
    setEditando(null);
    setProduto("");
    setAviso("");
    setErro("");
  }

  const campo = (k, extra = {}) => (
    <label key={k} className={extra.largo ? "largo" : ""}>
      {ROTULOS[k]}
      {extra.opcoes ? (
        <select value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })}>
          <option value="">—</option>
          {extra.opcoes.map((o) => <option key={o}>{o}</option>)}
        </select>
      ) : extra.largo ? (
        <textarea rows={3} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
      ) : (
        <input value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
      )}
    </label>
  );

  return (
    <div className="admin-bloco relatorio-produtos">
      <div className="relatorio-produtos-topo">
        <div>
          <h3>{lixeira ? "Lixeira — cadastros de produtos excluídos" : "Cadastros de produtos da feira"}</h3>
          <p>
            {lixeira
              ? "Cadastros excluídos não entram no relatório nem no Excel. Abra um cadastro para restaurar."
              : "Necessidades de máquinas registradas pelos representantes no atendimento da feira. Abra um cadastro para corrigir ou excluir."}
          </p>
        </div>
        <div className="relatorio-produtos-acoes">
          <button type="button" className="promocao-botao-secundario" onClick={carregar} disabled={carregando}>
            {carregando ? "Atualizando…" : "Atualizar"}
          </button>
          <button type="button" className="promocao-botao-secundario" onClick={alternarLixeira} disabled={!lixeira && !excluidos}>
            {lixeira ? "Voltar aos cadastros" : `Lixeira (${excluidos})`}
          </button>
          {!lixeira && (
            <button type="button" onClick={exportar} disabled={!filtrados.length}>
              Exportar Excel
            </button>
          )}
        </div>
      </div>

      <div className="relatorio-produtos-indicadores">
        <div><strong>{filtrados.length}</strong><span>{lixeira ? "excluídos" : "cadastros"}</span></div>
        <div><strong>{maquinas}</strong><span>máquinas</span></div>
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

      {filtroAtivo && filtrados.length > 0 && (
        <div className="relatorio-produtos-lote">
          <span>{filtrados.length} {filtrados.length === 1 ? "cadastro" : "cadastros"} no filtro atual.</span>
          {lixeira ? (
            <button type="button" className="promocao-botao-secundario" onClick={() => restaurar(filtrados)} disabled={gravando}>
              Restaurar todos da lista
            </button>
          ) : (
            <button type="button" className="promocao-botao-perigo" onClick={excluirFiltrados} disabled={gravando}>
              Excluir todos da lista
            </button>
          )}
        </div>
      )}

      {aviso && <p className="promocao-resultado-limpeza">{aviso}</p>}
      {erro && <p className="mensagem-erro">{erro}</p>}
      {carregando ? (
        <p>Carregando…</p>
      ) : !filtrados.length ? (
        <p className="relatorio-produtos-vazio">
          {base.length ? "Nenhum cadastro encontrado com esses filtros." : lixeira ? "A lixeira está vazia." : "Nenhum cadastro de produto registrado ainda."}
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
                  <tr className={aberto === c.id ? "aberto" : ""} onClick={() => { setAberto(aberto === c.id ? null : c.id); cancelarEdicao(); }}>
                    <td>{dataHora(c.criado_em)}</td>
                    <td>
                      <b>{c.empresa}</b>
                      <small>{c.contato} • {c.telefone}</small>
                    </td>
                    <td>{vazio(c.maquina)}</td>
                    <td>
                      {c.produto ? <>{c.produto}{c.item ? ` ${c.item}` : ""}<small>{[c.tipo_papel, c.nome_produto_outros, c.modelo, c.posicao].filter(Boolean).join(" • ")}</small></> : "—"}
                    </td>
                    <td>{semMedidas(c) ? <span className="relatorio-produtos-selo">não informado</span> : `${c.comprimento} × ${c.largura}`}</td>
                    <td>{c.responsavel}</td>
                    <td className="relatorio-produtos-seta">{aberto === c.id ? "▲" : "▼"}</td>
                  </tr>
                  {aberto === c.id && (
                    <tr className="relatorio-produtos-detalhe">
                      <td colSpan={7}>
                        {editando === c.id && form ? (
                          <form className="relatorio-produtos-edicao" onSubmit={(e) => { e.preventDefault(); salvar(c); }}>
                            <b>Dados do atendimento e da máquina{doGrupo(c).length > 1 ? ` — a correção vale para os ${doGrupo(c).length} produtos desta máquina` : ""}</b>
                            <div>
                              {["empresa", "contato", "telefone", "email", "responsavel", "maquina"].map((k) => campo(k))}
                              {campo("tipo_papel", { opcoes: ["Tissue", "Marrom"] })}
                              {campo("velocidade_maquina")}
                              {campo("informacoes_adicionais", { largo: true })}
                            </div>
                            <b>Dados deste produto{c.item ? ` (${c.produto} ${c.item})` : ""}</b>
                            <div>
                              {campo("produto", { opcoes: [...new Set([...(PRODUTOS[form.tipo_papel] || []), form.produto].filter(Boolean))] })}
                              {form.produto === "Outros" && campo("nome_produto_outros")}
                              {["modelo", "posicao", "comprimento", "largura", "espessura", "cfm", "gramatura", "durabilidade"].map((k) => campo(k))}
                              {form.produto === "Secadora Espiral" && (
                                <label className="marcacao">
                                  <input type="checkbox" checked={form.teflonada} onChange={(e) => setForm({ ...form, teflonada: e.target.checked })} />
                                  Teflonada
                                </label>
                              )}
                            </div>
                            <div className="relatorio-produtos-botoes">
                              <button type="submit" disabled={gravando}>{gravando ? "Salvando…" : "Salvar correção"}</button>
                              <button type="button" className="promocao-botao-secundario" onClick={cancelarEdicao} disabled={gravando}>Cancelar</button>
                            </div>
                          </form>
                        ) : (
                          <>
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
                              {c.excluido_em && <div><dt>Excluído em</dt><dd>{dataHora(c.excluido_em)}</dd></div>}
                              {!c.excluido_em && c.atualizado_em && <div><dt>Última correção</dt><dd>{dataHora(c.atualizado_em)}</dd></div>}
                            </dl>
                            <div className="relatorio-produtos-botoes">
                              {c.excluido_em ? (
                                <>
                                  <button type="button" onClick={() => restaurar([c])} disabled={gravando}>Restaurar</button>
                                  {doGrupo(c).length > 1 && (
                                    <button type="button" className="promocao-botao-secundario" onClick={() => restaurar(doGrupo(c))} disabled={gravando}>
                                      Restaurar a máquina inteira ({doGrupo(c).length})
                                    </button>
                                  )}
                                </>
                              ) : (
                                <>
                                  <button type="button" onClick={() => editar(c)} disabled={gravando}>Corrigir</button>
                                  <button type="button" className="promocao-botao-perigo" onClick={() => excluir(c)} disabled={gravando}>Excluir este produto</button>
                                  {doGrupo(c).length > 1 && (
                                    <button type="button" className="promocao-botao-perigo" onClick={() => excluirMaquina(c)} disabled={gravando}>
                                      Excluir a máquina inteira ({doGrupo(c).length})
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </>
                        )}
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
