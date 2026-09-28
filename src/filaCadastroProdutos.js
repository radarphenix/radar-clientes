import { supabase } from './supabaseClient'

// Fila offline do cadastro de produtos da feira: sem internet (ou servidor fora), o cadastro fica
// guardado no aparelho e é enviado sozinho quando a conexão volta. Cada envio leva um envio_id
// fixo; a Edge Function usa esse id para não gravar duas vezes o mesmo cadastro se uma tentativa
// anterior chegou ao servidor mas a resposta se perdeu.
const CHAVE_FILA = 'cadastroProdutosFeira:fila'
const INTERVALO_REENVIO = 30 * 1000
const ouvintes = new Set()
let enviando = false
let iniciada = false

const ler = () => { try { const f = JSON.parse(localStorage.getItem(CHAVE_FILA) || '[]'); return Array.isArray(f) ? f : [] } catch { return [] } }
const gravar = fila => { try { localStorage.setItem(CHAVE_FILA, JSON.stringify(fila)) } catch { /* armazenamento indisponível */ } avisar() }
const avisar = () => { const estado = estadoFila(); ouvintes.forEach(fn => fn(estado)) }

export function novoEnvioId() {
  if (crypto.randomUUID) return crypto.randomUUID()
  const b = crypto.getRandomValues(new Uint8Array(16)); b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128
  const h = [...b].map(x => x.toString(16).padStart(2, '0')).join('')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

export function estadoFila() {
  const fila = ler()
  return { pendentes: fila.filter(i => !i.recusado).length, recusados: fila.filter(i => i.recusado), enviando }
}

export function assinarFila(fn) { ouvintes.add(fn); fn(estadoFila()); return () => ouvintes.delete(fn) }

// Envia um cadastro. Resultado: { ok } | { temporario } (sem rede / servidor fora: pode tentar de novo)
// | { mensagem } (recusado pelo servidor: tentar de novo não adianta).
export async function enviarCadastro(body) {
  if (!navigator.onLine) return { temporario: true }
  try {
    const { data, error } = await supabase.functions.invoke('cadastrar-produto-feira', { body })
    if (!error) return { ok: true, data }
    const status = error.context?.status
    if (error.name !== 'FunctionsHttpError' || !status || status >= 500) return { temporario: true }
    let mensagem = 'O cadastro foi recusado pelo servidor.'
    try { const corpo = await error.context.json(); if (corpo?.mensagem) mensagem = corpo.mensagem } catch { /* sem JSON */ }
    return { mensagem }
  } catch { return { temporario: true } }
}

export function enfileirar(body) { gravar([...ler(), { id: body.envio_id, body, guardadoEm: new Date().toISOString() }]); iniciarFila() }

export async function processarFila() {
  if (enviando || !navigator.onLine) return
  const pendentes = ler().filter(i => !i.recusado)
  if (!pendentes.length) return
  enviando = true; avisar()
  try {
    for (const item of pendentes) {
      const r = await enviarCadastro(item.body)
      if (r.temporario) break
      // Lê de novo a fila a cada passo: outra tela pode ter enfileirado algo nesse meio tempo.
      gravar(r.ok ? ler().filter(i => i.id !== item.id) : ler().map(i => i.id === item.id ? { ...i, recusado: r.mensagem } : i))
    }
  } finally { enviando = false; avisar() }
}

export function descartarRecusado(id) { gravar(ler().filter(i => i.id !== id)) }

export function iniciarFila() {
  if (iniciada) { processarFila(); return }
  iniciada = true
  window.addEventListener('online', processarFila)
  setInterval(processarFila, INTERVALO_REENVIO)
  processarFila()
}
