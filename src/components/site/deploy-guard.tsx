"use client";

import { useEffect } from "react";

/**
 * Keeps a tab that was open across a deploy working (an old tab otherwise asks for files the new build replaced and
 * looks broken until someone refreshes).
 *  1. Recovery: a failed script/chunk load reloads the page once (never twice within a minute — no loops).
 *  2. Prevention: the tab checks /api/version when it becomes visible and every 5 minutes. If a newer build is live,
 *     the next link click does a full page load, and a hidden tab refreshes when the visitor returns to it.
 * Never reloads while a form has unsaved typing (enquiries, CMS edits): then it waits for the next navigation.
 */
const BUILD = process.env.NEXT_PUBLIC_BUILD_ID;
const KEY = "shv:auto-reload-at";
export const CHUNK_ERROR = /ChunkLoadError|Loading (CSS )?chunk [\w-]+ failed|Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i;

function reloadOnce(): boolean {
  try {
    const last = Number(sessionStorage.getItem(KEY) || 0);
    if (Date.now() - last < 60_000) return false;
    sessionStorage.setItem(KEY, String(Date.now()));
  } catch {
    /* storage unavailable: still reload once */
  }
  window.location.reload();
  return true;
}

/** Set by any typing/choosing in a form field (React keeps defaultValue in sync with controlled inputs, so the DOM
 *  comparison below alone cannot see typing in React forms). */
let typedSinceLoad = false;
export function noteTyping(e: Event) {
  const t = e.target;
  if (t instanceof HTMLInputElement && ["search", "hidden", "submit", "button"].includes(t.type)) return;
  if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t instanceof HTMLSelectElement || (t instanceof HTMLElement && t.isContentEditable)) typedSinceLoad = true;
}

export function hasUnsavedTyping(): boolean {
  if (typedSinceLoad) return true;
  for (const el of document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("input, textarea, select")) {
    if (el instanceof HTMLInputElement) {
      if (["hidden", "submit", "button", "search"].includes(el.type)) continue;
      if ((el.type === "checkbox" || el.type === "radio") && el.checked !== el.defaultChecked) return true;
      if (el.type !== "checkbox" && el.type !== "radio" && el.value !== el.defaultValue) return true;
    } else if (el instanceof HTMLTextAreaElement && el.value !== el.defaultValue) return true;
    else if (el instanceof HTMLSelectElement && [...el.options].some((o) => o.selected !== o.defaultSelected)) return true;
  }
  return false;
}

export function DeployGuard() {
  useEffect(() => {
    let stale = false;

    const onError = (e: Event) => {
      const t = e.target;
      if (t instanceof HTMLScriptElement && t.src.includes("/_next/")) reloadOnce();
      else if (t instanceof HTMLLinkElement && t.href.includes("/_next/") && t.rel === "stylesheet") reloadOnce();
      else if (e instanceof ErrorEvent && CHUNK_ERROR.test(e.message)) reloadOnce();
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      const msg = e.reason instanceof Error ? `${e.reason.name} ${e.reason.message}` : String(e.reason ?? "");
      if (CHUNK_ERROR.test(msg)) reloadOnce();
    };

    const check = async () => {
      if (!BUILD || stale) return;
      try {
        const res = await fetch("/api/version", { cache: "no-store" });
        const { build } = (await res.json()) as { build?: string | null };
        if (build && build !== BUILD) stale = true;
      } catch {
        /* offline or server restarting: try again later */
      }
    };

    const onVisible = async () => {
      if (document.visibilityState !== "visible") return;
      await check();
      if (stale && !hasUnsavedTyping()) reloadOnce();
    };

    // Same-origin link clicks become full page loads once a newer build is live (fresh files, no broken page).
    const onClick = (e: MouseEvent) => {
      if (!stale || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname.startsWith("/api/")) return;
      e.preventDefault();
      window.location.assign(url.toString());
    };

    document.addEventListener("input", noteTyping, true);
    document.addEventListener("change", noteTyping, true);
    window.addEventListener("error", onError, true);
    window.addEventListener("unhandledrejection", onRejection);
    document.addEventListener("visibilitychange", onVisible);
    document.addEventListener("click", onClick, true);
    const timer = window.setInterval(() => document.visibilityState === "visible" && void check(), 5 * 60_000);
    return () => {
      document.removeEventListener("input", noteTyping, true);
      document.removeEventListener("change", noteTyping, true);
      window.removeEventListener("error", onError, true);
      window.removeEventListener("unhandledrejection", onRejection);
      document.removeEventListener("visibilitychange", onVisible);
      document.removeEventListener("click", onClick, true);
      window.clearInterval(timer);
    };
  }, []);
  return null;
}
