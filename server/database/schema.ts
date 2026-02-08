import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

// ─── Users ──────────────────────────────────────────────────
export const users = sqliteTable('users', {
  id: text('id').primaryKey(), // nanoid
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'), // null for OAuth-only users
  name: text('name'),
  appleId: text('apple_id').unique(), // Apple Sign-In subject ID
  isAdmin: integer('is_admin', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
})

// ─── Sessions ───────────────────────────────────────────────
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(), // nanoid
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
})

// ─── Type helpers ───────────────────────────────────────────
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Session = typeof sessions.$inferSelect
export type NewSession = typeof sessions.$inferInsert
