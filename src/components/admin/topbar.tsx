import { ExternalLink, LogOut } from "lucide-react";
import { ROLE_LABELS, type Role } from "@/lib/enums";
import { signOutAction } from "@/lib/admin/auth-actions";
import type { ReactNode } from "react";

export function Topbar({ user, menuButton }: { user: { name: string; email: string; role: string }; menuButton: ReactNode }) {
  const roleLabel = ROLE_LABELS[user.role as Role] ?? user.role;
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-4 border-b border-line bg-bg-raised/90 px-4 backdrop-blur-sm sm:px-6">
      <div className="flex items-center gap-3">
        {menuButton}
        <p className="hidden text-sm text-fg-muted sm:block">
          Signed in as <span className="font-medium text-fg">{user.name || user.email}</span>
          <span className="mx-2 text-fg-subtle" aria-hidden>
            ·
          </span>
          <span className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-fg-subtle">{roleLabel}</span>
        </p>
      </div>
      <div className="flex items-center gap-2">
        <a href="/" target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] px-3 text-sm text-fg-muted hover:bg-bg-hover hover:text-fg">
          View site
          <ExternalLink className="size-3.5" strokeWidth={1.5} aria-hidden />
        </a>
        <form action={signOutAction}>
          <button type="submit" className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] border border-line px-3 text-sm text-fg hover:bg-bg-hover">
            <LogOut className="size-3.5" strokeWidth={1.5} aria-hidden />
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
