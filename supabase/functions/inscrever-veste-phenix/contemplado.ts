// Comunicado ao contemplado da promoção Veste Phenix 30 anos: e-mail e WhatsApp (WAHA).
// Disparado manualmente pelo painel admin (ação comunicar_contemplado da Edge Function).

const SITE = 'https://radarphenix.pages.dev'
export const CONTATO_PHENIX = 'phenix@phenixonline.com.br'

export type Contemplado = {
  nome: string
  email: string
  telefone: string
  numeroSorte: number
  numeroLoteria: number
  dataExtracao: string // AAAA-MM-DD
  teste: boolean
}

const esc = (v: string) => v.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c))
const cinco = (n: number) => String(n).padStart(5, '0')
const primeiroNome = (nome: string) => nome.trim().split(/\s+/)[0] || nome
const dataBr = (iso: string) => { const [a, m, d] = iso.slice(0, 10).split('-'); return `${d}/${m}/${a}` }

export function emailContemplado(c: Contemplado) {
  const assunto = `${c.teste ? '[TESTE] ' : ''}Parabéns! Você foi contemplado na promoção Veste Phenix 30 anos`
  const p = (t: string, extra = '') => `<p style="margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:23px;color:#29425a;${extra}">${t}</p>`
  const caixa = (borda: string, fundo: string, titulo: string, corpo: string) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="background:${fundo};border-left:4px solid ${borda};border-radius:8px;padding:18px 20px"><div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#0b3558;margin:0 0 8px">${titulo}</div>${corpo}</td></tr></table>`
  const item = (n: number, t: string) => `<tr><td valign="top" style="width:28px;padding:0 0 10px"><div style="width:22px;height:22px;border-radius:11px;background:#0e5886;color:#fff;font:bold 12px/22px Arial,Helvetica,sans-serif;text-align:center">${n}</div></td><td style="padding:1px 0 10px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:21px;color:#29425a">${t}</td></tr>`
  const avisoTeste = c.teste ? `<tr><td class="px" style="padding:0 32px 12px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="background:#fff3d7;border-radius:10px;padding:12px 16px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:19px;color:#754508;font-weight:bold;text-align:center">AMBIENTE DE TESTE — comunicado de homologação, sem validade.</td></tr></table></td></tr>` : ''
  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><title>${esc(assunto)}</title>
<style>@media (max-width:520px){.card{width:100%!important}.px{padding-left:18px!important;padding-right:18px!important}h1{font-size:22px!important}.numero{font-size:34px!important}.selo{letter-spacing:1px!important;font-size:11px!important}}</style></head>
<body style="margin:0;padding:0;background:#062d55">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#062d55">Seu número da sorte ${cinco(c.numeroSorte)} foi o contemplado. Responda em até 10 dias úteis.</div>
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
<h1 style="margin:0 0 10px;font-family:Arial,Helvetica,sans-serif;font-size:26px;line-height:32px;color:#0b3558">Parabéns, ${esc(primeiroNome(c.nome))}!</h1>
${p(`Você foi o <b>contemplado</b> da promoção <b>Veste Phenix 30 anos</b>. O seu número da sorte foi o mais próximo do número do 1º prêmio da Loteria Federal de <b>${dataBr(c.dataExtracao)}</b>.`)}
</td></tr>
<tr><td class="px" align="center" style="padding:6px 32px 22px">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td align="center" style="background:#062d55;border-radius:14px;padding:16px 28px">
<div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:2px;font-weight:bold;color:#8ed7e8">SEU NÚMERO DA SORTE</div>
<div class="numero" style="font-family:Arial,Helvetica,sans-serif;font-size:42px;line-height:50px;font-weight:bold;color:#f4b13b;letter-spacing:3px">${cinco(c.numeroSorte)}</div>
<div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#c5d0d8">Número apurado na Loteria Federal: ${cinco(c.numeroLoteria)}</div>
</td></tr></table>
</td></tr>
<tr><td class="px" style="padding:0 32px">${caixa('#f4b13b', '#fdf6e7', 'O seu prêmio', p('Experiência técnica comemorativa Phenix 30 anos no Rio Grande do Sul, de 3 dias e 2 noites, com despesas pagas para você e um acompanhante, incluindo <b>passeio de balão</b>, conforme o regulamento.', 'font-size:14px;line-height:21px;margin:0'))}</td></tr>
<tr><td class="px" style="padding:16px 32px 0">${caixa('#0e5886', '#f1f6fa', 'Próximos passos', `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
${item(1, `<b>Responda este e-mail em até 10 dias úteis</b> confirmando o seu interesse. Sem resposta nesse prazo, o regulamento prevê a perda do direito ao prêmio.`)}
${item(2, 'Separe os documentos: documento de identificação, CPF, comprovante de vínculo com a empresa informada na inscrição e, quando aplicável, autorização da empresa.')}
${item(3, 'A Phenix enviará os termos para assinatura (recebimento do prêmio, uso de imagem e ciência sobre o passeio de balão).')}
${item(4, 'A data da experiência será combinada com você, com usufruto até <b>30/06/2027</b>, conforme a disponibilidade e as condições climáticas.')}
</table>`)}</td></tr>
<tr><td align="center" style="padding:28px 32px 32px">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" bgcolor="#0e5886" style="border-radius:10px;background:#0e5886">
<a href="${SITE}/regulamento.pdf?v=20261001b" target="_blank" style="display:inline-block;padding:13px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:10px">Ler o regulamento</a>
</td></tr></table>
</td></tr>
<tr><td bgcolor="#eef3f7" style="background:#eef3f7;padding:20px 32px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#5b6f82;text-align:center">
Dúvidas? Responda este e-mail ou escreva para <a href="mailto:${CONTATO_PHENIX}" style="color:#0e5886">${CONTATO_PHENIX}</a><br><br>
Phenix Indústria e Comércio de Filtros LTDA · CNPJ 01.170.987/0001-55 · Arroio do Sal/RS
</td></tr>
</table>
</td></tr></table>
</body></html>`
  const text = [
    c.teste ? '[AMBIENTE DE TESTE - comunicado de homologação, sem validade.]\n' : '',
    `Parabéns, ${primeiroNome(c.nome)}!`, '',
    `Você foi o contemplado da promoção Veste Phenix 30 anos. Seu número da sorte ${cinco(c.numeroSorte)} foi o mais próximo do 1º prêmio da Loteria Federal de ${dataBr(c.dataExtracao)} (número apurado ${cinco(c.numeroLoteria)}).`, '',
    'Prêmio: experiência técnica comemorativa Phenix 30 anos no Rio Grande do Sul, de 3 dias e 2 noites, com despesas pagas para você e um acompanhante, incluindo passeio de balão, conforme o regulamento.', '',
    'Próximos passos:',
    '1. Responda este e-mail em até 10 dias úteis confirmando o seu interesse. Sem resposta nesse prazo, o regulamento prevê a perda do direito ao prêmio.',
    '2. Separe os documentos: identificação, CPF, comprovante de vínculo com a empresa informada na inscrição e, quando aplicável, autorização da empresa.',
    '3. A Phenix enviará os termos para assinatura (recebimento do prêmio, uso de imagem e ciência sobre o passeio de balão).',
    '4. A data da experiência será combinada com você, com usufruto até 30/06/2027.', '',
    `Regulamento: ${SITE}/regulamento.pdf?v=20261001b`,
    `Dúvidas: ${CONTATO_PHENIX}`, '',
    'Phenix Indústria e Comércio de Filtros LTDA · CNPJ 01.170.987/0001-55 · Arroio do Sal/RS',
  ].join('\n')
  return { assunto, html, text }
}

export function whatsappContemplado(c: Contemplado) {
  return [
    c.teste ? '[TESTE — mensagem de homologação, sem validade]\n' : '',
    `🎉 *Parabéns, ${primeiroNome(c.nome)}!*`, '',
    `Você foi o contemplado da promoção *Veste Phenix 30 anos*! Seu número da sorte *${cinco(c.numeroSorte)}* foi o mais próximo do 1º prêmio da Loteria Federal de ${dataBr(c.dataExtracao)} (número apurado ${cinco(c.numeroLoteria)}).`, '',
    `Enviamos para ${c.email} um e-mail com os próximos passos e os documentos necessários. Para garantir o prêmio, responda em até *10 dias úteis*.`, '',
    `Dúvidas: ${CONTATO_PHENIX}`,
    'Phenix — Tecendo Facilidades',
  ].join('\n').trim()
}

// Envio pelo WAHA (mesma API do MW_Aniversarios). check-exists é obrigatório: números brasileiros
// com o 9º dígito podem ter outro chatId, e enviar sem resolver "funciona" mas a mensagem não chega.
export async function enviarWhatsApp(telefone: string, texto: string) {
  const base = (Deno.env.get('WAHA_BASE_URL') || '').replace(/\/+$/, '')
  const chave = Deno.env.get('WAHA_API_KEY') || ''
  const sessao = Deno.env.get('WAHA_SESSAO') || 'default'
  if (!base || !chave) throw new Error('WhatsApp (WAHA) não configurado no servidor: faltam WAHA_BASE_URL e WAHA_API_KEY.')
  const digitos = telefone.replace(/\D/g, '')
  const numero = digitos.startsWith('55') && digitos.length > 11 ? digitos : `55${digitos}`
  const cabecalhos = { 'X-Api-Key': chave, Accept: 'application/json', 'Content-Type': 'application/json' }
  const r1 = await fetch(`${base}/api/contacts/check-exists?phone=${encodeURIComponent(numero)}&session=${encodeURIComponent(sessao)}`, { headers: cabecalhos, signal: AbortSignal.timeout(20000) })
  if (!r1.ok) throw new Error(`WAHA respondeu ${r1.status} ao conferir o número.`)
  const existe = await r1.json()
  if (!existe?.numberExists || !existe?.chatId) throw new Error(`O número ${telefone} não tem WhatsApp ativo.`)
  const r2 = await fetch(`${base}/api/sendText`, { method: 'POST', headers: cabecalhos, body: JSON.stringify({ session: sessao, chatId: existe.chatId, text: texto }), signal: AbortSignal.timeout(20000) })
  if (!r2.ok) throw new Error(`WAHA respondeu ${r2.status} ao enviar a mensagem.`)
}
