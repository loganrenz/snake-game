export default defineNuxtPlugin(() => {
  const { gaMeasurementId } = useRuntimeConfig().public

  if (!gaMeasurementId || import.meta.server) return

  // Skip on localhost
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') return

  // Load gtag.js script
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`
  document.head.appendChild(script)

  // Initialize gtag
  window.dataLayer = window.dataLayer || []
  function gtag(...args: any[]) {
    window.dataLayer.push(args)
  }
  gtag('js', new Date())
  gtag('config', gaMeasurementId, {
    send_page_view: true,
  })

  // Track SPA route changes
  const router = useRouter()
  router.afterEach((to) => {
    nextTick(() => {
      gtag('config', gaMeasurementId, {
        page_path: to.fullPath,
      })
    })
  })
})

// Type augmentation for window.dataLayer
declare global {
  interface Window {
    dataLayer: any[]
  }
}
