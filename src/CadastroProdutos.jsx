import React from 'react'
import { enviarCadastro, enfileirar, novoEnvioId } from './filaCadastroProdutos'
import './cadastro-produtos-feira.css'
const vazio = { empresa:'', contato:'', telefone:'', email:'', responsavel:'', maquina:'', papel:'', velocidade_maquina:'', informacoes_adicionais:'' }
const itemVazio = { modelo:'', posicao:'', comprimento:'', largura:'', espessura:'', cfm:'', gramatura:'', teflonada:false, durabilidade:'' }
const produtos = { Tissue:['Tela Formadora','Feltro','Tela DNT','Tela Acabadora'], Marrom:['Tela Tecida','Formadora','Feltro','Feltro com emenda','Camisa','Engrossador','Secadora Espiral'] }
const modelos = (papel, produto) => produto === 'Camisa' ? ['Malha 4','Malha 16','Malha 18','Malha 21'] : (produto === 'Formadora' || produto === 'Tela Formadora') && papel === 'Tissue' ? ['Dupla e meia','Tripla'] : produto === 'Formadora' && papel === 'Marrom' ? ['Tripla','Dupla','Dupla e meia','Mono'] : []
const precisaPosicao = produto => ['Tela Tecida','Secadora Espiral','Feltro','Feltro com emenda'].includes(produto)
const MAX_POR_PRODUTO = 3
let sequencia = 0
const novoUid = () => crypto.randomUUID?.() || `item-${Date.now().toString(36)}-${(sequencia++).toString(36)}`
// Só os campos que o servidor espera de cada produto.
const paraEnvio = i => ({ produto:i.produto, ...Object.fromEntries(Object.keys(itemVazio).map(k => [k, i[k]])) })
const dig = value => String(value).replace(/\D/g,'')
const telMask = value => { const d = dig(value).slice(0,11); if(d.length<=2)return d?`(${d}`:''; if(d.length<=6)return `(${d.slice(0,2)}) ${d.slice(2)}`; return `(${d.slice(0,2)}) ${d.slice(2,d.length===11?7:6)}-${d.slice(d.length===11?7:6)}` }
const decimal3 = value => { const d = dig(value).slice(0,12); if(!d)return ''; const n = d.padStart(4,'0'); return `${n.slice(0,-3).replace(/^0+(?=\d)/,'')},${n.slice(-3)}` }
const inteiro = value => dig(value).slice(0,9)
// Fixo: DDD + 8 dígitos. Celular: DDD + 9 dígitos começando com 9.
const telefoneOk = value => { const d = dig(value); return /^[1-9][1-9]/.test(d) && (d.length===10 || (d.length===11 && d[2]==='9')) }
const emailOk = value => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
const obrigatorios = ['empresa','contato','telefone','responsavel']
const semMedida = i => !i.comprimento || !i.largura
// Número do produto dentro da máquina (Feltro 1, Feltro 2…), pela ordem na lista — o servidor numera igual.
const numerar = itens => { const c = {}; return itens.map(i => ({ ...i, n: (c[i.produto] = (c[i.produto] || 0) + 1) })) }
const nomeItem = i => `${i.produto} ${i.n}`
const resumoItem = i => [i.modelo, i.posicao, i.comprimento && i.largura ? `${i.comprimento} × ${i.largura}` : ''].filter(Boolean).join(' · ')

// Rascunho no aparelho: se o tablet recarregar no meio do cadastro, nada se perde até salvar.
const CHAVE_RASCUNHO = 'cadastroProdutosFeira:rascunho'
const lerRascunho = () => { try { const r = JSON.parse(localStorage.getItem(CHAVE_RASCUNHO) || 'null'); if(r?.f && Array.isArray(r.itens)) return { f:{...vazio,...r.f}, itens:r.itens.map(i=>({...itemVazio,...i})) } } catch { /* sem rascunho */ } return null }
const gravarRascunho = r => { try { localStorage.setItem(CHAVE_RASCUNHO, JSON.stringify(r)) } catch { /* armazenamento indisponível */ } }

