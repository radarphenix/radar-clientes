// Resumo da inspeção em UMA folha A4 (uso interno), para imprimir e guardar junto com a tela:
// só os dados (sem fotos) - identificação, medidas informadas x aferidas x saída lado a lado, demais
// campos técnicos (inclusive os adicionais "não imprimir"), itens do detalhamento resumidos e conclusão.
// Se o conteúdo não couber, a letra diminui até caber; só no limite passa para uma segunda folha.
// Carregado só quando alguém gera o resumo (import dinâmico).
import {
  CAMPOS_DADOS_GERAIS, CAMPOS_TECNICOS, CAMPOS_TECNICOS_SAIDA, MEDIDAS_INFORMADAS, MEDIDAS_AFERIDAS,
  preenchidos, valor, temSaida, caixaAlta, caixaFrase, detalhamentosParaImprimir,
} from './modelo'

const AZUL_ESCURO = [0x12, 0x3f, 0x73]
const AZUL = [0x1f, 0x64, 0xad]
const BORDA = [0xb8, 0xcd, 0xe2]
const FUNDO = [0xea, 0xf1, 0xf9]
const CINZA = [0x5a, 0x5a, 0x5a]
const TEXTO = [0x26, 0x26, 0x26]
const PAG = { l: 21, a: 29.7, topo: 1.1, base: 1.3, esq: 1.4, dir: 1.4 }
const UTIL = PAG.l - PAG.esq - PAG.dir
const pad = (n) => String(n).padStart(2, '0')
const agora = () => { const d = new Date(); return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}` }

// rótulo da medida sem "informado/a" (linha da tabela)
const NOME_MEDIDA = MEDIDAS_AFERIDAS

export function nomeArquivoResumo(ins) {
  return `Resumo_Inspecao_${ins.numero}_rev${pad(ins.revisao)}.pdf`
}

export async function gerarResumo(ins, dets, fotos) {
  const { jsPDF } = await import('jspdf')
  // tenta em escala cheia; se passar de uma folha, diminui a letra
  for (const escala of [1, 0.92, 0.85, 0.78, 0.72]) {
    const pdf = desenhar(jsPDF, ins, dets, fotos, escala, false)
    if (pdf) return pdf.output('blob')
  }
  return desenhar(jsPDF, ins, dets, fotos, 0.72, true).output('blob')
}

/** Desenha o resumo. Sem `quebrar`, devolve null se não couber numa folha. */
function desenhar(jsPDF, ins, dets, fotos, k, quebrar) {
  const pdf = new jsPDF({ unit: 'cm', format: 'a4' })
  pdf.setProperties({ title: `Resumo da inspeção ${ins.numero}` })
  const pt = (p) => p * 0.03528
  const fonte = (tam, negrito = false) => { pdf.setFont('helvetica', negrito ? 'bold' : 'normal'); pdf.setFontSize(tam * k) }
  const cor = (c) => pdf.setTextColor(...c)
  const fundo = PAG.a - PAG.base
  let y = PAG.topo
  let estourou = false
  const garantir = (h) => {
    if (y + h <= fundo) return true
    if (!quebrar) { estourou = true; return false }
    pdf.addPage(); y = PAG.topo; return true
  }
  const lh = (tam) => pt(tam * k) * 1.25 // altura de linha

  // ---------------------------------------------------------------- cabeçalho
  fonte(14, true); cor(AZUL_ESCURO)
  pdf.text('RESUMO DA INSPEÇÃO', PAG.esq, y + 0.5)
  fonte(9, true); cor([0xb4, 0x23, 0x18])
  pdf.text('USO INTERNO', PAG.esq + UTIL, y + 0.35, { align: 'right' })
  fonte(8.5, true); cor(AZUL)
  pdf.text('PHENIX', PAG.esq + UTIL, y + 0.75, { align: 'right' })
  fonte(8.5); cor(CINZA)
  const situacao = ins.finalizado ? `finalizada${ins.finalizado_por ? ` por ${ins.finalizado_por}` : ''}${ins.finalizado_em ? ` em ${new Date(ins.finalizado_em).toLocaleDateString('pt-BR')}` : ''}` : 'rascunho (não finalizada)'
  pdf.text(`Relatório Nº ${ins.numero}  ·  revisão ${pad(ins.revisao)}  ·  ${situacao}`, PAG.esq, y + 0.95)
  pdf.setFillColor(...AZUL); pdf.rect(PAG.esq, y + 1.15, UTIL, pt(2.5), 'F')
  y += 1.45

  function secao(titulo) {
    if (!garantir(1.0)) return
    y += 0.25
    fonte(9.5, true); cor(AZUL_ESCURO); pdf.text(titulo, PAG.esq, y + 0.3)
    pdf.setDrawColor(...AZUL); pdf.setLineWidth(pt(0.7)); pdf.line(PAG.esq, y + 0.42, PAG.esq + UTIL, y + 0.42)
    y += 0.6
  }

  /** Grade rótulo/valor com caixas; valor quebra em até 3 linhas. */
  function grade(campos, colunas, destaque) {
    const gap = 0.2
    const w = (UTIL - gap * (colunas - 1)) / colunas
    for (let i = 0; i < campos.length; i += colunas) {
      const linha = campos.slice(i, i + colunas)
      const textos = linha.map((c) => { fonte(destaque?.includes(c.rotulo) ? 10.5 : 9, destaque?.includes(c.rotulo)); return pdf.splitTextToSize(c.valor.trim(), w - 0.24).slice(0, 3) })
      const alt = 0.38 + Math.max(...textos.map((t, j) => t.length * lh(destaque?.includes(linha[j].rotulo) ? 10.5 : 9))) + 0.12
      if (!garantir(alt + 0.1)) return
      linha.forEach((c, j) => {
        const x = PAG.esq + j * (w + gap)
        pdf.setDrawColor(...BORDA); pdf.setLineWidth(pt(0.5)); pdf.rect(x, y, w, alt)
        fonte(6.5); cor(CINZA); pdf.text(pdf.splitTextToSize(caixaAlta(c.rotulo), w - 0.24)[0], x + 0.12, y + 0.27)
        const forte = destaque?.includes(c.rotulo)
        fonte(forte ? 10.5 : 9, forte); cor(TEXTO); pdf.text(textos[j], x + 0.12, y + 0.38 + lh(forte ? 10.5 : 9) * 0.8)
      })
      y += alt + 0.1
    }
  }

  // ---------------------------------------------------------------- identificação (todos os dados gerais preenchidos)
  secao('IDENTIFICAÇÃO')
  const dados = preenchidos(ins.dados_gerais)
  const ordem = (l, padrao) => [...l].sort((a, b) => (padrao.indexOf(a.rotulo) + 1 || 99) - (padrao.indexOf(b.rotulo) + 1 || 99))
  grade(ordem(dados, CAMPOS_DADOS_GERAIS), 4, ['Cliente', 'Nota fiscal', 'Lote'])
  if (!dados.length) { fonte(8.5); cor(CINZA); pdf.text('Nenhum dado geral preenchido.', PAG.esq, y + 0.3); y += 0.5 }

  // ---------------------------------------------------------------- medidas lado a lado
  const comSaida = temSaida(ins)
  const linhasMedida = NOME_MEDIDA.map((nome, i) => ({
    nome,
    informado: valor(ins.informacoes_tecnicas, MEDIDAS_INFORMADAS[i]),
    aferido: valor(ins.informacoes_tecnicas, MEDIDAS_AFERIDAS[i]),
    saida: comSaida ? valor(ins.informacoes_tecnicas_saida, MEDIDAS_AFERIDAS[i]) : '',
  })).filter((m) => m.informado || m.aferido || m.saida)
  if (linhasMedida.length) {
    secao('MEDIDAS')
    const cols = comSaida ? ['Medida', 'Informado (cliente)', 'Aferido no recebimento', 'Saída (Phenix)'] : ['Medida', 'Informado (cliente)', 'Aferido (Phenix)']
    const w0 = 4.2, wc = (UTIL - w0) / (cols.length - 1)
    const larg = [w0, ...cols.slice(1).map(() => wc)]
    const linhaTabela = (vals, cabecalho) => {
      const alt = cabecalho ? 0.5 : 0.52
      if (!garantir(alt)) return
      let x = PAG.esq
      vals.forEach((v, j) => {
        if (cabecalho) { pdf.setFillColor(...FUNDO); pdf.rect(x, y, larg[j], alt, 'F') }
        pdf.setDrawColor(...BORDA); pdf.setLineWidth(pt(0.5)); pdf.rect(x, y, larg[j], alt)
        fonte(cabecalho ? 7.5 : 9, cabecalho || j === 0); cor(cabecalho ? AZUL_ESCURO : TEXTO)
        pdf.text(pdf.splitTextToSize(v || '-', larg[j] - 0.2)[0], x + 0.12, y + alt * 0.66)
        x += larg[j]
      })
      y += alt
    }
    linhaTabela(cols, true)
    linhasMedida.forEach((m) => linhaTabela([m.nome, m.informado, m.aferido, ...(comSaida ? [m.saida] : [])]))
    y += 0.1
  }

  // ---------------------------------------------------------------- demais campos técnicos (recebimento e saída), com adicionais
  const medidas = new Set([...MEDIDAS_INFORMADAS, ...MEDIDAS_AFERIDAS])
  const outrosRec = ordem(preenchidos(ins.informacoes_tecnicas).filter((c) => !medidas.has(c.rotulo)), CAMPOS_TECNICOS)
  const outrosSai = comSaida ? ordem(preenchidos(ins.informacoes_tecnicas_saida).filter((c) => !medidas.has(c.rotulo)), CAMPOS_TECNICOS_SAIDA) : []
  if (outrosRec.length) { secao(comSaida ? 'EQUIPAMENTO E MATERIAL - RECEBIMENTO' : 'EQUIPAMENTO E MATERIAL'); grade(outrosRec, 4) }
  if (outrosSai.length) { secao('EQUIPAMENTO E MATERIAL - SAÍDA (PHENIX)'); grade(outrosSai, 4) }

  // ---------------------------------------------------------------- detalhamento resumido
  const itens = detalhamentosParaImprimir(dets, fotos)
  if (itens.length) {
    secao('DETALHAMENTO')
    for (const d of itens) {
      const nf = (fotos[d.id] || []).length
      fonte(8.5, true)
      const titulo = `${caixaAlta(d.titulo || 'Item')}${nf ? `  (${nf} foto${nf > 1 ? 's' : ''})` : ''}`
      fonte(8.5)
      const texto = pdf.splitTextToSize(caixaFrase((d.texto || '').replace(/\s*\n\s*/g, ' ').trim()) || (nf ? 'só fotos' : '-'), UTIL - 0.3)
      const mostra = texto.slice(0, 3)
      if (texto.length > 3) mostra[2] = mostra[2].replace(/\s*\S*$/, '') + ' (...)'
      const alt = lh(8.5) * (1 + mostra.length) + 0.12
      if (!garantir(alt)) break
      fonte(8.5, true); cor(AZUL_ESCURO); pdf.text(titulo, PAG.esq, y + lh(8.5) * 0.85)
      fonte(8.5); cor(TEXTO); pdf.text(mostra, PAG.esq + 0.3, y + lh(8.5) * 1.85)
      y += alt
    }
  }

  // ---------------------------------------------------------------- conclusão
  secao('CONCLUSÃO / PARECER')
  fonte(9)
  const conc = pdf.splitTextToSize((ins.conclusao || '').trim() || '-', UTIL)
  const concMostra = conc.slice(0, 8)
  if (conc.length > 8) concMostra[7] += ' (...)'
  if (garantir(concMostra.length * lh(9) + 0.1)) {
    cor(TEXTO); pdf.text(concMostra, PAG.esq, y + lh(9) * 0.85)
    y += concMostra.length * lh(9) + 0.15
  }

  // ---------------------------------------------------------------- responsáveis + onde a tela ficou guardada
  secao('RESPONSÁVEIS E ARMAZENAMENTO')
  grade([
    { rotulo: 'Elaborado por', valor: ins.elaborado_por || '' },
    { rotulo: 'Aprovado por', valor: ins.aprovado_por || '' },
    { rotulo: 'Setor', valor: ins.setor || '' },
    { rotulo: 'Guardado em (local / etiqueta)', valor: ' ' },
  ], 4)

  if (estourou) return null
  const total = pdf.getNumberOfPages()
  for (let i = 1; i <= total; i++) {
    pdf.setPage(i)
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7); cor(CINZA)
    pdf.text(`Resumo interno - guardar junto com a tela. Gerado em ${agora()}. O relatório completo (com fotos) está no Radar.`, PAG.esq, PAG.a - 0.75)
    if (total > 1) pdf.text(`Página ${i} de ${total}`, PAG.esq + UTIL, PAG.a - 0.75, { align: 'right' })
  }
  return pdf
}
