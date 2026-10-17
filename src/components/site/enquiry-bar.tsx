"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { MessageCircle, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The one enquiry entry that is always within thumb's reach on phones: a slim bar at the bottom
 * with the consultation link and, when the college has set a WhatsApp number in the CMS, a
 * WhatsApp button (phone call otherwise). Hidden on the consultation and enquiry pages themselves,
 * in the CMS, and once the footer (which repeats the links) is on screen.
 */
export function EnquiryBar({ phone, whatsapp }: { phone: string | null; whatsapp: string | null }) {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const footer = document.querySelector("footer");
    if (!footer || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((entries) => entries.forEach((e) => setHidden(e.isIntersecting)), { threshold: 0.05 });
    io.observe(footer);
    return () => io.disconnect();
  }, [pathname]);
  if (!pathname || pathname.startsWith("/admin") || pathname.startsWith("/consultation") || pathname.startsWith("/enquire")) return null;
  const digits = (whatsapp ?? phone ?? "").replace(/[^\d]/g, "");
  const secondary = whatsapp
    ? { href: `https://wa.me/${digits}?text=${encodeURIComponent("Hello St Hugh's College, I would like to ask about studying with you.")}`, label: "WhatsApp", Icon: MessageCircle, external: true }
    : phone
      ? { href: `tel:${phone.replace(/\s+/g, "")}`, label: "Call", Icon: Phone, external: false }
      : null;
  return (
    <div
      className={cn(
        "theme-light fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md transition-transform duration-[var(--dur)] md:hidden",
        hidden ? "translate-y-full" : "translate-y-0",
      )}
      role="region"
      aria-label="Quick enquiry"
    >
      <div className="mx-auto flex max-w-md gap-3">
        <Link href="/consultation" className="flex h-12 flex-1 items-center justify-center rounded-[var(--radius-sm)] bg-brand text-[0.9375rem] font-semibold text-white">
          Talk to an advisor
        </Link>
        {secondary ? (
          <a
            href={secondary.href}
            {...(secondary.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-line-strong px-4 text-[0.9375rem] font-semibold text-fg"
          >
            <secondary.Icon className="size-4" strokeWidth={1.75} aria-hidden />
            {secondary.label}
          </a>
        ) : null}
      </div>
    </div>
  );
}
