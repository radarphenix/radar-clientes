// Cadastro de Máquinas e medidas: acesso ao Supabase. Regras (quem vê, prospect, IDs, sync) no banco;
// contrato em ../../01_Desktop/MWCadastroMaquinas/Docs/CADASTRO_MAQUINAS.md.
import { supabase } from '../supabaseClient'
import { erroDeRede, guardar, ler, sessaoGuardada, comTempo } from '../offline'
import { enviar, enfileirar, filaAtual, idPendente, ehPendente, novoEnvioId } from './fila'

const usuario = () => sessaoGuardada()?.user?.id || 'anon'
const CACHE_MAQUINAS = () => `maquinas:lista:${usuario()}`
const CACHE_CARTEIRA = () => `maquinas:carteira:${usuario()}`

export const PROSPECT = 'PROSPECT'

/** Nome da origem na tela (RADAR não aparece). Mesma lista do Oracle: 005_origem_agendor.sql. */
export const nomeOrigem = (o) => ({ FEIRA: 'feira', CIGAM: 'CIGAM', AGENDOR: 'Agendor CRM' })[o] || o

const CAMPOS_MAQUINA = ['codigo_cliente', 'nome_prospect', 'cidade_prospect', 'uf_prospect', 'contato_prospect', 'telefone_prospect',
  'nome_maquina', 'numero_maquina_pedido', 'tipo_papel', 'velocidade_maquina', 'observacoes']
const CAMPOS_ITEM = ['produto', 'nome_produto_outros', 'modelo', 'posicao', 'comprimento', 'largura', 'espessura', 'cfm',
  'gramatura', 'durabilidade', 'teflonada', 'observacoes']

function falhou(error) {
  if (error) throw new Error(error.message || 'Falha ao falar com o servidor.')
}

/** Mesmas variantes de código que o banco usa (radar_codigos_numericos_equivalentes): "46" = "000046". */
export function variantesCodigo(codigo) {
  const t = String(codigo || '').trim()
  const d = t.replace(/\D/g, '')
  const s = d.replace(/^0+/, '')
  return [...new Set([t, d, d && d.padStart(6, '0'), s, s && s.padStart(6, '0')].filter(Boolean))]
}
export const chaveCodigo = (codigo) => String(codigo || '').trim().replace(/\D/g, '').replace(/^0+/, '') || String(codigo || '').trim()

/** Nº da máquina comparável ("01" = "1"), igual a cadastro_maquinas_normalizar_numero no banco. */
export const normalizarNumero = (n) => String(n || '').replace(/\s/g, '').toUpperCase().replace(/^0+/, '')

export const pendenteSync = (r) => !r.sincronizado_em || new Date(r.atualizado_em) > new Date(r.sincronizado_em)

/** Máquinas que a pessoa enxerga (o RLS recorta a carteira), com os itens e o nome do cliente. */
async function listarMaquinasOnline() {
  const { data, error } = await supabase
    .from('cadastro_maquinas')
    .select('*, itens:cadastro_maquinas_itens(*)')
    .order('atualizado_em', { ascending: false })
  falhou(error)
  const codigos = [...new Set((data || []).filter((m) => m.codigo_cliente !== PROSPECT).map((m) => m.codigo_cliente))]
  const nomes = new Map()
  for (let i = 0; i < codigos.length; i += 200) {
    const { data: cl, error: e2 } = await supabase.from('clientes')
      .select('codigo_cliente, cliente, cidade, uf, codigo_representante').in('codigo_cliente', codigos.slice(i, i + 200))
    falhou(e2)
    for (const c of cl || []) nomes.set(String(c.codigo_cliente), c)
  }
  return (data || []).map((m) => ({
    ...m,
    cliente: m.codigo_cliente === PROSPECT ? null : nomes.get(String(m.codigo_cliente)) || null,
    itens: (m.itens || []).sort((a, b) => a.id - b.id),
  }))
}

/**
 * Máquinas para a tela. Com internet, lê do banco e guarda uma cópia no aparelho; sem internet, usa a cópia
 * (a lista volta com `offlineEm` = data da cópia). Nos dois casos, o que está na fila de envio aparece por cima.
 */
