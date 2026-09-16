import type { Meta, StoryObj } from "@storybook/react-vite";
import { CalendarDays, Music2 } from "lucide-react";

import { Btn } from "./ui";
import { Card, EmptyState, Loading, Meter, Price, Row, Segmented, StatusPill, Stars } from "./kit";

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
