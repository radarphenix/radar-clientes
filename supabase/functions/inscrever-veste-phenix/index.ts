import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import nodemailer from 'npm:nodemailer@7.0.11';

declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void };
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type'};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json','Cache-Control':'no-store'}});
const esc=(v:string)=>v.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c));
const cnpjValido=(c:string)=>{if(!/^\d{14}$/.test(c)||/^(\d)\1+$/.test(c))return false;const calc=(n:number)=>{const p=n===12?[5,4,3,2,9,8,7,6,5,4,3,2]:[6,5,4,3,2,9,8,7,6,5,4,3,2];const r=p.reduce((s,x,i)=>s+(+c[i]*x),0)%11;return r<2?0:11-r};return calc(12)===+c[12]&&calc(13)===+c[13]};
const cpfValido=(c:string)=>{if(!/^\d{11}$/.test(c)||/^(\d)\1+$/.test(c))return false;const dig=(n:number)=>{let s=0;for(let i=0;i<n;i++)s+=Number(c[i])*(n+1-i);const r=(s*10)%11;return r===10?0:r};return dig(9)===Number(c[9])&&dig(10)===Number(c[10])};

async function enviarConfirmacao(db:ReturnType<typeof createClient>,data:{id:string;numeros_sorte:number[];nome_completo:string;email:string},modoTeste:boolean){
 const resendKey=Deno.env.get('RESEND_API_KEY');const smtpUsuario=Deno.env.get('PROMO_SMTP_USUARIO');const smtpSenha=Deno.env.get('PROMO_SMTP_SENHA');const remetente=Deno.env.get('PROMO_FROM_EMAIL')||smtpUsuario;const nomeRemetente=Deno.env.get('PROMO_FROM_NAME')||'Promoção Veste Phenix 30 anos';
 if(!remetente||(!resendKey&&(!smtpUsuario||!smtpSenha))){await db.from('promocao_veste_phenix_30_anos').update({email_status:'aguardando_configuracao'}).eq('id',data.id);return}
 try{await db.from('promocao_veste_phenix_30_anos').update({email_status:'enviando',email_tentativas:1,email_ultimo_erro:null}).eq('id',data.id);
  const numeros=data.numeros_sorte.map(n=>String(n).padStart(5,'0')).sort();
  const celula=(n:string)=>`<td style="background:#f4f8fb;border-radius:10px;padding:10px 14px;font-size:22px;font-weight:800;color:#d78a19;text-align:center;white-space:nowrap">${n}</td>`;
  const espacoCol=`<td style="width:8px;line-height:1px;font-size:1px">&nbsp;</td>`;
  const espacoLinha=`<tr><td colspan="9" style="height:8px;line-height:1px;font-size:1px">&nbsp;</td></tr>`;
  const linha=(grupo:string[])=>`<tr>${grupo.map((n,i)=>(i?espacoCol:'')+celula(n)).join('')}</tr>`;
  const grade=`<table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:16px auto">${linha(numeros.slice(0,5))}${espacoLinha}${linha(numeros.slice(5,10))}</table>`;
  const assunto=modoTeste?`[TESTE] Seus números da sorte Phenix 30 anos`:`Seus números da sorte Phenix 30 anos`;
  const avisoTeste=modoTeste?`<div style="margin:0 0 24px;padding:14px 18px;border-radius:10px;background:#fff3d7;color:#754508;font-weight:700;text-align:center">AMBIENTE DE TESTE — esta é uma inscrição de homologação e será removida antes da abertura oficial da promoção.</div>`:'';
  const html=`<div style="font-family:Arial;background:#062d55;padding:36px;color:#fff"><div style="max-width:620px;margin:auto;background:#fff;color:#123653;border-radius:18px;overflow:hidden"><div style="padding:30px;background:linear-gradient(120deg,#0b5687,#062846);color:#fff"><b style="color:#f4b13b;letter-spacing:3px">VESTE PHENIX • 30 ANOS</b><h1>Olá, ${esc(data.nome_completo)}!</h1></div><div style="padding:34px;text-align:center">${avisoTeste}<p>Sua inscrição foi confirmada. Seus 10 números da sorte são:</p><div>${grade}</div><p>Guarde este e-mail. A apuração seguirá o regulamento oficial com base na Loteria Federal.</p></div></div></div>`;
  if(smtpUsuario&&smtpSenha){const transporte=nodemailer.createTransport({host:'smtp.gmail.com',port:465,secure:true,auth:{user:smtpUsuario,pass:smtpSenha},connectionTimeout:15000,socketTimeout:20000});await transporte.sendMail({from:{name:nomeRemetente,address:remetente},to:data.email,subject:assunto,html})}else{const er=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${resendKey}`,'Content-Type':'application/json'},body:JSON.stringify({from:remetente,to:[data.email],subject:assunto,html})});if(!er.ok)throw new Error(`Serviço de e-mail respondeu ${er.status}`)}
  await db.from('promocao_veste_phenix_30_anos').update({email_status:'enviado',email_confirmacao_enviado_em:new Date().toISOString(),email_ultimo_erro:null}).eq('id',data.id)
 }catch(e){console.error('Falha no e-mail',e);await db.from('promocao_veste_phenix_30_anos').update({email_status:'falhou',email_ultimo_erro:String(e).slice(0,500)}).eq('id',data.id)}
}

Deno.serve(async(req)=>{if(req.method==='OPTIONS')return new Response('ok',{headers:cors});if(req.method!=='POST')return json({ok:false,mensagem:'Método não permitido.'},405);
 try{const b=await req.json();const cpf=String(b.cpf||'').replace(/\D/g,'');const cnpj=String(b.cnpj||'').replace(/\D/g,'');const modoTeste=Deno.env.get('PROMO_MODO_TESTE')==='true';
  if(!modoTeste&&Deno.env.get('PROMO_INSCRICOES_ATIVAS')!=='true')return json({ok:false,mensagem:'As inscrições ainda não estão abertas.'},403);const agora=Date.now();if(!modoTeste&&(agora<Date.parse('2026-10-06T00:00:00-03:00')||agora>Date.parse('2026-10-08T23:59:59-03:00')))return json({ok:false,mensagem:'Inscrição fora do período oficial da promoção.'},403);if(!b.maior_18||!b.aceite_regulamento||!b.aceite_privacidade)return json({ok:false,mensagem:'Aceites obrigatórios não confirmados.'},400);if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(b.email||'')))return json({ok:false,mensagem:'E-mail inválido.'},400);
  if(!cpfValido(cpf))return json({ok:false,mensagem:'CPF inválido.'},400);if(!cnpjValido(cnpj))return json({ok:false,mensagem:'CNPJ inválido.'},400);const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
  const payload={p_nome_completo:String(b.nome_completo||'').trim(),p_cpf:cpf,p_email:String(b.email||'').trim().toLowerCase(),p_telefone:String(b.telefone||'').trim(),p_empresa:String(b.empresa||'').trim(),p_cnpj:cnpj,p_cargo:String(b.cargo||'').trim(),p_cidade:String(b.cidade||'').trim(),p_uf:String(b.uf||'').toUpperCase(),p_segmento:String(b.segmento||''),p_relacao_phenix:String(b.relacao_phenix||''),p_aceite_marketing:!!b.aceite_marketing,p_origem:modoTeste?'formulario_teste':'formulario_web'};
  const{data:linhas,error}=await db.rpc('inscrever_veste_phenix_completo',payload);
  if(error){if(error.code==='23505')return json({ok:false,mensagem:'Este CPF já possui uma inscrição e números da sorte.'},409);console.error(error);return json({ok:false,mensagem:'Não foi possível concluir a inscrição agora.'},500)}
  if(!linhas?.length)throw new Error('Inscrição não retornou números da sorte.');
  const inscricaoId=linhas[0].inscricao_id;const numeros=linhas.map((l:{numero_sorte:number})=>l.numero_sorte);
  EdgeRuntime.waitUntil(enviarConfirmacao(db,{id:inscricaoId,numeros_sorte:numeros,nome_completo:payload.p_nome_completo,email:payload.p_email},modoTeste));
  return json({ok:true,numeros_sorte:numeros},201)
 }catch(e){console.error(e);return json({ok:false,mensagem:'Não foi possível concluir a inscrição agora.'},500)}});
