export default defineEventHandler(async (event) => {
  // Static pages
  const staticPages = [
    { loc: '/', priority: 1.0, changefreq: 'daily' },
    // Add more static routes here as you build them
  ]

  // Dynamic pages from D1 (example: users profile or public posts)
  // const db = useDatabase()
  // const users = await db.select({ id: users.id }).from(users).all()
  // const userPages = users.map(u => ({ loc: `/users/${u.id}`, priority: 0.5 }))
  const dynamicPages: any[] = []

  return [...staticPages, ...dynamicPages].map(p => ({
    ...p,
    lastmod: new Date().toISOString()
  }))
})
