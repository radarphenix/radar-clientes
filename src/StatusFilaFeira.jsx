import React from 'react'
import { assinarFila, processarFila, descartarRecusado } from './filaCadastroProdutos'

// Aviso fixo no app da feira enquanto houver cadastros de produtos guardados no aparelho.
export default function StatusFilaFeira() {
  const [estado, setEstado] = React.useState({ pendentes: 0, recusados: [], enviando: false })
  React.useEffect(() => assinarFila(setEstado), [])
  const { pendentes, recusados, enviando } = estado
  if (!pendentes && !recusados.length) return null
  return <div className="status-fila-feira" role="status">
    {pendentes > 0 && <p>
      <span>{enviando ? 'Enviando cadastros guardados…' : `${pendentes} ${pendentes === 1 ? 'cadastro aguardando' : 'cadastros aguardando'} internet para envio`}</span>
      {!enviando && <button type="button" onClick={processarFila}>Enviar agora</button>}
    </p>}
    {recusados.map(r => <p key={r.id} className="recusado">
      <span>Cadastro de {r.body.empresa}{r.body.maquina ? ` (${r.body.maquina})` : ''} não foi aceito: {r.recusado}</span>
      <button type="button" onClick={() => { if (window.confirm('Descartar este cadastro guardado? Ele não será enviado.')) descartarRecusado(r.id) }}>Descartar</button>
    </p>)}
  </div>
}
