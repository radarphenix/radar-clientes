// Atualização dos apps Veste Phenix (feira e promoção) em tablets que ficam abertos o dia todo.
// O service worker (registerType autoUpdate) instala a versão nova sozinho, mas a página aberta
// continua com o JavaScript antigo até recarregar. Aqui: procura versão nova periodicamente e,
// quando ela assume, recarrega só em momentos seguros (menu, formulário da promoção zerado),
// nunca no meio de um cadastro.
const INTERVALO_VERIFICACAO = 5 * 60 * 1000
let atualizacaoPendente = false
let iniciado = false

export function iniciarVerificacaoAtualizacao() {
  if (iniciado || !('serviceWorker' in navigator)) return
  iniciado = true
  // Sem controlador no carregamento = primeira instalação, não é atualização.
  const tinhaVersaoAnterior = Boolean(navigator.serviceWorker.controller)
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (tinhaVersaoAnterior) atualizacaoPendente = true })
  const verificar = () => navigator.serviceWorker.getRegistration().then(r => r?.update()).catch(() => { /* offline: tenta depois */ })
  setInterval(verificar, INTERVALO_VERIFICACAO)
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') verificar() })
}

// Chamar só onde recarregar não perde nada. Devolve true se a página vai recarregar.
export function recarregarSeAtualizado() {
  if (!atualizacaoPendente || !navigator.onLine) return false
  window.location.reload()
  return true
}
