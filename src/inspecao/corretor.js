// Corretor de português pelo LanguageTool (grátis, sem cadastro) - tradução de CorretorService.cs.
// Só sugere; a tela mostra e a pessoa escolhe. Só o texto do campo sai para o serviço.

export async function verificar(texto) {
  const r = await fetch('https://api.languagetool.org/v2/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ text: texto, language: 'pt-BR' }),
  })
  if (r.status === 429) throw new Error('Muitos pedidos seguidos ao corretor. Aguarde um minuto e tente de novo.')
  if (!r.ok) throw new Error(`Corretor indisponível (${r.status}).`)
  const j = await r.json()
  const lista = []
  for (const m of j.matches || []) {
    if (m.rule?.issueType === 'style' || !m.replacements?.length) continue   // estilo fica de fora: aqui é correção
    if (m.offset < 0 || m.offset + m.length > texto.length) continue
    lista.push({ inicio: m.offset, tamanho: m.length, original: texto.substr(m.offset, m.length), sugestao: m.replacements[0].value, motivo: m.message })
  }
  // sobreposição (raro): fica a primeira
  const sem = []
  for (const c of lista.sort((a, b) => a.inicio - b.inicio)) {
    const u = sem[sem.length - 1]
    if (!u || c.inicio >= u.inicio + u.tamanho) sem.push(c)
  }
  return sem
}

/** Aplica só as escolhidas, do fim para o começo (as posições não se deslocam). */
export function aplicar(texto, escolhidas) {
  return [...escolhidas].sort((a, b) => b.inicio - a.inicio)
    .reduce((t, c) => t.slice(0, c.inicio) + c.sugestao + t.slice(c.inicio + c.tamanho), texto)
}
