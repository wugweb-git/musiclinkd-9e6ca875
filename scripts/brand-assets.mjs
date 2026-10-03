// Brand assets, generated from the one mark: the path data in `LogoMark` (src/components/ml/logo.tsx)
// and the colours in src/styles.css. Nothing here is drawn by hand — change the mark there and run
// this again. The treatment is the splash's (29ff7bb): the mark in brand pink on ink.
//
//   node scripts/brand-assets.mjs
//
// Writes the web icons (favicon .svg/.ico, apple-touch-icon, manifest icons) to public/, and the
// Android launcher icons (legacy, round, adaptive foreground) and splash drawables to android/.
import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "node:fs";

const logo = readFileSync("src/components/ml/logo.tsx", "utf8");
const paths = [...logo.matchAll(/\sd="([^"]+)"/g)].map((m) => m[1]);
if (paths.length !== 3)
  throw new Error(`expected the mark's 3 paths in logo.tsx, found ${paths.length}`);

const css = readFileSync("src/styles.css", "utf8");
const token = (name) => {
  const m = css.match(new RegExp(`^\\s*--${name}:\\s*(#[0-9a-f]{6})`, "im"));
  if (!m) throw new Error(`--${name} not found in styles.css`);
  return m[1];
};
const INK = token("ink");
const BRAND = token("brand");

const browser = await chromium.launch();
const page = await browser.newPage();

// The mark's drawn extent inside its 2204×1340 viewBox, so it is centred on what is visible.
await page.setContent(
  `<svg id="m" viewBox="0 0 2204 1340">${paths.map((d) => `<path d="${d}"/>`).join("")}</svg>`,
);
const box = await page.evaluate(() => {
  const r = document.getElementById("m").getBBox();
  return { x: r.x, y: r.y, w: r.width, h: r.height };
});

/**
 * One square or rectangular image: an optional ground and the mark centred on it.
 * `mark` is the mark's width as a share of the image's shorter side.
 */
function svg({ w, h = w, ground = "square", radius = 0, mark, glow = false }) {
  const short = Math.min(w, h);
  const scale = (short * mark) / box.w;
  const tx = w / 2 - (box.x + box.w / 2) * scale;
  const ty = h / 2 - (box.y + box.h / 2) * scale;
  const bg =
    ground === "square"
      ? `<rect width="${w}" height="${h}" rx="${radius * short}" fill="${INK}"/>`
      : ground === "circle"
        ? `<circle cx="${w / 2}" cy="${h / 2}" r="${short / 2}" fill="${INK}"/>`
        : "";
  // The splash's haze: brand light behind the mark, falling off to the ink ground.
  const haze = glow
    ? `<defs><radialGradient id="g"><stop offset="0" stop-color="${BRAND}" stop-opacity="0.32"/><stop offset="1" stop-color="${BRAND}" stop-opacity="0"/></radialGradient></defs>` +
      `<ellipse cx="${w / 2}" cy="${h / 2}" rx="${short * mark * 0.95}" ry="${short * mark * 0.75}" fill="url(#g)"/>`
    : "";
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">` +
    bg +
    haze +
    `<g transform="translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${scale.toFixed(6)})" fill="${BRAND}">` +
    paths.map((d) => `<path d="${d}"/>`).join("") +
    `</g></svg>`
  );
}

async function png(spec) {
  const w = spec.w;
  const h = spec.h ?? spec.w;
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(
    `<html><body style="margin:0;background:transparent">${svg(spec)}</body></html>`,
  );
  return page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: w, height: h } });
}

const written = [];
async function out(file, spec) {
  writeFileSync(file, await png(spec));
  written.push(file);
}

// ── Web ──────────────────────────────────────────────────────────────────────────────────────
// Rounded ink tile wherever the platform shows the image as-is; a full square where the platform
// applies its own mask (iOS home screen, maskable manifest icon).
const TILE = { ground: "square", radius: 0.22 };

writeFileSync("public/favicon.svg", svg({ w: 512, ...TILE, mark: 0.78 }) + "\n");
written.push("public/favicon.svg");

// .ico holding PNG entries at 16, 32 and 48. At 16px the mark takes more of the tile to stay legible.
const icoSizes = [16, 32, 48];
const icoPngs = [];
for (const s of icoSizes) icoPngs.push(await png({ w: s, ...TILE, mark: s === 16 ? 0.86 : 0.8 }));
{
  const header = Buffer.alloc(6 + 16 * icoPngs.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(icoPngs.length, 4);
  let offset = header.length;
  icoPngs.forEach((buf, i) => {
    const e = 6 + 16 * i;
    header.writeUInt8(icoSizes[i], e);
    header.writeUInt8(icoSizes[i], e + 1);
    header.writeUInt16LE(1, e + 4);
    header.writeUInt16LE(32, e + 6);
    header.writeUInt32LE(buf.length, e + 8);
    header.writeUInt32LE(offset, e + 12);
    offset += buf.length;
  });
  writeFileSync("public/favicon.ico", Buffer.concat([header, ...icoPngs]));
  written.push("public/favicon.ico");
}

await out("public/apple-touch-icon.png", { w: 180, ground: "square", mark: 0.66 });
await out("public/icon-192.png", { w: 192, ...TILE, mark: 0.72 });
await out("public/icon-512.png", { w: 512, ...TILE, mark: 0.72 });
// Maskable: everything inside the 80% safe circle (the mark's diagonal at 0.6 is ~0.70).
await out("public/icon-maskable-512.png", { w: 512, ground: "square", mark: 0.6 });

// ── Android ──────────────────────────────────────────────────────────────────────────────────
const res = "android/app/src/main/res";
const dpi = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
for (const [name, k] of Object.entries(dpi)) {
  // Legacy launcher (pre-8.0) and round launcher, 48dp.
  await out(`${res}/mipmap-${name}/ic_launcher.png`, { w: 48 * k, ...TILE, mark: 0.7 });
  await out(`${res}/mipmap-${name}/ic_launcher_round.png`, {
    w: 48 * k,
    ground: "circle",
    mark: 0.66,
  });
  // Adaptive foreground, 108dp, transparent; the mark stays inside the 66dp safe circle
  // (its diagonal at 0.5 of 108dp is ~63dp). The ink ground is @color/ic_launcher_background.
  await out(`${res}/mipmap-${name}/ic_launcher_foreground.png`, {
    w: 108 * k,
    ground: "none",
    mark: 0.5,
  });
}

// Splash drawables at the sizes Capacitor generated: ink ground, the mark with its haze.
const splash = {
  "drawable/splash.png": [480, 320],
  "drawable-port-mdpi/splash.png": [320, 480],
  "drawable-port-hdpi/splash.png": [480, 800],
  "drawable-port-xhdpi/splash.png": [720, 1280],
  "drawable-port-xxhdpi/splash.png": [960, 1600],
  "drawable-port-xxxhdpi/splash.png": [1280, 1920],
  "drawable-land-mdpi/splash.png": [480, 320],
  "drawable-land-hdpi/splash.png": [800, 480],
  "drawable-land-xhdpi/splash.png": [1280, 720],
  "drawable-land-xxhdpi/splash.png": [1600, 960],
  "drawable-land-xxxhdpi/splash.png": [1920, 1280],
};
for (const [file, [w, h]] of Object.entries(splash)) {
  await out(`${res}/${file}`, { w, h, ground: "square", mark: 0.36, glow: true });
}

await browser.close();
console.log(`mark bbox ${JSON.stringify(box)}; ink ${INK}, brand ${BRAND}`);
console.log(`${written.length} files:\n${written.join("\n")}`);
