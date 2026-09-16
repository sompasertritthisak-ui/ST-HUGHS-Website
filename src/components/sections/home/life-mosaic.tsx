import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";
import { getMessagingSettings } from "@/lib/content";

/**
 * Life at SHV — an editorial mosaic of REAL photography from the media library.
 * Pulls approved images tagged "homepage-life" (set in the CMS), so the section
 * grows as SHV uploads more campus and student photography. Renders nothing when
 * fewer than three approved photos exist, rather than showing placeholders.
 */
export async function LifeMosaic() {
  const media = await prisma.media.findMany({
    where: { kind: "IMAGE", usageStatus: "APPROVED", tagsJson: { contains: "homepage-life" } },
    orderBy: { createdAt: "asc" },
    take: 6,
  });
  if (media.length < 3) return null;
  const messaging = await getMessagingSettings();
  // With 4 or 5 photos the grid leaves a gap; fill it with a brand statement tile.
  const fillerSpan = media.length === 4 ? "lg:col-span-8" : media.length === 5 ? "lg:col-span-4" : null;

  // Layout slots on a 12-column editorial grid. First image is the anchor.
  const slots = [
    "lg:col-span-7 lg:row-span-2 aspect-[4/3] lg:aspect-auto",
    "lg:col-span-5 aspect-[3/2]",
    "lg:col-span-5 aspect-[3/2]",
    "lg:col-span-4 aspect-[4/3]",
    "lg:col-span-4 aspect-[4/3]",
    "lg:col-span-4 aspect-[4/3]",
  ];

  return (
    <section aria-labelledby="life-title" className="theme-light bg-bg text-fg border-t border-line">
      <div className="container-x py-16 md:py-24">
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <Eyebrow className="mb-5">Life at SHV</Eyebrow>
            <h2 id="life-title" className="font-display text-[clamp(2.25rem,4.6vw,3.75rem)] leading-[1.02] text-fg text-balance">
              Real classrooms. Real partners. Real students.
            </h2>
          </div>
          <p className="max-w-md text-fg-muted">
            Every photograph here is from St Hugh&apos;s College Vientiane or its partner universities. No stock imagery, no generated faces.
          </p>
        </div>

        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-12 lg:auto-rows-[minmax(220px,auto)]">
          {media.map((m, i) => (
            <Reveal key={m.id} as="li" delay={i * 60} className={cn("group relative overflow-hidden rounded-[var(--radius)] bg-bg-hover", slots[i] ?? "lg:col-span-4 aspect-[4/3]")}>
              <Image
                src={m.url}
                alt={m.alt}
                fill
                sizes="(min-width:1024px) 50vw, 100vw"
                className="object-cover transition-transform duration-[900ms] ease-[var(--ease-out)] group-hover:scale-[1.04]"
                style={{ objectPosition: `${Math.round(m.focalX * 100)}% ${Math.round(m.focalY * 100)}%` }}
                priority={i === 0}
              />
              <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-midnight/70 to-transparent opacity-80 transition-opacity duration-[var(--dur)] group-hover:opacity-100" />
              <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-4">
                <span className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-white">{m.caption ?? m.alt}</span>
                <span aria-hidden className="h-px w-8 bg-route transition-[width] duration-[var(--dur)] group-hover:w-14" />
              </figcaption>
            </Reveal>
          ))}
          {fillerSpan ? (
            <Reveal as="li" delay={media.length * 60} className={cn("relative flex flex-col justify-between overflow-hidden rounded-[var(--radius)] bg-midnight p-6 text-white aspect-[3/2] lg:aspect-auto", fillerSpan)}>
              <span aria-hidden className="h-[3px] w-16 bg-route" />
              <div>
                <p className="font-display text-[clamp(1.75rem,2.6vw,2.5rem)] leading-[1.05] text-balance">{messaging.tagline}</p>
                <p className="mt-3 max-w-md text-sm text-platinum">A foundation year at home in Vientiane, a degree with a partner university abroad, and an admissions team that checks every step with you.</p>
              </div>
              <Link href="/consultation?type=visit" className="group inline-flex items-center gap-2 text-sm text-white">
                Book a campus visit
                <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
              </Link>
            </Reveal>
          ) : null}
        </ul>

        <div className="mt-8 flex flex-wrap gap-6">
          <Link href="/campus" className="group inline-flex items-center gap-2 text-fg">
            Walk the campus
            <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
          </Link>
          <Link href="/student-life" className="group inline-flex items-center gap-2 text-fg">
            Student life at SHV
            <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
          </Link>
        </div>
      </div>
    </section>
  );
}
