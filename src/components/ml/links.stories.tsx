import type { Meta, StoryObj } from "@storybook/react-vite";
import { ArrowRight, ExternalLink, Pencil, Plus, RotateCcw, Share2 } from "lucide-react";

import { AuthLink, AuthTextButton } from "./auth";
import { BtnLink, IconBtnLink, SectionHeader } from "./ui";

/*
 * Links: text links, text actions that are not navigation, and links that look like buttons.
 * Hover, press and focus are live in the canvas — hover, click and tab through them.
 */

const meta = {
  title: "Primitives/Links",
  component: AuthLink,
  args: { to: "/", children: "Sign in with email" },
} satisfies Meta<typeof AuthLink>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Text link (AuthLink): ink, semibold, underline on hover, dims on press, 48dp touch area. */
export const TextLink: Story = {};

export const TextLinkWithIcon: Story = {
  args: { icon: <ArrowRight size={16} />, children: "See all" },
};

export const TextLinkInSentence: Story = {
  name: "Text link inside a sentence",
  render: () => (
    <p className="text-sm text-muted-foreground">
      By continuing you agree to the{" "}
      <AuthLink to="/" className="underline">
        Terms
      </AuthLink>{" "}
      and{" "}
      <AuthLink to="/" className="underline">
        Privacy policy
      </AuthLink>
      .
    </p>
  ),
};

/** Text action (AuthTextButton): looks like a link, does something instead of navigating. */
export const TextAction: Story = {
  name: "Text action: enabled and disabled",
  render: () => (
    <div className="flex flex-col items-start gap-3">
      <AuthTextButton icon={<RotateCcw size={16} />} onClick={() => undefined}>
        Resend code
      </AuthTextButton>
      <AuthTextButton onClick={() => undefined} disabled>
        Resend in 0:24
      </AuthTextButton>
    </div>
  ),
};

export const SectionAction: Story = {
  name: "Section header action",
  render: () => (
    <div className="-mx-5">
      <SectionHeader title="Featured talent" action={<AuthLink to="/">See all</AuthLink>} />
    </div>
  ),
};

/** Link as a button (BtnLink): the Btn look, router navigation. One element, one tab stop. */
export const LinkAsButton: Story = {
  name: "Link as button: BtnLink variants",
  render: () => (
    <div className="grid grid-cols-2 gap-2">
      <BtnLink to="/">Primary</BtnLink>
      <BtnLink to="/" variant="outline">
        Outline
      </BtnLink>
      <BtnLink to="/" variant="ghost">
        Ghost
      </BtnLink>
      <BtnLink to="/" variant="outline" icon={<Plus size={20} />}>
        With icon
      </BtnLink>
    </div>
  ),
};

export const IconLinkAsButton: Story = {
  name: "Link as icon button: IconBtnLink variants",
  render: () => (
    <div className="flex items-center gap-3">
      <IconBtnLink to="/" label="Edit" variant="ink">
        <Pencil size={20} />
      </IconBtnLink>
      <IconBtnLink to="/" label="Share" variant="outline">
        <Share2 size={20} />
      </IconBtnLink>
      <IconBtnLink to="/" label="Open" variant="ghost">
        <ExternalLink size={20} />
      </IconBtnLink>
      <IconBtnLink to="/" label="Add" variant="plain">
        <Plus size={20} />
      </IconBtnLink>
    </div>
  ),
};
