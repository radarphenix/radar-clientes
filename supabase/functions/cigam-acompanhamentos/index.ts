import { servir } from "../_shared/cors.ts";
// Acompanhamentos do CIGAM (somente leitura) para o botão "Acompanhamento" do cliente.
//   GET ?cliente=000046                    -> { acompanhamentos: [...] }
//   GET ?cliente=000046&arquivo=<nome.ext> -> o anexo (via portal, a CDN exige token próprio)
//   GET ?aquecer=1                         -> garante uma sessão válida (o app chama ao abrir; login leva ~20 s)
// Sessão: memória da instância -> tabela cigam_sessao (só service_role) -> login novo. Só refaz o login quando o
// CIGAM recusa a sessão, porque o POST de login do portal demora ~20 s.
// Quem pode: quem enxerga o cliente no Radar (RLS de `clientes`, que já recorta a carteira do representante).
// Segredos (supabase secrets): CIGAM_USUARIO, CIGAM_SENHA - usuário técnico com acesso Web ao Portal Representante.
// Login: o mesmo fluxo do navegador (EncryptData + formulário). O cookie CGPortal_Token é o Bearer da API.
// Detalhes: INTEGRACAO_CIGAM_ESTUDO.md.
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const BASE = "https://phenixportais.cigam.cloud";
const PORTAL = `${BASE}/portalrepresentante`;
const REVALIDAR_MS = 5 * 60 * 1000;

// ------------------------------------------------------------------ sessão CIGAM (memória + tabela cigam_sessao)
type Sessao = { jar: Record<string, string>; token: string; validada: number };
let sessao: Sessao | null = null;
const admin = () => createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

async function lerSessaoGuardada(): Promise<Sessao | null> {
  const { data } = await admin().from("cigam_sessao").select("jar, token, validada_em").eq("id", 1).maybeSingle();
  return data ? { jar: data.jar, token: data.token, validada: new Date(data.validada_em).getTime() } : null;
}

async function guardarSessao(s: Sessao, nova: boolean) {
  const agora = new Date(s.validada).toISOString();
  const linha: Record<string, unknown> = { id: 1, jar: s.jar, token: s.token, validada_em: agora };
  if (nova) linha.criada_em = agora;
  const { error } = await admin().from("cigam_sessao").upsert(linha);
  if (error) console.error("cigam_sessao:", error.message);
}

const cookies = (jar: Record<string, string>) => Object.entries(jar).map(([k, v]) => `${k}=${v}`).join("; ");
function guardar(jar: Record<string, string>, r: Response) {
  for (const c of r.headers.getSetCookie()) {
    const kv = c.split(";")[0];
    const i = kv.indexOf("=");
    if (i > 0) jar[kv.slice(0, i)] = kv.slice(i + 1);
  }
}

async function entrar(): Promise<Sessao> {
  const usuario = Deno.env.get("CIGAM_USUARIO"), senha = Deno.env.get("CIGAM_SENHA");
  if (!usuario || !senha) throw new Error("Integração CIGAM não configurada (segredos CIGAM_* ausentes).");
  const jar: Record<string, string> = {};
  let r = await fetch(`${PORTAL}/`, { headers: { cookie: cookies(jar) } });
  guardar(jar, r);
  const tok = (await r.text()).match(/name="__RequestVerificationToken" type="hidden" value="([^"]+)"/)?.[1];
  if (!tok) throw new Error("CIGAM: tela de login mudou (sem token do formulário).");

  const cifra = new URLSearchParams();
  cifra.append("data[]", usuario);
  cifra.append("data[]", senha);
  r = await fetch(`${PORTAL}/home/EncryptData`, {
    method: "POST", headers: { cookie: cookies(jar), "content-type": "application/x-www-form-urlencoded" }, body: cifra,
  });
  guardar(jar, r);
  const enc = await r.json().catch(() => null);
  if (!enc?.success) throw new Error("CIGAM: falha ao preparar o login.");

  r = await fetch(`${PORTAL}/`, {
    method: "POST", redirect: "manual",
    headers: { cookie: cookies(jar), "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      __RequestVerificationToken: tok, UsuarioText: usuario, SenhaText: senha,
      ContinuarConectado: "true", ContinuarConectadoHidden: "false",
      ReturnUrl: "/portalrepresentante/menu/dashboard", DeviceInfo: "1920|1080", NetworkInfo: "",
      Usuario: enc.messages[0], Senha: enc.messages[1],
    }),
  });
  guardar(jar, r);
  await r.body?.cancel();
  r = await fetch(`${PORTAL}/Home/Authentication`, { headers: { cookie: cookies(jar) }, redirect: "manual" });
  guardar(jar, r);
  await r.body?.cancel();
  const token = jar.CGPortal_Token ? decodeURIComponent(jar.CGPortal_Token) : "";
  if (!token) throw new Error("CIGAM: login recusado (confira usuário/senha e acesso Web ao Portal Representante).");
  sessao = { jar, token, validada: Date.now() };
  await guardarSessao(sessao, true);
  return sessao;
}

