import Link from "next/link";
import { ExternalLink, LogOut } from "lucide-react";
import { ROLE_LABELS, type Role } from "@/lib/enums";
import { signOutAction } from "@/lib/admin/auth-actions";
import type { ReactNode } from "react";

/** Slim white bar: who is signed in, the live site, sign out. The brand lives in the sidebar. */
export function Topbar({ user, menuButton }: { user: { name: string; email: string; role: string }; menuButton: ReactNode }) {
  const roleLabel = ROLE_LABELS[user.role as Role] ?? user.role;
  return (
    <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between gap-4 border-b border-line bg-bg-raised/85 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        {menuButton}
        <p className="hidden min-w-0 items-center gap-2 text-sm text-fg-muted sm:flex">
          <span aria-hidden className="h-px w-5 bg-route" />
          <span className="truncate">
            Signed in as <span className="font-semibold text-fg">{user.name || user.email}</span>
          </span>
          <span className="rounded-full border border-line px-2 py-0.5 font-mono text-[0.5625rem] uppercase tracking-[0.16em] text-fg-subtle">{roleLabel}</span>
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Link href="/" target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-1.5 rounded-[var(--radius-sm)] px-3 text-sm font-medium text-fg-muted transition-colors hover:bg-bg-hover hover:text-fg">
          View site
          <ExternalLink className="size-3.5" strokeWidth={1.6} aria-hidden />
        </Link>
        <form action={signOutAction}>
          <button type="submit" className="inline-flex h-10 items-center gap-1.5 rounded-[var(--radius-sm)] border border-line bg-bg px-3.5 text-sm font-medium text-fg transition-colors hover:border-fg">
            <LogOut className="size-3.5" strokeWidth={1.6} aria-hidden />
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
