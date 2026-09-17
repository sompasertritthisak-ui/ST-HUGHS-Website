# Deploying SHV Digital Campus

The code lives on GitHub (https://github.com/sompasertritthisak-ui/ST-HUGHS-Website). Vercel runs it.
Three external pieces are needed because Vercel's servers have no persistent disk:

| Piece | Service (free tier) | Why |
|---|---|---|
| Database | Neon PostgreSQL | programmes, pages, enquiries, users |
| File storage | Vercel Blob | photos, logos and PDFs uploaded through the CMS |
| Hosting | Vercel | runs the Next.js site, CMS and APIs |

## 1. Create the database (Neon)
1. Go to https://neon.tech and sign up (GitHub login works).
2. Create a project, name it `shv-website`, region Singapore (closest to Laos).
3. On the project dashboard click **Connect**, choose **Prisma** if offered, and copy the connection
   string. It starts with `postgresql://` and ends with `?sslmode=require`. Keep it for step 3.

## 2. Import the repository into Vercel
1. Go to https://vercel.com and sign up with your GitHub account.
2. Click **Add New… → Project**, find `ST-HUGHS-Website`, click **Import**. The repository's
   `vercel.json` already pins the functions to Singapore to sit next to the Neon database.
3. Leave Framework Preset = Next.js and Root Directory = `./`.
4. Open **Build and Output Settings** and set **Build Command** to:
   `pnpm vercel-build`
   (Install Command stays `pnpm install`.)
5. Do **not** click Deploy yet — add the environment variables first (step 3).

## 3. Environment variables (Vercel → Project → Settings → Environment Variables)
Add each of these for Production (and Preview if you like):

| Name | Value |
|---|---|
| `DATABASE_URL` | the Neon connection string from step 1 |
| `AUTH_SECRET` | a long random string — run `openssl rand -base64 32` in Terminal, or use any 40+ character password |
| `AUTH_TRUST_HOST` | `true` |
| `APPLICATION_URL` | `https://<your-project>.vercel.app` (update to `https://www.sthughs.edu.la` when the domain is connected) |
| `SEED_ADMIN_EMAIL` | the first admin's email, e.g. `admissions@sthughs.edu.la` |
| `SEED_ADMIN_PASSWORD` | a strong temporary password (change it after first login) |
| `SEED_ON_BUILD` | `true` — **first deploy only**, remove it afterwards |

Optional later: `EMAIL_API_KEY`, `ADMISSIONS_NOTIFY_EMAIL`, `CRM_WEBHOOK_URL`, `WHATSAPP_NUMBER`.

## 4. File storage (Vercel Blob)
1. In the Vercel project open the **Storage** tab, click **Create Database → Blob**, name it `shv-media`.
2. Connect it to the project. Vercel adds `BLOB_READ_WRITE_TOKEN` automatically. Uploads from the CMS
   now go to Blob; nothing else to configure.

## 5. Deploy
Click **Deploy** (or Deployments → Redeploy). The build runs `scripts/db-prepare.mjs`, which
creates the tables in Neon, seeds the verified content, then builds the site. Expect 3–4 minutes.

When it finishes:
1. Open the site URL. Check the homepage, a programme page and `/resources`.
2. Sign in at `/admin/login` with the seed admin, go to **Users**, and change the password.
3. In Vercel remove the `SEED_ON_BUILD` variable and redeploy once, so later builds never reset content.

## 6. Custom domain (required for visitors in Laos)
Do this before sharing the site. On 17 Sept 2026 we measured, from a Lao Telecom connection in
Vientiane, that HTTPS connections to any `*.vercel.app` name silently stall (the TCP connection
opens, the TLS handshake never completes), while the same Vercel edge servers answer instantly for
sites on their own domain. The filtering keys on the `vercel.app` name, so the fix is to serve the
site from the college's domain:

1. Vercel → Project → Settings → **Domains** → add `www.sthughs.edu.la` (and `sthughs.edu.la` if the
   registrar supports an ALIAS/ANAME or A record).
2. At the domain registrar add the record Vercel shows: `www` → CNAME `cname.vercel-dns.com`, and for
   the bare domain an A record to `76.76.21.21`.
3. Wait for Vercel to show a green tick (minutes to an hour). HTTPS is automatic.
4. Set `APPLICATION_URL=https://www.sthughs.edu.la` in Environments → Production and redeploy.

Until the domain is attached, staff on Lao networks can reach the `vercel.app` preview only through a
VPN or a mobile network that routes differently. This is a network issue, not an application error.

## 7. Function region
`vercel.json` pins server functions to Singapore (`sin1`) so every database query stays in the same
region as the Neon database created in step 1. If the Neon project was created elsewhere, change the
region in `vercel.json` to the matching Vercel region (or move the Neon project to Singapore); a
mismatch adds roughly a quarter of a second to every query and makes CMS actions feel sluggish.

## Troubleshooting
| Symptom | Likely cause | Check |
|---|---|---|
| Page never loads, spinner forever, "Application error: a client-side exception" | `*.vercel.app` blocked on the visitor's network (see step 6) | Open `https://www.vercel.com` (works) vs the site (stalls); a US uptime checker shows 200 |
| Buttons do nothing but the page is visible | JavaScript chunks failed to download over the stalled connection | Browser console shows `ChunkLoadError`; same fix as above |
| CMS form stuck on "Saving…/Creating…" | The form's request to the server never arrived (same network cause) or the database is unreachable | Vercel → Logs (Error level); Neon → Monitoring shows connections |
| First visit after a quiet hour takes 3–6 s | Vercel function cold start plus Neon compute wake-up on the free tiers | Later requests are fast; upgrade Neon to "always on" if needed |

## Every later update
Push to `main` on GitHub (or merge a pull request). Vercel builds and publishes automatically; each
pull request gets its own preview URL. The database is untouched by builds unless the schema changed,
in which case `prisma db push` adds the new tables/columns and fails loudly rather than dropping data.

## Local development
Unchanged: `pnpm dev` with the SQLite `dev.db`. The build script picks PostgreSQL only when
`DATABASE_URL` starts with `postgresql://`.
