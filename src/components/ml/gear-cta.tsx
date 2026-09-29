import { Link } from "@tanstack/react-router";
import { useEffect, useId, useRef } from "react";
import { LayoutGrid, Plus } from "lucide-react";
import { iconSize } from "@/lib/tokens";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

/*
 * Six strings under tension, low E to high e: thick to thin, spread on the left and pulled toward
 * a headstock off the right edge. Coordinates are in a 100 × 52 box stretched to the band.
 */
const STRINGS = [
  { left: 6, right: 17, width: 1.6 },
  { left: 14, right: 21, width: 1.35 },
  { left: 22, right: 25, width: 1.15 },
  { left: 30, right: 29, width: 0.95 },
  { left: 38, right: 33, width: 0.8 },
  { left: 46, right: 37, width: 0.65 },
];

const at = (s: (typeof STRINGS)[number], offset: number) =>
  `M0 ${s.left} Q50 ${(s.left + s.right) / 2 + offset} 100 ${s.right}`;

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .55 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

/**
 * The sell-your-gear banner on Market. Its texture is the subject's own: strings under tension
 * over a slow, turbulent smoke. The strings strum once when the card comes into view and again
 * whenever it's pressed, then damp to still — motion that answers something, never a loop.
 */
export function GearCta() {
  const band = useRef<SVGSVGElement>(null);
  const paths = useRef<(SVGPathElement | null)[]>([]);
  const frame = useRef(0);
  const smoke = `smoke-${useId().replace(/:/g, "")}`;
  const reducedMotion = usePrefersReducedMotion();

  function strum() {
    if (reducedMotion) return;
    cancelAnimationFrame(frame.current);
    const start = performance.now();
    const tick = (now: number) => {
      let moving = false;
      STRINGS.forEach((s, i) => {
        const path = paths.current[i];
        if (!path) return;
        // A strum crosses the strings one after another, low to high.
        const t = now - start - i * 45;
        const amp = t < 0 ? 0 : 7 * (1 - i * 0.08) * Math.exp(-t / 380);
        const offset = t < 0 ? 0 : amp * Math.sin((t / 1000) * 2 * Math.PI * (11 + i * 2.5));
        if (t < 0 || amp > 0.05) moving = true;
        path.setAttribute("d", at(s, offset * 2));
        path.style.opacity = String(0.16 + Math.min(0.45, amp * 0.06));
      });
      if (moving) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  }

  // One strum the first time the card is mostly on screen.
  useEffect(() => {
    const el = band.current;
    if (!el) return;
    const seen = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          strum();
          seen.disconnect();
        }
      },
      { threshold: 0.6 },
    );
    seen.observe(el);
    return () => {
      seen.disconnect();
      cancelAnimationFrame(frame.current);
    };
  }, []);

  return (
    <section
      onPointerDown={strum}
      className="relative isolate overflow-hidden rounded-3xl bg-ink text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.1),0_28px_56px_-22px_rgb(13_11_38/0.6)]"
    >
      {/* Turbulence: stretched fractal noise tinted magenta-violet, drifting slowly. */}
      <svg
        aria-hidden
        className="pointer-events-none absolute -inset-[20%] -z-10 h-[140%] w-[140%] animate-smoke"
      >
        <filter id={smoke} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.006 0.018" numOctaves="3" seed="11" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.62  0 0 0 0 0.24  0 0 0 0 0.52  0 0 0 1.35 -0.62"
          />
        </filter>
        <rect width="100%" height="100%" filter={`url(#${smoke})`} />
      </svg>
      {/* Light from the top left, so the card has a near and a far edge. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(90%_70%_at_0%_0%,rgb(255_255_255/0.12),transparent_60%)]"
      />
      {/* Film grain: the ink reads as a material, not a flat fill. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-20 mix-blend-overlay"
        style={{ backgroundImage: GRAIN }}
      />

      <div className="px-5 pb-5 pt-5">
        <h2 className="text-3 font-extrabold leading-tight tracking-[-0.02em]">
          Gear gathering dust?
        </h2>
        <p className="mt-1 text-sm text-white/80">List it free on MusicLinkd.</p>

        <svg
          ref={band}
          aria-hidden
          viewBox="0 0 100 52"
          preserveAspectRatio="none"
          className="-mx-5 mt-3 block h-10 w-[calc(100%+2.5rem)]"
        >
          {STRINGS.map((s, i) => (
            <path
              key={s.left}
              ref={(el) => {
                paths.current[i] = el;
              }}
              d={at(s, 0)}
              fill="none"
              stroke="white"
              strokeWidth={s.width}
              vectorEffect="non-scaling-stroke"
              style={{ opacity: 0.16 }}
            />
          ))}
        </svg>

        {/* Each button answers its own state: hover and keyboard focus move its icon, a press
            sinks the button, and the spring brings it back. */}
        <div className="mt-3 flex gap-2">
          <Link
            to="/marketplace/sell"
            className="group/cta state-layer inline-flex min-h-touch flex-1 items-center justify-center gap-2 rounded-full bg-brand-button text-sm font-semibold text-white outline-none transition-[scale,box-shadow] duration-300 ease-spring hover:shadow-[0_6px_18px_-6px_rgb(234_76_137/0.7)] focus-visible:ring-2 focus-visible:ring-white/80 active:scale-95"
          >
            <Plus
              size={iconSize.sm}
              strokeWidth={2.4}
              aria-hidden
              className="transition-transform duration-300 ease-spring group-hover/cta:rotate-90 group-focus-visible/cta:rotate-90"
            />
            List Gear
          </Link>
          <Link
            to="/marketplace/mine"
            className="group/cta state-layer inline-flex min-h-touch flex-1 items-center justify-center gap-2 rounded-full bg-white/10 text-sm font-semibold text-white outline-none ring-1 ring-inset ring-white/25 backdrop-blur transition-[scale,background-color] duration-300 ease-spring hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white/80 active:scale-95"
          >
            <LayoutGrid
              size={iconSize.sm}
              strokeWidth={2.2}
              aria-hidden
              className="transition-transform duration-300 ease-spring group-hover/cta:-rotate-12 group-hover/cta:scale-115 group-focus-visible/cta:-rotate-12 group-focus-visible/cta:scale-115"
            />
            My Listings
          </Link>
        </div>
      </div>
    </section>
  );
}
