#!/usr/bin/env node
/**
 * One-time copy updates for an already-seeded database (prisma/content-patches.json).
 *
 * The seed only runs on an empty database, so copy fixes made in prisma/seed.ts never reach a live site on their own.
 * This applies the same fixes to the database, once per patch version:
 *   • "replace": swap a phrase wherever it still appears, verbatim, in a content text field (JSON fields are walked so
 *     escaping stays valid). If an editor has already reworded that text in the CMS, the phrase is gone and nothing
 *     changes — CMS edits always win.
 *   • "set": change a short label only where the field still equals the old value exactly (optionally only on the
 *     record matching "where", e.g. { "slug": "…" }).
 * The applied version is recorded in SiteSetting "system.contentPatchVersion", so later starts skip it.
 * Usage: node scripts/apply-content-patches.mjs [--dry-run]
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const MODELS = [
  "programme", "programmeModule", "pathway", "pathwayStep", "destination", "university", "partner", "faq",
  "navigationItem", "document", "contentBlock", "siteSetting", "studentStory", "newsArticle", "event",
  "facility", "faculty", "outcomeMetric", "page", "media",
];
/** Identifiers and machine values are never rewritten. */
const SKIP = /^(id|slug|key|url|filename|mimeType|href|status|type|kind|category|code|isoCode|locale|template|visibility|.*Status|.*Id|.*At)$/;
const VERSION_KEY = "system.contentPatchVersion";

function swap(text, replace) {
  let out = text;
  for (const { old, new: next } of replace) if (out.includes(old)) out = out.split(old).join(next);
  return out;
}

function swapDeep(value, replace) {
  if (typeof value === "string") return swap(value, replace);
  if (Array.isArray(value)) return value.map((v) => swapDeep(v, replace));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, swapDeep(v, replace)]));
  return value;
}

function patchField(value, replace) {
  const t = value.trim();
  if ((t.startsWith("{") || t.startsWith("[")) && t.length > 1) {
    try {
      return JSON.stringify(swapDeep(JSON.parse(value), replace));
    } catch {
      /* not JSON — fall through */
    }
  }
  return swap(value, replace);
}

export async function applyContentPatches(prisma, { dryRun = false, log = console.log } = {}) {
  const file = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "prisma", "content-patches.json");
  const patch = JSON.parse(readFileSync(file, "utf8"));
  const done = await prisma.siteSetting.findUnique({ where: { key: VERSION_KEY } });
  if (done && JSON.parse(done.valueJson) === patch.version) {
    log(`[content-patches] ${patch.version} already applied`);
    return { applied: 0, skipped: true };
  }

  let applied = 0;
  for (const model of MODELS) {
    const delegate = prisma[model];
    if (!delegate) continue;
    const rows = await delegate.findMany();
    for (const row of rows) {
      const data = {};
      for (const [field, value] of Object.entries(row)) {
        if ((typeof value !== "string" && value !== null) || SKIP.test(field) || (model === "siteSetting" && row.key === VERSION_KEY)) continue;
        let next = value === null ? null : patchField(value, patch.replace);
        for (const s of patch.set) {
          if (s.model !== model || s.field !== field || next !== s.old) continue;
          if (s.where && Object.entries(s.where).some(([k, v]) => row[k] !== v)) continue; // rule scoped to one record
          next = s.new;
        }
        if (next !== value) data[field] = next;
      }
      if (Object.keys(data).length) {
        applied += Object.keys(data).length;
        log(`[content-patches] ${model} ${row.slug ?? row.key ?? row.id}: ${Object.keys(data).join(", ")}`);
        if (!dryRun) {
          const where = model === "siteSetting" ? { key: row.key } : { id: row.id };
          await delegate.update({ where, data });
        }
      }
    }
  }
  if (!dryRun) {
    await prisma.siteSetting.upsert({
      where: { key: VERSION_KEY },
      create: { key: VERSION_KEY, valueJson: JSON.stringify(patch.version) },
      update: { valueJson: JSON.stringify(patch.version) },
    });
  }
  log(`[content-patches] ${patch.version}: ${applied} field(s) ${dryRun ? "would change" : "updated"}`);
  return { applied, skipped: false };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  try {
    await applyContentPatches(prisma, { dryRun: process.argv.includes("--dry-run") });
  } finally {
    await prisma.$disconnect();
  }
}
