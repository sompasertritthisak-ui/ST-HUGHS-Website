import type { Facility, Media } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Plate } from "@/components/ui/plate";
import { Reveal } from "@/components/ui/reveal";

type FacilityWithPhoto = Facility & { photo?: Media | null };

const POINTS = [
  { title: "Seminar-style teaching", body: "Small classes where students are expected to speak, question and present — the way university seminars work." },
  { title: "English for Academic Purposes", body: "Taught alongside subject modules, so academic English develops in context rather than in isolation." },
  { title: "Preparation for university learning", body: "Study skills, independent research and assessment practice that mirror what the first year abroad will ask for." },
];

/** Act VII — the student experience. Editorial, asymmetric; plates name the photography still to come. */
export function StudentExperience({ facilities }: { facilities: FacilityWithPhoto[] }) {
  const learning = facilities.find((f) => f.category === "LEARNING") ?? facilities[0];
  const social = facilities.find((f) => f.category === "SOCIAL" || f.category === "STUDY") ?? facilities[1];

  return (
    <section aria-labelledby="experience-title" className="relative overflow-hidden">
      <div className="container-x section-y grid grid-cols-12 gap-x-8 gap-y-14">
        <div className="col-span-12 lg:col-span-5">
          <Reveal>
            <p className="eyebrow eyebrow-rule">Student life</p>
            <h2 id="experience-title" className="font-display mt-6 text-[clamp(2.25rem,4.6vw,3.75rem)] leading-[1.02] text-fg text-balance">
              Learn like a first-year, a year early.
            </h2>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-fg-muted text-pretty">
              The foundation year is designed to feel like university before university: the expectations, the pace and the independence, in a setting where
              support is close by.
            </p>
          </Reveal>
          <ol className="mt-10 border-t border-line">
            {POINTS.map((p, i) => (
              <Reveal as="li" key={p.title} delay={80 + i * 40} className="grid grid-cols-[2.5rem_1fr] gap-x-4 border-b border-line py-5">
                <span className="font-mono text-[0.6875rem] tracking-[0.14em] text-fg-subtle tabular">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className="text-[1.125rem] font-medium text-fg">{p.title}</h3>
                  <p className="mt-1.5 text-[1rem] leading-relaxed text-fg-muted">{p.body}</p>
                </div>
              </Reveal>
            ))}
          </ol>
          <div className="mt-8">
            <Button href="/student-life" variant="ghost" arrow="right">
              Student life at SHV
            </Button>
          </div>
        </div>

        <div className="relative col-span-12 lg:col-span-6 lg:col-start-7">
          <Reveal className="lg:ml-[18%]">
            <Plate
              media={learning?.photo}
              slot={learning ? `Student life — ${learning.name}` : "Student life — teaching"}
              aspect="3/4"
              sizes="(min-width:1024px) 34vw, 90vw"
              caption={learning ? learning.name : undefined}
            />
          </Reveal>
          <Reveal delay={120} className="-mt-10 w-[68%] lg:absolute lg:-bottom-8 lg:left-0 lg:mt-0 lg:w-[52%]">
            <Plate
              media={social?.photo}
              slot={social ? `Student life — ${social.name}` : "Student life — community"}
              aspect="4/3"
              sizes="(min-width:1024px) 24vw, 60vw"
              caption={social ? social.name : undefined}
              className="[&>div]:bg-bg"
            />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
