# SHV Digital Campus — Testing

## Run
```
export PATH="$HOME/.local/node/bin:$PATH"
pnpm test              # vitest run (CI mode)
pnpm test:watch        # watch mode
pnpm typecheck         # tsc --noEmit
pnpm lint              # eslint
pnpm check             # typecheck + lint + test + build
```
Config: `vitest.config.ts` (jsdom by default, `@` alias, globals on). Setup: `src/tests/setup.ts` adds
jest-dom matchers and neutralises the `server-only` guard so server modules can be imported in tests.
Files that exercise route handlers or pure server code start with `// @vitest-environment node`.

Test files live next to the code (`src/lib/*.test.ts`, `src/app/api/**/route.test.ts`) or under
`src/tests/` for shared helpers and component tests. No database is needed: API tests mock `@/lib/prisma`
with `src/tests/fake-prisma.ts` (in-memory delegates with `vi.fn` spies) and `@/lib/notify`.

## What is covered (78 tests, 12 files)

| Area | File | Asserts |
|---|---|---|
| RBAC | `src/lib/rbac.test.ts` | matrix per role, unknown/null roles, only SUPER_ADMIN manages users, `canTransitionTo` gates |
| Workflow enums | `src/lib/enums.test.ts` | `STATUS_TRANSITIONS` integrity, every status reachable from DRAFT, no DRAFT→PUBLISHED, labels complete, funnel events present |
| Rate limiting | `src/lib/rate-limit.test.ts` | limit then 429-style block with `retryAfterMs`, sliding window expiry, key isolation, `clientIp` header precedence |
| Utilities | `src/lib/utils.test.ts` | `parseJson` fallbacks, `splitList`, `toSlug`, `isPublished` incl. scheduled `publishAt`, `truncate`, `cn` |
| Lead schemas | `src/lib/schemas/enquiry.test.ts` | valid/invalid enquiry, form-string coercion, honeypot, unknown-key stripping, consultation date rules (today/future ok, past/malformed rejected), time slots, modes, campus time zone |
| Auth gating | `src/lib/auth.config.test.ts` | `authorized()`: `/admin` and `/api/admin` need a session, `/admin/login` and public paths open, JWT 8h |
| i18n | `src/lib/i18n.test.ts` | `t()` lookup + key fallback, interpolation, Translation-row overrides with English fallback, locale list, no empty strings |
| Notifications | `src/lib/notify.test.ts` | unconfigured → PII-free structured log; Resend-shaped payload + bearer; never throws on failure; CRM webhook shape and no-op |
| POST /api/enquiries | `src/app/api/enquiries/route.test.ts` | 422 field errors, 400 bad JSON, 200 silent honeypot, 201 with Enquiry/analytics/audit/notify/CRM calls, unpublished refs ignored, form-encoded + `type=visit`, no data echoed, 429 after 5/IP with `Retry-After`, lead kept when analytics/audit fail |
| POST /api/consultations | `src/app/api/consultations/route.test.ts` | 422 on booking fields, 200 honeypot, 201 creates Enquiry(CONSULTATION) + Consultation row, analytics props incl. pathway, PII-free audit, no echo, 429 |
| POST /api/analytics/events | `src/app/api/analytics/events/route.test.ts` | 204 + storage, `text/plain` sendBeacon bodies, 400 on unknown names/nested props/garbage/oversize, storage failure still 204, 60/min limit |
| `<EnquiryForm>` | `src/tests/enquiry-form.test.tsx` | labelled controls, option population and prefill, privacy link, WhatsApp link, hidden honeypot; empty submit → error summary + `aria-invalid` + focus on first invalid field, no fetch; blur validation; successful POST → `aria-live` success panel with reference; server 422 mapped to fields |

## Not covered yet (remaining work)
- **Public read APIs** (`/api/programmes` …): thin wrappers over `content.ts`; covered indirectly by typecheck. Add
  integration tests against a seeded SQLite DB (`pnpm db:reset` then hit handlers) to assert only PUBLISHED /
  PUBLIC / consent-GRANTED rows appear.
- **Admin APIs and CMS** (`/api/admin/**`, server actions): authorisation per entity, revision + rollback, status
  transitions, media upload validation. Owned by the admin workstream.
- **`<ConsultationForm>`** component test (shares `useLeadForm` and `LeadFields` with the enquiry form, which is tested).
- **E2E (Playwright)**: enquiry and consultation happy paths, honeypot, rate-limit banner, admin login → pipeline
  shows the new lead, keyboard-only form completion, reduced-motion.
- **Accessibility audit**: axe on `/consultation`, `/enquire`, programme and pathway pages; Lighthouse ≥ 95.
- **Security headers / CSP**: assert at the edge once configured (see `docs/SECURITY.md`).
- **Browser matrix**: Chrome, Safari (macOS + iOS especially — `<input type="date">` and `sendBeacon`), Firefox, Edge;
  desktop and mobile widths.
- **Load**: rate limiter behaviour behind a real proxy; Redis-backed limiter once deployed multi-instance.

## Conventions
- Mock at module boundaries (`@/lib/prisma`, `@/lib/notify`, `fetch`), not inside handlers.
- Never hit a real database or network in unit tests.
- Assert on behaviour visible to users or operators (status codes, stored rows, ARIA state), not on implementation
  details.
- When adding a public write endpoint, copy the five-case pattern: 422 · honeypot 200 · 201 with side effects ·
  429 · nothing echoed.
