// Fila offline do Cadastro de Máquinas: sem internet, o cadastro (novo ou alteração) fica guardado no
// aparelho e sobe sozinho quando a conexão volta (ao reconectar, a cada 30 s e ao abrir o Radar).
// Cada gravação leva um envio_id fixo; a função cadastro_maquinas_salvar_envio usa esse id para não gravar
// duas vezes se uma tentativa chegou ao servidor mas a resposta se perdeu.
// Uma máquina tem no máximo UMA entrada na fila: salvar de novo antes de subir substitui a entrada (o
// formulário já parte da versão da fila, então a última gravação contém tudo).
import { supabase } from '../supabaseClient'
import { erroDeRede, sessaoGuardada, comTempo } from '../offline'

const INTERVALO = 30 * 1000
const ouvintes = new Set()
let enviando = false
let iniciada = false

const chave = () => `maquinas:fila:${sessaoGuardada()?.user?.id || 'anon'}`
const ler = () => { try { const f = JSON.parse(localStorage.getItem(chave()) || '[]'); return Array.isArray(f) ? f : [] } catch { return [] } }
const gravar = (fila) => {
  try { localStorage.setItem(chave(), JSON.stringify(fila)) } catch { throw new Error('Sem espaço no aparelho para guardar o cadastro.') }
  avisar()
}
const avisar = () => { const e = estadoFila(); ouvintes.forEach((fn) => fn(e)) }

export function novoEnvioId() {
  if (crypto.randomUUID) return crypto.randomUUID()
  const b = crypto.getRandomValues(new Uint8Array(16)); b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

/** Id provisório da máquina nova que ainda não subiu (a tela usa como id até o banco dar o oficial). */
export const ID_PENDENTE = 'p:'
export const idPendente = (envioId) => `${ID_PENDENTE}${envioId}`
export const ehPendente = (id) => typeof id === 'string' && id.startsWith(ID_PENDENTE)

export function estadoFila() {
  const fila = ler()
  return { pendentes: fila.filter((i) => !i.recusado).length, recusados: fila.filter((i) => i.recusado), enviando }
}
export const filaAtual = () => ler()

export function assinarFila(fn) { ouvintes.add(fn); fn(estadoFila()); return () => ouvintes.delete(fn) }

/**
 * Grava uma entrada (envio) na fila. `entrada` = { envio_id, maquina, itens, removidos, cliente }.
 * Se a máquina já tem entrada (mesmo envio_id), substitui.
 */
export function enfileirar(entrada) {
  const resto = ler().filter((i) => i.envio_id !== entrada.envio_id)
  gravar([...resto, { ...entrada, guardadoEm: new Date().toISOString(), recusado: null }])
  iniciarFila()
}

export function descartar(envioId) { gravar(ler().filter((i) => i.envio_id !== envioId)) }

/** Envia uma gravação. { ok, id } | { temporario } (sem rede: tentar depois) | { mensagem } (recusada). */
export async function enviar(entrada) {
  if (!navigator.onLine) return { temporario: true }
  try {
    const { data, error } = await comTempo(supabase.rpc('cadastro_maquinas_salvar_envio', {
      p_envio_id: entrada.envio_id, p_maquina: entrada.maquina, p_itens: entrada.itens, p_removidos: entrada.removidos || [],
    }), 20000)
    if (!error) return { ok: true, id: data }
    // sem rede, servidor fora ou sessão vencida (renova sozinha quando a rede volta): tentar de novo
    if (erroDeRede(error) || !error.code || /^PGRST3/.test(error.code) || /JWT/i.test(error.message)) return { temporario: true }
    return { mensagem: error.message }
  } catch { return { temporario: true } }
}

export async function processarFila() {
  if (enviando || !navigator.onLine) return 0
  const pendentes = ler().filter((i) => !i.recusado)
  if (!pendentes.length) return 0
  enviando = true; avisar()
  let enviados = 0
  try {
    for (const item of pendentes) {
      const r = await enviar(item)
      if (r.temporario) break
      // relê a fila a cada passo: a tela pode ter salvo outra coisa nesse meio tempo
      if (r.ok) {
        const atual = ler().find((i) => i.envio_id === item.envio_id)
        // salvou de novo enquanto subia: a nova versão continua na fila, já com o id oficial
        if (atual && atual.guardadoEm !== item.guardadoEm) {
          gravar(ler().map((i) => (i.envio_id === item.envio_id ? { ...i, envio_id: novoEnvioId(), maquina: { ...i.maquina, id: r.id } } : i)))
        } else gravar(ler().filter((i) => i.envio_id !== item.envio_id))
        enviados++
      } else gravar(ler().map((i) => (i.envio_id === item.envio_id ? { ...i, recusado: r.mensagem } : i)))
    }
  } finally { enviando = false; avisar() }
  if (enviados) window.dispatchEvent(new CustomEvent('maquinas:fila-enviada', { detail: enviados }))
  return enviados
}

/** Liga o envio automático (uma vez por página). */
export function iniciarFila() {
  if (!iniciada) {
    iniciada = true
    window.addEventListener('online', () => processarFila())
    setInterval(() => processarFila(), INTERVALO)
  }
  processarFila()
}
