import type { Meta, StoryObj } from "@storybook/react-vite";

import { ownerProfile } from "@/data/profile";
import { TalentProfileExperience } from "./talent-profile";

/*
 * The whole person profile. One component, one tabbed layout, for owner and visitor alike — the
 * owner gets an Edit button and a few inline edit affordances instead of Connect/Message/Hire.
 */
const meta = {
  title: "Profile/Person profile",
  component: TalentProfileExperience,
  args: { p: ownerProfile },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof TalentProfileExperience>;
export default meta;
type Story = StoryObj<typeof meta>;

/** What someone else sees: no owner actions. */
export const Visitor: Story = {};

/** The owner's own profile: an Edit button instead of Connect/Message/Hire. */
export const Owner: Story = { args: { owner: true } };

/**
 * A profile with no username cannot be shared, because sharing needs a public link — the share
 * action is dropped rather than shown and failing.
 */
export const WithoutUsername: Story = {
  args: { p: { ...ownerProfile, username: "" } },
};
