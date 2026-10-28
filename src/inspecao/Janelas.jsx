import { useEffect, useMemo, useRef, useState } from 'react'
import {
  X, Loader2, Mail, FileText, FileDown, History, GitCompare, SpellCheck, Plus, Trash2, ChevronUp, ChevronDown,
  FolderInput, CheckCircle2, AlertTriangle, Search,
} from 'lucide-react'
import * as api from './api'
import { valor } from './modelo'

export function Modal({ titulo, fechar, children, largo, icone: Icone }) {
  const fecharRef = useRef(fechar)
  useEffect(() => { fecharRef.current = fechar })
  useEffect(() => {
    const tecla = (e) => { if (e.key === 'Escape') fecharRef.current() }
    window.addEventListener('keydown', tecla)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', tecla); document.body.style.overflow = '' }
  }, [])
  return (
    <div className="iq-raiz iq-modal-fundo" onClick={fechar}>
      <div className={`iq-modal ${largo ? 'largo' : ''}`} role="dialog" aria-modal="true" aria-label={titulo} onClick={(e) => e.stopPropagation()}>
        <header>{Icone && <span className="iq-secao-icone"><Icone size={18} /></span>}<h3>{titulo}</h3>
          <button type="button" className="iq-icone" onClick={fechar} title="Fechar"><X size={20} /></button></header>
        {children}
      </div>
    </div>
  )
}

const LIMITE_EMAIL = 12 * 1024 * 1024   // anexos por e-mail (o envio vai em base64 para o servidor)
const H = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const Ou = (s) => (String(s || '').trim() || '-')
const tabelaHtml = (cab, linhas) => `<table style="border-collapse:collapse;font-size:13px"><tr>${cab.map((c) => `<th style="padding:4px 12px 4px 0;text-align:left;color:#60758a;border-bottom:1px solid #d5dde6">${H(c)}</th>`).join('')}</tr>${linhas.map((l) => `<tr>${l.map((c) => `<td style="padding:4px 12px 4px 0">${H(c)}</td>`).join('')}</tr>`).join('')}</table>`

/** Corpo do e-mail - igual ao desktop (MainForm.CorpoEmail / CorpoEmailVarias). */
function corpoEmail(lista, mensagem) {
  const msg = mensagem.trim() ? `<p>${H(mensagem).replace(/\n/g, '<br>')}</p>` : ''
  if (lista.length === 1) {
    const i = lista[0]
    const dados = (i.dados_gerais || []).filter((c) => (c.valor || '').trim())
    return `<div style="font-family:Segoe UI,Arial;color:#173b5f;font-size:14px">${msg}` +
      `<p>Segue em anexo inspeção do cliente <b>${H(Ou(valor(i.dados_gerais, 'Cliente')))}</b>, nota fiscal <b>${H(Ou(valor(i.dados_gerais, 'Nota fiscal')))}</b>, ` +
      `realizada em <b>${H(Ou(valor(i.dados_gerais, 'Data da inspeção')))}</b> (relatório Nº ${H(i.numero)}, revisão ${String(i.revisao).padStart(2, '0')}).</p>` +
      `<table style="border-collapse:collapse;font-size:13px">${dados.map((c) => `<tr><td style="padding:4px 12px 4px 0;color:#60758a">${H(c.rotulo)}</td><td style="padding:4px 0">${H(c.valor)}</td></tr>`).join('')}</table>` +
      `<p style="color:#60758a;font-size:12px">Finalizado por ${H(i.finalizado_por)}${i.finalizado_em ? ` em ${new Date(i.finalizado_em).toLocaleString('pt-BR')}` : ''}.</p></div>`
  }
  return `<div style="font-family:Segoe UI,Arial;color:#173b5f;font-size:14px">${msg}<p>Seguem em anexo ${lista.length} inspeção(ões):</p>` +
    tabelaHtml(['Cliente', 'Código cliente', 'Nota fiscal', 'Data da inspeção', 'Relatório'],
      lista.map((i) => [Ou(valor(i.dados_gerais, 'Cliente')), Ou(valor(i.dados_gerais, 'Código cliente')), Ou(valor(i.dados_gerais, 'Nota fiscal')),
        Ou(valor(i.dados_gerais, 'Data da inspeção')), `${i.numero} / rev ${String(i.revisao).padStart(2, '0')}`])) + '</div>'
}

