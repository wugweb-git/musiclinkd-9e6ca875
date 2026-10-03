// The rendering gate (brief §5): every screen below at 360, 412 and 640px, on a running build.
// For each it saves a screenshot and reports horizontal overflow and controls whose touch area is
// under 48px (the drawn box, or the `hit-area` ::after when the control has one).
//
//   bun run build, serve it (wrangler dev on .output/server), then:
//   node scripts/render-gate.mjs http://localhost:8799 "Claude outputs/render-gate"
//
// Signed-out only: it has no account. The Android shell's insets (env(safe-area-inset-*)) can't
// be emulated in a desktop browser; those are checked in the shell itself.
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const base = process.argv[2] ?? "http://localhost:8799";
const out = process.argv[3] ?? "render-gate";
const widths = [360, 412, 640];
const routes = (process.env.ROUTES ?? "").split(",").filter(Boolean);

mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const report = [];

for (const width of widths) {
  const page = await browser.newPage({ viewport: { width, height: 915 }, deviceScaleFactor: 1 });
  for (const route of routes) {
    const res = await page.goto(base + route, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(800);
    const result = await page.evaluate(() => {
      const overflow = document.documentElement.scrollWidth - window.innerWidth;
      const small = [];
      const sel =
        'a[href], button, input:not([type="hidden"]), select, textarea, [role="button"], [role="tab"], [role="radio"]';
      for (const el of document.querySelectorAll(sel)) {
        // A field inside a pill (search) is reached through the pill: measure the label around it.
        const box = el.matches("input, textarea, select") ? (el.closest("label") ?? el) : el;
        const r = box.getBoundingClientRect();
        const style = getComputedStyle(el);
        if (!r.width || !r.height || style.visibility === "hidden" || style.display === "none")
          continue;
        if (el.closest('[aria-hidden="true"], [inert]')) continue;
        // Inline text links inside a sentence are exempt (WCAG 2.5.8 inline exception).
        if (el.tagName === "A" && style.display === "inline" && el.closest("p, li")) continue;
        const after = getComputedStyle(el, "::after");
        const aw = parseFloat(after.width) || 0;
        const ah = parseFloat(after.height) || 0;
        const w = Math.max(r.width, aw);
        const h = Math.max(r.height, ah);
        if (w < 47.5 || h < 47.5) {
          const name = (
            el.getAttribute("aria-label") ||
            el.textContent ||
            el.getAttribute("placeholder") ||
            el.tagName
          )
            .trim()
            .slice(0, 40);
          small.push(`${name} (${Math.round(w)}×${Math.round(h)})`);
        }
      }
      return { overflow, small: [...new Set(small)] };
    });
    const file = `${out}/${width}${route.replace(/[^a-z0-9]+/gi, "_")}.png`;
    await page.screenshot({ path: file });
    report.push({ width, route, status: res?.status() ?? 0, ...result, file });
  }
  await page.close();
}
await browser.close();
writeFileSync(`${out}/report.json`, JSON.stringify(report, null, 2));
for (const r of report) {
  console.log(
    `${r.width} ${r.route} ${r.status} overflow=${r.overflow} small=${r.small.length}${r.small.length ? ": " + r.small.slice(0, 6).join("; ") : ""}`,
  );
}
