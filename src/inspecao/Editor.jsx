import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowLeft, IdCard, Ruler, Factory, ListChecks, FileSignature, Lock, CheckCircle2, RotateCcw,
  Trash2, Cloud, CloudOff, Loader2, Plus, X, FileText, FileDown, Mail, History, Archive, SpellCheck, Building2,
} from 'lucide-react'
import * as api from './api'
import { CAMPOS_DADOS_GERAIS, CAMPOS_TECNICOS, CAMPOS_TECNICOS_SAIDA, GRUPOS_TEC, GRUPOS_TEC_SAIDA, completarFabricanteSaida, conteudo, pode, temSaida, FORNECEDOR_PHENIX } from './modelo'
import Detalhamentos from './Detalhamentos.jsx'
import { JanelaCorrecao, JanelaEmail, JanelaHistorico } from './Janelas.jsx'

/** Campo Cliente com busca no cadastro de clientes do Radar: escolher preenche Cliente e Código. */
function CampoCliente({ valor, leitura, escolher, mudar }) {
  const [sugestoes, setSugestoes] = useState([])
  const [aberto, setAberto] = useState(false)
  const [buscando, setBuscando] = useState(false)
  const espera = useRef(null)
  function digitar(texto) {
    mudar(texto)
    clearTimeout(espera.current)
    if (texto.trim().length < 2) { setSugestoes([]); return }
    espera.current = setTimeout(async () => {
      setBuscando(true)
      try { setSugestoes(await api.buscarClientes(texto)); setAberto(true) } catch { setSugestoes([]) }
      setBuscando(false)
    }, 250)
  }
  return (
    <div className="iq-autocompletar">
      <input value={valor} readOnly={leitura} placeholder="Digite o nome ou o código do cliente" autoComplete="off"
        onChange={(e) => digitar(e.target.value)} onFocus={() => sugestoes.length && setAberto(true)} onBlur={() => setTimeout(() => setAberto(false), 150)} />
      {buscando && <Loader2 className="iq-gira iq-autocompletar-gira" size={16} />}
      {aberto && !leitura && sugestoes.length > 0 && (
        <ul className="iq-sugestoes" role="listbox">
          {sugestoes.map((c) => (
            <li key={c.codigo_cliente} role="option" aria-selected="false" onMouseDown={(e) => { e.preventDefault(); escolher(c); setAberto(false) }}>
              <Building2 size={16} aria-hidden="true" />
              <span><b>{c.cliente}</b><small>Cód. {c.codigo_cliente}{c.cidade ? ` · ${c.cidade}/${c.uf}` : ''}</small></span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const SALVAR_APOS_MS = 4000   // salvamento automático, como no desktop
const RENOVAR_TRAVA_MS = 60000

// Grupos de campos na tela (o relatório continua com a ordem de CAMPOS_DADOS_GERAIS / CAMPOS_TECNICOS)
const GRUPOS_IDENT = [
  ['Cliente', ['Cliente', 'Código cliente']],
  ['Nota e pedido', ['Nota fiscal', 'Pedido', 'Data de entrada', 'Data da inspeção']],
  ['Produto', ['Produto', 'Código do produto', 'Lote', 'Metragem 1', 'Metragem 2', 'Metragem 3']],
  ['Inspeção', ['Local', 'Inspetor']],
]
const LARGO = new Set(['Cliente', 'Produto', 'Norma / Especificação', 'Composição'])
const DATAS = new Set(['Data de entrada', 'Data da inspeção'])

// datas guardadas como dd/mm/aaaa (igual ao desktop); na tela, o calendário do navegador
const paraIso = (br) => { const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(br || ''); return m ? `${m[3]}-${m[2]}-${m[1]}` : '' }
const paraBr = (iso) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); return m ? `${m[3]}/${m[2]}/${m[1]}` : '' }

/** Grupos de campos + "Outros campos" livres (só sai no relatório o que tiver valor). */
function Campos({ grupos, padrao, lista, mudar, leitura }) {
  const valorDe = (r) => lista.find((c) => c.rotulo === r)?.valor || ''
  const extras = lista.filter((c) => !padrao.includes(c.rotulo))
  const setPadrao = (rotulo, valor) =>
    mudar(lista.some((c) => c.rotulo === rotulo)
      ? lista.map((c) => (c.rotulo === rotulo ? { ...c, valor } : c))
      // campo padrão novo numa inspeção antiga: entra na ordem do padrão (o relatório segue a lista)
      : padrao.flatMap((p) => (p === rotulo ? [{ rotulo, valor }] : lista.filter((c) => c.rotulo === p))).concat(extras))
  const setExtras = (novos) => mudar([...lista.filter((c) => padrao.includes(c.rotulo)), ...novos])
  return (
    <>
      {grupos.map(([titulo, rotulos]) => (
        <fieldset key={titulo} className="iq-grupo">
          <legend>{titulo}</legend>
          <div className="iq-grade">
            {rotulos.map((r) => (
              <label key={r} className={`iq-campo ${LARGO.has(r) ? 'largo' : ''}`}>
                <span>{r}</span>
                {DATAS.has(r)
                  ? <input type="date" value={paraIso(valorDe(r))} readOnly={leitura} onChange={(e) => setPadrao(r, paraBr(e.target.value))} />
                  : r === 'Cliente' && padrao.includes('Código cliente')
                    ? <CampoCliente valor={valorDe(r)} leitura={leitura} mudar={(v) => setPadrao(r, v)}
                        escolher={(c) => mudar(lista.map((x) => (x.rotulo === 'Cliente' ? { ...x, valor: c.cliente } : x.rotulo === 'Código cliente' ? { ...x, valor: c.codigo_cliente } : x)))} />
                    : <input value={valorDe(r)} readOnly={leitura} onChange={(e) => setPadrao(r, e.target.value)} />}
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      {(extras.length > 0 || !leitura) && (
        <fieldset className="iq-grupo">
          <legend>Outros campos</legend>
          {extras.map((c, i) => (
            <div key={i} className="iq-extra">
              <input placeholder="Nome do campo" value={c.rotulo} readOnly={leitura} aria-label="Nome do campo"
                onChange={(e) => setExtras(extras.map((x, j) => (j === i ? { ...x, rotulo: e.target.value } : x)))} />
              <input placeholder="Valor" value={c.valor} readOnly={leitura} aria-label="Valor"
                onChange={(e) => setExtras(extras.map((x, j) => (j === i ? { ...x, valor: e.target.value } : x)))} />
              <label className="iq-imprimir" title="Desmarcado: só sai no PDF interno">
                <input type="checkbox" checked={c.imprimir === true} disabled={leitura}
                  onChange={(e) => setExtras(extras.map((x, j) => (j === i ? { ...x, imprimir: e.target.checked } : x)))} />
                Imprimir
              </label>
              {!leitura && <button type="button" className="iq-icone" title="Remover campo" onClick={() => setExtras(extras.filter((_, j) => j !== i))}><X size={16} /></button>}
            </div>
          ))}
          {!leitura && <button type="button" className="iq-btn sec peq" onClick={() => setExtras([...extras, { rotulo: '', valor: '', imprimir: false }])}><Plus size={15} /> Campo</button>}
          <p className="iq-dica">Só sai no relatório o que tiver valor. Sem "Imprimir", o campo fica fora do PDF/Word do cliente e sai só no PDF interno.</p>
        </fieldset>
      )}
    </>
  )
}

function Secao({ id, icone: Icone, titulo, descricao, children, extra }) {
  return (
    <section id={id} className="painel iq-secao">
      <header className="iq-secao-topo">
        <span className="iq-secao-icone" aria-hidden="true"><Icone size={20} /></span>
        <div><h3>{titulo}</h3>{descricao && <p>{descricao}</p>}</div>
        {extra}
      </header>
      {children}
    </section>
  )
}

export default function Editor({ id, papel, nome, voltar }) {
  const [ins, setIns] = useState(null)
  const [dets, setDets] = useState([])
  const [fotos, setFotos] = useState({})
  const [dono, setDono] = useState(null)        // quem está com a trava (null = eu ou ninguém)
  const [salvo, setSalvo] = useState({ estado: 'ok', quando: null })
  const [erro, setErro] = useState('')
  const [saidaAberta, setSaidaAberta] = useState(false)
  const [janela, setJanela] = useState(null)     // 'email' | 'historico' | { corrigir: {campo, texto, usar} }
  const [gerando, setGerando] = useState('')
  const sujo = useRef(false)
  const salvando = useRef(false)      // durante o salvamento, releituras não mexem nos campos da tela
  const salvoRef = useRef('')
  const timer = useRef(null)
  const estado = useRef({})
  // o salvamento roda fora do render (timer, ao sair): lê sempre o estado mais novo por aqui
  useEffect(() => { estado.current = { ins, dets, fotos } })

  const salvarAgora = useCallback(async () => {
    clearTimeout(timer.current)
    const { ins: i, dets: d, fotos: f } = estado.current
    if (!i || !sujo.current) return
    const alterou = conteudo(i, d, f) !== salvoRef.current
    sujo.current = false
    salvando.current = true
    setSalvo({ estado: 'salvando', quando: null })
    try {
      const novo = await api.salvar(i, d, alterou).finally(() => { salvando.current = false })
      salvoRef.current = conteudo(novo, d, f)
      // só a revisão volta do salvamento: os campos da tela podem já ter mudado enquanto ele rodava
      // (devolver a saída daqui apagava o que foi digitado durante o salvamento)
      setIns((atual) => ({ ...atual, revisao: novo.revisao }))
      // e já vale para quem roda logo em seguida (Finalizar), antes da tela redesenhar:
      // sem isto, reabrir + alterar + finalizar fechava a revisão antiga (00 em vez de 01)
      estado.current = { ...estado.current, ins: { ...estado.current.ins, revisao: novo.revisao } }
      setSalvo({ estado: 'ok', quando: new Date() })
    } catch (e) {
      sujo.current = true
      setSalvo({ estado: 'erro', quando: null })
      setErro('Não foi possível salvar: ' + e.message)
    }
  }, [])

  const marcar = useCallback(() => {
    sujo.current = true
    setSalvo({ estado: 'pendente', quando: null })
    clearTimeout(timer.current)
    timer.current = setTimeout(salvarAgora, SALVAR_APOS_MS)
  }, [salvarAgora])

  const leitura = !ins || ins.finalizado || !!dono || !pode(papel, 'inspetor')

  const leituras = useRef(0)
  const recarregar = useCallback(async () => {
    const minha = ++leituras.current
    const d = await api.carregar(id)
    // leituras saem em paralelo (abrir, trava, ao vivo) e podem chegar fora de ordem:
    // a resposta de uma leitura antiga é descartada
    if (minha !== leituras.current) return
    // conferido DEPOIS da leitura: se a pessoa digitou enquanto ela chegava, a tela não é sobrescrita
    // (uma leitura atrasada apagava o que acabara de ser digitado); só as fotos entram
    if (sujo.current || salvando.current) { setFotos(d.fotos); return }
    setIns(d.ins); setDets(d.dets); setFotos(d.fotos)
    salvoRef.current = conteudo(d.ins, d.dets, d.fotos)
  }, [id])

  // abrir: carrega e tenta travar; renova a cada minuto; libera ao sair
  useEffect(() => {
    let vivo = true
    recarregar().catch((e) => setErro(e.message))
    const travar = async () => {
      if (!pode(papel, 'inspetor')) return
      const quem = await api.tentarTravar(id, nome).catch(() => null)
      if (vivo) setDono(quem)
      if (vivo && !quem) recarregar().catch(() => {})
    }
    travar()
    const renova = setInterval(travar, RENOVAR_TRAVA_MS)
    const sair = () => { api.liberarTrava(id) }
    window.addEventListener('beforeunload', sair)
    const canal = api.supabase.channel(`inspecao-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inspecao_fotos', filter: `inspecao_id=eq.${id}` }, () => recarregar())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'inspecoes', filter: `id=eq.${id}` }, () => recarregar())
      .subscribe()
    return () => {
      vivo = false
      clearInterval(renova)
      window.removeEventListener('beforeunload', sair)
      api.supabase.removeChannel(canal)
      salvarAgora().finally(() => api.liberarTrava(id))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const mudarIns = (campos) => { setIns((i) => ({ ...i, ...campos })); marcar() }
  const mudarDets = (novos) => { setDets(novos); marcar() }

  async function finalizar() {
    if (!confirm(`Finalizar o relatório Nº ${ins.numero} (revisão ${String(ins.revisao).padStart(2, '0')})?\n\nEle fica bloqueado para edição. Para alterar depois, use "Reabrir".`)) return
    await salvarAgora()
    try { setIns(await api.finalizar(estado.current.ins, dets, fotos, nome)) } catch (e) { setErro(e.message) }
  }

  async function reabrir() {
    try { await api.reabrir(ins.id); setIns({ ...ins, finalizado: false }) } catch (e) { setErro(e.message) }
  }

  async function excluir() {
    if (!confirm(`Excluir a inspeção Nº ${ins.numero}?${ins.finalizado ? '\n\nATENÇÃO: o relatório já foi finalizado.' : ''}\n\nEla vai para a lixeira e pode ser restaurada.`)) return
    try { await api.excluir(ins.id, nome); voltar() } catch (e) { setErro(e.message) }
  }

  async function gerar(tipo) {
    await salvarAgora()
    setGerando(tipo)
    try {
      const rel = await import('./relatorio.js')
      const atual = estado.current
      if (tipo === 'zip') {
        const { exportarZip } = await import('./troca.js')
        rel.baixar(await exportarZip(atual.ins, atual.dets, atual.fotos, await api.listarRevisoes(atual.ins.id)), `Inspecao_${atual.ins.numero}.zip`)
      } else {
        // 'pdfint' = PDF interno (completo); PDF e Word são a versão do cliente
        const interno = tipo === 'pdfint'
        const blob = tipo === 'word' ? await rel.gerarWord(atual.ins, atual.dets, atual.fotos) : await rel.gerarPdf(atual.ins, atual.dets, atual.fotos, { interno })
        rel.baixar(blob, rel.nomeArquivo(atual.ins, tipo === 'word' ? 'docx' : 'pdf', interno))
      }
    } catch (e) { setErro('Não foi possível gerar: ' + e.message) }
    setGerando('')
  }

  const corrigir = (campo, texto, usar) => setJanela({ corrigir: { campo, texto: (texto || '').replace(/\r\n/g, '\n'), usar } })

  function irPara(secao) {
    document.getElementById(secao)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (erro && !ins) return <div className="painel iq-raiz"><div className="iq-alerta">{erro}</div></div>
  if (!ins) return <div className="painel iq-raiz"><p className="iq-vazio"><Loader2 className="iq-gira" size={22} /> Abrindo a inspeção...</p></div>

  const rev = String(ins.revisao).padStart(2, '0')
  const cliente = ins.dados_gerais.find((c) => c.rotulo === 'Cliente')?.valor
  const status = dono ? 'edicao' : ins.finalizado ? 'finalizada' : 'rascunho'
  const comSaida = temSaida(ins) || saidaAberta
  const itensComConteudo = dets.filter((d) => (d.texto || '').trim() || (fotos[d.id] || []).length).length

  return (
    <div className="iq-raiz iq-pagina">
      <div className="painel iq-cabecalho">
        <button type="button" className="iq-voltar" onClick={voltar}><ArrowLeft size={18} /> Inspeções</button>
        <div className="iq-cabecalho-linha">
          <div className="iq-cabecalho-titulo">
            <h2>{cliente || 'Cliente não informado'}</h2>
            <p>Relatório Nº {ins.numero} · revisão {rev}</p>
          </div>
          <span className={`iq-status grande ${status}`}>
            {status === 'edicao' && <Lock size={14} />}
            {status === 'finalizada' && <CheckCircle2 size={14} />}
            {status === 'edicao' ? `Em edição por ${dono}` : status === 'finalizada' ? 'Finalizada' : 'Rascunho'}
          </span>
        </div>
        {dono && <div className="iq-aviso"><Lock size={16} /> {dono} está editando esta inspeção. Você vê as alterações dela ao vivo; a edição libera quando ela sair.</div>}
        {ins.finalizado && !dono && (
          <div className="iq-aviso ok"><CheckCircle2 size={16} /> Finalizada{ins.finalizado_por ? ` por ${ins.finalizado_por}` : ''}{ins.finalizado_em ? ` em ${new Date(ins.finalizado_em).toLocaleString('pt-BR')}` : ''}. Para alterar, reabra: a próxima alteração abre a revisão {String(ins.ultima_revisao_finalizada + 1).padStart(2, '0')}.</div>
        )}
        {erro && <div className="iq-alerta" onClick={() => setErro('')}>{erro}</div>}
        <div className="iq-acoes-cabecalho">
          <button type="button" className="iq-btn sec peq" disabled={!!gerando} onClick={() => gerar('pdf')}>{gerando === 'pdf' ? <Loader2 className="iq-gira" size={15} /> : <FileText size={15} />} PDF</button>
          <button type="button" className="iq-btn sec peq" disabled={!!gerando} onClick={() => gerar('pdfint')} title="Versão completa, com os campos adicionais sem Imprimir - uso interno">{gerando === 'pdfint' ? <Loader2 className="iq-gira" size={15} /> : <FileText size={15} />} PDF interno</button>
          <button type="button" className="iq-btn sec peq" disabled={!!gerando} onClick={() => gerar('word')}>{gerando === 'word' ? <Loader2 className="iq-gira" size={15} /> : <FileDown size={15} />} Word</button>
          {ins.finalizado && pode(papel, 'inspetor') && <button type="button" className="iq-btn sec peq" onClick={() => setJanela('email')}><Mail size={15} /> E-mail</button>}
          <button type="button" className="iq-btn sec peq" onClick={() => setJanela('historico')}><History size={15} /> Histórico</button>
          <button type="button" className="iq-btn sec peq" disabled={!!gerando} onClick={() => gerar('zip')} title="Arquivo para o programa desktop">{gerando === 'zip' ? <Loader2 className="iq-gira" size={15} /> : <Archive size={15} />} Exportar</button>
          {ins.enviado_email_em && <span className="iq-dica">E-mail da rev {String(ins.enviado_email_revisao).padStart(2, '0')} em {new Date(ins.enviado_email_em).toLocaleString('pt-BR')}</span>}
        </div>
        <nav className="iq-atalhos" aria-label="Seções da inspeção">
          <button type="button" onClick={() => irPara('iq-ident')}><IdCard size={16} /> Identificação</button>
          <button type="button" onClick={() => irPara('iq-tec')}><Ruler size={16} /> Técnicas</button>
          <button type="button" onClick={() => irPara('iq-saida')}><Factory size={16} /> Saída{comSaida ? ' ✓' : ''}</button>
          <button type="button" onClick={() => irPara('iq-det')}><ListChecks size={16} /> Detalhamento <em>{itensComConteudo}/{dets.length}</em></button>
          <button type="button" onClick={() => irPara('iq-conc')}><FileSignature size={16} /> Conclusão</button>
        </nav>
      </div>

      <Secao id="iq-ident" icone={IdCard} titulo="Identificação" descricao="Cliente, nota, produto e dados da inspeção.">
        <Campos grupos={GRUPOS_IDENT} padrao={CAMPOS_DADOS_GERAIS} lista={ins.dados_gerais} leitura={leitura} mudar={(v) => mudarIns({ dados_gerais: v })} />
      </Secao>

      <Secao id="iq-tec" icone={Ruler} titulo="Informações técnicas do recebimento" descricao="Como a tela chegou para inspeção.">
        <Campos grupos={GRUPOS_TEC} padrao={CAMPOS_TECNICOS} lista={ins.informacoes_tecnicas} leitura={leitura} mudar={(v) => mudarIns({ informacoes_tecnicas: v })} />
      </Secao>

      <Secao id="iq-saida" icone={Factory} titulo="Informações técnicas de saída"
        descricao={comSaida ? `Como a tela saiu da Phenix. Vai como primeiro tópico do relatório; o Fabricante fica "${FORNECEDOR_PHENIX}".` : 'Só quando a Phenix forneceu a tela.'}
        extra={(
          <label className={`iq-interruptor ${temSaida(ins) ? 'travado' : ''}`} title={temSaida(ins) ? 'Para desligar, apague os campos de saída' : ''}>
            <input type="checkbox" checked={comSaida} disabled={leitura || temSaida(ins)} onChange={(e) => setSaidaAberta(e.target.checked)} />
            <span aria-hidden="true" />
            A Phenix forneceu esta tela
          </label>
        )}>
        {comSaida && (
          <Campos grupos={GRUPOS_TEC_SAIDA} padrao={CAMPOS_TECNICOS_SAIDA} lista={ins.informacoes_tecnicas_saida} leitura={leitura}
            mudar={(v) => mudarIns({ informacoes_tecnicas_saida: completarFabricanteSaida({ informacoes_tecnicas_saida: v }) })} />
        )}
      </Secao>

      <Secao id="iq-det" icone={ListChecks} titulo="Detalhamento e fotos"
        descricao={`${itensComConteudo} de ${dets.length} itens com descrição ou foto. Itens vazios não saem no relatório.`}>
        <Detalhamentos ins={ins} dets={dets} fotos={fotos} leitura={leitura} mudarDets={mudarDets} setFotos={setFotos} setErro={setErro}
          corrigir={(d) => corrigir(`descrição de ${d.titulo || 'item'}`, d.texto, (t) => mudarDets(estado.current.dets.map((x) => (x.id === d.id ? { ...x, texto: t } : x))))} />
      </Secao>

      <Secao id="iq-conc" icone={FileSignature} titulo="Conclusão e assinaturas">
        {/* div + label for: botão dentro de <label> roubaria o rótulo da caixa de texto */}
        <div className="iq-campo">
          <span className="iq-rotulo-acao"><label htmlFor="iq-conclusao">Conclusão / parecer</label>
            {!leitura && ins.conclusao.trim() && <button type="button" className="iq-link" onClick={() => corrigir('conclusão', ins.conclusao, (t) => mudarIns({ conclusao: t }))}><SpellCheck size={14} /> Corrigir texto</button>}
          </span>
          <textarea id="iq-conclusao" rows={6} value={ins.conclusao} readOnly={leitura} placeholder="Parecer final da inspeção" onChange={(e) => mudarIns({ conclusao: e.target.value })} />
        </div>
        <div className="iq-grade iq-assinaturas">
          <label className="iq-campo"><span>Elaborado por</span><input value={ins.elaborado_por} readOnly={leitura} onChange={(e) => mudarIns({ elaborado_por: e.target.value })} /></label>
          <label className="iq-campo"><span>Aprovado por</span><input value={ins.aprovado_por} readOnly={leitura} onChange={(e) => mudarIns({ aprovado_por: e.target.value })} /></label>
          <label className="iq-campo"><span>Setor</span><input value={ins.setor} readOnly={leitura} onChange={(e) => mudarIns({ setor: e.target.value })} /></label>
          <label className="iq-campo largo"><span>Título do relatório</span><input value={ins.titulo} readOnly={leitura} onChange={(e) => mudarIns({ titulo: e.target.value })} /></label>
        </div>
        {!dono && pode(papel, 'aprovador') && (
          <div className="iq-zona-perigo">
            <span>Excluir manda a inspeção para a lixeira (pode ser restaurada).</span>
            <button type="button" className="iq-btn perigo" onClick={excluir}><Trash2 size={16} /> Excluir inspeção</button>
          </div>
        )}
      </Secao>

      {janela === 'email' && <JanelaEmail itens={[{ ins, dets, fotos }]} fechar={() => setJanela(null)} aoEnviar={() => recarregar()} />}
      {janela === 'historico' && <JanelaHistorico ins={ins} fechar={() => setJanela(null)} />}
      {janela?.corrigir && <JanelaCorrecao campo={janela.corrigir.campo} texto={janela.corrigir.texto} usar={janela.corrigir.usar} fechar={() => setJanela(null)} />}

      <div className="iq-barra">
        <span className={`iq-salvo ${salvo.estado}`}>
          {salvo.estado === 'salvando' && <><Loader2 className="iq-gira" size={16} /> Salvando...</>}
          {salvo.estado === 'pendente' && <><Cloud size={16} /> Salvando em instantes</>}
          {salvo.estado === 'erro' && <><CloudOff size={16} /> Não salvou - tente de novo</>}
          {salvo.estado === 'ok' && <><Cloud size={16} /> {salvo.quando ? `Salvo às ${salvo.quando.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : leitura ? 'Somente leitura' : 'Tudo salvo'}</>}
        </span>
        {!leitura && salvo.estado !== 'ok' && <button type="button" className="iq-btn sec so-computador-barra" onClick={salvarAgora}>Salvar agora</button>}
        {!leitura && <button type="button" className="iq-btn prim" onClick={finalizar}><CheckCircle2 size={17} /> Finalizar</button>}
        {ins.finalizado && !dono && pode(papel, 'aprovador') && <button type="button" className="iq-btn sec" onClick={reabrir}><RotateCcw size={16} /> Reabrir</button>}
      </div>
    </div>
  )
}
