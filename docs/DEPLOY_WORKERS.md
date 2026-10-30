# Deploying to Cloudflare Workers (workers.dev)

The site runs on Cloudflare Workers through OpenNext (`wrangler.jsonc`, `open-next.config.ts`). Cloudflare builds and
deploys it from GitHub on every push to `main`, the same way Railway did. The database stays on Neon and the enquiry
backup stays on Google Sheets; nothing about them changes.

The same repository serves the **draft** (a personal Cloudflare account, `shv-website.<your-subdomain>.workers.dev`) and,
later, **production** on the college account: per-account values live in the Cloudflare dashboard, never in the code
(`keep_vars` in `wrangler.jsonc` stops a deploy from wiping them).

## What it needs

| | Why |
| --- | --- |
| **Workers Paid plan** ($5/month) | The site is about 3.9 MB compressed; the free plan allows 3 MB. Paid allows 10 MB and includes Durable Objects. |
| **R2** (free tier is plenty) | Two buckets: `shv-next-cache` (page cache) and `shv-media` (CMS uploads). |
| Neon `DATABASE_URL` | The same database Railway uses. |

## One-time setup (about 20 minutes, all in the Cloudflare dashboard)

1. **Plan** — *Workers & Pages → Plans* → **Workers Paid**.
2. **R2 buckets** — *R2 Object Storage* → **Create bucket** twice, names exactly `shv-next-cache` and `shv-media`
   (location: Automatic). No public access is needed: the site serves uploads itself at `/files/uploads/…`.
3. **Import the repository** — *Workers & Pages → Create → Import a repository* → GitHub → `ST-HUGHS-Website`.
   - Project / Worker name: **`shv-website`** (must match `name` in `wrangler.jsonc`)
   - Production branch: `main`
   - Build command: `pnpm cf:build`
   - Deploy command: `pnpm exec opennextjs-cloudflare deploy`
   - Root directory: `/`
   - **Build variables** (*Advanced settings → Build variables*): `DATABASE_URL` = the Neon connection string,
     marked **Secret**. The build uses it to update the database tables, apply copy updates and pre-render pages.
4. Let the first build run (about 5–8 minutes). It deploys to `https://shv-website.<your-subdomain>.workers.dev`.
5. **Runtime variables** — *Workers & Pages → shv-website → Settings → Variables and Secrets* → **Add**:

   | Name | Type | Value |
   | --- | --- | --- |
   | `DATABASE_URL` | Secret | the Neon connection string |
   | `AUTH_SECRET` | Secret | a long random string (a new one just signs everyone out once) |
   | `SHEETS_WEBHOOK_URL` | Secret | the Apps Script web app URL (`…/exec`) |
   | `SHEETS_WEBHOOK_SECRET` | Secret | the same phrase as in Railway (the script holds its fingerprint) |
   | `APPLICATION_URL` | Text | `https://shv-website.<your-subdomain>.workers.dev` |
   | `EMAIL_FROM` | Text | as in Railway, if set |

   `AUTH_TRUST_HOST`, `NEXTJS_ENV` and `NEXT_PUBLIC_CF_IMAGE_TRANSFORMS` are already in `wrangler.jsonc`.
   Saving variables creates a new version; click **Deploy** if asked.
6. Open the workers.dev address, sign in to `/admin` with your usual account, and check **Settings → Integrations**
   shows the Sheets backup as *configured*.

After this, every push to `main` builds and deploys automatically. Build logs: *shv-website → Deployments*.

## Switching off Railway

Once the workers.dev site is checked: Railway → the project → **Settings → Delete service** (or let the trial lapse).
Nothing else points at Railway. `railway.json`, `scripts/start.mjs` and the `build:server` / `start:server` scripts
can then be removed.

## Good to know

- **Copy updates and schema changes** run during the build (`scripts/db-prepare.mjs`): `prisma db push`, then any
  pending `prisma/content-patches.json` version. Set `CONTENT_PATCHES=false` as a build variable to skip patches.
- **Images** are served as exported (Workers has no built-in optimiser). On a custom domain with Cloudflare Images
  transformations enabled, set `NEXT_PUBLIC_CF_IMAGE_TRANSFORMS=1` to resize and convert them at the edge.
- **Uploads** go to the `shv-media` bucket and are served by the site at `/files/uploads/<name>` (one origin, nothing
  else to keep reachable). To serve them from a bucket domain instead, set `MEDIA_PUBLIC_URL`.
- **Local check of the Workers build:** `pnpm exec opennextjs-cloudflare build && pnpm exec wrangler deploy --dry-run`
  prints the bundle size without deploying.
