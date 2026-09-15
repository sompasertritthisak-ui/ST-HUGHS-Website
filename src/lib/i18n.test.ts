// @vitest-environment node
import { describe, it, expect } from "vitest";
import en from "@/content/en.json";
import { t, createTranslator, interpolate, locales, defaultLocale, isLocale, rowsToDictionary } from "./i18n";

describe("i18n", () => {
  it("returns English strings and falls back to the key", () => {
    expect(t("forms.name")).toBe("Full name");
    expect(t("does.not.exist")).toBe("does.not.exist");
  });

  it("interpolates variables and leaves unknown placeholders", () => {
    expect(interpolate("Hi {name}, {n} left {x}", { name: "Ann", n: 2 })).toBe("Hi Ann, 2 left {x}");
    expect(t("forms.success.body", { id: "abc" })).toContain("abc");
  });

  it("lets Translation rows override the dictionary and falls back to English", () => {
    const lo = createTranslator("lo", rowsToDictionary([{ key: "forms.name", value: "ຊື່ເຕັມ" }]));
    expect(lo("forms.name")).toBe("ຊື່ເຕັມ");
    expect(lo("forms.email")).toBe(en["forms.email"]);
  });

  it("declares the planned locales", () => {
    expect(locales).toEqual(["en", "lo", "zh", "vi", "th"]);
    expect(defaultLocale).toBe("en");
    expect(isLocale("lo")).toBe(true);
    expect(isLocale("fr")).toBe(false);
  });

  it("has no empty values in en.json", () => {
    for (const [k, v] of Object.entries(en)) expect(v, k).not.toBe("");
  });
});
