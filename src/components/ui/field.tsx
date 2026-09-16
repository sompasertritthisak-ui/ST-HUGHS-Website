import { cn } from "@/lib/utils";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

const control =
  "w-full rounded-[var(--radius-sm)] border border-line-strong bg-transparent px-3.5 text-[1rem] text-fg placeholder:text-fg-subtle focus:border-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 disabled:opacity-50 aria-[invalid=true]:border-danger";

export function Field({ label, htmlFor, hint, error, required, children, className }: { label: string; htmlFor: string; hint?: ReactNode; error?: string | null; required?: boolean; children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-fg">
        {label}
        {required ? <span aria-hidden className="ml-1 text-brand-soft">*</span> : null}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="text-sm text-fg-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function Input({ className, ...props }: ComponentPropsWithoutRef<"input">) {
  return <input className={cn(control, "h-12", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentPropsWithoutRef<"textarea">) {
  return <textarea className={cn(control, "min-h-32 py-3 leading-relaxed", className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentPropsWithoutRef<"select">) {
  return (
    <select className={cn(control, "h-12 appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23b9bfcb%27 stroke-width=%271.5%27><path d=%27m6 9 6 6 6-6%27/></svg>')] bg-[length:16px] bg-[position:right_0.875rem_center] bg-no-repeat pr-10 [&>option]:bg-bg-raised [&>option]:text-fg", className)} {...props}>
      {children}
    </select>
  );
}

export function Checkbox({ className, ...props }: ComponentPropsWithoutRef<"input">) {
  return <input type="checkbox" className={cn("size-5 shrink-0 rounded-[3px] border border-line-strong bg-transparent accent-[var(--color-brand)] focus-visible:ring-2 focus-visible:ring-ring/60", className)} {...props} />;
}
