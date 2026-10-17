# SHV Digital Campus — Design System (MASTER)

This is the single source of truth for every UI decision in the project. Page-level
deviations live in `docs/pages/*.md`. If a page file exists it overrides this file.

## Creative Direction

**Brand personality** — Composed, ambitious, cosmopolitan. If SHV were a person they would be a
young diplomat: new to the room, impeccably prepared, speaking quietly about very large plans.

**Audience & state of mind** — A Lao family at the kitchen table deciding whether a degree
abroad is realistic. The student is excited and slightly intimidated. The parent is looking for
reasons to trust. A university partner arrives asking "is this institution serious?"

**Intended emotion** — *Assured momentum.* The feeling of standing at a departure gate with a
confirmed ticket.

**Visual language** — White is the primary colour; deep brand blue and brand red are the accents (the
Lao flag's three colours, with white as the ground). The hero is white too: the 3D globe is a
photographic Earth (NASA Blue Marble day surface, relief, ocean reflectivity, drifting clouds, city
lights; textures in `public/textures/earth/`) with a soft blue atmosphere, red routes and nodes. No
dotted or outlined land anywhere; the no-WebGL fallback is the real equirectangular map. Deep blue appears
only inside the cinema: the three chapter openers, the closing scene, the page-hero frames on
sub-pages, and the footer. Red is the
stroke: eyebrows, rules, nodes, numbers, the primary button, the thin wayfinding band under the hero.
The 6px red·blue·red "flag stripe" marks the seam into the closing scene and the footer. Editorial
serif display set large and quiet; institutional sans for everything readable; mono for
wayfinding labels (route codes, durations, statuses). Materiality: dark glass and brushed metal,
restrained. Imagery: real SHV photography only; where none exists yet, a structured placeholder
that reads as an intentional "plate" (not a grey box) with the CMS media slot named.

**Interaction language** — Motion is always a *route being drawn*: lines extend, nodes light in
sequence, cards arrive along the path. Ease-out entrances 300–500ms, staggered 40ms. Nothing
bounces. Reduced-motion users get the finished state instantly.

**Narrative (acts)** — Short on purpose. Written for a family that has never heard of SHV:
Origin (hero, globe) → How it works (three steps, four verified numbers) → Chapter 1 → Programmes →
Chapter 2 → Destinations (compact) → Chapter 3 → Life at SHV (photography) → Why trust it (four
sourced facts) → Start here. Everything else lives on its own page: timeline on /about, the pathway
tool, outcomes on /careers, stories, news, the campus walk on /campus.
A left-gutter "spine" (`SectionSpine`) tracks the acts on large screens. The act list and each act's
question live as a comment at the top of `src/app/(site)/page.tsx`; a section that cannot state its
question is removed.

**The WOW moment** — The hero: a dark globe with Vientiane as the single lit origin; on scroll the
routes extend outward to the nine approved destinations, then the globe resolves into the
Pathway Explorer.

**Motion layer** — Lenis inertial scrolling (pointer devices only) drives GSAP ScrollTrigger. GSAP is
used where scroll should drive the picture: hero depth on exit (`HeroMotion`), the journey line, chips
and counters (`RouteJourney`), and the three pinned `CinematicScene` chapter openers (backdrop
push-in, title rising word by word out of depth, copy lifting away). Cards tilt a few degrees under
the pointer (`Tilt`); primary calls to action lean toward it (`Magnetic`). Every heading on the site — homepage
acts, `PageHero` titles and `Section` titles on sub-pages — is a `SplitHeading`: words rise one after
another the first time the heading scrolls into view, with the closing phrase in blue (or italic red
on dark). Sub-pages open with a cinematic frame (`PageHero media`) from the same generated world as the
homepage. Supporting copy uses the CSS `Reveal`. Every effect starts from the server-rendered
final state and is skipped under `prefers-reduced-motion`. Film grain (`grain`) sits on the large
blue and red fields.

**Cinematic backdrops** — One generated hero still (blue hour, white campus terrace in Vientiane,
students in silhouette, the red route line arcing to distant cities) is the visual reference for every
clip, so the look is identical across the page: hero (origin loop), programmes chapter (seminar room),
final call to action (the same terrace at dawn). The destinations and campus chapters use crops of the
still with a slow drift. Clips are silent 8 s loops, requested only near the viewport, replaced by
their poster under reduced motion or reduced data. Rule kept: generated imagery is atmosphere; it is
never presented as a photograph of actual students, and real photography remains the only source for
people on the site.

**The MEMORY moment** — The thin red route line that runs through the whole site: it is the red rule
under the wordmark in the logo, extended. It appears in the hero, in the pathway timeline, under the
active nav item, and as the page-load progress bar. "The red line from Laos to the world."

**Calls to action** — Three, always together and always in this order (`CtaTrio`): **Book a tour**
(primary, red), **Explore your pathway**, **Talk to an advisor**. They appear in the hero, under the
"How it works" heading and in the closing scene; the phone enquiry bar carries the advisor link.
Secondary pages add "How to apply". A separate **Work with us** act and page (`/work-with-us`) take
job enquiries into the same CMS enquiry queue (audience OTHER, source `work-with-us`).

## Tokens

All tokens are CSS custom properties in `src/app/globals.css` and exposed to Tailwind v4 via
`@theme`. Components must use semantic tokens, never raw hex.

### Colour — SHV brand guideline: deep blue · red · white
Sampled from the official logo files in `public/brand/` (wordmark blue #103090, mark gradient to #141858,
rule red #CC1814).

| Token | Hex | Role |
|---|---|---|
| `--color-midnight` | `#0B1350` | deepest ground (public site) |
| `--color-obsidian` | `#101A5E` | raised surfaces |
| `--color-navy` | `#142478` | cards, panels (logo mark) |
| `--color-navy-2` | `#1B3499` | hover surfaces |
| `--color-blue` | `#103090` | primary brand blue: links and focus on white, wordmark |
| `--color-brand` | `#CF1B18` | brand red: the route line, nodes, primary CTA fill |
| `--color-brand-deep` | `#A3120F` | red on white (≥ 4.5:1) |
| `--color-brand-soft` | `#FF8E8B` | red-tinted text on deep blue (≥ 6:1) |
| `--color-ivory` | `#FFFFFF` | white: primary text on blue, light page ground |
| `--color-ivory-2` | `#EEF2FA` | cool off-white |
| `--color-platinum` | `#C7D1EC` | secondary text on blue |
| `--color-slate` | `#7D8AAE` | tertiary text |
| `--color-ink` | `#0B1350` | text on white |
| `--color-success` / `warning` / `danger` | `#2F9E6B` / `#D08A1F` / `#D64545` | status |

Semantic aliases: `--bg`, `--bg-raised`, `--fg`, `--fg-muted`, `--line`, `--line-strong`, `--ring`,
`--route`. The site is white-first (`:root`); `.theme-dark` flips a section to the deep-blue ground
with white type (hero, chapters, closing scene, footer); `.theme-light` is an explicit white surface
for the admin CMS or a white panel nested in a dark section. `.theme-brand` flips to a red ground with white type, a white
route line and an inverted (white) primary button; use it for whole bands, never for cards. Red also
lives in every eyebrow, stat value, milestone year, index number, the route line, nodes and badges.
Red text on blue is always `brand-soft` (#FF8A85); true red on blue is reserved for fills and strokes.

### Type
| Role | Family | Notes |
|---|---|---|
| Display | Cormorant Garamond 600 (400–700 loaded) + italic | ≥ 40px only. Tight tracking `-0.01em`, line-height 0.95–1.05. Headings are set bold on purpose |
| Sans | IBM Plex Sans 400/500/600/700 | body 16–18px, line-height 1.6; UI 14–15px; menu items 600 |
| Mono | IBM Plex Mono 400/500 | eyebrows, route codes, durations, statuses; uppercase, tracking `0.14em`, 11–12px |

Scale (rem): 0.75, 0.875, 1, 1.125, 1.25, 1.5, 2, 2.5, 3.25, 4.25, 5.5, clamp() for display.

### Space, radius, elevation
- 4px base. Section padding: `clamp(4rem, 10vw, 9rem)` vertical.
- Container: `max-w-[1320px]`, gutter `clamp(1rem, 4vw, 3rem)`.
- Radius: `--radius-sm 4px`, `--radius 8px`, `--radius-lg 14px`. No pill cards. Buttons are
  square-ish (`--radius-sm`).
- Elevation on dark is done with 1px lines (`--line`) and a subtle inner top highlight, not drop
  shadows. On light (admin) use `shadow-sm`.
- Glass: only for the sticky nav and the explorer side panel. `backdrop-blur-md` + 70% surface.

### Motion tokens
`--ease-out: cubic-bezier(.22,1,.36,1)`, `--dur-fast: 180ms`, `--dur: 320ms`, `--dur-slow: 560ms`.
Stagger 40ms. Route-line draw: 900–1400ms with `--ease-out`.
`@media (prefers-reduced-motion: reduce)` disables all transforms/draws; content is visible.

## Signature components
- **RouteLine** — the red line (from the logo rule). SVG path with `stroke-dasharray` draw-on. Used in hero, timelines,
  section dividers, nav underline, page progress.
- **Node** — 8px red dot with a 24px ring on active. Represents a place/step.
- **Plate** — image container with 1px line, mono caption, focal-point object-position from CMS.
- **Eyebrow** — mono uppercase label with a 24px red rule to the left.
- **Stat** — number in display face, label in mono; renders "—" with "Verified data pending" when
  no verified value exists. Never invents numbers.
- **Button** — `primary` (red fill, white text; on `.theme-brand` it inverts to white fill, red text),
  `secondary` (outline), `ghost` (text + arrow). Only one primary per viewport.
- **FlagStripe** — 6px red·blue·red rule (`src/components/ui/flag-stripe.tsx`) at white→blue seams and
  the top of the footer.

## Anti-patterns (hard rules)
- No neon, no crypto/gaming gradients, no floating blobs, no glassmorphism on cards.
- No emoji icons. Lucide only, 1.5px stroke.
- No "world-class / best / #1" copy. No invented statistics, partners, fees or outcomes.
- No hardcoded programme, university, pathway or nav data in components — everything from the DB.
- No template rhythm (hero → 3 cards → features → testimonials → pricing → FAQ). The homepage is a
  journey: Origin → Foundation → Pathway → Destination → Future → Start here.
- Body text never below 16px on mobile; contrast ≥ 4.5:1 checked for ivory/platinum on midnight
  and ink on ivory.

## Copy voice
Plain, confident, specific. Sentence case for UI; the display statements may be set in caps in
the mono eyebrow style. Say what happens: "Book a consultation", "Explore this pathway".
Guidance tools always carry the line: "This is guidance to help you plan. It is not a formal
admissions decision."
