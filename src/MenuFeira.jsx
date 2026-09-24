import React, { useEffect, useState } from 'react'
import './menu-feira.css'

export default function MenuFeira({ abrirPromocao, abrirCadastro }) {
  const [prompt, setPrompt] = useState(null)

  useEffect(() => {
    const receber = (event) => { event.preventDefault(); setPrompt(event) }
    const instalado = () => setPrompt(null)
    window.addEventListener('beforeinstallprompt', receber)
    window.addEventListener('appinstalled', instalado)
    return () => {
      window.removeEventListener('beforeinstallprompt', receber)
      window.removeEventListener('appinstalled', instalado)
    }
  }, [])

  async function instalar() {
    if (!prompt) return
    prompt.prompt()
    await prompt.userChoice
    setPrompt(null)
  }

  return <>
    <header><img className="marca-30-cabecalho" src="/phenix-30-anos-transparente.png" alt="Phenix 30 anos" /><span>VESTE PHENIX</span></header>
    <main className="menu-feira"><section><p className="eyebrow">FEIRA VESTE PHENIX</p><h1>Escolha o atendimento</h1><p>Cadastre participantes da promoção ou registre as necessidades de produtos para cada máquina.</p><div className="menu-acoes"><button onClick={abrirPromocao}>Veste Phenix</button><button className="botao-secundario" onClick={abrirCadastro}>Cadastro de Produtos</button>{prompt && <button className="botao-instalar" onClick={instalar}>Instalar Veste Phenix</button>}</div></section></main>
    <footer>Phenix • Tecendo Facilidades</footer>
  </>
}
