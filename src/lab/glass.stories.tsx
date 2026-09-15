import type { Decorator, Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Segmented } from "@/components/ml/kit";
import { Btn, Chip } from "@/components/ml/ui";
import { GlassButton } from "@/components/ui/glasscn/glass-button";
import { LiquidChip } from "@/components/ui/liquid-chip";
import { LiquidSegmented } from "@/components/ui/liquid-segmented";
import { LiquidToastProvider, useLiquidToast } from "@/components/ui/liquid-toast";
import { LiquefyProvider } from "@/lib/provider";

/* Lab: glass. Our chips, segmented control, labels and button next to @liquefy-ui and @glasscn. */

const PHOTO =
  "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=900&q=70";

/** Glass needs something behind it: every story sits on a photo. */
const onPhoto: Decorator = (Story) => (
  <LiquefyProvider theme="light">
    <LiquidToastProvider placement="bottom-center">
      <div
        className="-m-5 min-h-[520px] bg-cover bg-center p-5"
        style={{ backgroundImage: `url(${PHOTO})` }}
      >
        <Story />
      </div>
    </LiquidToastProvider>
  </LiquefyProvider>
);

const meta = {
  title: "Lab/Glass: ours vs liquefy-ui and glasscn",
  decorators: [onPhoto],
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const roles = ["Vocalist", "Guitarist", "Producer", "Composer"];

export const Chips: Story = {
  name: "Chips",
  render: function ChipsStory() {
    const [on, setOn] = useState<string[]>(["Vocalist"]);
    const toggle = (v: string) =>
      setOn((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]));
    return (
      <div className="space-y-6">
        <section>
          <p className="pill mb-2 pill-glass">Ours: Chip</p>
          <div className="flex flex-wrap gap-2">
            {roles.map((r) => (
              <Chip key={r} active={on.includes(r)} onClick={() => toggle(r)}>
                {r}
              </Chip>
            ))}
          </div>
        </section>
        <section>
          <p className="pill mb-2 pill-glass">@liquefy-ui: LiquidChip</p>
          <div className="flex flex-wrap gap-2">
            {roles.map((r) => (
              <LiquidChip
                key={r}
                variant="tinted"
                selected={on.includes(r)}
                onClick={() => toggle(r)}
              >
                {r}
              </LiquidChip>
            ))}
          </div>
        </section>
      </div>
    );
  },
};

export const SegmentedControl: Story = {
  name: "Segmented control",
  render: function SegStory() {
    const options = ["For you", "Nearby", "Rentals"] as const;
    const [v, setV] = useState<(typeof options)[number]>("For you");
    return (
      <div className="space-y-6">
        <section>
          <p className="pill mb-2 pill-glass">Ours: Segmented</p>
          <Segmented value={v} options={options} onChange={setV} />
        </section>
        <section>
          <p className="pill mb-2 pill-glass">@liquefy-ui: LiquidSegmented</p>
          <LiquidSegmented
            label="Market view"
            value={v}
            onValueChange={(x) => setV(x as (typeof options)[number])}
            options={options.map((o) => ({ value: o, label: o }))}
          />
        </section>
      </div>
    );
  },
};

export const Buttons: Story = {
  name: "Buttons",
  render: () => (
    <div className="space-y-6">
      <section className="space-y-2">
        <p className="pill pill-glass">Ours: Btn</p>
        <div className="grid grid-cols-2 gap-2">
          <Btn>Continue</Btn>
          <Btn variant="outline">Share</Btn>
        </div>
      </section>
      <section className="space-y-2">
        <p className="pill pill-glass">@glasscn: GlassButton</p>
        <div className="flex flex-wrap gap-2">
          <GlassButton>Continue</GlassButton>
          <GlassButton glassVariant="frosted">Share</GlassButton>
        </div>
      </section>
    </div>
  ),
};

export const Toasts: Story = {
  name: "Toast",
  render: function ToastStory() {
    const { toast } = useLiquidToast();
    return (
      <div className="space-y-2">
        <p className="pill pill-glass">@liquefy-ui: LiquidToast</p>
        <div className="flex flex-wrap gap-2">
          <Btn onClick={() => toast({ title: "Profile published", severity: "success" })}>
            Success
          </Btn>
          <Btn
            variant="outline"
            onClick={() =>
              toast({
                title: "Couldn't save",
                description: "Check your connection.",
                severity: "danger",
              })
            }
          >
            Error
          </Btn>
        </div>
      </div>
    );
  },
};
