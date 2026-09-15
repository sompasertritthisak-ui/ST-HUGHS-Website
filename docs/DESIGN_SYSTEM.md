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

**Visual language** — Deep midnight and obsidian surfaces, ivory type, one refined gold used like
a gilt edge (thin rules, small marks, the active node), never as fills or gradients. Editorial
serif display set large and quiet; institutional sans for everything readable; mono for
wayfinding labels (route codes, durations, statuses). Materiality: dark glass and brushed metal,
restrained. Imagery: real SHV photography only; where none exists yet, a structured placeholder
that reads as an intentional "plate" (not a grey box) with the CMS media slot named.

**Interaction language** — Motion is always a *route being drawn*: lines extend, nodes light in
sequence, cards arrive along the path. Ease-out entrances 300–500ms, staggered 40ms. Nothing
bounces. Reduced-motion users get the finished state instantly.

**Narrative (acts)** — Origin (Vientiane) → Foundation (the programme) → Pathway (the route) →
Destination (the university) → Future (career) → Return (the CTA back to the origin: "start here").

**The WOW moment** — The hero: a dark globe with Vientiane as the single lit origin; on scroll the
routes extend outward to the nine approved destinations, then the globe resolves into the
Pathway Explorer.

**The MEMORY moment** — The thin gold route line that runs through the whole site: it appears in
the hero, in the pathway timeline, under the active nav item, and as the page-load progress bar.
The same line, everywhere. "The gold line from Laos to the world."

**Primary conversion** — Book a free consultation (talk to an advisor). Secondary: explore your
pathway. Tertiary: apply.

## Tokens

All tokens are CSS custom properties in `src/app/globals.css` and exposed to Tailwind v4 via
`@theme`. Components must use semantic tokens, never raw hex.

### Colour
| Token | Hex | Role |
|---|---|---|
| `--color-midnight` | `#06090F` | page ground (dark) |
| `--color-obsidian` | `#0B1120` | raised surfaces |
| `--color-navy` | `#111D36` | cards, panels |
| `--color-navy-2` | `#182A4D` | hover surfaces, borders on dark |
| `--color-gold` | `#C6A45C` | the route line, marks, active states |
| `--color-gold-deep` | `#8F7434` | gold on light backgrounds (contrast safe) |
| `--color-gold-soft` | `#E4CE93` | gold text on midnight (≥ 7:1) |
| `--color-ivory` | `#F4EFE4` | primary text on dark, light page ground |
| `--color-platinum` | `#B9BFCB` | secondary text on dark |
| `--color-slate` | `#6B7385` | tertiary text / placeholders |
| `--color-ink` | `#0B1120` | primary text on light |
| `--color-accent` | `#3E63DD` | restrained brand accent: focus ring, links on light, info |
| `--color-success` | `#2F9E6B` | published / verified |
| `--color-warning` | `#D08A1F` | in review / needs verification |
| `--color-danger` | `#D64545` | destructive, errors |

Semantic aliases: `--bg`, `--bg-raised`, `--fg`, `--fg-muted`, `--line`, `--line-strong`,
`--ring`. Public site is dark-first. Admin CMS is light (ivory ground, ink text) so it reads as a
working tool, not a brochure; it shares the same tokens.

### Type
| Role | Family | Notes |
|---|---|---|
| Display | Cormorant Garamond 300/400/500 + italic | ≥ 40px only. Tight tracking `-0.01em`, line-height 0.95–1.05 |
| Sans | IBM Plex Sans 400/500/600 | body 16–18px, line-height 1.6; UI 14–15px |
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
- **RouteLine** — the gold line. SVG path with `stroke-dasharray` draw-on. Used in hero, timelines,
  section dividers, nav underline, page progress.
- **Node** — 8px gold dot with a 24px ring on active. Represents a place/step.
- **Plate** — image container with 1px line, mono caption, focal-point object-position from CMS.
- **Eyebrow** — mono uppercase label with a 24px gold rule to the left.
- **Stat** — number in display face, label in mono; renders "—" with "Verified data pending" when
  no verified value exists. Never invents numbers.
- **Button** — `primary` (gold fill, ink text), `secondary` (ivory outline), `ghost` (text + arrow).
  Only one primary per viewport.

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
