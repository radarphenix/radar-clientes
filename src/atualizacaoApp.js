// Atualização automática dos apps (Radar instalado, feira e promoção do Veste Phenix).
// O service worker (registerType autoUpdate) instala a versão nova sozinho, mas a página aberta
// continua com o JavaScript antigo até recarregar. Aqui: procura versão nova periodicamente e,
// quando ela assume, recarrega só em momentos seguros, nunca no meio de um cadastro.
//
// Dois problemas resolvidos:
// 1. Versão nova pendente: a feira recarrega no menu/formulário zerado (recarregarSeAtualizado);
//    o Radar recarrega quando o app volta a ficar visível depois de 15 min ou mais em segundo plano
//    e não há edição aberta (iniciarAtualizacaoRadar).
// 2. Código antigo sumiu: depois de um deploy, a aba antiga pede um arquivo .js que não existe mais
//    ("Failed to fetch dynamically imported module"). Não há como continuar sem recarregar, então
//    recarrega na hora (no máximo uma vez a cada 30 s, para nunca entrar em laço).
const INTERVALO_VERIFICACAO = 5 * 60 * 1000
const AUSENCIA_MINIMA_RADAR = 15 * 60 * 1000
const JANELA_APOS_VOLTAR = 30 * 1000
const CHAVE_ULTIMO_RECARREGAR = 'radar.recarregouPorVersaoAntiga'
let atualizacaoPendente = false
let iniciado = false
let ouvindoErros = false

export function iniciarVerificacaoAtualizacao() {
  ouvirErrosDeVersaoAntiga()
  if (iniciado || !('serviceWorker' in navigator)) return
  iniciado = true
  // Sem controlador no carregamento = primeira instalação, não é atualização.
  const tinhaVersaoAnterior = Boolean(navigator.serviceWorker.controller)
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!tinhaVersaoAnterior) return
    atualizacaoPendente = true
    aoChegarAtualizacao.forEach((f) => f())
  })
  setInterval(verificarAgora, INTERVALO_VERIFICACAO)
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') verificarAgora() })
}

function verificarAgora() {
  return navigator.serviceWorker.getRegistration().then((r) => r?.update()).catch(() => { /* offline: tenta depois */ })
}

const aoChegarAtualizacao = []

// Chamar só onde recarregar não perde nada. Devolve true se a página vai recarregar.
export function recarregarSeAtualizado() {
  if (!atualizacaoPendente || !navigator.onLine) return false
  window.location.reload()
  return true
}

/**
 * Radar (app instalado ou aba): troca para a versão nova quando a pessoa volta ao app depois de
 * ficar 15 min ou mais fora, e só se `telaLivre()` disser que nada será perdido.
 * Se a versão nova chega logo depois de voltar (o update é verificado no retorno), também vale.
 */
export function iniciarAtualizacaoRadar(telaLivre) {
  iniciarVerificacaoAtualizacao()
  let escondidoDesde = document.visibilityState === 'hidden' ? Date.now() : null
  let voltouLongaAusenciaAte = 0
  const tentar = () => {
    if (Date.now() <= voltouLongaAusenciaAte && telaLivre()) recarregarSeAtualizado()
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') { escondidoDesde = Date.now(); return }
    const ausencia = escondidoDesde ? Date.now() - escondidoDesde : 0
    escondidoDesde = null
    if (ausencia >= AUSENCIA_MINIMA_RADAR) {
      voltouLongaAusenciaAte = Date.now() + JANELA_APOS_VOLTAR
      tentar()
    }
  })
  aoChegarAtualizacao.push(tentar)
}

export function ehErroDeVersaoAntiga(erro) {
  const msg = String(erro?.message || erro || '')
  return /dynamically imported module|Importing a module script failed|error loading dynamically imported module|Failed to load module script|Unable to preload CSS/i.test(msg)
}

/** Se o erro é de código antigo que sumiu, recarrega e devolve true (quem chamou não mostra erro). */
export function recarregarPorVersaoAntiga(erro) {
  if (!ehErroDeVersaoAntiga(erro) || !navigator.onLine) return false
  let ultimo = 0
  try { ultimo = Number(sessionStorage.getItem(CHAVE_ULTIMO_RECARREGAR)) || 0 } catch { /* modo privado */ }
  if (Date.now() - ultimo < 30000) return false // já recarregou agora há pouco e o erro voltou: mostra o erro
  try { sessionStorage.setItem(CHAVE_ULTIMO_RECARREGAR, String(Date.now())) } catch { /* modo privado */ }
  window.location.reload()
  return true
}

// Rede de segurança para imports dinâmicos sem try/catch (telas lazy, janelas).
function ouvirErrosDeVersaoAntiga() {
  if (ouvindoErros) return
  ouvindoErros = true
  window.addEventListener('vite:preloadError', (ev) => { if (recarregarPorVersaoAntiga(ev.payload)) ev.preventDefault() })
  window.addEventListener('unhandledrejection', (ev) => { if (recarregarPorVersaoAntiga(ev.reason)) ev.preventDefault() })
}
