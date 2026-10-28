// O que mudou entre duas revisões - tradução de Services/Comparador.cs do desktop.
// Recebe dois retratos de inspecao_revisoes (inspeção + detalhamentos com fotos).

const vazio = (s) => (s.length ? s.replace(/\r/g, '').replace(/\n/g, ' ⏎ ') : '(vazio)')

function campos(r, grupo, antes = [], depois = []) {
  const mapa = (l) => Object.fromEntries(l.map((c) => [c.rotulo, (c.valor || '').trim()]))
  const a = mapa(antes), d = mapa(depois)
  for (const rotulo of new Set([...Object.keys(a), ...Object.keys(d)])) {
    const va = a[rotulo] || '', vd = d[rotulo] || ''
    if (va !== vd) r.push({ item: `${grupo} - ${rotulo}`, antes: vazio(va), depois: vazio(vd) })
  }
}

const resumo = (d) => `${d.titulo || '(sem título)'} - ${(d.fotos || []).length} foto(s)`

export function comparar(antes, depois) {
  const r = []
  const texto = (item, a, d) => { a = (a || '').trim(); d = (d || '').trim(); if (a !== d) r.push({ item, antes: vazio(a), depois: vazio(d) }) }
  texto('Título', antes.titulo, depois.titulo)
  campos(r, 'Dados gerais', antes.dados_gerais, depois.dados_gerais)
  campos(r, 'Inf. técnicas', antes.informacoes_tecnicas, depois.informacoes_tecnicas)
  campos(r, 'Inf. técnicas saída', antes.informacoes_tecnicas_saida, depois.informacoes_tecnicas_saida)
  const da = antes.detalhamentos || [], dd = depois.detalhamentos || []
  for (let i = 0; i < Math.max(da.length, dd.length); i++) {
    const a = da[i], d = dd[i], item = `Detalhamento ${i + 1}`
    if (!a) { r.push({ item, antes: '(não existia)', depois: resumo(d) }); continue }
    if (!d) { r.push({ item, antes: resumo(a), depois: '(removido)' }); continue }
    texto(`${item} - título`, a.titulo, d.titulo)
    texto(`${item} - descrição`, a.texto, d.texto)
    const fa = (a.fotos || []).map((f) => f.id).join('|'), fd = (d.fotos || []).map((f) => f.id).join('|')
    if (fa !== fd) {
      r.push({ item: `${item} - fotos`, antes: `${(a.fotos || []).length} foto(s)`,
        depois: `${(d.fotos || []).length} foto(s)${(a.fotos || []).length === (d.fotos || []).length ? ' (trocadas ou reordenadas)' : ''}` })
    }
  }
  texto('Conclusão', antes.conclusao, depois.conclusao)
  texto('Elaborado por', antes.elaborado_por, depois.elaborado_por)
  texto('Aprovado por', antes.aprovado_por, depois.aprovado_por)
  texto('Setor', antes.setor, depois.setor)
  return r
}
