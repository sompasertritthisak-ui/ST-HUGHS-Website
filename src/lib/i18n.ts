import en from "@/content/en.json";

/**
 * Minimal i18n scaffold. English is the source language; every UI string used
 * by components goes through `t()` so nothing is hardcoded in JSX.
 *
 * Dictionaries are flat `key → value` maps (dotted keys such as "forms.name")
 * to mirror the `Translation` table (`locale`, `key`, `value`, unique per pair).
 *
 * How overrides will work (future work, no code path yet):
 *   1. `src/content/<locale>.json` ships the static baseline for a locale.
 *   2. Published `Translation` rows for that locale are loaded server-side and
 *      merged over the static dictionary with `createTranslator(locale, rows)`.
 *      A row therefore overrides the JSON value for the same key, and a missing
 *      key falls back to English, then to the key itself.
 *   3. The active locale will come from the URL segment (`/lo/...`) or the
 *      `Accept-Language` header, resolved once in the root layout.
 *
 * Safe to import from client and server components — no server-only imports.
 */

export const locales = ["en", "lo", "zh", "vi", "th"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const localeLabels: Record<Locale, string> = {
  en: "English",
  lo: "ລາວ",
  zh: "中文",
  vi: "Tiếng Việt",
  th: "ไทย",
};

export type Dictionary = Record<string, string>;
export type TranslationVars = Record<string, string | number>;

const dictionaries: Partial<Record<Locale, Dictionary>> = { en: en as Dictionary };

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

/** Replace `{name}` placeholders with the supplied vars. Unknown placeholders are left as-is. */
export function interpolate(template: string, vars?: TranslationVars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in vars ? String(vars[key]) : match));
}

/**
 * Build a translator for a locale. `overrides` (for example published
 * `Translation` rows) take precedence over the static dictionary, which falls
 * back to English, then to the key.
 */
export function createTranslator(locale: Locale = defaultLocale, overrides: Dictionary = {}) {
  const base = dictionaries[locale] ?? {};
  const fallback = dictionaries[defaultLocale] ?? {};
  return function translate(key: string, vars?: TranslationVars): string {
    const value = overrides[key] ?? base[key] ?? fallback[key] ?? key;
    return interpolate(value, vars);
  };
}

/** Default English translator. */
export const t = createTranslator(defaultLocale);

/** Convert `Translation` rows into an override dictionary. */
export function rowsToDictionary(rows: { key: string; value: string }[]): Dictionary {
  const out: Dictionary = {};
  for (const row of rows) out[row.key] = row.value;
  return out;
}
