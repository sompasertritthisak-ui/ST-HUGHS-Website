# St Hugh's College Vientiane — Digital Campus

Production-grade public website + CMS for St Hugh's College Vientiane (SHV), an NCUK Study Centre
in Lao PDR. Built from `St_Hughs_College_Ultimate_Master_Prompt.txt`.

**Read first:** `docs/DESIGN_SYSTEM.md` (creative direction + tokens), `docs/ARCHITECTURE.md`
(conventions, routes, rules), `docs/CMS_GUIDE.md` (for staff), `docs/SECURITY.md`, `docs/TESTING.md`.

## Quick start

```bash
export PATH="$HOME/.local/node/bin:$PATH"   # Node 22 is installed user-locally on this Mac
pnpm install
cp .env.example .env                        # then set AUTH_SECRET (openssl rand -base64 32)
pnpm db:reset                               # creates dev.db and seeds verified content
pnpm dev                                    # http://localhost:3000  ·  CMS at /admin
```

Seeded staff logins (change on first login): see the `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`
values in `.env`; demo role accounts `content@`, `editor@`, `admissions@`, `marketing@` share the
same password.

## Scripts
| Command | Purpose |
|---|---|
| `pnpm dev` | Turbopack dev server |
| `pnpm typecheck` / `pnpm lint` / `pnpm test` | quality gates |
| `pnpm build` / `pnpm start` | production |
| `pnpm db:push` / `pnpm db:seed` / `pnpm db:reset` | schema + seed |
| `pnpm check` | typecheck + lint + test + build |

## Content rule
Nothing on the public site is invented. Every partner, programme, destination and metric carries a
`verificationStatus` and `sourceNote`. Unverified items stay `IN_REVIEW` (hidden) or show a
"Verification pending" badge until SHV approves them in the CMS. Statistics render as "—" until a
verified value is entered.

## Production notes
- Do not run `pnpm build` while `pnpm dev` is running: Next 15.5 shares the `.next` directory and the
  build removes the dev server's static manifests (restart `pnpm dev` if that happens).
- Switch `prisma/schema.prisma` datasource to `postgresql` and set `DATABASE_URL`; run
  `prisma migrate deploy`.
- Media uploads write to `public/uploads` locally; set the `STORAGE_*` variables and swap the
  storage adapter in `src/app/api/admin/media` for S3-compatible storage + CDN.
- Replace the in-memory rate limiter with Redis for multi-instance deployments.
- Configure `EMAIL_API_KEY`, `ADMISSIONS_NOTIFY_EMAIL`, `CRM_WEBHOOK_URL` to activate
  notifications and CRM forwarding (see `docs/CRM_INTEGRATION.md`).
