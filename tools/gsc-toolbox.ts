import { google } from 'googleapis'
import { writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import 'dotenv/config'

/**
 * GSC Toolbox: Programmatically manage Google Search Console properties.
 * 
 * Usage:
 * npx jiti scripts/gsc-toolbox.ts init <site_url>
 * npx jiti scripts/gsc-toolbox.ts verify <site_url>
 * npx jiti scripts/gsc-toolbox.ts submit <site_url>
 */

const siteUrl = process.argv[3] || process.env.SITE_URL
const serviceAccountJson = process.env.GSC_SERVICE_ACCOUNT_JSON

async function getAuth() {
  if (!serviceAccountJson) {
    throw new Error('GSC_SERVICE_ACCOUNT_JSON is not set')
  }
  let credentialsStr = serviceAccountJson.trim()
  if (!credentialsStr.startsWith('{')) {
    // Try base64 decoding
    credentialsStr = Buffer.from(credentialsStr, 'base64').toString('utf8')
  }
  const credentials = JSON.parse(credentialsStr)
  return new google.auth.GoogleAuth({
    credentials,
    scopes: [
      'https://www.googleapis.com/auth/webmasters',
      'https://www.googleapis.com/auth/siteverification'
    ],
  })
}

async function addSite(url: string) {
  const auth = await getAuth()
  const searchconsole = google.searchconsole({ version: 'v1', auth })
  console.log(`🚀 Registering ${url} in Search Console...`)
  await searchconsole.sites.add({ siteUrl: url })
  console.log('✅ Site registered.')
}

async function getVerificationToken(url: string) {
  const auth = await getAuth()
  const siteVerification = google.siteVerification({ version: 'v1', auth })
  
  console.log(`🔍 Getting verification token for ${url}...`)
  const response = await siteVerification.webResource.getToken({
    requestBody: {
      site: { identifier: url, type: 'SITE' },
      verificationMethod: 'FILE'
    }
  })
  
  return response.data.token
}

async function verifySite(url: string) {
  const auth = await getAuth()
  const siteVerification = google.siteVerification({ version: 'v1', auth })
  
  console.log(`🛡️  Verifying ownership of ${url}...`)
  await siteVerification.webResource.insert({
    verificationMethod: 'FILE',
    requestBody: {
      site: { identifier: url, type: 'SITE' }
    }
  })
  console.log('✅ Ownership verified.')
}

async function grantAccess(url: string, email: string) {
  const auth = await getAuth()
  const siteVerification = google.siteVerification({ version: 'v1', auth })
  
  console.log(`👤 Granting "Owner" access to ${email}...`)
  // First get current owners to avoid overwriting them
  const resource = await siteVerification.webResource.get({
    id: `http${url.includes('https') ? 's' : ''}://${url.replace(/^https?:\/\//, '')}`
  }).catch(() => null)

  const owners = resource?.data.owners || []
  if (!owners.includes(email)) {
    owners.push(email)
  }

  await siteVerification.webResource.update({
    id: url,
    requestBody: {
      site: { identifier: url, type: 'SITE' },
      owners: owners
    }
  })
  console.log('✅ Access granted. Property should now appear in your GSC dashboard.')
}

async function submitSitemap(url: string) {
  const auth = await getAuth()
  const searchconsole = google.searchconsole({ version: 'v1', auth })
  const sitemapUrl = `${url.endsWith('/') ? url : url + '/' }sitemap.xml`
  
  console.log(`🚀 Submitting sitemap: ${sitemapUrl}`)
  await searchconsole.sitemaps.submit({
    siteUrl: url,
    feedpath: sitemapUrl
  })
  console.log('✅ Sitemap submitted.')
}

async function main() {
  const cmd = process.argv[2]
  
  if (!siteUrl) {
    console.error('❌ SITE_URL is required.')
    process.exit(1)
  }

  try {
    switch (cmd) {
      case 'init':
        await addSite(siteUrl)
        const token = await getVerificationToken(siteUrl)
        if (token) {
          const fileName = token.split(': ')[0]?.replace('verification-file=', '').trim() || 'google-verification.html'
          const content = token.split(': ')[1] || token
          const publicDir = join(process.cwd(), 'public')
          if (!existsSync(publicDir)) mkdirSync(publicDir)
          const filePath = join(publicDir, fileName)
          writeFileSync(filePath, content)
          console.log(`💾 Verification file created: public/${fileName}`)
          console.log('👉 Deploy your app, then run: npm run gsc:verify')
        }
        break
      
      case 'verify':
        await verifySite(siteUrl)
        const userEmail = process.env.GSC_USER_EMAIL
        if (userEmail) {
          await grantAccess(siteUrl, userEmail)
        } else {
          console.log('⚠️  GSC_USER_EMAIL not set. Skipping automatic access grant.')
          console.log('👉 To see this property in your dashboard, add your email to .env and run: npm run gsc:verify')
        }
        break

      case 'submit':
        await submitSitemap(siteUrl)
        break

      default:
        console.log('Usage: npx jiti scripts/gsc-toolbox.ts [init|verify|submit]')
    }
  } catch (error: any) {
    console.error('❌ Error:', error.response?.data?.error?.message || error.message)
    process.exit(1)
  }
}

main()
