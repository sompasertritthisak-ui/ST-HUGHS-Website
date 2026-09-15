import type { Metadata } from "next";
import { getStudentStories } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { PageHero } from "@/components/sections/page-hero";
import { ConsultationBand } from "@/components/sections/consultation-band";
import { StoryCard } from "@/components/cards/story-card";
import { Section } from "@/components/pages";
import { Reveal } from "@/components/ui/reveal";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = pageMetadata({
  title: "Student stories",
  description: "Real journeys from St Hugh's College Vientiane — programme, destination, university and outcome, published only with the student's consent.",
  path: "/student-stories",
});

export default async function StudentStoriesPage() {
  const stories = await getStudentStories();
  const featured = stories.filter((s) => s.featured);
  const rest = stories.filter((s) => !s.featured);

  return (
    <>
      <PageHero
        eyebrow="Student stories"
        title={<>Real routes, <span className="italic text-gold-soft">real people.</span></>}
        lede="Every story here is a real student, photographed with permission and published with consent. Where a story names a destination or outcome, the evidence sits behind it in the CMS."
        aside={
          <dl className="grid grid-cols-2 gap-6 border-t border-line pt-6 font-mono text-[0.6875rem] uppercase tracking-[0.14em]">
            <div>
              <dt className="text-fg-subtle">Published stories</dt>
              <dd className="font-display mt-2 text-[2.5rem] normal-case tracking-normal text-fg tabular">{stories.length}</dd>
            </div>
            <div>
              <dt className="text-fg-subtle">Consent</dt>
              <dd className="mt-2 normal-case tracking-normal text-fg">Granted for every story shown</dd>
            </div>
          </dl>
        }
      />

      {stories.length ? (
        <>
          {featured.length ? (
            <Section eyebrow="Featured" title="Journeys worth following" layout="full">
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {featured.map((s, i) => (
                  <Reveal key={s.id} delay={i * 40}>
                    <StoryCard story={s} />
                  </Reveal>
                ))}
              </div>
            </Section>
          ) : null}
          {rest.length ? (
            <Section eyebrow="All stories" title={featured.length ? "More journeys" : "Journeys"} layout="full">
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {rest.map((s, i) => (
                  <Reveal key={s.id} delay={i * 40}>
                    <StoryCard story={s} />
                  </Reveal>
                ))}
              </div>
            </Section>
          ) : null}
        </>
      ) : (
        <section className="container-x py-16">
          <EmptyState
            title="Stories are published with consent"
            body="SHV's first NCUK cohorts began in September 2025. Student stories appear here as students complete their programmes and approve their photography and words — never before, and never invented."
            action={<Button href="/programmes" variant="secondary">Explore programmes</Button>}
          />
        </section>
      )}

      <ConsultationBand title="Your story starts with a programme" body="Explore the programmes these journeys begin with, or talk to an advisor about your own route." primaryHref="/programmes" primaryLabel="Explore programmes" secondaryHref="/consultation" secondaryLabel="Talk to an advisor" />
    </>
  );
}
