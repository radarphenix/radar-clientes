// Inspeção de Qualidade - envio do PDF por e-mail (individual ou várias num e-mail só).
// POST { para: string[], assunto, html, anexos: [{ nome, base64 }], inspecoes: [{ id, revisao }] }
// Mesma conta Gmail do Radar (segredos PROMO_SMTP_*), nome "Qualidade Phenix", como o desktop.
// O navegador gera os PDFs e divide em vários e-mails quando passa do limite de tamanho.
import nodemailer from "npm:nodemailer@7.0.11";
import { admin, cors, json, papel, pode } from "../_shared/inspecao.ts";

const LIMITE_ANEXOS = 18 * 1024 * 1024; // Gmail recusa acima de 25 MB codificado
const emailValido = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Método não permitido." }, 405);
  try {
    if (!pode(await papel(req), "inspetor")) return json({ error: "Seu acesso não permite enviar e-mail." }, 403);
    const { para, assunto, html, anexos, inspecoes } = await req.json();
    const destinos = (para || []).map((p: string) => String(p).trim()).filter(Boolean);
    if (!destinos.length || destinos.some((d: string) => !emailValido(d))) return json({ error: "E-mail de destino inválido." }, 400);
    const arquivos = (anexos || []).map((a: { nome: string; base64: string }) => ({ filename: a.nome, content: a.base64, encoding: "base64" }));
    const total = arquivos.reduce((s: number, a: { content: string }) => s + a.content.length * 0.75, 0);
    if (total > LIMITE_ANEXOS) return json({ error: "Anexos acima do limite do e-mail." }, 413);

    const usuario = Deno.env.get("PROMO_SMTP_USUARIO"), senha = Deno.env.get("PROMO_SMTP_SENHA");
    if (!usuario || !senha) return json({ error: "Envio de e-mail não configurado no servidor." }, 500);
    const transporte = nodemailer.createTransport({
      host: "smtp.gmail.com", port: 465, secure: true, auth: { user: usuario, pass: senha },
      connectionTimeout: 15000, greetingTimeout: 30000, socketTimeout: 60000,
    });
    await transporte.sendMail({
      from: { name: "Qualidade Phenix", address: usuario }, to: destinos, subject: String(assunto || "Relatório de Inspeção"),
      html: String(html || ""), attachments: arquivos,
    });

    // marca o envio em cada inspeção (informativo, como no desktop)
    const sb = admin();
    const agora = new Date().toISOString();
    for (const i of inspecoes || []) {
      await sb.from("inspecoes").update({ enviado_email_em: agora, enviado_email_revisao: i.revisao }).eq("id", i.id);
    }
    return json({ ok: true });
  } catch (e) {
    return json({ error: "O e-mail não foi enviado: " + (e as Error).message }, 500);
  }
});
