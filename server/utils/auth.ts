import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { useDatabase, schema } from '../database'
import type { User } from '../database/schema'

const SESSION_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000 // 30 days
const PBKDF2_ITERATIONS = 600_000
const SALT_LENGTH = 16
const HASH_LENGTH = 32

// ─── Password hashing (Web Crypto — Workers-compatible) ────

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const hash = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as any, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    key,
    HASH_LENGTH * 8,
  )
  const saltHex = bytesToHex(new Uint8Array(salt))
  const hashHex = bytesToHex(new Uint8Array(hash))
  return `${saltHex}:${hashHex}`
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, expectedHex] = stored.split(':')
  if (!saltHex || !expectedHex) return false
  const salt = hexToBytes(saltHex)
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const hash = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as any, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    key,
    HASH_LENGTH * 8,
  )
  return bytesToHex(new Uint8Array(hash)) === expectedHex
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16)
  }
  return bytes
}

// ─── User management ───────────────────────────────────────

export async function createUser(email: string, password: string, name?: string): Promise<User> {
  const db = useDatabase()
  const id = nanoid()
  const passwordHash = await hashPassword(password)
  const now = new Date().toISOString()

  await db.insert(schema.users).values({
    id,
    email: email.toLowerCase().trim(),
    passwordHash,
    name: name || null,
    createdAt: now,
    updatedAt: now,
  })

  const user = await db.select().from(schema.users).where(eq(schema.users.id, id)).get()
  if (!user) throw createError({ statusCode: 500, message: 'Failed to create user' })
  return user
}

export async function verifyCredentials(email: string, password: string): Promise<User | null> {
  const db = useDatabase()
  const user = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email.toLowerCase().trim()))
    .get()

  if (!user || !user.passwordHash) return null
  const valid = await verifyPassword(password, user.passwordHash)
  return valid ? user : null
}

export async function getUserById(id: string): Promise<User | null> {
  const db = useDatabase()
  return (await db.select().from(schema.users).where(eq(schema.users.id, id)).get()) ?? null
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const db = useDatabase()
  return (await db.select().from(schema.users).where(eq(schema.users.email, email.toLowerCase().trim())).get()) ?? null
}

/**
 * Find an existing user by email, or create a new OAuth user.
 * If the user exists and has no appleId, it will be linked.
 */
export async function findOrCreateOAuthUser(opts: {
  email: string
  name?: string
  appleId?: string
}): Promise<User> {
  const db = useDatabase()
  const existing = await getUserByEmail(opts.email)

  if (existing) {
    // Link Apple ID if not yet set
    if (opts.appleId && !existing.appleId) {
      await db
        .update(schema.users)
        .set({ appleId: opts.appleId, updatedAt: new Date().toISOString() })
        .where(eq(schema.users.id, existing.id))
    }
    return existing
  }

  // Create new OAuth user (no password)
  const id = nanoid()
  const now = new Date().toISOString()
  await db.insert(schema.users).values({
    id,
    email: opts.email.toLowerCase().trim(),
    name: opts.name || null,
    appleId: opts.appleId || null,
    createdAt: now,
    updatedAt: now,
  })

  const user = await db.select().from(schema.users).where(eq(schema.users.id, id)).get()
  if (!user) throw createError({ statusCode: 500, message: 'Failed to create OAuth user' })
  return user
}

// ─── Session management ─────────────────────────────────────

export async function createSession(userId: string): Promise<string> {
  const db = useDatabase()
  const id = nanoid(32)
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_MS)

  await db.insert(schema.sessions).values({
    id,
    userId,
    expiresAt,
    createdAt: new Date().toISOString(),
  })

  return id
}

export async function validateSession(sessionId: string): Promise<User | null> {
  const db = useDatabase()
  const session = await db
    .select()
    .from(schema.sessions)
    .where(eq(schema.sessions.id, sessionId))
    .get()

  if (!session) return null
  if (new Date(session.expiresAt) < new Date()) {
    await deleteSession(sessionId)
    return null
  }

  return getUserById(session.userId)
}

export async function deleteSession(sessionId: string): Promise<void> {
  const db = useDatabase()
  await db.delete(schema.sessions).where(eq(schema.sessions.id, sessionId))
}
