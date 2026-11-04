import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Ruler, Plus, Search, RefreshCw, MoreHorizontal, FolderInput, Pencil, X, ChevronDown, ChevronUp, CloudOff, Cloud, Clock } from 'lucide-react'
import '../inspecao/inspecao.css'
import './maquinas.css'
import {
  PROSPECT, listarMaquinas, listarVendas, buscarVendasPorEmpresa, buscarClientes, statusSync, solicitarSync, importarFeira, syncOnline, pendenteSync,
  chaveCodigo, normalizarNumero, paraNumero, formatarNumero,
} from './api'
import FormularioMaquina from './FormularioMaquina.jsx'
import { definirGuardaSaida } from '../saidaProtegida'

const PERIODOS = [['12', '12 meses'], ['24', '24 meses'], ['tudo', 'Vida toda']]
const FILTROS_VAZIOS = { busca: '', produto: '', posicao: '', larguraDe: '', larguraAte: '', comprimentoDe: '', comprimentoAte: '', cfmDe: '', cfmAte: '', semVenda: false, inativas: false }

const nomeEmpresa = (m) => (m.codigo_cliente === PROSPECT ? m.nome_prospect : m.cliente?.cliente || `Cliente ${m.codigo_cliente}`)
const nomeProduto = (i) => (i.produto === 'Outros' && i.nome_produto_outros) || i.produto || 'Item sem produto'
const medida = (c, l) => (c || l ? `${c ? formatarNumero(c) : '?'} × ${l ? formatarNumero(l) : '?'}` : '')
const resumoItem = (i) => [nomeProduto(i), i.posicao, medida(i.comprimento, i.largura), i.cfm ? `CFM ${formatarNumero(i.cfm, 2)}` : ''].filter(Boolean).join(' · ')
const dataBr = (d) => (d ? new Date(`${String(d).slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR') : '')
const horaBr = (d) => new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

function desdeDoPeriodo(p) {
  if (p === 'tudo') return null
  const d = new Date()
  d.setMonth(d.getMonth() - Number(p))
  return d.toISOString().slice(0, 10)
}
function dentro(valor, de, ate) {
  const a = paraNumero(de), b = paraNumero(ate)
  if (a === null && b === null) return true
  if (valor === null || valor === undefined) return false
  return (a === null || Number.isNaN(a) || valor >= a) && (b === null || Number.isNaN(b) || valor <= b)
}
const comFiltroDeItem = (f) => f.produto || f.posicao || f.larguraDe || f.larguraAte || f.comprimentoDe || f.comprimentoAte || f.cfmDe || f.cfmAte

/** Item mais parecido da máquina com a medida vendida (pela largura, depois comprimento) e a nota da
 *  diferença (menor = mais parecido; serve para ordenar as vendas). */
function itemMaisProximo(venda, itens) {
  if (!venda.largura && !venda.comprimento) return null
  let melhor = null
  for (const i of itens) {
    if (!i.largura && !i.comprimento) continue
    const dl = venda.largura && i.largura ? Math.abs(venda.largura - i.largura) : 1e9
    const dc = venda.comprimento && i.comprimento ? Math.abs(venda.comprimento - i.comprimento) : 1e9
    const nota = dl * 1000 + dc
    if (!melhor || nota < melhor.nota) melhor = { item: i, nota }
  }
  return melhor
}
function diferenca(v, i) {
  const partes = []
  if (v.comprimento && i.comprimento) partes.push(`C ${v.comprimento - i.comprimento >= 0 ? '+' : ''}${formatarNumero(v.comprimento - i.comprimento)}`)
  if (v.largura && i.largura) partes.push(`L ${v.largura - i.largura >= 0 ? '+' : ''}${formatarNumero(v.largura - i.largura)}`)
  return partes.join(' · ')
}

/** Selo do sync (dependemos do MWAgendador) e o botão "Sincronizar agora", só com o sync online. */
function SeloSync({ status, podeEditar, aoSolicitar, pendentes }) {
  const [enviando, setEnviando] = useState(false)
  const [agora] = useState(() => Date.now())   // o selo é remontado (key) a cada leitura do status
  const online = syncOnline(status, agora)
  const comErro = status?.resultado === 'ERRO'   // só erro de verdade pinta de laranja; parado fica discreto
  const pedidoAberto = status?.solicitado_em && (!status.ultima_execucao || new Date(status.solicitado_em) > new Date(status.ultima_execucao))
  let texto
  if (!status?.ultima_execucao) texto = 'Sincronização com o CIGAM ainda não ativada'
  else if (online) texto = `Sincronizado com o CIGAM às ${horaBr(status.ultima_execucao)}`
  else {
    const h = Math.floor((agora - new Date(status.ultima_execucao).getTime()) / 3600000)
    texto = `Sincronização parada há ${h < 1 ? 'menos de 1 h' : h < 48 ? `${h} h` : `${Math.floor(h / 24)} dias`}`
  }
  return (
    <div className={`mq-sync ${comErro ? 'erro' : ''}`} title={comErro ? status.mensagem || undefined : undefined}>
      {online ? <Cloud size={15} aria-hidden="true" /> : <CloudOff size={15} aria-hidden="true" />}
      <span>{comErro ? 'Erro na última sincronização · ' : ''}{texto}{pendentes ? ` · ${pendentes} pendente${pendentes > 1 ? 's' : ''} de envio` : ''}</span>
      {pedidoAberto && <span className="mq-sync-pedido"><Clock size={13} /> pedido às {horaBr(status.solicitado_em)}</span>}
      {podeEditar && (
        <button type="button" className="mq-sync-botao" disabled={!online || enviando || pedidoAberto}
          title={online ? 'Pede ao sync para rodar agora, sem esperar o horário' : 'O sync não está rodando; o pedido não seria atendido'}
          onClick={async () => { setEnviando(true); try { await aoSolicitar() } finally { setEnviando(false) } }}>
          <RefreshCw size={14} className={enviando ? 'iq-gira' : ''} /> Sincronizar agora
        </button>
      )}
    </div>
  )
}

/** Comercial -> Máquinas e medidas: pesquisa única (máquinas primeiro, vendas abaixo) e cadastro/edição. */
export default function PaginaMaquinas({ podeEditar, podeAdmin, clienteInicial, aoUsarClienteInicial, irParaLista = 0 }) {
  const [maquinas, setMaquinas] = useState(null)
  const [vendasCarregadas, setVendasCarregadas] = useState({ chave: null, dados: [] })
  const [status, setStatus] = useState(null)
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [filtros, setFiltros] = useState(() => ({ ...FILTROS_VAZIOS, busca: clienteInicial?.cliente || clienteInicial?.codigo_cliente || '' }))
  // empresa escolhida nas sugestões da busca: filtra exatamente por ela (máquinas e vendas)
  const [empresa, setEmpresa] = useState(() => (clienteInicial?.codigo_cliente
    ? { codigo: clienteInicial.codigo_cliente, nome: clienteInicial.cliente || clienteInicial.codigo_cliente } : null))
  const [sugestoesLidas, setSugestoesLidas] = useState({ chave: '', lista: [] })
  const [verSugestoes, setVerSugestoes] = useState(false)
  const [marcada, setMarcada] = useState(-1)
  const [maisFiltros, setMaisFiltros] = useState(false)
  const [periodo, setPeriodo] = useState('12')
  const [selecionada, setSelecionada] = useState(null)
  const [abertas, setAbertas] = useState(() => new Set())   // cartões com todos os itens à mostra
  const alternarItens = (e, id) => {
    e.stopPropagation()   // o clique no corpo do cartão filtra as vendas; aqui só abre/fecha a lista
    setAbertas((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  const [aberta, setAberta] = useState(() => history.state?.maquinaAberta ?? null)   // id | 'nova' | null
  const [novaPara, setNovaPara] = useState(clienteInicial || null)
  const [mais, setMais] = useState(false)

  const recarregar = useCallback(() => {
    listarMaquinas().then(setMaquinas).catch((e) => setErro(e.message))
    statusSync().then(setStatus).catch(() => {})
  }, [])
  useEffect(() => { recarregar() }, [recarregar])
  useEffect(() => { if (clienteInicial) aoUsarClienteInicial?.() }, [clienteInicial, aoUsarClienteInicial])

  // O formulário avisa aqui se tem alteração sem salvar; toda saída do cadastro pergunta antes.
  const alteradoRef = useRef(false)
  const abertaRef = useRef(aberta)
  useEffect(() => { abertaRef.current = aberta }, [aberta])
  const podeSair = () => !alteradoRef.current || window.confirm('Há alterações sem salvar. Sair mesmo assim?')

  // Abrir o cadastro é um passo no histórico: o "Voltar" do Radar, o do navegador e o gesto do celular
  // voltam para a pesquisa. Com alteração sem salvar e "não", o passo é recolocado e o cadastro fica.
  useEffect(() => {
    const aoVoltar = () => {
      const destino = history.state?.maquinaAberta ?? null
      if (abertaRef.current && destino !== abertaRef.current && !podeSair()) {
        history.pushState({ ...history.state, maquinaAberta: abertaRef.current }, '')
        return
      }
      alteradoRef.current = false
      setAberta(destino)
    }
    const aoFecharJanela = (e) => { if (abertaRef.current && alteradoRef.current) { e.preventDefault(); e.returnValue = '' } }
    window.addEventListener('popstate', aoVoltar)
    window.addEventListener('beforeunload', aoFecharJanela)
    return () => { window.removeEventListener('popstate', aoVoltar); window.removeEventListener('beforeunload', aoFecharJanela) }
  }, [])
  // trocar de tela pelo menu do Radar (Clientes, Rotas...) com o cadastro alterado também pergunta
  useEffect(() => definirGuardaSaida(() => {
    if (!abertaRef.current || !podeSair()) return !abertaRef.current
    alteradoRef.current = false
    return true
  }), [])
  useEffect(() => { window.scrollTo({ top: 0 }) }, [aberta])
  // clique no menu (o Radar soma 1 em irParaLista): volta para a pesquisa, mesmo com um cadastro aberto
  const cliqueMenuVisto = useRef(irParaLista)
  useEffect(() => {
    if (irParaLista === cliqueMenuVisto.current) return
    cliqueMenuVisto.current = irParaLista
    if (!abertaRef.current || !podeSair()) return
    alteradoRef.current = false
    if (history.state?.maquinaAberta) history.back()   // o popstate fecha o cadastro
    else Promise.resolve().then(() => setAberta(null))
  }, [irParaLista])

  function abrir(id, cliente = null) {
    setNovaPara(cliente)
    history.pushState({ ...history.state, maquinaAberta: id }, '')
    setAberta(id)
  }
  function fechar(salvouId) {
    alteradoRef.current = false
    if (salvouId) { setSelecionada(salvouId); recarregar() }
    if (history.state?.maquinaAberta) { history.back(); return }
    setAberta(null)
  }

  // a tela abre só com a busca: máquinas e vendas aparecem depois de pesquisar ou filtrar
  const pesquisou = !!(filtros.busca.trim() || empresa || Object.keys(FILTROS_VAZIOS).some((k) => k !== 'busca' && filtros[k]))
  const visiveis = useMemo(() => {
    if (!maquinas || !pesquisou) return []
    const f = filtros
    const t = f.busca.trim().toLowerCase()
    const porItem = comFiltroDeItem(f)
    return maquinas.filter((m) => {
      if (!f.inativas && !m.ativo) return false
      const itens = m.itens.filter((i) => i.ativo)
      if (empresa) {
        if (empresa.codigo === PROSPECT ? m.codigo_cliente !== PROSPECT || nomeEmpresa(m) !== empresa.nome
          : chaveCodigo(m.codigo_cliente) !== chaveCodigo(empresa.codigo)) return false
      } else if (t) {
        const texto = [nomeEmpresa(m), m.codigo_cliente, m.cliente?.cidade, m.cidade_prospect, m.nome_maquina, m.numero_maquina_pedido,
          m.tipo_papel, ...itens.map((i) => `${nomeProduto(i)} ${i.modelo || ''} ${i.posicao || ''}`)].join(' ').toLowerCase()
        if (!texto.includes(t)) return false
      }
      if (porItem && !itens.some((i) =>
        (!f.produto || nomeProduto(i).toLowerCase().includes(f.produto.toLowerCase())) &&
        (!f.posicao || String(i.posicao || '').toLowerCase().includes(f.posicao.toLowerCase())) &&
        dentro(i.largura, f.larguraDe, f.larguraAte) && dentro(i.comprimento, f.comprimentoDe, f.comprimentoAte) &&
        dentro(i.cfm, f.cfmDe, f.cfmAte))) return false
      return true
    })
  }, [maquinas, filtros, empresa, pesquisou])

  // vendas das empresas encontradas (prospect não tem venda)
  const codigos = useMemo(() => [...new Set([...visiveis.filter((m) => m.codigo_cliente !== PROSPECT).map((m) => m.codigo_cliente),
    ...(empresa && empresa.codigo !== PROSPECT ? [empresa.codigo] : [])])].sort(), [visiveis, empresa])
  // a busca também procura direto nas vendas, para achar empresa que ainda não tem máquina cadastrada
  const buscaVendas = !empresa && filtros.busca.trim().length >= 2 ? filtros.busca.trim() : ''

  // sugestões enquanto digita: clientes da base (o RLS recorta a carteira) e prospects já cadastrados
  useEffect(() => {
    const t = filtros.busca.trim()
    if (empresa || t.length < 2) return
    let vivo = true
    const espera = setTimeout(() => {
      const tl = t.toLowerCase()
      const prospects = [...new Set((maquinas || []).filter((m) => m.codigo_cliente === PROSPECT && nomeEmpresa(m)?.toLowerCase().includes(tl)).map(nomeEmpresa))]
        .slice(0, 5).map((nome) => ({ codigo: PROSPECT, nome, info: 'Prospect' }))
      buscarClientes(t).then((cl) => {
        if (!vivo) return
        setSugestoesLidas({ chave: t, lista: [...cl.map((c) => ({ codigo: c.codigo_cliente, nome: c.cliente || `Cliente ${c.codigo_cliente}`,
          info: [c.codigo_cliente, [c.cidade, c.uf].filter(Boolean).join('/')].filter(Boolean).join(' · ') })), ...prospects] })
        setMarcada(-1)
      }).catch(() => { if (vivo) setSugestoesLidas({ chave: t, lista: prospects }) })
    }, 250)
    return () => { vivo = false; clearTimeout(espera) }
  }, [filtros.busca, empresa, maquinas])
  const sugestoes = !empresa && sugestoesLidas.chave === filtros.busca.trim() ? sugestoesLidas.lista : []
  function escolherEmpresa(s) {
    setEmpresa(s); setFiltros((f) => ({ ...f, busca: s.nome })); setVerSugestoes(false); setSelecionada(null)
  }
  function teclaBusca(e) {
    if (!verSugestoes || !sugestoes.length) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setMarcada((i) => Math.min(i + 1, sugestoes.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setMarcada((i) => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter' && marcada >= 0) { e.preventDefault(); escolherEmpresa(sugestoes[marcada]) }
    else if (e.key === 'Escape') setVerSugestoes(false)
  }
  const chaveVendas = `${codigos.join(',')}|${periodo}|${buscaVendas}`
  useEffect(() => {
    let vivo = true
    const desde = desdeDoPeriodo(periodo)
    const espera = setTimeout(() => {
      Promise.all([listarVendas(codigos, desde), buscaVendas ? buscarVendasPorEmpresa(buscaVendas, desde) : []])
        .then(([porMaquina, porBusca]) => {
          if (!vivo) return
          const unicas = new Map([...porMaquina, ...porBusca].map((v) => [v.id, v]))
          setVendasCarregadas({ chave: chaveVendas, dados: [...unicas.values()].sort((a, b) => (a.data_venda < b.data_venda ? 1 : -1)) })
        })
        .catch((e) => { if (vivo) { setVendasCarregadas({ chave: chaveVendas, dados: [] }); setErro(e.message) } })
    }, buscaVendas ? 350 : 0)
    return () => { vivo = false; clearTimeout(espera) }
    // chaveVendas resume codigos + periodo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chaveVendas])
  const vendas = maquinas && vendasCarregadas.chave === chaveVendas ? vendasCarregadas.dados : null

  const vendasPorEmpresa = useMemo(() => {
    const mapa = new Map()
    for (const v of vendas || []) {
      const k = chaveCodigo(v.codigo_cliente)
      if (!mapa.has(k)) mapa.set(k, [])
      mapa.get(k).push(v)
    }
    return mapa
  }, [vendas])
  const vendasDe = (m) => (m.codigo_cliente === PROSPECT ? [] : vendasPorEmpresa.get(chaveCodigo(m.codigo_cliente)) || [])

  const lista = filtros.semVenda && vendas ? visiveis.filter((m) => !vendasDe(m).length) : visiveis
  const umaEmpresa = new Set(lista.map((m) => `${m.codigo_cliente}|${nomeEmpresa(m)}`)).size === 1
  const maquinaSel = lista.find((m) => m.id === selecionada) || null
  const numeroSel = maquinaSel ? normalizarNumero(maquinaSel.numero_maquina_pedido) : ''
  // com uma máquina escolhida: primeiro as vendas com o nº dela no pedido, depois pela medida mais parecida
  // com algum item; vendas sem medida por último (empate: mais recente primeiro, a ordem que já veio)
  const vendasMostradas = useMemo(() => {
    if (!maquinaSel) return (filtros.semVenda ? [] : vendas || []).map((v) => ({ v, proximo: null, daMaquina: false }))
    const itensSel = maquinaSel.itens.filter((i) => i.ativo)
    return vendasDe(maquinaSel)
      .map((v) => ({ v, proximo: itemMaisProximo(v, itensSel), daMaquina: !!numeroSel && v.numero_maquina_normalizado === numeroSel }))
      .sort((a, b) => (b.daMaquina - a.daMaquina) || ((a.proximo?.nota ?? Infinity) - (b.proximo?.nota ?? Infinity)) || 0)
    // vendasDe muda junto com vendas
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maquinaSel, numeroSel, vendas, filtros.semVenda])
  const pendentes = (maquinas || []).filter((m) => pendenteSync(m) || m.itens.some(pendenteSync)).length
  const qtdFiltrosExtras = ['produto', 'posicao', 'larguraDe', 'larguraAte', 'comprimentoDe', 'comprimentoAte', 'cfmDe', 'cfmAte', 'semVenda', 'inativas'].filter((k) => filtros[k]).length
  const mudar = (k) => (e) => setFiltros({ ...filtros, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  if (aberta) {
    const m = aberta === 'nova' ? null : (maquinas || []).find((x) => x.id === aberta)
    if (aberta !== 'nova' && !m) return <div className="painel iq-raiz mq-raiz"><p className="iq-vazio">Carregando...</p></div>
    return <FormularioMaquina key={aberta} maquina={m} clienteInicial={aberta === 'nova' ? novaPara : null} podeEditar={podeEditar} voltar={fechar}
      aoAlterar={(v) => { alteradoRef.current = v }} />
  }

  return (
    <div className="painel iq-raiz mq-raiz">
      <div className="secao-contexto">
        <div className="secao-contexto-principal">
          <div className="secao-contexto-icone" aria-hidden="true"><Ruler size={22} /></div>
          <div className="secao-contexto-texto">
            <h2>Máquinas e medidas</h2>
            <p>Máquinas e tamanhos dos clientes e prospects, e o que vendemos para cada um.</p>
          </div>
        </div>
        <div className="iq-acoes-lista">
          {podeAdmin && podeEditar && (
            <div className="iq-menu-ancora">
              <button type="button" className="iq-btn sec" onClick={() => setMais(!mais)} aria-expanded={mais}><MoreHorizontal size={18} /> Mais</button>
              {mais && <div className="iq-menu-fundo" onClick={() => setMais(false)} aria-hidden="true" />}
              {mais && (
                <div className="iq-menu abaixo" role="menu" onClick={() => setMais(false)}>
                  <button type="button" onClick={async () => {
                    try { const n = await importarFeira(); setAviso(n ? `${n} máquina(s) trazida(s) da feira.` : 'Nada novo na feira para trazer.'); recarregar() } catch (e) { setErro(e.message) }
                  }}><FolderInput size={15} /> Trazer cadastros da feira</button>
                </div>
              )}
            </div>
          )}
          {podeEditar && (
            <button type="button" className="iq-btn prim" onClick={() => abrir('nova', clienteInicial || null)}>
              <Plus size={18} /> Nova máquina
            </button>
          )}
        </div>
      </div>

      <SeloSync key={`${status?.ultima_execucao}|${status?.solicitado_em}`} status={status} podeEditar={podeEditar} pendentes={pendentes}
        aoSolicitar={async () => { try { await solicitarSync(); setStatus(await statusSync()) } catch (e) { setErro(e.message) } }} />
      {erro && <div className="iq-alerta" onClick={() => setErro('')}>{erro}</div>}
      {aviso && <div className="iq-ok mq-aviso" onClick={() => setAviso('')}>{aviso}</div>}

      <div className="iq-filtros">
        <div className="mq-busca-empresa">
          <label className="iq-busca">
            <Search size={18} aria-hidden="true" />
            <input type="search" className="iq-busca-campo" placeholder="Buscar por empresa, código, cidade, máquina ou produto" value={filtros.busca}
              role="combobox" aria-expanded={verSugestoes && !!sugestoes.length} aria-autocomplete="list" autoComplete="off"
              onChange={(e) => { setEmpresa(null); setVerSugestoes(true); setFiltros({ ...filtros, busca: e.target.value }) }}
              onFocus={() => setVerSugestoes(true)} onBlur={() => setTimeout(() => setVerSugestoes(false), 150)} onKeyDown={teclaBusca} />
          </label>
          {verSugestoes && !empresa && sugestoes.length > 0 && (
            <ul className="mq-resultados mq-sugestoes" role="listbox">
              {sugestoes.map((s, i) => (
                <li key={`${s.codigo}|${s.nome}`} role="option" aria-selected={i === marcada}>
                  <button type="button" className={i === marcada ? 'marcada' : ''} onMouseDown={(e) => e.preventDefault()} onClick={() => escolherEmpresa(s)}>
                    <strong>{s.nome}</strong><span>{s.info}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="iq-chips" role="tablist" aria-label="Período das vendas">
          {PERIODOS.map(([k, t]) => (
            <button key={k} type="button" role="tab" aria-selected={periodo === k} className={`iq-chip ${periodo === k ? 'ativo' : ''}`} onClick={() => setPeriodo(k)}>{t}</button>
          ))}
        </div>
        <button type="button" className="iq-btn sec" onClick={() => setMaisFiltros(!maisFiltros)} aria-expanded={maisFiltros}>
          {maisFiltros ? <ChevronUp size={16} /> : <ChevronDown size={16} />} Filtros{qtdFiltrosExtras ? ` (${qtdFiltrosExtras})` : ''}
        </button>
      </div>

      {maisFiltros && (
        <div className="mq-filtros-extra">
          <label className="mq-campo"><span>Produto</span><input value={filtros.produto} onChange={mudar('produto')} placeholder="Ex.: Feltro" /></label>
          <label className="mq-campo"><span>Posição</span><input value={filtros.posicao} onChange={mudar('posicao')} placeholder="Ex.: Prensa 1" /></label>
          <div className="mq-faixa"><span>Largura</span><input inputMode="decimal" value={filtros.larguraDe} onChange={mudar('larguraDe')} placeholder="de" /><input inputMode="decimal" value={filtros.larguraAte} onChange={mudar('larguraAte')} placeholder="até" /></div>
          <div className="mq-faixa"><span>Comprimento</span><input inputMode="decimal" value={filtros.comprimentoDe} onChange={mudar('comprimentoDe')} placeholder="de" /><input inputMode="decimal" value={filtros.comprimentoAte} onChange={mudar('comprimentoAte')} placeholder="até" /></div>
          <div className="mq-faixa"><span>CFM</span><input inputMode="decimal" value={filtros.cfmDe} onChange={mudar('cfmDe')} placeholder="de" /><input inputMode="decimal" value={filtros.cfmAte} onChange={mudar('cfmAte')} placeholder="até" /></div>
          <label className="mq-marca"><input type="checkbox" checked={filtros.semVenda} onChange={mudar('semVenda')} /> Sem venda nossa no período</label>
          <label className="mq-marca"><input type="checkbox" checked={filtros.inativas} onChange={mudar('inativas')} /> Mostrar desativadas</label>
          <button type="button" className="iq-btn sec peq" onClick={() => setFiltros({ ...FILTROS_VAZIOS, busca: filtros.busca })}><X size={14} /> Limpar filtros</button>
        </div>
      )}

      {maquinas !== null && !pesquisou ? (
        <div className="iq-vazio mq-inicio">
          <Search size={34} aria-hidden="true" />
          <p><strong>Pesquise uma empresa, máquina ou medida</strong></p>
          <p>{maquinas.length ? `${maquinas.filter((m) => m.ativo).length} máquinas cadastradas. ` : ''}Use a busca acima ou os Filtros (produto, largura, comprimento, CFM) para ver as máquinas e as vendas.</p>
        </div>
      ) : <>
      <h3 className="mq-titulo-secao">Máquinas <span>{maquinas ? lista.length : ''}</span></h3>
      {maquinas === null ? <p className="iq-vazio">Carregando...</p> : !lista.length ? (
        <div className="iq-vazio">
          <Ruler size={36} aria-hidden="true" />
          <p>{maquinas.length || buscaVendas ? 'Nenhuma máquina com esse filtro.' : 'Nenhuma máquina cadastrada ainda.'}{buscaVendas && vendas?.length ? ' As vendas da empresa estão abaixo.' : ''}</p>
          {podeEditar && <button type="button" className="iq-btn prim" onClick={() => abrir('nova', clienteInicial || null)}><Plus size={16} /> Cadastrar máquina</button>}
        </div>
      ) : (
        <div className="iq-cartoes">
          {lista.map((m) => {
            const itens = m.itens.filter((i) => i.ativo)
            const qtdVendas = vendasDe(m).length
            const sel = m.id === selecionada
            return (
              <div key={m.id} className={`iq-cartao mq-cartao ${m.ativo ? '' : 'inativa'} ${sel ? 'selecionada' : ''}`}>
                <span className="iq-cartao-faixa" aria-hidden="true" />
                <button type="button" className="iq-cartao-corpo mq-cartao-corpo" aria-pressed={sel} onClick={() => setSelecionada(sel ? null : m.id)}
                  title={sel ? 'Voltar a mostrar as vendas sem comparar' : umaEmpresa ? 'Comparar as vendas com os itens desta máquina' : 'Mostrar só as vendas desta empresa, comparando com esta máquina'}>
                  <span className="iq-cartao-topo"><strong>{nomeEmpresa(m)}</strong>
                    {m.codigo_cliente === PROSPECT ? <span className="iq-status mq-selo-prospect">Prospect</span> : <span className="mq-codigo">{m.codigo_cliente}</span>}
                  </span>
                  <span className="iq-cartao-info">
                    {[m.nome_maquina || 'Máquina sem nome', m.numero_maquina_pedido && `nº ${m.numero_maquina_pedido} no pedido`, m.tipo_papel].filter(Boolean).join(' · ')}
                  </span>
                  {itens.length ? (
                    <span className="mq-itens">{(abertas.has(m.id) ? itens : itens.slice(0, 4)).map((i) => <span key={i.id}>{resumoItem(i)}</span>)}
                      {itens.length > 4 && (
                        <span className="mq-mais" role="button" tabIndex={0} onClick={(e) => alternarItens(e, m.id)}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); alternarItens(e, m.id) } }}
                          title={abertas.has(m.id) ? 'Mostrar menos itens' : 'Mostrar todos os itens'}>
                          {abertas.has(m.id) ? 'Mostrar menos' : `+ ${itens.length - 4} item(ns)`}
                        </span>
                      )}</span>
                  ) : <span className="iq-cartao-meta">Sem itens informados</span>}
                  <span className="mq-selos">
                    {m.codigo_cliente !== PROSPECT && vendas && <span className={qtdVendas ? 'mq-selo venda' : 'mq-selo semvenda'}>{qtdVendas ? `${qtdVendas} venda(s) no período` : 'Sem venda no período'}</span>}
                    {!m.ativo && <span className="mq-selo">Desativada</span>}
                  </span>
                </button>
                <button type="button" className="iq-icone mq-editar" onClick={() => abrir(m.id)} title={podeEditar ? 'Editar máquina' : 'Ver cadastro'} aria-label={podeEditar ? 'Editar máquina' : 'Ver cadastro'}>
                  <Pencil size={17} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      <section className="mq-vendas" aria-label="Vendas">
        <h3 className="mq-titulo-secao">
          Vendas {maquinaSel ? <>de <em>{nomeEmpresa(maquinaSel)}</em></> : 'das empresas encontradas'}
          <span>{vendas ? vendasMostradas.length : ''}</span>
          {maquinaSel && <button type="button" className="iq-btn sec peq" onClick={() => setSelecionada(null)}><X size={14} /> Todas as empresas</button>}
        </h3>
        {maquinaSel && (
          <p className="mq-dica">Comparando com <strong>{maquinaSel.nome_maquina || 'a máquina'}</strong>
            {numeroSel ? <> · vendas com nº {maquinaSel.numero_maquina_pedido} no pedido em destaque e primeiro</> : ' · informe o nº da máquina no pedido para destacar as vendas dela'}
            {' '}· em ordem da medida mais parecida com algum item da máquina.</p>
        )}
        {maquinaSel?.codigo_cliente === PROSPECT ? <p className="iq-vazio">Prospect ainda não tem vendas.</p>
          : vendas === null ? <p className="iq-vazio">Carregando vendas...</p>
          : !vendasMostradas.length ? <p className="iq-vazio">{filtros.semVenda && !maquinaSel ? 'Filtro "sem venda nossa" ativo.' : 'Nenhuma venda no período.'}</p>
          : (
            <div className="mq-tabela-rolagem">
              <table className="mq-tabela">
                <thead><tr>
                  <th>Data</th>{!maquinaSel && <th>Empresa</th>}<th>Produto</th><th>Medida vendida</th><th>CFM</th><th>Máq.</th><th>Qtde</th>
                  {maquinaSel && <th>Item da máquina mais próximo</th>}<th>NF</th>
                </tr></thead>
                <tbody>
                  {vendasMostradas.slice(0, 300).map(({ v, proximo: maisProximo, daMaquina }) => {
                    const proximo = maisProximo?.item
                    return (
                      <tr key={v.id} className={daMaquina ? 'mq-da-maquina' : ''}>
                        <td data-rotulo="Data">{dataBr(v.data_venda)}</td>
                        {!maquinaSel && <td data-rotulo="Empresa">{v.nome_cliente || v.codigo_cliente}</td>}
                        <td data-rotulo="Produto">{v.descricao_item || v.codigo_material}</td>
                        <td data-rotulo="Medida vendida" title={v.medida_pela_descricao ? 'Medida estimada: lida do texto ou da observação da nota (venda sem característica no CIGAM)' : undefined}>
                          {v.medida_pela_descricao && medida(v.comprimento, v.largura) ? <span className="mq-estimada">≈ </span> : null}{medida(v.comprimento, v.largura) || '—'}
                        </td>
                        <td data-rotulo="CFM">{v.cfm ? formatarNumero(v.cfm, 2) : '—'}</td>
                        <td data-rotulo="Máquina">{v.numero_maquina || '—'}{daMaquina && <span className="mq-selo venda">esta</span>}</td>
                        <td data-rotulo="Qtde">{formatarNumero(v.quantidade, 2)} {v.unidade}</td>
                        {maquinaSel && <td data-rotulo="Mais próximo">{proximo ? <>{nomeProduto(proximo)} {medida(proximo.comprimento, proximo.largura)} <span className="mq-dif">{diferenca(v, proximo)}</span></> : '—'}</td>}
                        <td data-rotulo="NF">{v.nf}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {vendasMostradas.length > 300 && <p className="mq-dica">Mostrando as 300 mais recentes de {vendasMostradas.length}. Refine a busca para ver as demais.</p>}
            </div>
          )}
      </section>
      </>}
    </div>
  )
}
