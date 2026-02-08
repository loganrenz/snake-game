#!/usr/bin/env node
/**
 * One-time setup for a new app created from nuxt-v4-template.
 * Run from the new app's repo root.
 *
 * Usage: node scripts/setup-new-app.mjs <APP_NAME> <SITE_URL> [DOPPLER_PROJECT] [DOPPLER_CONFIG]
 *   APP_NAME         e.g. my-app (lowercase, hyphens)
 *   SITE_URL         e.g. https://my-app.pages.dev
 *   DOPPLER_PROJECT  optional, default: APP_NAME
 *   DOPPLER_CONFIG   optional, default: dev_base
 *
 * Prerequisites: Doppler CLI logged in, nuxt_template has GA_ACCOUNT_ID, GSC_*, POSTHOG_PERSONAL_API_KEY.
 */

import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const cwd = process.cwd()

const [APP_NAME, SITE_URL, DOPPLER_PROJECT = null, DOPPLER_CONFIG = null] = process.argv.slice(2)
const DOPPLER_PROJ = DOPPLER_PROJECT || APP_NAME
const DOPPLER_CFG = DOPPLER_CONFIG || 'dev_base'

if (!APP_NAME || !SITE_URL) {
  console.error('Usage: node scripts/setup-new-app.mjs <APP_NAME> <SITE_URL> [DOPPLER_PROJECT] [DOPPLER_CONFIG]')
  console.error('Example: node scripts/setup-new-app.mjs my-app https://my-app.pages.dev')
  process.exit(1)
}

// Validate URL
try {
  new URL(SITE_URL)
} catch {
  console.error('Invalid SITE_URL:', SITE_URL)
  process.exit(1)
}

// Sanity: we're in a template-like repo
const required = ['package.json', 'nuxt.config.ts', 'wrangler.json', 'doppler.yaml']
for (const f of required) {
  if (!existsSync(join(cwd, f))) {
    console.error('Missing', f, '- run this from the new app repo root (a copy of nuxt-v4-template).')
    process.exit(1)
  }
}

function run(cmd, opts = {}) {
  const options = { encoding: 'utf8', cwd, ...opts }
  if (opts.silent) options.stdio = 'pipe'
  return execSync(cmd, options)
}

function titleCase(slug) {
  return slug
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

console.log('Setting up app:', APP_NAME, '|', SITE_URL)
console.log('Doppler project:', DOPPLER_PROJ, '| config:', DOPPLER_CFG)
console.log()

// 1. package.json name
const pkgPath = join(cwd, 'package.json')
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
pkg.name = APP_NAME
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
console.log('  ✓ package.json name ->', APP_NAME)

// 2. nuxt.config.ts
const nuxtPath = join(cwd, 'nuxt.config.ts')
let nuxt = readFileSync(nuxtPath, 'utf8')
const siteName = titleCase(APP_NAME)
nuxt = nuxt.replace(
  /appUrl: process\.env\.SITE_URL \|\| '[^']*'/,
  `appUrl: process.env.SITE_URL || '${SITE_URL}'`
)
nuxt = nuxt.replace(/url: 'https:\/\/[^']*'/, `url: '${SITE_URL}'`)
nuxt = nuxt.replace(/name: '[^']*'/, `name: '${siteName}'`)
writeFileSync(nuxtPath, nuxt)
console.log('  ✓ nuxt.config.ts site / appUrl')

// 3. D1 create and wrangler.json
const dbName = `${APP_NAME}-db`
let out
try {
  out = run(`npx wrangler d1 create ${dbName}`, { silent: true, maxBuffer: 1024 * 1024 })
} catch (e) {
  out = (e.stdout ?? e.stderr ?? e.message ?? '').toString()
}
const idMatch = (out || '').match(/"database_id":\s*"([^"]+)"/)
const databaseId = idMatch ? idMatch[1] : null
if (!databaseId) {
  console.error('Could not parse database_id from wrangler output. Run manually: npx wrangler d1 create', dbName)
  process.exit(1)
}

const wranglerPath = join(cwd, 'wrangler.json')
const wrangler = JSON.parse(readFileSync(wranglerPath, 'utf8'))
wrangler.name = APP_NAME
const d1 = wrangler.d1_databases?.[0]
if (d1) {
  d1.database_name = dbName
  d1.database_id = databaseId
}
writeFileSync(wranglerPath, JSON.stringify(wrangler, null, 2) + '\n')
console.log('  ✓ wrangler.json + D1', dbName)

// 4. doppler.yaml
const dopplerPath = join(cwd, 'doppler.yaml')
writeFileSync(
  dopplerPath,
  `# Doppler project for this app. Run: doppler run -- npm run dev\nproject: ${DOPPLER_PROJ}\nconfig: ${DOPPLER_CFG}\n`
)
console.log('  ✓ doppler.yaml ->', DOPPLER_PROJ, '/', DOPPLER_CFG)

// 5. Doppler project + config
try {
  run(`doppler projects create ${DOPPLER_PROJ}`)
} catch (e) {
  if (!e.message?.includes('already exists')) throw e
  console.log('  (Doppler project already exists)')
}
try {
  run(`doppler configs create ${DOPPLER_CFG} --project ${DOPPLER_PROJ} --environment dev`)
} catch (e) {
  if (!e.message?.includes('already exists') && !e.message?.includes('Unable to create')) throw e
  console.log('  (Doppler config already exists)')
}
run(`doppler secrets set SITE_URL="${SITE_URL}" --project ${DOPPLER_PROJ} --config ${DOPPLER_CFG}`)
console.log('  ✓ Doppler SITE_URL set')

// 6. Pages project
try {
  run(`npx wrangler pages project create ${APP_NAME} --production-branch main`)
} catch (e) {
  if (!e.message?.includes('already exists') && !e.message?.includes('does not match')) throw e
  console.log('  (Pages project already exists)')
}

// 7. npm install
console.log()
console.log('Running npm install...')
run('npm install')

// 8. setup:all (nuxt_template + SITE_URL)
console.log()
console.log('Running analytics setup (nuxt_template + SITE_URL)...')
run(`SITE_URL=${JSON.stringify(SITE_URL)} doppler run --project nuxt_template --config base -- npm run setup:all`)

console.log()
console.log('══════════════════════════════════════════════════════════')
console.log('  Setup complete. Next steps:')
console.log('  1. Deploy:    doppler run -- npm run deploy')
console.log('  2. GSC verify:')
console.log(`     SITE_URL=${JSON.stringify(SITE_URL)} doppler run --project nuxt_template --config base -- npm run setup:gsc:verify`)
console.log('══════════════════════════════════════════════════════════')
