"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ActionState } from "@/lib/admin-ops/types";

type SubmitButtonProps = {
  children: ReactNode;
  pendingLabel?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  className?: string;
  name?: string;
  value?: string;
};

/** Submit button that disables itself while the enclosing form is pending. */
export function SubmitButton({ children, pendingLabel, variant = "primary", size = "sm", className, name, value }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} size={size} className={className} disabled={pending} aria-busy={pending} name={name} value={value}>
      {pending ? (
        <>
          <Loader2 aria-hidden className="size-4 animate-spin" strokeWidth={1.75} />
          {pendingLabel ?? "Saving…"}
        </>
      ) : (
        children
      )}
    </Button>
  );
}

/** Announces the outcome of a server action. Always rendered so the live region exists before the message arrives. */
export function FormStatus({ state, className }: { state: ActionState; className?: string }) {
  const tone = state.message ? (state.ok ? "border-success/50 bg-success/10 text-fg" : "border-danger/50 bg-danger/10 text-fg") : "";
  return (
    <div role="status" aria-live="polite" className={cn("text-sm", state.message && `rounded-[var(--radius-sm)] border px-3 py-2 ${tone}`, className)}>
      {state.message ?? null}
      {!state.ok && state.errors?._form ? <p className="mt-1 text-danger">{state.errors._form}</p> : null}
    </div>
  );
}

/** Inline field error; id follows the `${name}-error` convention for aria-describedby. */
export function FieldError({ name, errors }: { name: string; errors?: Record<string, string> }) {
  const msg = errors?.[name];
  if (!msg) return null;
  return (
    <p id={`${name}-error`} role="alert" className="text-sm text-danger">
      {msg}
    </p>
  );
}
