import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  ConditionBadge,
  PriceBlock,
  TrustPill,
  MarketCategoryIcon,
  ListingCard,
  ListingGrid,
  SellerCard,
  ActiveFilters,
  ListingSkeleton,
} from "./market";
import { listings, sellers } from "@/data/market";
import { emptyMarketFilter } from "@/lib/market-filter";

const demoListing = listings[0]!;
const demoSeller = sellers[0]!;

const meta = {
  title: "Market/Components",
  component: ListingCard,
  args: { l: demoListing },
  parameters: { layout: "padded" },
} satisfies Meta<typeof ListingCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BadgesAndPrices: Story = {
  name: "Badges and Prices",
  render: () => (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <ConditionBadge value="New" />
        <ConditionBadge value="Like New" />
        <ConditionBadge value="Excellent" />
        <ConditionBadge value="Good" />
        <ConditionBadge value="Used" />
      </div>
      <div className="flex flex-wrap gap-4">
        <PriceBlock price={{ amount: "24000" }} size="lg" />
        <PriceBlock price={{ amount: "3500", unit: "day" }} size="md" />
      </div>
      <div className="flex flex-wrap gap-2">
        <TrustPill label="Verified · 4.9 (42) · Mumbai" />
        <TrustPill label="Top Rated · Bengaluru" />
      </div>
    </div>
  ),
};

export const CategoryIcons: Story = {
  name: "Category Icons",
  render: () => (
    <div className="flex flex-wrap gap-3">
      <MarketCategoryIcon slug="guitars" />
      <MarketCategoryIcon slug="microphones" />
      <MarketCategoryIcon slug="synthesizers" />
      <MarketCategoryIcon slug="drums" />
      <MarketCategoryIcon slug="studio" />
    </div>
  ),
};

export const Card: Story = {
  name: "Listing Card",
  render: () => (
    <div className="max-w-md">
      <ListingCard l={demoListing} />
    </div>
  ),
};

export const Grid: Story = {
  name: "Listing Grid",
  render: () => (
    <div className="max-w-md">
      <ListingGrid items={listings.slice(0, 4)} />
    </div>
  ),
};

export const Seller: Story = {
  name: "Seller Card",
  render: () => (
    <div className="max-w-md">
      <SellerCard seller={demoSeller} listings={12} />
    </div>
  ),
};

export const Filters: Story = {
  name: "Active Filters",
  render: () => (
    <ActiveFilters
      value={{
        ...emptyMarketFilter,
        conditions: ["Like New"],
        categories: ["Guitars"],
      }}
      onChange={() => {}}
    />
  ),
};

export const Skeletons: Story = {
  name: "Listing Skeleton",
  render: () => (
    <div className="max-w-md">
      <ListingSkeleton />
    </div>
  ),
};
