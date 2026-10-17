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

export function Panel({ title, description, children, className, action, padded = true }: { title?: string; description?: string; children: ReactNode; className?: string; action?: ReactNode; padded?: boolean }) {
  return (
    <section className={cn("rounded-[var(--radius-lg)] border border-line/80 bg-bg-raised shadow-[0_1px_2px_rgb(11_19_80/0.04),0_12px_32px_-20px_rgb(11_19_80/0.25)]", className)}>
      {title ? (
        <header className="flex items-start justify-between gap-3 px-5 pb-3 pt-5">
          <div>
            <h2 className="flex items-center gap-2.5 text-[0.9375rem] font-semibold text-fg">
              <span aria-hidden className="h-px w-4 bg-route" />
              {title}
            </h2>
            {description ? <p className="mt-1 text-sm text-fg-muted">{description}</p> : null}
          </div>
          {action}
        </header>
      ) : null}
      <div className={cn(padded && "px-5 pb-5", padded && !title && "pt-5")}>{children}</div>
    </section>
  );
}
