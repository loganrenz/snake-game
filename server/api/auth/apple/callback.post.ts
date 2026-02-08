import { exchangeAppleCode, decodeAppleIdToken } from '../../../utils/apple-auth'
import { findOrCreateOAuthUser, createSession } from '../../../utils/auth'

/**
 * POST /api/auth/apple/callback
 * Apple uses response_mode=form_post, so this receives a POST with form data.
 * Validates CSRF state, exchanges code, creates/finds user, sets session.
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const appUrl = config.public.appUrl as string
  const body = await readBody(event)

  const { code, state, id_token, user: userJson } = body || {}

  // ─── CSRF validation ──────────────────────────────────
  const storedState = getCookie(event, 'apple_oauth_state')
  deleteCookie(event, 'apple_oauth_state', { path: '/' })

  if (!state || !storedState || state !== storedState) {
    throw createError({ statusCode: 400, message: 'Invalid state — possible CSRF attack' })
  }

  if (!code) {
    throw createError({ statusCode: 400, message: 'Missing authorization code' })
  }

  // ─── Exchange code for tokens ──────────────────────────
  const redirectUri = `${appUrl}/api/auth/apple/callback`
  const tokens = await exchangeAppleCode(code, redirectUri)

  // ─── Decode the ID token ──────────────────────────────
  const idTokenPayload = decodeAppleIdToken(tokens.id_token || id_token)

  // ─── Extract user info ────────────────────────────────
  // Apple only sends user info on the FIRST authorization
  let name: string | undefined
  if (userJson) {
    try {
      const parsed = typeof userJson === 'string' ? JSON.parse(userJson) : userJson
      if (parsed.name) {
        name = [parsed.name.firstName, parsed.name.lastName].filter(Boolean).join(' ')
      }
    } catch {
      // User info parsing failed — non-critical
    }
  }

  const email = idTokenPayload.email
  if (!email) {
    throw createError({ statusCode: 400, message: 'Apple did not provide an email address' })
  }

  // ─── Find or create user ──────────────────────────────
  const user = await findOrCreateOAuthUser({
    email,
    name,
    appleId: idTokenPayload.sub,
  })

  // ─── Create session ───────────────────────────────────
  const sessionId = await createSession(user.id)

  setCookie(event, 'session', sessionId, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  })

  // Redirect to home page after successful sign-in
  return sendRedirect(event, '/')
})
