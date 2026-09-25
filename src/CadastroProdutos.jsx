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

export default function CadastroProdutos({ voltarMenu }) {
  const [f, setF] = React.useState(vazio), [erro, setErro] = React.useState(''), [salvando, setSalvando] = React.useState(false)
  const set = (k,v) => { setF(a => ({...a,[k]:v})); setErro('') }
  const limparProduto = extras => setF(a => ({...a,...extras,produto:'',modelo:'',posicao:'',comprimento:'',largura:'',cfm:'',gramatura:'',espessura:'',teflonada:false}))
  const alterarPapel = v => limparProduto({papel:v})
  const alterarProduto = v => setF(a => ({...a,produto:v,modelo:'',posicao:'',comprimento:'',largura:'',cfm:'',gramatura:'',espessura:'',teflonada:false}))
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
  async function salvar(nova) {
    const aviso=validar(); if(aviso){setErro(aviso);return}
    setSalvando(true); setErro('')
    const {error}=await supabase.functions.invoke('cadastrar-produto-feira',{body:f})
    setSalvando(false)
    if(error){setErro('Não foi possível gravar agora. Confira a conexão e tente novamente.');return}
    if(nova){setF(a=>({...vazio,empresa:a.empresa,contato:a.contato,telefone:a.telefone,email:a.email,responsavel:a.responsavel}));window.scrollTo(0,0)}else voltarMenu()
  }
  const campo=(k,label,props={})=>{const{onChange,...rest}=props;return <label>{label}<input value={f[k]} onChange={onChange||((e)=>set(k,e.target.value))} {...rest}/></label>}
  return <><header><img className="marca-30-cabecalho" src="/phenix-30-anos-transparente.png" alt="Phenix 30 anos"/><span>CADASTRO DE PRODUTOS</span></header><main className="cadastro-area"><form className="cadastro-card" onSubmit={e=>{e.preventDefault();salvar(false)}} noValidate><div className="cadastro-titulo"><div><p className="eyebrow">ATENDIMENTO DE FEIRA</p><h1>Cadastro de Produtos</h1><p>Registre as necessidades da máquina com dados completos.</p></div><p className="data-cadastro">Cadastro em<br/><strong>{new Intl.DateTimeFormat('pt-BR').format(new Date())}</strong></p></div><fieldset><legend>Contato e responsável</legend><div className="grid">{campo('empresa','Empresa')}{campo('contato','Contato')}{campo('telefone','Telefone',{inputMode:'tel',onChange:e=>set('telefone',telMask(e.target.value))})}{campo('email','E-mail',{type:'email'})}{campo('responsavel','Quem fez o cadastro')}</div></fieldset><fieldset><legend>Máquina e produto</legend><div className="grid">{campo('maquina','Máquina (campo livre)')}<label>Tipo de papel<select value={f.papel} onChange={e=>alterarPapel(e.target.value)}><option value="">Selecione</option>{Object.keys(produtos).map(x=><option key={x}>{x}</option>)}</select></label>{f.papel&&<label>Produto<select value={f.produto} onChange={e=>alterarProduto(e.target.value)}><option value="">Selecione</option>{produtos[f.papel].map(x=><option key={x}>{x}</option>)}</select></label>}{opModelo.length>0&&<label>Modelo<select value={f.modelo} onChange={e=>set('modelo',e.target.value)}><option value="">Selecione</option>{opModelo.map(x=><option key={x}>{x}</option>)}</select></label>}{precisaPosicao(f.produto)&&campo('posicao','Posição (campo livre)')}</div>{detalhes&&<div className="grid detalhes">{campo('comprimento','Comprimento',{inputMode:'decimal',placeholder:'0,000',onChange:e=>set('comprimento',decimal3(e.target.value))})}{campo('largura','Largura',{inputMode:'decimal',placeholder:'0,000',onChange:e=>set('largura',decimal3(e.target.value))})}{campo('cfm','CFM',{inputMode:'numeric',onChange:e=>set('cfm',inteiro(e.target.value))})}{campo('gramatura','Gramatura',{inputMode:'numeric',onChange:e=>set('gramatura',inteiro(e.target.value))})}{campo('espessura','Espessura',{inputMode:'decimal',placeholder:'0,000',onChange:e=>set('espessura',decimal3(e.target.value))})}{f.produto==='Secadora Espiral'&&<label className="check-simples"><input type="checkbox" checked={f.teflonada} onChange={e=>set('teflonada',e.target.checked)}/> Teflonada</label>}</div>}</fieldset>{detalhes&&<fieldset><legend>Condições de operação</legend><div className="grid">{campo('durabilidade','Durabilidade do produto')}{campo('velocidade_maquina','Velocidade da máquina')}</div><label>Informações adicionais<textarea value={f.informacoes_adicionais} maxLength="5000" onChange={e=>set('informacoes_adicionais',e.target.value)} rows="7"/><small>{f.informacoes_adicionais.length}/5000 caracteres</small></label></fieldset>}{erro&&<p className="erro">{erro}</p>}<div className="acoes-cadastro"><button type="submit" disabled={salvando}>{salvando?'Salvando…':'Salvar e voltar ao menu'}</button><button type="button" disabled={salvando} onClick={()=>salvar(true)}>Salvar e cadastrar nova máquina</button><button type="button" className="botao-neutro" onClick={()=>{setF(vazio);setErro('');window.scrollTo(0,0)}}>Reiniciar</button><button type="button" className="botao-neutro" onClick={voltarMenu}>Cancelar</button></div></form></main></>
}
