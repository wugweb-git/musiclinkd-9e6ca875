import type { Meta, StoryObj } from "@storybook/react-vite";

import { demoPortfolio, mediaStateCopy, workTypes, type PortfolioItem } from "@/data/portfolio";
import { Btn } from "./ui";
import {
  CreditRow,
  MediaStatePill,
  PortfolioHeader,
  PortfolioSkeleton,
  StateCard,
  StatusPill,
  WorkCard,
  WorkTypeIcon,
} from "./portfolio";

/*
 * Portfolio pieces, with the states a real portfolio screen moves through: loading, empty, error,
 * offline, and a work that is still a draft. Content is the existing seed portfolio — nothing here
 * invents a track, a credit or a collaborator.
 */
const published = demoPortfolio[0]!;
const draft: PortfolioItem = { ...demoPortfolio[1]!, published: false };

const meta = {
  title: "Portfolio/Work",
  component: WorkCard,
  args: { item: published },
  parameters: { layout: "padded" },
} satisfies Meta<typeof WorkCard>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Published: Story = {};
export const Draft: Story = { args: { item: draft } };

/** A work with nothing filled in but a title — the shape a just-created item has. */
export const Sparse: Story = {
  args: {
    item: {
      ...published,
      description: null,
      role: null,
      collaborators: [],
      release_year: null,
      cover_url: null,
      media_url: null,
    },
  },
};

/**
 * Long titles and Devanagari and Tamil credits. Labels run longer in these scripts than in English
 * and the card has to truncate rather than push the row out at 412px.
 */
export const LongContent: Story = {
  args: {
    item: {
      ...published,
      title: "Neon Monsoon (Extended Monsoon Sessions Mix) — Live at Octave Sound Labs, Mumbai",
      description:
        "इंडी-इलेक्ट्रॉनिक सिंगल, ऑक्टेव साउंड लैब्स मुंबई में रिकॉर्ड किया गया, पूरी बैंड के साथ तीन रातों में।",
      role: "निर्माता, मिक्सिंग इंजीनियर",
      collaborators: ["அதிதி ராவ்", "रोहन मेहता", "Priya Raghunathan-Venkataraman"],
    },
  },
};

export const Loading: Story = { render: () => <PortfolioSkeleton /> };

export const Empty: Story = {
  render: () => (
    <StateCard
      title="Nothing here yet"
      body="Add a track, video or credit and it shows up here."
      action={<Btn variant="ink">Add Work</Btn>}
    />
  ),
};

/** `tone="error"` also sets `role="alert"`, so the failure is announced, not just coloured. */
export const Error: Story = {
  render: () => (
    <StateCard
      tone="error"
      title="Couldn't load your portfolio"
      body="Something went wrong on our side. Try again in a moment."
      action={<Btn variant="ink">Try Again</Btn>}
    />
  ),
};

export const Offline: Story = {
  render: () => (
    <StateCard
      title="You're offline"
      body="Reconnect to load your work. Published items stay visible on your profile."
      action={<Btn variant="ink">Try Again</Btn>}
    />
  ),
};

/** Every media state the uploader moves through, with the copy each one carries. */
export const MediaStates: Story = {
  render: () => (
    <div className="space-y-3">
      {(Object.keys(mediaStateCopy) as (keyof typeof mediaStateCopy)[]).map((state) => (
        <div key={state} className="rounded-lg border border-border bg-card p-3">
          <MediaStatePill state={state} />
          <p className="mt-2 text-1 text-muted-foreground">{mediaStateCopy[state].hint}</p>
        </div>
      ))}
    </div>
  ),
};

export const Counts: Story = {
  render: () => (
    <div className="space-y-4">
      <PortfolioHeader total={7} published={5} drafts={2} featured={3} />
      <PortfolioHeader total={0} published={0} drafts={0} featured={0} visibility="Members" />
    </div>
  ),
};

export const Pills: Story = {
  render: () => (
    <div className="flex gap-2">
      <StatusPill published />
      <StatusPill published={false} />
    </div>
  ),
};

export const TypeIcons: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      {workTypes.map((t) => (
        <div key={t.kind} className="flex w-20 flex-col items-center gap-1.5 text-center">
          <WorkTypeIcon kind={t.kind} />
          <span className="text-1 text-muted-foreground">{t.label}</span>
        </div>
      ))}
    </div>
  ),
};

export const Credits: Story = {
  render: () => (
    <div className="rounded-lg border border-border bg-card">
      <CreditRow name="Aditi Rao" role="Vocals" />
      <CreditRow name="Rohan Mehta" role="Guitar" />
      <CreditRow name="Someone with no role recorded" />
    </div>
  ),
};