/**
 * Envio por e-mail. `itens`: [{ ins, dets, fotos }] já carregados (1 = individual, vários = lote).
 * Gera os PDFs aqui, divide em vários e-mails se passar do limite e marca o envio em cada inspeção.
 */
export function JanelaEmail({ itens, fechar, aoEnviar }) {
  const [para, setPara] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [estado, setEstado] = useState({ fase: 'pronto', texto: '' })
  const [usuarios, setUsuarios] = useState([])
  useEffect(() => {
    api.lerDestinatarios().then((l) => setPara(l.join('\n')))
    api.emailsUsuarios().then(setUsuarios)
  }, [])
  const destinos = para.split(/[\n;,]+/).map((s) => s.trim()).filter(Boolean)
  const invalidos = destinos.filter((d) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d))
  // sugestões: usuários do Radar que ainda não estão na lista
  const jaNaLista = new Set(destinos.map((d) => d.toLowerCase()))
  const sugestoes = usuarios.filter((u) => !jaNaLista.has(u.email) && !u.email.endsWith('.local'))   // .local = contas de teste
  const incluir = (email) => setPara((p) => (p.trim() ? `${p.trim()}\n${email}` : email))

  async function enviar() {
    if (!destinos.length || invalidos.length) return
    const rel = await import('./relatorio.js')
    try {
      const pdfs = []
      for (const [k, it] of itens.entries()) {
        setEstado({ fase: 'gerando', texto: `Gerando PDF ${k + 1} de ${itens.length}...` })
        const blob = await rel.gerarPdf(it.ins, it.dets, it.fotos)
        if (blob.size > LIMITE_EMAIL) throw new Error(`O PDF da inspeção ${it.ins.numero} tem ${(blob.size / 1048576).toFixed(1)} MB, acima do limite do e-mail. Reduza as fotos.`)
        pdfs.push({ it, blob })
      }
      // agrupa na ordem, fechando um e-mail quando o próximo PDF passaria do limite
      const partes = [[]]
      for (const p of pdfs) {
        const atual = partes[partes.length - 1]
        if (atual.length && atual.reduce((s, x) => s + x.blob.size, 0) + p.blob.size > LIMITE_EMAIL) partes.push([])
        partes[partes.length - 1].push(p)
      }
      await api.salvarDestinatarios([...new Set(destinos.map((d) => d.toLowerCase()))])
      for (const [k, parte] of partes.entries()) {
        setEstado({ fase: 'enviando', texto: partes.length > 1 ? `Enviando e-mail ${k + 1} de ${partes.length}...` : 'Enviando e-mail...' })
        const lista = parte.map((p) => p.it.ins)
        const clientes = [...new Set(lista.map((i) => valor(i.dados_gerais, 'Cliente')).filter(Boolean))]
        const assunto = lista.length === 1
          ? `Relatório de Inspeção Nº ${lista[0].numero} - rev ${String(lista[0].revisao).padStart(2, '0')}${clientes[0] ? ` - ${clientes[0]}` : ''}`
          : `Relatórios de Inspeção - ${lista.length} inspeção(ões)${clientes.length === 1 ? ` - ${clientes[0]}` : ''}${partes.length > 1 ? ` (parte ${k + 1}/${partes.length})` : ''}`
        const anexos = []
        for (const p of parte) anexos.push({ nome: rel.nomeArquivo(p.it.ins, 'pdf'), base64: await rel.paraBase64(p.blob) })
        await api.enviarEmail({ para: destinos, assunto, html: corpoEmail(lista, mensagem), anexos, inspecoes: lista.map((i) => ({ id: i.id, revisao: i.revisao })) })
      }
      setEstado({ fase: 'ok', texto: `${itens.length} relatório(s) enviado(s) para ${destinos.join(', ')}.` })
      aoEnviar?.()
    } catch (e) { setEstado({ fase: 'erro', texto: e.message }) }
  }

  const ocupado = estado.fase === 'gerando' || estado.fase === 'enviando'
  return (
    <Modal titulo={itens.length === 1 ? `Enviar relatório Nº ${itens[0].ins.numero}` : `Enviar ${itens.length} relatórios`} fechar={ocupado ? () => {} : fechar} icone={Mail}>
      <p className="iq-dica">O PDF {itens.length > 1 ? 'de cada inspeção vai' : 'vai'} anexado; o texto padrão (cliente, nota fiscal, data) entra sozinho.
        {itens.length > 1 ? ' Se passar do limite de tamanho, vai em mais de um e-mail.' : ''}</p>
      <label className="iq-campo"><span>Para (um por linha)</span>
        <textarea rows={4} value={para} onChange={(e) => setPara(e.target.value)} disabled={ocupado} placeholder="qualidade@phenixonline.com.br" /></label>
      {sugestoes.length > 0 && !ocupado && (
        <div className="iq-sugestoes-email">
          <span className="iq-dica">Usuários do Radar (toque para incluir):</span>
          <div>
            {sugestoes.map((u) => (
              <button type="button" key={u.email} className="iq-chip-email" title={u.email} onClick={() => incluir(u.email)}>
                <Plus size={13} /> <span><b>{u.nome || u.email}</b><small>{u.email}</small></span>
              </button>
            ))}
          </div>
        </div>
      )}
      {invalidos.length > 0 && <div className="iq-alerta">E-mail inválido: {invalidos.join(', ')}</div>}
      <label className="iq-campo"><span>Mensagem (opcional, vai antes do texto padrão)</span>
        <textarea rows={3} value={mensagem} onChange={(e) => setMensagem(e.target.value)} disabled={ocupado} /></label>
      {estado.texto && <div className={estado.fase === 'erro' ? 'iq-alerta' : 'iq-ok'}>{ocupado && <Loader2 className="iq-gira" size={14} />} {estado.texto}</div>}
      <footer>
        <span className="iq-dica">A lista fica salva para os próximos envios.</span>
        {estado.fase === 'ok'
          ? <button type="button" className="iq-btn prim" onClick={fechar}>Concluir</button>
          : <button type="button" className="iq-btn prim" onClick={enviar} disabled={ocupado || !destinos.length || invalidos.length > 0}><Mail size={16} /> Enviar</button>}
      </footer>
    </Modal>
  )
}

