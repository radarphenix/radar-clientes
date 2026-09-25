import React from 'react'
import { createClient } from '@supabase/supabase-js'
import './cadastro-produtos-feira.css'

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL || 'https://invalid.supabase.co', import.meta.env.VITE_SUPABASE_ANON_KEY || 'invalid')
const vazio = { empresa:'', contato:'', telefone:'', email:'', responsavel:'', maquina:'', papel:'', produto:'', modelo:'', posicao:'', comprimento:'', largura:'', cfm:'', gramatura:'', espessura:'', teflonada:false, durabilidade:'', velocidade_maquina:'', informacoes_adicionais:'' }
const produtos = { Tissue:['Tela Formadora','Feltro','Tela DNT','Tela Acabadora'], Marrom:['Tela Tecida','Formadora','Feltro','Feltro com emenda','Camisa','Engrossador','Secadora Espiral'] }
const modelos = (papel, produto) => produto === 'Camisa' ? ['Malha 4','Malha 16','Malha 18','Malha 21'] : (produto === 'Formadora' || produto === 'Tela Formadora') && papel === 'Tissue' ? ['Dupla e meia','Tripla'] : produto === 'Formadora' && papel === 'Marrom' ? ['Tripla','Dupla','Dupla e meia','Mono'] : []
const precisaPosicao = produto => ['Tela Tecida','Secadora Espiral','Feltro','Feltro com emenda'].includes(produto)
const telMask = value => { const d = String(value).replace(/\D/g,'').slice(0,11); if(d.length<=2)return d?`(${d}`:''; if(d.length<=6)return `(${d.slice(0,2)}) ${d.slice(2)}`; return `(${d.slice(0,2)}) ${d.slice(2,d.length===11?7:6)}-${d.slice(d.length===11?7:6)}` }
const decimal3 = value => { const d = String(value).replace(/\D/g,'').slice(0,12); if(!d)return ''; const n = d.padStart(4,'0'); return `${n.slice(0,-3).replace(/^0+(?=\d)/,'')},${n.slice(-3)}` }
const inteiro = value => String(value).replace(/\D/g,'').slice(0,9)
const contatoCampos = ['empresa','contato','telefone','email','responsavel']
const medidaCampos = ['comprimento','largura','cfm','gramatura','espessura']

