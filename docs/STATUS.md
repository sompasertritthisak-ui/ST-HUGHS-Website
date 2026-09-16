# Build status vs. the Master Prompt "Definition of Done"

Last updated: 16 September 2026 (content seed rebuilt from SHV's six official 2026–27 programme decks). Verified locally with `pnpm typecheck`, `pnpm lint`, `pnpm test`
(78 tests), `pnpm build`, an HTTP smoke test of 44 public routes + 26 admin routes, a full
credentials-login handshake, live POSTs to the enquiry/consultation/analytics APIs, and Playwright
screenshots at 1440px and 390px (no horizontal overflow, no console errors).

| Definition of done item | Status | Notes |
|---|---|---|
| Public website works | ✅ | 40+ routes, all 200; 404 page; sitemap + robots |
| Programme pages | ✅ | 7 published, all VERIFIED from official decks: NCUK IFY (SHV 1+3 facts), NCUK IYOne, BUV 2+2 Hospitality, Assumption 1+3 Bachelor+Master (SIMBA), ESDES 1+3 International Business, Intensive English (LANGUAGE), BBA Entrepreneurship & Innovation Gen AI (SHV+NUOL). Generic placeholder routes removed. Fee estimates published under "Estimated cost of study 2026–27" with the decks' disclaimer |
| Pathway pages | ✅ | 10 published VERIFIED routes: 5 NCUK network routes + BUV 2+2, Assumption 1+3, ESDES 1+3, BBA (2+1+internship, NUOL) and Intensive English → IFY |
| University directory | ✅ | NCUK network + BUV, Assumption, ESDES (DIRECT_PARTNER, VERIFIED, logos attached), Nottingham (NCUK_NETWORK progression destination, VERIFIED) and NUOL (DIRECT_PARTNER, VERIFIED) |
| Destinations | ✅ | 10 destinations, all VERIFIED (France, Vietnam, Thailand, Malaysia from decks; Lao PDR added for the NUOL-awarded BBA) |
| Pathway Explorer | ✅ | URL-addressable, SVG route map, analytics events |
| Comparison | ✅ | `/compare?items=` up to 3 |
| Pathway Finder | ✅ | rule-based, labelled as guidance |
| Enquiry + Consultation | ✅ | Zod, honeypot, rate limit, audit, analytics, notify/CRM hooks |
| CMS | ✅ | 14 entity types, block builder, inline modules/steps |
| Media library | ✅ | upload (magic-number sniffed), focal point, consent + usage status; seeded with 4 partner/brand logos, 8 real photographs curated from the decks and 6 PDFs |
| Documents | ✅ | 6 official programme decks published as BROCHURE (v2026-27) in /public/documents — Resources is a working digital prospectus |
| News, FAQ | ✅ | 1 verified article + 1 DRAFT (Assumption partnership signing — date needed), 19 FAQs |
| SEO | ✅ | metadata everywhere; JSON-LD: EducationalOrganization, Course, Article, FAQPage, BreadcrumbList |
| Analytics | ✅ | first-party events + funnel dashboard |
| Admin, RBAC, audit, versioning, publishing workflow | ✅ | 6 roles, DRAFT→IN_REVIEW→APPROVED→PUBLISHED→ARCHIVED, revisions + rollback, scheduled publishAt |
| Security tests | ◐ | unit/API tests for RBAC, schemas, rate limit, auth guard; see docs/SECURITY.md for the deployment checklist |
| Responsive | ✅ | 390 / 768 / 1024 / 1440 checked; full nav at ≥1280, drawer below |
| Accessibility | ◐ | semantic landmarks, focus, labels, reduced motion; a full audit (axe/Lighthouse) still to run on staging |
| Performance | ◐ | 3D lazy-loaded with device gating; Lighthouse to be measured on a production host |
| Production build | ✅ | `next build` succeeds |

## What SHV must supply before launch
1. **Photography** — eight real photographs curated from the decks are seeded and attached (IFY,
   Intensive English, BUV, Assumption and ESDES programme heroes; France/Vietnam/Thailand destination
   heroes; entrance, classrooms and smart-classroom facilities). The two classroom photos show
   identifiable students and carry `consentStatus = PENDING` — record consent in `/admin/media`.
   The remaining facilities still use named `Plate` placeholders: the facilities photo folder shared on
   Google Drive was not publicly accessible, so those images could not be retrieved — upload them in
   `/admin/media`. The Language Centre logo and the ESDES/UCLy library photo are in the library but
   not attached.
2. **Verification** — BUV, Assumption University, ESDES and NUOL are now VERIFIED direct partners and
   France, Vietnam, Thailand and Malaysia are VERIFIED destinations (all sourced to deck pages in
   `sourceNote`). Nottingham is VERIFIED as an NCUK progression destination only. Still pending:
   B-YOU Education Center (IN_REVIEW), two DRAFT student stories (Vanhnaphone Bounnapol, "Namnueng")
   awaiting consent, and the DRAFT Assumption-signing news article awaiting its date. Facts the decks
   do not state were left empty: BBA-EI fees/entry requirements/confirmed intake (calendar is marked
   EXAMPLE), Assumption entry requirements and intake month, Intensive English start dates.
3. **Contact** — phone +856 20 58 814 648, admissions@sthughs.edu.la and the Xaysetha District address
   are seeded from the decks; WhatsApp number, office hours and a map embed still to add in
   `/admin/settings`.
4. **Leadership** — biographies for the two published leaders; vision / mission / governance text.
5. **Legal** — review the draft privacy, cookies, terms and accessibility pages.
6. **Fees / documents** — the six programme decks are published; add entry-requirement sheets, the
   confirmed fee schedule (tuition / application / registration / uniform amounts) and calendars.

## Deployment
Switch Prisma to PostgreSQL, set the environment variables in `.env.example`, replace the in-memory
rate limiter with Redis, point media storage at S3-compatible storage, and run Lighthouse + an
accessibility audit on the staging URL.


## Brand and homepage upgrades — 16 September 2026
- Palette switched to the SHV brand guideline (deep blue · red · white) sampled from the official logo; official lockup and mark in `public/brand/`.
- Homepage: interactive WebGL dotted globe (drag, hover labels, click-through to destinations, travelling route packets; SVG fallback for reduced-motion/mobile), "Life at SHV" real-photo mosaic (media tagged `homepage-life`), tabbed programme showcase with photos and auto-advance, "The route so far" timeline (SiteSetting `milestones`), drag-to-scroll campus strip with photographed spaces first, linked destinations in the statement, interactive explorer chain, alternating blue/white bands.
- Content: all six official programme decks folded into programmes, pathways, universities, destinations, FAQs and downloadable brochures; eight real photographs curated from the decks and Drive (AI/stock composites excluded).
- Still needed from SHV: the Drive `FACILITIES`, `Graduates` and `STUDENTS VIDEOS` folders are not publicly shared (anonymous access returns 404) — share them "anyone with the link" or upload through `/admin/media`; consent confirmation for student photos/stories; date for the Assumption signing article; `milestones` editing is via the database/seed until a settings tab is added.
