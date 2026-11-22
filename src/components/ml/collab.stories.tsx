import type { Meta, StoryObj } from "@storybook/react-vite";
import { CollabKindSheet } from "./collab";

const meta = {
  title: "Collab/CollabKindSheet",
  component: CollabKindSheet,
  args: { open: true, onClose: () => {} },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof CollabKindSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Collab Kind Sheet",
  render: () => (
    <div className="relative min-h-[500px]">
      <CollabKindSheet open={true} onClose={() => {}} />
    </div>
  ),
};
