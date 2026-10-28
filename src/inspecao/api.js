// Acesso a dados da Inspeção de Qualidade (Supabase + funções inspecao-*).
// Equivale ao InspecaoRepositorio.cs do desktop: pasta -> tabelas, .editando -> colunas editando_*.
import { supabase, supabaseUrl, supabaseAnonKey } from '../supabaseClient'
import { TITULOS_PADRAO, colunasDeBusca, completarFabricanteSaida, novaInspecao } from './modelo'

export { supabase }
const FUNCOES = `${supabaseUrl}/functions/v1`
const VALIDADE_TRAVA_MIN = 10

function falhou(error) {
  if (error) throw new Error(error.message || String(error))
}

export async function papelAtual() {
  const { data, error } = await supabase.rpc('inspecao_papel_atual')
  falhou(error)
  return data || null
}

// ------------------------------------------------------------------ lista
export async function listar() {
  const { data, error } = await supabase.from('inspecoes')
    .select('id, numero, cliente, cd_cliente, nota_fiscal, produto, data_inspecao, finalizado, revisao, enviado_email_em, editando_por, editando_nome, editando_ate, alterado_em')
    .is('excluido_em', null).order('numero', { ascending: false })
  falhou(error)
  return data
}

/** Cria a inspeção com os 9 itens padrão. Se outro computador pegou o mesmo número no mesmo
 *  segundo, acrescenta -2, -3... (como CriarNova() do desktop). */
export async function criar(nomeUsuario) {
  const base = novaInspecao(nomeUsuario)
  // nasce com os tipos marcados como padrão no cadastro (sem cadastro: a lista fixa do desktop)
  const tipos = await listarTipos().catch(() => [])
  const titulosPadrao = tipos.length ? tipos.filter((t) => t.padrao && t.ativo).map((t) => t.nome) : TITULOS_PADRAO
  for (let n = 1; n < 20; n++) {
    const numero = n === 1 ? base.numero : `${base.numero}-${n}`
    const { data, error } = await supabase.from('inspecoes').insert({ ...base, numero, ...colunasDeBusca(base) }).select().single()
    if (error?.code === '23505') continue
    falhou(error)
    const { error: e2 } = await supabase.from('inspecao_detalhamentos')
      .insert(titulosPadrao.map((titulo, ordem) => ({ inspecao_id: data.id, titulo, ordem })))
    falhou(e2)
    return data
  }
  throw new Error('Não foi possível reservar um número para a inspeção.')
}

export async function carregar(id) {
  const [ins, dets, fotos] = await Promise.all([
    supabase.from('inspecoes').select('*').eq('id', id).single(),
    supabase.from('inspecao_detalhamentos').select('*').eq('inspecao_id', id).order('ordem'),
    supabase.from('inspecao_fotos').select('*').eq('inspecao_id', id).eq('removida', false).order('ordem'),
  ])
  falhou(ins.error); falhou(dets.error); falhou(fotos.error)
  const porDet = {}
  for (const f of fotos.data) (porDet[f.detalhamento_id] ||= []).push(f)
  return { ins: ins.data, dets: dets.data, fotos: porDet }
}

// ------------------------------------------------------------------ gravação
/** Grava a inspeção. Alterar depois de reabrir abre a próxima revisão (regra do desktop). */
export async function salvar(ins, dets, alterou) {
  let revisao = ins.revisao
  if (alterou && !ins.finalizado && revisao <= ins.ultima_revisao_finalizada) revisao = ins.ultima_revisao_finalizada + 1
  const saida = completarFabricanteSaida(ins)
  const { data: { user } } = await supabase.auth.getUser()
  const campos = {
    titulo: ins.titulo, dados_gerais: ins.dados_gerais, informacoes_tecnicas: ins.informacoes_tecnicas,
    informacoes_tecnicas_saida: saida, conclusao: ins.conclusao, elaborado_por: ins.elaborado_por,
    aprovado_por: ins.aprovado_por, setor: ins.setor, revisao, ...colunasDeBusca(ins),
    alterado_em: new Date().toISOString(), alterado_por: user?.id,
  }
  // itens ANTES da inspeção: a gravação da inspeção avisa as telas abertas (ao vivo), e quem
  // relê nesse instante tem que encontrar os itens já gravados (senão via o texto antigo)
  if (dets) {
    const { error: e2 } = await supabase.from('inspecao_detalhamentos')
      .upsert(dets.map((d, ordem) => ({ id: d.id, inspecao_id: ins.id, titulo: d.titulo, texto: d.texto, ordem })))
    falhou(e2)
  }
  const { error } = await supabase.from('inspecoes').update(campos).eq('id', ins.id)
  falhou(error)
  return { ...ins, ...campos }
}

export async function novoDetalhamento(inspecaoId, titulo, ordem) {
  const { data, error } = await supabase.from('inspecao_detalhamentos').insert({ inspecao_id: inspecaoId, titulo, ordem }).select().single()
  falhou(error)
  return data
}

export async function excluirDetalhamento(id) {
  const { error } = await supabase.from('inspecao_detalhamentos').delete().eq('id', id)
  falhou(error)
}

