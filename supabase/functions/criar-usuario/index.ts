import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function emailValido(valor: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
}

function mensagemAmigavelCriacaoAuth(erroMensagem: string) {
  const texto = String(erroMensagem || "").toLowerCase();

  if (texto.includes("already registered") || texto.includes("already exists")) {
    return "Ja existe um usuario com este e-mail.";
  }

  if (texto.includes("password") && texto.includes("6")) {
    return "A senha provisoria deve ter pelo menos 6 caracteres.";
  }

  if (texto.includes("email") && texto.includes("invalid")) {
    return "O e-mail informado e invalido.";
  }

  return "Nao foi possivel criar o usuario no momento.";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Metodo nao permitido." }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse({ error: "Funcao sem variaveis de ambiente." }, 500);
  }

  const authorization = req.headers.get("Authorization") || "";

  if (!authorization.startsWith("Bearer ")) {
    return jsonResponse({ error: "Sessao nao informada." }, 401);
  }

  const supabaseAuth = createClient(supabaseUrl, anonKey, {
    global: {
      headers: { Authorization: authorization },
    },
  });

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  const {
    data: { user },
    error: userError,
  } = await supabaseAuth.auth.getUser();

  if (userError || !user) {
    return jsonResponse({ error: "Sessao invalida." }, 401);
  }

  const { data: perfilAdmin, error: perfilError } = await supabaseAdmin
    .from("perfis")
    .select("tipo_perfil, ativo")
    .eq("user_id", user.id)
    .single();

  if (
    perfilError ||
    perfilAdmin?.tipo_perfil !== "admin" ||
    perfilAdmin?.ativo !== true
  ) {
    return jsonResponse({ error: "Somente administrador pode criar usuarios." }, 403);
  }

  let body: Record<string, unknown>;

  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "JSON invalido na requisicao." }, 400);
  }

  const nome = String(body.nome || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const senhaProvisoria = String(body.senha_provisoria || "").trim();
  const tipoPerfil = String(body.tipo_perfil || "representante").trim();
  const tiposPerfilValidos = new Set(["admin", "tecnico", "representante"]);
  const codigoRepresentanteRaw = String(body.codigo_representante || "")
    .replace(/\D/g, "")
    .trim();
  const codigoRepresentante =
    tipoPerfil === "representante"
      ? codigoRepresentanteRaw.padStart(6, "0")
      : null;
  const ativo = body.ativo !== false;

  if (!nome || !email || senhaProvisoria.length < 6) {
    return jsonResponse({ error: "Nome, e-mail e senha provisoria sao obrigatorios." }, 400);
  }

  if (!emailValido(email)) {
    return jsonResponse({ error: "E-mail invalido." }, 400);
  }

  if (!tiposPerfilValidos.has(tipoPerfil)) {
    return jsonResponse({ error: "Tipo de perfil invalido." }, 400);
  }

  if (tipoPerfil === "representante" && !codigoRepresentanteRaw) {
    return jsonResponse({ error: "Codigo do representante e obrigatorio." }, 400);
  }

  const { data: usuarioCriado, error: createError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password: senhaProvisoria,
      email_confirm: true,
      user_metadata: {
        nome,
        tipo_perfil: tipoPerfil,
      },
    });

  if (createError || !usuarioCriado.user) {
    if (createError) {
      console.error("Erro ao criar usuario no Auth:", createError);
    }

    return jsonResponse(
      {
        error: mensagemAmigavelCriacaoAuth(
          createError?.message || "Nao foi possivel criar usuario.",
        ),
      },
      400,
    );
  }

  const { error: perfilCreateError } = await supabaseAdmin
    .from("perfis")
    .upsert(
      {
        user_id: usuarioCriado.user.id,
        nome,
        email,
        tipo_perfil: tipoPerfil,
        codigo_representante: codigoRepresentante,
        ativo,
      },
      { onConflict: "user_id" },
    );

  if (perfilCreateError) {
    console.error("Erro ao criar perfil em perfis:", perfilCreateError);
    await supabaseAdmin.auth.admin.deleteUser(usuarioCriado.user.id);

    return jsonResponse(
      {
        error:
          "Usuario criado, mas houve erro ao concluir o perfil. Tente novamente em instantes.",
      },
      400,
    );
  }

  return jsonResponse({
    user_id: usuarioCriado.user.id,
    email,
  });
});
