import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';

const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type'};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json','Cache-Control':'no-store'}});
const produtos={Tissue:['Tela Formadora','Feltro','Tela DNT','Tela Acabadora'],Marrom:['Tela Tecida','Formadora','Feltro','Feltro com emenda','Camisa','Engrossador','Secadora Espiral']} as const;
const modelos=(papel:string,produto:string)=>produto==='Camisa'?['Malha 4','Malha 16','Malha 18','Malha 21']:(produto==='Formadora'||produto==='Tela Formadora')&&papel==='Tissue'?['Dupla e meia','Tripla']:produto==='Formadora'&&papel==='Marrom'?['Tripla','Dupla','Dupla e meia','Mono']:[];
const precisaPosicao=(produto:string)=>['Tela Tecida','Secadora Espiral','Feltro','Feltro com emenda'].includes(produto);
const texto=(v:unknown,max=5000)=>String(v??'').trim().slice(0,max);

Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
 if(req.method!=='POST')return json({ok:false,mensagem:'Método não permitido.'},405);
 try{
  const b=await req.json(),papel=texto(b.papel,20),produto=texto(b.produto,80),modelo=texto(b.modelo,80),posicao=texto(b.posicao,160);
  const dados={empresa:texto(b.empresa,160),contato:texto(b.contato,160),telefone:texto(b.telefone,30),email:texto(b.email,254).toLowerCase(),responsavel:texto(b.responsavel,160),maquina:texto(b.maquina,160),tipo_papel:papel,produto,modelo:modelo||null,posicao:posicao||null,cfm:texto(b.cfm,80),gramatura:texto(b.gramatura,80),espessura:texto(b.espessura,80),teflonada:produto==='Secadora Espiral'&&b.teflonada===true,durabilidade:texto(b.durabilidade,160),velocidade_maquina:texto(b.velocidade_maquina,160),informacoes_adicionais:texto(b.informacoes_adicionais,5000)};
  if(!dados.empresa||!dados.contato||!dados.telefone||!dados.email||!dados.responsavel||!dados.maquina||!dados.cfm||!dados.gramatura||!dados.espessura||!dados.durabilidade||!dados.velocidade_maquina)return json({ok:false,mensagem:'Preencha os campos obrigatórios.'},400);
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.email))return json({ok:false,mensagem:'E-mail inválido.'},400);
  if(!(papel in produtos)||!(produtos[papel as keyof typeof produtos] as readonly string[]).includes(produto))return json({ok:false,mensagem:'Combinação de papel e produto inválida.'},400);
  const opcoesModelo=modelos(papel,produto);if((opcoesModelo.length&& !opcoesModelo.includes(modelo))||(!opcoesModelo.length&&modelo))return json({ok:false,mensagem:'Modelo inválido para o produto informado.'},400);
  if(precisaPosicao(produto)!==Boolean(posicao))return json({ok:false,mensagem:'Informe posição apenas para o produto selecionado.'},400);
  const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
  const {error}=await db.from('cadastro_produtos_feira_phenix').insert(dados);if(error)throw error;
  return json({ok:true},201);
 }catch(error){console.error(error);return json({ok:false,mensagem:'Não foi possível gravar o cadastro agora.'},500)}
});
