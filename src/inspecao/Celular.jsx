import { useEffect, useRef, useState } from 'react'
import './inspecao.css'
import { enviarFotoCelular, sessaoCelular } from './api'

/** Página do celular (QR Code): tira ou escolhe fotos e manda direto para o item aberto no computador. */
export default function Celular() {
  const token = new URLSearchParams(location.search).get('t') || ''
  const [info, setInfo] = useState(null)
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(0)
  const [enviadas, setEnviadas] = useState([])
  const [concluido, setConcluido] = useState(false)
  const entrada = useRef(null)
  const camera = useRef(null)

  useEffect(() => { sessaoCelular(token).then(setInfo).catch((e) => setErro(e.message)) }, [token])

  async function enviar(arquivos) {
    setErro('')
    const lista = [...arquivos]
    setEnviando((n) => n + lista.length)
    for (const f of lista) {
      try {
        await enviarFotoCelular(token, f)
        setEnviadas((e) => [...e, URL.createObjectURL(f)])
      } catch (e) { setErro(e.message) }
      setEnviando((n) => n - 1)
    }
  }

  if (concluido) {
    return <div className="iq-raiz pagina-celular"><div className="iq-cel"><div className="iq-ok grande">Envio concluído - pode fechar esta página.</div></div></div>
  }
  return (
    <div className="iq-raiz pagina-celular"><div className="iq-cel">
      <img src="https://phenixonline.com.br/wp-content/uploads/2021/05/Logo-azul.png" alt="Phenix" style={{ height: 32, alignSelf: 'flex-start' }} />
      {info ? (
        <div className="iq-card" style={{ gap: 4 }}>
          <b>Inspeção {info.numero}</b>
          <span>{info.cliente || 'sem cliente'}</span>
          <span className="iq-dica">Item: {info.item || 'sem título'}</span>
        </div>
      ) : !erro && <div className="iq-vazio">Abrindo...</div>}
      {erro && <div className="iq-alerta">{erro}</div>}
      {info && (
        <>
          {/* câmera em botão próprio: com "multiple" o Android/iPhone abre só a galeria */}
          <button className="iq-btn prim grande" disabled={enviando > 0} onClick={() => camera.current.click()}>
            {enviando > 0 ? `Enviando ${enviando}...` : '📷 Tirar foto'}
          </button>
          <button className="iq-btn grande" disabled={enviando > 0} onClick={() => entrada.current.click()}>🖼️ Escolher da galeria</button>
          <input ref={camera} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { enviar(e.target.files); e.target.value = '' }} />
          <input ref={entrada} type="file" accept="image/*" multiple hidden onChange={(e) => { enviar(e.target.files); e.target.value = '' }} />
          {enviadas.length > 0 && (
            <>
              <div className="iq-ok">{enviadas.length} foto(s) enviada(s). Já aparecem no computador.</div>
              <div className="miniaturas">{enviadas.map((u) => <img key={u} src={u} alt="" />)}</div>
            </>
          )}
          <button className="iq-btn grande" disabled={enviando > 0} onClick={() => { setConcluido(true); window.close() }}>Concluir</button>
        </>
      )}
    </div></div>
  )
}
