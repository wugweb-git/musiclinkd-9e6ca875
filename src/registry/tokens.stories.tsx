import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useState, type ReactNode } from "react";
import { Bell, Heart, Music, Star, User } from "lucide-react";

/*
 * The token pages: every scale the app ships, read live from the stylesheet rather than retyped.
 * Change a value in styles.css and these tables change with it, which is the point — a token page
 * that is transcribed by hand goes stale the first time someone edits the CSS.
 *
 * The owner's four-step reference spec, and the audit of ours against it, live in
 * docs/token-scale-spec-2026-09-16.md. This is the mapping side of that document.
 */

function useVar(name: string): string {
  const [value, setValue] = useState("");
  useEffect(() => {
    const read = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    setValue(read);
  }, [name]);
  return value;
}

function Page({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl px-5 py-6">
      <h1 className="text-3">{title}</h1>
      <p className="mt-1 max-w-prose text-sm text-muted-foreground">{intro}</p>
      <div className="mt-6 space-y-8">{children}</div>
    </div>
  );
}

function Row({
  name,
  note,
  children,
}: {
  name: string;
  note?: string | undefined;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 border-b border-border py-3 last:border-0">
      <div className="w-40 shrink-0">
        <code className="text-1 font-semibold">{name}</code>
        {note ? <p className="text-1 text-muted-foreground">{note}</p> : null}
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function Measured({ name }: { name: string }) {
  const value = useVar(name);
  return <span className="text-1 tabular-nums text-muted-foreground">{value || "—"}</span>;
}

const meta = {
  title: "Foundations/Tokens",
  parameters: { layout: "fullscreen" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

/* ── Type ───────────────────────────────────────────────────── */

const typeSteps = [
  {
    token: "--type-1",
    utility: "text-1",
    role: "Labels, eyebrows, meta, captions. What `pill` sets.",
  },
  { token: "--type-sm", utility: "text-sm", role: "Body, buttons, list titles." },
  { token: "--type-2", utility: "text-2", role: "Card titles, sub-headings." },
  { token: "--type-3", utility: "text-3", role: "Section and screen headings, the profile name." },
  { token: "--type-4", utility: "text-4", role: "Display. One per screen at most." },
];

export const Type: Story = {
  render: () => (
    <Page
      title="Type"
      intro="Five fluid steps, each a clamp from 360px to 1440px. Eight steps became five on 16 Sep 2026: --type-0, --type-2-5 and --type-5 sat within 20% of a neighbour, which is not a difference anyone can see. Sizes below are measured at this window's width."
    >
      <section>
        {typeSteps.map((s) => (
          <Row key={s.token} name={s.token} note={s.utility}>
            <p className={`${s.utility} truncate`}>Every corner of India&apos;s music industry</p>
            <p className="mt-0.5 text-1 text-muted-foreground">
              <Measured name={s.token} /> · {s.role}
            </p>
          </Row>
        ))}
      </section>
    </Page>
  ),
};

/* ── Radius, icon, space ────────────────────────────────────── */

const radiusSteps = [
  {
    token: "--radius-sm",
    utility: "rounded-sm",
    role: "Chips, small controls, thumbnails, inputs",
  },
  { token: "--radius-lg", utility: "rounded-lg", role: "Cards and list containers" },
  { token: "--radius-3xl", utility: "rounded-3xl", role: "Sheets, dialogs, full-bleed hero" },
  { token: "9999px", utility: "rounded-full", role: "Buttons and pills" },
];

export const Shape: Story = {
  render: () => (
    <Page
      title="Shape"
      intro="Four radius steps and nothing else. xs 4, md 12, xl 20 and 2xl 28 were retired into their neighbours on 16 Sep 2026. Pick by role, never by look."
    >
      <section>
        {radiusSteps.map((r) => (
          <Row key={r.utility} name={r.token} note={r.utility}>
            <div className="flex items-center gap-3">
              <span className={`h-12 w-12 border border-border bg-subtle ${r.utility}`} />
              <span className="text-1 text-muted-foreground">
                {r.token.startsWith("--") ? <Measured name={r.token} /> : r.token} · {r.role}
              </span>
            </div>
          </Row>
        ))}
      </section>
    </Page>
  ),
};

const iconSizes = [12, 16, 20, 24, 32];

export const Icons: Story = {
  render: () => (
    <Page
      title="Icons"
      intro="Five sizes, the same ladder as type. Fifteen distinct sizes were in use before 16 Sep 2026; they folded to their nearest step. Icons come from lucide-react — never emoji."
    >
      <section>
        {iconSizes.map((size) => (
          <Row
            key={size}
            name={`size={${size}}`}
            note={
              size === 12
                ? "inline marks"
                : size === 16
                  ? "buttons, rows"
                  : size === 20
                    ? "nav, list leading"
                    : size === 24
                      ? "feature tiles"
                      : "empty states"
            }
          >
            <span className="flex items-center gap-4 text-foreground">
              <Music size={size} aria-hidden />
              <Star size={size} aria-hidden />
              <Bell size={size} aria-hidden />
              <Heart size={size} aria-hidden />
              <User size={size} aria-hidden />
            </span>
          </Row>
        ))}
      </section>
    </Page>
  ),
};

/* ── Colour ─────────────────────────────────────────────────── */

const colours = [
  { name: "--ink", role: "Primary. Buttons, selection, progress, focus ring." },
  { name: "--brand", role: "Accent. Logo, unread dots, the Welcome tagline. Never a fill." },
  { name: "--pink-strong", role: "The only pink legible as text: prices and section actions." },
  { name: "--background", role: "App canvas." },
  { name: "--card", role: "Card and sheet fill." },
  { name: "--surface-subtle", role: "Inactive segments, thumbnails, skeletons." },
  { name: "--border", role: "Hairlines and dividers." },
  { name: "--muted-foreground", role: "Secondary text. Clears 4.5:1 on both grounds." },
  { name: "--success", role: "Available, verified, confirmed." },
  { name: "--warn", role: "Pending, visibility notices." },
  { name: "--destructive", role: "Destructive and rejected." },
  { name: "--purple", role: "The category badge, and nothing else." },
];

export const Colour: Story = {
  render: () => (
    <Page
      title="Colour"
      intro="Ink on greys and white. Brand pink is an accent — about a tenth of a screen — and the text-safe shade is the only one that carries copy."
    >
      <section>
        {colours.map((c) => (
          <Row key={c.name} name={c.name}>
            <div className="flex items-center gap-3">
              <span
                className="h-10 w-16 shrink-0 rounded-sm border border-border"
                style={{ background: `var(${c.name})` }}
              />
              <span className="min-w-0 text-1 text-muted-foreground">
                <Measured name={c.name} /> · {c.role}
              </span>
            </div>
          </Row>
        ))}
      </section>
    </Page>
  ),
};

/* ── Elevation, motion, opacity ─────────────────────────────── */

export const Depth: Story = {
  render: () => (
    <Page
      title="Elevation, motion, opacity"
      intro="The three scales that already match the reference spec step for step. Prefer a hairline border to elevation on a card."
    >
      <section>
        {["--elevation-2", "--elevation-3"].map((e) => (
          <Row key={e} name={e}>
            <div className="flex items-center gap-3">
              <span
                className="h-12 w-20 rounded-lg bg-card"
                style={{ boxShadow: `var(${e})` }}
                aria-hidden
              />
              <Measured name={e} />
            </div>
          </Row>
        ))}
      </section>
      <section>
        <h2 className="text-2">Motion</h2>
        {["--duration-1", "--duration-2", "--duration-3", "--duration-4"].map((d, i) => (
          <Row
            key={d}
            name={d}
            note={["press", "hover, tap", "enter, shake", "arrival"][i] ?? undefined}
          >
            <Measured name={d} />
          </Row>
        ))}
        {["--easing-standard", "--easing-enter", "--easing-spring"].map((e) => (
          <Row key={e} name={e}>
            <Measured name={e} />
          </Row>
        ))}
      </section>
      <section>
        <h2 className="text-2">Opacity</h2>
        {["--opacity-1", "--opacity-2", "--opacity-3", "--opacity-4"].map((o, i) => (
          <Row key={o} name={o} note={["hover", "pressed", "disabled", "scrim"][i] ?? undefined}>
            <div className="flex items-center gap-3">
              <span
                className="h-8 w-20 rounded-sm bg-ink"
                style={{ opacity: `var(${o})` }}
                aria-hidden
              />
              <Measured name={o} />
            </div>
          </Row>
        ))}
      </section>
    </Page>
  ),
};

/* ── Layout ─────────────────────────────────────────────────── */

export const Layout: Story = {
  render: () => (
    <Page
      title="Layout"
      intro="The shell is a phone that widens: 640px at most, 350px at least, one column throughout. Spacing uses Tailwind's numeric scale; 4 / 8 / 16 / 32 are the sanctioned steps and anything between them wants a reason."
    >
      <section>
        <Row name="--container-app" note="max-w-app">
          <Measured name="--container-app" />
        </Row>
        <Row name="--spacing-nav-clear" note="pb-nav-clear">
          <Measured name="--spacing-nav-clear" />
        </Row>
        {[
          ["4px", "p-1", "inside a pill"],
          ["8px", "p-2", "between chips"],
          ["16px", "p-4", "card padding, gutters"],
          ["32px", "p-8", "between blocks"],
        ].map(([px, utility, role]) => (
          <Row key={utility} name={px ?? ""} note={utility}>
            <div className="flex items-center gap-3">
              <span className="h-6 bg-ink" style={{ width: px }} aria-hidden />
              <span className="text-1 text-muted-foreground">{role}</span>
            </div>
          </Row>
        ))}
      </section>
    </Page>
  ),
};
