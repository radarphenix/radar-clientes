// Troca com o programa desktop MWInspecaoQualidade (o formato do inspecao.json é o contrato):
//  - importar: a pasta das inspeções inteira (ou um .zip exportado pelo desktop) -> Radar.
//    Mesmo número, itens, fotos com legenda, revisões finalizadas. Número que já existe é pulado,
//    então dá para rodar de novo (é a ferramenta da migração).
//  - exportar: .zip no formato do desktop (o programa importa de volta).
import { supabase, enviarFoto, urlFoto } from './api'
import { colunasDeBusca } from './modelo'

// Imprimir: marca do campo adicional (sem ela = não imprimir); campo padrão não leva
const campos = (l) => (l || []).map((c) => {
  const imp = c.Imprimir ?? c.imprimir
  return { rotulo: c.Rotulo ?? c.rotulo ?? '', valor: c.Valor ?? c.valor ?? '', ...(typeof imp === 'boolean' ? { imprimir: imp } : {}) }
})
const camposDesktop = (l) => (l || []).map((c) => ({ Rotulo: c.rotulo, Valor: c.valor, ...(typeof c.imprimir === 'boolean' ? { Imprimir: c.imprimir } : {}) }))
const quando = (s) => (s && !String(s).startsWith('0001') ? new Date(s).toISOString() : null)

