import { validateSession } from './auth'
import type { User } from '../database/schema'
import type { H3Event } from 'h3'

/**
 * Require a valid session for the current request.
 * Attaches the user to `event.context.user` and returns it.
 * Throws 401 if not authenticated or session is expired.
 */
export async function requireAuth(event: H3Event): Promise<User> {
  const sessionId = getCookie(event, 'session')

  if (!sessionId) {
    throw createError({ statusCode: 401, message: 'Not authenticated' })
  }

  const user = await validateSession(sessionId)

  if (!user) {
    // Clear stale cookie
    deleteCookie(event, 'session', { path: '/' })
    throw createError({ statusCode: 401, message: 'Session expired' })
  }

  // Attach user to event context for downstream handlers
  event.context.user = user
  return user
}
