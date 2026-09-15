# Deploying SHV Digital Campus from GitHub

## 1. Push
```bash
git remote add origin git@github.com:<your-org>/shv-digital-campus.git
git push -u origin main
```
CI (`.github/workflows/ci.yml`) runs typecheck, lint, tests and a production build on every push.

## 2. Database (production)
Provision PostgreSQL (Neon, Supabase, Railway, RDS…). In `prisma/schema.prisma` change
`provider = "sqlite"` to `provider = "postgresql"`, then:
```bash
pnpm exec prisma migrate dev --name init   # creates prisma/migrations locally
git add prisma/migrations && git commit -m "Add initial migration"
```
On the host run `pnpm exec prisma migrate deploy` and `pnpm db:seed` once.

## 3. Host
**Vercel (recommended for Next.js):** import the GitHub repo, framework preset Next.js, build
command `pnpm build`, install command `pnpm install`. Add the environment variables from
`.env.example` (at minimum `DATABASE_URL`, `AUTH_SECRET`, `APPLICATION_URL`, `AUTH_TRUST_HOST=true`,
`SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`). Media uploads need S3-compatible storage on Vercel
(set the `STORAGE_*` variables and swap the disk adapter in `src/app/api/admin/media/route.ts`);
on a VPS/Docker host the local `public/uploads` directory works as-is with a persistent volume.

**Docker / VPS:** `pnpm install && pnpm build && pnpm start` behind a reverse proxy with HTTPS.

## 4. After first deploy
1. Sign in at `/admin/login` with the seed admin and change the password in `/admin/users`.
2. Fill `/admin/settings` (contact, messaging, institution).
3. Upload photography in `/admin/media`, approve usage/consent, attach to facilities and programmes.
4. Review the IN_REVIEW routes and PENDING partners; publish or archive.
5. Run Lighthouse and an accessibility audit against the live URL.
