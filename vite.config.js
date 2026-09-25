import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath } from 'node:url'

const MANIFESTO_RADAR = /<link rel="manifest" href="\/manifest\.webmanifest"[^>]*>\s*/g

// O vite-plugin-pwa injeta o manifesto do Radar em todas as páginas; a página da
// feira precisa anunciar somente o manifesto do Veste Phenix.
const manifestoSoDoRadar = {
  name: 'manifesto-so-do-radar',
  enforce: 'post',
  transformIndexHtml: {
    order: 'post',
    handler(html, ctx) {
      return ctx.path.startsWith('/feira/') ? html.replace(MANIFESTO_RADAR, '') : html
    },
  },
}

// https://vite.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        radar: fileURLToPath(new URL('./index.html', import.meta.url)),
        // Servida pelo Cloudflare em /feira/veste-phenix (URL sem .html).
        feira: fileURLToPath(new URL('./feira/veste-phenix.html', import.meta.url)),
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['pwa-64x64.png'],
      workbox: {
        // /feira/veste-phenix vem da página própria pré-cacheada (feira/veste-phenix.html),
        // nunca do index.html do Radar.
        navigateFallbackDenylist: [/^\/feira\//],
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
})
