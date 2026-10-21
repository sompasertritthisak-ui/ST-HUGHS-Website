import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { PageHero } from "@/components/sections/page-hero";
import { PAGE_IMAGES } from "@/components/cinematic/placeholders";
import { Section } from "@/components/pages";
import { JobEnquiryForm } from "@/components/forms/job-enquiry-form";
import { Reveal } from "@/components/ui/reveal";

export const metadata: Metadata = pageMetadata({
  title: "Work with us",
  description: "Teaching and professional roles at St Hugh's College Vientiane, an NCUK Study Centre in Lao PDR. Send a job enquiry.",
  path: "/work-with-us",
});

const WHAT = [
  { title: "Small classes, serious students", body: "Seminar-style teaching to students preparing for universities abroad, with English built into every programme." },
  { title: "An international curriculum", body: "NCUK programmes with external moderation, plus bachelor pathways with partner universities in Vietnam, Thailand, France and Laos." },
  { title: "A young institution", body: "Established in 2023 and authorised by the Lao Ministry of Education and Sports: the people who join now shape how it grows." },
];

export default function WorkWithUsPage() {
  return (
    <>
      <PageHero
        media={PAGE_IMAGES["for/partners"]}
        eyebrow="Work with us"
        title="Teach where the"
        accent="route begins."
        lede="St Hugh's College Vientiane welcomes enquiries from teachers, English-language specialists and admissions professionals. Tell us about yourself; when a role matches, we will be in touch."
      />

      <Section eyebrow="Why St Hugh's" title="What it is like to work here" layout="full">
        <ul className="grid gap-6 md:grid-cols-3">
          {WHAT.map((w, i) => (
            <Reveal as="li" key={w.title} delay={i * 60} className="rounded-[var(--radius)] border border-line p-6">
              <span className="font-mono text-[0.6875rem] tracking-[0.14em] text-brand-soft tabular">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="mt-3 text-[1.25rem] font-semibold leading-snug text-fg">{w.title}</h3>
              <p className="mt-2 leading-relaxed text-fg-muted">{w.body}</p>
            </Reveal>
          ))}
        </ul>
      </Section>

      <Section id="enquiry" eyebrow="Job enquiry" title="Tell us about yourself" lede="Open roles are announced through the college's channels. A general enquiry is welcome at any time and is kept on file for twelve months.">
        <JobEnquiryForm />
      </Section>
    </>
  );
}