/** nova=true: a sessão atual foi recusada -> login novo (~20 s). */
async function obterSessao(nova = false): Promise<Sessao> {
  if (nova) return await entrar();
  if (!sessao) sessao = await lerSessaoGuardada();
  return sessao ?? await entrar();
}

/** Confere a sessão com uma chamada leve (~60 ms) se faz tempo que não é usada; refaz o login se o CIGAM recusar. */
async function aquecer() {
  const s = await obterSessao();
  if (Date.now() - s.validada < REVALIDAR_MS) return { ok: true, sessao: "recente" };
  const r = await fetch(`${BASE}/API/api/genericos/ge/TituloAcompanhamento/Buscar`, { headers: { Authorization: `Bearer ${s.token}` } });
  await r.body?.cancel();
  if (r.ok) {
    s.validada = Date.now();
    await guardarSessao(s, false);
    return { ok: true, sessao: "valida" };
  }
  await entrar();
  return { ok: true, sessao: "renovada" };
}

/** Chamada à API com uma nova tentativa (login refeito) se a sessão expirou. */
async function api(caminho: string, corpo?: unknown): Promise<unknown> {
  for (let tentativa = 0; tentativa < 2; tentativa++) {
    const s = await obterSessao(tentativa > 0);
    const r = await fetch(`${BASE}/API/api/${caminho}`, {
      method: corpo ? "POST" : "GET",
      headers: { Authorization: `Bearer ${s.token}`, Accept: "application/json", "Content-Type": "application/json" },
      body: corpo ? JSON.stringify(corpo) : undefined,
    });
    if ((r.status === 401 || r.status === 403) && tentativa === 0) { await r.body?.cancel(); continue; }
    s.validada = Date.now();
    const j = await r.json().catch(() => null);
    if (!r.ok) throw new Error(`CIGAM ${r.status}: ${JSON.stringify(j).slice(0, 200)}`);
    return Array.isArray(j) ? j : (j as { data?: unknown })?.data ?? j;
  }
  throw new Error("CIGAM: sessão não renovou.");
}

// ------------------------------------------------------------------ cadastros auxiliares (cache 1 h)
let auxiliares: { usuarios: Map<string, string>; titulos: Map<string, string>; em: number } | null = null;
async function obterAuxiliares() {
  if (auxiliares && Date.now() - auxiliares.em < 3600_000) return auxiliares;
  const [us, ts] = await Promise.all([
    api("genericos/ge/Usuario/Buscar?$select=Codigo,Nome").catch(() => []),
    api("genericos/ge/TituloAcompanhamento/Buscar").catch(() => []),
  ]);
  const usuarios = new Map<string, string>(), titulos = new Map<string, string>();
  for (const u of (us as { Codigo?: string; Nome?: string }[]) || []) if (u.Codigo) usuarios.set(u.Codigo.trim(), (u.Nome || "").trim());
  for (const t of (ts as { CodigoTitulo?: string; DescricaoTitulo?: string }[]) || [])
    if (t.CodigoTitulo) titulos.set(t.CodigoTitulo.trim(), (t.DescricaoTitulo || "").trim());
  const novo = { usuarios, titulos, em: Date.now() };
  if (usuarios.size) auxiliares = novo; // lista vazia = falha momentânea: não guarda, tenta de novo na próxima
  return novo;
}

// Registros que o próprio CIGAM gera (remessa bancária etc.): a tela permite esconder.
const AUTOMATICO = /comando de remessa|remessa de retorno|retorno da api do banco|o lançamento foi alterado/i;
const limpar = (s?: string | null) => (s || "").replace(/\r/g, "").trim();
const nomeArquivo = (caminho: string) => caminho.split(/[\\/]/).pop()!.trim();

