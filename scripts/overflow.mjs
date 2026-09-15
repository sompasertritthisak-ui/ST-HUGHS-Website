import { chromium } from "playwright";
const base = "http://localhost:3000";
const pages = (process.argv[2] ?? "/programmes/ncuk-international-foundation-year,/pathway-explorer,/universities").split(",");
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
const page = await ctx.newPage();
const hydration = [];
page.on("console", (m) => { if (m.type() === "error") hydration.push(m.text()); });
for (const p of pages) {
  await page.goto(base + p, { waitUntil: "networkidle", timeout: 120000 });
  await page.waitForTimeout(800);
  const wide = await page.evaluate(() => {
    const vw = window.innerWidth; const out = [];
    for (const el of document.querySelectorAll("body *")) {
      const r = el.getBoundingClientRect();
      if (r.right > vw + 1 && r.width > 40) out.push(`${el.tagName.toLowerCase()}.${(el.className?.toString() ?? "").split(" ").slice(0, 4).join(".")} right=${Math.round(r.right)} w=${Math.round(r.width)}`);
    }
    return out.slice(0, 12);
  });
  console.log(p, wide);
}
console.log("HYDRATION:", hydration.map((h) => h.slice(0, 1500)).slice(0, 1));
await browser.close();
