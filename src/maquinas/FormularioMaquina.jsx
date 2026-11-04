import { useEffect, useRef, useState } from 'react'
import { Plus, Trash2, Save, Search, Building2, UserPlus, Power, X } from 'lucide-react'
import { PROSPECT, nomeOrigem, buscarClientes, salvarMaquina, definirAtivo, paraNumero, formatarNumero, pendenteSync } from './api'

// Mesmas listas da feira, só como sugestão: aceita qualquer outro valor e nenhum campo depende de outro.
const PRODUTOS = ['Tela Formadora', 'Formadora', 'Feltro', 'Feltro com emenda', 'Tela DNT', 'Tela Acabadora', 'Tela Tecida', 'Camisa', 'Engrossador', 'Secadora Espiral', 'Outros']
const MODELOS = ['Dupla e meia', 'Tripla', 'Dupla', 'Mono', 'Malha 4', 'Malha 16', 'Malha 18', 'Malha 21']
const PAPEIS = ['Tissue', 'Marrom']
const NUMEROS = [['comprimento', 'Comprimento', 3], ['largura', 'Largura', 3], ['espessura', 'Espessura', 3], ['cfm', 'CFM', 2], ['gramatura', 'Gramatura', 2]]

let seq = 0
const itemVazio = () => ({ chave: `n${seq++}`, produto: '', nome_produto_outros: '', modelo: '', posicao: '', comprimento: '', largura: '', espessura: '', cfm: '', gramatura: '', durabilidade: '', teflonada: null, observacoes: '' })
const paraTela = (i) => ({ ...i, chave: i.chave || `i${i.id}`, ...Object.fromEntries(NUMEROS.map(([k, , c]) => [k, formatarNumero(i[k], c)])) })
const texto = (v) => v ?? ''

