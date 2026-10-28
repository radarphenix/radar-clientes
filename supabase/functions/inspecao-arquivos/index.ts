// Inspeção de Qualidade - fotos no Google Drive, para quem está logado.
//   POST (multipart: inspecao_id, detalhamento_id, arquivo, largura?, altura?, legenda?)  -> grava a foto (inspetor+)
//   GET  ?foto=<id da linha em inspecao_fotos>                                         -> devolve a imagem (qualquer papel)
import { admin, baixarArquivo, cors, doUsuario, gravarFoto, json, papel, pode } from "../_shared/inspecao.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const p = await papel(req);
    if (!pode(p, "leitura")) return json({ error: "Sem acesso à Inspeção de Qualidade." }, 403);
    const sb = admin();

    if (req.method === "GET") {
      const id = new URL(req.url).searchParams.get("foto");
      // Lê a foto com a sessão do usuário: o RLS é a trava de acesso (service_role, que ignora RLS,
      // fica só para baixar do Drive). Sem permissão, o RLS devolve vazio -> 404.
      const { data: f } = await doUsuario(req).from("inspecao_fotos").select("drive_file_id").eq("id", id).maybeSingle();
      if (!f?.drive_file_id) return json({ error: "Foto não encontrada." }, 404);
      const r = await baixarArquivo(f.drive_file_id);
      return new Response(r.body, {
        headers: { ...cors, "Content-Type": r.headers.get("Content-Type") || "image/jpeg", "Cache-Control": "private, max-age=86400" },
      });
    }

    if (req.method !== "POST") return json({ error: "Método não permitido." }, 405);
    if (!pode(p, "inspetor")) return json({ error: "Seu acesso é só de leitura." }, 403);
    const form = await req.formData();
    const arquivo = form.get("arquivo");
    if (!(arquivo instanceof File)) return json({ error: "Arquivo não enviado." }, 400);
    const { data: { user } } = await doUsuario(req).auth.getUser();
    const foto = await gravarFoto(sb, {
      inspecaoId: String(form.get("inspecao_id")), detalhamentoId: String(form.get("detalhamento_id")),
      arquivo, origem: form.get("origem") === "importacao" ? "importacao" : "upload", usuario: user?.id,
      largura: Number(form.get("largura")) || undefined, altura: Number(form.get("altura")) || undefined,
      legenda: String(form.get("legenda") || ""),
    });
    return json({ foto });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
