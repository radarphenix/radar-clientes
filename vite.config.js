import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath } from 'node:url'
import { networkInterfaces } from 'node:os'

// Inspeção de Qualidade (menu do Radar): em desenvolvimento, o QR Code do celular usa o IP da rede
// no lugar de localhost (o celular não alcança o localhost do computador).
const PORTA_DEV = 5173
function ipDaRede() {
  const virtual = /vEthernet|Hyper-V|WSL|VirtualBox|VMware|Loopback|Tailscale/i
  for (const [nome, lista] of Object.entries(networkInterfaces())) {
    if (virtual.test(nome)) continue
    const ip = lista?.find((i) => i.family === 'IPv4' && !i.internal)
    if (ip) return ip.address
  }
  return ''
}
const MANIFESTO_RADAR = /<link rel="manifest" href="\/manifest\.webmanifest"[^>]*>\s*/g

// O vite-plugin-pwa injeta o manifesto do Radar em todas as páginas; a página da
// feira precisa anunciar somente o manifesto do Veste Phenix, e as páginas avulsas
// (promoção e cadastro de produtos) não anunciam manifesto nenhum.
const manifestoSoDoRadar = {
  name: 'manifesto-so-do-radar',
  enforce: 'post',
  transformIndexHtml: {
    order: 'post',
    handler(html, ctx) {
      return /^\/(feira|promo)\//.test(ctx.path) ? html.replace(MANIFESTO_RADAR, '') : html
    },
  },
}

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  define: {
    __INSPECAO_LAN_URL__: JSON.stringify(command === 'serve' && ipDaRede() ? `http://${ipDaRede()}:${PORTA_DEV}` : ''),
  },
  // host: o celular do QR Code precisa alcançar o servidor de desenvolvimento pela rede
  server: { port: PORTA_DEV, host: true },
  build: {
    rollupOptions: {
      input: {
        radar: fileURLToPath(new URL('./index.html', import.meta.url)),
        // Servida pelo Cloudflare em /feira/veste-phenix (URL sem .html).
        feira: fileURLToPath(new URL('./feira/veste-phenix.html', import.meta.url)),
        // Páginas próprias para a aba e a prévia do link já nascerem com a cara do Veste Phenix.
        cadastroProdutos: fileURLToPath(new URL('./feira/cp-nrkdyzu.html', import.meta.url)),
        promo: fileURLToPath(new URL('./promo/veste-phenix.html', import.meta.url)),
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['pwa-64x64.png', 'manifest-feira-veste-phenix.webmanifest', 'favicon-veste-phenix.png', 'veste-phenix-*.png'],
      workbox: {
        // /feira/veste-phenix vem da página própria pré-cacheada (feira/veste-phenix.html),
        // nunca do index.html do Radar. PDFs (ex.: /regulamento.pdf aberto em nova aba)
        // também são navegação e precisam ir ao servidor, senão abrem a tela do Radar.
        navigateFallbackDenylist: [/^\/feira\//, /^\/promo\//, /\.pdf(\?.*)?$/i],
      },
      manifest: {
        name: 'Radar de Clientes Phenix',
        short_name: 'Radar Clientes',
        description: 'Rotas, clientes próximos e oportunidades comerciais Phenix.',
        lang: 'pt-BR',
        // O Radar fica em /radar/ para que o app instalado não abranja /feira/
        // (o Veste Phenix é outro app instalável no mesmo site). O id '/' mantém
        // a identidade das instalações antigas, que eram feitas com start_url '/'.
        id: '/',
        start_url: '/radar/',
        scope: '/radar/',
        display: 'standalone',
        background_color: '#edf4fb',
        theme_color: '#0057d8',
        icons: [
          {
            src: 'pwa-64x64.png',
            sizes: '64x64',
            type: 'image/png',
          },
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
    manifestoSoDoRadar,
  ],
}))
