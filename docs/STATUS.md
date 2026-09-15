# Build status vs. the Master Prompt "Definition of Done"

Last updated: 15 September 2026. Verified locally with `pnpm typecheck`, `pnpm lint`, `pnpm test`
(78 tests), `pnpm build`, an HTTP smoke test of 44 public routes + 26 admin routes, a full
credentials-login handshake, live POSTs to the enquiry/consultation/analytics APIs, and Playwright
screenshots at 1440px and 390px (no horizontal overflow, no console errors).

| Definition of done item | Status | Notes |
|---|---|---|
| Public website works | ✅ | 40+ routes, all 200; 404 page; sitemap + robots |
| Programme pages | ✅ | IFY + IYOne published (verified from NCUK); 4 bachelor routes seeded IN_REVIEW until SHV confirms |
| Pathway pages | ✅ | 5 published NCUK routes; BUV / Assumption routes IN_REVIEW |
| University directory | ✅ | NCUK network + 4 named institutions with verification badges |
| Destinations | ✅ | 9 countries; 5 verified (NCUK), 4 marked "verification pending" |
| Pathway Explorer | ✅ | URL-addressable, SVG route map, analytics events |
| Comparison | ✅ | `/compare?items=` up to 3 |
| Pathway Finder | ✅ | rule-based, labelled as guidance |
| Enquiry + Consultation | ✅ | Zod, honeypot, rate limit, audit, analytics, notify/CRM hooks |
| CMS | ✅ | 14 entity types, block builder, inline modules/steps |
| Media library | ✅ | upload (magic-number sniffed), focal point, consent + usage status |
| Documents | ✅ | model + admin; no documents uploaded yet (Resources shows empty state) |
| News, FAQ | ✅ | 1 verified article, 11 FAQs |
| SEO | ✅ | metadata everywhere; JSON-LD: EducationalOrganization, Course, Article, FAQPage, BreadcrumbList |
| Analytics | ✅ | first-party events + funnel dashboard |
| Admin, RBAC, audit, versioning, publishing workflow | ✅ | 6 roles, DRAFT→IN_REVIEW→APPROVED→PUBLISHED→ARCHIVED, revisions + rollback, scheduled publishAt |
| Security tests | ◐ | unit/API tests for RBAC, schemas, rate limit, auth guard; see docs/SECURITY.md for the deployment checklist |
| Responsive | ✅ | 390 / 768 / 1024 / 1440 checked; full nav at ≥1280, drawer below |
| Accessibility | ◐ | semantic landmarks, focus, labels, reduced motion; a full audit (axe/Lighthouse) still to run on staging |
| Performance | ◐ | 3D lazy-loaded with device gating; Lighthouse to be measured on a production host |
| Production build | ✅ | `next build` succeeds |

## What SHV must supply before launch
1. **Photography** — every `Plate` is a named placeholder. Upload real campus/student images in
   `/admin/media`, set alt text, usage APPROVED and consent GRANTED, then attach them to facilities,
   programmes and stories.
2. **Verification** — confirm and publish (or archive) the IN_REVIEW bachelor routes and the four
   PENDING destinations/universities. Public badges disappear when `verificationStatus = VERIFIED`.
3. **Contact** — an admissions email address, WhatsApp number, office hours, and a map embed in
   `/admin/settings`.
4. **Leadership** — biographies for the two published leaders; vision / mission / governance text.
5. **Legal** — review the draft privacy, cookies, terms and accessibility pages.
6. **Fees / documents** — upload the prospectus, entry-requirement sheets and calendars.

## Deployment
Switch Prisma to PostgreSQL, set the environment variables in `.env.example`, replace the in-memory
rate limiter with Redis, point media storage at S3-compatible storage, and run Lighthouse + an
accessibility audit on the staging URL.
