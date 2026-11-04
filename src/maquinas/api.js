// Cadastro de Máquinas e medidas: acesso ao Supabase. Regras (quem vê, prospect, IDs, sync) no banco;
// contrato em ../../01_Desktop/MWCadastroMaquinas/Docs/CADASTRO_MAQUINAS.md.
import { supabase } from '../supabaseClient'

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
export async function listarMaquinas() {
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

/** Busca na base de clientes (o RLS limita o representante à carteira). */
export async function buscarClientes(texto) {
  const t = texto.trim().replace(/[%,()]/g, ' ')
  if (t.length < 2) return []
  const { data, error } = await supabase.from('clientes')
    .select('codigo_cliente, cliente, cidade, uf')
    .or(`cliente.ilike.%${t}%,codigo_cliente.ilike.%${t}%,cidade.ilike.%${t}%`)
    .order('cliente').limit(20)
  falhou(error)
  return data || []
}

/** Vendas (NF de saída com medida) das empresas, a partir de uma data (null = vida toda). */
export async function listarVendas(codigosClientes, desde) {
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
  if (t.length < 2) return []
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
 * Grava a máquina e os itens: cria os novos, atualiza os alterados e desativa os removidos.
 * O banco preenche quem/quando e marca como pendente de envio ao CIGAM.
 */
export async function salvarMaquina(maquina, itens, removidos) {
  const dados = soCampos(maquina, CAMPOS_MAQUINA)
  let id = maquina.id
  if (id) {
    const { error } = await supabase.from('cadastro_maquinas').update(dados).eq('id', id)
    falhou(error)
  } else {
    const { data, error } = await supabase.from('cadastro_maquinas').insert(dados).select('id').single()
    falhou(error)
    id = data.id
  }
  const novos = itens.filter((i) => !i.id).map((i) => ({ ...soCampos(i, CAMPOS_ITEM), id_maquina: id }))
  if (novos.length) {
    const { error } = await supabase.from('cadastro_maquinas_itens').insert(novos)
    falhou(error)
  }
  for (const i of itens.filter((x) => x.id && x.alterado)) {
    const { error } = await supabase.from('cadastro_maquinas_itens').update(soCampos(i, CAMPOS_ITEM)).eq('id', i.id)
    falhou(error)
  }
  if (removidos.length) {
    const { error } = await supabase.from('cadastro_maquinas_itens').update({ ativo: false }).in('id', removidos)
    falhou(error)
  }
  return id
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
