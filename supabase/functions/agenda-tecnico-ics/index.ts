import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

function textResponse(
  body: string,
  status = 200,
  contentType = "text/plain; charset=utf-8",
  extraHeaders: Record<string, string> = {},
) {
  return new Response(body, {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": contentType,
      "Cache-Control": "no-store",
      ...extraHeaders,
    },
  });
}

function escaparTextoIcs(valor: string) {
  return String(valor || "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function formatarDataSomente(data: Date) {
  const ano = data.getUTCFullYear();
  const mes = String(data.getUTCMonth() + 1).padStart(2, "0");
  const dia = String(data.getUTCDate()).padStart(2, "0");
  return `${ano}${mes}${dia}`;
}

function formatarDataHoraUtc(data: Date) {
  return (
    formatarDataSomente(data) +
    "T" +
    String(data.getUTCHours()).padStart(2, "0") +
    String(data.getUTCMinutes()).padStart(2, "0") +
    String(data.getUTCSeconds()).padStart(2, "0") +
    "Z"
  );
}

// Brasil nao usa mais horario de verao (desde 2019), entao o deslocamento de
// Sao Paulo em relacao ao UTC e fixo em -03:00.
const DESLOCAMENTO_BRASIL_HORAS = 3;

function statusLegivel(status: string | null, visitado: boolean | null) {
  if (status === "CANCELADO") return "Cancelado";
  if (status === "VISITADO" || visitado === true) return "Visitado";
  return "Pendente";
}

function montarEvento(item: {
  id: number;
  status: string | null;
  visitado: boolean | null;
  data_prevista_visita: string;
  horario_previsto_visita: string | null;
  rotaNome: string;
  tecnicoNome: string;
  clienteNome: string;
  clienteEndereco: string;
}) {
  const uid = `rota-cliente-${item.id}@radar-clientes`;
  const label = statusLegivel(item.status, item.visitado);
  // Nao usar STATUS:CANCELLED do iCal: Google Calendar (e a maioria dos
  // apps de agenda) oculta esses eventos por completo em vez de riscar.
  // O prefixo "[Cancelado]" no titulo ja comunica isso mantendo o evento visivel.
  const status = "CONFIRMED";
  const prefixo = label === "Pendente" ? "" : `[${label}] `;
  const summary = escaparTextoIcs(
    `${prefixo}Visita: ${item.clienteNome || "Cliente"}`,
  );
  const description = escaparTextoIcs(
    `Rota: ${item.rotaNome || "-"}\nTecnico responsavel: ${item.tecnicoNome || "-"}\nStatus: ${label}`,
  );
  const location = item.clienteEndereco
    ? `LOCATION:${escaparTextoIcs(item.clienteEndereco)}\r\n`
    : "";

  const [ano, mes, dia] = item.data_prevista_visita.split("-").map(Number);

  let dtStart: string;
  let dtEnd: string;

  if (item.horario_previsto_visita) {
    const [hora, minuto] = item.horario_previsto_visita.split(":").map(Number);
    const inicioLocal = new Date(
      Date.UTC(ano, mes - 1, dia, hora + DESLOCAMENTO_BRASIL_HORAS, minuto || 0, 0),
    );
    const fimLocal = new Date(inicioLocal.getTime() + 60 * 60 * 1000);

    dtStart = `DTSTART:${formatarDataHoraUtc(inicioLocal)}\r\n`;
    dtEnd = `DTEND:${formatarDataHoraUtc(fimLocal)}\r\n`;
  } else {
    const inicioDia = new Date(Date.UTC(ano, mes - 1, dia));
    const fimDia = new Date(Date.UTC(ano, mes - 1, dia + 1));

    dtStart = `DTSTART;VALUE=DATE:${formatarDataSomente(inicioDia)}\r\n`;
    dtEnd = `DTEND;VALUE=DATE:${formatarDataSomente(fimDia)}\r\n`;
  }

  return (
    "BEGIN:VEVENT\r\n" +
    `UID:${uid}\r\n` +
    `DTSTAMP:${formatarDataHoraUtc(new Date())}\r\n` +
    dtStart +
    dtEnd +
    `SUMMARY:${summary}\r\n` +
    `DESCRIPTION:${description}\r\n` +
    location +
    `STATUS:${status}\r\n` +
    "END:VEVENT\r\n"
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return textResponse("Metodo nao permitido.", 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return textResponse("Funcao sem variaveis de ambiente.", 500);
  }

  const token = new URL(req.url).searchParams.get("token") || "";

  if (!token) {
    return textResponse("Token nao informado.", 400);
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: perfil, error: perfilError } = await supabaseAdmin
    .from("perfis")
    .select("user_id, nome")
    .eq("calendario_token", token)
    .eq("ativo", true)
    .maybeSingle();

  if (perfilError || !perfil) {
    return textResponse("Agenda nao encontrada.", 404);
  }

  const { data: rotas, error: rotasError } = await supabaseAdmin
    .from("rotas")
    .select("id, nome")
    .eq("usuario_responsavel", perfil.user_id);

  if (rotasError) {
    console.error("Erro ao carregar rotas:", rotasError);
    return textResponse("Nao foi possivel montar a agenda agora.", 500);
  }

  const rotaPorId = new Map((rotas || []).map((rota) => [rota.id, rota.nome]));
  const rotaIds = Array.from(rotaPorId.keys());

  let itens: Array<{
    id: number;
    cliente_id: number;
    rota_id: number;
    status: string | null;
    visitado: boolean | null;
    data_prevista_visita: string;
    horario_previsto_visita: string | null;
  }> = [];

  if (rotaIds.length > 0) {
    const { data: itensRota, error: itensError } = await supabaseAdmin
      .from("rota_clientes")
      .select(
        "id, cliente_id, rota_id, status, visitado, data_prevista_visita, horario_previsto_visita",
      )
      .in("rota_id", rotaIds)
      .not("data_prevista_visita", "is", null)
      .order("data_prevista_visita");

    if (itensError) {
      console.error("Erro ao carregar visitas:", itensError);
      return textResponse("Nao foi possivel montar a agenda agora.", 500);
    }

    itens = itensRota || [];
  }

  const clienteIds = Array.from(new Set(itens.map((item) => item.cliente_id)));
  let clientePorId = new Map<number, { cliente: string; endereco_completo: string }>();

  if (clienteIds.length > 0) {
    const { data: clientes, error: clientesError } = await supabaseAdmin
      .from("clientes")
      .select("id, cliente, endereco_completo")
      .in("id", clienteIds);

    if (clientesError) {
      console.error("Erro ao carregar clientes:", clientesError);
      return textResponse("Nao foi possivel montar a agenda agora.", 500);
    }

    clientePorId = new Map(
      (clientes || []).map((cliente) => [
        cliente.id,
        { cliente: cliente.cliente, endereco_completo: cliente.endereco_completo },
      ]),
    );
  }

  const eventos = itens
    .map((item) => {
      const cliente = clientePorId.get(item.cliente_id);

      return montarEvento({
        id: item.id,
        status: item.status,
        visitado: item.visitado,
        data_prevista_visita: item.data_prevista_visita,
        horario_previsto_visita: item.horario_previsto_visita,
        rotaNome: rotaPorId.get(item.rota_id) || "",
        tecnicoNome: perfil.nome || "",
        clienteNome: cliente?.cliente || "",
        clienteEndereco: cliente?.endereco_completo || "",
      });
    })
    .join("");

  const calendario =
    "BEGIN:VCALENDAR\r\n" +
    "VERSION:2.0\r\n" +
    "PRODID:-//Radar de Clientes//Agenda Tecnico//PT-BR\r\n" +
    "CALSCALE:GREGORIAN\r\n" +
    "METHOD:PUBLISH\r\n" +
    `X-WR-CALNAME:${escaparTextoIcs(`Rotas - ${perfil.nome || ""}`)}\r\n` +
    "REFRESH-INTERVAL;VALUE=DURATION:PT12H\r\n" +
    eventos +
    "END:VCALENDAR\r\n";

  return textResponse(calendario, 200, "text/calendar; charset=utf-8", {
    "Content-Disposition": 'attachment; filename="agenda.ics"',
  });
});