/** Escolha das inspeções finalizadas para o envio em lote. */
export function JanelaSelecionarEmail({ fechar, seguir }) {
  const [lista, setLista] = useState(null)
  const [marcadas, setMarcadas] = useState(new Set())
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(false)
  useEffect(() => { api.listarFinalizadas().then(setLista) }, [])
  const visiveis = useMemo(() => {
    const f = busca.trim().toLowerCase()
    return (lista || []).filter((i) => !f || [i.numero, i.cliente, i.cd_cliente, i.nota_fiscal, i.produto].join(' ').toLowerCase().includes(f))
  }, [lista, busca])
  const alternar = (id) => setMarcadas((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })
  async function avancar() {
    setCarregando(true)
    const itens = []
    for (const id of marcadas) itens.push(await api.carregar(id))
    seguir(itens)
  }
  return (
    <Modal titulo="Enviar várias inspeções" fechar={fechar} icone={Mail} largo>
      <label className="iq-busca"><Search size={18} /><input className="iq-busca-campo" placeholder="Buscar por cliente, código, NF, produto" value={busca} onChange={(e) => setBusca(e.target.value)} /></label>
      <div className="iq-acoes-linha">
        <button type="button" className="iq-btn sec peq" onClick={() => setMarcadas(new Set([...marcadas, ...visiveis.map((i) => i.id)]))}>Marcar visíveis</button>
        <button type="button" className="iq-btn sec peq" onClick={() => setMarcadas(new Set())}>Desmarcar todas</button>
        <span className="iq-dica">Só aparecem inspeções finalizadas.</span>
      </div>
      <div className="iq-lista-marcar">
        {lista === null && <p className="iq-vazio"><Loader2 className="iq-gira" /></p>}
        {visiveis.map((i) => (
          <label key={i.id} className={`iq-linha-marcar ${marcadas.has(i.id) ? 'marcada' : ''}`}>
            <input type="checkbox" checked={marcadas.has(i.id)} onChange={() => alternar(i.id)} />
            <span><b>{i.cliente || 'Cliente não informado'}</b><small>Nº {i.numero} · rev {String(i.revisao).padStart(2, '0')}{i.nota_fiscal ? ` · NF ${i.nota_fiscal}` : ''}{i.data_inspecao ? ` · ${i.data_inspecao}` : ''}</small></span>
            <small>{i.enviado_email_em ? `enviado ${new Date(i.enviado_email_em).toLocaleDateString('pt-BR')}` : ''}</small>
          </label>
        ))}
        {lista && !visiveis.length && <p className="iq-vazio">Nenhuma inspeção finalizada{busca ? ' com essa busca' : ''}.</p>}
      </div>
      <footer><span className="iq-dica">{marcadas.size} marcada(s)</span>
        <button type="button" className="iq-btn prim" disabled={!marcadas.size || carregando} onClick={avancar}>{carregando ? <Loader2 className="iq-gira" size={16} /> : null} Avançar</button></footer>
    </Modal>
  )
}

