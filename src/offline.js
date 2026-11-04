// Radar sem internet: o mínimo para abrir o app e usar telas que funcionam offline (Cadastro de Máquinas).
//  - sessão: sem rede e com o token vencido (dura 1 h), o Supabase devolve sessão nula mas MANTÉM a sessão
//    guardada no aparelho (erro de rede não apaga). Usamos essa cópia só para a tela; quando a rede volta,
//    o próprio Supabase renova o token e tudo segue normal.
//  - perfil: cópia do perfil + acessos do último login com internet (sai ao clicar em Sair).
//  - guardar/ler: cache de listas no IndexedDB (cabe muito mais que o localStorage).
import { supabaseUrl } from './supabaseClient'

const CHAVE_SESSAO = `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`
const CHAVE_PERFIL = 'radar:perfilOffline'

/** Falha de conexão (sem rede, servidor inalcançável), e não recusa do servidor. */
export function erroDeRede(error) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return true
  if (!error) return false
  const msg = String(error.message || error)
  return error.name === 'AuthRetryableFetchError' || /failed to fetch|networkerror|load failed|network request failed|fetch/i.test(msg)
}

/**
 * Espera a promessa no máximo `ms`; passado isso falha como erro de rede. Sem rede, falha na hora.
 * (Com o token vencido e sem rede, toda consulta do Supabase espera ~30 s a renovação antes de falhar.)
 */
export function comTempo(promessa, ms = 8000) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return Promise.reject(new Error('Failed to fetch (sem internet)'))
  return Promise.race([promessa, new Promise((_, erro) => setTimeout(() => erro(new Error('Failed to fetch (sem resposta)')), ms))])
}

/** Sessão guardada no aparelho (para o modo offline). */
export function sessaoGuardada() {
  try {
    const s = JSON.parse(localStorage.getItem(CHAVE_SESSAO) || 'null')
    return s?.user?.id ? s : null
  } catch { return null }
}

export function guardarPerfil(userId, perfil, permissoes) {
  try { localStorage.setItem(CHAVE_PERFIL, JSON.stringify({ userId, perfil, permissoes: [...permissoes], em: new Date().toISOString() })) } catch { /* sem espaço */ }
}

export function perfilGuardado(userId) {
  try {
    const p = JSON.parse(localStorage.getItem(CHAVE_PERFIL) || 'null')
    return p?.userId === userId ? p : null
  } catch { return null }
}

export function esquecerPerfil() {
  try { localStorage.removeItem(CHAVE_PERFIL) } catch { /* nada */ }
}

// ------------------------------------------------------------------ cache de listas (IndexedDB)
let banco
function abrir() {
  banco ||= new Promise((ok, erro) => {
    const r = indexedDB.open('radar-offline', 1)
    r.onupgradeneeded = () => r.result.createObjectStore('cache')
    r.onsuccess = () => ok(r.result)
    r.onerror = () => erro(r.error)
  })
  return banco
}

export async function guardar(chave, valor) {
  try {
    const db = await abrir()
    await new Promise((ok, erro) => { const t = db.transaction('cache', 'readwrite'); t.objectStore('cache').put({ valor, em: new Date().toISOString() }, chave); t.oncomplete = ok; t.onerror = () => erro(t.error) })
  } catch { /* sem IndexedDB: só não fica offline */ }
}

/** { valor, em } ou null. */
export async function ler(chave) {
  try {
    const db = await abrir()
    return await new Promise((ok, erro) => { const r = db.transaction('cache').objectStore('cache').get(chave); r.onsuccess = () => ok(r.result || null); r.onerror = () => erro(r.error) })
  } catch { return null }
}

export async function limparCache() {
  try {
    const db = await abrir()
    await new Promise((ok) => { const t = db.transaction('cache', 'readwrite'); t.objectStore('cache').clear(); t.oncomplete = ok; t.onerror = ok })
  } catch { /* nada */ }
}