type Bruto = {
  Data?: string; Hora?: string; Assunto?: string; Historico?: string; Usuario?: string; UsuarioCriacao?: string;
  Contato?: string; Contatante?: string; CodigoTitulo?: string; Anexos?: string | null; LinkGerenciadorDoc?: string | null;
  DataPrevista?: string | null; DataRealizada?: string | null;
};

async function listar(cliente: string) {
  const [lista, aux] = await Promise.all([
    api("genericos/ge/Acompanhamentos/Buscar", { TipoAcompanhamento: " ", CodigoEmpresa: cliente }),
    obterAuxiliares(),
  ]);
  return ((lista as Bruto[]) || []).map((a, i) => {
    const hora = String(a.Hora || "").replace(/\D/g, "").padStart(6, "0");
    const codUsuario = limpar(a.Usuario || a.UsuarioCriacao);
    const assunto = limpar(a.Assunto), historico = limpar(a.Historico);
    return {
      id: i,
      data: a.Data ? String(a.Data).slice(0, 10) : null,
      hora: a.Hora ? `${hora.slice(0, 2)}:${hora.slice(2, 4)}` : null,
      assunto,
      historico,
      usuario: aux.usuarios.get(codUsuario) || codUsuario,
      contato: limpar(a.Contato) || limpar(a.Contatante),
      titulo: aux.titulos.get(limpar(a.CodigoTitulo)) || "",
      data_prevista: a.DataPrevista ? String(a.DataPrevista).slice(0, 10) : null,
      data_realizada: a.DataRealizada ? String(a.DataRealizada).slice(0, 10) : null,
      link: limpar(a.LinkGerenciadorDoc) || null,
      anexos: limpar(a.Anexos).split(";").map((s) => s.trim()).filter(Boolean).map(nomeArquivo),
      automatico: AUTOMATICO.test(`${assunto} ${historico}`),
    };
  }).sort((x, y) => `${y.data} ${y.hora}`.localeCompare(`${x.data} ${x.hora}`));
}