// ------------------------------------------------------------------ fotos
/** Reduz no navegador (lado máx. 1600 px, JPEG 85%, rotação do celular aplicada), como o desktop. */
export async function reduzirFoto(arquivo, lado = 1600) {
  const bmp = await createImageBitmap(arquivo, { imageOrientation: 'from-image' })
  const e = Math.min(1, lado / Math.max(bmp.width, bmp.height))
  const w = Math.round(bmp.width * e), h = Math.round(bmp.height * e)
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  c.getContext('2d').drawImage(bmp, 0, 0, w, h)
  const blob = await new Promise((ok) => c.toBlob(ok, 'image/jpeg', 0.85))
  return { blob, w, h }
}

async function cabecalhos() {
  const { data: { session } } = await supabase.auth.getSession()
  return { Authorization: `Bearer ${session?.access_token}`, apikey: supabaseAnonKey }
}

async function respostaJson(r) {
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(j.error || `Erro ${r.status}`)
  return j
}

export async function enviarFoto(inspecaoId, detalhamentoId, arquivo, legenda = '', origem = 'upload') {
  const { blob, w, h } = await reduzirFoto(arquivo)
  const form = new FormData()
  form.append('inspecao_id', inspecaoId)
  form.append('detalhamento_id', detalhamentoId)
  form.append('largura', w); form.append('altura', h)
  form.append('legenda', legenda); form.append('origem', origem)
  form.append('arquivo', blob, 'foto.jpg')
  return (await respostaJson(await fetch(`${FUNCOES}/inspecao-arquivos`, { method: 'POST', headers: await cabecalhos(), body: form }))).foto
}

const cacheFotos = new Map()
/** URL local (blob) da foto: o Drive é privado, a função confere o acesso e entrega a imagem. */
export function urlFoto(fotoId) {
  if (!cacheFotos.has(fotoId)) {
    cacheFotos.set(fotoId, (async () => {
      const r = await fetch(`${FUNCOES}/inspecao-arquivos?foto=${fotoId}`, { headers: await cabecalhos() })
      if (!r.ok) { cacheFotos.delete(fotoId); throw new Error(`Foto indisponível (${r.status})`) }
      return URL.createObjectURL(await r.blob())
    })())
  }
  return cacheFotos.get(fotoId)
}

/** Grava ordem, item e legenda das fotos de um ou mais itens. */
export async function salvarFotos(lista) {
  if (!lista.length) return
  const { error } = await supabase.from('inspecao_fotos')
    .upsert(lista.map((f) => ({ id: f.id, inspecao_id: f.inspecao_id, detalhamento_id: f.detalhamento_id, ordem: f.ordem, legenda: f.legenda || '' })))
  falhou(error)
}

/** Tira a foto do relatório sem apagar o arquivo (revisões antigas continuam a encontrar). */
export async function removerFoto(id) {
  const { error } = await supabase.from('inspecao_fotos').update({ removida: true }).eq('id', id)
  falhou(error)
}

// ------------------------------------------------------------------ trava de edição
/** Trava para mim. Devolve null se consegui, ou o nome de quem está editando. */
export async function tentarTravar(id, meuNome) {
  const { data: { user } } = await supabase.auth.getUser()
  const agora = new Date()
  const ate = new Date(agora.getTime() + VALIDADE_TRAVA_MIN * 60000).toISOString()
  const { data, error } = await supabase.from('inspecoes')
    .update({ editando_por: user.id, editando_nome: meuNome, editando_ate: ate })
    .eq('id', id).or(`editando_por.is.null,editando_ate.lt.${agora.toISOString()},editando_por.eq.${user.id}`)
    .select('id')
  falhou(error)
  if (data.length) return null
  const { data: atual } = await supabase.from('inspecoes').select('editando_nome').eq('id', id).single()
  return atual?.editando_nome || 'outro usuário'
}

export const renovarTrava = (id, meuNome) => tentarTravar(id, meuNome)

export async function liberarTrava(id) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('inspecoes').update({ editando_por: null, editando_nome: '', editando_ate: null })
    .eq('id', id).eq('editando_por', user.id)
}

// ------------------------------------------------------------------ revisões
export async function finalizar(ins, dets, fotos, nome) {
  const agora = new Date().toISOString()
  const campos = { finalizado: true, finalizado_em: agora, finalizado_por: nome, ultima_revisao_finalizada: ins.revisao }
  const { error } = await supabase.from('inspecoes').update(campos).eq('id', ins.id)
  falhou(error)
  const retrato = { ...ins, ...campos, detalhamentos: dets.map((d) => ({ ...d, fotos: fotos[d.id] || [] })) }
  const { error: e2 } = await supabase.from('inspecao_revisoes')
    .upsert({ inspecao_id: ins.id, revisao: ins.revisao, finalizado_em: agora, finalizado_por: nome, retrato }, { onConflict: 'inspecao_id,revisao' })
  falhou(e2)
  return { ...ins, ...campos }
}

export async function reabrir(id) {
  const { error } = await supabase.from('inspecoes').update({ finalizado: false }).eq('id', id)
  falhou(error)
}

