// Comum às funções da Inspeção de Qualidade: Google Drive (conta radarphenix@gmail.com, escopo
// drive.file - o app só enxerga o que ele mesmo criou) e gravação de fotos.
// Segredos (supabase secrets): GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN.
import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";

export const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

export function admin(): SupabaseClient {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}

/** Cliente com a sessão de quem chamou (para conferir o papel na Inspeção). */
export function doUsuario(req: Request): SupabaseClient {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") || "" } },
  });
}

export async function papel(req: Request): Promise<string | null> {
  const { data } = await doUsuario(req).rpc("inspecao_papel_atual");
  return (data as string) || null;
}

const NIVEL: Record<string, number> = { leitura: 1, inspetor: 2, aprovador: 3, admin: 4 };
export const pode = (p: string | null, minimo: string) => (NIVEL[p || ""] || 0) >= NIVEL[minimo];

// ------------------------------------------------------------------ Google Drive
let tokenCache: { valor: string; expira: number } | null = null;

async function token(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expira) return tokenCache.valor;
  const id = Deno.env.get("GOOGLE_CLIENT_ID"), segredo = Deno.env.get("GOOGLE_CLIENT_SECRET"),
    renovacao = Deno.env.get("GOOGLE_REFRESH_TOKEN");
  if (!id || !segredo || !renovacao) throw new Error("Google Drive não configurado (segredos GOOGLE_* ausentes).");
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: id, client_secret: segredo, refresh_token: renovacao, grant_type: "refresh_token" }),
  });
  const j = await r.json();
  // invalid_grant = autorização revogada/expirada (senha trocada, app em "Teste" há 7 dias)
  if (!r.ok) throw new Error(`Autorização do Google Drive falhou (${j.error || r.status}). Refazer o OAuth Playground.`);
  tokenCache = { valor: j.access_token, expira: Date.now() + (j.expires_in - 60) * 1000 };
  return tokenCache.valor;
}

async function drive(caminho: string, init: RequestInit = {}, upload = false) {
  const base = upload ? "https://www.googleapis.com/upload/drive/v3" : "https://www.googleapis.com/drive/v3";
  const r = await fetch(base + caminho, { ...init, headers: { ...(init.headers || {}), Authorization: `Bearer ${await token()}` } });
  if (!r.ok) throw new Error(`Google Drive ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return r;
}

async function pasta(nome: string, pai: string | null): Promise<string> {
  const q = [`name='${nome.replace(/'/g, "\\'")}'`, "mimeType='application/vnd.google-apps.folder'", "trashed=false",
    pai ? `'${pai}' in parents` : "'root' in parents"].join(" and ");
  const lista = await (await drive(`/files?q=${encodeURIComponent(q)}&fields=files(id)&pageSize=1`)).json();
  if (lista.files?.length) return lista.files[0].id;
  const criada = await (await drive("/files?fields=id", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: nome, mimeType: "application/vnd.google-apps.folder", parents: pai ? [pai] : undefined }),
  })).json();
  return criada.id;
}

const limpo = (s: string) => s.replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);

/** Pasta da inspeção no Drive: Inspecoes Radar/<ano>/<número> - <cliente>. Guardada em inspecoes.pasta_drive_id. */
export async function pastaDaInspecao(sb: SupabaseClient, inspecaoId: string): Promise<string> {
  const { data: ins, error } = await sb.from("inspecoes").select("numero, cliente, pasta_drive_id").eq("id", inspecaoId).single();
  if (error || !ins) throw new Error("Inspeção não encontrada.");
  if (ins.pasta_drive_id) return ins.pasta_drive_id;
  const raiz = await pasta("Inspecoes Radar", null);
  const ano = await pasta(ins.numero.slice(0, 4), raiz);
  const id = await pasta(limpo(`${ins.numero}${ins.cliente ? " - " + ins.cliente : ""}`), ano);
  await sb.from("inspecoes").update({ pasta_drive_id: id }).eq("id", inspecaoId);
  return id;
}

export async function enviarArquivo(pai: string, nome: string, tipo: string, bytes: Uint8Array): Promise<string> {
  const limite = "inspecao" + crypto.randomUUID();
  const meta = JSON.stringify({ name: nome, parents: [pai] });
  const corpo = new Blob([
    `--${limite}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n`,
    `--${limite}\r\nContent-Type: ${tipo}\r\n\r\n`, bytes, `\r\n--${limite}--`,
  ]);
  const r = await drive("/files?uploadType=multipart&fields=id", {
    method: "POST", headers: { "Content-Type": `multipart/related; boundary=${limite}` }, body: corpo,
  }, true);
  return (await r.json()).id;
}

export async function baixarArquivo(id: string): Promise<Response> {
  return await drive(`/files/${encodeURIComponent(id)}?alt=media`);
}

/** Grava a foto (já reduzida no navegador) no Drive e cria a linha em inspecao_fotos, no fim do item. */
export async function gravarFoto(sb: SupabaseClient, o: {
  inspecaoId: string; detalhamentoId: string; arquivo: File; origem: string; usuario?: string | null;
  largura?: number; altura?: number; legenda?: string;
}) {
  const bytes = new Uint8Array(await o.arquivo.arrayBuffer());
  if (bytes.length > 15 * 1024 * 1024) throw new Error("Foto acima de 15 MB.");
  const pai = await pastaDaInspecao(sb, o.inspecaoId);
  const nome = `${new Date().toISOString().replace(/\D/g, "").slice(0, 17)}.jpg`;
  const driveId = await enviarArquivo(pai, nome, o.arquivo.type || "image/jpeg", bytes);
  const { data: ultima } = await sb.from("inspecao_fotos").select("ordem").eq("detalhamento_id", o.detalhamentoId)
    .eq("removida", false).order("ordem", { ascending: false }).limit(1);
  const { data, error } = await sb.from("inspecao_fotos").insert({
    inspecao_id: o.inspecaoId, detalhamento_id: o.detalhamentoId, ordem: (ultima?.[0]?.ordem ?? -1) + 1,
    legenda: o.legenda || "", drive_file_id: driveId, nome_arquivo: nome, largura: o.largura || null, altura: o.altura || null,
    tamanho_bytes: bytes.length, origem: o.origem, criado_por: o.usuario || null,
  }).select().single();
  if (error) throw new Error(error.message);
  await sb.from("inspecoes").update({ alterado_em: new Date().toISOString() }).eq("id", o.inspecaoId);
  return data;
}
