"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics-client";
import { ANALYTICS_EVENTS, type AnalyticsEventName } from "@/lib/enums";

/**
 * Global click delegation: any element with `data-analytics="<event>"`
 * (optionally `data-analytics-label`) is tracked when clicked, with its href.
 * Lets server components emit analytics without becoming client components.
 */
export function AnalyticsDelegation() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-analytics]");
      if (!target) return;
      const name = target.dataset.analytics as AnalyticsEventName | undefined;
      if (!name || !(ANALYTICS_EVENTS as readonly string[]).includes(name)) return;
      const href = target.getAttribute("href") ?? "";
      track(name, { href, label: target.dataset.analyticsLabel ?? target.textContent?.trim().slice(0, 80) ?? "" });
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);
  return null;
}
