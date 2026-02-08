import { initDatabase } from '../database'

/**
 * Server middleware that initialises the D1 database connection
 * from the Cloudflare environment on every incoming request.
 */
export default defineEventHandler((event) => {
  try {
    const d1 = (event.context.cloudflare?.env as { DB?: any })?.DB
    if (d1) {
      initDatabase(d1)
    }
  } catch {
    // D1 not available (e.g. local dev without wrangler) — skip silently
  }
})
