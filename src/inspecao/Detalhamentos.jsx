import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import {
  Plus, ChevronUp, ChevronDown, Trash2, Camera, ImagePlus, Smartphone, X, ChevronLeft, ChevronRight,
  ListPlus, Loader2, GripVertical, SpellCheck,
} from 'lucide-react'
import * as api from './api'
import { TITULOS_PADRAO, TITULOS_SUGERIDOS } from './modelo'

/** Título comparável: "Lateral Esquerda" = "lateral esquerda" = "Lateral esquerda ". */
const chaveTitulo = (t) => (t || '').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

/** Imagem de foto vinda do Drive (a função confere o acesso e devolve a imagem). */
export function FotoDrive({ id, alt }) {
  const [url, setUrl] = useState(null)
  const [falha, setFalha] = useState(false)
  useEffect(() => { api.urlFoto(id).then(setUrl).catch(() => setFalha(true)) }, [id])
  if (falha) return <span className="iq-dica">foto indisponível</span>
  return url ? <img src={url} alt={alt || ''} loading="lazy" /> : <Loader2 className="iq-gira" size={18} />
}

/** Endereço que o celular consegue abrir: em desenvolvimento, troca "localhost" pelo IP da rede. */
function enderecoBase() {
  // eslint-disable-next-line no-undef
  const lan = typeof __INSPECAO_LAN_URL__ !== 'undefined' ? __INSPECAO_LAN_URL__ : ''
  return /^(localhost|127\.)/.test(location.hostname) && lan ? lan : location.origin
}