const problemas = f => {
  const e = {}
  if(f.empresa.trim().length<2)e.empresa='Informe a empresa.'
  if(f.contato.trim().length<2)e.contato='Informe o nome do contato.'
  if(!dig(f.telefone))e.telefone='Informe o telefone.'
  else if(!telefoneOk(f.telefone))e.telefone='Telefone inválido. Use DDD + fixo (8 dígitos) ou celular (9 dígitos).'
  if(f.email.trim()&&!emailOk(f.email))e.email='E-mail inválido. Confira o @ e o domínio (ex.: nome@empresa.com.br).'
  if(f.responsavel.trim().length<2)e.responsavel='Informe quem fez o cadastro.'
  return e
}

export default function CadastroProdutos({ voltarMenu }) {
  const [inicial] = React.useState(lerRascunho)
  const [f, setF] = React.useState(inicial?.f || vazio), [itensBrutos, setItens] = React.useState(inicial?.itens || []), [aberto, setAberto] = React.useState(null)
  const [erro, setErro] = React.useState(''), [salvando, setSalvando] = React.useState(false)
  const [erros, setErros] = React.useState({}), [salvos, setSalvos] = React.useState(0), [semMedidas, setSemMedidas] = React.useState(null)
  const [avisoFila, setAvisoFila] = React.useState(false)
  const [aviso, setAviso] = React.useState(inicial?.itens?.length ? 'Cadastro em andamento recuperado neste aparelho. Confira e salve quando terminar.' : '')
  const refs = React.useRef({})
  const itens = numerar(itensBrutos)
  React.useEffect(() => { gravarRascunho({ f, itens: itensBrutos }) }, [f, itensBrutos])

  const set = (k,v) => { setF(a => ({...a,[k]:v})); setErro(''); setSemMedidas(null); setErros(x => { if(!x[k])return x; const n={...x}; delete n[k]; return n }) }
  const setItem = (uid,k,v) => { setItens(l => l.map(i => i.uid===uid ? {...i,[k]:v} : i)); setErro(''); setSemMedidas(null) }
  const focarItem = uid => setTimeout(() => document.getElementById(`item-${uid}`)?.scrollIntoView({behavior:'smooth',block:'start'}))
  const alterarPapel = v => {
    const novo = f.papel===v ? '' : v
    if(itensBrutos.length && !window.confirm(`Trocar o tipo de papel remove ${itensBrutos.length===1?'o produto já informado':`os ${itensBrutos.length} produtos já informados`} desta máquina. Continuar?`)) return
    setF(a => ({...a,papel:novo})); setItens([]); setAberto(null); setErro(''); setSemMedidas(null)
  }
  // Clicar num produto começa um novo cartão dele (não substitui o anterior), até 3 por produto.
  const adicionarProduto = produto => {
    const uid = novoUid()
    setItens(l => [...l, { uid, produto, ...itemVazio }]); setAberto(uid); setErro(''); setSemMedidas(null); focarItem(uid)
  }
  const removerItem = i => {
    const preenchido = Object.keys(itemVazio).some(k => i[k])
    if(preenchido && !window.confirm(`Remover ${nomeItem(i)}? Os dados informados nele serão descartados.`)) return
    setItens(l => l.filter(x => x.uid!==i.uid)); if(aberto===i.uid)setAberto(null); setSemMedidas(null)
  }
  const etapas = [
    { titulo:'Contato', ok: !Object.keys(problemas(f)).length },
    { titulo:'Máquina e produtos', ok: Boolean(f.maquina.trim() && itens.length && !itens.some(semMedida)) },
    { titulo:'Condições de operação', ok: Boolean(f.velocidade_maquina.trim() || itens.some(i => i.durabilidade.trim())) },
  ]
  // Limpar fica na tela; Cancelar limpa e volta ao menu. Os dois descartam também o rascunho do aparelho.
  const limparTudo = acao => {
    if(itensBrutos.length && !window.confirm(`${acao} descarta os produtos ainda não salvos. Continuar?`)) return false
    setF(vazio); setItens([]); setAberto(null); setErro(''); setErros({}); setAviso(''); setSemMedidas(null)
    gravarRascunho({ f:vazio, itens:[] })
    return true
  }
  const focar = k => setTimeout(() => { refs.current[k]?.focus(); refs.current[k]?.scrollIntoView({behavior:'smooth',block:'center'}) })

  async function salvar(nova, confirmado=false) {
    setAviso('')
    const e = problemas(f); setErros(e)
    const primeiro = [...obrigatorios,'email'].find(k => e[k])
    if(primeiro){ setErro('Corrija os campos destacados.'); setSemMedidas(null); focar(primeiro); return }
    if(!confirmado && (!itens.length || itens.some(semMedida))){ setErro(''); setSemMedidas({nova}); return }
    setSemMedidas(null); setSalvando(true); setErro('')
    // Sem produto, as condições de operação ficam ocultas: não envia valores antigos escondidos.
    const body = { ...f, ...(itens.length ? {} : { velocidade_maquina:'', informacoes_adicionais:'' }), itens: itens.map(paraEnvio), envio_id: novoEnvioId() }
    const r = await enviarCadastro(body)
    setSalvando(false)
    if(r.mensagem){ setErro(r.mensagem); return }
    // Sem internet (ou servidor fora): guarda na fila do aparelho e segue o atendimento normalmente.
    const naFila = Boolean(r.temporario)
    if(naFila) enfileirar(body)
    setAvisoFila(naFila)
    const contato = { empresa:f.empresa, contato:f.contato, telefone:f.telefone, email:f.email, responsavel:f.responsavel }
    setItens([]); setAberto(null)
    if(nova){
      setF({...vazio,...contato}); setErros({}); setSalvos(n=>n+1)
      const qtd = itens.length ? ` com ${itens.length} ${itens.length===1?'produto':'produtos'}` : ''
      const maquina = f.maquina.trim()
      const quem = maquina ? `A máquina "${maquina}"` : 'O cadastro', g = maquina ? 'a' : 'o'
      setAviso(naFila
        ? `Sem internet agora. ${quem}${qtd} ficou guardad${g} neste aparelho e será enviad${g} automaticamente quando a conexão voltar. Os dados do contato foram mantidos para a próxima.`
        : `${quem}${qtd} foi salv${g}. Os dados do contato foram mantidos para a próxima.`); window.scrollTo(0,0)
    } else { setF(vazio); gravarRascunho({ f:vazio, itens:[] }); voltarMenu() }
  }

  const campo=(k,label,props={})=>{const{onChange,dica,className='',obrigatorio,...rest}=props;return <label className={`campo ${className}`}><span>{label}{obrigatorio&&<i className="obrig" aria-hidden="true">*</i>}{dica&&<em>{dica}</em>}</span><input ref={el=>{if(el)refs.current[k]=el}} className={erros[k]?'invalido':''} aria-invalid={!!erros[k]} value={f[k]} onChange={onChange||((e)=>set(k,e.target.value))} onBlur={k==='email'||k==='telefone'?()=>{ const p=problemas(f)[k]; if(p&&f[k].trim())setErros(x=>({...x,[k]:p})) }:undefined} {...rest}/>{erros[k]&&<small className="campo-erro">{erros[k]}</small>}</label>}
  const campoItem=(i,k,label,props={})=>{const{mascara,...rest}=props;return <label className="campo"><span>{label}</span><input value={i[k]} onChange={e=>setItem(i.uid,k,mascara?mascara(e.target.value):e.target.value)} {...rest}/></label>}
  const opcoes=(nome,valor,lista,escolher)=><div className="opcoes" role="radiogroup" aria-label={nome}>{lista.map(x=><button type="button" key={x} role="radio" aria-checked={valor===x} className={valor===x?'ativo':''} onClick={()=>escolher(x)}>{x}</button>)}</div>
  const hoje = new Intl.DateTimeFormat('pt-BR').format(new Date())
  const contagem = p => itens.filter(i => i.produto===p).length
  const faltando = itens.filter(semMedida)

  const cartao = i => {
    const opModelo = modelos(f.papel,i.produto), estaAberto = aberto===i.uid
    return <div key={i.uid} id={`item-${i.uid}`} className={`item-produto ${estaAberto?'aberto':''}`}>
      <div className="item-topo">
        <button type="button" className="item-titulo" aria-expanded={estaAberto} onClick={()=>setAberto(estaAberto?null:i.uid)}>
          <b>{nomeItem(i)}</b>
          {!estaAberto&&<span>{resumoItem(i)||'sem detalhes'}</span>}
          {!estaAberto&&semMedida(i)&&<em className="item-alerta">sem medidas</em>}
        </button>
        <button type="button" className="botao-link" onClick={()=>setAberto(estaAberto?null:i.uid)}>{estaAberto?'Concluir':'Editar'}</button>
        <button type="button" className="botao-link item-remover" onClick={()=>removerItem(i)}>Remover</button>
      </div>
      {estaAberto&&<div className="item-corpo">
        {(opModelo.length>0||precisaPosicao(i.produto))&&<div className="grid">
          {opModelo.length>0&&<div className="campo largo"><span>Modelo</span>{opcoes('Modelo',i.modelo,opModelo,v=>setItem(i.uid,'modelo',i.modelo===v?'':v))}</div>}
          {precisaPosicao(i.produto)&&campoItem(i,'posicao','Posição',{placeholder:'Ex.: 1ª prensa, pick-up'})}
        </div>}
        <div className="grid medidas">
          {campoItem(i,'comprimento','Comprimento',{inputMode:'decimal',placeholder:'0,000',mascara:decimal3})}
          {campoItem(i,'largura','Largura',{inputMode:'decimal',placeholder:'0,000',mascara:decimal3})}
          {campoItem(i,'espessura','Espessura',{inputMode:'decimal',placeholder:'0,000',mascara:decimal3})}
          {campoItem(i,'cfm','CFM',{inputMode:'numeric',mascara:inteiro})}
          {campoItem(i,'gramatura','Gramatura',{inputMode:'numeric',mascara:inteiro})}
          {i.produto==='Secadora Espiral'&&<label className="check-simples"><input type="checkbox" checked={i.teflonada} onChange={e=>setItem(i.uid,'teflonada',e.target.checked)}/> Teflonada</label>}
        </div>
        <div className="grid">{campoItem(i,'durabilidade','Durabilidade do produto')}</div>
      </div>}
    </div>
  }

  return <div className="cadastro-produtos">
    <header><img className="marca-30-cabecalho" src="/phenix-30-anos-transparente.png" alt="Phenix 30 anos"/><span>CADASTRO DE PRODUTOS</span></header>
    <main className="cadastro-layout">
      <aside className="cadastro-hero">
        <p className="eyebrow">ATENDIMENTO DE FEIRA</p>
        <h1>Registre a necessidade de cada máquina.</h1>
        <p className="hero-texto">Preencha o contato e a máquina e adicione quantos produtos ela usar — até 3 de cada. Tudo é gravado junto ao salvar. Depois, dá para cadastrar outra máquina do mesmo cliente sem redigitar o contato.</p>
        <ol className="etapas">{etapas.map((e,i)=><li key={e.titulo} className={e.ok?'ok':''}><b>{e.ok?'✓':i+1}</b>{e.titulo}</li>)}</ol>
        <div className="hero-rodape"><img src="/phenix-30-anos-branco-transparente.png" alt="Phenix - Tecendo Facilidades"/><p>Cadastro em <strong>{hoje}</strong>{salvos>0&&<> · {salvos} {salvos===1?'máquina salva':'máquinas salvas'} nesta sessão</>}</p></div>
      </aside>

      <form className="cadastro-card" onSubmit={e=>{e.preventDefault();salvar(false)}} noValidate>
        <div className="cadastro-titulo"><h2>Cadastro de Produtos</h2><p>Campos com <i className="obrig">*</i> são obrigatórios. Os demais podem ficar em branco.</p></div>
        {aviso&&<p className={avisoFila?'aviso-fila':'aviso-ok'} role="status">{aviso}</p>}

        <section className="bloco">
          <h3><b>1</b>Contato e responsável</h3>
          <div className="grid">
            {campo('empresa','Empresa',{className:'largo',obrigatorio:true})}
            {campo('contato','Contato',{obrigatorio:true})}
            {campo('telefone','Telefone',{obrigatorio:true,dica:'fixo ou celular',inputMode:'tel',placeholder:'(00) 0000-0000',onChange:e=>set('telefone',telMask(e.target.value))})}
            {campo('email','E-mail',{type:'email',inputMode:'email',placeholder:'nome@empresa.com.br'})}
            {campo('responsavel','Quem fez o cadastro',{obrigatorio:true})}
          </div>
        </section>

        <section className="bloco">
          <h3><b>2</b>Máquina e produtos</h3>
          <div className="grid">{campo('maquina','Máquina',{className:'largo',placeholder:'Ex.: MP 3 — Linha de tissue'})}</div>
          <div className="campo" id="tipo-papel"><span>Tipo de papel</span>{opcoes('Tipo de papel',f.papel,Object.keys(produtos),alterarPapel)}</div>
          {f.papel&&<div className="campo"><span>Adicionar produto <em>toque para incluir; até {MAX_POR_PRODUTO} de cada</em></span>
            <div className="opcoes">{produtos[f.papel].map(p=>{const n=contagem(p);return <button type="button" key={p} className={n?'ativo':''} disabled={n>=MAX_POR_PRODUTO} title={n>=MAX_POR_PRODUTO?`Máximo de ${MAX_POR_PRODUTO} por máquina`:undefined} onClick={()=>adicionarProduto(p)}>+ {p}{n>0&&<i className="contador">{n}</i>}</button>})}</div>
          </div>}
          {!f.papel&&<p className="dica-bloco">Escolha o tipo de papel para adicionar os produtos desta máquina.</p>}
          {itens.length>0&&<div className="lista-itens">{itens.map(cartao)}</div>}
        </section>

        {itens.length>0&&<section className="bloco">
          <h3><b>3</b>Condições de operação</h3>
          <div className="grid">{campo('velocidade_maquina','Velocidade da máquina')}</div>
          <label className="campo"><span>Informações adicionais</span><textarea value={f.informacoes_adicionais} maxLength="5000" onChange={e=>set('informacoes_adicionais',e.target.value)} rows="4" placeholder="Observações do cliente, problemas atuais, prazos…"/><small>{f.informacoes_adicionais.length}/5000</small></label>
        </section>}

        {semMedidas&&<div className="aviso-medidas" role="alertdialog" aria-live="assertive">
          <p><strong>Atenção:</strong> {!itens.length?'nenhum produto foi informado para esta máquina':faltando.length===1?`${nomeItem(faltando[0])} está sem comprimento ou largura`:`${faltando.map(nomeItem).join(', ')} estão sem comprimento ou largura`}. Deseja salvar mesmo assim?</p>
          <div><button type="button" className="botao-principal" disabled={salvando} onClick={()=>salvar(semMedidas.nova,true)}>{salvando?'Salvando…':'Salvar mesmo assim'}</button><button type="button" className="botao-secundario" onClick={()=>{setSemMedidas(null);if(faltando.length){setAberto(faltando[0].uid);focarItem(faltando[0].uid)}else document.getElementById('tipo-papel')?.scrollIntoView({behavior:'smooth',block:'center'})}}>{itens.length?'Informar medidas':'Escolher produto'}</button></div>
        </div>}
        {erro&&<p className="erro" role="alert">{erro}</p>}
        {itens.length>0&&<p className="resumo-salvar">Ao salvar, {itens.length===1?'será gravado 1 produto':`serão gravados ${itens.length} produtos`}: {itens.map(nomeItem).join(', ')}.</p>}
        <div className="acoes-cadastro">
          <button type="button" className="botao-principal" disabled={salvando} onClick={()=>salvar(true)}>{salvando?'Salvando…':'Salvar e cadastrar outra máquina'}</button>
          <button type="submit" className="botao-secundario" disabled={salvando}>Salvar e voltar ao menu</button>
          <div className="acoes-leves">
            <button type="button" className="botao-link" onClick={()=>{if(limparTudo('Limpar o formulário'))window.scrollTo(0,0)}}>Limpar formulário</button>
            <button type="button" className="botao-link" onClick={()=>{if(limparTudo('Cancelar'))voltarMenu()}}>Cancelar</button>
          </div>
        </div>
      </form>
    </main>
    <footer>Phenix • Tecendo Facilidades</footer>
  </div>
}
