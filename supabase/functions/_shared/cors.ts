// CORS restrito às origens do Radar (auditoria de segurança 2026-08 / 2026-11).
// Cada função continua montando seus cabeçalhos com "*"; servir() troca o Access-Control-Allow-Origin
// da resposta pela origem de quem chamou, só se ela estiver na lista. Chamadas sem Origin (servidor,
// curl, apps de calendário) não são afetadas: CORS é regra do navegador.

const PERMITIDAS = [
  /^https:\/\/radarphenix\.pages\.dev$/, // Radar, feira e promo (produção)
  /^https:\/\/[a-z0-9-]+\.radarphenix\.pages\.dev$/, // prévias do Cloudflare Pages
  /^https:\/\/campanha\.phenixfiltros\.com\.br$/, // formulário público da Veste Phenix
  /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/, // desenvolvimento local
];

const PADRAO = "https://radarphenix.pages.dev";

export function origemPermitida(origem: string | null): boolean {
  return !!origem && PERMITIDAS.some((re) => re.test(origem));
}

/** Substitui Deno.serve: aplica a lista de origens permitidas em toda resposta. */
export function servir(handler: (req: Request) => Response | Promise<Response>) {
  Deno.serve(async (req) => {
    const origem = req.headers.get("Origin");
    const res = await handler(req);
    const headers = new Headers(res.headers);
    headers.set("Access-Control-Allow-Origin", origemPermitida(origem) ? origem! : PADRAO);
    const vary = headers.get("Vary");
    if (!vary?.includes("Origin")) headers.set("Vary", vary ? `${vary}, Origin` : "Origin");
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
  });
}