/** Revisões finalizadas: gerar o relatório de qualquer uma e ver o que mudou da anterior. */
export function JanelaHistorico({ ins, fechar }) {
  const [revs, setRevs] = useState(null)
  const [comparando, setComparando] = useState(null)
  const [gerando, setGerando] = useState('')
  useEffect(() => { api.listarRevisoes(ins.id).then(setRevs) }, [ins.id])

  async function gerar(rev, tipo) {
    setGerando(`${rev.revisao}${tipo}`)
    try {
      const rel = await import('./relatorio.js')
      const r = rev.retrato
      const dets = (r.detalhamentos || []).map((d, i) => ({ ...d, id: d.id || `rev${i}` }))
      const fotos = Object.fromEntries(dets.map((d) => [d.id, d.fotos || []]))
      const insRev = { ...ins, ...r, revisao: rev.revisao, alterado_em: r.alterado_em || rev.finalizado_em }
      const blob = tipo === 'pdf' ? await rel.gerarPdf(insRev, dets, fotos) : await rel.gerarWord(insRev, dets, fotos)
      rel.baixar(blob, rel.nomeArquivo(insRev, tipo === 'pdf' ? 'pdf' : 'docx'))
    } catch (e) { alert('Não foi possível gerar: ' + e.message) }
    setGerando('')
  }

  if (comparando) {
    const { antes, depois, difs } = comparando
    return (
      <Modal titulo={`O que mudou - rev ${String(antes.revisao).padStart(2, '0')} → rev ${String(depois.revisao).padStart(2, '0')}`} fechar={() => setComparando(null)} icone={GitCompare} largo>
        {!difs.length ? <p className="iq-vazio">Nenhuma diferença de conteúdo entre as duas revisões.</p> : (
          <div className="iq-tabela-rolagem">
            <table className="iq-tabela">
              <thead><tr><th>Item</th><th>Rev {String(antes.revisao).padStart(2, '0')}</th><th>Rev {String(depois.revisao).padStart(2, '0')}</th></tr></thead>
              <tbody>{difs.map((d, i) => <tr key={i}><td>{d.item}</td><td>{d.antes}</td><td className="iq-novo">{d.depois}</td></tr>)}</tbody>
            </table>
          </div>
        )}
        <footer><button type="button" className="iq-btn sec" onClick={() => setComparando(null)}>Voltar ao histórico</button></footer>
      </Modal>
    )
  }

  return (
    <Modal titulo={`Histórico - Relatório Nº ${ins.numero}`} fechar={fechar} icone={History} largo>
      <p className="iq-dica">Cada finalização guarda o relatório exatamente como estava. Gere o PDF/Word de qualquer revisão ou compare com a anterior.</p>
      {revs === null ? <p className="iq-vazio"><Loader2 className="iq-gira" /></p> : !revs.length ? <p className="iq-vazio">Nenhuma revisão finalizada ainda.</p> : (
        <div className="iq-revisoes">
          {revs.map((r, i) => {
            const anterior = revs[i + 1]
            return (
              <div key={r.id} className="iq-revisao">
                <span className="iq-item-num">{String(r.revisao).padStart(2, '0')}</span>
                <span className="iq-revisao-info"><b>Revisão {String(r.revisao).padStart(2, '0')}</b><small>Finalizada em {new Date(r.finalizado_em).toLocaleString('pt-BR')}{r.finalizado_por ? ` por ${r.finalizado_por}` : ''}</small></span>
                <span className="iq-revisao-acoes">
                  <button type="button" className="iq-btn sec peq" disabled={!!gerando} onClick={() => gerar(r, 'pdf')}>{gerando === `${r.revisao}pdf` ? <Loader2 className="iq-gira" size={14} /> : <FileText size={15} />} PDF</button>
                  <button type="button" className="iq-btn sec peq" disabled={!!gerando} onClick={() => gerar(r, 'word')}>{gerando === `${r.revisao}word` ? <Loader2 className="iq-gira" size={14} /> : <FileDown size={15} />} Word</button>
                  <button type="button" className="iq-btn sec peq" disabled={!anterior} title={anterior ? 'Comparar com a revisão anterior' : 'É a primeira guardada'}
                    onClick={async () => { const { comparar } = await import('./comparador.js'); setComparando({ antes: anterior, depois: r, difs: comparar(anterior.retrato, r.retrato) }) }}>
                    <GitCompare size={15} /> O que mudou</button>
                </span>
              </div>
            )
          })}
        </div>
      )}
    </Modal>
  )
}