export default function CadastroProdutos({ voltarMenu }) {
  const [f, setF] = React.useState(vazio), [erro, setErro] = React.useState(''), [salvando, setSalvando] = React.useState(false)
  const [tentou, setTentou] = React.useState(false), [salvos, setSalvos] = React.useState(0), [aviso, setAviso] = React.useState('')
  const set = (k,v) => { setF(a => ({...a,[k]:v})); setErro('') }
  const limparProduto = extras => setF(a => ({...a,...extras,produto:'',modelo:'',posicao:'',comprimento:'',largura:'',cfm:'',gramatura:'',espessura:'',teflonada:false}))
  const alterarPapel = v => { limparProduto({papel:v}); setErro('') }
  const alterarProduto = v => { setF(a => ({...a,produto:v,modelo:'',posicao:'',comprimento:'',largura:'',cfm:'',gramatura:'',espessura:'',teflonada:false})); setErro('') }
  const opModelo = modelos(f.papel,f.produto)
  const detalhes = Boolean(f.papel && f.produto && (!opModelo.length || f.modelo) && (!precisaPosicao(f.produto) || f.posicao.trim()))
  const validar = () => {
    if(!f.empresa.trim()||!f.contato.trim()||!f.telefone.trim()||!f.email.trim()||!f.responsavel.trim())return 'Preencha os dados do contato e do responsável.'
    if(!f.maquina.trim())return 'Informe a máquina.'
    if(!detalhes)return 'Complete as opções de papel, produto, modelo ou posição quando solicitados.'
    if(!f.comprimento||!f.largura||!f.cfm||!f.gramatura||!f.espessura)return 'Preencha comprimento, largura, CFM, gramatura e espessura.'
    if(!f.durabilidade.trim()||!f.velocidade_maquina.trim())return 'Preencha durabilidade e velocidade da máquina.'
    return ''
  }
  const etapas = [
    { titulo:'Contato', ok: contatoCampos.every(k => f[k].trim()) },
    { titulo:'Máquina e produto', ok: Boolean(f.maquina.trim()) && detalhes && medidaCampos.every(k => f[k]) },
    { titulo:'Condições de operação', ok: Boolean(f.durabilidade.trim() && f.velocidade_maquina.trim()) },
  ]
  async function salvar(nova) {
    setTentou(true); setAviso('')
    const pendente=validar(); if(pendente){setErro(pendente);setTimeout(()=>document.querySelector('.cadastro-produtos .invalido')?.scrollIntoView({behavior:'smooth',block:'center'}));return}
    setSalvando(true); setErro('')
    const {error}=await supabase.functions.invoke('cadastrar-produto-feira',{body:f})
    setSalvando(false)
    if(error){setErro('Não foi possível gravar agora. Confira a conexão e tente novamente.');return}
    if(nova){setF(a=>({...vazio,empresa:a.empresa,contato:a.contato,telefone:a.telefone,email:a.email,responsavel:a.responsavel}));setTentou(false);setSalvos(n=>n+1);setAviso(`Máquina "${f.maquina.trim()}" salva. Os dados do contato foram mantidos para a próxima.`);window.scrollTo(0,0)}else voltarMenu()
  }
  const falta = k => tentou && !String(f[k]).trim()
  const campo=(k,label,props={})=>{const{onChange,dica,className='',...rest}=props;return <label className={`campo ${className}`}><span>{label}{dica&&<em>{dica}</em>}</span><input className={falta(k)?'invalido':''} aria-invalid={falta(k)} value={f[k]} onChange={onChange||((e)=>set(k,e.target.value))} {...rest}/></label>}
  const opcoes=(nome,valor,lista,escolher,invalido)=><div className={`opcoes ${invalido?'invalido':''}`} role="radiogroup" aria-label={nome}>{lista.map(x=><button type="button" key={x} role="radio" aria-checked={valor===x} className={valor===x?'ativo':''} onClick={()=>escolher(x)}>{x}</button>)}</div>
  const hoje = new Intl.DateTimeFormat('pt-BR').format(new Date())

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
        <div className="cadastro-titulo"><h2>Cadastro de Produtos</h2><p>Todos os campos são obrigatórios, exceto informações adicionais.</p></div>
        {aviso&&<p className="aviso-ok" role="status">{aviso}</p>}

        <section className="bloco">
          <h3><b>1</b>Contato e responsável</h3>
          <div className="grid">
            {campo('empresa','Empresa',{className:'largo'})}
            {campo('contato','Contato')}
            {campo('telefone','Telefone',{inputMode:'tel',placeholder:'(00) 00000-0000',onChange:e=>set('telefone',telMask(e.target.value))})}
            {campo('email','E-mail',{type:'email',placeholder:'nome@empresa.com.br'})}
            {campo('responsavel','Quem fez o cadastro')}
          </div>
        </section>

        <section className="bloco">
          <h3><b>2</b>Máquina e produto</h3>
          <div className="grid">{campo('maquina','Máquina',{className:'largo',placeholder:'Ex.: MP 3 — Linha de tissue'})}</div>
          <div className="campo"><span>Tipo de papel</span>{opcoes('Tipo de papel',f.papel,Object.keys(produtos),alterarPapel,tentou&&!f.papel)}</div>
          {f.papel&&<div className="campo"><span>Produto</span>{opcoes('Produto',f.produto,produtos[f.papel],alterarProduto,tentou&&!f.produto)}</div>}
          {(opModelo.length>0||precisaPosicao(f.produto))&&<div className="grid">
            {opModelo.length>0&&<div className="campo largo"><span>Modelo</span>{opcoes('Modelo',f.modelo,opModelo,v=>set('modelo',v),tentou&&!f.modelo)}</div>}
            {precisaPosicao(f.produto)&&campo('posicao','Posição',{placeholder:'Ex.: 1ª prensa, pick-up'})}
          </div>}
          {detalhes?<div className="grid medidas">
            {campo('comprimento','Comprimento',{inputMode:'decimal',placeholder:'0,000',onChange:e=>set('comprimento',decimal3(e.target.value))})}
            {campo('largura','Largura',{inputMode:'decimal',placeholder:'0,000',onChange:e=>set('largura',decimal3(e.target.value))})}
            {campo('espessura','Espessura',{inputMode:'decimal',placeholder:'0,000',onChange:e=>set('espessura',decimal3(e.target.value))})}
            {campo('cfm','CFM',{inputMode:'numeric',onChange:e=>set('cfm',inteiro(e.target.value))})}
            {campo('gramatura','Gramatura',{inputMode:'numeric',onChange:e=>set('gramatura',inteiro(e.target.value))})}
            {f.produto==='Secadora Espiral'&&<label className="check-simples"><input type="checkbox" checked={f.teflonada} onChange={e=>set('teflonada',e.target.checked)}/> Teflonada</label>}
          </div>:<p className="dica-bloco">{!f.papel?'Escolha o tipo de papel para ver os produtos.':!f.produto?'Escolha o produto.':'Complete modelo e posição para liberar as medidas.'}</p>}
        </section>

        <section className={`bloco ${detalhes?'':'bloqueado'}`} aria-disabled={!detalhes}>
          <h3><b>3</b>Condições de operação</h3>
          {detalhes?<>
            <div className="grid">
              {campo('durabilidade','Durabilidade do produto')}
              {campo('velocidade_maquina','Velocidade da máquina')}
            </div>
            <label className="campo"><span>Informações adicionais <em>opcional</em></span><textarea value={f.informacoes_adicionais} maxLength="5000" onChange={e=>set('informacoes_adicionais',e.target.value)} rows="4" placeholder="Observações do cliente, problemas atuais, prazos…"/><small>{f.informacoes_adicionais.length}/5000</small></label>
          </>:<p className="dica-bloco">Disponível depois de escolher o produto.</p>}
        </section>

        {erro&&<p className="erro" role="alert">{erro}</p>}
        <div className="acoes-cadastro">
          <button type="button" className="botao-principal" disabled={salvando} onClick={()=>salvar(true)}>{salvando?'Salvando…':'Salvar e cadastrar outra máquina'}</button>
          <button type="submit" className="botao-secundario" disabled={salvando}>Salvar e voltar ao menu</button>
          <div className="acoes-leves">
            <button type="button" className="botao-link" onClick={()=>{setF(vazio);setErro('');setTentou(false);setAviso('');window.scrollTo(0,0)}}>Limpar formulário</button>
            <button type="button" className="botao-link" onClick={voltarMenu}>Cancelar</button>
          </div>
        </div>
      </form>
    </main>
    <footer>Phenix • Tecendo Facilidades</footer>
  </div>
}
