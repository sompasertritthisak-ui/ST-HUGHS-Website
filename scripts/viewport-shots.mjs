import { chromium } from "playwright";
const out = process.env.SHOT_DIR ?? "/private/tmp/claude-501/-Users-top-ST-HUGHS-/5a2b2f5f-eca2-4d68-9d23-b5edc42750af/scratchpad/shots";
const [path = "/", width = "1440", step = "900", max = "16"] = process.argv.slice(2);
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: Number(width), height: 900 }, reducedMotion: "reduce" });
const page = await ctx.newPage();
const logs = [];
page.on("console", (m) => { if (m.type() === "error") logs.push(m.text()); });
await page.goto("http://localhost:3000" + path, { waitUntil: "networkidle", timeout: 120000 });
await page.waitForTimeout(1500);
await page.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; });
const total = await page.evaluate(() => document.documentElement.scrollHeight);
const slug = (path === "/" ? "home" : path.replace(/^\//, "").replace(/[\/?=&]/g, "_"));
let i = 0;
for (let y = 0; y < total && i < Number(max); y += Number(step), i++) {
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${out}/${slug}_${width}_${String(i).padStart(2, "0")}.png` });
}
console.log(`captured ${i} frames of ${total}px for ${path} @${width}`);
if (logs.length) console.log("CONSOLE:\n" + logs.join("\n---\n").slice(0, 6000));
await browser.close();
