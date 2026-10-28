import { ArrowLeft } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";
import "./AcessosRadar.css";

// Acessos por menu (modelo do Galiê): padrão por tipo de perfil + exceções por pessoa.
// O servidor confere as mesmas permissões (radar_pode no RLS); esconder o menu é só conveniência.
const PERFIS = [
  ["admin", "Admin", "Adm."],
  ["tecnico", "Técnico", "Téc."],
  ["representante", "Representante", "Rep."],
  ["qualidade", "Qualidade", "Qual."],
];

export default function AcessosRadar({ usuarios, voltar }) {
  const [catalogo, setCatalogo] = useState([]);
  const [padroes, setPadroes] = useState({}); // "tipo|codigo" -> bool
  const [excecoes, setExcecoes] = useState({}); // "user|codigo" -> bool
  const [amostrasGrupo, setAmostrasGrupo] = useState({}); // tipo -> bool (configuracoes_grupos)
  const [historico, setHistorico] = useState([]);
  const [pessoaId, setPessoaId] = useState("");
  const [msg, setMsg] = useState("");

  async function carregar() {
    const [cat, pad, exc, grp, hist] = await Promise.all([
      supabase.from("radar_permissoes").select("*").order("ordem"),
      supabase.from("radar_permissoes_perfil").select("*"),
      supabase.from("radar_permissoes_usuario").select("*"),
      supabase.from("configuracoes_grupos").select("tipo_perfil, permite_menu_amostras"),
      supabase.from("radar_permissoes_historico").select("*").order("quando", { ascending: false }).limit(30),
    ]);
    const erro = [cat, pad, exc, grp, hist].find((r) => r.error)?.error;
    if (erro) { setMsg("Não foi possível carregar os acessos: " + erro.message); return; }
    setCatalogo(cat.data);
    setPadroes(Object.fromEntries(pad.data.map((p) => [`${p.tipo_perfil}|${p.codigo}`, p.permitido])));
    setExcecoes(Object.fromEntries(exc.data.map((e) => [`${e.user_id}|${e.codigo}`, e.permitido])));
    setAmostrasGrupo(Object.fromEntries(grp.data.map((g) => [g.tipo_perfil, g.permite_menu_amostras === true])));
    setHistorico(hist.data);
  }
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { carregar(); }, []);

  const grupos = useMemo(() => {
    const g = new Map();
    for (const p of catalogo) g.set(p.grupo, [...(g.get(p.grupo) || []), p]);
    return [...g.entries()];
  }, [catalogo]);

  // padrão efetivo (Amostras para não-admin vem de configuracoes_grupos, como o banco faz)
  function padrao(tipo, codigo) {
    if (codigo === "amostras" && tipo !== "admin" && tipo in amostrasGrupo) return amostrasGrupo[tipo];
    return padroes[`${tipo}|${codigo}`] === true;
  }

  async function mudarPadrao(tipo, codigo, valor) {
    setMsg("");
    const r = await supabase.from("radar_permissoes_perfil")
      .upsert({ tipo_perfil: tipo, codigo, permitido: valor }, { onConflict: "tipo_perfil,codigo" });
    // Amostras: mantém configuracoes_grupos igual (o Radar publicado ainda lê de lá)
    if (!r.error && codigo === "amostras" && tipo in amostrasGrupo) {
      await supabase.from("configuracoes_grupos").update({ permite_menu_amostras: valor }).eq("tipo_perfil", tipo);
    }
    if (r.error) setMsg("Não foi possível salvar: " + r.error.message);
    carregar();
  }

  const pessoa = usuarios.find((u) => u.user_id === pessoaId);

  function efetivo(pessoaAlvo, codigo) {
    const exc = excecoes[`${pessoaAlvo.user_id}|${codigo}`];
    if (exc !== undefined) return exc;
    if (codigo === "comissoes" && pessoaAlvo.piloto_comissoes && pessoaAlvo.tipo_perfil === "representante") return true;
    return padrao(pessoaAlvo.tipo_perfil, codigo);
  }

  async function mudarExcecao(codigo, escolha) {
    setMsg("");
    const chave = { user_id: pessoa.user_id, codigo };
    const r = escolha === "padrao"
      ? await supabase.from("radar_permissoes_usuario").delete().match(chave)
      : await supabase.from("radar_permissoes_usuario").upsert({ ...chave, permitido: escolha === "sim" }, { onConflict: "user_id,codigo" });
    // Comissões: mantém a marca "piloto" igual (o Radar publicado ainda lê de lá)
    if (!r.error && codigo === "comissoes") {
      await supabase.from("perfis").update({ piloto_comissoes: escolha === "sim" }).eq("user_id", pessoa.user_id);
    }
    if (r.error) setMsg("Não foi possível salvar: " + r.error.message);
    carregar();
  }

  const nomeDe = (alvo) => {
    if (alvo.startsWith("perfil:")) return "Perfil " + (PERFIS.find((p) => p[0] === alvo.slice(7))?.[1] || alvo.slice(7));
    const u = usuarios.find((x) => x.user_id === alvo.slice(8));
    return u?.nome || "usuário";
  };
  const nomePerm = (c) => catalogo.find((p) => p.codigo === c)?.nome || c;
  const quem = (id) => usuarios.find((u) => u.user_id === id)?.nome || "-";

  return (
    <div className="acessos-radar">
      <button type="button" className="botao-voltar-tela acessos-voltar" onClick={voltar}><ArrowLeft size={18} /> Voltar</button>
      <h2>Acessos</h2>
      <p className="acessos-dica">
        Cada menu é uma permissão. O perfil define o padrão; uma pessoa pode ter exceções. O servidor confere
        as mesmas permissões: esconder o menu não é a única proteção.
      </p>
      {msg && <div className="acessos-alerta">{msg}</div>}

      <section className="acessos-card">
        <h3>Padrão por perfil</h3>
        <div className="acessos-rolagem">
          <table className="acessos-tabela">
            <thead>
              <tr><th>Menu</th>{PERFIS.map(([t, n, curto]) => (
                <th key={t} title={n}><span className="acessos-longo">{n}</span><span className="acessos-curto">{curto}</span></th>
              ))}</tr>
            </thead>
            <tbody>
              {grupos.map(([grupo, itens]) => [
                <tr key={grupo} className="acessos-grupo"><td colSpan={PERFIS.length + 1}>{grupo}</td></tr>,
                ...itens.map((p) => (
                  <tr key={p.codigo}>
                    <td><b>{p.nome}</b><span>{p.descricao}</span></td>
                    {PERFIS.map(([t]) => {
                      // admin não pode tirar a própria Administração (evita ficar sem ninguém para devolver)
                      const travado = t === "admin" && p.codigo === "administracao";
                      return (
                        <td key={t} className="acessos-check">
                          <input type="checkbox" aria-label={`${p.nome} - ${t}`} checked={padrao(t, p.codigo)} disabled={travado}
                            onChange={(e) => mudarPadrao(t, p.codigo, e.target.checked)} />
                        </td>
                      );
                    })}
                  </tr>
                )),
              ])}
            </tbody>
          </table>
        </div>
      </section>

      <section className="acessos-card">
        <h3>Exceções por pessoa</h3>
        <select className="acessos-select" value={pessoaId} onChange={(e) => setPessoaId(e.target.value)}>
          <option value="">Escolha uma pessoa...</option>
          {usuarios.filter((u) => u.ativo !== false).map((u) => (
            <option key={u.user_id} value={u.user_id}>{u.nome} ({PERFIS.find((p) => p[0] === u.tipo_perfil)?.[1] || u.tipo_perfil})</option>
          ))}
        </select>
        {pessoa && (
          <div className="acessos-rolagem">
            <table className="acessos-tabela">
              <thead><tr><th>Menu</th><th>Padrão do perfil</th><th>Para esta pessoa</th></tr></thead>
              <tbody>
                {catalogo.map((p) => {
                  const exc = excecoes[`${pessoa.user_id}|${p.codigo}`];
                  const piloto = p.codigo === "comissoes" && pessoa.piloto_comissoes && pessoa.tipo_perfil === "representante";
                  const escolha = exc === undefined ? (piloto ? "sim" : "padrao") : exc ? "sim" : "nao";
                  return (
                    <tr key={p.codigo} className={efetivo(pessoa, p.codigo) ? "" : "acessos-sem"}>
                      <td><b>{p.nome}</b><span>{p.grupo}</span></td>
                      <td>{padrao(pessoa.tipo_perfil, p.codigo) ? "Sim" : "Não"}</td>
                      <td>
                        <select value={escolha} onChange={(e) => mudarExcecao(p.codigo, e.target.value)}>
                          <option value="padrao">Seguir o perfil</option>
                          <option value="sim">Liberar</option>
                          <option value="nao">Bloquear</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="acessos-card">
        <h3>Últimas mudanças</h3>
        {!historico.length && <p className="acessos-dica">Nenhuma mudança registrada ainda.</p>}
        <ul className="acessos-historico">
          {historico.map((h) => (
            <li key={h.id}>
              <span>{new Date(h.quando).toLocaleString("pt-BR")}</span>
              {quem(h.quem)}: {nomeDe(h.alvo)} - {nomePerm(h.codigo)}:{" "}
              <b>{h.depois === null ? "volta a seguir o perfil" : h.depois ? "liberado" : "bloqueado"}</b>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
