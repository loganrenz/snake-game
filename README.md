# Nuxt 4 Template

A clean, minimal starter template for Nuxt 4, Nuxt UI v4, Tailwind CSS 4, and TypeScript.

## What's included

- **Nuxt 4** - The latest evolution of the Nuxt framework.
- **Nuxt UI v4** - A collection of high-quality components for building beautiful interfaces.
- **Tailwind CSS 4** - The next generation of utility-first CSS.
- **TypeScript** - Full type safety out of the box.
- **Cloudflare D1** - Queryable SQLite database on the edge.
- **Authentication** - Complete system with email/password and Sign in with Apple.
- **PostHog** - Privacy-first product analytics with manual pageview tracking.
- **SEO Ready** - Built-in Sitemap, Robots.txt, and automated GSC submission.

## Quick Start

1. **Use this template** to create a new repository.
2. **Clone** your new repository:
   ```bash
   git clone <your-repo-url>
   cd nuxt-v4-template
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Start development server**:
   ```bash
   npm run dev
   ```

### Deployment (Cloudflare Pages)

The template is pre-configured for Cloudflare Pages with D1.

1. Create a D1 database: `npx wrangler d1 create <db-name>`
2. Update `wrangler.json` with your `database_id`.
3. Deploy: `npm run deploy`

### Authentication

Includes email/password hashing (Web Crypto) and Apple Sign-In.

- **Apple Sign-In**: Requires Apple Developer account. Set `APPLE_TEAM_ID`, `APPLE_CLIENT_ID`, `APPLE_KEY_ID`, and `APPLE_SECRET_KEY`.
- **Database**: Run migrations using `npx drizzle-kit push`.

### Analytics (PostHog)

1. Set `POSTHOG_PUBLIC_KEY` and `POSTHOG_HOST` in `.env`.
2. Manual pageviews are automatically captured via the `posthog.client.ts` plugin.

### SEO & Google Search Console

- **Sitemap**: Automatically generated at `/sitemap.xml` via `@nuxtjs/sitemap`.
- **GSC Management**: The template includes a powerful toolbox for automated property management:
  1. **Initialize Property**: Register the site and generate the verification file.
     ```bash
     npm run gsc:init
     ```
  2. **Verify Ownership**: After deploying the verification file, confirm ownership.
     ```bash
     npm run gsc:verify
     ```
  3. **Submit Sitemap**: Programmatically notify Google of your sitemap.
     ```bash
     npm run sitemap:submit
     ```
     Requires `SITE_URL` and `GSC_SERVICE_ACCOUNT_JSON`.

## Customization

### Colors

Primary and neutral colors can be configured in `app/app.config.ts`. By default, it uses `green` as primary and `slate` as neutral.

### Fonts

Global styles and custom font imports are located in `app/assets/css/main.css`. The template includes `@nuxt/fonts` for easy font management.
