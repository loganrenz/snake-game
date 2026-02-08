/**
 * Logs the app version and build timestamp to the console on client load.
 *
 * Build-time constants (__APP_VERSION__, __BUILD_TIME__) are injected
 * via `vite.define` in nuxt.config.ts.
 */

declare const __APP_VERSION__: string
declare const __BUILD_TIME__: string

export default defineNuxtPlugin(() => {
  const version = __APP_VERSION__
  const buildTime = __BUILD_TIME__

  console.log(
    `%c🚀 v${version} %c| Built ${buildTime}`,
    'color: #22c55e; font-weight: bold; font-size: 13px',
    'color: #94a3b8; font-size: 12px'
  )
})
