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

  robots: {
    disallow: ['/api/']
  },

  nitro: {
    preset: 'cloudflare-pages',
    esbuild: {
      options: {
        target: 'esnext'
      }
    }
  },

  app: {
    head: {
      title: 'Snake Game — Classic Browser Snake',
      htmlAttrs: { lang: 'en' },
      meta: [
        { name: 'description', content: 'Play the classic snake game in your browser. Eat, grow, don\'t crash. Built with Nuxt and deployed on Cloudflare Pages.' },
        { name: 'keywords', content: 'snake game, browser game, classic snake, free online game, arcade game, nuxt game' },
        { property: 'og:title', content: 'Snake Game — Classic Browser Snake' },
        { property: 'og:description', content: 'Play the classic snake game in your browser. Eat, grow, don\'t crash.' },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: 'https://snake-game-47d.pages.dev' },
        { property: 'og:site_name', content: 'Snake Game' },
        { property: 'og:image', content: 'https://snake-game-47d.pages.dev/og-image.png' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'Snake Game — Classic Browser Snake' },
        { name: 'twitter:description', content: 'Play the classic snake game in your browser. Eat, grow, don\'t crash.' },
        { name: 'twitter:image', content: 'https://snake-game-47d.pages.dev/og-image.png' },
        { name: 'theme-color', content: '#030712' },
        { name: 'google-site-verification', content: '' }
      ],
      link: [
        { rel: 'canonical', href: 'https://snake-game-47d.pages.dev' }
      ]
    }
  }
})
