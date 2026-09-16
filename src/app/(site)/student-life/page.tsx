import type { Metadata } from "next";
import { getFacilities, getEvents, getStudentStories, getFaqs, getProgrammes } from "@/lib/content";
import { pageMetadata, faqPageJsonLd } from "@/lib/seo";
import { formatDate } from "@/lib/utils";
import { PageHero } from "@/components/sections/page-hero";
import { ConsultationBand } from "@/components/sections/consultation-band";
import { JsonLd } from "@/components/site/json-ld";
import { StoryCard } from "@/components/cards/story-card";
import { Section, PendingLine, NextSteps } from "@/components/pages";
import { Plate } from "@/components/ui/plate";
import { Reveal } from "@/components/ui/reveal";
import { Accordion } from "@/components/ui/accordion";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = pageMetadata({
  title: "Student life",
  description: "Learning, collaboration, events and support at St Hugh's College Vientiane — shown with real photography and published as confirmed.",
  path: "/student-life",
});

const THEMES = ["Learning", "Collaboration", "Events", "Clubs", "Academic support", "Professional development", "Cultural experiences", "Campus life"] as const;

export default async function StudentLifePage() {
  const [facilities, events, stories, faqs, programmes] = await Promise.all([getFacilities(), getEvents({ upcoming: true }), getStudentStories({ take: 3 }), getFaqs({ category: "STUDENT_LIFE" }), getProgrammes()]);
  const social = facilities.filter((f) => ["SOCIAL", "STUDY", "OUTDOOR"].includes(f.category));
  const englishModules = programmes.some((p) => p.englishRequirement);

  return (
    <>
      <PageHero
        eyebrow="Student life"
        title={
          <>
            A small college, <span className="italic text-brand-soft">a serious year.</span>
          </>
        }
        lede="The year in Vientiane is where the route begins. Student life at SHV is shown here with real photography and confirmed activity — nothing staged, nothing borrowed."
      />

      <Section eyebrow="Learning" title="How you learn" lede="What the published programmes tell us about the way teaching is structured.">
        <ul className="divide-y divide-line border-y border-line">
          <li className="grid gap-2 py-5 sm:grid-cols-12 sm:gap-6">
            <span className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-brand-soft sm:col-span-4">Academic English</span>
            <p className="text-[0.9375rem] leading-relaxed text-fg-muted sm:col-span-8">{englishModules ? "English for Academic Purposes is built into each published programme and is accepted by NCUK University Partners in place of IELTS for progression." : "Confirmed by the admissions team."}</p>
          </li>
          <li className="grid gap-2 py-5 sm:grid-cols-12 sm:gap-6">
            <span className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-brand-soft sm:col-span-4">Teaching spaces</span>
            <p className="text-[0.9375rem] leading-relaxed text-fg-muted sm:col-span-8">{facilities.filter((f) => f.category === "LEARNING").map((f) => f.name).join(", ") || "Confirmed by the admissions team."}</p>
          </li>
          <li className="grid gap-2 py-5 sm:grid-cols-12 sm:gap-6">
            <span className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-brand-soft sm:col-span-4">Study support</span>
            <p className="text-[0.9375rem] leading-relaxed text-fg-muted sm:col-span-8">{facilities.some((f) => f.category === "STUDY") ? facilities.filter((f) => f.category === "STUDY").map((f) => `${f.name} — ${f.description}`).join(" ") : "Confirmed by the admissions team."}</p>
          </li>
        </ul>
      </Section>

      <Section eyebrow="In pictures" title="Life around the campus" lede="Each plate is a named photography slot. Real SHV photographs replace them as they are approved." layout="full">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-12">
          {THEMES.map((theme, i) => {
            const facility = social[i % Math.max(social.length, 1)];
            return (
              <Reveal key={theme} delay={i * 40} className={i % 4 === 0 || i % 4 === 3 ? "lg:col-span-7" : "lg:col-span-5"}>
                <Plate media={facility?.photo} slot={theme} aspect={i % 4 === 0 || i % 4 === 3 ? "3/2" : "4/3"} caption={theme} sizes="(min-width:1024px) 50vw, 100vw" />
              </Reveal>
            );
          })}
        </div>
        <PendingLine className="mt-8">Descriptions of clubs, events and cultural programmes are published when approved.</PendingLine>
      </Section>

      <Section eyebrow="Events" title="What is coming up" layout="full">
        {events.length ? (
          <ul className="divide-y divide-line border-y border-line">
            {events.map((e) => (
              <li key={e.id} className="grid gap-2 py-5 sm:grid-cols-12 sm:gap-6">
                <span className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-brand-soft sm:col-span-3">{formatDate(e.startsAt)}</span>
                <div className="sm:col-span-6">
                  <p className="text-[1.0625rem] font-medium text-fg">{e.title}</p>
                  {e.description ? <p className="mt-1 text-sm leading-relaxed text-fg-muted">{e.description}</p> : null}
                </div>
                <p className="text-sm text-fg-muted sm:col-span-3">{e.isOnline ? "Online" : e.location ?? ""}</p>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="Events are published here as they are confirmed" body="Open days, information sessions and campus events appear here once scheduled." action={<Button href="/consultation?type=visit" variant="secondary">Book a campus visit</Button>} />
        )}
      </Section>

      <Section eyebrow="Student stories" title="In their own words" layout="full">
        {stories.length ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {stories.map((s, i) => (
              <Reveal key={s.id} delay={i * 40}>
                <StoryCard story={s} />
              </Reveal>
            ))}
          </div>
        ) : (
          <EmptyState title="Student stories are published with consent" body="Stories appear here once students have approved their photography and words." />
        )}
      </Section>

      {faqs.length ? (
        <Section eyebrow="FAQ" title="Student life questions">
          <Accordion items={faqs.map((f) => ({ id: f.id, title: f.question, content: <p>{f.answer}</p> }))} />
          <JsonLd data={faqPageJsonLd(faqs)} />
        </Section>
      ) : null}

      <Section eyebrow="Next" title="See it for yourself">
        <NextSteps
          items={[
            { label: "Campus", description: "Every confirmed facility, room by room", href: "/campus" },
            { label: "Programmes", description: "What you will actually study", href: "/programmes" },
            { label: "Book a campus visit", description: "Walk the campus with an advisor", href: "/consultation?type=visit" },
          ]}
        />
      </Section>

      <ConsultationBand title="Come and see the campus" body="Book a visit and walk the campus with an advisor, or start with a free consultation." primaryHref="/consultation?type=visit" primaryLabel="Book a visit" secondaryHref="/consultation" secondaryLabel="Book a consultation" />
    </>
  );
}
