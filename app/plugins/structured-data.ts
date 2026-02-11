/**
 * JSON-LD Structured Data — WebApplication schema for search engine rich results
 */
export default defineNuxtPlugin(() => {
  useHead({
    script: [
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'Snake Game',
          url: 'https://snake-game.pages.dev',
          description: 'Play the classic snake game in your browser. Eat, grow, don\'t crash. Built with Nuxt and deployed on Cloudflare Pages.',
          applicationCategory: 'GameApplication',
          operatingSystem: 'Web Browser',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD'
          }
        })
      }
    ]
  })
})
