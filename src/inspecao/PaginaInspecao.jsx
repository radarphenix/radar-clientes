import { useEffect, useMemo, useState } from 'react'
import { ClipboardCheck, Plus, Search, Lock, Camera, Factory, Mail, FolderInput, ListPlus, Trash2, RotateCcw, MoreHorizontal } from 'lucide-react'
import './inspecao.css'
import { supabase, listar, criar, papelAtual, listarLixeira, restaurar } from './api'
import { pode } from './modelo'
import Editor from './Editor.jsx'
import { JanelaEmail, JanelaImportar, JanelaSelecionarEmail, JanelaTipos } from './Janelas.jsx'

const FILTROS = [['todas', 'Todas'], ['rascunho', 'Rascunho'], ['finalizada', 'Finalizadas'], ['edicao', 'Em edição']]

function situacao(i, eu, agora) {
  if (i.editando_por && i.editando_por !== eu && new Date(i.editando_ate).getTime() > agora) return 'edicao'
  return i.finalizado ? 'finalizada' : 'rascunho'
}
const ROTULO = { edicao: 'Em edição', finalizada: 'Finalizada', rascunho: 'Rascunho' }

/** Menu Qualidade -> Inspeções. Lista em cartões; a inspeção abre como página própria. */
export default function PaginaInspecao({ nome }) {
  const [papel, setPapel] = useState(undefined)
  const [lista, setLista] = useState(null)
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState('todas')
  const [atualId, setAtualId] = useState(() => new URLSearchParams(location.search).get('inspecao'))
  const [agora, setAgora] = useState(0)
  const [eu, setEu] = useState(null)
  const [erro, setErro] = useState('')
  const [criando, setCriando] = useState(false)
  const [janela, setJanela] = useState(null)        // 'selecionar' | { email: itens } | 'importar' | 'tipos'
  const [mais, setMais] = useState(false)
  const [lixeira, setLixeira] = useState(null)

  useEffect(() => {
    if (!mais) return
    const tecla = (e) => { if (e.key === 'Escape') setMais(false) }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [mais])

  useEffect(() => {
    if (filtro !== 'lixeira') return
    listarLixeira().then(setLixeira).catch((e) => setErro(e.message))
  }, [filtro, lista])

  useEffect(() => {
    papelAtual().then(setPapel).catch(() => setPapel(null))
    supabase.auth.getUser().then(({ data }) => setEu(data.user?.id || null))
  }, [])

  // lista ao vivo: mudança feita por outra pessoa aparece sem recarregar
  useEffect(() => {
    if (!papel) return
    const recarregar = () => listar().then((l) => { setLista(l); setAgora(Date.now()) }).catch((e) => setErro(e.message))
    recarregar()
    const canal = supabase.channel('inspecoes-lista')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inspecoes' }, recarregar).subscribe()
    return () => { supabase.removeChannel(canal) }
  }, [papel])

  // Abrir uma inspeção é um passo no histórico do navegador: o "voltar" (e o gesto de voltar do
  // celular) leva da inspeção para a lista. ?inspecao=<id> na barra: o link abre direto nela.
  useEffect(() => {
    const aoVoltar = () => setAtualId(new URLSearchParams(location.search).get('inspecao'))
    window.addEventListener('popstate', aoVoltar)
    return () => window.removeEventListener('popstate', aoVoltar)
  }, [])
  useEffect(() => { window.scrollTo({ top: 0 }) }, [atualId])

  function abrir(id) {
    const url = new URL(location.href)
    url.searchParams.set('inspecao', id)
    history.pushState({ ...history.state, inspecaoAberta: true }, '', url)
    setAtualId(id)
  }
  function voltarParaLista() {
    if (history.state?.inspecaoAberta) { history.back(); return }
    const url = new URL(location.href)
    url.searchParams.delete('inspecao')
    history.replaceState(history.state, '', url)
    setAtualId(null)
  }

  const contagem = useMemo(() => {
    const c = { todas: 0, rascunho: 0, finalizada: 0, edicao: 0 }
    for (const i of lista || []) { c.todas++; c[situacao(i, eu, agora)]++ }
    return c
  }, [lista, eu, agora])

  const visiveis = useMemo(() => {
    const f = busca.trim().toLowerCase()
    return (lista || []).filter((i) =>
      (filtro === 'todas' || situacao(i, eu, agora) === filtro) &&
      (!f || [i.numero, i.cliente, i.cd_cliente, i.nota_fiscal, i.produto].join(' ').toLowerCase().includes(f)))
  }, [lista, busca, filtro, eu, agora])

  async function nova() {
    setCriando(true)
    try { const i = await criar(nome); abrir(i.id) } catch (e) { setErro(e.message) }
    setCriando(false)
  }

  if (papel === undefined) return <div className="painel iq-raiz"><p className="iq-vazio">Carregando...</p></div>
  if (!papel) return <div className="painel iq-raiz"><div className="iq-alerta">Sem acesso às Inspeções.</div></div>

  if (atualId) {
    return <Editor key={atualId} id={atualId} papel={papel} nome={nome} voltar={voltarParaLista} />
  }

  return (
    <div className="painel iq-raiz">
      <div className="secao-contexto">
        <div className="secao-contexto-principal">
          <div className="secao-contexto-icone" aria-hidden="true"><ClipboardCheck size={22} /></div>
          <div className="secao-contexto-texto">
            <h2>Inspeções de Qualidade</h2>
            <p>Recebimento de telas: dados, fotos por item e parecer, com revisões.</p>
          </div>
        </div>
        <div className="iq-acoes-lista">
          {pode(papel, 'inspetor') && (
            <div className="iq-menu-ancora">
              <button type="button" className="iq-btn sec" onClick={() => setMais(!mais)} aria-expanded={mais}><MoreHorizontal size={18} /> Mais</button>
              {mais && <div className="iq-menu-fundo" onClick={() => setMais(false)} aria-hidden="true" />}
              {mais && (
                <div className="iq-menu abaixo" role="menu" onClick={() => setMais(false)}>
                  <button type="button" onClick={() => setJanela('selecionar')}><Mail size={15} /> Enviar várias por e-mail</button>
                  <button type="button" onClick={() => setJanela('importar')}><FolderInput size={15} /> Importar do programa desktop</button>
                  {pode(papel, 'aprovador') && <button type="button" onClick={() => setJanela('tipos')}><ListPlus size={15} /> Tipos de detalhamento</button>}
                </div>
              )}
            </div>
          )}
          {pode(papel, 'inspetor') && (
            <button type="button" className="iq-btn prim" onClick={nova} disabled={criando}>
              <Plus size={18} /> {criando ? 'Criando...' : 'Nova inspeção'}
            </button>
          )}
        </div>
      </div>

      {erro && <div className="iq-alerta" onClick={() => setErro('')}>{erro}</div>}

      <div className="iq-filtros">
        <label className="iq-busca">
          <Search size={18} aria-hidden="true" />
          <input type="search" className="iq-busca-campo" placeholder="Buscar por cliente, código, NF, produto ou número" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </label>
        <div className="iq-chips" role="tablist">
          {FILTROS.map(([k, t]) => (
            <button key={k} type="button" role="tab" aria-selected={filtro === k} className={`iq-chip ${filtro === k ? 'ativo' : ''}`} onClick={() => setFiltro(k)}>
              {t} <span>{contagem[k]}</span>
            </button>
          ))}
          {pode(papel, 'aprovador') && (
            <button type="button" role="tab" aria-selected={filtro === 'lixeira'} className={`iq-chip ${filtro === 'lixeira' ? 'ativo' : ''}`} onClick={() => setFiltro('lixeira')}>
              <Trash2 size={14} /> Lixeira
            </button>
          )}
        </div>
      </div>

      {filtro === 'lixeira' ? (
        lixeira === null ? <p className="iq-vazio">Carregando...</p> : !lixeira.length ? <div className="iq-vazio"><Trash2 size={32} /><p>A lixeira está vazia.</p></div> : (
          <div className="iq-cartoes">
            {lixeira.map((i) => (
              <div key={i.id} className="iq-cartao excluida">
                <span className="iq-cartao-faixa" aria-hidden="true" />
                <span className="iq-cartao-corpo">
                  <span className="iq-cartao-topo"><strong>{i.cliente || 'Cliente não informado'}</strong>
                    <button type="button" className="iq-btn sec peq" onClick={async () => { await restaurar(i.id).catch((e) => setErro(e.message)); setLixeira(lixeira.filter((x) => x.id !== i.id)) }}><RotateCcw size={14} /> Restaurar</button></span>
                  <span className="iq-cartao-info">Nº {i.numero}{i.nota_fiscal ? ` · NF ${i.nota_fiscal}` : ''}</span>
                  <span className="iq-cartao-meta">Excluída em {new Date(i.excluido_em).toLocaleString('pt-BR')}{i.excluido_por ? ` por ${i.excluido_por}` : ''}</span>
                </span>
              </div>
            ))}
          </div>
        )
      ) : lista === null ? <p className="iq-vazio">Carregando...</p> : !visiveis.length ? (
        <div className="iq-vazio">
          <ClipboardCheck size={36} aria-hidden="true" />
          <p>{lista.length ? 'Nenhuma inspeção com esse filtro.' : 'Nenhuma inspeção ainda.'}</p>
        </div>
      ) : (
        <div className="iq-cartoes">
          {visiveis.map((i) => {
            const s = situacao(i, eu, agora)
            return (
              <button type="button" key={i.id} className={`iq-cartao ${s}`} onClick={() => abrir(i.id)}>
                <span className="iq-cartao-faixa" aria-hidden="true" />
                <span className="iq-cartao-corpo">
                  <span className="iq-cartao-topo">
                    <strong>{i.cliente || 'Cliente não informado'}</strong>
                    <span className={`iq-status ${s}`}>
                      {s === 'edicao' && <Lock size={12} aria-hidden="true" />}
                      {s === 'edicao' ? `Em edição por ${i.editando_nome || 'outra pessoa'}` : ROTULO[s]}
                      {s === 'finalizada' ? ` • rev ${String(i.revisao).padStart(2, '0')}` : ''}
                    </span>
                  </span>
                  <span className="iq-cartao-info">
                    {[i.cd_cliente && `Cód. ${i.cd_cliente}`, i.nota_fiscal && `NF ${i.nota_fiscal}`, i.produto].filter(Boolean).join(' · ') || 'Sem nota fiscal e produto'}
                  </span>
                  <span className="iq-cartao-meta">
                    Nº {i.numero}{i.data_inspecao ? ` · inspecionada em ${i.data_inspecao}` : ''}
                    {i.enviado_email_em ? ` · enviada por e-mail` : ''}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      )}
      {janela === 'selecionar' && <JanelaSelecionarEmail fechar={() => setJanela(null)} seguir={(itens) => setJanela({ email: itens })} />}
      {janela?.email && <JanelaEmail itens={janela.email} fechar={() => setJanela(null)} />}
      {janela === 'importar' && <JanelaImportar fechar={() => setJanela(null)} />}
      {janela === 'tipos' && <JanelaTipos fechar={() => setJanela(null)} />}
      <p className="iq-rodape-lista"><Camera size={14} aria-hidden="true" /> As fotos ficam no Google Drive da Phenix. <Factory size={14} aria-hidden="true" /> Quando a Phenix forneceu a tela, a saída entra primeiro no relatório.</p>
    </div>
  )
}
