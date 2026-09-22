import type { Meta, StoryObj } from "@storybook/react-vite";

import { talents } from "@/data/discover";
import {
  TalentGridCard,
  TalentRow,
  TalentUserCard,
  TalentCardSkeleton,
  BusinessUserCard,
  BusinessCardSkeleton,
  ServiceCard,
  ServiceCardSkeleton,
  ReviewCard,
  ReviewCardSkeleton,
} from "./cards";

const meta = {
  title: "Cards/Recycled Blocks",
  component: TalentUserCard,
  args: { t: talents[0]! },
  parameters: { layout: "padded" },
} satisfies Meta<typeof TalentUserCard>;
export default meta;
type Story = StoryObj<typeof meta>;

export const FlagshipTalentCard: Story = {
  name: "TalentUserCard (Default)",
  render: () => (
    <div className="max-w-md">
      <TalentUserCard t={talents[0]!} />
    </div>
  ),
};

export const FlagshipTalentCardSelected: Story = {
  name: "TalentUserCard (Selected)",
  render: () => (
    <div className="max-w-md">
      <TalentUserCard t={talents[0]!} selected />
    </div>
  ),
};

export const FlagshipTalentSkeleton: Story = {
  name: "TalentCardSkeleton",
  render: () => (
    <div className="max-w-md">
      <TalentCardSkeleton />
    </div>
  ),
};

const demoBusiness = {
  id: "soundhouse-bandra",
  name: "Soundhouse Studios Bandra",
  type: "Recording Studio",
  coverUrl:
    "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=600&q=80",
  location: "Bandra West, Mumbai",
  rating: 4.9,
  reviewCount: 38,
  verified: true,
  rate: { amount: "₹2,500", unit: "hour" },
  amenities: ["Dolby Atmos", "Neumann U87", "SSL Duality"],
};

export const FlagshipBusinessCard: Story = {
  name: "BusinessUserCard (Default)",
  render: () => (
    <div className="max-w-md">
      <BusinessUserCard business={demoBusiness} />
    </div>
  ),
};

export const FlagshipBusinessCardSelected: Story = {
  name: "BusinessUserCard (Selected)",
  render: () => (
    <div className="max-w-md">
      <BusinessUserCard business={demoBusiness} selected />
    </div>
  ),
};

export const FlagshipBusinessSkeleton: Story = {
  name: "BusinessCardSkeleton",
  render: () => (
    <div className="max-w-md">
      <BusinessCardSkeleton />
    </div>
  ),
};

const demoService = {
  id: "demo-service-1",
  name: "Vocal Recording & Tracking",
  description:
    "High-end vocal tracking in our acoustically treated live room with vintage Neumann microphone.",
  mode: "In person" as const,
  deliverables: ["Raw multi-track WAV stems", "Tuned reference mix", "Session backup"],
  uses: ["Neumann U87 Ai", "Avalon VT-737sp", "Pro Tools HDX"],
  from: { amount: "₹2,000", unit: "hour" },
  turnaround: "Same day",
};

export const ServiceCardStory: Story = {
  name: "ServiceCard (Default)",
  render: () => (
    <div className="max-w-md">
      <ServiceCard s={demoService} />
    </div>
  ),
};

export const ServiceCardSelectedStory: Story = {
  name: "ServiceCard (Selected)",
  render: () => (
    <div className="max-w-md">
      <ServiceCard s={demoService} selected />
    </div>
  ),
};

export const ServiceCardSkeletonStory: Story = {
  name: "ServiceCardSkeleton",
  render: () => (
    <div className="max-w-md">
      <ServiceCardSkeleton />
    </div>
  ),
};

const demoReview = {
  id: "demo-review-1",
  by: "Aarav Mehta",
  org: "Indie Music Label",
  context: "Album Tracking",
  stars: 5,
  text: "Recorded our lead vocals and acoustic guitars here. The acoustic treatment is world-class, zero bleed, and the vocal chain brought warmth and punch to the final mix. Highly recommend!",
  tags: ["Punctual", "Super Clean Gear", "Pro Engineer"],
};

export const ReviewCardStory: Story = {
  name: "ReviewCard (Default)",
  render: () => (
    <div className="max-w-xs">
      <ReviewCard r={demoReview} />
    </div>
  ),
};

export const ReviewCardSkeletonStory: Story = {
  name: "ReviewCardSkeleton",
  render: () => (
    <div className="max-w-xs">
      <ReviewCardSkeleton />
    </div>
  ),
};

export const Row: Story = {
  render: () => (
    <div className="max-w-md">
      <TalentRow t={talents[0]!} />
    </div>
  ),
};

export const RowWithActions: Story = {
  name: "Row: handlers wired",
  render: () => (
    <div className="max-w-md">
      <TalentRow
        t={talents[0]!}
        onMessage={() => {}}
        onSave={() => {}}
        onPreview={() => {}}
      />
    </div>
  ),
};

export const Grid: Story = {
  name: "TalentGridCard (rate)",
  render: () => (
    <div className="grid grid-cols-2 gap-3 max-w-sm">
      {talents.slice(0, 4).map((t) => (
        <TalentGridCard key={t.id} t={t} />
      ))}
    </div>
  ),
};
