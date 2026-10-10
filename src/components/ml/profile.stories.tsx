import { EmptyState } from "./kit";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Globe, Guitar, Music2 } from "lucide-react";

import {
  ChipGroup,
  ChipGroupList,
  InfoRow,
  ProfileCta,
  ProfileSection,
  ProfileSkeleton,
  StatusBadge,
  TagChip,
  VerificationBadge,
} from "./profile";

/*
 * Profile parts. The empty states matter most here: a new account has no portfolio, no credits and
 * no reviews, and that is the state most real profiles are in on day one.
 */
const meta = {
  title: "Profile/Sections",
  component: ProfileSection,
  args: { title: "Portfolio", children: null },
  parameters: { layout: "padded" },
} satisfies Meta<typeof ProfileSection>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Section: Story = {
  args: {
    title: "Portfolio",
    action: "View All",
    children: <p className="text-1 text-muted-foreground">Section body goes here.</p>,
  },
};

export const Loading: Story = { render: () => <ProfileSkeleton /> };

/** What an owner sees on a profile with nothing in it yet — each with the one action that fills it. */
export const EmptyStates: Story = {
  render: () => (
    <div className="space-y-3">
      <EmptyState
        title="No work yet"
        body="Add a track, video or credit so people can hear what you do."
        action={
          <ProfileCta cta={{ label: "Add a Track", to: "/portfolio/new/$kind", kind: "track" }} />
        }
      />
      <EmptyState
        title="No bio yet"
        body="A couple of lines about what you do and who you've worked with."
        action={<ProfileCta cta={{ label: "Edit Profile", to: "/profile/edit" }} />}
      />
      <EmptyState title="No reviews yet" body="Reviews appear here once you've been booked." />
    </div>
  ),
};

/** A visitor's view of the same empty profile: no owner actions, so no call to action. */
export const EmptyAsVisitor: Story = {
  render: () => <EmptyState title="No work yet" body="This profile hasn't published any work." />,
};

export const Badges: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <VerificationBadge tier="Industry Verified" />
      <VerificationBadge tier="Professional" />
      <VerificationBadge tier="Email Verified" />
      <VerificationBadge tier="Industry Verified" compact />
      <StatusBadge status="Available" />
    </div>
  ),
};

export const Facets: Story = {
  render: () => (
    <ChipGroupList>
      <ChipGroup label="Genres" icon={Music2} items={["Indie", "Electronic", "Fusion"]} />
      <ChipGroup label="Instruments" icon={Guitar} items={["Guitar", "Keyboard"]} />
      <ChipGroup label="Languages" icon={Globe} items={["Hindi", "English", "Marathi"]} />
    </ChipGroupList>
  ),
};

/**
 * Long labels in Devanagari and Tamil. Facet rows wrap rather than truncate, so this is where the
 * layout has to hold at 412px.
 */
export const FacetsLongLabels: Story = {
  render: () => (
    <ChipGroupList>
      <ChipGroup
        label="भाषाएँ"
        icon={Globe}
        items={["हिन्दी", "मराठी", "தமிழ்", "മലയാളം", "ਪੰਜਾਬੀ", "ಕನ್ನಡ"]}
      />
      <ChipGroup label="வாத்தியங்கள்" icon={Guitar} items={["மிருதங்கம்", "வயலின்", "நாதஸ்வரம்"]} />
    </ChipGroupList>
  ),
};

/** A price value renders as amount with the unit on its own line; a string value renders as is. */
export const Info: Story = {
  render: () => (
    <div className="rounded-lg bg-subtle">
      <InfoRow label="Experience" value="10+ years" />
      <InfoRow label="Hourly rate" value={{ amount: "₹4,500", unit: "hr" }} />
      <InfoRow label="Per song" value={{ amount: "₹18,000", unit: "song" }} />
      <InfoRow label="Rate" value={{ amount: "On request" }} />
      <InfoRow label="Based in" value="Bandra East, Mumbai" />
    </div>
  ),
};

export const Tags: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <TagChip>Subtle</TagChip>
      <TagChip tone="pink">Pink</TagChip>
      <TagChip tone="purple">Purple</TagChip>
    </div>
  ),
};
