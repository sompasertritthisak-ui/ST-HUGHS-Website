import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = { title: "Staff sign in" };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await currentUser();
  if (user) redirect("/admin");
  return (
    <main id="main" className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      {/* Brand panel */}
      <section className="theme-dark relative hidden overflow-hidden bg-midnight text-fg lg:flex lg:flex-col lg:justify-between lg:p-12" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/media/cinematic/poster-origin.jpg" alt="" className="absolute inset-0 size-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgb(11_19_80/0.95)_0%,rgb(11_19_80/0.55)_50%,rgb(11_19_80/0.35)_100%)]" />
        <div className="grain absolute inset-0" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/shv-lockup-white.png" alt="St Hugh's College Vientiane" width={220} height={56} className="relative block" style={{ width: 220, height: "auto" }} />
        <div className="relative max-w-md">
          <span aria-hidden className="mb-6 block h-[3px] w-16 bg-route" />
          <p className="font-display text-[2.5rem] leading-[1.05] text-white">
            From Laos. <span className="italic text-brand-soft">To the world.</span>
          </p>
          <p className="mt-4 text-[0.9375rem] text-white/75">Content management for the SHV digital campus. Everything published here is live on the site within five minutes.</p>
        </div>
      </section>

      {/* Form */}
      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/shv-lockup.png" alt="St Hugh's College Vientiane" width={180} height={46} className="mb-10 block lg:hidden" style={{ width: 180, height: "auto" }} />
          <p className="eyebrow eyebrow-rule">Staff sign in</p>
          <h1 className="font-display mt-4 text-[2.5rem] leading-none text-fg">Welcome back.</h1>
          <p className="mb-8 mt-3 text-sm text-fg-muted">Access is limited to authorised staff. Activity is recorded in the audit log.</p>
          <div className="rounded-[var(--radius-lg)] border border-line bg-bg-raised p-6 shadow-[0_1px_2px_rgb(11_19_80/0.04),0_24px_48px_-28px_rgb(11_19_80/0.35)]">
            <span aria-hidden className="mb-5 block h-[3px] w-10 bg-route" />
            <LoginForm />
          </div>
          <p className="mt-6 text-center text-xs text-fg-subtle">Forgotten your password? Ask a super admin to reset it.</p>
        </div>
      </section>
    </main>
  );
}
