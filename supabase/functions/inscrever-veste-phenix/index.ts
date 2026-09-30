import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import nodemailer from 'npm:nodemailer@7.0.11';
import { emailContemplado, whatsappContemplado, enviarWhatsApp, CONTATO_PHENIX } from './contemplado.ts';

declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void };
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type'};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json','Cache-Control':'no-store'}});
const esc=(v:string)=>v.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c));
const cnpjValido=(c:string)=>{if(!/^\d{14}$/.test(c)||/^(\d)\1+$/.test(c))return false;const calc=(n:number)=>{const p=n===12?[5,4,3,2,9,8,7,6,5,4,3,2]:[6,5,4,3,2,9,8,7,6,5,4,3,2];const r=p.reduce((s,x,i)=>s+(+c[i]*x),0)%11;return r<2?0:11-r};return calc(12)===+c[12]&&calc(13)===+c[13]};
const cpfValido=(c:string)=>{if(!/^\d{11}$/.test(c)||/^(\d)\1+$/.test(c))return false;const dig=(n:number)=>{let s=0;for(let i=0;i<n;i++)s+=Number(c[i])*(n+1-i);const r=(s*10)%11;return r===10?0:r};return dig(9)===Number(c[9])&&dig(10)===Number(c[10])};
// Mesmas listas do FormularioPromocao.jsx.
const UFS=new Set('AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' '));
const SEGMENTOS=new Set(['Papel e celulose','Tissue','Papel cartão','Embalagens','Reciclagem','Tratamento de efluentes','Engrossadores','Mineração','Outro segmento industrial']);
const limite=(v:unknown,max:number)=>typeof v==='string'&&v.trim().length>0&&v.length<=max;
const hash=async(v:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v)))).map(x=>x.toString(16).padStart(2,'0')).join('');
// Rate limit por chave SHA-256 (sem PII em claro). Se o RPC falhar, não bloqueia a inscrição.
async function dentroDoLimite(db:{rpc:(fn:string,args:Record<string,unknown>)=>PromiseLike<{data:unknown;error:unknown}>},chave:string,max:number,janelaSegundos:number){
 const{data,error}=await db.rpc('registrar_tentativa_veste_phenix',{p_chave:await hash(chave),p_limite:max,p_janela_segundos:janelaSegundos});
 if(error){console.error('rate limit',error);return true}
 return data!==false;
}

