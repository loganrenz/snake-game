/**
 * Apple Sign-In utilities — ES256 JWT generation, code exchange, ID token decoding.
 * Uses Web Crypto API for full Cloudflare Workers compatibility.
 */

interface AppleTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token?: string
  id_token: string
}

interface AppleIdTokenPayload {
  iss: string
  aud: string
  exp: number
  iat: number
  sub: string // Apple user identifier
  email?: string
  email_verified?: string | boolean
  nonce?: string
}

// ─── JWT Client Secret Generation ──────────────────────────

function base64urlEncode(data: Uint8Array): string {
  let binary = ''
  for (const byte of data) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64urlDecode(str: string): Uint8Array {
  str = str.replace(/-/g, '+').replace(/_/g, '/')
  while (str.length % 4) str += '='
  const binary = atob(str)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

/**
 * Convert a PEM-encoded PKCS#8 private key to a CryptoKey suitable for ES256 signing.
 */
async function importApplePrivateKey(pemKey: string): Promise<CryptoKey> {
  const cleaned = pemKey
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s+/g, '')

  const binaryDer = Uint8Array.from(atob(cleaned), c => c.charCodeAt(0))

  return crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  )
}

/**
 * Generate a signed JWT client secret for Apple's token endpoint.
 * @see https://developer.apple.com/documentation/sign_in_with_apple/generate_and_validate_tokens
 */
export async function generateAppleClientSecret(): Promise<string> {
  const config = useRuntimeConfig()
  const { appleTeamId, appleClientId, appleKeyId, appleSecretKey } = config

  if (!appleTeamId || !appleClientId || !appleKeyId || !appleSecretKey) {
    throw createError({ statusCode: 500, message: 'Apple Sign-In not configured' })
  }

  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'ES256', kid: appleKeyId, typ: 'JWT' }
  const payload = {
    iss: appleTeamId,
    iat: now,
    exp: now + 180 * 24 * 60 * 60, // 6 months max
    aud: 'https://appleid.apple.com',
    sub: appleClientId,
  }

  const headerB64 = base64urlEncode(new TextEncoder().encode(JSON.stringify(header)))
  const payloadB64 = base64urlEncode(new TextEncoder().encode(JSON.stringify(payload)))
  const signingInput = `${headerB64}.${payloadB64}`

  const key = await importApplePrivateKey(appleSecretKey)
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    new TextEncoder().encode(signingInput),
  )

  // Convert DER signature to raw r||s format for JWT
  const sigBytes = new Uint8Array(signature)
  const rawSig = derToRaw(sigBytes)
  const signatureB64 = base64urlEncode(rawSig)

  return `${signingInput}.${signatureB64}`
}

/**
 * Convert a DER-encoded ECDSA signature to raw r||s format.
 */
function derToRaw(der: Uint8Array): Uint8Array {
  // If already raw (64 bytes), return as-is
  if (der.length === 64) return der

  const raw = new Uint8Array(64)
  let offset = 2 // skip SEQUENCE tag and length

  // Parse r
  if (der[offset] !== 0x02) throw new Error('Invalid DER signature')
  offset++
  let rLen = der[offset++] || 0
  if (rLen === 33 && der[offset] === 0x00) { offset++; rLen = 32 }
  raw.set(der.subarray(offset, offset + Math.min(rLen, 32)), 32 - Math.min(rLen, 32))
  offset += rLen

  // Parse s
  if (der[offset] !== 0x02) throw new Error('Invalid DER signature')
  offset++
  let sLen = der[offset++] || 0
  if (sLen === 33 && der[offset] === 0x00) { offset++; sLen = 32 }
  raw.set(der.subarray(offset, offset + Math.min(sLen, 32)), 64 - Math.min(sLen, 32))

  return raw
}

// ─── Token Exchange ────────────────────────────────────────

/**
 * Exchange an Apple authorization code for tokens.
 */
export async function exchangeAppleCode(code: string, redirectUri: string): Promise<AppleTokenResponse> {
  const config = useRuntimeConfig()
  const clientSecret = await generateAppleClientSecret()

  const body = new URLSearchParams({
    client_id: config.appleClientId,
    client_secret: clientSecret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
  })

  const res = await fetch('https://appleid.apple.com/auth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw createError({ statusCode: 400, message: `Apple token exchange failed: ${errorText}` })
  }

  return res.json() as Promise<AppleTokenResponse>
}

// ─── ID Token Decoding ────────────────────────────────────

/**
 * Decode and lightly validate an Apple ID token.
 * NOTE: For production, you should verify the signature against Apple's public keys.
 */
export function decodeAppleIdToken(idToken: string): AppleIdTokenPayload {
  const parts = idToken.split('.')
  if (parts.length !== 3) {
    throw createError({ statusCode: 400, message: 'Invalid Apple ID token format' })
  }

  const payload = JSON.parse(
    new TextDecoder().decode(base64urlDecode(parts[1] as string)),
  ) as AppleIdTokenPayload

  // Basic validation
  if (payload.iss !== 'https://appleid.apple.com') {
    throw createError({ statusCode: 400, message: 'Invalid Apple ID token issuer' })
  }

  const config = useRuntimeConfig()
  if (payload.aud !== config.appleClientId) {
    throw createError({ statusCode: 400, message: 'Invalid Apple ID token audience' })
  }

  if (payload.exp < Math.floor(Date.now() / 1000)) {
    throw createError({ statusCode: 400, message: 'Apple ID token has expired' })
  }

  return payload
}

// ─── Auth URL Builder ──────────────────────────────────────

/**
 * Build the Apple authorization URL for the Sign-in redirect.
 */
export function buildAppleAuthUrl(redirectUri: string, state: string): string {
  const config = useRuntimeConfig()
  const params = new URLSearchParams({
    response_type: 'code',
    response_mode: 'form_post',
    client_id: config.appleClientId,
    redirect_uri: redirectUri,
    state,
    scope: 'name email',
  })
  return `https://appleid.apple.com/auth/authorize?${params.toString()}`
}
