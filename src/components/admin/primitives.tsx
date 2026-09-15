"use client";

import { useFormStatus } from "react-dom";
import { useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActionState } from "@/lib/admin/types";
import { buttonClass } from "./button-class";

export { buttonClass };

/** Submit button that reflects pending state of the surrounding form. */
export function SubmitButton({ children, variant = "primary", size = "md", className, disabled }: { children: ReactNode; variant?: "primary" | "secondary" | "danger"; size?: "sm" | "md"; className?: string; disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending || disabled} aria-busy={pending} className={cn(buttonClass(variant, size), className)}>
      {pending ? <Loader2 className="size-4 animate-spin" strokeWidth={1.5} aria-hidden /> : null}
      {children}
    </button>
  );
}


/** Inline, aria-live message for a server action result. */
export function ActionMessage({ state, className }: { state: ActionState; className?: string }) {
  if (!state.message) return <p className="sr-only" role="status" aria-live="polite" />;
  return (
    <p role={state.ok ? "status" : "alert"} aria-live="polite" className={cn("text-sm", state.ok ? "text-success" : "text-danger", className)}>
      {state.message}
    </p>
  );
}

/**
 * Two-step destructive control: the first click arms it, the second submits.
 * Must be rendered inside a <form> whose action performs the destructive work.
 */
export function ConfirmSubmit({ label, confirmLabel = "Yes, do it", description, size = "md" }: { label: string; confirmLabel?: string; description?: string; size?: "sm" | "md" }) {
  const [armed, setArmed] = useState(false);
  if (!armed) {
    return (
      <button type="button" onClick={() => setArmed(true)} className={buttonClass("danger", size)}>
        {label}
      </button>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={`Confirm: ${label}`}>
      {description ? <span className="w-full text-sm text-fg-muted">{description}</span> : null}
      <SubmitButton variant="danger" size={size}>
        {confirmLabel}
      </SubmitButton>
      <button type="button" onClick={() => setArmed(false)} className={buttonClass("ghost", size)}>
        Cancel
      </button>
    </div>
  );
}

export function Panel({ title, children, className, action }: { title?: string; children: ReactNode; className?: string; action?: ReactNode }) {
  return (
    <section className={cn("rounded-[var(--radius)] border border-line bg-bg-raised shadow-sm", className)}>
      {title ? (
        <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
          <h2 className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-fg-subtle">{title}</h2>
          {action}
        </header>
      ) : null}
      <div className="p-4">{children}</div>
    </section>
  );
}
