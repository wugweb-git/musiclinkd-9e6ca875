import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState, type ReactNode } from "react";
import { Bell, Send, Music } from "lucide-react";
import { Btn, Chip, IconBtn } from "@/components/ml/ui";
import { EmptyState, SegmentedField } from "@/components/ml/kit";
import { StatusBadge, VerificationBadge } from "@/components/ml/profile";

/*
 * The eight states, side by side, on the controls that carry them. Hover and pressed are pointer
 * states and cannot be pinned in a static story — those two rows say what they draw and the
 * controls below them are live, so hovering and holding shows the real thing.
 *
 * The written rules are docs/system-rules-2026-09-16.md; this is them, rendered.
 */

function Group({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="border-b border-border py-5 last:border-0">
      <h2 className="text-2">{title}</h2>
      {note ? <p className="mt-0.5 max-w-prose text-1 text-muted-foreground">{note}</p> : null}
      <div className="mt-3 flex flex-wrap items-center gap-3">{children}</div>
    </section>
  );
}

const meta = {
  title: "Foundations/States",
  parameters: { layout: "padded" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Buttons: Story = {
  render: function ButtonStates() {
    const [loading, setLoading] = useState(false);
    return (
      <div>
        <Group
          title="Default"
          note="Primary is ink. Filled, outline and ghost are the three weights; pink is never a fill."
        >
          <Btn>Connect</Btn>
          <Btn variant="outline">Message</Btn>
          <Btn variant="ghost">Skip</Btn>
        </Group>

        <Group
          title="Hover"
          note="Pointer devices only: currentColor at --opacity-1 (0.08) over the control. Hover one to see it."
        >
          <Btn>Hover me</Btn>
          <Btn variant="outline">Hover me</Btn>
        </Group>

        <Group
          title="Pressed"
          note="The state layer at 0.12 and scale(0.97) for --duration-1 (125ms). Hold one down."
        >
          <Btn>Hold me</Btn>
          <IconBtn label="Notifications" variant="outline">
            <Bell size={16} aria-hidden />
          </IconBtn>
        </Group>

        <Group
          title="Focused"
          note="Keyboard only (:focus-visible): 2px ink at 2px offset. Tab into the row."
        >
          <Btn variant="outline">Tab to me</Btn>
          <Btn variant="outline">Then to me</Btn>
        </Group>

        <Group
          title="Loading"
          note="A spinner replaces the icon, aria-busy is set and the control is inert. Never 'Please wait…'."
        >
          <Btn loading={loading} onClick={() => setLoading((v) => !v)}>
            Send request
          </Btn>
          <Btn variant="outline" onClick={() => setLoading((v) => !v)}>
            Toggle loading
          </Btn>
        </Group>

        <Group
          title="Disabled"
          note="Filled goes to a faint ink container; outline and ghost dim to 50%. Both are inert — and the screen says why."
        >
          <Btn disabled>Confirm booking</Btn>
          <Btn variant="outline" disabled>
            Save
          </Btn>
          <p className="w-full text-1 text-muted-foreground">
            Pick a date before you confirm — the reason belongs beside the control, not in a
            tooltip.
          </p>
        </Group>
      </div>
    );
  },
};

export const Selection: Story = {
  render: function SelectionStates() {
    const [picked, setPicked] = useState<string[]>(["Rock"]);
    const [mode, setMode] = useState("Remote");
    const toggle = (v: string) =>
      setPicked((all) => (all.includes(v) ? all.filter((x) => x !== v) : [...all, v]));
    return (
      <div>
        <Group
          title="Chip — multi-select"
          note="Selected is ink on white, and a chip you just picked springs once (--animate-select, 320ms). Chips wrap; they never pretend to be a row of alternatives."
        >
          {["Rock", "Jazz", "Hip-Hop", "Carnatic"].map((g) => (
            <Chip key={g} active={picked.includes(g)} onClick={() => toggle(g)}>
              {g}
            </Chip>
          ))}
        </Group>

        <Group
          title="Chip — with media, disabled, at limit"
          note="At limit looks disabled but answers a tap with a shake and a haptic, instead of silently doing nothing."
        >
          <Chip media={<Music size={16} />} active>
            Singer
          </Chip>
          <Chip disabled>Unavailable</Chip>
          <Chip atLimit>Picker full</Chip>
        </Group>

        <Group
          title="SegmentedField — one of a few"
          note="Two to four alternatives in one row of equal segments. Settings questions use this; filters use chips."
        >
          <div className="w-full max-w-sm">
            <SegmentedField
              label="How you'll work"
              value={mode}
              options={["Remote", "In person", "Hybrid"]}
              onChange={setMode}
            />
          </div>
        </Group>
      </div>
    );
  },
};

export const Feedback: Story = {
  render: () => (
    <div>
      <Group
        title="Empty"
        note="An icon, one sentence that says what will appear here, and one action. An empty screen is an invitation, not an apology."
      >
        <div className="w-full">
          <EmptyState
            icon={<Bell size={20} className="text-muted-foreground" />}
            title="No activity yet"
            body="Follow artists and studios, and their updates land here."
          >
            <Btn variant="outline" icon={<Send size={16} aria-hidden />}>
              Discover talent
            </Btn>
          </EmptyState>
        </div>
      </Group>

      <Group
        title="Status"
        note="Colour is never the only carrier: availability is a word and an icon. Available is the only status."
      >
        <StatusBadge status="Available" />
      </Group>

      <Group title="Verification" note="A trust signal, not decoration. Tier is the tooltip.">
        <VerificationBadge tier="Industry Verified" />
        <VerificationBadge tier="Professional" />
        <VerificationBadge tier="Email Verified" compact />
      </Group>
    </div>
  ),
};
