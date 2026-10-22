import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { SplitHeading } from "@/components/ui/split-heading";

/**
 * Act — Work with us. A quiet invitation to teachers and professionals, placed after the trust
 * section so it reads as part of the same honest institution. Photo is real SHV teaching.
 */
export function WorkWithUs() {
  return (
    <section aria-labelledby="work-title" className="bg-bg text-fg border-t border-line">
      <div className="container-x section-y grid grid-cols-12 items-center gap-x-8 gap-y-12">
        <Reveal className="col-span-12 lg:col-span-5">
          <p className="eyebrow eyebrow-rule">Work with us</p>
          <SplitHeading id="work-title" text="Teach where the" accent="route begins." accentClassName="text-blue" className="font-display mt-6 text-[clamp(2.25rem,4.6vw,3.75rem)] leading-[1.02] text-fg text-balance" />
          <p className="mt-6 max-w-md text-lg leading-relaxed text-fg-muted text-pretty">
            Small classes, an international curriculum and students at the start of a journey abroad. St Hugh&rsquo;s welcomes enquiries from teachers, English-language specialists and admissions professionals.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="/work-with-us" arrow="right">
              Send a job enquiry
            </Button>
            <Button href="/about" variant="ghost" arrow="right">
              About the college
            </Button>
          </div>
        </Reveal>
        {/* Hidden on phones: the same classroom already appears in Life at SHV just above. */}
        <Reveal className="col-span-12 max-md:hidden lg:col-span-6 lg:col-start-7" delay={100}>
          <div className="group relative aspect-[4/3] overflow-hidden rounded-[var(--radius)] bg-bg-hover">
            <Image src="/media/students/shv-classroom-teacher.jpg" alt="A lecturer teaching a small class at St Hugh's College Vientiane" fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover transition-transform duration-[900ms] ease-[var(--ease-out)] group-hover:scale-[1.04]" style={{ objectPosition: "50% 40%" }} />
            <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-midnight/60 to-transparent" />
            <p className="absolute bottom-4 left-4 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-white">Teaching at SHV · Vientiane</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
