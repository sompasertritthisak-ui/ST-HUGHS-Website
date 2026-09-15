import type { getStudentStories } from "@/lib/content";
import { StoryCard } from "@/components/cards/story-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Reveal } from "@/components/ui/reveal";

type Story = Awaited<ReturnType<typeof getStudentStories>>[number];

/** Act X — proof, with consent. No testimonials are ever invented. */
export function StudentStories({ stories }: { stories: Story[] }) {
  return (
    <section aria-labelledby="stories-title" className="border-t border-line">
      <div className="container-x section-y">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <Reveal>
            <p className="eyebrow eyebrow-rule">Student stories</p>
            <h2 id="stories-title" className="font-display mt-6 text-[clamp(2.25rem,4.6vw,3.75rem)] leading-[1.02] text-fg text-balance">
              Routes, told by the people on them
            </h2>
          </Reveal>
          {stories.length > 0 ? (
            <Button href="/student-stories" variant="ghost" arrow="right" className="text-sm">
              All stories
            </Button>
          ) : null}
        </div>
        {stories.length > 0 ? (
          <div className="grid gap-x-8 gap-y-14 md:grid-cols-3">
            {stories.map((s, i) => (
              <Reveal key={s.id} delay={i * 40} className={i === 1 ? "md:mt-14" : undefined}>
                <StoryCard story={s} />
              </Reveal>
            ))}
          </div>
        ) : (
          <Reveal>
            <EmptyState
              title="Student stories are coming"
              body="Student stories are published here once students have given consent. Nothing on this page is a placeholder testimonial."
              action={
                <Button href="/student-stories" variant="ghost" arrow="right">
                  About student stories
                </Button>
              }
            />
          </Reveal>
        )}
      </div>
    </section>
  );
}
