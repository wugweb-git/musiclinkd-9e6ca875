import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  BookingStatusPill,
  BookingTimeline,
  BookableHero,
  EntityMetaRow,
  DurationPicker,
  PriceBreakdownCard,
  PolicyCard,
  BookingSummaryCard,
  BookingSkeleton,
  CalendarSkeleton,
  StepDots,
} from "./booking";
import { bookables } from "@/data/booking";

const demoBookable = bookables[0]!;

const meta = {
  title: "Booking/Components",
  component: BookingStatusPill,
  args: { status: "confirmed" },
  parameters: { layout: "padded" },
} satisfies Meta<typeof BookingStatusPill>;

export default meta;
type Story = StoryObj<typeof meta>;

export const StatusPills: Story = {
  name: "Status Pills",
  render: () => (
    <div className="flex flex-wrap gap-2">
      <BookingStatusPill status="confirmed" />
      <BookingStatusPill status="requested" />
      <BookingStatusPill status="reviewing" />
      <BookingStatusPill status="completed" />
      <BookingStatusPill status="rejected" />
      <BookingStatusPill status="cancelled" />
    </div>
  ),
};

export const TimelineConfirmed: Story = {
  name: "Timeline (Confirmed)",
  render: () => <BookingTimeline status="confirmed" />,
};

export const TimelineRequested: Story = {
  name: "Timeline (Requested)",
  render: () => <BookingTimeline status="requested" />,
};

export const Hero: Story = {
  name: "Bookable Hero",
  render: () => <BookableHero b={demoBookable} />,
};

export const MetaRow: Story = {
  name: "Entity Meta Row",
  render: () => <EntityMetaRow b={demoBookable} />,
};

export const DurationSelection: Story = {
  name: "Duration Picker",
  render: () => (
    <DurationPicker
      value={2}
      options={[
        { hours: 1, label: "1 hour" },
        { hours: 2, label: "2 hours" },
        { hours: 4, label: "Half day (4 hrs)" },
      ]}
      onChange={() => {}}
    />
  ),
};

export const PriceBreakdown: Story = {
  name: "Price Breakdown Card",
  render: () => (
    <PriceBreakdownCard
      p={{
        base: 3000,
        baseLabel: "2 hours session",
        addOns: [{ name: "Vocal tuning & mixing", price: 1200 }],
        subtotal: 4200,
        tax: 756,
        taxPct: 18,
        total: 4956,
        deposit: 1000,
      }}
    />
  ),
};

export const Policy: Story = {
  name: "Policy Card",
  render: () => (
    <div className="space-y-3">
      <PolicyCard
        title="Cancellation policy"
        body="Free cancellation up to 48 hours before session starts."
      />
      <PolicyCard
        title="Studio rules"
        body="No smoking inside tracking room. Please arrive 10 minutes early."
        critical
      />
    </div>
  ),
};

export const SummaryCard: Story = {
  name: "Booking Summary Card",
  render: () => (
    <BookingSummaryCard
      b={demoBookable}
      date="2026-11-25"
      start="14:00"
      end="16:00"
      people={2}
      service="Live tracking"
    />
  ),
};

export const Dots: Story = {
  name: "Step Dots",
  render: () => (
    <div className="space-y-4">
      <StepDots step={1} total={4} />
      <StepDots step={2} total={4} />
      <StepDots step={4} total={4} />
    </div>
  ),
};

export const Skeletons: Story = {
  name: "Loading Skeletons",
  render: () => (
    <div className="space-y-6">
      <BookingSkeleton rows={3} />
      <CalendarSkeleton />
    </div>
  ),
};
