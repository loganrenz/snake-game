import { deleteSession } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const sessionId = getCookie(event, 'session')

  if (sessionId) {
    await deleteSession(sessionId)
  }

  deleteCookie(event, 'session', { path: '/' })

  return { success: true }
})
