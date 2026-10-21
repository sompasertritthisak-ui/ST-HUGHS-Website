import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { ProgressLine } from "@/components/site/progress-line";
import { PageViewTracker } from "@/components/site/page-view-tracker";
import { AnalyticsDelegation } from "@/components/site/analytics-delegation";
import { SmoothScroll } from "@/components/site/smooth-scroll";
import { EnquiryBar } from "@/components/site/enquiry-bar";
import { SearchDialog } from "@/components/search/search-dialog";
import { getContactSettings } from "@/lib/content";

/** Public pages are CMS-driven: on-demand revalidation from admin actions plus a 5-minute safety net. */
export const revalidate = 300;

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const contact = await getContactSettings();
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-[var(--radius-sm)] focus:bg-brand focus:px-4 focus:py-2 focus:text-ink"
      >
        Skip to main content
      </a>
      <SmoothScroll />
      <ProgressLine />
      <SiteHeader />
      <main id="main" className="pt-[72px]">
        {children}
      </main>
      <SiteFooter />
      <SearchDialog />
      <EnquiryBar phone={contact.phones[0] ?? null} whatsapp={contact.whatsapp || null} />
      <PageViewTracker />
      <AnalyticsDelegation />
    </>
  );
}
