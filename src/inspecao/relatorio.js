// Relatório da inspeção em PDF (jsPDF) e Word (docx), no navegador - tradução de PdfService.cs e
// WordService.cs do desktop: folha timbrada Phenix, quadro de identificação, seções na mesma ordem,
// fotos duas por linha em moldura fixa, rodapé com assinaturas e "página X de Y".
// Carregado só quando alguém gera um relatório (import dinâmico): não pesa na tela.
import {
  caixaAlta, caixaFotos, caixaFrase, ajustarFoto, detalhamentosParaImprimir, camposRelatorio, dividirTecnicas, separarAdicionais, secoesRelatorio, FUNDO_MOLDURA,
  CAMPOS_DADOS_GERAIS, CAMPOS_TECNICOS, CAMPOS_TECNICOS_SAIDA,
} from './modelo'
import { urlFoto } from './api'

const AZUL_ESCURO = [0x12, 0x3f, 0x73]
const AZUL = [0x1f, 0x64, 0xad]
const AZUL_BORDA = [0x8b, 0xb5, 0xdc]
const AZUL_CLARO_BORDA = [0xb8, 0xcd, 0xe2]
const FUNDO_ROTULO = [0xea, 0xf1, 0xf9]
const CINZA = [0x5a, 0x5a, 0x5a]
const TEXTO = [0x26, 0x26, 0x26]
const hex = (c) => c.map((n) => n.toString(16).padStart(2, '0')).join('').toUpperCase()

// mesma página do desktop (A4, margens da folha timbrada)
const PAG = { l: 21, a: 29.7, topo: 4.5, base: 3.2, esq: 1.7, dir: 1.7 }
const UTIL = PAG.l - PAG.esq - PAG.dir // 17.6 cm
const EMPRESA = 'PHENIX - INDÚSTRIA E COMERCIO DE FILTROS LTDA'
const CONTATOS = ['Tel.: +55 (51) 3606-1218', 'phenix@phenixonline.com.br', 'www.phenixonline.com.br',
  'Rua Capivari, 999 - Rondinha Nova - Arroio do Sal/RS - CEP 95585-000']
