import Link from "next/link";
import { getNavigation, getContactSettings } from "@/lib/content";
import { Logo } from "./logo";
import { RouteLine } from "@/components/ui/route-line";
import { FacebookIcon as Facebook, LinkedinIcon as Linkedin, YoutubeIcon as Youtube, InstagramIcon as Instagram } from "./social-icons";

export async function SiteFooter() {
  const [footer, legal, contact] = await Promise.all([getNavigation("FOOTER"), getNavigation("LEGAL"), getContactSettings()]);
  const year = new Date().getFullYear();
  const socials = [
    { href: contact.social.facebook, label: "Facebook", Icon: Facebook },
    { href: contact.social.linkedin, label: "LinkedIn", Icon: Linkedin },
    { href: contact.social.youtube, label: "YouTube", Icon: Youtube },
    { href: contact.social.instagram, label: "Instagram", Icon: Instagram },
  ].filter((s) => s.href);

  return (
    <footer className="relative border-t border-line bg-bg-raised">
      <div className="container-x pb-10 pt-16">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Logo />
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-fg-muted">
              A private college in Vientiane, authorised by the Lao Ministry of Education and Sports and operating as an NCUK Study Centre. International university pathways that start in Laos.
            </p>
            <address className="mt-6 not-italic text-sm leading-relaxed text-fg-muted">
              {contact.addressLines.map((l) => (
                <span key={l} className="block">
                  {l}
                </span>
              ))}
            </address>
            <ul className="mt-4 space-y-1 text-sm">
              {contact.phones.map((p) => (
                <li key={p}>
                  <a href={`tel:${p.replace(/\s+/g, "")}`} className="text-fg hover:text-gold-soft">
                    {p}
                  </a>
                </li>
              ))}
              {contact.emails.map((e) => (
                <li key={e}>
                  <a href={`mailto:${e}`} className="text-fg hover:text-gold-soft">
                    {e}
                  </a>
                </li>
              ))}
            </ul>
            {socials.length > 0 && (
              <ul className="mt-6 flex gap-2">
                {socials.map(({ href, label, Icon }) => (
                  <li key={label}>
                    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="inline-flex size-10 items-center justify-center rounded-[var(--radius-sm)] border border-line text-fg-muted hover:border-line-strong hover:text-fg">
                      <Icon className="size-4" strokeWidth={1.5} />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <nav aria-label="Footer" className="lg:col-span-5">
            <p className="eyebrow eyebrow-rule mb-5">St Hugh&apos;s College Vientiane</p>
            <ul className="grid grid-cols-2 gap-x-8 gap-y-2.5 sm:grid-cols-3">
              {footer.map((item) => (
                <li key={item.id}>
                  <Link href={item.href} className="text-sm text-fg-muted transition-colors hover:text-fg">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="lg:col-span-3">
            <p className="eyebrow eyebrow-rule mb-5">Next step</p>
            <ul className="space-y-3">
              <li>
                <Link href="/pathway-explorer" className="group flex items-center justify-between border-b border-line pb-3 text-[0.9375rem] text-fg">
                  Explore your pathway
                  <span aria-hidden className="h-px w-6 bg-route transition-[width] duration-[var(--dur)] group-hover:w-10" />
                </Link>
              </li>
              <li>
                <Link href="/consultation" className="group flex items-center justify-between border-b border-line pb-3 text-[0.9375rem] text-fg">
                  Book a free consultation
                  <span aria-hidden className="h-px w-6 bg-route transition-[width] duration-[var(--dur)] group-hover:w-10" />
                </Link>
              </li>
              <li>
                <Link href="/admissions" className="group flex items-center justify-between border-b border-line pb-3 text-[0.9375rem] text-fg">
                  How to apply
                  <span aria-hidden className="h-px w-6 bg-route transition-[width] duration-[var(--dur)] group-hover:w-10" />
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <RouteLine className="my-10" node="both" />

        <div className="flex flex-col gap-4 text-xs text-fg-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} St Hugh&apos;s College Vientiane. Established 2023. Authorised by the Lao Ministry of Education and Sports.</p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {legal.map((item) => (
              <li key={item.id}>
                <Link href={item.href} className="hover:text-fg">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/admin/login" className="hover:text-fg">
                Staff sign in
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
