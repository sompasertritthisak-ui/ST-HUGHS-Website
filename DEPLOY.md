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
2. Click **Add New… → Project**, find `ST-HUGHS-Website`, click **Import**.
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

## 6. Custom domain
Vercel → Project → Settings → Domains → add `www.sthughs.edu.la` and follow the DNS record it shows
(a CNAME at your domain registrar). HTTPS is automatic. Update `APPLICATION_URL` to match and redeploy.

## Every later update
Push to `main` on GitHub (or merge a pull request). Vercel builds and publishes automatically; each
pull request gets its own preview URL. The database is untouched by builds unless the schema changed,
in which case `prisma db push` adds the new tables/columns and fails loudly rather than dropping data.

## Local development
Unchanged: `pnpm dev` with the SQLite `dev.db`. The build script picks PostgreSQL only when
`DATABASE_URL` starts with `postgresql://`.
