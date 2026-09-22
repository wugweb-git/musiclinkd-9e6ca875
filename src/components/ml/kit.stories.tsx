import type { Meta, StoryObj } from "@storybook/react-vite";
import { CalendarDays, Grid2x2, List, Music2 } from "lucide-react";
import { useState } from "react";

import { Btn } from "./ui";
import {
  Card,
  Dialog,
  EmptyState,
  Loading,
  Meter,
  Price,
  Row,
  Segmented,
  StatusPill,
  Stars,
} from "./kit";

/*
 * The kit primitives. Screens reach for these instead of rebuilding a card, an empty state or a
 * progress bar by hand, so every state below is the one a screen gets for free.
 */
const meta = {
  title: "Kit/Price",
  component: Price,
  args: { price: { amount: "₹4,500", unit: "hr" } },
  argTypes: { align: { control: "inline-radio", options: ["start", "center", "end"] } },
} satisfies Meta<typeof Price>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const NoUnit: Story = {
  args: { price: { amount: "On request" } },
  parameters: {
    docs: { description: { story: "An amount with no unit renders the amount alone." } },
  },
};

export const WithNote: Story = {
  args: { price: { amount: "₹4,500", unit: "hr", note: "+ ₹5,000 deposit" } },
};

/** A price is two pieces however it is aligned: the amount, then the unit line under it. */
export const Alignment: Story = {
  render: () => (
    <div className="space-y-4">
      {(["start", "center", "end"] as const).map((align) => (
        <Price
          key={align}
          price={{ amount: "₹4,500", unit: "hr" }}
          align={align}
          className="w-full"
          amountClassName="text-2 font-bold"
        />
      ))}
    </div>
  ),
};

export const StatusPills: Story = {
  name: "StatusPill: every tone",
  render: () => (
    <div className="flex flex-wrap gap-2">
      <StatusPill label="Available" tone="good" />
      <StatusPill label="Selective" tone="warn" />
      <StatusPill label="Booked" tone="bad" />
      <StatusPill label="Not taking work" tone="neutral" />
      <StatusPill label="Verified" tone="brand" />
      <StatusPill label="Offer sent" tone="category" />
    </div>
  ),
};

/**
 * `RentalAvailabilityBadge`, `RentalStatusPill`, `BookingStatusPill`, `StatusBadge` and
 * `MediaStatePill` are all thin `StatusPill` wrappers now (each maps its own domain status to one
 * of the tones above) — the tone swatches shown here are what every one of them renders through.
 */
export const StatusPillConsolidation: Story = {
  name: "StatusPill: consolidated family",
  render: () => (
    <div className="space-y-2 text-1 text-muted-foreground">
      <p>
        <code>RentalAvailabilityBadge</code>, <code>RentalStatusPill</code>,{" "}
        <code>BookingStatusPill</code>, <code>StatusBadge</code> and <code>MediaStatePill</code>{" "}
        each render through this component now — see &quot;StatusPill: every tone&quot; above for
        every tone they can produce.
      </p>
    </div>
  ),
};

export const Rows: Story = {
  name: "Row: link and button",
  render: () => (
    <div className="space-y-2">
      <Row
        icon={<Music2 size={20} />}
        title="Your applications"
        subtitle="Nothing yet"
        to="/profile"
      />
      <Row icon={<CalendarDays size={20} />} title="Availability" onClick={() => {}} />
      <Row title="No icon, no subtitle" onClick={() => {}} />
    </div>
  ),
};

export const Empty: Story = {
  name: "EmptyState",
  render: () => (
    <EmptyState
      title="No activity yet"
      body="Connect with artists and studios to see updates here."
    >
      <Btn variant="ink">Discover talent</Btn>
    </EmptyState>
  ),
};

export const Skeleton: Story = { name: "Loading", render: () => <Loading /> };

export const Progress: Story = {
  name: "Meter",
  render: () => (
    <div className="space-y-4">
      <Meter label="Profile" value={60} max={100} hint="60%" />
      <Meter label="Portfolio" value={1} max={5} />
    </div>
  ),
};

export const Ratings: Story = {
  name: "Stars",
  render: () => (
    <div className="space-y-2">
      {[5, 4.4, 2, 0].map((v) => (
        <Stars key={v} value={v} />
      ))}
    </div>
  ),
};

export const Cards: Story = {
  name: "Card and Segmented",
  render: () => (
    <Card>
      <Segmented options={["Talent", "Studios"]} value="Talent" onChange={() => {}} />
    </Card>
  ),
};

/**
 * SPEC-issue17's "icon animates on state change" rule: `Segmented` accepts an optional `icons`
 * map and pops the selected tab's icon in with GSAP (`kit.tsx`'s `SegmentedIcon`) on every
 * selection change. Click a tab to see it — under `prefers-reduced-motion` the swap is instant.
 */
export const SegmentedWithIcons: Story = {
  name: "Segmented: icon on select",
  render: function SegmentedIconStory() {
    const [value, setValue] = useState<"Grid" | "List">("Grid");
    return (
      <Card>
        <Segmented
          options={["Grid", "List"] as const}
          value={value}
          onChange={setValue}
          icons={{ Grid: Grid2x2, List: List }}
        />
      </Card>
    );
  },
};

/**
 * Rebuilt on Radix's `Dialog` primitive for focus-trap/escape/scroll-lock parity with `Sheet` —
 * same visual output and call-site API as before (`{ open, title, body, onClose, children }`).
 * Escape closes it, focus is trapped inside while open, and returns to the trigger on close.
 */
export const DialogStates: Story = {
  name: "Dialog",
  render: function DialogStory() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Btn variant="outline" onClick={() => setOpen(true)}>
          Open dialog
        </Btn>
        <Dialog
          open={open}
          title="Leave without saving?"
          body="Your changes haven't been saved yet."
          onClose={() => setOpen(false)}
        >
          <Btn className="w-full" onClick={() => setOpen(false)}>
            Keep editing
          </Btn>
        </Dialog>
      </>
    );
  },
};
