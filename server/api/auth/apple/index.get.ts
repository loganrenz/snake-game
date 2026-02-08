import { nanoid } from 'nanoid'
import { buildAppleAuthUrl } from '../../../utils/apple-auth'

/**
 * GET /api/auth/apple
 * Redirects to Apple's authorization page with CSRF state protection.
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const appUrl = config.public.appUrl as string
  const redirectUri = `${appUrl}/api/auth/apple/callback`

  // CSRF protection: generate state token and store in cookie
  const state = nanoid(32)
  setCookie(event, 'apple_oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 600, // 10 minutes
  })

  const authUrl = buildAppleAuthUrl(redirectUri, state)
  return sendRedirect(event, authUrl)
})
