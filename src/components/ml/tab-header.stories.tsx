import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { ViewerAvatar } from "./viewer";
import { NotificationsBell, SearchField, SearchIconButton } from "./tab-header";

/*
 * The actions a tab screen's header carries. Home and Discover both had their own bell — Discover's
 * was a bare emoji with no label and nothing behind it — so it lives here now and they share one.
 */
const meta = {
  title: "Kit/Tab header",
  component: NotificationsBell,
  parameters: { layout: "padded" },
} satisfies Meta<typeof NotificationsBell>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Bell: Story = {};

/** Closed and open. The button is a toggle, so it carries `aria-expanded` either way. */
export const SearchToggle: Story = {
  render: function SearchToggleStory() {
    const [open, setOpen] = useState(false);
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <SearchIconButton open={open} onToggle={() => setOpen((v) => !v)} />
          <span className="text-1 text-muted-foreground">
            {open ? 'open — aria-expanded="true"' : 'closed — aria-expanded="false"'}
          </span>
        </div>
        {open ? (
          <SearchField
            to="/search"
            placeholder="Search talent, studios, bands, labels"
            onClose={() => setOpen(false)}
          />
        ) : null}
      </div>
    );
  },
};

/** The field on its own. It focuses on mount, submits to the screen's search page, closes on Escape. */
export const Field: Story = {
  render: () => (
    <SearchField to="/search" placeholder="Search talent, studios, bands, labels" onClose={() => {}} />
  ),
};

/** The whole action row as Home and Discover assemble it. */
export const HeaderRow: Story = {
  render: function HeaderRowStory() {
    const [open, setOpen] = useState(false);
    return (
      <header className="flex items-center justify-end gap-2 border-b border-border pb-3">
        <NotificationsBell />
        <SearchIconButton open={open} onToggle={() => setOpen((v) => !v)} />
        <ViewerAvatar className="h-10 w-10" />
      </header>
    );
  },
};

/**
 * A long placeholder in a non-Latin script. The field is the accessible name as well as the hint,
 * so it has to stay legible at 412px rather than clipping mid-word.
 */
export const LongPlaceholder: Story = {
  render: () => (
    <div className="space-y-3">
      <SearchField
        to="/search"
        placeholder="गायक, स्टूडियो, बैंड और लेबल खोजें"
        onClose={() => {}}
      />
      <SearchField
        to="/search"
        placeholder="பாடகர்கள், ஸ்டுடியோக்கள், இசைக்குழுக்கள் தேடுங்கள்"
        onClose={() => {}}
      />
    </div>
  ),
};