export async function listarMaquinas() {
  let lista
  try {
    lista = await comTempo(listarMaquinasOnline(), 15000)
    guardar(CACHE_MAQUINAS(), lista)
  } catch (e) {
    if (!erroDeRede(e)) throw e
    const copia = await ler(CACHE_MAQUINAS())
    if (!copia) throw new Error('Sem internet e sem cópia das máquinas neste aparelho. Abra esta tela uma vez com internet.', { cause: e })
    lista = copia.valor
    lista.offlineEm = copia.em
  }
  const comFila = aplicarFila(lista)
  comFila.offlineEm = lista.offlineEm
  return comFila
}

/** Põe por cima da lista o que ainda está na fila (máquina nova com id provisório, alterações, itens). */
export function aplicarFila(lista) {
  const fila = filaAtual()
  if (!fila.length) return lista
  const porId = new Map(lista.map((m) => [m.id, m]))
  const novas = []
  for (const e of fila) {
    const original = e.maquina.id ? porId.get(e.maquina.id) : null
    if (e.maquina.id && !original) continue   // some da lista (sem acesso): não inventa
    const removidos = new Set(e.removidos || [])
    const enviados = new Map((e.itens || []).filter((i) => i.id).map((i) => [i.id, i]))
    const itens = [
      ...(original?.itens || []).map((i) => (removidos.has(i.id) ? { ...i, ativo: false } : enviados.has(i.id) ? { ...i, ...enviados.get(i.id), alterado: true } : i)),
      ...(e.itens || []).filter((i) => !i.id).map((i, n) => ({ ...i, ativo: true, chave: `f${e.envio_id}-${n}` })),
    ]
    const m = {
      ...(original || { origem: 'RADAR', ativo: true, criado_em: e.guardadoEm }),
      ...e.maquina,
      id: e.maquina.id || idPendente(e.envio_id),
      cliente: e.cliente ?? original?.cliente ?? null,
      itens,
      atualizado_em: e.guardadoEm,
      envioPendente: e.envio_id,
      envioRecusado: e.recusado || null,
    }
    if (original) porId.set(m.id, m); else novas.push(m)
  }
  return [...novas, ...lista.map((m) => porId.get(m.id))]
}

/** Clientes da carteira guardados no aparelho, para a busca funcionar sem internet (no máx. 1x a cada 6 h). */
export async function atualizarCarteira(forcar = false) {
  const copia = await ler(CACHE_CARTEIRA())
  if (!forcar && copia && Date.now() - new Date(copia.em).getTime() < 6 * 3600 * 1000) return
  const todos = []
  for (let de = 0; ; de += 1000) {
    const { data, error } = await supabase.from('clientes').select('codigo_cliente, cliente, cidade, uf').order('cliente').range(de, de + 999)
    if (error) return
    todos.push(...(data || []))
    if (!data || data.length < 1000) break
  }
  await guardar(CACHE_CARTEIRA(), todos)
}

const semAcento = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** Busca na base de clientes (o RLS limita o representante à carteira); sem internet, na cópia do aparelho. */
export async function buscarClientes(texto) {
  const t = texto.trim().replace(/[%,()]/g, ' ')
  if (t.length < 2) return []
  if (!navigator.onLine) return buscarClientesCopia(t)
  try { return await comTempo(buscarClientesOnline(t)) } catch (e) { if (erroDeRede(e)) return buscarClientesCopia(t); throw e }
}

async function buscarClientesCopia(t) {
  const copia = await ler(CACHE_CARTEIRA())
  const q = semAcento(t)
  return (copia?.valor || []).filter((c) => [c.cliente, c.codigo_cliente, c.cidade].some((v) => semAcento(v).includes(q))).slice(0, 20)
}

async function buscarClientesOnline(t) {
  const { data, error } = await supabase.from('clientes')
    .select('codigo_cliente, cliente, cidade, uf')
    .or(`cliente.ilike.%${t}%,codigo_cliente.ilike.%${t}%,cidade.ilike.%${t}%`)
    .order('cliente').limit(20)
  falhou(error)
  return data || []
}

