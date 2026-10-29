// Troca o e-mail de LOGIN (Supabase Auth) de um usuário e o e-mail do perfil, juntos.
// Editar só a tabela perfis deixava o login no e-mail antigo: o "Atualizar senha" ia para um
// endereço sem login e o Supabase não mandava nada (sem erro). Só quem tem o menu Administração.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Metodo nao permitido." }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse({ error: "Funcao sem variaveis de ambiente." }, 500);
  }

  const authorization = req.headers.get("Authorization") || "";
  if (!authorization.startsWith("Bearer ")) return jsonResponse({ error: "Sessao nao informada." }, 401);

  const supabaseAuth = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } });
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
  if (userError || !user) return jsonResponse({ error: "Sessao invalida." }, 401);

  // acesso pelo catálogo de permissões (ACESSOS_RADAR.md), com a sessão de quem pediu
  const { data: podeAdministrar } = await supabaseAuth.rpc("radar_pode", { p_codigo: "administracao" });
  if (podeAdministrar !== true) {
    return jsonResponse({ error: "Somente administrador pode alterar o e-mail de usuarios." }, 403);
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return jsonResponse({ error: "JSON invalido na requisicao." }, 400); }

  const userId = String(body.user_id || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  if (!userId || !email) return jsonResponse({ error: "Usuario e e-mail sao obrigatorios." }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return jsonResponse({ error: "E-mail invalido." }, 400);

  // perfil sem conta de login (ex.: representante só para comissões): não há login a alterar
  const { data: contaLogin } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (!contaLogin?.user) return jsonResponse({ user_id: userId, email, sem_login: true });

  // já está igual: nada a fazer no Auth (salvar o usuário chama esta função sempre)
  if (String(contaLogin.user.email || "").toLowerCase() === email) return jsonResponse({ user_id: userId, email });

  // email_confirm: o admin já conferiu o endereço; sem isso o login ficaria esperando confirmação
  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, { email, email_confirm: true });
  if (authError) {
    console.error("Erro ao alterar e-mail no Auth:", authError);
    const texto = String(authError.message || "").toLowerCase();
    const jaExiste = texto.includes("already") || texto.includes("registered") || texto.includes("exists");
    return jsonResponse({ error: jaExiste ? "Ja existe um usuario com este e-mail." : "Nao foi possivel alterar o e-mail de login." }, 400);
  }

  const { error: perfilError } = await supabaseAdmin.from("perfis").update({ email }).eq("user_id", userId);
  if (perfilError) {
    console.error("Erro ao alterar e-mail do perfil:", perfilError);
    return jsonResponse({ error: "E-mail de login alterado, mas o perfil nao foi atualizado. Salve de novo." }, 400);
  }

  return jsonResponse({ user_id: userId, email });
});
