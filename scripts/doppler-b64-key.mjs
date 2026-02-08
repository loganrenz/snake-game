#!/usr/bin/env node
/**
 * Output the service account JSON file as a single base64 line for pasting
 * into Doppler as GSC_SERVICE_ACCOUNT_JSON.
 *
 * Usage: node scripts/doppler-b64-key.mjs [path-to-key.json]
 *        (default path: ./narduk-seo-automation-583d7293c237.json if present, else first narduk-seo-automation-*.json)
 */

import { readFileSync, existsSync } from 'node:fs'
import { readdirSync } from 'node:fs'
import { resolve, join } from 'node:path'

const cwd = process.cwd()
let keyPath = process.argv[2]

if (!keyPath) {
  const defaultName = 'narduk-seo-automation-583d7293c237.json'
  const defaultPath = join(cwd, defaultName)
  if (existsSync(defaultPath)) {
    keyPath = defaultPath
  } else {
    try {
      const files = readdirSync(cwd).filter((f) => f.startsWith('narduk-seo-automation-') && f.endsWith('.json'))
      if (files.length) keyPath = join(cwd, files[0])
    } catch (_) {}
  }
}

if (!keyPath || !existsSync(resolve(cwd, keyPath))) {
  console.error('Usage: node scripts/doppler-b64-key.mjs <path-to-service-account.json>')
  console.error('Example: node scripts/doppler-b64-key.mjs ./narduk-seo-automation-583d7293c237.json')
  process.exit(1)
}

const raw = readFileSync(resolve(cwd, keyPath), 'utf8')
const b64 = Buffer.from(raw, 'utf8').toString('base64')
console.log(b64)