const pad = (n) => String(n).padStart(2, '0')
const dataHora = (iso) => { const d = new Date(iso); return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}` }
const linhas = (s) => (s || '').replace(/\r/g, '').split('\n').map((l) => l.trimEnd()).filter((l, i, a) => l || a.slice(0, i).some(Boolean))

// interno = versão completa (com os campos adicionais "não imprimir"), só para uso da Phenix
export function nomeArquivo(ins, ext, interno = false) {
  return `Relatorio_Inspecao_${ins.numero}_rev${pad(ins.revisao)}${interno ? '_INTERNO' : ''}.${ext}`
}

async function imagem(url) {
  const blob = await (await fetch(url)).blob()
  const dados = new Uint8Array(await blob.arrayBuffer())
  const dataUrl = await new Promise((ok) => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(blob) })
  const { w, h } = await new Promise((ok, erro) => { const i = new Image(); i.onload = () => ok({ w: i.naturalWidth, h: i.naturalHeight }); i.onerror = erro; i.src = dataUrl })
  return { dados, dataUrl, w, h, tipo: blob.type.includes('png') ? 'png' : 'jpg' }
}

/** Tudo que o relatório precisa, já com as regras aplicadas (igual ao desktop). */
async function preparar(ins, dets, fotos, interno) {
  const sec = secoesRelatorio(ins)
  const itens = detalhamentosParaImprimir(dets, fotos)
  const logo = await imagem('/inspecao/logo_phenix.png').catch(() => null)
  const fotosItens = []
  for (const d of itens) {
    const lista = []
    for (const f of fotos[d.id] || []) {
      try { lista.push({ ...(await imagem(await urlFoto(f.id))), legenda: f.legenda || '' }) } catch { /* foto indisponível: fica de fora */ }
    }
    fotosItens.push({ titulo: caixaAlta(d.titulo), texto: linhas(caixaFrase(d.texto)), fotos: lista })
  }
  return {
    sec, logo, itens: fotosItens,
    interno,
    saida: separarAdicionais(sec.saida ? camposRelatorio(ins.informacoes_tecnicas_saida, CAMPOS_TECNICOS_SAIDA, interno) : [], CAMPOS_TECNICOS_SAIDA),
    dados: separarAdicionais(camposRelatorio(ins.dados_gerais, CAMPOS_DADOS_GERAIS, interno), CAMPOS_DADOS_GERAIS),
    tecnicas: dividirTecnicas(camposRelatorio(ins.informacoes_tecnicas, CAMPOS_TECNICOS, interno)),
    conclusao: linhas(ins.conclusao),
  }
}

// ======================================================================== PDF

const FOTO_MIN = 0.6   // menor escala aceita para a linha de fotos caber no fim da página

export async function gerarPdf(ins, dets, fotos, { interno = false } = {}) {
  const { jsPDF } = await import('jspdf')
  const r = await preparar(ins, dets, fotos, interno)
  const pdf = new jsPDF({ unit: 'cm', format: 'a4' })
  pdf.setProperties({ title: `${ins.titulo} Nº ${ins.numero}`, author: ins.elaborado_por || '' })
  let y = PAG.topo
  const fundo = PAG.a - PAG.base
  const cor = (c) => pdf.setTextColor(...c)
  const fonte = (tam, negrito = false) => { pdf.setFont('helvetica', negrito ? 'bold' : 'normal'); pdf.setFontSize(tam) }
  const pt = (p) => p * 0.03528
  const novaPagina = () => { pdf.addPage(); y = PAG.topo }
  const garantir = (h) => { if (y + h > fundo) novaPagina() }

  function cabecalho() {
    if (r.logo) {
      const w = 5.8, h = w * r.logo.h / r.logo.w
      pdf.addImage(r.logo.dataUrl, r.logo.tipo.toUpperCase(), PAG.esq + 0.2, 2.2 - h / 2, w, h)
    }
    pdf.setDrawColor(...AZUL); pdf.setLineWidth(pt(1.2))
    pdf.line(PAG.esq + 6.2, 0.9, PAG.esq + 6.2, 3.4)
    const x = PAG.esq + 6.55
    fonte(11, true); cor(AZUL_ESCURO); pdf.text(EMPRESA, x, 1.45)
    fonte(8); CONTATOS.forEach((l, i) => pdf.text(l, x, 1.95 + i * 0.4))
    pdf.setFillColor(...AZUL); pdf.rect(PAG.esq, 3.6, UTIL, pt(4), 'F')
  }

  function rodape(n, total) {
    const yT = PAG.a - 2.45
    const larg = [4.3, 3.6, 3.6, 3.2, 2.9]
    const cel = [['CONFIDENCIALIDADE', 'Reprodução somente com autorização.'], ['ELABORADO POR', ins.elaborado_por],
      ['APROVADO POR', ins.aprovado_por], ['SETOR', ins.setor], ['PÁGINA', `${n} de ${total}`]]
    let x = PAG.esq
    cel.forEach(([rot, val], i) => {
      if (i > 0) { pdf.setDrawColor(...AZUL_CLARO_BORDA); pdf.setLineWidth(pt(0.6)); pdf.line(x, yT - 0.15, x, yT + 0.75) }
      fonte(6.5, true); cor(AZUL_ESCURO); pdf.text(rot, x + 0.15, yT + 0.12)
      fonte(i === 4 ? 8 : 7); cor(i === 0 ? CINZA : AZUL_ESCURO)
      pdf.text(pdf.splitTextToSize(val || '', larg[i] - 0.3), x + 0.15, yT + 0.5)
      x += larg[i]
    })
    pdf.setFillColor(...AZUL); pdf.rect(PAG.esq, PAG.a - 1.45, UTIL, 0.62, 'F')
    fonte(9, true); pdf.setTextColor(255, 255, 255)
    pdf.text('PHENIX - TECENDO FACILIDADES', PAG.l / 2, PAG.a - 1.03, { align: 'center' })
  }

  function quadro() {
    const larg = [4.6, 4.2, 4.0, 4.8]
    const itens = [['TIPO DE DOCUMENTO', 'Relatório de Inspeção'], ['NOME', `Nº ${ins.numero}`],
      ['REVISÃO', pad(ins.revisao)], ['DATA', dataHora(ins.alterado_em)]]
    let x = PAG.esq
    pdf.setDrawColor(...AZUL_BORDA); pdf.setLineWidth(pt(0.75))
    itens.forEach(([rot, val], i) => {
      pdf.rect(x, y, larg[i], 1.1)
      fonte(7.5, true); cor(AZUL); pdf.text(rot, x + 0.15, y + 0.4)
      fonte(9); cor(AZUL_ESCURO); pdf.text(val, x + 0.15, y + 0.85)
      x += larg[i]
    })
    y += 1.1
  }

  function secao(titulo) {
    garantir(1.6)
    y += pt(14)
    fonte(11, true); cor(AZUL_ESCURO); pdf.text(titulo, PAG.esq, y + 0.35)
    pdf.setDrawColor(...AZUL); pdf.setLineWidth(pt(1)); pdf.line(PAG.esq, y + 0.5, PAG.esq + UTIL, y + 0.5)
    y += 0.5 + pt(6)
  }

  function subtitulo(t) {
    garantir(1.2)
    y += pt(8)
    fonte(9.5, true); cor(AZUL); pdf.text(t.toUpperCase(), PAG.esq, y + 0.35)
    y += 0.35 + pt(5)
  }

  function tabelaCampos(campos) {
    const larg = [3.35, 5.45, 3.35, 5.45]
    for (let i = 0; i < campos.length; i += 2) {
      const par = [campos[i], campos[i + 1]]
      fonte(9.5)
      const blocos = par.map((c) => (c ? pdf.splitTextToSize(c.valor, larg[1] - 0.3) : []))
      fonte(7.5, true)
      const rots = par.map((c) => (c ? pdf.splitTextToSize(c.rotulo.toUpperCase(), larg[0] - 0.3) : []))
      const nLin = Math.max(1, ...blocos.map((b) => b.length), ...rots.map((b) => b.length))
      const h = 0.25 + nLin * 0.42
      garantir(h)
      let x = PAG.esq
      pdf.setDrawColor(...AZUL_BORDA); pdf.setLineWidth(pt(0.5))
      par.forEach((c, k) => {
        pdf.setFillColor(...FUNDO_ROTULO); pdf.rect(x, y, larg[0], h, 'FD')
        pdf.rect(x + larg[0], y, larg[1], h)
        if (c) {
          fonte(7.5, true); cor(AZUL); pdf.text(rots[k], x + 0.15, y + 0.45)
          fonte(9.5); cor(TEXTO); pdf.text(blocos[k], x + larg[0] + 0.15, y + 0.48)
        }
        x += larg[0] + larg[1]
      })
      y += h
    }
  }

  function paragrafos(lista) {
    fonte(10); cor(TEXTO)
    for (const l of lista) {
      const partes = pdf.splitTextToSize(l || ' ', UTIL)
      for (const [i, p] of partes.entries()) {
        garantir(0.45)
        const ultima = i === partes.length - 1
        pdf.text(p, PAG.esq, y + 0.35, ultima ? {} : { align: 'justify', maxWidth: UTIL })
        y += 0.45
      }
      y += pt(3)
    }
  }

  function tabelaFotos(lista) {
    const caixa = caixaFotos()
    for (let i = 0; i < lista.length; i += caixa.colunas) {
      const linha = lista.slice(i, i + caixa.colunas)
      const temLegenda = linha.some((f) => f.legenda)
      const extra = 0.3 + (temLegenda ? 0.6 : 0.2)
      // sem espaço: a linha inteira encolhe junto (molduras da linha seguem iguais) até 60% para
      // aproveitar o fim da página; abaixo disso, vai para a próxima
      let esc = 1
      const livre = fundo - y - 0.15 - extra
      if (caixa.alturaCm > livre) { if (livre >= caixa.alturaCm * FOTO_MIN) esc = livre / caixa.alturaCm; else novaPagina() }
      const mol = { ...caixa, larguraCm: caixa.larguraCm * esc, alturaCm: caixa.alturaCm * esc }
      const h = mol.alturaCm
      const passoLinha = mol.larguraCm + caixa.espacoCm
      const x0 = PAG.esq + (UTIL - (linha.length * passoLinha - caixa.espacoCm)) / 2
      linha.forEach((f, k) => {
        const x = x0 + k * passoLinha, yM = y + 0.15
        pdf.setFillColor(...FUNDO_MOLDURA); pdf.setDrawColor(...AZUL_CLARO_BORDA); pdf.setLineWidth(0.02)
        pdf.rect(x, yM, mol.larguraCm, h, 'FD')
        const { l, a } = ajustarFoto(mol, f.w, f.h)
        pdf.addImage(f.dataUrl, f.tipo.toUpperCase(), x + (mol.larguraCm - l) / 2, yM + (h - a) / 2, l, a)
        if (f.legenda) {
          fonte(8); cor(CINZA)
          pdf.text(pdf.splitTextToSize(f.legenda, mol.larguraCm), x + mol.larguraCm / 2, yM + h + 0.45, { align: 'center' })
        }
      })
      y += 0.15 + h + extra
    }
  }

  quadro()
  y += pt(18)
  fonte(16, true); cor(AZUL_ESCURO); pdf.text(ins.titulo || '', PAG.l / 2, y + 0.5, { align: 'center' })
  y += 0.5 + pt(4)
  if (r.interno) {
    y += pt(6)
    fonte(9, true); pdf.setTextColor(0xb4, 0x23, 0x18)
    pdf.text('VERSÃO INTERNA - USO EXCLUSIVO PHENIX - NÃO ENVIAR AO CLIENTE', PAG.l / 2, y + 0.3, { align: 'center' })
    y += 0.3 + pt(4)
  }

  // cada seção: campos padrão (em blocos, se houver) e depois os adicionais num bloco próprio
  const blocosPdf = (titulo, blocos) => {
    const cheios = blocos.filter(([, l]) => l.length)
    if (!cheios.length) return
    secao(titulo)
    cheios.forEach(([sub, l]) => { if (sub) subtitulo(sub); tabelaCampos(l) })
  }
  blocosPdf(r.sec.saida, [[null, r.saida.padrao], [r.sec.adicionais, r.saida.adicionais]])
  blocosPdf(r.sec.dados, [[null, r.dados.padrao], [r.sec.adicionais, r.dados.adicionais]])
  blocosPdf(r.sec.tecnicas, [[r.sec.tecCliente, r.tecnicas.cliente], [r.sec.tecInternas, r.tecnicas.internas], [r.sec.adicionais, r.tecnicas.adicionais]])
  if (r.itens.length) {
    secao(r.sec.detalhamento)
    r.itens.forEach((d, n) => {
      const nLinhas = d.texto.reduce((s, p) => s + pdf.splitTextToSize(p, UTIL).length, 0)
      const foto1 = d.fotos.length ? caixaFotos().alturaCm * FOTO_MIN + 1 : 0
      garantir(1.2 + (nLinhas <= 4 ? nLinhas * 0.5 + foto1 : 0))
      y += pt(10)
      fonte(11, true); cor(AZUL); pdf.text(`${n + 1}. ${d.titulo}`.trim(), PAG.esq, y + 0.35)
      y += 0.35 + pt(8)
      paragrafos(d.texto)
      if (d.fotos.length) tabelaFotos(d.fotos)
    })
  }
  if (r.conclusao.length) { secao(r.sec.conclusao); paragrafos(r.conclusao) }

  const total = pdf.getNumberOfPages()
  for (let n = 1; n <= total; n++) { pdf.setPage(n); cabecalho(); rodape(n, total) }
  return pdf.output('blob')
}

// ======================================================================== Word
export async function gerarWord(ins, dets, fotos, { interno = false } = {}) {
  const d = await import('docx')
  const r = await preparar(ins, dets, fotos, interno)
  const CM = 567                       // twips por cm
  const PX = 37.8                      // pixels (96 dpi) por cm, usado pelo ImageRun
  const run = (texto, cor, tam, negrito = false) => new d.TextRun({ text: texto || '', color: hex(cor), size: tam, bold: negrito, font: 'Arial' })
  const semBorda = { top: { style: d.BorderStyle.NONE, size: 0 }, bottom: { style: d.BorderStyle.NONE, size: 0 }, left: { style: d.BorderStyle.NONE, size: 0 }, right: { style: d.BorderStyle.NONE, size: 0 } }
  const borda = (c, s = 4) => ({ style: d.BorderStyle.SINGLE, size: s, color: hex(c) })
  const todas = (c, s) => ({ top: borda(c, s), bottom: borda(c, s), left: borda(c, s), right: borda(c, s) })
  const celula = (filhos, largCm, extra = {}) => new d.TableCell({ children: filhos, width: { size: largCm * CM, type: d.WidthType.DXA }, ...extra })
  const tabela = (linhas, largs, extra = {}) => new d.Table({ rows: linhas, columnWidths: largs.map((l) => l * CM), width: { size: UTIL * CM, type: d.WidthType.DXA }, layout: d.TableLayoutType.FIXED, ...extra })

  const cabecalho = new d.Header({
    children: [
      tabela([new d.TableRow({
        children: [
          celula([new d.Paragraph({ alignment: d.AlignmentType.CENTER, children: r.logo ? [new d.ImageRun({ data: r.logo.dados, type: r.logo.tipo, transformation: { width: 5.8 * PX, height: 5.8 * PX * r.logo.h / r.logo.w } })] : [] })],
            6.2, { borders: { ...semBorda, right: borda(AZUL, 10) }, verticalAlign: d.VerticalAlign.CENTER }),
          celula([new d.Paragraph({ indent: { left: 200 }, spacing: { after: 40 }, children: [run(EMPRESA, AZUL_ESCURO, 22, true)] }),
            ...CONTATOS.map((l) => new d.Paragraph({ indent: { left: 200 }, spacing: { after: 20 }, children: [run(l, AZUL_ESCURO, 16)] }))],
          11.4, { borders: semBorda, verticalAlign: d.VerticalAlign.CENTER }),
        ],
      })], [6.2, 11.4], { borders: d.TableBorders.NONE }),
      new d.Paragraph({ border: { bottom: { style: d.BorderStyle.SINGLE, size: 24, color: hex(AZUL), space: 1 } }, children: [] }),
    ],
  })

  const rotuloValor = (rot, val, corVal, tamVal = 14) => [
    new d.Paragraph({ children: [run(rot, AZUL_ESCURO, 13, true)] }),
    new d.Paragraph({ children: [run(val, corVal, tamVal)] }),
  ]
  const rodape = new d.Footer({
    children: [
      tabela([new d.TableRow({
        children: [
          celula(rotuloValor('CONFIDENCIALIDADE', 'Reprodução somente com autorização.', CINZA), 4.3, { borders: semBorda }),
          celula(rotuloValor('ELABORADO POR', ins.elaborado_por, AZUL_ESCURO), 3.6, { borders: { ...semBorda, left: borda(AZUL_CLARO_BORDA) } }),
          celula(rotuloValor('APROVADO POR', ins.aprovado_por, AZUL_ESCURO), 3.6, { borders: { ...semBorda, left: borda(AZUL_CLARO_BORDA) } }),
          celula(rotuloValor('SETOR', ins.setor, AZUL_ESCURO), 3.2, { borders: { ...semBorda, left: borda(AZUL_CLARO_BORDA) } }),
          celula([new d.Paragraph({ children: [run('PÁGINA', AZUL_ESCURO, 13, true)] }),
            new d.Paragraph({ children: [new d.TextRun({ children: [d.PageNumber.CURRENT, ' de ', d.PageNumber.TOTAL_PAGES], size: 16, font: 'Arial', color: hex(AZUL_ESCURO) })] })],
          2.9, { borders: { ...semBorda, left: borda(AZUL_CLARO_BORDA) } }),
        ],
      })], [4.3, 3.6, 3.6, 3.2, 2.9], { borders: d.TableBorders.NONE }),
      new d.Paragraph({ alignment: d.AlignmentType.CENTER, shading: { type: d.ShadingType.CLEAR, fill: hex(AZUL), color: 'auto' }, spacing: { before: 80 },
        children: [run('PHENIX - TECENDO FACILIDADES', [255, 255, 255], 18, true)] }),
    ],
  })

  const corpo = []
  corpo.push(tabela([new d.TableRow({
    children: [['TIPO DE DOCUMENTO', 'Relatório de Inspeção', 4.6], ['NOME', `Nº ${ins.numero}`, 4.2], ['REVISÃO', pad(ins.revisao), 4.0], ['DATA', dataHora(ins.alterado_em), 4.8]]
      .map(([rot, val, l]) => celula([new d.Paragraph({ children: [run(rot, AZUL, 15, true)] }), new d.Paragraph({ children: [run(val, AZUL_ESCURO, 18)] })], l, { borders: todas(AZUL_BORDA, 6) })),
  })], [4.6, 4.2, 4.0, 4.8]))
  corpo.push(new d.Paragraph({ alignment: d.AlignmentType.CENTER, spacing: { before: 360, after: 80 }, children: [run(ins.titulo, AZUL_ESCURO, 32, true)] }))
  if (r.interno) corpo.push(new d.Paragraph({ alignment: d.AlignmentType.CENTER, spacing: { after: 80 }, children: [run('VERSÃO INTERNA - USO EXCLUSIVO PHENIX - NÃO ENVIAR AO CLIENTE', [0xb4, 0x23, 0x18], 18, true)] }))

  const secao = (t) => corpo.push(new d.Paragraph({ keepNext: true, spacing: { before: 280, after: 120 },
    border: { bottom: { style: d.BorderStyle.SINGLE, size: 8, color: hex(AZUL), space: 2 } }, children: [run(t, AZUL_ESCURO, 22, true)] }))
  const subtitulo = (t) => corpo.push(new d.Paragraph({ keepNext: true, spacing: { before: 160, after: 80 }, children: [run(t.toUpperCase(), AZUL, 19, true)] }))
  const texto = (l) => corpo.push(new d.Paragraph({ alignment: d.AlignmentType.JUSTIFIED, spacing: { after: 60 }, children: [run(l, TEXTO, 20)] }))
  const campos = (lista) => {
    const linhasT = []
    for (let i = 0; i < lista.length; i += 2) {
      linhasT.push(new d.TableRow({
        cantSplit: true,
        children: [lista[i], lista[i + 1]].flatMap((c) => [
          celula([new d.Paragraph({ children: [run(c ? c.rotulo.toUpperCase() : '', AZUL, 15, true)] })], 3.35,
            { borders: todas(AZUL_BORDA), shading: { type: d.ShadingType.CLEAR, fill: hex(FUNDO_ROTULO), color: 'auto' }, verticalAlign: d.VerticalAlign.CENTER }),
          celula([new d.Paragraph({ children: [run(c ? c.valor : '', TEXTO, 19)] })], 5.45, { borders: todas(AZUL_BORDA), verticalAlign: d.VerticalAlign.CENTER }),
        ]),
      }))
    }
    corpo.push(tabela(linhasT, [3.35, 5.45, 3.35, 5.45]))
  }
  const fotosTabela = (lista) => {
    const caixa = caixaFotos()
    // uma tabela por linha: colunas [margem, foto, espaço, foto, margem] - a linha incompleta fica centralizada
    for (let i = 0; i < lista.length; i += caixa.colunas) {
      const linha = lista.slice(i, i + caixa.colunas)
      const largs = []
      linha.forEach((_, k) => { if (k) largs.push(caixa.espacoCm); largs.push(caixa.larguraCm) })
      const sobra = (UTIL - largs.reduce((s, l) => s + l, 0)) / 2
      largs.unshift(sobra); largs.push(sobra)
      const vazia = (l) => celula([new d.Paragraph({ children: [] })], l, { borders: semBorda })
      const montar = (foto) => largs.map((l, c) => {
        const f = c % 2 === 1 ? linha[(c - 1) / 2] : null
        if (!f) return vazia(l)
        if (!foto) return celula([new d.Paragraph({ alignment: d.AlignmentType.CENTER, spacing: { after: 100 }, children: [run(f.legenda || '', CINZA, 16)] })], l, { borders: semBorda, verticalAlign: d.VerticalAlign.TOP })
        const { l: lf, a } = ajustarFoto(caixa, f.w, f.h)
        return celula([new d.Paragraph({ keepNext: true, alignment: d.AlignmentType.CENTER, children: [new d.ImageRun({ data: f.dados, type: f.tipo, transformation: { width: lf * PX, height: a * PX } })] })], l,
          { borders: todas(AZUL_CLARO_BORDA), shading: { type: d.ShadingType.CLEAR, fill: hex(FUNDO_MOLDURA), color: 'auto' }, verticalAlign: d.VerticalAlign.CENTER, margins: { top: 0, bottom: 0, left: 0, right: 0 } })
      })
      corpo.push(tabela([
        new d.TableRow({ cantSplit: true, height: { value: caixa.alturaCm * CM, rule: d.HeightRule.EXACT }, children: montar(true) }),
        new d.TableRow({ cantSplit: true, children: montar(false) }),
      ], largs, { borders: d.TableBorders.NONE }))
      // parágrafo entre as tabelas: sem ele o Word funde tabelas vizinhas
      corpo.push(new d.Paragraph({ spacing: { before: 0, after: 0 }, children: [run('', TEXTO, 8)] }))
    }
  }

  const blocosWord = (titulo, blocos) => {
    const cheios = blocos.filter(([, l]) => l.length)
    if (!cheios.length) return
    secao(titulo)
    cheios.forEach(([sub, l], i) => {
      if (sub) subtitulo(sub)
      else if (i) corpo.push(new d.Paragraph({ children: [] }))   // sem parágrafo entre tabelas o Word funde
      campos(l)
    })
  }
  blocosWord(r.sec.saida, [[null, r.saida.padrao], [r.sec.adicionais, r.saida.adicionais]])
  blocosWord(r.sec.dados, [[null, r.dados.padrao], [r.sec.adicionais, r.dados.adicionais]])
  blocosWord(r.sec.tecnicas, [[r.sec.tecCliente, r.tecnicas.cliente], [r.sec.tecInternas, r.tecnicas.internas], [r.sec.adicionais, r.tecnicas.adicionais]])
  if (r.itens.length) {
    secao(r.sec.detalhamento)
    r.itens.forEach((it, n) => {
      corpo.push(new d.Paragraph({ keepNext: true, spacing: { before: 200, after: 160 }, children: [run(`${n + 1}. ${it.titulo}`.trim(), AZUL, 22, true)] }))
      it.texto.forEach(texto)
      if (it.fotos.length) fotosTabela(it.fotos)
    })
  }
  if (r.conclusao.length) { secao(r.sec.conclusao); r.conclusao.forEach(texto) }

  const doc = new d.Document({
    creator: ins.elaborado_por || 'Radar', title: `${ins.titulo} Nº ${ins.numero}`,
    styles: { default: { document: { run: { font: 'Arial' } } } },
    sections: [{
      properties: { page: { size: { width: PAG.l * CM, height: PAG.a * CM }, margin: { top: PAG.topo * CM, bottom: PAG.base * CM, left: PAG.esq * CM, right: PAG.dir * CM, header: 0.3 * CM, footer: 0.4 * CM } } },
      headers: { default: cabecalho }, footers: { default: rodape }, children: corpo,
    }],
  })
  return d.Packer.toBlob(doc)
}

export function baixar(blob, nome) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = nome
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 30000)
}

export async function paraBase64(blob) {
  const s = await new Promise((ok) => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(blob) })
  return String(s).split(',')[1]
}
