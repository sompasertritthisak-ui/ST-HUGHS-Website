"use client";

import { useEffect, useRef, useState } from "react";
import { Languages, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Google Translate language menu.
 *
 * Uses Google's website translator with a custom, on-brand control instead of
 * the default widget. Choosing a language sets the `googtrans` cookie Google
 * reads (`/en/<lang>`) and reloads; on load, if a non-English language is set,
 * the translator script is injected and translates the page automatically.
 * The script is never loaded for English-only visitors (no third-party request).
 *
 * Machine translation is a convenience layer: the source of truth stays the
 * English content managed in the CMS (see the multilingual architecture note in
 * docs/ARCHITECTURE.md for the future Lao/Chinese/Vietnamese/Thai CMS locales).
 */

export const TRANSLATE_LANGUAGES = [
  { code: "en", label: "English", native: "English" },
  { code: "lo", label: "Lao", native: "ລາວ" },
  { code: "zh-CN", label: "Chinese (Simplified)", native: "中文" },
  { code: "vi", label: "Vietnamese", native: "Tiếng Việt" },
  { code: "th", label: "Thai", native: "ไทย" },
  { code: "fr", label: "French", native: "Français" },
  { code: "ko", label: "Korean", native: "한국어" },
  { code: "ja", label: "Japanese", native: "日本語" },
] as const;

type Code = (typeof TRANSLATE_LANGUAGES)[number]["code"];

const COOKIE = "googtrans";
const SCRIPT_ID = "shv-google-translate";

function readCookie(): Code {
  if (typeof document === "undefined") return "en";
  const m = document.cookie.match(/(?:^|;\s*)googtrans=\/en\/([^;]+)/);
  const code = m?.[1] ? decodeURIComponent(m[1]) : "en";
  return (TRANSLATE_LANGUAGES.some((l) => l.code === code) ? code : "en") as Code;
}

function writeCookie(code: Code) {
  const host = window.location.hostname;
  const domainPart = host && host !== "localhost" && !/^\d+\.\d+\.\d+\.\d+$/.test(host) ? `; domain=.${host.replace(/^www\./, "")}` : "";
  if (code === "en") {
    document.cookie = `${COOKIE}=; path=/; max-age=0`;
    document.cookie = `${COOKIE}=; path=/; max-age=0${domainPart}`;
    return;
  }
  const value = `${COOKIE}=/en/${code}; path=/; max-age=${60 * 60 * 24 * 180}; SameSite=Lax`;
  document.cookie = value;
  if (domainPart) document.cookie = value + domainPart;
}

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: { translate?: { TranslateElement?: new (opts: Record<string, unknown>, id: string) => unknown } };
  }
}

function loadTranslator() {
  if (document.getElementById(SCRIPT_ID)) return;
  window.googleTranslateElementInit = () => {
    const TE = window.google?.translate?.TranslateElement;
    if (!TE) return;
    new TE(
      { pageLanguage: "en", includedLanguages: TRANSLATE_LANGUAGES.map((l) => l.code).join(","), autoDisplay: false },
      "google_translate_element",
    );
  };
  const s = document.createElement("script");
  s.id = SCRIPT_ID;
  s.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
  s.async = true;
  document.body.appendChild(s);
}

export function TranslateMenu({ className, variant = "header" }: { className?: string; variant?: "header" | "drawer" | "footer" }) {
  const [current, setCurrent] = useState<Code>("en");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const code = readCookie();
    setCurrent(code);
    if (code !== "en") loadTranslator();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = (code: Code) => {
    writeCookie(code);
    setCurrent(code);
    setOpen(false);
    // Google's translator applies the cookie on page load; reload to (re)translate or restore English.
    window.location.reload();
  };

  const active = TRANSLATE_LANGUAGES.find((l) => l.code === current) ?? TRANSLATE_LANGUAGES[0];

  if (variant === "drawer") {
    return (
      <div className={cn("notranslate", className)} translate="no">
        <p className="eyebrow eyebrow-rule mb-3">Language</p>
        <ul className="grid grid-cols-2 gap-1">
          {TRANSLATE_LANGUAGES.map((l) => (
            <li key={l.code}>
              <button type="button" onClick={() => choose(l.code)} aria-pressed={l.code === current} className={cn("flex w-full items-center justify-between rounded-[var(--radius-sm)] px-2 py-2 text-left text-[0.9375rem]", l.code === current ? "text-fg" : "text-fg-muted hover:text-fg")}>
                <span>
                  {l.native}
                  {l.native !== l.label ? <span className="ml-2 text-xs text-fg-subtle">{l.label}</span> : null}
                </span>
                {l.code === current ? <Check aria-hidden className="size-4 text-brand-soft" strokeWidth={1.75} /> : null}
              </button>
            </li>
          ))}
        </ul>
        <div id="google_translate_element" className="hidden" aria-hidden />
      </div>
    );
  }

  return (
    <div ref={ref} className={cn("notranslate relative", className)} translate="no">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Language: ${active.label}. Change language`}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-[var(--radius-sm)] px-3 font-mono text-[0.6875rem] uppercase tracking-[0.14em] transition-colors",
          variant === "footer" ? "border border-line text-fg-muted hover:border-line-strong hover:text-fg" : "text-fg-muted hover:text-fg",
        )}
      >
        <Languages aria-hidden className="size-4" strokeWidth={1.5} />
        <span>{active.native}</span>
        <ChevronDown aria-hidden className={cn("size-3.5 transition-transform", open && "rotate-180")} strokeWidth={1.75} />
      </button>
      {open ? (
        <ul role="menu" aria-label="Choose a language" className={cn("surface-raised absolute z-50 w-56 rounded-[var(--radius)] p-1.5 anim-fade-up", variant === "footer" ? "bottom-12 left-0" : "right-0 top-12")}>
          {TRANSLATE_LANGUAGES.map((l) => (
            <li key={l.code} role="none">
              <button
                type="button"
                role="menuitemradio"
                aria-checked={l.code === current}
                onClick={() => choose(l.code)}
                className={cn("flex w-full items-center justify-between rounded-[var(--radius-sm)] px-3 py-2 text-left text-[0.9375rem] hover:bg-bg-hover", l.code === current ? "text-fg" : "text-fg-muted")}
              >
                <span>
                  {l.native}
                  {l.native !== l.label ? <span className="ml-2 text-xs text-fg-subtle">{l.label}</span> : null}
                </span>
                {l.code === current ? <Check aria-hidden className="size-4 text-brand-soft" strokeWidth={1.75} /> : null}
              </button>
            </li>
          ))}
          <li role="none" className="mt-1 border-t border-line px-3 pb-1 pt-2 text-[0.6875rem] leading-snug text-fg-subtle">
            Machine translation by Google. English is the official version.
          </li>
        </ul>
      ) : null}
      <div id="google_translate_element" className="hidden" aria-hidden />
    </div>
  );
}