async function enviarConfirmacao(db:ReturnType<typeof createClient>,data:{id:string;numeros_sorte:number[];nome_completo:string;email:string;tentativa?:number},modoTeste:boolean):Promise<boolean>{
 const resendKey=Deno.env.get('RESEND_API_KEY');const smtpUsuario=Deno.env.get('PROMO_SMTP_USUARIO');const smtpSenha=Deno.env.get('PROMO_SMTP_SENHA');const remetente=Deno.env.get('PROMO_FROM_EMAIL')||smtpUsuario;const nomeRemetente=Deno.env.get('PROMO_FROM_NAME')||'Promoção Veste Phenix 30 anos';
 if(!remetente||(!resendKey&&(!smtpUsuario||!smtpSenha))){await db.from('promocao_veste_phenix_30_anos').update({email_status:'aguardando_configuracao'}).eq('id',data.id);return false}
 try{await db.from('promocao_veste_phenix_30_anos').update({email_status:'enviando',email_tentativas:data.tentativa??1,email_ultimo_erro:null}).eq('id',data.id);
  const numeros=data.numeros_sorte.map(n=>String(n).padStart(5,'0')).sort();
  const SITE='https://radarphenix.pages.dev';
  const primeiroNome=data.nome_completo.trim().split(/\s+/)[0]||data.nome_completo;
  const assunto=modoTeste?`[TESTE] Seus números da sorte Phenix 30 anos`:`Seus números da sorte Phenix 30 anos`;
  // HTML de e-mail: só tabelas e estilos inline (Outlook/Gmail); a media query só refina no celular.
  const chip=(n:string)=>`<td class="num" width="20%" align="center" style="padding:4px"><div style="background:#062d55;border-radius:10px;padding:12px 0;font-family:Arial,Helvetica,sans-serif;font-size:22px;line-height:26px;font-weight:bold;color:#f4b13b;letter-spacing:1px">${n}</div></td>`;
  const grade=`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${numeros.slice(0,5).map(chip).join('')}</tr><tr>${numeros.slice(5,10).map(chip).join('')}</tr></table>`;
  const avisoTeste=modoTeste?`<tr><td class="px" style="padding:0 32px 12px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="background:#fff3d7;border-radius:10px;padding:12px 16px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:19px;color:#754508;font-weight:bold;text-align:center">AMBIENTE DE TESTE — inscrição de homologação, será removida antes da abertura oficial.</td></tr></table></td></tr>`:'';
  const p=(t:string,extra='')=>`<p style="margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:23px;color:#29425a;${extra}">${t}</p>`;
  const caixa=(borda:string,fundo:string,titulo:string,corpo:string)=>`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="background:${fundo};border-left:4px solid ${borda};border-radius:8px;padding:18px 20px"><div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#0b3558;margin:0 0 8px">${titulo}</div>${corpo}</td></tr></table>`;
  const html=`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><title>${esc(assunto)}</title>
<style>@media (max-width:520px){.card{width:100%!important}.px{padding-left:18px!important;padding-right:18px!important}.num div{font-size:17px!important;line-height:22px!important;padding:10px 0!important;letter-spacing:0!important}h1{font-size:22px!important}.selo{letter-spacing:1px!important;font-size:11px!important}}</style></head>
<body style="margin:0;padding:0;background:#062d55">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#062d55">Inscrição confirmada! Seus 10 números da sorte: ${numeros.join(', ')}.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#062d55" style="background:#062d55"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" class="card" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden">
<tr><td align="center" bgcolor="#0b4a76" style="background:#0b4a76;padding:30px 24px 24px">
<img src="${SITE}/email-phenix-30-anos.png" width="200" alt="Phenix 30 anos - Tecendo Facilidades" style="display:block;width:200px;max-width:70%;height:auto;border:0;margin:0 auto 14px;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:bold">
<div class="selo" style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:16px;letter-spacing:3px;font-weight:bold;color:#f4b13b">PROMOÇÃO VESTE PHENIX • 30 ANOS</div>
</td></tr>
<tr><td bgcolor="#f4b13b" style="height:6px;line-height:6px;font-size:1px;background:#f4b13b">&nbsp;</td></tr>
<tr><td style="height:26px;line-height:26px;font-size:1px">&nbsp;</td></tr>
${avisoTeste}
<tr><td class="px" style="padding:0 32px">
<h1 style="margin:0 0 10px;font-family:Arial,Helvetica,sans-serif;font-size:26px;line-height:32px;color:#0b3558">Olá, ${esc(primeiroNome)}!</h1>
${p('Sua inscrição na promoção <b>Veste Phenix 30 anos</b> está confirmada. Obrigado por comemorar esses 30 anos com a gente!')}
<div style="margin:22px 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:2px;font-weight:bold;color:#0e5886;text-align:center">SEUS 10 NÚMEROS DA SORTE</div>
</td></tr>
<tr><td class="px" style="padding:0 28px">${grade}</td></tr>
<tr><td class="px" style="padding:14px 32px 0">${p('Guarde este e-mail: ele é o seu comprovante de participação.','text-align:center;font-size:13px;color:#5b6f82;margin:0')}</td></tr>
<tr><td class="px" style="padding:26px 32px 0">${caixa('#0e5886','#f1f6fa','Como funciona a apuração',p('Em <b>10/10/2026</b> será usado o número de 5 algarismos do <b>1º prêmio da Loteria Federal</b>. Ganha quem tiver o número da sorte igual ou mais próximo dele.','font-size:14px;line-height:21px;margin:0 0 8px')+p('O resultado sai em até 5 dias úteis após a apuração, e a Phenix entra em contato com o contemplado.','font-size:14px;line-height:21px;margin:0'))}</td></tr>
<tr><td class="px" style="padding:16px 32px 0">${caixa('#c0392b','#fdf0ef','Informações verdadeiras',p('Os dados informados no cadastro serão verificados antes da confirmação do contemplado. Se for comprovada informação <b>inverídica ou falsa</b>, o potencial vencedor será <b>desclassificado</b> e o prêmio passará ao próximo número da sorte mais próximo, conforme o regulamento.','font-size:14px;line-height:21px;margin:0'))}</td></tr>
<tr><td class="px" style="padding:16px 32px 0">${caixa('#f4b13b','#fdf6e7','O prêmio',p('Experiência técnica comemorativa Phenix 30 anos no Rio Grande do Sul, incluindo <b>passeio de balão</b>, conforme o regulamento.','font-size:14px;line-height:21px;margin:0'))}</td></tr>
<tr><td align="center" style="padding:28px 32px 32px">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" bgcolor="#0e5886" style="border-radius:10px;background:#0e5886">
<a href="${SITE}/regulamento.pdf?v=20260930" target="_blank" style="display:inline-block;padding:13px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:10px">Ler o regulamento</a>
</td></tr></table>
</td></tr>
<tr><td bgcolor="#eef3f7" style="background:#eef3f7;padding:20px 32px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#5b6f82;text-align:center">
Dúvidas? Escreva para <a href="mailto:phenix@phenixonline.com.br" style="color:#0e5886">phenix@phenixonline.com.br</a><br>
<a href="${SITE}/politica-privacidade.pdf?v=20260925" target="_blank" style="color:#0e5886">Política de privacidade</a><br><br>
Phenix Indústria e Comércio de Filtros LTDA · CNPJ 01.170.987/0001-55 · Arroio do Sal/RS<br>
Você recebeu este e-mail porque se inscreveu na promoção Veste Phenix 30 anos.
</td></tr>
</table>
</td></tr></table>
</body></html>`;
  const text=[
   modoTeste?'[AMBIENTE DE TESTE - inscrição de homologação, será removida antes da abertura oficial.]\n':'',
   `Olá, ${primeiroNome}!`,'',
   'Sua inscrição na promoção Veste Phenix 30 anos está confirmada.','',
   'SEUS 10 NÚMEROS DA SORTE:',numeros.slice(0,5).join('   '),numeros.slice(5).join('   '),'',
   'Guarde este e-mail: ele é o seu comprovante de participação.','',
   'Informações verdadeiras: os dados do cadastro serão verificados antes da confirmação do contemplado. Se for comprovada informação inverídica ou falsa, o potencial vencedor será desclassificado e o prêmio passará ao próximo número da sorte mais próximo, conforme o regulamento.','',
   'Como funciona a apuração: em 10/10/2026 será usado o número de 5 algarismos do 1º prêmio da Loteria Federal. Ganha quem tiver o número da sorte igual ou mais próximo dele. O resultado sai em até 5 dias úteis após a apuração.','',
   `Regulamento: ${SITE}/regulamento.pdf?v=20260930`,
   `Política de privacidade: ${SITE}/politica-privacidade.pdf?v=20260925`,
   'Dúvidas: phenix@phenixonline.com.br','',
   'Phenix Indústria e Comércio de Filtros LTDA · CNPJ 01.170.987/0001-55 · Arroio do Sal/RS'
  ].join('\n');
  await enviarEmail({para:data.email,assunto,html,text});
  await db.from('promocao_veste_phenix_30_anos').update({email_status:'enviado',email_confirmacao_enviado_em:new Date().toISOString(),email_ultimo_erro:null}).eq('id',data.id);return true
 }catch(e){console.error('Falha no e-mail',e);await db.from('promocao_veste_phenix_30_anos').update({email_status:'falhou',email_ultimo_erro:String(e).slice(0,500)}).eq('id',data.id);return false}
}

