import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = { 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type' }
const json = (body:unknown,status=200) => new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json','Cache-Control':'no-store'}})
const produtos = { Tissue:['Tela Formadora','Feltro','Tela DNT','Tela Acabadora'], Marrom:['Tela Tecida','Formadora','Feltro','Feltro com emenda','Camisa','Engrossador','Secadora Espiral'] } as const
const modelos = (papel:string,produto:string) => produto==='Camisa' ? ['Malha 4','Malha 16','Malha 18','Malha 21'] : (produto==='Formadora'||produto==='Tela Formadora')&&papel==='Tissue' ? ['Dupla e meia','Tripla'] : produto==='Formadora'&&papel==='Marrom' ? ['Tripla','Dupla','Dupla e meia','Mono'] : []
const precisaPosicao = (produto:string) => ['Tela Tecida','Secadora Espiral','Feltro','Feltro com emenda'].includes(produto)
const texto = (v:unknown,max=5000) => String(v??'').trim().slice(0,max)
const opcional = (v:unknown,max=5000) => texto(v,max) || null
const decimal3 = (v:string|null) => v===null || /^\d{1,9},\d{3}$/.test(v)
const inteiro = (v:string|null) => v===null || /^\d{1,9}$/.test(v)
// Fixo (10 dígitos) ou celular (11 dígitos, começando com 9 após o DDD).
const telefoneOk = (v:string) => { const d=v.replace(/\D/g,''); return /^[1-9][1-9]/.test(d) && (d.length===10 || (d.length===11 && d[2]==='9')) }
const emailOk = (v:string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)

Deno.serve(async req => {
  if(req.method==='OPTIONS') return new Response('ok',{headers:cors})
  if(req.method!=='POST') return json({ok:false,mensagem:'Método não permitido.'},405)
  try {
    const b=await req.json(), papel=opcional(b.papel,20), produto=opcional(b.produto,80), modelo=opcional(b.modelo,80), posicao=opcional(b.posicao,160)
    const email=opcional(b.email,254)?.toLowerCase() ?? null
    const dados={empresa:texto(b.empresa,160),contato:texto(b.contato,160),telefone:texto(b.telefone,30),email,responsavel:texto(b.responsavel,160),maquina:opcional(b.maquina,160),tipo_papel:papel,produto,modelo,posicao:produto&&precisaPosicao(produto)?posicao:null,comprimento:opcional(b.comprimento,30),largura:opcional(b.largura,30),cfm:opcional(b.cfm,80),gramatura:opcional(b.gramatura,80),espessura:opcional(b.espessura,80),teflonada:produto==='Secadora Espiral'&&b.teflonada===true,durabilidade:opcional(b.durabilidade,160),velocidade_maquina:opcional(b.velocidade_maquina,160),informacoes_adicionais:texto(b.informacoes_adicionais,5000)}
    if(dados.empresa.length<2||dados.contato.length<2||dados.responsavel.length<2||!dados.telefone)return json({ok:false,mensagem:'Preencha empresa, contato, telefone e quem fez o cadastro.'},400)
    if(!telefoneOk(dados.telefone))return json({ok:false,mensagem:'Telefone inválido. Informe DDD e número fixo (8 dígitos) ou celular (9 dígitos).'},400)
    if(email&&!emailOk(email))return json({ok:false,mensagem:'E-mail inválido.'},400)
    if(!decimal3(dados.comprimento)||!decimal3(dados.largura)||!decimal3(dados.espessura)||!inteiro(dados.cfm)||!inteiro(dados.gramatura))return json({ok:false,mensagem:'Use três casas decimais para comprimento, largura e espessura; CFM e gramatura devem ser inteiros.'},400)
    if(papel&&!(papel in produtos))return json({ok:false,mensagem:'Tipo de papel inválido.'},400)
    if(produto&&(!papel||!(produtos[papel as keyof typeof produtos] as readonly string[]).includes(produto)))return json({ok:false,mensagem:'Combinação de papel e produto inválida.'},400)
    if(modelo&&(!produto||!modelos(papel!,produto).includes(modelo)))return json({ok:false,mensagem:'Modelo inválido para o produto informado.'},400)
    const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}})
    const {error}=await db.from('cadastro_produtos_feira_phenix').insert(dados)
    if(error)throw error
    return json({ok:true},201)
  } catch(error) { console.error(error); return json({ok:false,mensagem:'Não foi possível gravar o cadastro agora.'},500) }
})
