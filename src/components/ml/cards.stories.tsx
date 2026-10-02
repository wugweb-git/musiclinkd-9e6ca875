import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  PersonCard,
  PersonCardSkeleton,
  PersonRow,
  PersonRowSkeleton,
  StudioCard,
  StudioCardSkeleton,
  StudioRow,
  ServiceCard,
  ServiceCardSkeleton,
  ReviewCard,
  ReviewCardSkeleton,
} from "./cards";
import type { DirectoryPerson } from "@/lib/profile-groups.functions";
import type { DiscoverStudio } from "@/lib/studio-view";

const demoPerson: DirectoryPerson = {
  id: "demo-person-1",
  username: "ananya-sharma",
  name: "Ananya Sharma",
  headline: "Playback vocalist in Mumbai, working in Hindi Film and Sufi.",
  city: "Mumbai",
  roles: ["singer"],
  genres: ["Hindi Film", "Sufi"],
  avatarUrl: null,
  verified: true,
  pin_code: "400053",
  rating: 4.9,
  reviewCount: 42,
};

const meta = {
  title: "Cards/Recycled Blocks",
  component: PersonCard,
  args: { person: demoPerson },
  parameters: { layout: "padded" },
} satisfies Meta<typeof PersonCard>;
export default meta;
type Story = StoryObj<typeof meta>;

/* ------------------------------------------------------------------ */
/* Talent card                                                         */
/* ------------------------------------------------------------------ */

export const PersonCardStory: Story = {
  name: "PersonCard (Default)",
  render: () => (
    <div className="max-w-md">
      <PersonCard person={demoPerson} />
    </div>
  ),
};

export const PersonCardDisabledStory: Story = {
  name: "PersonCard (Preview / disabled)",
  render: () => (
    <div className="max-w-md">
      <PersonCard person={demoPerson} disabled />
    </div>
  ),
};

export const PersonCardSkeletonStory: Story = {
  name: "PersonCardSkeleton",
  render: () => (
    <div className="max-w-md">
      <PersonCardSkeleton />
    </div>
  ),
};

export const PersonRowStory: Story = {
  name: "PersonRow (Default)",
  render: () => (
    <ul className="max-w-md divide-y divide-border">
      <PersonRow person={demoPerson} />
    </ul>
  ),
};

export const PersonRowSkeletonStory: Story = {
  name: "PersonRowSkeleton",
  render: () => (
    <ul className="max-w-md divide-y divide-border">
      <PersonRowSkeleton />
    </ul>
  ),
};

/* ------------------------------------------------------------------ */
/* Business / studio card                                              */
/* ------------------------------------------------------------------ */

const demoStudio: DiscoverStudio = {
  id: "soundhouse-bandra",
  slug: "soundhouse-bandra",
  username: "soundhouse.bandra",
  name: "Soundhouse Studios Bandra",
  location: "Mumbai",
  rating: 4.9,
  reviewCount: 38,
  verified: true,
  rate: { amount: "₹2,500", unit: "hour" },
  photo:
    "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=600&q=80",
  gear: ["Dolby Atmos", "Neumann U87", "SSL Duality"],
};

export const StudioCardStory: Story = {
  name: "StudioCard (Default)",
  render: () => (
    <div className="max-w-md">
      <StudioCard studio={demoStudio} />
    </div>
  ),
};

export const StudioCardDisabledStory: Story = {
  name: "StudioCard (Preview / disabled)",
  render: () => (
    <div className="max-w-md">
      <StudioCard studio={demoStudio} disabled />
    </div>
  ),
};

export const StudioCardSkeletonStory: Story = {
  name: "StudioCardSkeleton",
  render: () => (
    <div className="max-w-md">
      <StudioCardSkeleton />
    </div>
  ),
};

export const StudioRowStory: Story = {
  name: "StudioRow (Default)",
  render: () => (
    <ul className="max-w-md divide-y divide-border">
      <StudioRow studio={demoStudio} />
    </ul>
  ),
};

/* ------------------------------------------------------------------ */
/* Service card                                                        */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/* Review card                                                         */
/* ------------------------------------------------------------------ */

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
