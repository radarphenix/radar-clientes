// Tela com alterações sem salvar registra aqui uma função que pergunta antes de sair.
// O App consulta antes de trocar de tela (menu, atalhos, sair).
let guarda = null
// Telas de edição abertas (ex.: editor da Inspeção, que salva sozinho mas pode ter um salvamento
// a caminho). Enquanto houver uma, a atualização automática do app não recarrega a página.
let edicoesAbertas = 0

export function definirGuardaSaida(fn) {
  guarda = fn
  return () => { if (guarda === fn) guarda = null }
}

export function podeTrocarDeTela() {
  if (!guarda) return true
  return guarda()
}

// Devolve a função que libera (usar como retorno de useEffect).
export function marcarEdicaoAberta() {
  edicoesAbertas++
  let liberado = false
  return () => { if (!liberado) { liberado = true; edicoesAbertas-- } }
}

// Sem perguntar nada: true só se não há alteração pendente nem edição aberta.
export function telaLivreParaRecarregar() {
  return !guarda && edicoesAbertas === 0
}
