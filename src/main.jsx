import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import FormularioPromocao from './FormularioPromocao.jsx'

// Página pública sem login e sem menu — só alcançável pelo link direto.
const ROTA_PROMOCAO_VESTE_PHENIX = '/promo/veste-phenix'
const rota = window.location.pathname.replace(/\/+$/, '') || '/'
const ehPromocao = rota === ROTA_PROMOCAO_VESTE_PHENIX

if (ehPromocao) {
  document.title = 'Veste Phenix — 30 anos'
  const favicon = document.querySelector('link[rel="icon"]')
  if (favicon) favicon.href = '/favicon-veste-phenix.png'
  const appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]')
  if (appleTouchIcon) appleTouchIcon.href = '/favicon-veste-phenix.png'
  const themeColor = document.querySelector('meta[name="theme-color"]')
  if (themeColor) themeColor.setAttribute('content', '#0e5886')
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {ehPromocao ? <FormularioPromocao /> : <App />}
  </StrictMode>,
)
