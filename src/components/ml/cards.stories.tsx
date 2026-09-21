import type { Meta, StoryObj } from "@storybook/react-vite";

import { talents } from "@/data/discover";
import { TalentGridCard, TalentRow } from "./cards";

/*
 * The three shapes a person takes in a list: the full row (search), the rail card (Home) and the
 * grid card (browse). All three read the same `Talent`, so a field that is missing in one is
 * missing in all of them.
 */
const meta = {
  title: "Cards/Talent",
  component: TalentRow,
  args: { t: talents[0]! },
  parameters: { layout: "padded" },
} satisfies Meta<typeof TalentRow>;
export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Message and Save are disabled with no handler passed: there is no thread to open and no
 * saved-talent table yet, and a control that takes the tap and does nothing is worse than one
 * that says it isn't ready.
 */
export const Row: Story = {};

export const RowWithActions: Story = {
  name: "Row: handlers wired",
  args: { onMessage: () => {}, onSave: () => {}, onPreview: () => {} },
};

/** The grid card is the one that shows a rate — amount, then the unit on its own grey line. */
export const Grid: Story = {
  name: "TalentGridCard (rate)",
  render: () => (
    <div className="grid grid-cols-2 gap-3">
      {talents.slice(0, 4).map((t) => (
        <TalentGridCard key={t.id} t={t} />
      ))}
    </div>
  ),
};

/** The one seeded person with no unit on their rate, so the amount stands alone. */
export const GridRateWithoutUnit: Story = {
  name: "TalentGridCard: rate with no unit",
  render: () => {
    const onRequest = talents.find((t) => !t.rate.unit) ?? talents[0]!;
    return (
      <div className="w-[172px]">
        <TalentGridCard t={onRequest} />
      </div>
    );
  },
};