/** Lê arquivos de uma pasta escolhida (input webkitdirectory) ou de .zip; devolve as inspeções achadas. */
export async function lerOrigem(arquivos) {
  const mapa = new Map()                              // caminho normalizado -> () => Promise<Blob>
  for (const f of arquivos) {
    if (/\.zip$/i.test(f.name)) {
      const JSZip = (await import('jszip')).default
      const zip = await JSZip.loadAsync(f)
      zip.forEach((caminho, item) => { if (!item.dir) mapa.set(caminho.replace(/\\/g, '/'), () => item.async('blob')) })
    } else {
      mapa.set((f.webkitRelativePath || f.name).replace(/\\/g, '/'), async () => f)
    }
  }
  const pastas = [...mapa.keys()].filter((c) => /(^|\/)inspecao\.json$/i.test(c) && !/(^|\/)_(lixeira|config)\//.test(c))
    .map((c) => c.slice(0, c.length - 'inspecao.json'.length))
  const achadas = []
  for (const pasta of pastas) {
    try {
      const json = JSON.parse(await (await mapa.get(`${pasta}inspecao.json`)()).text())
      const revisoes = []
      for (const [c, ler] of mapa) {
        if (c.startsWith(`${pasta}historico/`) && /rev\d+\.json$/i.test(c)) revisoes.push(JSON.parse(await (await ler()).text()))
      }
      achadas.push({ pasta, json, revisoes, foto: (nome) => mapa.get(`${pasta}fotos/${nome}`) })
    } catch (e) { achadas.push({ pasta, erro: 'inspecao.json ilegível: ' + e.message }) }
  }
  return achadas.sort((a, b) => String(a.json?.Numero).localeCompare(String(b.json?.Numero)))
}

/** Importa uma inspeção lida por lerOrigem. Devolve { situacao, detalhes }. */
export async function importar(item, progresso = () => {}) {
  if (item.erro) return { situacao: 'erro', detalhes: item.erro }
  const j = item.json
  const { data: existe } = await supabase.from('inspecoes').select('id').eq('numero', j.Numero).maybeSingle()
  if (existe) return { situacao: 'pulada', detalhes: 'já existe no Radar' }

  const ins = {
    numero: j.Numero, revisao: j.Revisao ?? 0, ultima_revisao_finalizada: j.UltimaRevisaoFinalizada ?? -1,
    ultima_revisao_gerada: j.UltimaRevisaoGerada ?? -1, finalizado: !!j.Finalizado, finalizado_em: quando(j.FinalizadoEm),
    finalizado_por: j.FinalizadoPor || '', enviado_email_em: quando(j.EnviadoEmailEm), enviado_email_revisao: j.EnviadoEmailRevisao ?? -1,
    titulo: j.Titulo || '', dados_gerais: campos(j.DadosGerais), informacoes_tecnicas: campos(j.InformacoesTecnicas),
    informacoes_tecnicas_saida: campos(j.InformacoesTecnicasSaida), conclusao: j.Conclusao || '', elaborado_por: j.ElaboradoPor || '',
    aprovado_por: j.AprovadoPor || '', setor: j.Setor || 'Qualidade', origem: 'desktop',
    criado_em: quando(j.CriadoEm) || new Date().toISOString(), alterado_em: quando(j.AlteradoEm) || new Date().toISOString(),
  }
  const { data: nova, error } = await supabase.from('inspecoes').insert({ ...ins, ...colunasDeBusca(ins) }).select('id').single()
  if (error) return { situacao: 'erro', detalhes: error.message }

  const avisos = []
  const novoIdDaFoto = {}                                   // nome do arquivo no desktop -> id no Radar
  for (const [ordem, d] of (j.Detalhamentos || []).entries()) {
    const { data: det, error: e2 } = await supabase.from('inspecao_detalhamentos')
      .insert({ inspecao_id: nova.id, titulo: d.Titulo || '', texto: d.Texto || '', ordem }).select('id').single()
    if (e2) { avisos.push(e2.message); continue }
    for (const f of d.Fotos || []) {
      const ler = item.foto(f.Arquivo)
      if (!ler) { avisos.push(`foto ${f.Arquivo} não está na pasta`); continue }
      try {
        progresso(`foto ${f.Arquivo}`)
        const blob = await ler()
        const enviada = await enviarFoto(nova.id, det.id, new File([blob], f.Arquivo, { type: 'image/jpeg' }), f.Legenda || '', 'importacao')
        novoIdDaFoto[f.Arquivo] = enviada.id
      } catch (e) { avisos.push(`foto ${f.Arquivo}: ${e.message}`) }
    }
  }

  // revisões finalizadas (historico\revNN.json): o retrato aponta para as fotos já importadas
  for (const rev of item.revisoes) {
    const retrato = {
      numero: rev.Numero, revisao: rev.Revisao, titulo: rev.Titulo, dados_gerais: campos(rev.DadosGerais),
      informacoes_tecnicas: campos(rev.InformacoesTecnicas), informacoes_tecnicas_saida: campos(rev.InformacoesTecnicasSaida),
      conclusao: rev.Conclusao || '', elaborado_por: rev.ElaboradoPor || '', aprovado_por: rev.AprovadoPor || '', setor: rev.Setor || '',
      finalizado: true, finalizado_em: quando(rev.FinalizadoEm), finalizado_por: rev.FinalizadoPor || '', alterado_em: quando(rev.AlteradoEm),
      detalhamentos: (rev.Detalhamentos || []).map((d, ordem) => ({
        titulo: d.Titulo || '', texto: d.Texto || '', ordem,
        fotos: (d.Fotos || []).map((f) => ({ id: novoIdDaFoto[f.Arquivo] || null, legenda: f.Legenda || '', arquivo: f.Arquivo })).filter((f) => f.id),
      })),
    }
    const { error: e3 } = await supabase.from('inspecao_revisoes').insert({
      inspecao_id: nova.id, revisao: rev.Revisao, finalizado_em: retrato.finalizado_em || new Date().toISOString(),
      finalizado_por: retrato.finalizado_por, retrato,
    })
    if (e3) avisos.push(`revisão ${rev.Revisao}: ${e3.message}`)
  }
  return { situacao: avisos.length ? 'com avisos' : 'importada', detalhes: avisos.join('; ') }
}

/** .zip no formato do desktop: <número>/inspecao.json + fotos/ + historico/revNN.json. */
export async function exportarZip(ins, dets, fotos, revisoes) {
  const JSZip = (await import('jszip')).default
  const zip = new JSZip()
  const pasta = zip.folder(ins.numero)
  const paraDesktop = (i, detsDe) => ({
    Numero: i.numero, CriadoEm: i.criado_em, AlteradoEm: i.alterado_em, Revisao: i.revisao,
    UltimaRevisaoGerada: i.ultima_revisao_gerada ?? -1, UltimaRevisaoFinalizada: i.ultima_revisao_finalizada ?? -1,
    Finalizado: !!i.finalizado, FinalizadoEm: i.finalizado_em, FinalizadoPor: i.finalizado_por || '',
    EnviadoEmailEm: i.enviado_email_em, EnviadoEmailRevisao: i.enviado_email_revisao ?? -1, Titulo: i.titulo,
    DadosGerais: camposDesktop(i.dados_gerais),
    InformacoesTecnicas: camposDesktop(i.informacoes_tecnicas),
    InformacoesTecnicasSaida: camposDesktop(i.informacoes_tecnicas_saida),
    Detalhamentos: detsDe.map((d) => ({ Titulo: d.titulo, Texto: d.texto, Fotos: (d.fotos || []).map((f) => ({ Arquivo: `${f.id}.jpg`, Legenda: f.legenda || '' })) })),
    Conclusao: i.conclusao, ElaboradoPor: i.elaborado_por, AprovadoPor: i.aprovado_por, Setor: i.setor,
  })
  const atual = dets.map((d) => ({ ...d, fotos: fotos[d.id] || [] }))
  pasta.file('inspecao.json', JSON.stringify(paraDesktop(ins, atual), null, 2))
  const ids = new Set([...atual.flatMap((d) => d.fotos.map((f) => f.id)), ...revisoes.flatMap((r) => (r.retrato.detalhamentos || []).flatMap((d) => (d.fotos || []).map((f) => f.id)))])
  for (const id of ids) {
    try { pasta.file(`fotos/${id}.jpg`, await (await fetch(await urlFoto(id))).blob()) } catch { /* foto indisponível */ }
  }
  for (const r of revisoes) pasta.file(`historico/rev${String(r.revisao).padStart(2, '0')}.json`, JSON.stringify(paraDesktop(r.retrato, r.retrato.detalhamentos || []), null, 2))
  return zip.generateAsync({ type: 'blob' })
}
