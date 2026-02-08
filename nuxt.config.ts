import pkg from './package.json'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/ui',
    '@nuxt/fonts',
    '@nuxtjs/sitemap',
    '@nuxtjs/robots'
  ],
  css: ['~/assets/css/main.css'],

  compatibilityDate: '2025-07-15',

  devtools: { enabled: true },

  future: {
    compatibilityVersion: 4
  },

  ui: {
    colorMode: false
  },

  // Inject build-time constants available in client & server code
  vite: {
    define: {
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
      __APP_VERSION__: JSON.stringify(pkg.version)
    }
  },

  runtimeConfig: {
    public: {
      // Analytics
      posthogPublicKey: process.env.POSTHOG_PUBLIC_KEY || '',
      posthogHost: process.env.POSTHOG_HOST || 'https://us.i.posthog.com',
      gaMeasurementId: process.env.GA_MEASUREMENT_ID || '',
      appUrl: process.env.SITE_URL || 'https://snake-game-47d.pages.dev',
      appName: process.env.APP_NAME || pkg.name || ''
    }
  },

  site: {
    url: 'https://snake-game-47d.pages.dev',
    name: 'Snake Game'
  },

  sitemap: {
    sources: ['/api/sitemap-urls']
  },

  nitro: {
    preset: 'cloudflare-pages',
    esbuild: {
      options: {
        target: 'esnext'
      }
    }
  }
})
