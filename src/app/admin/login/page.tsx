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
    <main id="main" className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3">
          <span aria-hidden className="h-px w-6 bg-route" />
          <p className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-fg-subtle">St Hugh&rsquo;s College Vientiane</p>
        </div>
        <h1 className="font-display text-4xl leading-none text-fg">Staff sign in</h1>
        <p className="mt-2 mb-8 text-sm text-fg-muted">Content management for the SHV digital campus. Access is limited to authorised staff.</p>
        <div className="rounded-[var(--radius)] border border-line bg-bg-raised p-6 shadow-sm">
          <LoginForm />
        </div>
        <p className="mt-6 text-center text-xs text-fg-subtle">Forgotten your password? Ask a super admin to reset it.</p>
      </div>
    </main>
  );
}
