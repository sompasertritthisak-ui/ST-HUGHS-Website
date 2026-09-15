# SHV Digital Campus — Architecture & Conventions

Stack: Next.js 15 (App Router, Turbopack), React 19, TypeScript strict, Tailwind v4 (tokens in
`src/app/globals.css`), Prisma 6 (SQLite dev → PostgreSQL prod), Auth.js v5 (credentials, JWT),
Zod 4, motion (Framer Motion), GSAP, three / @react-three/fiber / drei, lucide-react, react-markdown,
Vitest.

Package manager: pnpm. Node is at `~/.local/node/bin` (prepend to PATH).

## Directory map
```
prisma/schema.prisma        data model (strings for enums; *Json string columns)
prisma/seed.ts              verified content only — see header comment for sources
src/app/layout.tsx          root: fonts + metadata
src/app/(site)/             PUBLIC SITE (dark theme). layout has header/footer/progress line.
src/app/admin/              CMS (wrap in <div className="theme-light">). /admin/login is public.
src/app/api/                route handlers. /api/admin/* requires session (middleware) + can().
src/lib/prisma.ts           client singleton
src/lib/enums.ts            Zod enums + labels (Role, ContentStatus, VerificationStatus, …)
src/lib/rbac.ts             can(role, permission), canTransitionTo(role, status)
src/lib/auth.ts             NextAuth handlers, auth(), currentUser()
src/lib/auth.config.ts      edge-safe config used by src/middleware.ts
src/lib/content.ts          PUBLIC read layer — PUBLISHED content only. Use this in (site) pages.
src/lib/audit.ts            recordAudit(), createRevision(), listRevisions(), toWritableSnapshot()
src/lib/analytics.ts        server trackEvent(); src/lib/analytics-client.ts client track()
src/lib/rate-limit.ts       rateLimit(key, limit, windowMs), clientIp(headers)
src/lib/utils.ts            cn, toSlug, parseJson, formatDate, splitList
src/components/ui/          primitives: Button, Eyebrow, SectionHeading, RouteLine, Node, Plate,
                            Stat, Badge, VerificationBadge/StatusBadge, Reveal, Accordion,
                            Markdown, Field/Input/Select/Textarea/Checkbox, EmptyState
src/components/site/        header-nav, footer, logo, progress-line, page-view-tracker
src/components/sections/    homepage + page sections (server components unless interactive)
src/components/explorer/    Pathway Explorer, destination map, comparison, finder (client)
src/components/admin/       CMS shell + form components
src/components/forms/       public forms (enquiry, consultation)
docs/DESIGN_SYSTEM.md       design tokens, voice, anti-patterns — READ FIRST
```

## Rules
1. **No hardcoded content.** Programmes, pathways, universities, destinations, nav, contact,
   messaging all come from Prisma via `src/lib/content.ts` (public) or Prisma (admin). Copy that
   is truly structural (button labels, form labels) may be literal for now but must go through
   `t()` in `src/lib/i18n.ts` when it exists — do not build a second i18n system.
2. **Never invent facts.** No statistics, rankings, fees, partners, guarantees. If data is missing,
   render the empty/pending state (`Stat` does this; `Plate` renders a named photography plate).
3. **Semantic tokens only** (`bg-bg`, `text-fg`, `text-fg-muted`, `border-line`, `bg-gold`,
   `text-gold-soft`, `bg-route`). Never raw hex or Tailwind default colours (`slate-500`, etc.).
4. **Server components by default.** `"use client"` only for interactivity. Heavy 3D via
   `next/dynamic` with `ssr:false` and a static fallback. Respect `prefers-reduced-motion`.
5. **Every mutation is validated with Zod and authorised with `can()` on the server.** Route
   handlers and server actions both. Log with `recordAudit()`; snapshot with `createRevision()`
   before update; enforce `STATUS_TRANSITIONS` + `canTransitionTo()` for workflow.
6. **Public routes** (App Router, under `(site)`):
   `/`, `/about`, `/why-st-hughs`, `/programmes`, `/programmes/[slug]`, `/pathways`,
   `/pathways/[slug]`, `/pathway-explorer`, `/compare`, `/pathway-finder`, `/universities`,
   `/universities/[slug]`, `/destinations`, `/destinations/[slug]`, `/student-life`, `/campus`,
   `/careers`, `/admissions`, `/international-students`, `/news`, `/news/[slug]`, `/resources`,
   `/faqs`, `/contact`, `/consultation`, `/enquire`, `/student-stories`, `/student-stories/[slug]`,
   `/for/students|parents|partners|employers`, `/[slug]` (block pages: privacy, cookies, terms,
   accessibility and any CMS page).
7. **Admin routes**: `/admin` (dashboard), `/admin/login`, `/admin/<entity>` list,
   `/admin/<entity>/new`, `/admin/<entity>/[id]` edit with workflow + revisions + audit tab,
   `/admin/media`, `/admin/enquiries` (pipeline), `/admin/enquiries/[id]`, `/admin/analytics`,
   `/admin/users`, `/admin/settings`, `/admin/navigation`, `/admin/audit`.
8. **API**: `/api/auth/[...nextauth]`, `/api/analytics/events` (POST, rate-limited),
   `/api/enquiries` (POST), `/api/consultations` (POST), public read `/api/programmes`,
   `/api/pathways`, `/api/universities`, `/api/destinations`, `/api/partners`, `/api/student-stories`,
   `/api/facilities`, `/api/news`, `/api/events`, `/api/faqs`, `/api/documents`; admin
   `/api/admin/media` (upload), `/api/admin/analytics`, `/api/admin/content/[entity]/[id]/status`,
   `/api/admin/content/[entity]/[id]/revisions` (+ rollback), `/api/admin/users`.
9. **Every page exports `metadata`/`generateMetadata`** with title + description; detail pages add
   JSON-LD (`EducationalOrganization`, `Course`, `Article`, `FAQPage`, `BreadcrumbList`).
10. **Accessibility floor**: semantic landmarks, one `h1`, labelled controls, focus visible,
    44px touch targets, no colour-only meaning, `aria-live` on form results.

## Data shapes worth knowing
- `Programme.subjectRoutesJson`, `intakesJson`: `string[]` JSON. Use `parseStringArray`.
- `ContentBlock.dataJson` per type — see `src/lib/blocks.ts` (schemas) once created.
- `SiteSetting.valueJson`: `contact`, `messaging`, `institution` (schemas in `content.ts`).
- Pathway steps carry optional `lat/lng` for the map/globe.
- `verificationStatus` is public-facing: show `VerificationBadge` on partner/university/destination
  cards when not VERIFIED.

## Commands
```
pnpm dev · pnpm typecheck · pnpm lint · pnpm test · pnpm build · pnpm db:reset (push + seed)
```
