"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActionState } from "@/lib/admin/types";

type Tone = "success" | "error";
interface Toast {
  id: number;
  message: string;
  tone: Tone;
}

const ToastContext = createContext<{ push: (message: string, tone?: Tone) => void } | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);
  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const push = useCallback(
    (message: string, tone: Tone = "success") => {
      const id = ++counter.current;
      setToasts((t) => [...t.slice(-3), { id, message, tone }]);
      window.setTimeout(() => dismiss(id), tone === "success" ? 4000 : 8000);
    },
    [dismiss],
  );
  const value = useMemo(() => ({ push }), [push]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-live="polite" aria-atomic="false" className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-end gap-2 sm:inset-x-auto sm:right-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.tone === "error" ? "alert" : "status"}
            className={cn(
              "pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-[var(--radius)] border bg-bg-raised px-3.5 py-3 text-sm text-fg shadow-sm anim-fade-up",
              t.tone === "error" ? "border-danger/50" : "border-success/50",
            )}
          >
            {t.tone === "error" ? <AlertCircle className="mt-0.5 size-4 shrink-0 text-danger" strokeWidth={1.5} aria-hidden /> : <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" strokeWidth={1.5} aria-hidden />}
            <p className="flex-1">{t.message}</p>
            <button type="button" onClick={() => dismiss(t.id)} className="-m-1 rounded p-1 text-fg-subtle hover:text-fg" aria-label="Dismiss">
              <X className="size-3.5" strokeWidth={1.5} aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  return ctx ?? { push: () => undefined };
}

/** Announce the result of a server action whenever its state changes. */
export function useActionToast(state: ActionState) {
  const { push } = useToast();
  const last = useRef<ActionState | null>(null);
  useEffect(() => {
    if (state === last.current || !state.message) return;
    last.current = state;
    push(state.message, state.ok ? "success" : "error");
  }, [state, push]);
}
