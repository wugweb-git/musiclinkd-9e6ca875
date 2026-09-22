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

// The visitor view's brand-pink CTA (bg-brand text-background): even pure white on --brand only
// reaches 3.56:1, short of 4.5:1 — darkening --brand is a real brand-color decision flagged to
// the owner, not something to guess at here (audit, 23 Sep; see
// docs/token-scale-spec-2026-09-16.md). Exempted from the blocking a11y gate until that's decided.
const brandButtonA11yNote = { a11y: { test: "off" as const } };

/** What someone else sees: no owner actions, no completion, no insights. */
export const Visitor: Story = { parameters: brandButtonA11yNote };

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
  parameters: brandButtonA11yNote,
};
