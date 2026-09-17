import type { Metadata } from "next";
import type { ReactNode } from "react";
import { currentUser } from "@/lib/auth";
import { navForRole } from "@/components/admin/nav";
import { Sidebar } from "@/components/admin/sidebar";
import { Topbar } from "@/components/admin/topbar";
import { ToastProvider } from "@/components/admin/toast";

export const metadata: Metadata = {
  title: { default: "CMS", template: "%s — SHV CMS" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Admin shell. Unauthenticated visitors only ever reach /admin/login here
 * (middleware redirects every other admin route), so they get the bare light
 * wrapper; signed-in users get the sidebar + top bar.
 */

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await currentUser();
  if (!user) {
    return <div className="theme-light min-h-dvh bg-bg text-fg text-[0.9375rem]">{children}</div>;
  }
  const groups = navForRole(user.role);
  return (
    <div className="theme-light min-h-dvh bg-bg text-fg text-[0.9375rem]">
      <ToastProvider>
        <div className="flex min-h-dvh">
          <Sidebar groups={groups} />
          <div className="flex min-w-0 flex-1 flex-col">
            <Topbar user={user} menuButton={<span aria-hidden className="block w-11 lg:hidden" />} />
            <main id="main" className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
              <div className="mx-auto w-full max-w-[1320px]">{children}</div>
            </main>
          </div>
        </div>
      </ToastProvider>
    </div>
  );
}
