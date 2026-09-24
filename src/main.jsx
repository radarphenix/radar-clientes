import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import FormularioPromocao from './FormularioPromocao.jsx'
import FeiraVestePhenix from './FeiraVestePhenix.jsx'

// Página pública sem login e sem menu — só alcançável pelo link direto.
const ROTA_PROMOCAO_VESTE_PHENIX = '/promo/veste-phenix'
const ROTA_FEIRA_VESTE_PHENIX = '/feira/veste-phenix'
const rota = window.location.pathname.replace(/\/+$/, '') || '/'
const ehPromocao = rota === ROTA_PROMOCAO_VESTE_PHENIX
const ehFeiraVestePhenix = rota === ROTA_FEIRA_VESTE_PHENIX

if (ehPromocao) {
  document.title = 'Veste Phenix — 30 anos'
  const favicon = document.querySelector('link[rel="icon"]')
  if (favicon) favicon.href = '/favicon-veste-phenix.png'
  const appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]')
  if (appleTouchIcon) appleTouchIcon.href = '/favicon-veste-phenix.png'
  const themeColor = document.querySelector('meta[name="theme-color"]')
  if (themeColor) themeColor.setAttribute('content', '#0e5886')
}

if (ehFeiraVestePhenix) {
  document.title = 'Veste Phenix — Feira'
  const favicon = document.querySelector('link[rel="icon"]')
  if (favicon) favicon.href = '/favicon-veste-phenix.png'
  const appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]')
  if (appleTouchIcon) appleTouchIcon.href = '/favicon-veste-phenix.png'
  const themeColor = document.querySelector('meta[name="theme-color"]')
  if (themeColor) themeColor.setAttribute('content', '#0e5886')
  const manifest = document.querySelector('link[rel="manifest"]')
  if (manifest) manifest.href = '/manifest-feira-veste-phenix.webmanifest'
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {ehPromocao ? <FormularioPromocao /> : ehFeiraVestePhenix ? <FeiraVestePhenix /> : <App />}
  </StrictMode>,
)
