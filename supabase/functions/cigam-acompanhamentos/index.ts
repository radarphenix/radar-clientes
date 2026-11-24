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

// ------------------------------------------------------------------ entrada
function variantes(codigo: string) {
  const d = codigo.replace(/\D/g, ""), s = d.replace(/^0+/, "") || d;
  return [...new Set([codigo, d, d.padStart(6, "0"), s, s.padStart(6, "0")].filter(Boolean))];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "GET") return json({ error: "Método não permitido." }, 405);
  try {
    const url = new URL(req.url);
    if (url.searchParams.has("aquecer")) return json(await aquecer());
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

    const arquivo = url.searchParams.get("arquivo");
    if (arquivo) return await baixar(cliente, arquivo);
    return json({ cliente, acompanhamentos: await listar(cliente) });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
