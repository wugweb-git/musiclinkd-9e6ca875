import type { Meta, StoryObj } from "@storybook/react-vite";

import { ownerProfile, profileCompletion, profileInsights } from "@/data/profile";
import { PersonProfileExperience } from "./person-profile";

/*
 * The whole person profile. It is one component with four branches — owner or visitor, and with or
 * without the owner-only completion and insight panels — so the four combinations below are the
 * whole surface.
 *
 * The profile is the existing seed account. `insights` is deliberately left out of the visitor
 * stories: real profiles pass nothing, so sample figures never reach someone else's screen.
 */
const meta = {
  title: "Profile/Person profile",
  component: PersonProfileExperience,
  args: { p: ownerProfile },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof PersonProfileExperience>;
export default meta;
type Story = StoryObj<typeof meta>;

/** What someone else sees: no owner actions, no completion, no insights. */
export const Visitor: Story = {};

/** The owner's own profile, complete — so the completion panel stays hidden. */
export const Owner: Story = { args: { owner: true } };

/** The owner with gaps: the completion panel appears and names what is missing. */
export const OwnerIncomplete: Story = {
  args: { owner: true, completion: profileCompletion },
};

export const OwnerWithInsights: Story = {
  args: { owner: true, completion: profileCompletion, insights: profileInsights },
};

/**
 * A profile with no username cannot be shared, because sharing needs a public link — the share
 * action is dropped rather than shown and failing.
 */
export const WithoutUsername: Story = {
  args: { p: { ...ownerProfile, username: "" } },
};
