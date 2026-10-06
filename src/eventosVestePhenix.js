import { supabaseUrl, supabaseAnonKey } from './supabaseClient';

// Contador de cliques/acessos da feira (tabela veste_phenix_eventos). Nunca atrapalha a tela:
// falhas de rede são ignoradas, e keepalive garante o envio mesmo quando o clique troca de página
// (botão do VestControl).
export function registrarEvento(evento, origem = 'direto') {
  try {
    fetch(`${supabaseUrl}/rest/v1/rpc/registrar_evento_veste_phenix`, {
      method: 'POST',
      keepalive: true,
      headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_evento: evento, p_origem: origem }),
    }).catch(() => {});
  } catch { /* sem rede ou navegador antigo: o contador não é essencial */ }
}

// Origem do acesso à página pública: ?origem=qrcode no link do QR code; sem parâmetro = "direto".
export function origemDoLink() {
  const o = new URLSearchParams(window.location.search).get('origem');
  return (o || 'direto').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 40) || 'direto';
}

// Conta um acesso por visita (recarregar a página não soma de novo).
export function registrarAcessoPromocao() {
  const origem = origemDoLink();
  try {
    if (sessionStorage.getItem('vestePhenix:acessoRegistrado')) return;
    sessionStorage.setItem('vestePhenix:acessoRegistrado', '1');
  } catch { /* sem sessionStorage: conta mesmo assim */ }
  registrarEvento('acesso_promocao', origem);
}