/** Cadastro/edição de uma máquina: empresa (cliente ou prospect), dados da máquina e itens livres. */
// A saída do formulário é o "Voltar" do Radar (ou do navegador): a página pergunta se há alteração
// sem salvar, a partir do que aoAlterar informa.
export default function FormularioMaquina({ maquina, clienteInicial, podeEditar, voltar, aoAlterar }) {
  const nova = !maquina
  const [m, setM] = useState(() => maquina ? { ...maquina } : {
    codigo_cliente: clienteInicial?.codigo_cliente || '', nome_prospect: '', cidade_prospect: '', uf_prospect: '', contato_prospect: '', telefone_prospect: '',
    nome_maquina: '', numero_maquina_pedido: '', tipo_papel: '', velocidade_maquina: '', observacoes: '',
  })
  const [cliente, setCliente] = useState(() => maquina?.cliente || clienteInicial || null)
  const [ehProspect, setEhProspect] = useState(() => maquina?.codigo_cliente === PROSPECT)
  const [itens, setItens] = useState(() => (maquina?.itens || []).filter((i) => i.ativo).map(paraTela))
  const [removidos, setRemovidos] = useState([])
  const [busca, setBusca] = useState('')
  const [resultados, setResultados] = useState([])
  const [buscando, setBuscando] = useState(false)
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [alterado, setAlterado] = useState(false)
  const so = !podeEditar
  const primeiroCampo = useRef(null)

  useEffect(() => { if (nova && !clienteInicial) primeiroCampo.current?.focus() }, [nova, clienteInicial])
  useEffect(() => { aoAlterar?.(alterado) }, [alterado, aoAlterar])
  useEffect(() => {
    if (busca.trim().length < 2) return
    let vivo = true
    const t = setTimeout(() => {
      setBuscando(true)
      buscarClientes(busca).then((r) => { if (vivo) setResultados(r) }).catch((e) => setErro(e.message)).finally(() => vivo && setBuscando(false))
    }, 300)
    return () => { vivo = false; clearTimeout(t) }
  }, [busca])

  const mudar = (k) => (e) => { setM({ ...m, [k]: e.target.value }); setAlterado(true) }
  function mudarItem(chave, k, v) {
    setItens(itens.map((i) => (i.chave === chave ? { ...i, [k]: v, alterado: true } : i)))
    setAlterado(true)
  }
  function removerItem(i) {
    if (i.id) setRemovidos([...removidos, i.id])
    setItens(itens.filter((x) => x.chave !== i.chave))
    setAlterado(true)
  }

  function sair() {
    if (alterado && !window.confirm('Sair sem salvar as alterações?')) return
    voltar()
  }

  async function salvar() {
    setErro('')
    const codigo = ehProspect ? PROSPECT : cliente?.codigo_cliente
    if (!codigo) return setErro('Escolha o cliente ou marque como prospect.')
    if (ehProspect && String(m.nome_prospect || '').trim().length < 2) return setErro('Informe o nome do prospect.')
    const prontos = []
    for (const i of itens) {
      const n = { ...i }
      for (const [k, rotulo] of NUMEROS) {
        const v = paraNumero(i[k])
        if (Number.isNaN(v)) return setErro(`${rotulo} inválido em ${i.produto || 'um item'}: use números, ex.: 4,250.`)
        n[k] = v
      }
      if (!i.id || i.alterado) prontos.push(n)
      else prontos.push({ ...n, alterado: false })
    }
    setSalvando(true)
    try {
      const dados = { ...m, codigo_cliente: codigo }
      if (!ehProspect) Object.assign(dados, { nome_prospect: null, cidade_prospect: null, uf_prospect: null, contato_prospect: null, telefone_prospect: null })
      const r = await salvarMaquina(dados, prontos, removidos, { envioId: maquina?.envioPendente, cliente: ehProspect ? null : cliente })
      setAlterado(false)
      voltar(r.id, r.pendente)
    } catch (e) { setErro(e.message) }
    setSalvando(false)
  }

  async function alternarAtivo() {
    if (maquina.envioPendente) return setErro('Este cadastro ainda não subiu. Desative depois que ele for enviado.')
    const ativar = !maquina.ativo
    if (!ativar && !window.confirm('Desativar esta máquina? Ela some da pesquisa (dá para reativar em "Mostrar desativadas").')) return
    try { await definirAtivo(maquina.id, ativar); voltar(maquina.id) } catch (e) { setErro(e.message) }
  }

  return (
    <div className="painel iq-raiz mq-raiz mq-form">
      <div className="mq-form-topo">
        <h2>{nova ? 'Nova máquina' : so ? 'Máquina' : 'Editar máquina'}</h2>
        {!nova && <span className="mq-meta">
          {maquina.origem !== 'RADAR' && `Origem ${nomeOrigem(maquina.origem)} · `}
          {maquina.criado_por_nome && `Cadastrada por ${maquina.criado_por_nome} · `}
          Alterada em {new Date(maquina.atualizado_em).toLocaleString('pt-BR')}{maquina.atualizado_por_nome ? ` por ${maquina.atualizado_por_nome}` : ''}
          {!maquina.envioPendente && pendenteSync(maquina) ? ' · pendente de envio ao CIGAM' : ''}
        </span>}
        {maquina?.envioPendente && !maquina.envioRecusado && <span className="mq-fila-selo">Guardado no aparelho, aguardando internet para enviar</span>}
      </div>
      {erro && <div className="iq-alerta" onClick={() => setErro('')}>{erro}</div>}
      {maquina?.envioRecusado && <div className="iq-alerta">O servidor recusou este cadastro: {maquina.envioRecusado} Corrija e salve de novo.</div>}

      <fieldset className="mq-bloco" disabled={so}>
        <legend>Empresa</legend>
        <div className="iq-chips" role="tablist">
          <button type="button" role="tab" aria-selected={!ehProspect} className={`iq-chip ${!ehProspect ? 'ativo' : ''}`} onClick={() => { setEhProspect(false); setAlterado(true) }}><Building2 size={14} /> Cliente</button>
          <button type="button" role="tab" aria-selected={ehProspect} className={`iq-chip ${ehProspect ? 'ativo' : ''}`} onClick={() => { setEhProspect(true); setAlterado(true) }}><UserPlus size={14} /> Prospect</button>
        </div>
        {!ehProspect && <span className="mq-rotulo">Cliente *</span>}
        {!ehProspect ? (
          cliente ? (
            <div className="mq-cliente-escolhido">
              <div><strong>{cliente.cliente || `Cliente ${cliente.codigo_cliente}`}</strong>
                <span>{[cliente.codigo_cliente, [cliente.cidade, cliente.uf].filter(Boolean).join('/')].filter(Boolean).join(' · ')}</span></div>
              {!so && <button type="button" className="iq-btn sec peq" onClick={() => { setCliente(null); setAlterado(true) }}><X size={14} /> Trocar</button>}
            </div>
          ) : (
            <div className="mq-busca-cliente">
              <label className="iq-busca">
                <Search size={18} aria-hidden="true" />
                <input ref={primeiroCampo} type="search" className="iq-busca-campo" aria-label="Cliente" placeholder="Digite nome, código ou cidade do cliente" value={busca} onChange={(e) => setBusca(e.target.value)} />
              </label>
              {buscando && <p className="mq-dica">Buscando...</p>}
              {busca.trim().length >= 2 && !!resultados.length && (
                <ul className="mq-resultados">
                  {resultados.map((c) => (
                    <li key={c.codigo_cliente}><button type="button" onClick={() => { setCliente(c); setBusca(''); setAlterado(true) }}>
                      <strong>{c.cliente}</strong><span>{c.codigo_cliente} · {[c.cidade, c.uf].filter(Boolean).join('/')}</span>
                    </button></li>
                  ))}
                </ul>
              )}
              {busca.trim().length >= 2 && !buscando && !resultados.length && <p className="mq-dica">Nenhum cliente encontrado. Se ainda não é cliente, use Prospect.</p>}
            </div>
          )
        ) : (
          <div className="mq-grade">
            <label className="mq-campo largo"><span>Nome da empresa *</span><input ref={primeiroCampo} value={texto(m.nome_prospect)} onChange={mudar('nome_prospect')} maxLength={160} /></label>
            <label className="mq-campo"><span>Cidade</span><input value={texto(m.cidade_prospect)} onChange={mudar('cidade_prospect')} maxLength={100} /></label>
            <label className="mq-campo curto"><span>UF</span><input value={texto(m.uf_prospect)} onChange={(e) => { setM({ ...m, uf_prospect: e.target.value.toUpperCase() }); setAlterado(true) }} maxLength={2} /></label>
            <label className="mq-campo"><span>Contato</span><input value={texto(m.contato_prospect)} onChange={mudar('contato_prospect')} maxLength={160} /></label>
            <label className="mq-campo curto"><span>Telefone</span><input inputMode="tel" value={texto(m.telefone_prospect)} onChange={mudar('telefone_prospect')} maxLength={30} /></label>
            {maquina?.codigo_cliente === PROSPECT && !so && <p className="mq-dica largo">Virou cliente? Clique em <strong>Cliente</strong> acima e escolha-o: a máquina passa para ele.</p>}
          </div>
        )}
      </fieldset>

      <fieldset className="mq-bloco" disabled={so}>
        <legend>Máquina</legend>
        <div className="mq-grade">
          <label className="mq-campo largo"><span>Nome / identificação</span><input value={texto(m.nome_maquina)} onChange={mudar('nome_maquina')} placeholder="Ex.: MP01" maxLength={160} /></label>
          <label className="mq-campo curto"><span>Nº no pedido</span><input value={texto(m.numero_maquina_pedido)} onChange={mudar('numero_maquina_pedido')} maxLength={6} title="O mesmo número digitado no campo Detalhe do item de pedido no CIGAM" /></label>
          <label className="mq-campo medio"><span>Tipo de papel</span><input list="mq-papeis" value={texto(m.tipo_papel)} onChange={mudar('tipo_papel')} maxLength={60} /></label>
          <label className="mq-campo"><span>Velocidade</span><input value={texto(m.velocidade_maquina)} onChange={mudar('velocidade_maquina')} maxLength={60} /></label>
          <label className="mq-campo largo"><span>Observações</span><textarea rows={2} value={texto(m.observacoes)} onChange={mudar('observacoes')} maxLength={4000} /></label>
        </div>
        <datalist id="mq-papeis">{PAPEIS.map((p) => <option key={p} value={p} />)}</datalist>
      </fieldset>

      <fieldset className="mq-bloco" disabled={so}>
        <legend>Itens da máquina <span className="mq-meta">tudo opcional: informe só o que souber</span></legend>
        {!itens.length && <p className="mq-dica">Nenhum item. Dá para salvar só a máquina, ou adicionar um item com só a medida.</p>}
        <div className="mq-itens-form">
          {itens.map((i, n) => (
            <div key={i.chave} className="mq-item-form">
              <div className="mq-item-topo"><strong>Item {n + 1}</strong>
                {!so && <button type="button" className="iq-icone perigo" onClick={() => removerItem(i)} title="Remover item" aria-label={`Remover item ${n + 1}`}><Trash2 size={16} /></button>}
              </div>
              <div className="mq-grade">
                <label className="mq-campo"><span>Produto</span><input list="mq-produtos" value={texto(i.produto)} onChange={(e) => mudarItem(i.chave, 'produto', e.target.value)} maxLength={80} /></label>
                <label className="mq-campo"><span>Nome do produto (outros)</span><input value={texto(i.nome_produto_outros)} onChange={(e) => mudarItem(i.chave, 'nome_produto_outros', e.target.value)} maxLength={160} /></label>
                <label className="mq-campo"><span>Modelo</span><input list="mq-modelos" value={texto(i.modelo)} onChange={(e) => mudarItem(i.chave, 'modelo', e.target.value)} maxLength={80} /></label>
                <label className="mq-campo"><span>Posição</span><input value={texto(i.posicao)} onChange={(e) => mudarItem(i.chave, 'posicao', e.target.value)} maxLength={80} /></label>
                {NUMEROS.map(([k, rotulo]) => (
                  <label key={k} className="mq-campo curto"><span>{rotulo}</span><input inputMode="decimal" value={texto(i[k])} onChange={(e) => mudarItem(i.chave, k, e.target.value)} /></label>
                ))}
                <label className="mq-campo medio"><span>Durabilidade</span><input value={texto(i.durabilidade)} onChange={(e) => mudarItem(i.chave, 'durabilidade', e.target.value)} maxLength={60} /></label>
                <label className="mq-marca dois"><input type="checkbox" checked={!!i.teflonada} onChange={(e) => mudarItem(i.chave, 'teflonada', e.target.checked)} /> Teflonada</label>
                <label className="mq-campo largo"><span>Observações</span><input value={texto(i.observacoes)} onChange={(e) => mudarItem(i.chave, 'observacoes', e.target.value)} maxLength={4000} /></label>
              </div>
            </div>
          ))}
        </div>
        {!so && <button type="button" className="iq-btn sec" onClick={() => { setItens([...itens, itemVazio()]); setAlterado(true) }}><Plus size={16} /> Adicionar item</button>}
        <datalist id="mq-produtos">{PRODUTOS.map((p) => <option key={p} value={p} />)}</datalist>
        <datalist id="mq-modelos">{MODELOS.map((p) => <option key={p} value={p} />)}</datalist>
      </fieldset>

      {!so && (
        <div className="mq-rodape">
          {!nova && (
            <button type="button" className={`iq-btn ${maquina.ativo ? 'perigo' : 'sec'}`} onClick={alternarAtivo}>
              <Power size={16} /> {maquina.ativo ? 'Desativar' : 'Reativar'}
            </button>
          )}
          <span className="mq-espaco" />
          <button type="button" className="iq-btn sec" onClick={sair}>Cancelar</button>
          <button type="button" className="iq-btn prim" onClick={salvar} disabled={salvando}><Save size={16} /> {salvando ? 'Salvando...' : 'Salvar'}</button>
        </div>
      )}
    </div>
  )
}
