// Tela com alterações sem salvar registra aqui uma função que pergunta antes de sair.
// O App consulta antes de trocar de tela (menu, atalhos, sair).
let guarda = null

export function definirGuardaSaida(fn) {
  guarda = fn
  return () => { if (guarda === fn) guarda = null }
}

export function podeTrocarDeTela() {
  if (!guarda) return true
  return guarda()
}
