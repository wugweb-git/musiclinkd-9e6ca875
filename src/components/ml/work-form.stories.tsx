import type { Meta, StoryObj } from "@storybook/react-vite";

import { demoPortfolio, workTypes } from "@/data/portfolio";
import { WorkForm } from "./work-form";

/*
 * Adding a piece of work. The form adapts to the kind — it only asks for the fields that kind
 * needs — so the stories below are one per branch that changes what is asked.
 *
 * Saving calls a server function, so in Storybook the submit path fails rather than writing.
 * These stories cover what the form asks for and how it validates, not the round trip.
 */
const meta = {
  title: "Portfolio/WorkForm",
  component: WorkForm,
  args: { kind: "track", signedIn: true },
  argTypes: { kind: { control: "select", options: workTypes.map((t) => t.kind) } },
  parameters: { layout: "padded" },
} satisfies Meta<typeof WorkForm>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Track: Story = {};
export const Performance: Story = { args: { kind: "performance" } };
export const Credit: Story = { args: { kind: "credit" } };

/** Editing an existing item: the fields arrive filled from the work being edited. */
export const Editing: Story = {
  args: { kind: demoPortfolio[0]!.kind, initial: demoPortfolio[0]! },
};

/**
 * The new user's first work, reached from onboarding. There is no "save as draft" here — the point
 * of the step is to publish one thing — and Continue goes on to Review profile.
 */
export const FromOnboarding: Story = {
  args: { fromOnboarding: true },
};

/**
 * Signed out. Nothing can be saved, so the form says so rather than letting someone fill it in and
 * lose the work at submit.
 */
export const SignedOut: Story = {
  args: { signedIn: false },
};

/** An existing work whose fields are long and non-Latin, at 412px. */
export const LongContent: Story = {
  args: {
    kind: "track",
    initial: {
      ...demoPortfolio[0]!,
      title: "नीयन मॉनसून (विस्तारित मॉनसून सेशन्स मिक्स) — ऑक्टेव साउंड लैब्स, मुंबई",
      description:
        "इंडी-इलेक्ट्रॉनिक सिंगल, ऑक्टेव साउंड लैब्स मुंबई में तीन रातों में रिकॉर्ड किया गया।",
      role: "निर्माता, मिक्सिंग इंजीनियर",
      collaborators: ["அதிதி ராவ்", "रोहन मेहता"],
    },
  },
};