export async function listarRevisoes(id) {
  const { data, error } = await supabase.from('inspecao_revisoes').select('*').eq('inspecao_id', id).order('revisao', { ascending: false })
  falhou(error)
  return data
}

/** Exclusão recuperável (lixeira): some da lista, os dados ficam. */
export async function excluir(id, nome) {
  const { error } = await supabase.from('inspecoes')
    .update({ excluido_em: new Date().toISOString(), excluido_por: nome, editando_por: null, editando_ate: null }).eq('id', id)
  falhou(error)
}

export async function listarLixeira() {
  const { data, error } = await supabase.from('inspecoes')
    .select('id, numero, cliente, nota_fiscal, finalizado, revisao, excluido_em, excluido_por')
    .not('excluido_em', 'is', null).order('excluido_em', { ascending: false })
  falhou(error)
  return data
}

export async function restaurar(id) {
  const { error } = await supabase.from('inspecoes').update({ excluido_em: null, excluido_por: '' }).eq('id', id)
  falhou(error)
}

// ------------------------------------------------------------------ tipos de detalhamento
export async function listarTipos() {
  const { data, error } = await supabase.from('inspecao_tipos_detalhamento').select('*').order('ordem').order('nome')
  falhou(error)
  return data
}

export async function salvarTipo(t) {
  const campos = { nome: t.nome.trim(), padrao: !!t.padrao, ativo: t.ativo !== false, ordem: t.ordem ?? 0, descricao: t.descricao || '' }
  const { error } = t.id
    ? await supabase.from('inspecao_tipos_detalhamento').update(campos).eq('id', t.id)
    : await supabase.from('inspecao_tipos_detalhamento').insert(campos)
  if (error?.code === '23505') throw new Error(`Já existe um tipo "${t.nome}".`)
  falhou(error)
}

export async function excluirTipo(id) {
  const { error } = await supabase.from('inspecao_tipos_detalhamento').delete().eq('id', id)
  falhou(error)
}

// ------------------------------------------------------------------ clientes (cadastro do Radar)
export async function buscarClientes(termo) {
  const { data, error } = await supabase.rpc('inspecao_buscar_clientes', { p_termo: termo })
  falhou(error)
  return data || []
}

// ------------------------------------------------------------------ e-mail
const CHAVE_DESTINOS = 'email_destinatarios'

export async function lerDestinatarios() {
  const { data } = await supabase.from('inspecao_config').select('valor').eq('chave', CHAVE_DESTINOS).maybeSingle()
  return Array.isArray(data?.valor) ? data.valor : []
}

/** Nome e e-mail dos usuários ativos do Radar (sugestões no envio); sem a função no banco, lista vazia. */
export async function emailsUsuarios() {
  const { data, error } = await supabase.rpc('inspecao_emails_usuarios')
  return error ? [] : data || []
}

export async function salvarDestinatarios(lista) {
  await supabase.from('inspecao_config').upsert({ chave: CHAVE_DESTINOS, valor: lista, alterado_em: new Date().toISOString() })
}

/** anexos: [{ nome, base64 }]; inspecoes: [{ id, revisao }] para marcar o envio. */
export async function enviarEmail({ para, assunto, html, anexos, inspecoes }) {
  return respostaJson(await fetch(`${FUNCOES}/inspecao-email`, {
    method: 'POST', headers: { ...(await cabecalhos()), 'Content-Type': 'application/json' },
    body: JSON.stringify({ para, assunto, html, anexos, inspecoes }),
  }))
}

export async function listarFinalizadas() {
  const { data, error } = await supabase.from('inspecoes')
    .select('id, numero, cliente, cd_cliente, nota_fiscal, data_inspecao, produto, revisao, enviado_email_em')
    .is('excluido_em', null).eq('finalizado', true).order('numero', { ascending: false })
  falhou(error)
  return data
}

// ------------------------------------------------------------------ celular (QR Code)
export async function abrirSessaoCelular(inspecaoId, detalhamentoId) {
  const bytes = crypto.getRandomValues(new Uint8Array(24))
  const token = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  const { error } = await supabase.from('inspecao_celular_sessoes').insert({ token, inspecao_id: inspecaoId, detalhamento_id: detalhamentoId })
  falhou(error)
  return token
}

export async function encerrarSessaoCelular(token) {
  await supabase.from('inspecao_celular_sessoes').update({ encerrada: true }).eq('token', token)
}

/** Usado pela página do celular (sem login). */
export async function sessaoCelular(token) {
  return respostaJson(await fetch(`${FUNCOES}/inspecao-celular?t=${token}`, { headers: { apikey: supabaseAnonKey } }))
}

export async function enviarFotoCelular(token, arquivo) {
  const { blob, w, h } = await reduzirFoto(arquivo)
  const form = new FormData()
  form.append('largura', w); form.append('altura', h)
  form.append('arquivo', blob, 'foto.jpg')
  return respostaJson(await fetch(`${FUNCOES}/inspecao-celular?t=${token}`, { method: 'POST', headers: { apikey: supabaseAnonKey }, body: form }))
}
