"use client";

import type { AnalyticsEventName } from "./enums";

/**
 * Lightweight first-party analytics. Captures UTM parameters on first touch,
 * keeps an anonymous session id in sessionStorage, and posts events to
 * /api/analytics/events. No third-party scripts. Fails silently.
 */

const SESSION_KEY = "shv.sid";
const UTM_KEY = "shv.utm";

type Utm = { utmSource?: string; utmMedium?: string; utmCampaign?: string; referrer?: string };

function safeStorage(kind: "session" | "local"): Storage | null {
  try {
    return kind === "session" ? window.sessionStorage : window.localStorage;
  } catch {
    return null;
  }
}

export function getSessionId(): string | undefined {
  const s = safeStorage("session");
  if (!s) return undefined;
  let id = s.getItem(SESSION_KEY);
  if (!id) {
    id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now());
    s.setItem(SESSION_KEY, id);
  }
  return id;
}

export function captureUtm(): Utm {
  const s = safeStorage("session");
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const fresh: Utm = {
    utmSource: params.get("utm_source") ?? undefined,
    utmMedium: params.get("utm_medium") ?? undefined,
    utmCampaign: params.get("utm_campaign") ?? undefined,
    referrer: document.referrer || undefined,
  };
  if (fresh.utmSource || fresh.utmMedium || fresh.utmCampaign) {
    s?.setItem(UTM_KEY, JSON.stringify(fresh));
    return fresh;
  }
  try {
    const stored = s?.getItem(UTM_KEY);
    return stored ? (JSON.parse(stored) as Utm) : { referrer: fresh.referrer };
  } catch {
    return {};
  }
}

export function track(name: AnalyticsEventName, props: Record<string, string | number | boolean> = {}) {
  if (typeof window === "undefined") return;
  const body = JSON.stringify({
    name,
    path: window.location.pathname,
    props,
    sessionId: getSessionId(),
    ...captureUtm(),
  });
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/analytics/events", new Blob([body], { type: "application/json" }));
    } else {
      void fetch("/api/analytics/events", { method: "POST", headers: { "content-type": "application/json" }, body, keepalive: true });
    }
  } catch {
    /* analytics must never break the page */
  }
}
