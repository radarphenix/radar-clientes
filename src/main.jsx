import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import FormularioPromocao from './FormularioPromocao.jsx'
import FeiraVestePhenix from './FeiraVestePhenix.jsx'

// Página pública sem login e sem menu — só alcançável pelo link direto.
const ROTA_PROMOCAO_VESTE_PHENIX = '/promo/veste-phenix'
const ROTA_FEIRA_VESTE_PHENIX = '/feira/veste-phenix'
// O Radar mora em /radar/ (escopo do app instalado). Quem entra pela raiz — links
// antigos, e-mails de recuperação de senha, instalações antigas — vai para /radar/
// sem recarregar, preservando ?query e #hash (tokens do Supabase Auth).
const ROTA_RADAR = '/radar'
const rotaInicial = window.location.pathname.replace(/\/+$/, '') || '/'
if (rotaInicial === '/') {
  window.history.replaceState(window.history.state, '', `${ROTA_RADAR}/${window.location.search}${window.location.hash}`)
}
const rota = window.location.pathname.replace(/\/+$/, '') || '/'
const ehPromocao = rota === ROTA_PROMOCAO_VESTE_PHENIX
const ehFeiraVestePhenix = rota === ROTA_FEIRA_VESTE_PHENIX

function identidadeVestePhenix(titulo) {
  document.title = titulo
  const favicon = document.querySelector('link[rel="icon"]')
  if (favicon) favicon.href = '/favicon-veste-phenix.png'
  const appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]')
  if (appleTouchIcon) appleTouchIcon.href = '/veste-phenix-apple-touch-180x180.png'
  const appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]')
  if (appleTitle) appleTitle.setAttribute('content', 'Veste Phenix')
  const themeColor = document.querySelector('meta[name="theme-color"]')
  if (themeColor) themeColor.setAttribute('content', '#0e5886')
}

if (ehPromocao) {
  identidadeVestePhenix('Veste Phenix — 30 anos')
  // Página pública de inscrição: não oferece instalar o Radar.
  document.querySelector('link[rel="manifest"]')?.remove()
}

if (ehFeiraVestePhenix) {
  identidadeVestePhenix('Veste Phenix — Feira')
  const manifest = document.querySelector('link[rel="manifest"]')
  if (manifest) manifest.href = '/manifest-feira-veste-phenix.webmanifest'
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {ehPromocao ? <FormularioPromocao /> : ehFeiraVestePhenix ? <FeiraVestePhenix /> : <App />}
  </StrictMode>,
)
