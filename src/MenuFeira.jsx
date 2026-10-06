import { useEffect, useState } from 'react'
import './menu-feira.css'
import { registrarEvento } from './eventosVestePhenix.js'

// Demonstração do VestControl (outro sistema Phenix): abre já logado em modo somente leitura; o botão
// "Voltar ao Veste Phenix" de lá traz de volta para esta tela.
const VESTCONTROL_DEMO = 'https://vestcontrol.pages.dev/demo'

function abrirVestControl() {
  registrarEvento('menu_vestcontrol', 'stand')
  const voltar = `${window.location.origin}/feira/veste-phenix`
  window.location.href = `${VESTCONTROL_DEMO}?voltar=${encodeURIComponent(voltar)}`
}

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
    <main className="menu-feira"><section><p className="eyebrow">FEIRA VESTE PHENIX</p><h1>Escolha o atendimento</h1><p>Cadastre participantes da promoção, registre as necessidades de produtos para cada máquina ou conheça o VestControl.</p><div className="menu-acoes"><button onClick={() => { registrarEvento('menu_veste_phenix', 'stand'); abrirPromocao() }}>Veste Phenix</button><button className="botao-secundario" onClick={() => { registrarEvento('menu_cadastro_produtos', 'stand'); abrirCadastro() }}>Cadastro de Produtos</button><button className="botao-vestcontrol" onClick={abrirVestControl}>VestControl<small>demonstração</small></button>{prompt && <button className="botao-instalar" onClick={instalar}>Instalar Veste Phenix</button>}</div></section></main>
    <footer>Phenix • Tecendo Facilidades</footer>
  </>
}
