# Agent instructions: new app from nuxt-v4-template

**When you are in a new app directory that was created from the nuxt-v4-template**, follow this exactly.

## 1. Confirm context

- This repo is a **new app** (copy or clone of nuxt-v4-template), not the template itself.
- You are expected to **set up this app** so it runs and deploys with its own name, URL, Doppler project, D1, and Pages.

## 2. Get these variables

Ask the user (or use env) for:

- **APP_NAME** – Slug for the app, e.g. `my-app` (lowercase, hyphens only). Used for package name, Doppler project, Pages project, D1 DB name.
- **SITE_URL** – Full public URL, e.g. `https://my-app.pages.dev`.

If the user already gave an app name or URL, derive the other if needed (e.g. `SITE_URL` = `https://<APP_NAME>.pages.dev`).

## 3. Run the setup script

From the **repo root** of this new app:

```bash
npm run setup:new-app -- <APP_NAME> <SITE_URL>
```

Or: `node scripts/setup-new-app.mjs <APP_NAME> <SITE_URL>`.

Example:

```bash
npm run setup:new-app -- simple-game-3 https://simple-game-3.pages.dev
```

Do **not** replace placeholders with example values in the command you run; use the actual APP_NAME and SITE_URL.

## 4. After the script succeeds

Tell the user to run:

1. **Deploy**
   ```bash
   doppler run -- npm run deploy
   ```

2. **GSC verify** (use the same SITE_URL as in step 3)
   ```bash
   SITE_URL=<SITE_URL> doppler run --project nuxt_template --config base -- npm run setup:gsc:verify
   ```

## 5. If the user needs more detail

Point them to **SETUP.md** in this repo for full prerequisites, manual steps, and day-to-day commands.

## Summary

1. Get **APP_NAME** and **SITE_URL**.
2. Run: `node scripts/setup-new-app.mjs <APP_NAME> <SITE_URL>`.
3. User runs: `doppler run -- npm run deploy`, then the `SITE_URL=... doppler run --project nuxt_template ... setup:gsc:verify` command.

No .env is used; all secrets are in Doppler (shared nuxt_template for setup, per-app Doppler for the app’s own SITE_URL and GA_MEASUREMENT_ID).
