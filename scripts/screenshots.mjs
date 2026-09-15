import { chromium } from "playwright";
const out = process.env.SHOT_DIR ?? "/private/tmp/claude-501/-Users-top-ST-HUGHS-/5a2b2f5f-eca2-4d68-9d23-b5edc42750af/scratchpad/shots";
const base = "http://localhost:3000";
const pages = (process.argv[2] ?? "/,/programmes,/programmes/ncuk-international-foundation-year,/pathways/ify-business-united-kingdom,/pathway-explorer,/destinations,/universities,/admissions,/consultation,/for/parents,/campus,/faqs").split(",");
const widths = (process.argv[3] ?? "1440,390").split(",").map(Number);
const browser = await chromium.launch();
for (const w of widths) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 200)); });
  page.on("pageerror", (e) => errors.push("PAGEERROR " + e.message.slice(0, 200)));
  for (const p of pages) {
    await page.goto(base + p, { waitUntil: "networkidle", timeout: 120000 });
    await page.waitForTimeout(1200);
    // make every reveal visible for the full-page capture
    await page.evaluate(() => document.querySelectorAll(".reveal").forEach((e) => e.classList.add("is-visible")));
    await page.waitForTimeout(400);
    const name = (p === "/" ? "home" : p.replace(/^\//, "").replace(/[\/?=&]/g, "_")) + `_${w}.png`;
    await page.screenshot({ path: `${out}/${name}`, fullPage: true });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    console.log(`${w}px ${p} -> ${name}${overflow ? "  !! HORIZONTAL OVERFLOW" : ""}`);
  }
  if (errors.length) console.log(`console errors @${w}:`, [...new Set(errors)].slice(0, 10));
  await ctx.close();
}
await browser.close();
