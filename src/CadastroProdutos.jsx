import React from 'react'
import { createClient } from '@supabase/supabase-js'
import './cadastro-produtos-feira.css'

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL || 'https://invalid.supabase.co', import.meta.env.VITE_SUPABASE_ANON_KEY || 'invalid')
const vazio = { empresa:'', contato:'', telefone:'', email:'', responsavel:'', maquina:'', papel:'', produto:'', modelo:'', posicao:'', comprimento:'', largura:'', cfm:'', gramatura:'', espessura:'', teflonada:false, durabilidade:'', velocidade_maquina:'', informacoes_adicionais:'' }
const produtos = { Tissue:['Tela Formadora','Feltro','Tela DNT','Tela Acabadora'], Marrom:['Tela Tecida','Formadora','Feltro','Feltro com emenda','Camisa','Engrossador','Secadora Espiral'] }
const modelos = (papel, produto) => produto === 'Camisa' ? ['Malha 4','Malha 16','Malha 18','Malha 21'] : (produto === 'Formadora' || produto === 'Tela Formadora') && papel === 'Tissue' ? ['Dupla e meia','Tripla'] : produto === 'Formadora' && papel === 'Marrom' ? ['Tripla','Dupla','Dupla e meia','Mono'] : []
const precisaPosicao = produto => ['Tela Tecida','Secadora Espiral','Feltro','Feltro com emenda'].includes(produto)
const dig = value => String(value).replace(/\D/g,'')
const telMask = value => { const d = dig(value).slice(0,11); if(d.length<=2)return d?`(${d}`:''; if(d.length<=6)return `(${d.slice(0,2)}) ${d.slice(2)}`; return `(${d.slice(0,2)}) ${d.slice(2,d.length===11?7:6)}-${d.slice(d.length===11?7:6)}` }
const decimal3 = value => { const d = dig(value).slice(0,12); if(!d)return ''; const n = d.padStart(4,'0'); return `${n.slice(0,-3).replace(/^0+(?=\d)/,'')},${n.slice(-3)}` }
const inteiro = value => dig(value).slice(0,9)
// Fixo: DDD + 8 dígitos. Celular: DDD + 9 dígitos começando com 9.
const telefoneOk = value => { const d = dig(value); return /^[1-9][1-9]/.test(d) && (d.length===10 || (d.length===11 && d[2]==='9')) }
const emailOk = value => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
const obrigatorios = ['empresa','contato','telefone','responsavel']

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
  const [f, setF] = React.useState(vazio), [erro, setErro] = React.useState(''), [salvando, setSalvando] = React.useState(false)
  const [erros, setErros] = React.useState({}), [salvos, setSalvos] = React.useState(0), [aviso, setAviso] = React.useState(''), [semMedidas, setSemMedidas] = React.useState(null)
  const refs = React.useRef({})
  const set = (k,v) => { setF(a => ({...a,[k]:v})); setErro(''); setSemMedidas(null); setErros(x => { if(!x[k])return x; const n={...x}; delete n[k]; return n }) }
  const alterarPapel = v => { setF(a => ({...a,papel:a.papel===v?'':v,produto:'',modelo:'',posicao:'',teflonada:false})); setErro('') }
  const alterarProduto = v => { setF(a => ({...a,produto:a.produto===v?'':v,modelo:'',posicao:a.produto===v||!precisaPosicao(v)?'':a.posicao,teflonada:false})); setErro('') }
  const opModelo = modelos(f.papel,f.produto)
  const etapas = [
    { titulo:'Contato', ok: !Object.keys(problemas(f)).length },
    { titulo:'Máquina e produto', ok: Boolean(f.maquina.trim() && f.produto && f.comprimento && f.largura) },
    { titulo:'Condições de operação', ok: Boolean(f.durabilidade.trim() || f.velocidade_maquina.trim()) },
  ]
  const focar = k => setTimeout(() => { refs.current[k]?.focus(); refs.current[k]?.scrollIntoView({behavior:'smooth',block:'center'}) })

  async function salvar(nova, confirmado=false) {
    setAviso('')
    const e = problemas(f); setErros(e)
    const primeiro = [...obrigatorios,'email'].find(k => e[k])
    if(primeiro){ setErro('Corrija os campos destacados.'); setSemMedidas(null); focar(primeiro); return }
    if(!confirmado && (!f.comprimento || !f.largura)){ setErro(''); setSemMedidas({nova}); return }
    setSemMedidas(null); setSalvando(true); setErro('')
    // Medidas e condições só existem na tela com produto escolhido; sem produto, não envia valores ocultos.
    const body=f.produto?f:{...f,comprimento:'',largura:'',espessura:'',cfm:'',gramatura:'',teflonada:false,durabilidade:'',velocidade_maquina:'',informacoes_adicionais:''}
    const {data,error}=await supabase.functions.invoke('cadastrar-produto-feira',{body})
    setSalvando(false)
    if(error){ let msg='Não foi possível gravar agora. Confira a conexão e tente novamente.'; try{ const corpo=await error.context?.json?.(); if(corpo?.mensagem)msg=corpo.mensagem }catch{/* sem JSON */} setErro(data?.mensagem||msg); return }
    if(nova){ setF(a=>({...vazio,empresa:a.empresa,contato:a.contato,telefone:a.telefone,email:a.email,responsavel:a.responsavel})); setErros({}); setSalvos(n=>n+1); setAviso(f.maquina.trim()?`Máquina "${f.maquina.trim()}" salva. Os dados do contato foram mantidos para a próxima.`:'Cadastro salvo. Os dados do contato foram mantidos para a próxima.'); window.scrollTo(0,0) } else voltarMenu()
  }

  const campo=(k,label,props={})=>{const{onChange,dica,className='',obrigatorio,...rest}=props;return <label className={`campo ${className}`}><span>{label}{obrigatorio&&<i className="obrig" aria-hidden="true">*</i>}{dica&&<em>{dica}</em>}</span><input ref={el=>{if(el)refs.current[k]=el}} className={erros[k]?'invalido':''} aria-invalid={!!erros[k]} value={f[k]} onChange={onChange||((e)=>set(k,e.target.value))} onBlur={k==='email'||k==='telefone'?()=>{ const p=problemas(f)[k]; if(p&&f[k].trim())setErros(x=>({...x,[k]:p})) }:undefined} {...rest}/>{erros[k]&&<small className="campo-erro">{erros[k]}</small>}</label>}
  const opcoes=(nome,valor,lista,escolher)=><div className="opcoes" role="radiogroup" aria-label={nome}>{lista.map(x=><button type="button" key={x} role="radio" aria-checked={valor===x} className={valor===x?'ativo':''} onClick={()=>escolher(x)}>{x}</button>)}</div>
  const hoje = new Intl.DateTimeFormat('pt-BR').format(new Date())
  const faltaMedida = [!f.comprimento&&'comprimento',!f.largura&&'largura'].filter(Boolean)

  return <div className="cadastro-produtos">
    <header><img className="marca-30-cabecalho" src="/phenix-30-anos-transparente.png" alt="Phenix 30 anos"/><span>CADASTRO DE PRODUTOS</span></header>
    <main className="cadastro-layout">
      <aside className="cadastro-hero">
        <p className="eyebrow">ATENDIMENTO DE FEIRA</p>
        <h1>Registre a necessidade de cada máquina.</h1>
        <p className="hero-texto">Preencha contato, máquina e condições de operação. Depois de salvar, é possível cadastrar outra máquina para o mesmo cliente sem redigitar o contato.</p>
        <ol className="etapas">{etapas.map((e,i)=><li key={e.titulo} className={e.ok?'ok':''}><b>{e.ok?'✓':i+1}</b>{e.titulo}</li>)}</ol>
        <div className="hero-rodape"><img src="/phenix-30-anos-branco-transparente.png" alt="Phenix - Tecendo Facilidades"/><p>Cadastro em <strong>{hoje}</strong>{salvos>0&&<> · {salvos} {salvos===1?'máquina salva':'máquinas salvas'} nesta sessão</>}</p></div>
      </aside>

      <form className="cadastro-card" onSubmit={e=>{e.preventDefault();salvar(false)}} noValidate>
        <div className="cadastro-titulo"><h2>Cadastro de Produtos</h2><p>Campos com <i className="obrig">*</i> são obrigatórios. Os demais podem ficar em branco.</p></div>
        {aviso&&<p className="aviso-ok" role="status">{aviso}</p>}

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
          <h3><b>2</b>Máquina e produto</h3>
          <div className="grid">{campo('maquina','Máquina',{className:'largo',placeholder:'Ex.: MP 3 — Linha de tissue'})}</div>
          <div className="campo" id="tipo-papel"><span>Tipo de papel</span>{opcoes('Tipo de papel',f.papel,Object.keys(produtos),alterarPapel)}</div>
          {f.papel&&<div className="campo"><span>Produto</span>{opcoes('Produto',f.produto,produtos[f.papel],alterarProduto)}</div>}
          {(opModelo.length>0||precisaPosicao(f.produto))&&<div className="grid">
            {opModelo.length>0&&<div className="campo largo"><span>Modelo</span>{opcoes('Modelo',f.modelo,opModelo,v=>set('modelo',f.modelo===v?'':v))}</div>}
            {precisaPosicao(f.produto)&&campo('posicao','Posição',{placeholder:'Ex.: 1ª prensa, pick-up'})}
          </div>}
          {!f.produto&&<p className="dica-bloco">Escolha o tipo de papel e o produto para informar medidas e condições de operação.</p>}
          {f.produto&&<div className="grid medidas">
            {campo('comprimento','Comprimento',{inputMode:'decimal',placeholder:'0,000',onChange:e=>set('comprimento',decimal3(e.target.value))})}
            {campo('largura','Largura',{inputMode:'decimal',placeholder:'0,000',onChange:e=>set('largura',decimal3(e.target.value))})}
            {campo('espessura','Espessura',{inputMode:'decimal',placeholder:'0,000',onChange:e=>set('espessura',decimal3(e.target.value))})}
            {campo('cfm','CFM',{inputMode:'numeric',onChange:e=>set('cfm',inteiro(e.target.value))})}
            {campo('gramatura','Gramatura',{inputMode:'numeric',onChange:e=>set('gramatura',inteiro(e.target.value))})}
            {f.produto==='Secadora Espiral'&&<label className="check-simples"><input type="checkbox" checked={f.teflonada} onChange={e=>set('teflonada',e.target.checked)}/> Teflonada</label>}
          </div>}
        </section>

        {f.produto&&<section className="bloco">
          <h3><b>3</b>Condições de operação</h3>
          <div className="grid">
            {campo('durabilidade','Durabilidade do produto')}
            {campo('velocidade_maquina','Velocidade da máquina')}
          </div>
          <label className="campo"><span>Informações adicionais</span><textarea value={f.informacoes_adicionais} maxLength="5000" onChange={e=>set('informacoes_adicionais',e.target.value)} rows="4" placeholder="Observações do cliente, problemas atuais, prazos…"/><small>{f.informacoes_adicionais.length}/5000</small></label>
        </section>}

        {semMedidas&&<div className="aviso-medidas" role="alertdialog" aria-live="assertive">
          <p><strong>Atenção:</strong> {!f.produto?'produto, comprimento e largura não foram informados':faltaMedida.length===2?'comprimento e largura não foram informados':`${faltaMedida[0]} não foi informad${faltaMedida[0]==='largura'?'a':'o'}`}. Deseja salvar mesmo assim?</p>
          <div><button type="button" className="botao-principal" disabled={salvando} onClick={()=>salvar(semMedidas.nova,true)}>{salvando?'Salvando…':'Salvar mesmo assim'}</button><button type="button" className="botao-secundario" onClick={()=>{setSemMedidas(null);if(f.produto)focar(f.comprimento?'largura':'comprimento');else document.getElementById('tipo-papel')?.scrollIntoView({behavior:'smooth',block:'center'})}}>{f.produto?'Informar medidas':'Escolher produto'}</button></div>
        </div>}
        {erro&&<p className="erro" role="alert">{erro}</p>}
        <div className="acoes-cadastro">
          <button type="button" className="botao-principal" disabled={salvando} onClick={()=>salvar(true)}>{salvando?'Salvando…':'Salvar e cadastrar outra máquina'}</button>
          <button type="submit" className="botao-secundario" disabled={salvando}>Salvar e voltar ao menu</button>
          <div className="acoes-leves">
            <button type="button" className="botao-link" onClick={()=>{setF(vazio);setErro('');setErros({});setAviso('');setSemMedidas(null);window.scrollTo(0,0)}}>Limpar formulário</button>
            <button type="button" className="botao-link" onClick={voltarMenu}>Cancelar</button>
          </div>
        </div>
      </form>
    </main>
    <footer>Phenix • Tecendo Facilidades</footer>
  </div>
}
