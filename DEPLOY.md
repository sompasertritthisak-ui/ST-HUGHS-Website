# Deploying SHV Digital Campus (Cloudflare Workers)

The site runs on **Cloudflare Workers** through the OpenNext adapter and is built automatically from
GitHub. This guide is for the person with access to the college's Cloudflare account (the IT
director) and for whoever maintains the code. No terminal is needed on the Cloudflare side.

| Part | Service | Why |
|---|---|---|
| Web app, CMS, APIs | Cloudflare Workers (Paid plan, USD 5/month) | Reachable from Lao networks; the college's DNS is already on Cloudflare |
| Database | Neon PostgreSQL, region Singapore (free tier) | Serverless Postgres, closest region to Laos |
| Uploaded media | Cloudflare R2 bucket `shv-media` (free tier) | Object storage served from `media.sthughs.edu.la` |
| Page cache | Cloudflare R2 bucket `shv-next-cache` + Durable Objects | Incremental static regeneration and instant refresh after publishing |
| Source code | GitHub `sompasertritthisak-ui/ST-HUGHS-Website` | Every push to `main` deploys |

Why not Vercel: on 17 Sept 2026 we measured from Vientiane (Lao Telecom) that HTTPS to any
`*.vercel.app` name stalls during the TLS handshake, while Cloudflare answers in under 0.1 s.

## 1. Database (Neon)
Already created for the earlier Vercel attempt; reuse it. If starting fresh:
1. https://neon.tech → New project → name `shv-website`, region **Singapore**.
2. Dashboard → **Connect** → copy the **pooled** connection string (host contains `-pooler`).
   It starts with `postgresql://` and ends with `?sslmode=require`. Treat it as a password.

## 2. Cloudflare account prerequisites (IT director)
1. Dashboard → **Workers & Pages → Plans** → enable **Workers Paid**. The free plan's 3 MB bundle
   and 10 ms CPU limits are too small for a Next.js app with a database and password login.
2. **R2 Object Storage → Create bucket** `shv-media`. Then bucket → **Settings → Custom Domains →
   Connect domain** `media.sthughs.edu.la` (Cloudflare adds the DNS record itself). Create a second
   bucket `shv-next-cache` with no public access.
3. Optional, for automatic image resizing: **Images → Transformations** → enable for the zone
   `sthughs.edu.la`, then set `NEXT_PUBLIC_CF_IMAGE_TRANSFORMS` to `"1"` in `wrangler.jsonc`.

## 3. Create the Worker from GitHub
1. **Workers & Pages → Create → Import a repository** and authorise Cloudflare's GitHub app for
   `ST-HUGHS-Website`. The app only reads the repository; no personal tokens are involved.
2. Build settings:
   - Worker name: `shv-website` (must match `name` in `wrangler.jsonc`)
   - Build command: `pnpm cf:build`
   - Deploy command: `pnpm exec opennextjs-cloudflare deploy`
   - Root directory: `/`
3. **Build variables** (used while building: schema push and page pre-rendering):
   `DATABASE_URL`, `AUTH_SECRET`, `APPLICATION_URL=https://www.sthughs.edu.la`,
   `MEDIA_PUBLIC_URL=https://media.sthughs.edu.la`. For the very first build only, also
   `SEED_ON_BUILD=true`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` (skip these if the Neon database
   already holds the content from the Vercel deployment).
4. **Save and Deploy**. The first build takes 4–6 minutes. The R2 and Durable Object bindings are
   created from `wrangler.jsonc` on the first deploy.

## 4. Runtime variables and secrets
Worker → **Settings → Variables and Secrets** → add as **Secret**:

| Name | Value |
|---|---|
| `DATABASE_URL` | the Neon pooled connection string |
| `AUTH_SECRET` | 32+ random characters (`openssl rand -base64 32`) |

Plain variables (`APPLICATION_URL`, `MEDIA_PUBLIC_URL`, `AUTH_TRUST_HOST`,
`NEXT_PUBLIC_CF_IMAGE_TRANSFORMS`) are preset in `wrangler.jsonc`; change them in the file so the
repository and the dashboard never disagree. Optional: `EMAIL_API_KEY`, `ADMISSIONS_NOTIFY_EMAIL`,
`CRM_WEBHOOK_URL` (see `docs/CRM_INTEGRATION.md`).

After the first successful build, **remove `SEED_ON_BUILD`** from the build variables. The seed
resets navigation, pathways and FAQs to the seed content on every build while it is set.

## 5. Domain
Worker → **Settings → Domains & Routes → Add → Custom domain** → `www.sthughs.edu.la`.
Because the zone is already on Cloudflare, the DNS record and certificate are created automatically
and the old `www` record is replaced. To preview before replacing the current site, add
`new.sthughs.edu.la` first and switch later. Keep `APPLICATION_URL` equal to the public address (it
drives absolute links, the sitemap and login redirects).

Disable the `*.workers.dev` preview address (Settings → Domains & Routes) once the domain works.

## 6. First login
Open `https://www.sthughs.edu.la/admin/login`, sign in with the seed admin, go to **Users**, change
the password and create accounts for the team.

## Every later update
Push to `main` on GitHub. Workers Builds runs `pnpm cf:build` (Prisma `db push` adds new tables or
columns and refuses destructive changes, then builds) and deploys. Pull requests get preview builds.

## Local development
Unchanged: `pnpm dev` with SQLite. To run the real Worker locally: copy `.dev.vars.example` to
`.dev.vars`, fill in a Postgres `DATABASE_URL`, then `pnpm cf:build && pnpm cf:preview`.

## Troubleshooting
| Symptom | Likely cause | Check |
|---|---|---|
| Build fails with "Timed out fetching a new connection from the connection pool" | Neon asleep or its connection budget exhausted during pre-render | Retry the build; confirm the pooled (`-pooler`) URL is used |
| Build fails with "Worker size exceeds limit" | Free plan (3 MB) instead of Paid (10 MB) | Step 2.1 |
| Uploads fail with "MEDIA_PUBLIC_URL is not set" | Bucket domain not connected or variable missing | Step 2.2 and `wrangler.jsonc` vars |
| Pages 500 with "Cannot perform I/O on behalf of a different request" | A database client was shared across requests | `src/lib/prisma.ts` creates one client per request on Workers; check recent changes |
| Publishing in the CMS does not refresh the public page | Tag cache / queue bindings missing | Worker → Settings → Bindings shows two Durable Objects and two R2 buckets |
| First visit after a quiet hour takes 3–6 s | Neon compute wake-up on the free tier | Later requests are fast; Neon → Compute → disable auto-suspend if needed |
