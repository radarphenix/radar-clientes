// Marcações simples sobre a foto (círculo, seta, retângulo) para apontar o defeito.
// O arquivo no Drive nunca muda: as formas ficam em inspecao_fotos.extras.marcas, em coordenadas
// de 0 a 1 (relativas à largura/altura da foto), e são desenhadas por cima na tela e no relatório.
// Formato (igual ao desktop MWInspecaoQualidade, Foto.Marcas): { tipo, cor, x1, y1, x2, y2 }.

export const TIPOS = ['circulo', 'seta', 'retangulo']
export const AZUL_PHENIX = '#1F64AD'
/** Azul da Phenix é o padrão; as outras servem para foto com fundo azul. */
export const CORES = [
  { cor: AZUL_PHENIX, nome: 'Azul Phenix' },
  { cor: '#E02424', nome: 'Vermelho' },
  { cor: '#FACC15', nome: 'Amarelo' },
  { cor: '#FFFFFF', nome: 'Branco' },
]

export const marcasDe = (foto) => (Array.isArray(foto?.extras?.marcas) ? foto.extras.marcas : [])

/** Espessura do traço proporcional à foto (fica igual em miniatura, tela e relatório). */
export const espessura = (w, h) => Math.max(2, Math.max(w, h) * 0.008)

/** Pontas da seta (em pixels da foto). */
function pontaSeta(x1, y1, x2, y2, t) {
  const ang = Math.atan2(y2 - y1, x2 - x1), tam = t * 4.5, abre = Math.PI / 7
  return [
    [x2 - tam * Math.cos(ang - abre), y2 - tam * Math.sin(ang - abre)],
    [x2 - tam * Math.cos(ang + abre), y2 - tam * Math.sin(ang + abre)],
  ]
}

/** Elementos SVG de uma marca, em pixels da foto (viewBox = tamanho natural). */
export function formaSvg(m, w, h) {
  const t = espessura(w, h)
  const x1 = m.x1 * w, y1 = m.y1 * h, x2 = m.x2 * w, y2 = m.y2 * h
  const base = { stroke: m.cor || AZUL_PHENIX, strokeWidth: t, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' }
  if (m.tipo === 'seta') {
    const [a, b] = pontaSeta(x1, y1, x2, y2, t)
    return { tipo: 'path', props: { ...base, d: `M${x1},${y1} L${x2},${y2} M${a[0]},${a[1]} L${x2},${y2} L${b[0]},${b[1]}` } }
  }
  const x = Math.min(x1, x2), y = Math.min(y1, y2), l = Math.abs(x2 - x1), a = Math.abs(y2 - y1)
  if (m.tipo === 'retangulo') return { tipo: 'rect', props: { ...base, x, y, width: l, height: a, rx: t } }
  return { tipo: 'ellipse', props: { ...base, cx: x + l / 2, cy: y + a / 2, rx: l / 2, ry: a / 2 } }
}

/** Desenha as marcas num canvas do tamanho da foto. */
export function desenharNoCanvas(ctx, marcas, w, h) {
  const t = espessura(w, h)
  ctx.lineWidth = t; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  for (const m of marcas) {
    ctx.strokeStyle = m.cor || AZUL_PHENIX
    const x1 = m.x1 * w, y1 = m.y1 * h, x2 = m.x2 * w, y2 = m.y2 * h
    ctx.beginPath()
    if (m.tipo === 'seta') {
      const [a, b] = pontaSeta(x1, y1, x2, y2, t)
      ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.moveTo(a[0], a[1]); ctx.lineTo(x2, y2); ctx.lineTo(b[0], b[1])
    } else {
      const x = Math.min(x1, x2), y = Math.min(y1, y2), l = Math.abs(x2 - x1), al = Math.abs(y2 - y1)
      if (m.tipo === 'retangulo') ctx.rect(x, y, l, al)
      else ctx.ellipse(x + l / 2, y + al / 2, l / 2, al / 2, 0, 0, Math.PI * 2)
    }
    ctx.stroke()
  }
}

/** Marca pequena demais (toque sem arrastar) é descartada. */
export const marcaValida = (m) => Math.hypot(m.x2 - m.x1, m.y2 - m.y1) > 0.02

/** JPEG com as marcas "carimbadas", só para o relatório (o original no Drive não muda). */
export async function urlComMarcas(url, marcas) {
  if (!marcas.length) return url
  const img = await new Promise((ok, erro) => { const i = new Image(); i.onload = () => ok(i); i.onerror = erro; i.src = url })
  const c = document.createElement('canvas')
  c.width = img.naturalWidth; c.height = img.naturalHeight
  const ctx = c.getContext('2d')
  ctx.drawImage(img, 0, 0)
  desenharNoCanvas(ctx, marcas, c.width, c.height)
  const blob = await new Promise((ok) => c.toBlob(ok, 'image/jpeg', 0.9))
  return URL.createObjectURL(blob)
}

// desktop usa PascalCase no JSON
export const marcasParaDesktop = (ms) => ms.map((m) => ({ Tipo: m.tipo, Cor: m.cor, X1: m.x1, Y1: m.y1, X2: m.x2, Y2: m.y2 }))
export const marcasDoDesktop = (ms) => (ms || []).map((m) => ({ tipo: m.Tipo, cor: m.Cor, x1: m.X1, y1: m.Y1, x2: m.X2, y2: m.Y2 }))
