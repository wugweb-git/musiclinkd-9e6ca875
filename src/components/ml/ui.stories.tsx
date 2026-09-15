import type { Meta, StoryObj } from "@storybook/react-vite";
import { Pencil, Plus, Share2, Trash2 } from "lucide-react";
import { useState } from "react";

import { Btn, Chip, IconBtn, SectionHeader, Sheet, TopBar } from "./ui";

/* Primitives: buttons */

const btnMeta = {
  title: "Primitives/Btn",
  component: Btn,
  args: { children: "Continue", variant: "primary" },
  argTypes: { variant: { control: "inline-radio", options: ["primary", "ink", "outline", "ghost"] } },
} satisfies Meta<typeof Btn>;
export default btnMeta;
type BtnStory = StoryObj<typeof btnMeta>;

export const Primary: BtnStory = {};
export const Outline: BtnStory = { args: { variant: "outline" } };
export const Ghost: BtnStory = { args: { variant: "ghost" } };
export const WithIcon: BtnStory = { args: { variant: "outline", icon: <Plus size={18} /> } };
export const Loading: BtnStory = { args: { loading: true } };
export const Pending: BtnStory = {
  args: { pending: true },
  parameters: { docs: { description: { story: "Looks disabled but still takes the tap." } } },
};
export const Disabled: BtnStory = { args: { disabled: true } };

/** Every Btn state side by side. */
export const AllStates: BtnStory = {
  render: () => (
    <div className="space-y-3">
      {(["primary", "ink", "outline", "ghost"] as const).map((v) => (
        <div key={v} className="grid grid-cols-2 gap-2">
          <Btn variant={v}>{v}</Btn>
          <Btn variant={v} loading>
            {v}
          </Btn>
          <Btn variant={v} pending>
            pending
          </Btn>
          <Btn variant={v} disabled>
            disabled
          </Btn>
        </div>
      ))}
    </div>
  ),
};

export const IconButtons: BtnStory = {
  name: "IconBtn: variants and states",
  render: () => (
    <div className="space-y-3">
      {(["outline", "ink", "ghost", "plain"] as const).map((v) => (
        <div key={v} className="flex items-center gap-3">
          <IconBtn label="Edit" variant={v}>
            <Pencil size={18} />
          </IconBtn>
          <IconBtn label="Share" variant={v}>
            <Share2 size={18} />
          </IconBtn>
          <IconBtn label="Delete" variant={v} loading>
            <Trash2 size={18} />
          </IconBtn>
          <IconBtn label="Add" variant={v} disabled>
            <Plus size={18} />
          </IconBtn>
          <span className="text-1 text-muted-foreground">{v}</span>
        </div>
      ))}
    </div>
  ),
};

export const Chips: BtnStory = {
  name: "Chip: selectable",
  render: function ChipsStory() {
    const [on, setOn] = useState<string[]>(["Vocalist"]);
    const toggle = (v: string) =>
      setOn((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]));
    return (
      <div className="flex flex-wrap gap-2">
        {["Vocalist", "Guitarist", "Producer", "Composer"].map((v) => (
          <Chip key={v} active={on.includes(v)} onClick={() => toggle(v)}>
            {v}
          </Chip>
        ))}
        <Chip disabled>Disabled</Chip>
        <Chip atLimit>At limit</Chip>
      </div>
    );
  },
};

export const Pills: BtnStory = {
  name: "Pill: static labels",
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <span className="pill bg-subtle text-muted-foreground">Optional</span>
      <span className="pill bg-success-container text-success-strong">Available</span>
      <span className="pill bg-warn-container text-warn-strong">Pending</span>
      <span className="pill bg-primary text-primary-foreground">New</span>
      <span className="pill border border-border text-muted-foreground">Draft</span>
    </div>
  ),
};

export const Headers: BtnStory = {
  name: "TopBar and SectionHeader",
  parameters: { layout: "fullscreen" },
  render: () => (
    <div className="w-[412px] bg-background">
      <TopBar title="Review profile" back="/" />
      <div className="py-5">
        <SectionHeader title="Recent work" action="See all" />
      </div>
    </div>
  ),
};

export const BottomSheet: BtnStory = {
  name: "Sheet",
  render: function SheetStory() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Btn variant="outline" onClick={() => setOpen(true)}>
          Open sheet
        </Btn>
        <Sheet open={open} onClose={() => setOpen(false)} title="Your role">
          <Btn className="w-full" onClick={() => setOpen(false)}>
            Done
          </Btn>
        </Sheet>
      </>
    );
  },
};
