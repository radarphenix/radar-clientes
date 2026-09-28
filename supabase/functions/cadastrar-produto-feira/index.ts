import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = { 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type' }
const json = (body:unknown,status=200) => new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json','Cache-Control':'no-store'}})
const produtos = { Tissue:['Tela Formadora','Feltro','Tela DNT','Tela Acabadora','Outros'], Marrom:['Tela Tecida','Formadora','Feltro','Feltro com emenda','Camisa','Engrossador','Secadora Espiral','Outros'] } as const
const modelos = (papel:string,produto:string) => produto==='Camisa' ? ['Malha 4','Malha 16','Malha 18','Malha 21'] : (produto==='Formadora'||produto==='Tela Formadora')&&papel==='Tissue' ? ['Dupla e meia','Tripla'] : produto==='Formadora'&&papel==='Marrom' ? ['Tripla','Dupla','Dupla e meia','Mono'] : []
const precisaPosicao = (produto:string) => ['Tela Tecida','Secadora Espiral','Feltro','Feltro com emenda','Outros'].includes(produto)
const texto = (v:unknown,max=5000) => String(v??'').trim().slice(0,max)
const opcional = (v:unknown,max=5000) => texto(v,max) || null
const decimal3 = (v:string|null) => v===null || /^\d{1,9},\d{3}$/.test(v)
const inteiro = (v:string|null) => v===null || /^\d{1,9}$/.test(v)
// Fixo (10 dígitos) ou celular (11 dígitos, começando com 9 após o DDD).
const telefoneOk = (v:string) => { const d=v.replace(/\D/g,''); return /^[1-9][1-9]/.test(d) && (d.length===10 || (d.length===11 && d[2]==='9')) }
const emailOk = (v:string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)
// Unidades por máquina: formadora até 5, secadora espiral até 14, os demais até 3.
const LIMITES:Record<string,number> = { 'Tela Formadora':5, 'Formadora':5, 'Secadora Espiral':14 }
const maxDe = (produto:string) => LIMITES[produto] ?? 3
const MAX_ITENS = 40
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
type Item = Record<string,unknown>

// Valida um produto da máquina; devolve a mensagem de erro ou os campos da linha.
function produtoDaLinha(papel:string|null,i:Item):string|Record<string,unknown>{
  const produto=opcional(i.produto,80), modelo=opcional(i.modelo,80), posicao=opcional(i.posicao,160)
  const linha={produto,nome_produto_outros:produto==='Outros'?opcional(i.nome_produto_outros,160):null,modelo,posicao:produto&&precisaPosicao(produto)?posicao:null,comprimento:opcional(i.comprimento,30),largura:opcional(i.largura,30),cfm:opcional(i.cfm,80),gramatura:opcional(i.gramatura,80),espessura:opcional(i.espessura,80),teflonada:produto==='Secadora Espiral'&&i.teflonada===true,durabilidade:opcional(i.durabilidade,160)}
  if(!decimal3(linha.comprimento)||!decimal3(linha.largura)||!decimal3(linha.espessura)||!inteiro(linha.cfm)||!inteiro(linha.gramatura))return 'Use três casas decimais para comprimento, largura e espessura; CFM e gramatura devem ser inteiros.'
  if(produto&&(!papel||!(produtos[papel as keyof typeof produtos] as readonly string[]).includes(produto)))return 'Combinação de papel e produto inválida.'
  if(modelo&&(!produto||!modelos(papel!,produto).includes(modelo)))return 'Modelo inválido para o produto informado.'
  return linha
}

Deno.serve(async req => {
  if(req.method==='OPTIONS') return new Response('ok',{headers:cors})
  if(req.method!=='POST') return json({ok:false,mensagem:'Método não permitido.'},405)
  try {
    const b=await req.json(), papel=opcional(b.papel,20)
    const email=opcional(b.email,254)?.toLowerCase() ?? null
    const comum={empresa:texto(b.empresa,160),contato:texto(b.contato,160),telefone:texto(b.telefone,30),email,responsavel:texto(b.responsavel,160),maquina:opcional(b.maquina,160),tipo_papel:papel,velocidade_maquina:opcional(b.velocidade_maquina,160),informacoes_adicionais:texto(b.informacoes_adicionais,5000)}
    if(comum.empresa.length<2||comum.contato.length<2||comum.responsavel.length<2||!comum.telefone)return json({ok:false,mensagem:'Preencha empresa, contato, telefone e quem fez o cadastro.'},400)
    if(!telefoneOk(comum.telefone))return json({ok:false,mensagem:'Telefone inválido. Informe DDD e número fixo (8 dígitos) ou celular (9 dígitos).'},400)
    if(email&&!emailOk(email))return json({ok:false,mensagem:'E-mail inválido.'},400)
    if(papel&&!(papel in produtos))return json({ok:false,mensagem:'Tipo de papel inválido.'},400)

    // Tela nova envia itens[]; a versão antiga (ainda em cache em algum tablet) envia um produto só, no corpo.
    const itens:Item[]=Array.isArray(b.itens)?b.itens:[b]
    if(itens.length>MAX_ITENS)return json({ok:false,mensagem:'Produtos demais em um só cadastro.'},400)
    // envio_id vem do aparelho (fila offline): reenviar o mesmo cadastro não duplica as linhas.
    const envioId=typeof b.envio_id==='string'&&UUID.test(b.envio_id)?b.envio_id.toLowerCase():null
    const grupo_id=envioId??crypto.randomUUID(), contagem=new Map<string,number>(), linhas:Record<string,unknown>[]=[]
    for(const i of itens){
      const linha=produtoDaLinha(papel,i)
      if(typeof linha==='string')return json({ok:false,mensagem:linha},400)
      let item:number|null=null
      if(linha.produto){
        item=(contagem.get(linha.produto as string)??0)+1; contagem.set(linha.produto as string,item)
        const max=maxDe(linha.produto as string)
        if(item>max)return json({ok:false,mensagem:`No máximo ${max} unidades de ${linha.produto} por máquina.`},400)
      }
      linhas.push({...comum,...linha,grupo_id,item})
    }
    // Sem nenhum produto, grava só contato e máquina (como antes).
    if(!linhas.length)linhas.push({...comum,...produtoDaLinha(papel,{}) as Record<string,unknown>,grupo_id,item:null})

    const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}})
    if(envioId){
      const {data:existente,error:erroBusca}=await db.from('cadastro_produtos_feira_phenix').select('id').eq('grupo_id',envioId).limit(1)
      if(erroBusca)throw erroBusca
      if(existente?.length)return json({ok:true,duplicado:true},200)
    }
    // Um único insert com todas as linhas: grava tudo ou nada.
    const {error}=await db.from('cadastro_produtos_feira_phenix').insert(linhas)
    if(error)throw error
    return json({ok:true,linhas:linhas.length},201)
  } catch(error) { console.error(error); return json({ok:false,mensagem:'Não foi possível gravar o cadastro agora.'},500) }
})
