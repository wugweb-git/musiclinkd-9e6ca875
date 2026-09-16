import type { Meta, StoryObj } from "@storybook/react-vite";

import { LogoMark } from "./logo";

/*
 * The mark is a wide waveform glyph (2204:1340, ~1.64:1), drawn in `currentColor` with no plate,
 * so it takes the colour of whatever it sits on. Give it a width and let the height follow —
 * sizing it as a square icon squashes it.
 */
const meta = {
  title: "Brand/LogoMark",
  component: LogoMark,
  args: { className: "w-40 text-foreground" },
  parameters: { layout: "padded" },
} satisfies Meta<typeof LogoMark>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Ink on the app ground, and knocked out in white on brand pink — the splash screen's use. */
export const OnGrounds: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="rounded-lg bg-background p-6">
        <LogoMark className="w-40 text-foreground" />
      </div>
      <div className="rounded-lg bg-card p-6">
        <LogoMark className="w-40 text-foreground" />
      </div>
      <div className="rounded-lg bg-brand p-6">
        <LogoMark className="w-40 text-background" />
      </div>
    </div>
  ),
};

/** At the sizes the app actually uses: header mark, welcome, splash. */
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-5">
      {["w-6", "w-24", "w-40", "w-3/5"].map((w) => (
        <div key={w} className="flex items-center gap-3">
          <span className="w-16 shrink-0 text-1 text-muted-foreground">{w}</span>
          <LogoMark className={`${w} text-foreground`} />
        </div>
      ))}
    </div>
  ),
};

/**
 * The mark carries `role="img"` and `aria-label="MusicLinkd"`, so it is the accessible name
 * wherever it stands in for the product name. Beside visible text it should be `aria-hidden`
 * instead, or a screen reader reads the name twice.
 */
export const BesideTheWordmark: Story = {
  render: () => (
    <p className="flex items-center gap-2 text-2 font-semibold">
      <span aria-hidden className="shrink-0">
        <LogoMark className="w-6 text-foreground" />
      </span>
      MusicLinkd
    </p>
  ),
};
