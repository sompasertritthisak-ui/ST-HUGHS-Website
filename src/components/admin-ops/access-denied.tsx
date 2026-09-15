import { ShieldAlert } from "lucide-react";

export function AccessDenied({ area = "this area" }: { area?: string }) {
  return (
    <section aria-labelledby="access-denied-title" className="mx-auto mt-10 max-w-lg rounded-[var(--radius)] border border-line bg-bg-raised p-8 text-center shadow-sm">
      <ShieldAlert aria-hidden className="mx-auto size-8 text-fg-muted" strokeWidth={1.5} />
      <h1 id="access-denied-title" className="font-display mt-4 text-3xl text-fg">
        You do not have access to {area}
      </h1>
      <p className="mt-3 text-sm text-fg-muted">
        Your role does not include this permission. Ask a super admin if you believe you should have it.
      </p>
    </section>
  );
}
