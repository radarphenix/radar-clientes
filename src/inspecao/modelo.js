// Regras da inspeção - tradução de MWInspecaoQualidade\Models\Inspecao.cs (programa desktop irmão).
// Mudou uma regra aqui? Levar ao desktop na mesma entrega (e vice-versa) - ver INSPECAO_QUALIDADE.md.

export const TITULO_PADRAO = 'RELATÓRIO DE INSPEÇÃO DE QUALIDADE'

export const CAMPOS_DADOS_GERAIS = [
  'Cliente', 'Código cliente', 'Nota fiscal', 'Pedido', 'Produto', 'Código do produto', 'Lote',
  'Metragem 1', 'Metragem 2', 'Metragem 3', 'Data de entrada', 'Data da inspeção', 'Local', 'Inspetor',
]

export const CAMPOS_TECNICOS = [
  'Máquina', 'Fabricante', 'CFM', 'Espessura', 'Gramatura', 'Largura', 'Comprimento', 'Cor',
  'Composição', 'Acabamento', 'Norma / Especificação',
]

/** Toda inspeção nova começa com estes itens; item sem descrição e sem foto não sai no relatório. */
export const TITULOS_PADRAO = [
  'Condições gerais', 'Embalagem', 'Lateral esquerda', 'Lateral direita', 'Superior', 'Inferior',
  'Centro', 'Emenda', 'Acessórios',
]

export const TITULOS_SUGERIDOS = [
  'Identificação / etiqueta', 'Dimensões', 'Costura', 'Ourela / bordas', 'Furos / rasgos',
  'Desgaste / abrasão', 'Manchas / contaminação', 'Deformação / enrugamento', 'Colmatação',
  'Permeabilidade (CFM)', 'Amostra coletada', 'Documentação',
]

export const FORNECEDOR_PHENIX = 'Phenix'

const pad = (n) => String(n).padStart(2, '0')

/** Número = data/hora da criação (aaaaMMdd-HHmmss), como no desktop. */
export function novoNumero(d = new Date()) {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
}

export const dataBR = (d = new Date()) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`

export function novaInspecao(usuario) {
  const agora = new Date()
  const campos = (rotulos) => rotulos.map((rotulo) => ({ rotulo, valor: '' }))
  const dados = campos(CAMPOS_DADOS_GERAIS)
  dados.find((c) => c.rotulo === 'Data da inspeção').valor = dataBR(agora)
  return {
    numero: novoNumero(agora),
    titulo: TITULO_PADRAO,
    dados_gerais: dados,
    informacoes_tecnicas: campos(CAMPOS_TECNICOS),
    informacoes_tecnicas_saida: campos(CAMPOS_TECNICOS),
    elaborado_por: usuario || '',
    setor: 'Qualidade',
    data_inspecao: dataBR(agora),
  }
}

export const preenchidos = (campos) =>
  (campos || []).filter((c) => (c.valor || '').trim() && (c.rotulo || '').trim())

export const valor = (campos, rotulo) =>
  ((campos || []).find((c) => (c.rotulo || '').toLowerCase() === rotulo.toLowerCase())?.valor || '').trim()

/** Qualquer campo de saída preenchido = a Phenix forneceu a tela. O "Phenix" que o próprio programa
 *  completou não conta: apagando o resto, a saída some do relatório. */
export const temSaida = (ins) =>
  preenchidos(ins.informacoes_tecnicas_saida).some(
    (c) => !(c.rotulo === 'Fabricante' && c.valor.trim().toLowerCase() === FORNECEDOR_PHENIX.toLowerCase()))

/** Devolve a lista de saída com o Fabricante completado (ou a mesma, se não precisar). */
export function completarFabricanteSaida(ins) {
  const lista = ins.informacoes_tecnicas_saida || []
  const fab = lista.find((c) => c.rotulo === 'Fabricante')
  if (!fab || fab.valor.trim() || !temSaida(ins)) return lista
  return lista.map((c) => (c === fab ? { ...c, valor: FORNECEDOR_PHENIX } : c))
}

/** Itens que vão para o relatório: com descrição ou foto (título sozinho não basta). */
export const detalhamentosParaImprimir = (dets, fotosPorDet) =>
  dets.filter((d) => (d.texto || '').trim() || (fotosPorDet[d.id] || []).length)

/** Título do detalhamento no relatório: sempre em maiúsculas. */
export const caixaAlta = (s) => (s || '').toLocaleUpperCase('pt-BR')

/** Descrição no relatório: minúsculas, com maiúscula só no início de cada frase. */
export function caixaFrase(s) {
  let inicio = true
  return Array.from((s || '').toLocaleLowerCase('pt-BR')).map((ch) => {
    if (/\p{L}/u.test(ch)) { const r = inicio ? ch.toLocaleUpperCase('pt-BR') : ch; inicio = false; return r }
    if ('.!?\n'.includes(ch)) inicio = true
    return ch
  }).join('')
}

/** Ordem das seções na impressão: com saída, ela vem primeiro e o resto é "do recebimento". */
export function secoesRelatorio(ins) {
  const s = temSaida(ins)
  const r = s ? ' DO RECEBIMENTO' : ''
  return {
    saida: s ? 'INFORMAÇÕES TÉCNICAS DE SAÍDA' : null,
    dados: 'DADOS GERAIS' + r,
    tecnicas: 'INFORMAÇÕES TÉCNICAS' + r,
    detalhamento: s ? 'DETALHAMENTO DO RECEBIMENTO' : 'DETALHAMENTO DA INSPEÇÃO',
    conclusao: 'CONCLUSÃO / PARECER',
  }
}

/** Fotos: 1 = grande; 2 ou mais = no máximo duas por linha (LayoutFotos.cs). Medidas em cm. */
export const caixaFotos = (qtd) => (qtd <= 1 ? { colunas: 1, larguraCm: 13, alturaCm: 9.5 } : { colunas: 2, larguraCm: 8.2, alturaCm: 6.2 })

export function ajustarFoto(caixa, px, py) {
  const e = Math.min(caixa.larguraCm / px, caixa.alturaCm / py)
  return { l: px * e, a: py * e }
}

/** Campos de busca/ligação mantidos em colunas próprias (o banco filtra e liga ao cliente por eles). */
export const colunasDeBusca = (ins) => ({
  cliente: valor(ins.dados_gerais, 'Cliente'),
  cd_cliente: valor(ins.dados_gerais, 'Código cliente'),
  nota_fiscal: valor(ins.dados_gerais, 'Nota fiscal'),
  data_inspecao: valor(ins.dados_gerais, 'Data da inspeção'),
  produto: valor(ins.dados_gerais, 'Produto'),
})

/** Retrato só do conteúdo, para detectar alteração (Inspecao.Conteudo()). */
export const conteudo = (ins, dets, fotos) => JSON.stringify({
  t: ins.titulo, d: ins.dados_gerais, i: ins.informacoes_tecnicas, s: ins.informacoes_tecnicas_saida,
  c: ins.conclusao, e: ins.elaborado_por, a: ins.aprovado_por, st: ins.setor,
  det: dets.map((d) => [d.titulo, d.texto, (fotos[d.id] || []).map((f) => [f.id, f.legenda])]),
})

export const PAPEIS = { leitura: 'Leitura', inspetor: 'Inspetor', aprovador: 'Aprovador', admin: 'Administrador' }
const NIVEL = { leitura: 1, inspetor: 2, aprovador: 3, admin: 4 }
export const pode = (papel, minimo) => (NIVEL[papel] || 0) >= NIVEL[minimo]
