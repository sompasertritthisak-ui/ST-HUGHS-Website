import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { PageHero } from "@/components/sections/page-hero";
import { Scholarships } from "@/components/sections/scholarships";
import { ConsultationBand } from "@/components/sections/consultation-band";

export const metadata: Metadata = pageMetadata({
  title: "Scholarships",
  description: "Scholarships and discounts for St Hugh's College Vientiane students: NCUK University Partner scholarships, British University Vietnam and ESDES awards, and BBA payment options.",
  path: "/scholarships",
});

export default function ScholarshipsPage() {
  return (
    <>
      <PageHero
        eyebrow="Scholarships"
        title={<>Support to <span className="italic text-brand-soft">go further.</span></>}
        lede="Universities on our routes offer scholarships and discounts. Here is what each one publishes, and how an advisor can help you apply."
      />
      <Scholarships compact={false} />
      <ConsultationBand
        title="Find out what you could receive"
        body="Book a free consultation. An advisor checks your grades against each scholarship's criteria and the deadlines for your intake."
        primaryHref="/enquire?topic=scholarships"
        primaryLabel="Check scholarship eligibility"
        secondaryHref="/consultation"
        secondaryLabel="Talk to an advisor"
      />
    </>
  );
}
