// Inspeção de Qualidade - "Do celular" (QR Code), sem login: o código aleatório da sessão é a
// autorização, e só vale enquanto a janela está aberta no computador (encerrada/expirada = recusa).
//   GET  ?t=<token>          -> dados para a página do celular (número, cliente, item)
//   POST ?t=<token> (multipart: arquivo, largura?, altura?) -> grava a foto no item da sessão
import { admin, cors, gravarFoto, json } from "../_shared/inspecao.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const sb = admin();
  const t = new URL(req.url).searchParams.get("t") || "";
  if (t.length < 24) return json({ error: "Código inválido." }, 404);
  const { data: s } = await sb.from("inspecao_celular_sessoes")
    .select("token, inspecao_id, detalhamento_id, encerrada, expira_em, recebidas, inspecoes(numero, cliente), inspecao_detalhamentos(titulo)")
    .eq("token", t).maybeSingle();
  if (!s || s.encerrada || new Date(s.expira_em) < new Date())
    return json({ error: "Janela fechada no computador. Abra o QR Code de novo." }, 410);
  try {
    if (req.method === "GET") {
      // deno-lint-ignore no-explicit-any
      const r = s as any;
      return json({ numero: r.inspecoes?.numero, cliente: r.inspecoes?.cliente, item: r.inspecao_detalhamentos?.titulo, recebidas: s.recebidas });
    }
    if (req.method !== "POST") return json({ error: "Método não permitido." }, 405);
    const form = await req.formData();
    const arquivo = form.get("arquivo");
    if (!(arquivo instanceof File)) return json({ error: "Arquivo não enviado." }, 400);
    const foto = await gravarFoto(sb, {
      inspecaoId: s.inspecao_id, detalhamentoId: s.detalhamento_id, arquivo, origem: "celular",
      largura: Number(form.get("largura")) || undefined, altura: Number(form.get("altura")) || undefined,
    });
    await sb.from("inspecao_celular_sessoes").update({ recebidas: s.recebidas + 1 }).eq("token", t);
    return json({ ok: true, foto: foto.id });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
