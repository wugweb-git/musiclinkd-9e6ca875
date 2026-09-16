import type { Meta, StoryObj } from "@storybook/react-vite";
import { CalendarDays, Music2 } from "lucide-react";

import { Btn } from "./ui";
import { Card, EmptyState, Loading, Meter, Rate, Row, Segmented, StatusPill, Stars } from "./kit";

/*
 * The kit primitives. Screens reach for these instead of rebuilding a card, an empty state or a
 * progress bar by hand, so every state below is the one a screen gets for free.
 */
const meta = {
  title: "Kit/Rate",
  component: Rate,
  args: { amount: "₹4,500", unit: "per hour" },
  argTypes: { size: { control: "inline-radio", options: ["sm", "md", "lg"] } },
} satisfies Meta<typeof Rate>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const NoUnit: Story = {
  args: { amount: "On request", unit: undefined },
  parameters: {
    docs: { description: { story: "An amount with no unit renders the amount alone." } },
  },
};

/** A rate is two pieces at every size: the amount, then the unit under it. Never one joined string. */
export const Sizes: Story = {
  render: () => (
    <div className="flex items-start gap-8">
      {(["sm", "md", "lg"] as const).map((size) => (
        <Rate key={size} amount="₹4,500" unit="per hour" size={size} />
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
    </div>
  ),
};

export const Rows: Story = {
  name: "Row: link and button",
  render: () => (
    <div className="space-y-2">
      <Row icon={<Music2 size={18} />} title="Your applications" subtitle="Nothing yet" to="/me" />
      <Row icon={<CalendarDays size={18} />} title="Availability" onClick={() => {}} />
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
