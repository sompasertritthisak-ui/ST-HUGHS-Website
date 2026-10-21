import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getStudentStories } from "@/lib/content";
import { parseVideo } from "@/lib/video";
import { Reveal } from "@/components/ui/reveal";
import { SplitHeading } from "@/components/ui/split-heading";
import { Button } from "@/components/ui/button";
import { VideoTestimonial } from "@/components/media/video-testimonial";

/**
 * "Hear from our alumni". Plays consented, published student stories that have a video link (CMS → Student stories →
 * Video URL). Until the first ones are published it shows clearly-marked "coming soon" frames for the routes our
 * graduates take, plus an invitation to alumni — never an invented name or quote.
 */
const PLACEHOLDERS = [
  { title: "From Vientiane to Lyon", caption: "Foundation Year → ESDES Business School", poster: "/media/partners/esdes-lyon-campus.jpg" },
  { title: "From Vientiane to Bangkok", caption: "Bachelor's + Master's (1+3)", poster: "/media/partners/assumption-university-campus.jpg" },
  { title: "From Vientiane to Hanoi", caption: "International Hospitality Management (2+2)", poster: "/media/partners/british-university-vietnam-campus.jpg" },
];

export async function AlumniVoices({ variant = "home" }: { variant?: "home" | "page" }) {
  const stories = await getStudentStories();
  const withVideo = stories
    .map((s) => ({ s, video: parseVideo(s.videoUrl) }))
    .filter((x) => x.video)
    .sort((a, b) => Number(b.s.featured) - Number(a.s.featured));

  const items = withVideo.length
    ? withVideo.slice(0, 4).map(({ s, video }) => ({
        key: s.id,
        title: s.studentName,
        caption: [s.programme?.shortTitle ?? s.programme?.title, s.university?.name ?? s.destination?.country].filter(Boolean).join(" → ") || s.outcome,
        poster: s.photo?.usageStatus === "APPROVED" ? s.photo.url : null,
        video,
        quote: s.quote,
        href: `/student-stories/${s.slug}`,
      }))
    : PLACEHOLDERS.map((p) => ({ key: p.title, ...p, video: null, quote: null, href: null }));

  const [lead, ...others] = items;
  const live = withVideo.length > 0;

  return (
    <section aria-labelledby="alumni-title" className="border-t border-line bg-bg text-fg">
      <div className="container-x section-y">
        <div className="grid grid-cols-12 items-end gap-x-8 gap-y-6">
          <Reveal className="col-span-12 lg:col-span-7">
            <p className="eyebrow eyebrow-rule">Alumni voices</p>
            <SplitHeading
              id="alumni-title"
              text="Hear from"
              accent="our alumni."
              className="font-display mt-5 text-[clamp(2.25rem,5vw,4.25rem)] leading-[1.02] text-fg text-balance"
            />
          </Reveal>
          <Reveal className="col-span-12 lg:col-span-5" delay={80}>
            <p className="max-w-md text-[1.0625rem] leading-relaxed text-fg-muted text-pretty">
              {live
                ? "Graduates in their own words: where they started, where they study now and what made the difference."
                : "Our graduates will tell their own stories here, in short videos filmed in Vientiane and on campuses abroad."}
            </p>
          </Reveal>
        </div>

        <div className="mt-10 grid gap-5 lg:mt-14 lg:grid-cols-12 lg:gap-6">
          {lead ? (
            <Reveal className="lg:col-span-8">
              <VideoTestimonial video={lead.video} poster={lead.poster} title={lead.title} caption={lead.caption} size="lg" />
              {lead.quote ? <p className="mt-4 max-w-2xl font-display text-[1.375rem] leading-snug text-fg">“{lead.quote}”</p> : null}
            </Reveal>
          ) : null}
          {others.length ? (
            <div className="-mx-[var(--gutter)] flex snap-x snap-mandatory gap-4 overflow-x-auto px-[var(--gutter)] pb-2 [scrollbar-width:none] lg:col-span-4 lg:mx-0 lg:grid lg:snap-none lg:gap-6 lg:overflow-visible lg:px-0 lg:pb-0 [&::-webkit-scrollbar]:hidden" data-lenis-prevent>
              {others.map((o, i) => (
                <Reveal key={o.key} delay={100 + i * 60} className="w-[78%] shrink-0 snap-start sm:w-[46%] lg:w-auto">
                  <VideoTestimonial video={o.video} poster={o.poster} title={o.title} caption={o.caption} />
                </Reveal>
              ))}
            </div>
          ) : null}
        </div>

        <Reveal className="mt-10 flex flex-col gap-4 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between" delay={120}>
          <p className="text-[1rem] font-semibold text-fg">
            {live ? "Every story is published with the student's consent." : "Studied at St Hugh's? We would love to feature your story."}
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            {live || variant === "home" ? (
              <Link href="/student-stories" className="group inline-flex min-h-11 items-center gap-2 text-[0.9375rem] font-semibold text-fg hover:text-route">
                All student stories
                <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-1" strokeWidth={1.75} />
              </Link>
            ) : null}
            <Button href="/enquire?topic=alumni" variant="secondary" size="sm" arrow="right">
              Share your story
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
