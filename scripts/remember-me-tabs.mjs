// Remember me (unticked) across tabs, both paths, on a running build (queue item 2, 4 Oct 2026).
//   bun run build; serve .output/server with wrangler dev on :8799; node scripts/remember-me-tabs.mjs
import { chromium } from "playwright";
const URL = "http://localhost:8799/welcome";
const b = await chromium.launch();
const state = (p) =>
  p.evaluate(() => ({
    alive: sessionStorage.getItem("ml:session-alive"),
    forget: localStorage.getItem("ml:forget-on-close"),
  }));

// Path 1: a tab is open (marker set), its heartbeat is stale, a new tab opens.
const ctx = await b.newContext();
const a = await ctx.newPage();
await a.goto(URL, { waitUntil: "networkidle" });
await a.evaluate(() => {
  localStorage.setItem("ml:forget-on-close", "1");
  sessionStorage.setItem("ml:session-alive", "1");
});
await a.reload({ waitUntil: "networkidle" }); // tab A boots with the marker: answers on the channel
await a.waitForTimeout(500);
const bTab = await ctx.newPage();
await bTab.addInitScript(() => {
  try {
    localStorage.setItem("ml:session-beat", "0");
  } catch {}
}); // stale heartbeat
await bTab.goto(URL, { waitUntil: "networkidle" });
await bTab.waitForTimeout(800);
console.log(
  "second tab, other tab open:",
  JSON.stringify(await state(bTab)),
  "→ expect alive=1, forget=1",
);

// Path 2: nothing else open (browser was closed): fresh context with the flag, no marker, stale beat.
const ctx2 = await b.newContext();
const c = await ctx2.newPage();
await c.addInitScript(() => {
  try {
    if (!sessionStorage.getItem("seeded")) {
      localStorage.setItem("ml:forget-on-close", "1");
      localStorage.setItem("ml:session-beat", "0");
      sessionStorage.setItem("seeded", "1");
    }
  } catch {}
});
await c.goto(URL, { waitUntil: "networkidle" });
await c.waitForTimeout(800);
console.log(
  "reopened, no other tab:",
  JSON.stringify(await state(c)),
  "→ expect alive=null, forget=null (signed out)",
);
await b.close();