/** Corrigir texto (LanguageTool): lista de correções marcáveis e como vai ficar. */
export function JanelaCorrecao({ campo, texto, fechar, usar }) {
  const [correcoes, setCorrecoes] = useState(null)
  const [marcadas, setMarcadas] = useState(new Set())
  const [erro, setErro] = useState('')
  const [aplicar, setAplicar] = useState(null)
  useEffect(() => {
    import('./corretor.js').then(async ({ verificar, aplicar: ap }) => {
      setAplicar(() => ap)
      try { const c = await verificar(texto); setCorrecoes(c); setMarcadas(new Set(c.map((_, i) => i))) } catch (e) { setErro(e.message) }
    })
  }, [texto])
  const resultado = correcoes && aplicar ? aplicar(texto, correcoes.filter((_, i) => marcadas.has(i))) : texto
  const visivel = (s) => (!s.trim() ? s.replace(/ /g, '·').replace(/\n/g, '⏎') : s)
  return (
    <Modal titulo={`Corrigir texto - ${campo}`} fechar={fechar} icone={SpellCheck} largo>
      {erro && <div className="iq-alerta">{erro}</div>}
      {!correcoes && !erro && <p className="iq-vazio"><Loader2 className="iq-gira" /> Verificando...</p>}
      {correcoes && !correcoes.length && <div className="iq-ok"><CheckCircle2 size={15} /> Nenhum erro encontrado.</div>}
      {correcoes?.length > 0 && (
        <>
          <p className="iq-dica">{correcoes.length} correção(ões) sugerida(s). Desmarque as que não quiser.</p>
          <div className="iq-lista-marcar">
            {correcoes.map((c, i) => (
              <label key={i} className={`iq-linha-marcar ${marcadas.has(i) ? 'marcada' : ''}`}>
                <input type="checkbox" checked={marcadas.has(i)} onChange={() => setMarcadas((s) => { const n = new Set(s); if (n.has(i)) n.delete(i); else n.add(i); return n })} />
                <span><b>"{visivel(c.original)}" → "{visivel(c.sugestao)}"</b><small>{c.motivo}</small></span>
              </label>
            ))}
          </div>
          <label className="iq-campo"><span>Como vai ficar</span><textarea rows={5} readOnly value={resultado} /></label>
        </>
      )}
      <footer>
        <span className="iq-dica">Corretor gratuito LanguageTool: ortografia, acentuação e pontuação.</span>
        <button type="button" className="iq-btn sec" onClick={fechar}>Cancelar</button>
        <button type="button" className="iq-btn prim" disabled={!correcoes?.length || !marcadas.size} onClick={() => { usar(resultado); fechar() }}>Usar correção</button>
      </footer>
    </Modal>
  )
}

