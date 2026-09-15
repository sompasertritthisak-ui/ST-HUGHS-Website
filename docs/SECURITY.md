# SHV Digital Campus — Security

Threat-model checklist mapped to the brief's security and testing lists. "In code" says where the
control lives today; "Deployment" says what must be true in production and is **not** enforced by
the repository.

## Principles
- Public site reads only PUBLISHED content through `src/lib/content.ts`; nothing else reaches the browser.
- Every write is validated with Zod and (for admin) authorised with `can()` on the server. Public writes
  are rate-limited, honeypot-guarded and never echo submitted data.
- Personal data is minimised: audit rows for leads hold structural fields only, analytics never stores
  names/emails, notifications are best-effort and logged without PII when unconfigured.

## Checklist

| Threat | In code | Deployment / remaining |
|---|---|---|
| **IDOR** (reading/altering another record by id) | Public read APIs (`src/app/api/*`) accept only slugs and return published rows via `content.ts`; a missing or unpublished slug is a uniform 404 (`itemResponse`). Public writes never accept ids — `programmeSlug`/`destinationSlug`/`utmCampaign` are resolved server-side and unknown or unpublished references are dropped (`src/app/api/_lib/lead.ts → resolveReferences`). Responses contain only `{ ok, id }`. Admin routes (`/api/admin/**`, owned elsewhere) must check `can()` per entity. | Keep admin ids opaque (cuid). Review any new admin endpoint for ownership checks on `enquiries.*` and `content.*`. |
| **XSS** | React escapes output by default. Markdown renders through `react-markdown` (no raw HTML). Notification email HTML is escaped (`notify.ts → escapeHtml`). Forms never `dangerouslySetInnerHTML`. Query params in read APIs are validated against enums (`NewsCategorySchema`, `FaqCategorySchema`, …) and length-capped (`queryParam`). | Add a Content-Security-Policy header (`script-src 'self'`; allow `wa.me` links only as navigation). Set `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`. |
| **CSRF** | Auth.js v5 issues a CSRF token for credential sign-in and uses `SameSite=Lax` cookies. Public write APIs are unauthenticated JSON endpoints — no session is involved, so a cross-site POST gains nothing (state change is a new lead, bounded by rate limit + honeypot). Admin mutations are cookie-authenticated and must be server actions or `POST` handlers that rely on Auth.js' same-site cookies. | Serve over HTTPS so `__Secure-` / `__Host-` cookie prefixes apply. Consider `Origin`/`Sec-Fetch-Site` checks on `/api/admin/**` as belt-and-braces. |
| **SQL injection** | Prisma parameterised queries only; no raw SQL anywhere. Filters are typed (`where: { slug }`). | Use a least-privilege Postgres role (no DDL) for the app user. |
| **Auth bypass** | `src/middleware.ts` runs Auth.js `authorized()` for `/admin/:path*` and `/api/admin/:path*`; `/admin/login` is the only public admin path (tested in `src/lib/auth.config.test.ts`). Credentials are checked with bcrypt (cost 12), inactive users rejected, failed logins audited. | Set a strong `AUTH_SECRET`; rotate on staff departure. Enforce MFA/SSO via `OAUTH_*` when the organisation is ready. |
| **Authz bypass** | Role → permission matrix in `src/lib/rbac.ts`; workflow gates in `canTransitionTo()`; `STATUS_TRANSITIONS` prevents DRAFT → PUBLISHED. Public forms cannot set `status`, `assignedToId`, `campaignId`, `type=CONSULTATION` (Zod strips unknown keys; `PublicEnquiryTypeSchema` excludes CONSULTATION) — tested in `src/lib/schemas/enquiry.test.ts`. | Every new admin route must call `can(role, permission)`; add a lint rule or review checklist item. |
| **File uploads** | `/api/admin/media` (owned elsewhere) must whitelist MIME types, cap size, randomise filenames and store outside the web root / in object storage. Public APIs accept no files (`readBody` ignores non-string form parts). | Scan uploads (ClamAV or provider) and serve from a separate origin/CDN with `Content-Disposition` for documents. |
| **Session manipulation** | JWT strategy, 8h max age (`auth.config.ts`); role and uid are copied from the DB user at sign-in and re-read from the token, never from the client. | Cookies `Secure`, `HttpOnly` (Auth.js default) require HTTPS. Shorten `maxAge` for admissions staff on shared devices if needed. |
| **Rate limit bypass** | `src/lib/rate-limit.ts` sliding window keyed on the first `X-Forwarded-For` hop. Leads: 5/hour/IP shared across `/api/enquiries` and `/api/consultations` (`enquiry:<ip>` key). Analytics: 60/minute/IP. 429 + `Retry-After`. Bodies capped (64KB leads, 8KB analytics). | The store is in-memory per instance — for multi-instance/serverless deployments swap to Redis/Upstash behind the same `rateLimit()` signature. Terminate TLS on a trusted proxy so `X-Forwarded-For` cannot be spoofed by clients (strip inbound XFF at the edge). Add a WAF/bot rule for the two write endpoints. |
| **Privilege escalation** | Only `SUPER_ADMIN` holds `users.manage` (tested). Role changes are admin-only mutations that must be audited (`recordAudit`). Public inputs cannot reference users. | Seed admin password must be changed on first login (`SEED_ADMIN_PASSWORD`); disable demo users in production. |
| **Sensitive data exposure** | Public API envelope is built exclusively from `content.ts` (PUBLISHED + `visibility: PUBLIC` + `consentStatus: GRANTED` for stories). Write APIs return `{ ok, id }` only; validation errors echo messages, never values (tested "never echoes"). Audit `afterJson` for leads excludes name/email/phone/message. Analytics props hold slugs only. `notify.ts` logs an id-only line when email is unconfigured. Secrets come from env (`.env.example` lists them, `.env` is git-ignored). | Postgres with encryption at rest; restrict DB network access. Keep `EMAIL_API_KEY`, `CRM_API_KEY`, `AUTH_SECRET` in the platform secret store. Define a retention policy for `Enquiry`/`AnalyticsEvent` (privacy page is a CMS draft — SHV must approve). Never enable Prisma query logging in production. |
| **Bots / spam** (not in the brief's list but relevant to leads) | Honeypot field `website` → quiet `200 { ok: true }`, nothing stored (`isHoneypotTripped`). Zod also rejects it if it ever reaches validation. | Optional: add a privacy-preserving challenge (e.g. Turnstile) if spam volume warrants it; keep the honeypot. |

## Headers & transport (deployment)
Set at the edge or in `next.config.ts` (owned by the platform owner):
`Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`,
`Content-Security-Policy` (default-src 'self'; img-src 'self' data: <storage-cdn>; frame-ancestors 'none'),
`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
`Permissions-Policy: camera=(), microphone=(), geolocation=()`.
Public read APIs send `Cache-Control: public, s-maxage=300, stale-while-revalidate=600`; write APIs send `no-store`.

## Integrations
- **Email** (`notify.ts`): outbound only, bearer-authenticated, 5s timeout, never throws. Payload documented in the file.
- **CRM webhook** (`forwardToCrm`): outbound JSON `{ event: "enquiry.created", sentAt, enquiry }` with optional bearer. The receiving system must be trusted with lead PII — agree a DPA before enabling `CRM_WEBHOOK_URL`.
- **WhatsApp**: link-out only (`wa.me/<digits>`); no inbound webhook exists yet.

## Verification
`pnpm test` covers RBAC, workflow, rate limiting, schemas, auth gating, and the three public write handlers
(422/200-honeypot/201/429/no-echo). See `docs/TESTING.md` for what remains (E2E, headers, upload handling).