function Modal({ titulo, fechar, children, largo }) {
  useEffect(() => {
    const tecla = (e) => { if (e.key === 'Escape') fechar() }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [fechar])
  return (
    <div className="iq-modal-fundo" onClick={fechar}>
      <div className={`iq-modal ${largo ? 'largo' : ''}`} role="dialog" aria-modal="true" aria-label={titulo} onClick={(e) => e.stopPropagation()}>
        <header><h3>{titulo}</h3><button type="button" className="iq-icone" onClick={fechar} title="Fechar"><X size={20} /></button></header>
        {children}
      </div>
    </div>
  )
}

/** "Do celular": QR Code que vale enquanto a janela está aberta; as fotos aparecem ao vivo. */
function JanelaCelular({ ins, det, fotosDet, fechar }) {
  const [qr, setQr] = useState(null)
  const [erro, setErro] = useState('')
  const token = useRef(null)
  useEffect(() => {
    let vivo = true
    api.abrirSessaoCelular(ins.id, det.id).then(async (t) => {
      token.current = t
      const u = `${enderecoBase()}/inspecao/celular?t=${t}`
      if (!vivo) return api.encerrarSessaoCelular(t)
      setQr(await QRCode.toDataURL(u, { margin: 1, width: 440 }))
    }).catch((e) => setErro(e.message))
    // fechar a janela encerra o código: endereço antigo responde "janela fechada"
    return () => { vivo = false; if (token.current) api.encerrarSessaoCelular(token.current) }
  }, [ins.id, det.id])
  return (
    <Modal titulo={`Fotos pelo celular - ${det.titulo || 'item sem título'}`} fechar={fechar}>
      {erro && <div className="iq-alerta">{erro}</div>}
      <div className="iq-qr">
        {qr ? <img src={qr} alt="QR Code para enviar fotos" /> : <div className="iq-qr-espera"><Loader2 className="iq-gira" /></div>}
        <div>
          <ol>
            <li>Aponte a câmera do celular para o código.</li>
            <li>Toque em <b>Tirar foto</b> ou <b>Escolher da galeria</b>.</li>
            <li>Cada foto aparece aqui assim que chega.</li>
          </ol>
          <div className="iq-ok">{fotosDet.length} foto(s) neste item</div>
          <div className="iq-qr-miniaturas">{fotosDet.slice(-6).map((f) => <span key={f.id}><FotoDrive id={f.id} /></span>)}</div>
        </div>
      </div>
      <footer><button type="button" className="iq-btn prim" onClick={fechar}>Concluir</button></footer>
    </Modal>
  )
}

/** Foto ampliada: legenda, ordem, mover de item, tirar do relatório. */
function FotoAberta({ foto, indice, total, dets, detAtual, leitura, mudarLegenda, mover, paraItem, remover, navegar, fechar }) {
  const [legenda, setLegenda] = useState(foto.legenda || '')
  const salvarLegenda = () => { if (legenda !== (foto.legenda || '')) mudarLegenda(legenda) }
  return (
    <Modal titulo={`${detAtual.titulo || 'Item'} - foto ${indice + 1} de ${total}`} fechar={() => { salvarLegenda(); fechar() }} largo>
      <div className="iq-foto-grande">
        <button type="button" className="iq-icone nav" disabled={indice === 0} onClick={() => { salvarLegenda(); navegar(-1) }} title="Anterior"><ChevronLeft size={28} /></button>
        <FotoDrive id={foto.id} alt={foto.legenda} />
        <button type="button" className="iq-icone nav" disabled={indice === total - 1} onClick={() => { salvarLegenda(); navegar(1) }} title="Próxima"><ChevronRight size={28} /></button>
      </div>
      <label className="iq-campo">
        <span>Legenda (sai embaixo da foto no relatório)</span>
        <input value={legenda} readOnly={leitura} placeholder="Ex.: emenda descolada na lateral" onChange={(e) => setLegenda(e.target.value)} onBlur={salvarLegenda} />
      </label>
      {!leitura && (
        <footer className="iq-foto-acoes">
          <button type="button" className="iq-btn sec" disabled={indice === 0} onClick={() => mover(-1)}><ChevronLeft size={16} /> Antes</button>
          <button type="button" className="iq-btn sec" disabled={indice === total - 1} onClick={() => mover(1)}>Depois <ChevronRight size={16} /></button>
          <select className="iq-select" value="" aria-label="Mover para outro item" onChange={(e) => { salvarLegenda(); paraItem(e.target.value) }}>
            <option value="">Mover para o item...</option>
            {dets.filter((d) => d.id !== detAtual.id).map((d) => <option key={d.id} value={d.id}>{d.titulo || '(sem título)'}</option>)}
          </select>
          <button type="button" className="iq-btn perigo" onClick={remover}><Trash2 size={16} /> Excluir foto</button>
        </footer>
      )}
    </Modal>
  )
}

function CartaoItem({ det, n, total, fotosDet, aberto, alternar, leitura, mudar, mover, excluir, adicionar, enviando, abrirFoto, abrirCelular, arrasto, corrigir, repetido, moverFoto, removerFoto }) {
  const entrada = useRef(null)
  const camera = useRef(null)
  const tituloAntes = useRef(det.titulo)
  // título repetido volta ao anterior ao sair do campo
  function conferirTitulo() {
    if (!repetido(det.titulo)) { tituloAntes.current = det.titulo; return }
    alert(`Já existe um item "${det.titulo.trim()}" nesta inspeção. Use outro título.`)
    mudar({ titulo: tituloAntes.current })
  }
  const vazio = !(det.texto || '').trim() && !fotosDet.length
  return (
    <article className={`iq-item ${vazio ? 'vazio' : ''} ${aberto ? 'aberto' : ''} ${arrasto.alvo === det.id ? 'alvo' : ''}`}
      onDragOver={(e) => { if (arrasto.foto) { e.preventDefault(); arrasto.setAlvo(det.id) } }}
      onDragLeave={() => arrasto.setAlvo(null)}
      onDrop={(e) => { if (arrasto.foto) { e.preventDefault(); arrasto.soltar(det.id) } }}>
      <header className="iq-item-topo">
        <span className="iq-item-num">{n}</span>
        {aberto && !leitura
          ? <input className="iq-item-titulo" value={det.titulo} placeholder="Título do item" aria-label="Título do item"
              onFocus={() => { tituloAntes.current = det.titulo }} onBlur={conferirTitulo} onChange={(e) => mudar({ titulo: e.target.value })} />
          : <button type="button" className="iq-item-titulo botao" onClick={alternar}>{det.titulo || '(sem título)'}</button>}
        <span className="iq-item-resumo">{fotosDet.length ? `${fotosDet.length} foto${fotosDet.length > 1 ? 's' : ''}` : vazio ? 'vazio' : ''}</span>
        {!leitura && aberto && (
          <span className="iq-item-ordem">
            <button type="button" className="iq-icone" disabled={n === 1} title="Subir" onClick={() => mover(-1)}><ChevronUp size={18} /></button>
            <button type="button" className="iq-icone" disabled={n === total} title="Descer" onClick={() => mover(1)}><ChevronDown size={18} /></button>
            <button type="button" className="iq-icone perigo" title="Excluir item" onClick={excluir}><Trash2 size={17} /></button>
          </span>
        )}
        <button type="button" className="iq-icone" onClick={alternar} title={aberto ? 'Recolher' : 'Abrir'} aria-expanded={aberto}>
          {aberto ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </header>

      {aberto && (
        <div className="iq-item-corpo">
          {/* div + label for: botão dentro de <label> roubaria o rótulo da caixa de texto */}
          <div className="iq-campo">
            <span className="iq-rotulo-acao"><label htmlFor={`iq-desc-${det.id}`}>Descrição</label>
              {!leitura && (det.texto || '').trim() && <button type="button" className="iq-link" onClick={corrigir}><SpellCheck size={14} /> Corrigir texto</button>}
            </span>
            <textarea id={`iq-desc-${det.id}`} rows={3} value={det.texto} readOnly={leitura} placeholder="O que foi observado neste ponto" onChange={(e) => mudar({ texto: e.target.value })} />
          </div>
          <div className="iq-fotos">
            {fotosDet.map((f, i) => (
              <div key={f.id} className="iq-foto" draggable={!leitura}
                onDragStart={() => arrasto.iniciar(f, det.id)} onDragEnd={arrasto.terminar}
                onDragOver={(e) => { if (arrasto.foto) e.preventDefault() }}
                onDrop={(e) => { e.preventDefault(); e.stopPropagation(); arrasto.soltarSobre(det.id, i) }}>
                <button type="button" className="iq-foto-abrir" onClick={() => abrirFoto(i)} title={f.legenda || 'Abrir foto'}>
                  <span className="iq-foto-moldura"><FotoDrive id={f.id} alt={f.legenda} /><span className="iq-foto-n">{i + 1}</span></span>
                  <span className="iq-foto-legenda">{f.legenda || <em>sem legenda</em>}</span>
                </button>
                {!leitura && <GripVertical className="iq-foto-pega so-computador" size={14} aria-hidden="true" />}
                {!leitura && (
                  <span className="iq-foto-barra">
                    <button type="button" className="iq-icone" disabled={i === 0} title="Mover para antes" aria-label="Mover para antes" onClick={() => moverFoto(i, i - 1)}><ChevronLeft size={16} /></button>
                    <button type="button" className="iq-icone" disabled={i === fotosDet.length - 1} title="Mover para depois" aria-label="Mover para depois" onClick={() => moverFoto(i, i + 1)}><ChevronRight size={16} /></button>
                    <button type="button" className="iq-icone perigo" title="Excluir foto" aria-label="Excluir foto" onClick={() => removerFoto(f)}><Trash2 size={15} /></button>
                  </span>
                )}
              </div>
            ))}
            {!leitura && (
              <div className="iq-foto-novas">
                <button type="button" className="iq-btn sec so-celular" onClick={() => camera.current.click()}><Camera size={17} /> Câmera</button>
                <button type="button" className="iq-btn sec" onClick={() => entrada.current.click()}><ImagePlus size={17} /> Adicionar fotos</button>
                <button type="button" className="iq-btn sec so-computador" onClick={abrirCelular}><Smartphone size={17} /> Do celular</button>
                {enviando > 0 && <span className="iq-dica"><Loader2 className="iq-gira" size={14} /> enviando {enviando}...</span>}
              </div>
            )}
          </div>
          {!leitura && <p className="iq-dica so-computador">Arraste fotos do computador para este item; arraste uma foto sobre outra para mudar a ordem, ou para outro item.</p>}
          <input ref={entrada} type="file" accept="image/*" multiple hidden onChange={(e) => { adicionar(e.target.files); e.target.value = '' }} />
          <input ref={camera} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { adicionar(e.target.files); e.target.value = '' }} />
        </div>
      )}
    </article>
  )
}

export default function Detalhamentos({ ins, dets, fotos, leitura, mudarDets, setFotos, setErro, corrigir }) {
  // pré-títulos do cadastro (Tipos de detalhamento); sem cadastro, a lista fixa igual à do desktop
  const [tipos, setTipos] = useState(null)
  useEffect(() => { api.listarTipos().then((t) => setTipos(t.filter((x) => x.ativo))).catch(() => setTipos([])) }, [])
  const titulosPadrao = tipos?.length ? tipos.filter((t) => t.padrao).map((t) => t.nome) : TITULOS_PADRAO
  const titulosOutros = tipos?.length ? tipos.filter((t) => !t.padrao).map((t) => t.nome) : TITULOS_SUGERIDOS
  // começam abertos os itens com conteúdo; os vazios ficam recolhidos
  const [abertos, setAbertos] = useState(() => new Set(dets.filter((d) => (d.texto || '').trim() || (fotos[d.id] || []).length).map((d) => d.id)))
  const [menu, setMenu] = useState(false)
  const [celularDe, setCelularDe] = useState(null)
  const [fotoAberta, setFotoAberta] = useState(null)   // { detId, indice }
  const [enviando, setEnviando] = useState({})
  const [arrastada, setArrastada] = useState(null)      // { foto, detId }
  const [alvo, setAlvo] = useState(null)

  // Esc fecha o menu "Adicionar item" de qualquer lugar
  useEffect(() => {
    if (!menu) return
    const tecla = (e) => { if (e.key === 'Escape') setMenu(false) }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [menu])

  const alternar = (id) => setAbertos((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })

  function mudarDet(id, campos) { mudarDets(dets.map((d) => (d.id === id ? { ...d, ...campos } : d))) }

  function moverDet(i, delta) {
    const j = i + delta
    if (leitura || j < 0 || j >= dets.length) return
    const lista = [...dets]
    const [d] = lista.splice(i, 1)
    lista.splice(j, 0, d)
    mudarDets(lista)
  }

  async function novos(titulos) {
    setMenu(false)
    try {
      const criados = []
      const ja = new Set(dets.map((d) => chaveTitulo(d.titulo)))
      for (const [k, t] of titulos.filter((x) => !ja.has(chaveTitulo(x))).entries()) criados.push(await api.novoDetalhamento(ins.id, t, dets.length + k))
      if (!criados.length) return
      mudarDets([...dets, ...criados])
      setAbertos((s) => new Set([...s, ...criados.map((c) => c.id)]))
      setTimeout(() => document.getElementById(`iq-item-${criados[0]?.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50)
    } catch (e) { setErro(e.message) }
  }

  async function excluirDet(d) {
    const n = (fotos[d.id] || []).length
    if (!confirm(`Excluir o item "${d.titulo || 'sem título'}"${n ? ` e as ${n} foto(s) dele` : ''}?`)) return
    try { await api.excluirDetalhamento(d.id); mudarDets(dets.filter((x) => x.id !== d.id)) } catch (e) { setErro(e.message) }
  }

  async function adicionar(detId, arquivos) {
    const imgs = [...arquivos].filter((f) => f.type.startsWith('image/'))
    if (!imgs.length || leitura) return
    setEnviando((e) => ({ ...e, [detId]: (e[detId] || 0) + imgs.length }))
    for (const f of imgs) {
      try {
        const foto = await api.enviarFoto(ins.id, detId, f)
        setFotos((atual) => ({ ...atual, [detId]: [...(atual[detId] || []).filter((x) => x.id !== foto.id), foto] }))
      } catch (e) { setErro(`Foto ${f.name}: ${e.message}`) }
      setEnviando((e) => ({ ...e, [detId]: e[detId] - 1 }))
    }
  }

  async function regravar(porDet) {
    setFotos((atual) => ({ ...atual, ...porDet }))
    const lista = Object.entries(porDet).flatMap(([d, fs]) => fs.map((f, ordem) => ({ ...f, detalhamento_id: d, ordem })))
    try { await api.salvarFotos(lista) } catch (e) { setErro(e.message) }
  }

  function moverFoto(detId, de, para) {
    const l = [...(fotos[detId] || [])]
    if (leitura || para < 0 || para >= l.length || de === para) return
    const [f] = l.splice(de, 1)
    l.splice(para, 0, f)
    regravar({ [detId]: l })
  }

  function fotoParaItem(foto, deId, paraId, posicao) {
    if (leitura || !paraId) return
    if (deId === paraId) return
    const destino = [...(fotos[paraId] || [])]
    destino.splice(posicao ?? destino.length, 0, foto)
    regravar({ [deId]: (fotos[deId] || []).filter((f) => f.id !== foto.id), [paraId]: destino })
    setAbertos((s) => new Set([...s, paraId]))
  }

  async function removerFoto(detId, foto) {
    if (!confirm('Excluir esta foto do relatório?')) return
    try {
      await api.removerFoto(foto.id)
      setFotos((atual) => ({ ...atual, [detId]: (atual[detId] || []).filter((f) => f.id !== foto.id) }))
      setFotoAberta(null)
    } catch (e) { setErro(e.message) }
  }

  // arrastar fotos (computador): sobre outra foto = muda a ordem; sobre outro item = muda de item
  const arrasto = {
    foto: arrastada,
    alvo,
    setAlvo,
    iniciar: (foto, detId) => setArrastada({ foto, detId }),
    terminar: () => { setArrastada(null); setAlvo(null) },
    soltar: (paraId) => { if (arrastada) fotoParaItem(arrastada.foto, arrastada.detId, paraId); setArrastada(null); setAlvo(null) },
    soltarSobre: (paraId, i) => {
      if (!arrastada) return
      if (arrastada.detId === paraId) moverFoto(paraId, (fotos[paraId] || []).findIndex((f) => f.id === arrastada.foto.id), i)
      else fotoParaItem(arrastada.foto, arrastada.detId, paraId, i)
      setArrastada(null); setAlvo(null)
    },
  }

  const usados = new Set(dets.map((d) => chaveTitulo(d.titulo)))
  const faltam = titulosPadrao.filter((t) => !usados.has(chaveTitulo(t)))
  // título livre: "Detalhamento N" com o primeiro N ainda não usado
  let livre = dets.length + 1
  while (usados.has(chaveTitulo(`Detalhamento ${livre}`))) livre++
  const vaziosFechados = dets.filter((d) => !abertos.has(d.id)).length
  const fa = fotoAberta && dets.find((d) => d.id === fotoAberta.detId)
  const faFotos = fa ? fotos[fa.id] || [] : []

  return (
    <div className="iq-itens">
      {dets.map((d, i) => (
        <div key={d.id} id={`iq-item-${d.id}`}>
          <CartaoItem det={d} n={i + 1} total={dets.length} fotosDet={fotos[d.id] || []} aberto={abertos.has(d.id)}
            alternar={() => alternar(d.id)} leitura={leitura} mudar={(c) => mudarDet(d.id, c)} mover={(delta) => moverDet(i, delta)}
            excluir={() => excluirDet(d)} adicionar={(arqs) => adicionar(d.id, arqs)} enviando={enviando[d.id] || 0}
            abrirFoto={(indice) => setFotoAberta({ detId: d.id, indice })} abrirCelular={() => setCelularDe(d)} arrasto={arrasto}
            corrigir={() => corrigir(d)}
            repetido={(titulo) => !!chaveTitulo(titulo) && dets.some((x) => x.id !== d.id && chaveTitulo(x.titulo) === chaveTitulo(titulo))}
            moverFoto={(de, para) => moverFoto(d.id, de, para)} removerFoto={(f) => removerFoto(d.id, f)} />
        </div>
      ))}
      {!dets.length && <p className="iq-vazio">Nenhum item. Adicione os itens que vai inspecionar.</p>}

      <div className="iq-itens-rodape">
        {vaziosFechados > 1 && (
          <button type="button" className="iq-btn sec" onClick={() => setAbertos(new Set(dets.map((d) => d.id)))}>Abrir todos os itens</button>
        )}
        {!leitura && (
          <div className="iq-menu-ancora">
            <button type="button" className="iq-btn sec" onClick={() => setMenu(!menu)} aria-expanded={menu}><ListPlus size={17} /> Adicionar item</button>
            {menu && <div className="iq-menu-fundo" onClick={() => setMenu(false)} aria-hidden="true" />}
            {menu && (
              <div className="iq-menu" role="menu" onKeyDown={(e) => e.key === 'Escape' && setMenu(false)}>
                <button type="button" onClick={() => novos([`Detalhamento ${livre}`])}><Plus size={15} /> Item com título livre</button>
                {faltam.length > 0 && <div className="grupo">Padrão</div>}
                {faltam.map((t) => <button type="button" key={t} onClick={() => novos([t])}>{t}</button>)}
                {faltam.length > 1 && <button type="button" onClick={() => novos(faltam)}><b>Todos os padrão que faltam</b></button>}
                <div className="grupo">Outros</div>
                {titulosOutros.map((t) => (
                  <button type="button" key={t} disabled={usados.has(chaveTitulo(t))} onClick={() => novos([t])}>{usados.has(chaveTitulo(t)) ? '✓ ' : ''}{t}</button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {celularDe && <JanelaCelular ins={ins} det={celularDe} fotosDet={fotos[celularDe.id] || []} fechar={() => setCelularDe(null)} />}
      {fa && faFotos[fotoAberta.indice] && (
        <FotoAberta key={faFotos[fotoAberta.indice].id} foto={faFotos[fotoAberta.indice]} indice={fotoAberta.indice} total={faFotos.length}
          dets={dets} detAtual={fa} leitura={leitura}
          mudarLegenda={(legenda) => regravar({ [fa.id]: faFotos.map((f, j) => (j === fotoAberta.indice ? { ...f, legenda } : f)) })}
          mover={(delta) => { moverFoto(fa.id, fotoAberta.indice, fotoAberta.indice + delta); setFotoAberta({ ...fotoAberta, indice: fotoAberta.indice + delta }) }}
          paraItem={(paraId) => { fotoParaItem(faFotos[fotoAberta.indice], fa.id, paraId); setFotoAberta(null) }}
          remover={() => removerFoto(fa.id, faFotos[fotoAberta.indice])}
          navegar={(delta) => setFotoAberta({ ...fotoAberta, indice: fotoAberta.indice + delta })}
          fechar={() => setFotoAberta(null)} />
      )}
    </div>
  )
}
