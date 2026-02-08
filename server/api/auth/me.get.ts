import { validateSession } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const sessionId = getCookie(event, 'session')

  if (!sessionId) {
    return { user: null }
  }

  const user = await validateSession(sessionId)

  if (!user) {
    deleteCookie(event, 'session', { path: '/' })
    return { user: null }
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
    },
  }
})
