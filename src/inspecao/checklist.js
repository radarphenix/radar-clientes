// Checklist de conferência em branco (PDF A4) para imprimir e levar ao recebimento da tela: identificação,
// campos técnicos nos mesmos grupos da tela e os itens de detalhamento na ordem padrão, com marcação
// OK / Não conforme / N.A., espaço para anotar e conclusão. Depois o inspetor passa para o Radar.
// Carregado só quando alguém gera o checklist (import dinâmico).
import { GRUPOS_TEC, caixaAlta } from './modelo'

const AZUL_ESCURO = [0x12, 0x3f, 0x73]
const AZUL = [0x1f, 0x64, 0xad]
const BORDA = [0x8b, 0xb5, 0xdc]
const LINHA = [0xc4, 0xcf, 0xdc]
const CINZA = [0x5a, 0x5a, 0x5a]
const FUNDO_ROTULO = [0xea, 0xf1, 0xf9]

const PAG = { l: 21, a: 29.7, topo: 1.2, base: 1.4, esq: 1.5, dir: 1.5 }
const UTIL = PAG.l - PAG.esq - PAG.dir // 18 cm

const IDENTIFICACAO = ['Cliente', 'Nota fiscal', 'Produto', 'Lote', 'Data da inspeção', 'Inspetor']

export async function gerarChecklist(titulos) {
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({ unit: 'cm', format: 'a4' })
  pdf.setProperties({ title: 'Checklist de conferência - Inspeção de Qualidade' })
  const pt = (p) => p * 0.03528
  const fonte = (tam, negrito = false) => { pdf.setFont('helvetica', negrito ? 'bold' : 'normal'); pdf.setFontSize(tam) }
  const cor = (c) => pdf.setTextColor(...c)
  const fundo = PAG.a - PAG.base
  let y = PAG.topo
  const novaPagina = () => { pdf.addPage(); y = PAG.topo + 0.6 }
  const garantir = (h) => { if (y + h > fundo) novaPagina() }

  // cabeçalho só na 1ª página (as outras ganham uma linha com o nome no rodapé)
  fonte(15, true); cor(AZUL_ESCURO)
  pdf.text('CHECKLIST DE CONFERÊNCIA', PAG.esq, y + 0.55)
  fonte(9); cor(CINZA)
  pdf.text('Inspeção de Qualidade - recebimento de tela. Preencha à mão e depois lance no Radar.', PAG.esq, y + 1.05)
  fonte(9, true); cor(AZUL)
  pdf.text('PHENIX', PAG.esq + UTIL, y + 0.55, { align: 'right' })
  pdf.setFillColor(...AZUL); pdf.rect(PAG.esq, y + 1.3, UTIL, pt(3), 'F')
  y += 1.6

  function secao(titulo) {
    garantir(1.6)
    y += 0.35
    fonte(10.5, true); cor(AZUL_ESCURO); pdf.text(titulo, PAG.esq, y + 0.35)
    pdf.setDrawColor(...AZUL); pdf.setLineWidth(pt(0.8)); pdf.line(PAG.esq, y + 0.5, PAG.esq + UTIL, y + 0.5)
    y += 0.75
  }

  /** Grade de campos em branco: rótulo em cima, caixa para escrever embaixo. */
  function campos(rotulos, colunas, subtitulo) {
    const alt = 1.05, gap = 0.25
    const w = (UTIL - gap * (colunas - 1)) / colunas
    if (subtitulo) { garantir(0.5 + alt); fonte(7.5, true); cor(AZUL); pdf.text(caixaAlta(subtitulo), PAG.esq, y + 0.3); y += 0.45 }
    for (let i = 0; i < rotulos.length; i += colunas) {
      garantir(alt + 0.1)
      rotulos.slice(i, i + colunas).forEach((r, k) => {
        const x = PAG.esq + k * (w + gap)
        pdf.setDrawColor(...BORDA); pdf.setLineWidth(pt(0.6)); pdf.rect(x, y, w, alt)
        fonte(7); cor(CINZA); pdf.text(r, x + 0.12, y + 0.3)
      })
      y += alt + 0.12
    }
    y += 0.1
  }

  function marcar(x, yb, texto) {
    pdf.setDrawColor(...AZUL_ESCURO); pdf.setLineWidth(pt(0.7)); pdf.rect(x, yb - 0.3, 0.35, 0.35)
    fonte(8); cor(AZUL_ESCURO); pdf.text(texto, x + 0.5, yb)
    return x + 0.5 + pdf.getTextWidth(texto) + 0.5
  }

  function linhasEscrever(n) {
    pdf.setDrawColor(...LINHA); pdf.setLineWidth(pt(0.5))
    for (let i = 0; i < n; i++) { y += 0.7; pdf.line(PAG.esq, y, PAG.esq + UTIL, y) }
  }

  secao('IDENTIFICAÇÃO')
  campos(IDENTIFICACAO, 3)

  secao('INFORMAÇÕES TÉCNICAS DO RECEBIMENTO')
  GRUPOS_TEC.forEach(([titulo, rotulos]) => campos(rotulos, titulo.startsWith('Material') ? 2 : 3, titulo))
  garantir(0.8)
  fonte(8.5, true); cor(AZUL_ESCURO); pdf.text('A Phenix forneceu esta tela?', PAG.esq, y + 0.4)
  let x = PAG.esq + 4.6
  x = marcar(x, y + 0.4, 'Sim'); marcar(x, y + 0.4, 'Não')
  y += 0.8

  secao('DETALHAMENTO')
  titulos.forEach((t, n) => {
    garantir(2.6)
    pdf.setFillColor(...FUNDO_ROTULO); pdf.rect(PAG.esq, y, UTIL, 0.62, 'F')
    fonte(9.5, true); cor(AZUL_ESCURO); pdf.text(`${n + 1}. ${caixaAlta(t)}`, PAG.esq + 0.15, y + 0.43)
    let xm = PAG.esq + UTIL - 9.2
    for (const op of ['OK', 'Não conforme', 'N.A.', 'Foto']) xm = marcar(xm, y + 0.45, op)
    y += 0.62
    linhasEscrever(2)
    y += 0.35
  })

  // itens fora do padrão que aparecerem na conferência
  garantir(2.2)
  fonte(8.5, true); cor(AZUL_ESCURO); pdf.text('Outros itens observados', PAG.esq, y + 0.4)
  y += 0.4
  linhasEscrever(2)

  secao('CONCLUSÃO / PARECER')
  linhasEscrever(3)
  garantir(1.6)
  y += 1.1
  pdf.setDrawColor(...AZUL_ESCURO); pdf.setLineWidth(pt(0.6))
  ;[[PAG.esq, 'Inspetor'], [PAG.esq + UTIL / 2 + 0.5, 'Data']].forEach(([xa, r]) => {
    pdf.line(xa, y, xa + UTIL / 2 - 0.5, y)
    fonte(7.5); cor(CINZA); pdf.text(r, xa, y + 0.35)
  })

  const total = pdf.getNumberOfPages()
  for (let i = 1; i <= total; i++) {
    pdf.setPage(i)
    fonte(7); cor(CINZA)
    pdf.text('Checklist de conferência - Inspeção de Qualidade Phenix', PAG.esq, PAG.a - 0.8)
    pdf.text(`Página ${i} de ${total}`, PAG.esq + UTIL, PAG.a - 0.8, { align: 'right' })
  }
  return pdf.output('blob')
}