/** Decodifica entidades HTML do portal (ex.: "Relat&#243;rio" → "Relatório"). */
function desescapar(t: string) {
  return t
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

/** Acha na página o link de download do anexo com esse nome. */
function procurarAnexo(pagina: string, arquivo: string): string | null {
  const re = /data-action="(\/portalrepresentante\/ge\/acompanhamento\/_DownloadAnexo\/[^"]+)"[^>]*>\s*<span title="([^"]+)"/g;
  const alvo = arquivo.trim().normalize("NFC");
  for (const m of pagina.matchAll(re)) if (desescapar(m[2]).trim().normalize("NFC") === alvo) return desescapar(m[1]);
  return null;
}

/** Baixa um anexo pela tela do portal (abre a pesquisa do cliente e usa o link de download dela). */
async function baixar(cliente: string, arquivo: string): Promise<Response> {
  for (let tentativa = 0; tentativa < 2; tentativa++) {
    const s = await obterSessao(tentativa > 0);
    const r = await fetch(`${PORTAL}/ge/acompanhamento/pesquisa/${cliente}`, { headers: { cookie: cookies(s.jar) }, redirect: "manual" });
    guardar(s.jar, r);
    if (r.status !== 200) { await r.body?.cancel(); continue; }
    // A pesquisa mostra só os acompanhamentos mais recentes; os antigos vêm pela rolagem infinita
    // (_ScrollAcompanhamento?page=N, 204 = acabou). Procura página a página até achar o arquivo.
    let acao = procurarAnexo(await r.text(), arquivo);
    for (let pg = 1; !acao && pg <= 30; pg++) {
      const p = await fetch(`${PORTAL}/ge/acompanhamento/_ScrollAcompanhamento/?page=${pg}&search=`, {
        headers: { cookie: cookies(s.jar), "X-Requested-With": "XMLHttpRequest" }, redirect: "manual",
      });
      guardar(s.jar, p);
      if (p.status !== 200) { await p.body?.cancel(); break; }
      const html = await p.text();
      if (!html.trim()) break;
      acao = procurarAnexo(html, arquivo);
    }
    if (!acao) return json({ error: "Anexo não encontrado no CIGAM." }, 404);
    const d = await fetch(BASE + acao, { headers: { cookie: cookies(s.jar) } });
    if (!d.ok) return json({ error: `CIGAM ${d.status} ao baixar o anexo.` }, 502);
    return new Response(d.body, {
      headers: {
        ...cors,
        "Content-Type": d.headers.get("Content-Type") || "application/octet-stream",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(arquivo)}`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  }
  return json({ error: "CIGAM: sessão do portal não renovou." }, 502);
}

// ------------------------------------------------------------------ ficha 360° (pedidos, notas, títulos)
// Somente leitura. Atenção: $select derruba essas rotas no CIGAM ("Ocorreu uma falha"), por isso
// a resposta vem inteira e é reduzida aqui. Cada parte tem a sua permissão no catálogo do Radar.
// A Visão geral (clientes.cigam_visao) calcula a partir de pedidos e notas, então ela também libera essas consultas.
const FICHA_PERMISSAO: Record<string, string | string[]> = {
  pedidos: ["clientes.cigam_vendas", "clientes.cigam_visao"],
  notas: ["clientes.cigam_vendas", "clientes.cigam_visao"],
  titulos: "clientes.cigam_financeiro",
  pagos: "clientes.cigam_financeiro",
};

const txt = (v: unknown) => (typeof v === "string" ? v.trim() : v ?? null) || null;
const odata = (s: string) => s.replace(/ /g, "%20").replace(/'/g, "%27");

async function buscarPedidos(cliente: string) {
  type L = Record<string, unknown>;
  const r = (await api(odata(`comercial/fa/Pedido/Buscar?$filter=CodigoCliente eq '${cliente}'&$orderby=DataPedido desc&$top=100&$expand=Itens($expand=Material)`))) as L[];
  return (r || []).map((p) => ({
    codigo: txt(p.Codigo), data: txt(p.DataPedido), situacao: txt(p.Situacao), situacao_descricao: txt(p.SituacaoDescricao),
    prazo_entrega: txt(p.PrazoEntrega), prazo_programado: txt(p.PrazoProgramado),
    total: Number(p.TotalPedido) || 0, faturado: Number(p.TotalFaturamento) || 0,
    tipo: txt(p.TipoNotaDescricao), representante: txt(p.CodigoRepresentante),
    itens: ((p.Itens as L[]) || []).map((i) => ({
      seq: i.Sequencia, material: txt(i.CodigoMaterial), descricao: txt((i.Material as L)?.Descricao) || txt(i.CodigoMaterial),
      un: txt(i.CodigoUnidadeMedida), qtd: Number(i.Quantidade) || 0, preco: Number(i.PrecoUnitario) || 0,
      desconto: Number(i.PercentualDesconto) || 0, total: Number(i.TotalItemLiquido) || 0,
      situacao: txt(i.Situacao), prazo: txt(i.PrazoEntrega), identificador: txt(i.CodigoEspecificacao1),
    })),
  }));
}

// Medidas do configurador do CIGAM, por identificador (CodigoEspecificacao1 do item). O identificador
// não muda depois de criado, então fica em cache na memória da função. Só as medidas que interessam
// ao comercial (pedido do usuário, 24/11/2026): largura, comprimento, CFM, gramatura e espessura.
// O código da característica varia por configurador (CO1/COM, LA1/LAR...), por isso casa pela descrição.
const MEDIDAS: [string, RegExp][] = [
  ["largura", /^LARGURA/], ["comprimento", /^COMPRIMENTO/], ["cfm", /^CFM/], ["gramatura", /^GRAMATURA/], ["espessura", /^ESPESSURA/],
];
const cacheMedidas = new Map<string, Record<string, number> | null>();
async function buscarMedidas(ids: string[]) {
  const faltam = ids.filter((id) => !cacheMedidas.has(id));
  for (let i = 0; i < faltam.length; i += 8) {
    await Promise.all(faltam.slice(i, i + 8).map(async (id) => {
      try {
        const r = (await api(`suprimentos/cp/ConfiguraItem/BuscarIdentificador?codigoIdentificador=${encodeURIComponent(id)}`)) as Record<string, unknown>;
        const m: Record<string, number> = {};
        for (const c of (r?.Caracteristicas as Record<string, unknown>[]) || []) {
          const desc = String(((c.Caracteristica as Record<string, unknown>)?.Caracteristica as Record<string, unknown>)?.Descricao || "").trim().toUpperCase();
          const chave = MEDIDAS.find(([, re]) => re.test(desc))?.[0];
          const v = Number(c.ConteudoNumerico) || Number(String(c.Conteudo || "").replace(",", ".")) || 0;
          if (chave && v > 0 && !(chave in m)) m[chave] = v;
        }
        cacheMedidas.set(id, Object.keys(m).length ? m : null);
      } catch {
        /* sem medidas para este item: a tela mostra só o produto */
      }
    }));
  }
  return new Map(ids.map((id) => [id, cacheMedidas.get(id) ?? null]));
}

async function buscarFicha(parte: string, cliente: string) {
  type L = Record<string, unknown>;
  if (parte === "pedidos") {
    const pedidos = await buscarPedidos(cliente);
    // Medidas do item vêm do configurador (identificador = CodigoEspecificacao1 do item).
    const ids = [...new Set(pedidos.flatMap((p) => p.itens.map((i) => i.identificador)).filter((x): x is string => !!x))];
    const medidas = await buscarMedidas(ids);
    for (const p of pedidos) for (const i of p.itens as Record<string, unknown>[]) {
      i.medidas = medidas.get(String(i.identificador)) || null;
      delete i.identificador;
    }
    return pedidos;
  }
  if (parte === "notas") {
    const r = (await api(odata(`comercial/fa/NotaFiscal/Buscar?$filter=CodigoCliente eq '${cliente}'&$orderby=DataEmissao desc&$top=200`))) as L[];
    return (r || []).map((n) => ({
      nf: n.NF, serie: txt(n.CodigoSerie), emissao: txt(n.DataEmissao), saida: txt(n.DataSaida),
      total: Number(n.TotalNF) || 0, mercadoria: Number(n.TotalMercadoria) || 0,
      pedido: txt(n.CodigoPedido), cfop: txt(n.Cfop), tipo: txt(n.TipoNotaDescricao), frete: txt(n.TipoFreteDescricao),
    }));
  }
  // Títulos a receber: em aberto = Tipo 'R' com saldo; pagos = Tipo 'c' (o CIGAM troca o tipo na liquidação,
  // mesma regra da view de comissões). Os pagos alimentam a pontualidade.
  if (parte === "pagos") {
    const p = (await api(odata(`financas/gf/LancamentoFinanceiro/BuscarLancamentos?$filter=CodigoEmpresa eq '${cliente}' and Tipo eq 'c'&$orderby=Vencimento desc&$top=300`))) as L[];
    return (p || []).map((t) => ({ vencimento: txt(t.Vencimento), pagamento: txt(t.DataUltimaLiquidacao), valor: Number(t.Valor) || 0 }));
  }
  const r = (await api(odata(`financas/gf/LancamentoFinanceiro/BuscarLancamentos?$filter=CodigoEmpresa eq '${cliente}' and Tipo eq 'R' and Saldo gt 0&$orderby=Vencimento&$top=200`))) as L[];
  return (r || []).map((t) => ({
    codigo: t.Codigo, nf: t.Nf || null, parcela: txt(t.Complemento), emissao: txt(t.Emissao), vencimento: txt(t.Vencimento),
    valor: Number(t.Valor) || 0, saldo: Number(t.Saldo) || 0, situacao: txt(t.SituacaoDescricao), documento: txt(t.Documento),
  }));
}

// ------------------------------------------------------------------ alertas da rota (vários clientes de uma vez)
// ?alertas=000123,002040,... → { alertas: { "002040": { vencido, vencidos, maior_atraso, ultima_compra } } }
// Duas consultas no CIGAM para a rota toda ($filter ... in (...) e $apply groupby). Só clientes que o
// usuário enxerga no Radar; cada informação respeita a sua permissão.
async function alertas(req: Request, lista: string) {
  const pedidos = [...new Set(lista.split(",").map((c) => c.replace(/\D/g, "")).filter((c) => c && !/^0+$/.test(c)))].slice(0, 80);
  if (!pedidos.length) return { alertas: {} };
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") || "" } },
  });
  const [{ data: vis }, { data: podeFin }, { data: podeVen }] = await Promise.all([
    sb.from("clientes").select("codigo_cliente").in("codigo_cliente", pedidos.flatMap(variantes)),
    sb.rpc("radar_pode", { p_codigo: "clientes.cigam_financeiro" }),
    sb.rpc("radar_pode", { p_codigo: "clientes.cigam_vendas" }),
  ]);
  const codigos = [...new Set((vis || []).map((c) => String(c.codigo_cliente).replace(/\D/g, "").padStart(6, "0")))];
  if (!codigos.length || (podeFin !== true && podeVen !== true)) return { alertas: {} };

  const em = `(${codigos.map((c) => `'${c}'`).join(",")})`;
  const hoje = new Date().toISOString().slice(0, 10);
  const saida: Record<string, Record<string, unknown>> = {};
  const de = (c: string) => (saida[c] ??= {});
  type L = Record<string, unknown>;

  await Promise.all([
    podeFin === true &&
      api(odata(`financas/gf/LancamentoFinanceiro/BuscarLancamentos?$filter=Tipo eq 'R' and Saldo gt 0 and Vencimento lt ${hoje} and CodigoEmpresa in ${em}&$top=5000`))
        .then((r) => {
          for (const t of (r as L[]) || []) {
            const a = de(String(t.CodigoEmpresa).trim());
            const atraso = Math.round((Date.parse(hoje) - Date.parse(String(t.Vencimento).slice(0, 10))) / 86400000);
            a.vencido = Math.round(((Number(a.vencido) || 0) + (Number(t.Saldo) || 0)) * 100) / 100;
            a.vencidos = (Number(a.vencidos) || 0) + 1;
            a.maior_atraso = Math.max(Number(a.maior_atraso) || 0, atraso);
          }
        }),
    podeVen === true &&
      api(odata(`comercial/fa/NotaFiscal/Buscar?$filter=CodigoCliente in ${em}&$apply=groupby((CodigoCliente),aggregate(DataEmissao with max as Ultima))`))
        .then((r) => {
          for (const n of (r as L[]) || []) de(String(n.CodigoCliente).trim()).ultima_compra = String(n.Ultima || "").slice(0, 10) || null;
          // Sem nota nenhuma no CIGAM: marca explicitamente para a tela poder dizer "sem compras".
          for (const c of codigos) if (!("ultima_compra" in de(c))) de(c).ultima_compra = null;
        }),
  ]);
  return { alertas: saida, financeiro: podeFin === true, vendas: podeVen === true };
}

// ------------------------------------------------------------------ entrada
function variantes(codigo: string) {
  const d = codigo.replace(/\D/g, ""), s = d.replace(/^0+/, "") || d;
  return [...new Set([codigo, d, d.padStart(6, "0"), s, s.padStart(6, "0")].filter(Boolean))];
}

servir(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "GET") return json({ error: "Método não permitido." }, 405);
  try {
    const url = new URL(req.url);
    if (url.searchParams.has("aquecer")) return json(await aquecer());
    if (url.searchParams.has("alertas")) return json(await alertas(req, url.searchParams.get("alertas") || ""));
    const bruto = (url.searchParams.get("cliente") || "").trim();
    const digitos = bruto.replace(/\D/g, "");
    if (!digitos || /^0+$/.test(digitos)) return json({ error: "Cliente sem código." }, 400);
    const cliente = digitos.padStart(6, "0");

    // Trava: o usuário precisa enxergar o cliente no Radar (RLS de clientes faz o recorte).
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: req.headers.get("Authorization") || "" } },
    });
    const { data: visivel } = await sb.from("clientes").select("codigo_cliente").in("codigo_cliente", variantes(bruto)).limit(1);
    if (!visivel?.length) return json({ error: "Cliente não encontrado ou sem acesso." }, 403);

    const ficha = url.searchParams.get("ficha");
    if (ficha) {
      const codigo = FICHA_PERMISSAO[ficha];
      if (!codigo) return json({ error: "Parte da ficha desconhecida." }, 400);
      const codigos = Array.isArray(codigo) ? codigo : [codigo];
      const respostas = await Promise.all(codigos.map((c) => sb.rpc("radar_pode", { p_codigo: c })));
      if (!respostas.some((r) => r.data === true)) return json({ error: "Sem acesso a esta parte da ficha." }, 403);
      return json({ cliente, ficha, itens: await buscarFicha(ficha, cliente) });
    }

    const arquivo = url.searchParams.get("arquivo");
    if (arquivo) return await baixar(cliente, arquivo);
    return json({ cliente, acompanhamentos: await listar(cliente) });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