// Envio de e-mail (Gmail SMTP ou Resend). replyTo: para onde vão as respostas do destinatário.
async function enviarEmail(m:{para:string;assunto:string;html:string;text:string;replyTo?:string}){
 const resendKey=Deno.env.get('RESEND_API_KEY');const smtpUsuario=Deno.env.get('PROMO_SMTP_USUARIO');const smtpSenha=Deno.env.get('PROMO_SMTP_SENHA');const remetente=Deno.env.get('PROMO_FROM_EMAIL')||smtpUsuario;const nomeRemetente=Deno.env.get('PROMO_FROM_NAME')||'Promoção Veste Phenix 30 anos';
 if(!remetente||(!resendKey&&(!smtpUsuario||!smtpSenha)))throw new Error('Envio de e-mail não configurado no servidor.');
 if(smtpUsuario&&smtpSenha){const transporte=nodemailer.createTransport({host:'smtp.gmail.com',port:465,secure:true,auth:{user:smtpUsuario,pass:smtpSenha},connectionTimeout:15000,socketTimeout:20000});await transporte.sendMail({from:{name:nomeRemetente,address:remetente},to:m.para,subject:m.assunto,html:m.html,text:m.text,...(m.replyTo?{replyTo:m.replyTo}:{})})}
 else{const er=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${resendKey}`,'Content-Type':'application/json'},body:JSON.stringify({from:remetente,to:[m.para],subject:m.assunto,html:m.html,text:m.text,...(m.replyTo?{reply_to:m.replyTo}:{})})});if(!er.ok)throw new Error(`Serviço de e-mail respondeu ${er.status}`)}
}

// Ações do painel admin: exigem usuário logado com perfil admin ativo.
// deno-lint-ignore no-explicit-any -- tipagem genérica do supabase-js via esm.sh não infere as tabelas
async function exigirAdmin(req:Request,db:any):Promise<string|Response>{
 const token=(req.headers.get('Authorization')||'').replace(/^Bearer\s+/i,'');
 const servico=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
 if(servico&&token===servico)return 'service_role';
 const{data:u,error:erroUsuario}=await db.auth.getUser(token);
 if(erroUsuario||!u?.user)return json({ok:false,mensagem:'Faça login como administrador.'},401);
 const{data:perfil}=await db.from('perfis').select('tipo_perfil,ativo').eq('user_id',u.user.id).maybeSingle();
 if(perfil?.tipo_perfil!=='admin'||perfil?.ativo!==true)return json({ok:false,mensagem:'Somente administrador pode fazer isso.'},403);
 return u.user.id;
}

// Prévia do e-mail de contemplado (marcada como TESTE, dados de exemplo) para conferir o texto antes do envio real.
async function previaContemplado(req:Request,b:{para?:unknown}){
 const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
 const admin=await exigirAdmin(req,db);if(admin instanceof Response)return admin;
 const para=String(b.para||'').trim().toLowerCase();
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(para))return json({ok:false,mensagem:'Informe um e-mail válido para a prévia.'},400);
 const m=emailContemplado({nome:'Participante Exemplo',email:para,telefone:'',numeroSorte:48213,numeroLoteria:48219,dataExtracao:'2026-10-10',teste:true});
 try{await enviarEmail({para,assunto:m.assunto,html:m.html,text:m.text,replyTo:CONTATO_PHENIX})}
 catch(e){return json({ok:false,mensagem:`Não foi possível enviar a prévia: ${e instanceof Error?e.message:String(e)}`},502)}
 return json({ok:true,para});
}

// Comunicado ao contemplado da apuração vigente, por e-mail ou WhatsApp (WAHA). Disparo manual pelo painel.
async function comunicarContemplado(req:Request,b:{apuracao_id?:unknown;canal?:unknown}){
 const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
 const admin=await exigirAdmin(req,db);if(admin instanceof Response)return admin;
 const canal=b.canal==='whatsapp'?'whatsapp':b.canal==='email'?'email':null;
 if(!canal||typeof b.apuracao_id!=='string')return json({ok:false,mensagem:'Informe a apuração e o canal (email ou whatsapp).'},400);
 const{data:ap,error:erroAp}=await db.from('promocao_veste_phenix_30_anos_apuracoes').select('id,numero_loteria,data_extracao,vencedor_inscricao_id,vencedor_numero_sorte,revertida_em').eq('id',b.apuracao_id).maybeSingle();
 if(erroAp)throw erroAp;
 if(!ap||ap.revertida_em)return json({ok:false,mensagem:'Apuração não encontrada ou revertida.'},404);
 const{data:insc,error:erroInsc}=await db.from('promocao_veste_phenix_30_anos').select('nome_completo,email,telefone,origem').eq('id',ap.vencedor_inscricao_id).maybeSingle();
 if(erroInsc)throw erroInsc;
 if(!insc)return json({ok:false,mensagem:'Inscrição do contemplado não encontrada.'},404);
 const c={nome:insc.nome_completo,email:insc.email,telefone:insc.telefone,numeroSorte:Number(ap.vencedor_numero_sorte),numeroLoteria:Number(ap.numero_loteria),dataExtracao:String(ap.data_extracao),teste:insc.origem==='formulario_teste'};
 try{
  if(canal==='email'){const m=emailContemplado(c);await enviarEmail({para:c.email,assunto:m.assunto,html:m.html,text:m.text,replyTo:CONTATO_PHENIX})}
  else await enviarWhatsApp(c.telefone,whatsappContemplado(c));
 }catch(e){
  const msg=e instanceof Error?e.message:String(e);console.error('comunicado contemplado',canal,msg);
  await db.from('promocao_veste_phenix_30_anos_apuracoes').update({comunicado_ultimo_erro:`${canal}: ${msg}`.slice(0,500)}).eq('id',ap.id);
  return json({ok:false,mensagem:`Não foi possível enviar pelo ${canal==='email'?'e-mail':'WhatsApp'}: ${msg}`},502);
 }
 const agora=new Date().toISOString();
 await db.from('promocao_veste_phenix_30_anos_apuracoes').update(canal==='email'?{comunicado_email_em:agora,comunicado_email_por:admin,comunicado_ultimo_erro:null}:{comunicado_whatsapp_em:agora,comunicado_whatsapp_por:admin,comunicado_ultimo_erro:null}).eq('id',ap.id);
 return json({ok:true,canal,enviado_em:agora});
}

// Ação do painel admin: reenvia as confirmações que falharam (ex.: cota diária do Gmail esgotada).
// Lote pequeno por chamada; para cedo se as primeiras falharem (cota ainda esgotada).
const LOTE_REENVIO=20;
async function reenviarEmails(req:Request){
 const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
 const admin=await exigirAdmin(req,db);if(admin instanceof Response)return admin;
 const{data:linhas,error}=await db.from('promocao_veste_phenix_30_anos_com_numeros').select('id,nome_completo,email,numeros_sorte,origem,email_tentativas').in('email_status',['falhou','aguardando_configuracao']).order('criado_em').limit(LOTE_REENVIO);
 if(error)throw error;
 let enviados=0,falharam=0;
 for(const l of linhas??[]){
  const ok=await enviarConfirmacao(db,{id:l.id,numeros_sorte:l.numeros_sorte,nome_completo:l.nome_completo,email:l.email,tentativa:(l.email_tentativas??0)+1},l.origem==='formulario_teste');
  if(ok)enviados++;else falharam++;
  if(!enviados&&falharam>=3)break;
 }
 const{count}=await db.from('promocao_veste_phenix_30_anos').select('id',{count:'exact',head:true}).in('email_status',['falhou','aguardando_configuracao']);
 return json({ok:true,enviados,falharam,restantes:count??0});
}

Deno.serve(async(req)=>{if(req.method==='OPTIONS')return new Response('ok',{headers:cors});if(req.method!=='POST')return json({ok:false,mensagem:'Método não permitido.'},405);
 try{const b=await req.json();if(b?.acao==='reenviar_emails')return await reenviarEmails(req);if(b?.acao==='comunicar_contemplado')return await comunicarContemplado(req,b);if(b?.acao==='previa_contemplado')return await previaContemplado(req,b);const cpf=String(b.cpf||'').replace(/\D/g,'');const cnpj=String(b.cnpj||'').replace(/\D/g,'');const agora=Date.now();const inicio=Date.parse('2026-10-06T00:00:00-03:00'),fim=Date.parse('2026-10-08T23:59:59-03:00');
  // O modo teste só vale antes da abertura: em 06/10 00:00 as inscrições passam a ser oficiais sozinhas,
  // e o cron limpar-testes-veste-phenix apaga as de teste no mesmo horário.
  const modoTeste=Deno.env.get('PROMO_MODO_TESTE')==='true'&&agora<inicio;
  if(!modoTeste&&Deno.env.get('PROMO_INSCRICOES_ATIVAS')!=='true')return json({ok:false,mensagem:'As inscrições ainda não estão abertas.'},403);if(!modoTeste&&(agora<inicio||agora>fim))return json({ok:false,mensagem:'Inscrição fora do período oficial da promoção.'},403);
  const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
  const ip=req.headers.get('cf-connecting-ip')||req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'';
  // Até 60 envios por minuto por conexão: o Wi-Fi da feira e o 4G (CGNAT) juntam muita gente num IP só;
  // o limite só freia disparo automático. Fraude real é barrada pelo limite por CPF e pelos documentos na entrega do prêmio.
  if(ip&&!await dentroDoLimite(db,`ip:${ip}`,60,60))return json({ok:false,mensagem:'Muitos cadastros a partir desta conexão em pouco tempo. Aguarde um minuto e tente novamente.'},429);
  // Teto por hora protege a cota diária do Gmail que envia as confirmações.
  if(ip&&!await dentroDoLimite(db,`iph:${ip}`,300,3600))return json({ok:false,mensagem:'Muitos cadastros a partir desta conexão. Aguarde alguns minutos e tente novamente.'},429);
  if(!limite(b.nome_completo,160)||!limite(b.email,254)||!limite(b.telefone,30)||!limite(b.empresa,160)||!limite(b.cargo,120)||!limite(b.cidade,120))return json({ok:false,mensagem:'Preencha os campos obrigatórios com tamanho válido.'},400);
  if(!b.maior_18||!b.aceite_regulamento||!b.aceite_privacidade)return json({ok:false,mensagem:'Aceites obrigatórios não confirmados.'},400);if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(b.email||'')))return json({ok:false,mensagem:'E-mail inválido.'},400);
  if(!cpfValido(cpf))return json({ok:false,mensagem:'CPF inválido.'},400);if(cnpj&&!cnpjValido(cnpj))return json({ok:false,mensagem:'CNPJ inválido.'},400);
  if(!UFS.has(String(b.uf||'').toUpperCase())||!SEGMENTOS.has(String(b.segmento||'')))return json({ok:false,mensagem:'Selecione o estado e o segmento da lista.'},400);
  if(!await dentroDoLimite(db,`cpf:${cpf}`,5,3600))return json({ok:false,mensagem:'Muitas tentativas para este CPF. Aguarde uma hora e tente novamente.'},429);
  // Evita usar o formulário para disparar e-mails a terceiros: até 3 inscrições por dia para o mesmo endereço.
  if(!await dentroDoLimite(db,`email:${String(b.email).trim().toLowerCase()}`,3,86400))return json({ok:false,mensagem:'Este e-mail atingiu o limite de inscrições de hoje. Use outro e-mail ou tente amanhã.'},429);
  const payload={p_nome_completo:String(b.nome_completo||'').trim(),p_cpf:cpf,p_email:String(b.email||'').trim().toLowerCase(),p_telefone:String(b.telefone||'').trim(),p_empresa:String(b.empresa||'').trim(),p_cnpj:cnpj||null,p_cargo:String(b.cargo||'').trim(),p_cidade:String(b.cidade||'').trim(),p_uf:String(b.uf||'').toUpperCase(),p_segmento:String(b.segmento||''),p_relacao_phenix:String(b.relacao_phenix||''),p_aceite_marketing:!!b.aceite_marketing,p_origem:modoTeste?'formulario_teste':'formulario_web'};
  const{data:linhas,error}=await db.rpc('inscrever_veste_phenix_completo',payload);
  if(error){if(error.code==='23505')return json({ok:false,mensagem:'Este CPF já possui uma inscrição e números da sorte.'},409);console.error(error);return json({ok:false,mensagem:'Não foi possível concluir a inscrição agora.'},500)}
  if(!linhas?.length)throw new Error('Inscrição não retornou números da sorte.');
  const inscricaoId=linhas[0].inscricao_id;const numeros=linhas.map((l:{numero_sorte:number})=>l.numero_sorte);
  EdgeRuntime.waitUntil(enviarConfirmacao(db,{id:inscricaoId,numeros_sorte:numeros,nome_completo:payload.p_nome_completo,email:payload.p_email},modoTeste));
  return json({ok:true,numeros_sorte:numeros},201)
 }catch(e){console.error(e);return json({ok:false,mensagem:'Não foi possível concluir a inscrição agora.'},500)}});