/** Vendas (NF de saída com medida) das empresas, a partir de uma data (null = vida toda). */
export async function listarVendas(codigosClientes, desde) {
  if (!navigator.onLine) return []
  const codigos = [...new Set(codigosClientes.flatMap(variantesCodigo))]
  if (!codigos.length) return []
  const todas = []
  for (let i = 0; i < codigos.length; i += 200) {
    let q = supabase.from('cadastro_maquinas_vendas').select('*').in('codigo_cliente', codigos.slice(i, i + 200))
      .order('data_venda', { ascending: false }).limit(2000)
    if (desde) q = q.gte('data_venda', desde)
    const { data, error } = await q
    falhou(error)
    todas.push(...(data || []))
  }
  return todas.sort((a, b) => (a.data_venda < b.data_venda ? 1 : -1))
}

/** Vendas pelo nome ou código da empresa digitado na busca: acha empresas que ainda não têm máquina cadastrada. */
export async function buscarVendasPorEmpresa(texto, desde) {
  const t = texto.trim().replace(/[%,()]/g, ' ')
  if (t.length < 2 || !navigator.onLine) return []
  let q = supabase.from('cadastro_maquinas_vendas').select('*')
    .or(`nome_cliente.ilike.%${t}%,codigo_cliente.ilike.%${t}%`)
    .order('data_venda', { ascending: false }).limit(2000)
  if (desde) q = q.gte('data_venda', desde)
  const { data, error } = await q
  falhou(error)
  return data || []
}

const soCampos =(obj, campos) => Object.fromEntries(campos.map((k) => [k, obj[k] === '' || obj[k] === undefined ? null : obj[k]]))

/**
 * Grava a máquina e os itens numa só transação (cadastro_maquinas_salvar_envio): cria os novos, atualiza os
 * alterados e desativa os removidos. Sem internet, guarda na fila do aparelho e devolve { pendente: true }.
 * `envioId`: o da entrada que já está na fila (salvar de novo antes de subir substitui a entrada).
 */
export async function salvarMaquina(maquina, itens, removidos, { envioId, cliente } = {}) {
  const entrada = {
    envio_id: envioId || novoEnvioId(),
    maquina: { ...soCampos(maquina, CAMPOS_MAQUINA), id: ehPendente(maquina.id) ? null : maquina.id || null },
    itens: itens.filter((i) => !i.id || i.alterado).map((i) => ({ ...soCampos(i, CAMPOS_ITEM), id: i.id || null })),
    removidos,
    cliente: cliente || null,
  }
  // já tem versão na fila: substitui e deixa a fila subir na ordem (não fura a fila)
  const naFila = envioId && filaAtual().some((e) => e.envio_id === envioId)
  const r = naFila ? { temporario: true } : await enviar(entrada)
  if (r.ok) return { id: r.id }
  if (r.mensagem) throw new Error(r.mensagem)
  enfileirar(entrada)
  return { id: entrada.maquina.id || idPendente(entrada.envio_id), pendente: true }
}

export async function definirAtivo(id, ativo) {
  const { error } = await supabase.from('cadastro_maquinas').update({ ativo }).eq('id', id)
  falhou(error)
}

export async function statusSync() {
  const { data, error } = await supabase.from('cadastro_maquinas_sync_status').select('*').eq('id', 1).maybeSingle()
  falhou(error)
  return data
}

export async function solicitarSync() {
  const { data, error } = await supabase.rpc('cadastro_maquinas_solicitar_sync')
  falhou(error)
  return data
}

export async function importarFeira() {
  const { data, error } = await supabase.rpc('cadastro_maquinas_importar_feira')
  falhou(error)
  return data
}

/** Sync online = rodou dentro do intervalo combinado (mais 10 min de folga). */
export function syncOnline(st, agora = Date.now()) {
  if (!st?.ultima_execucao) return false
  return agora - new Date(st.ultima_execucao).getTime() <= ((st.intervalo_minutos || 30) + 10) * 60000
}

// ---------------------------------------------------------------- números (vírgula na tela, ponto no banco)
export function paraNumero(texto) {
  const t = String(texto ?? '').trim().replace(/\s/g, '')
  if (!t) return null
  const n = Number(t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : t)
  return Number.isFinite(n) ? n : NaN
}
export function formatarNumero(n, casas = 3) {
  if (n === null || n === undefined || n === '') return ''
  return Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: casas })
}