/** Cadastro dos tipos de detalhamento: padrão (toda inspeção nova recebe) e sugeridos. */
export function JanelaTipos({ fechar }) {
  const [tipos, setTipos] = useState(null)
  const [novo, setNovo] = useState('')
  const [erro, setErro] = useState('')
  const carregar = () => api.listarTipos().then(setTipos).catch((e) => setErro(e.message))
  useEffect(() => { carregar() }, [])
  async function mexer(acao) { setErro(''); try { await acao(); await carregar() } catch (e) { setErro(e.message) } }
  const grupo = (padrao) => (tipos || []).filter((t) => t.padrao === padrao)
  function mover(lista, i, delta) {
    const j = i + delta
    if (j < 0 || j >= lista.length) return
    const a = lista[i], b = lista[j]
    mexer(async () => { await api.salvarTipo({ ...a, ordem: b.ordem }); await api.salvarTipo({ ...b, ordem: a.ordem === b.ordem ? a.ordem + delta : a.ordem }) })
  }
  // função de desenho (não componente): recriar componente a cada render perderia o foco dos campos
  const lista = (padrao, titulo, dica) => {
    const itens = grupo(padrao)
    return (
      <section key={titulo} className="iq-tipos-grupo">
        <h4>{titulo}</h4><p className="iq-dica">{dica}</p>
        {itens.map((t, i) => (
          <div key={t.id} className={`iq-tipo ${t.ativo ? '' : 'inativo'}`}>
            <input defaultValue={t.nome} aria-label="Nome do tipo" onBlur={(e) => { if (e.target.value.trim() && e.target.value !== t.nome) mexer(() => api.salvarTipo({ ...t, nome: e.target.value })) }} />
            <button type="button" className="iq-icone" title="Subir" disabled={i === 0} onClick={() => mover(itens, i, -1)}><ChevronUp size={17} /></button>
            <button type="button" className="iq-icone" title="Descer" disabled={i === itens.length - 1} onClick={() => mover(itens, i, 1)}><ChevronDown size={17} /></button>
            <button type="button" className="iq-btn sec peq" onClick={() => mexer(() => api.salvarTipo({ ...t, padrao: !t.padrao, ordem: (padrao ? 100 : 0) + i }))}>{padrao ? 'Tirar do padrão' : 'Tornar padrão'}</button>
            <label className="iq-check"><input type="checkbox" checked={t.ativo} onChange={(e) => mexer(() => api.salvarTipo({ ...t, ativo: e.target.checked }))} /> ativo</label>
            <button type="button" className="iq-icone perigo" title="Excluir tipo" onClick={() => confirm(`Excluir o tipo "${t.nome}"? (itens já criados nas inspeções não mudam)`) && mexer(() => api.excluirTipo(t.id))}><Trash2 size={16} /></button>
          </div>
        ))}
      </section>
    )
  }
  return (
    <Modal titulo="Tipos de detalhamento" fechar={fechar} icone={Plus} largo>
      {erro && <div className="iq-alerta">{erro}</div>}
      {!tipos ? <p className="iq-vazio"><Loader2 className="iq-gira" /></p> : (
        <>
          <form className="iq-acoes-linha" onSubmit={(e) => { e.preventDefault(); if (novo.trim()) mexer(async () => { await api.salvarTipo({ nome: novo, padrao: false, ordem: 999 }); setNovo('') }) }}>
            <input value={novo} onChange={(e) => setNovo(e.target.value)} placeholder="Novo tipo (ex.: Tratamento térmico)" aria-label="Novo tipo" />
            <button type="submit" className="iq-btn prim" disabled={!novo.trim()}><Plus size={16} /> Adicionar</button>
          </form>
          {lista(true, 'Padrão', 'Toda inspeção nova já nasce com estes itens, nesta ordem.')}
          {lista(false, 'Outros', 'Aparecem em "Adicionar item" para escolher quando precisar.')}
        </>
      )}
      <footer><span className="iq-dica">Inativos não aparecem nas inspeções novas. O desktop tem uma lista fixa própria.</span>
        <button type="button" className="iq-btn prim" onClick={fechar}>Concluir</button></footer>
    </Modal>
  )
}

