import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import FormularioPromocao from './FormularioPromocao.jsx'

// Página pública sem login e sem menu — só alcançável pelo link direto.
const ROTA_PROMOCAO_VESTE_PHENIX = '/promo/veste-phenix'
const rota = window.location.pathname.replace(/\/+$/, '') || '/'
const Pagina = rota === ROTA_PROMOCAO_VESTE_PHENIX ? FormularioPromocao : App

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Pagina />
  </StrictMode>,
)