/** Importar do desktop: a pasta das inspeções (ou um .zip exportado pelo programa). */
export function JanelaImportar({ fechar, aoImportar }) {
  const [achadas, setAchadas] = useState(null)
  const [resultados, setResultados] = useState({})
  const [andamento, setAndamento] = useState('')
  const [rodando, setRodando] = useState(false)
  const pasta = useRef(null)
  const zip = useRef(null)
  async function ler(arquivos) {
    setResultados({}); setAndamento('Lendo...')
    const { lerOrigem } = await import('./troca.js')
    setAchadas(await lerOrigem([...arquivos]))
    setAndamento('')
  }
  async function importarTudo() {
    setRodando(true)
    const { importar } = await import('./troca.js')
    for (const item of achadas) {
      const chave = item.pasta
      setAndamento(`Importando ${item.json?.Numero || chave}...`)
      const r = await importar(item, (t) => setAndamento(`Importando ${item.json?.Numero}: ${t}`)).catch((e) => ({ situacao: 'erro', detalhes: e.message }))
      setResultados((atual) => ({ ...atual, [chave]: r }))
    }
    setAndamento(''); setRodando(false); aoImportar?.()
  }
  const icone = (s) => (s === 'importada' ? <CheckCircle2 size={15} color="#15803d" /> : s === 'pulada' ? <CheckCircle2 size={15} color="#8391a2" /> : s ? <AlertTriangle size={15} color="#b45309" /> : null)
  return (
    <Modal titulo="Importar do programa desktop" fechar={rodando ? () => {} : fechar} icone={FolderInput} largo>
      <p className="iq-dica">Escolha a pasta das inspeções do desktop (ex.: \\100.91.50.50\Inspecoes\Inspecoes) ou um .zip exportado por ele.
        Entra com o mesmo número, itens, fotos com legenda e revisões. Inspeção que já existe no Radar é pulada: pode rodar de novo sem duplicar.</p>
      <div className="iq-acoes-linha">
        <button type="button" className="iq-btn sec" disabled={rodando} onClick={() => pasta.current.click()}><FolderInput size={16} /> Escolher pasta</button>
        <button type="button" className="iq-btn sec" disabled={rodando} onClick={() => zip.current.click()}><FileDown size={16} /> Escolher .zip</button>
        <input ref={pasta} type="file" hidden webkitdirectory="" directory="" multiple onChange={(e) => ler(e.target.files)} />
        <input ref={zip} type="file" hidden accept=".zip" multiple onChange={(e) => ler(e.target.files)} />
      </div>
      {andamento && <div className="iq-ok"><Loader2 className="iq-gira" size={14} /> {andamento}</div>}
      {achadas && (
        <div className="iq-lista-marcar">
          {!achadas.length && <p className="iq-vazio">Nenhuma inspeção (inspecao.json) nessa escolha.</p>}
          {achadas.map((a) => {
            const r = resultados[a.pasta]
            return (
              <div key={a.pasta} className="iq-linha-marcar">
                {icone(r?.situacao) || <span style={{ width: 15 }} />}
                <span><b>{a.json?.Numero || a.pasta}</b><small>{a.erro || `${valor((a.json?.DadosGerais || []).map((c) => ({ rotulo: c.Rotulo, valor: c.Valor })), 'Cliente') || 'sem cliente'} · ${(a.json?.Detalhamentos || []).reduce((s, d) => s + (d.Fotos || []).length, 0)} foto(s) · ${a.revisoes?.length || 0} revisão(ões)`}</small>
                  {r?.detalhes && <small className="iq-aviso-linha">{r.situacao}: {r.detalhes}</small>}</span>
              </div>
            )
          })}
        </div>
      )}
      <footer>
        <button type="button" className="iq-btn sec" disabled={rodando} onClick={fechar}>Fechar</button>
        <button type="button" className="iq-btn prim" disabled={!achadas?.length || rodando} onClick={importarTudo}>{rodando ? <Loader2 className="iq-gira" size={16} /> : <FolderInput size={16} />} Importar {achadas?.length || ''}</button>
      </footer>
    </Modal>
  )
}
