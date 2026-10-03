import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import MediaDropzone from "@/components/dropzone";
import {
  MiniCalendar,
  MiniCalendarDay,
  MiniCalendarDays,
  MiniCalendarNavigation,
} from "@/components/kibo-ui/mini-calendar";
import { Message, MessageAvatar, MessageContent } from "@/components/ui/message";
import { PhoneInput } from "@/components/ui/phone-input";
import { PhoneField } from "@/components/ml/auth";
import { InlineField } from "@/components/ml/onboarding";

/*
 * Lab, second batch: registry components against the gaps the app actually has — a phone field
 * with country selection, a file dropzone (verification documents), chat messages, and a compact
 * date strip for booking. Ours sits next to theirs where we have an equivalent.
 */

// Vendor components, rendered as the vendor wrote them — not shipped, not gated on our a11y bar
// (audit, 23 Sep; see src/registry/kept.stories.tsx for the same pattern).
const meta = {
  title: "Lab/Registry batch 2",
  parameters: { a11y: { test: "off" } },
} satisfies Meta;
export default meta;
type S = StoryObj<typeof meta>;

export const PhoneEntry: S = {
  name: "Phone: ours vs @diceui",
  render: function PhoneStory() {
    const [ours, setOurs] = useState("");
    const [theirs, setTheirs] = useState("");
    return (
      <div className="space-y-6">
        <section className="space-y-2">
          <p className="pill bg-subtle text-muted-foreground">Ours: PhoneField (+91 only)</p>
          <PhoneField value={ours} onChange={setOurs} />
        </section>
        <section className="space-y-2">
          <p className="pill bg-subtle text-muted-foreground">@diceui: PhoneInput</p>
          <PhoneInput value={theirs} onValueChange={setTheirs} defaultCountry="IN" />
        </section>
      </div>
    );
  },
};

export const Documents: S = {
  name: "Verification documents: @mediadrop dropzone",
  render: () => (
    <div className="space-y-2">
      <p className="pill bg-subtle text-muted-foreground">We have no upload UI at all</p>
      <MediaDropzone />
    </div>
  ),
};

export const Chat: S = {
  name: "Chat messages: @prompt-kit",
  render: () => (
    <div className="space-y-4">
      <p className="pill bg-subtle text-muted-foreground">No chat thread screen exists today</p>
      <Message className="justify-end">
        <MessageContent className="bg-ink text-ink-foreground">
          Can you send the stems by Friday?
        </MessageContent>
      </Message>
      <Message>
        <MessageAvatar src="" alt="" fallback="AS" />
        <MessageContent>Yes — mixing tonight, stems tomorrow morning.</MessageContent>
      </Message>
    </div>
  ),
};

export const DateStrip: S = {
  name: "Booking dates: @kibo-ui mini calendar",
  render: function CalendarStory() {
    const [date, setDate] = useState<Date | undefined>(new Date());
    return (
      <div className="space-y-2">
        <p className="pill bg-subtle text-muted-foreground">
          Ours is a full month grid; this is a strip
        </p>
        <MiniCalendar value={date} onValueChange={setDate}>
          <MiniCalendarNavigation direction="prev" />
          <MiniCalendarDays>
            {(d) => <MiniCalendarDay date={d} key={d.toISOString()} />}
          </MiniCalendarDays>
          <MiniCalendarNavigation direction="next" />
        </MiniCalendar>
      </div>
    );
  },
};

export const OurFieldForReference: S = {
  name: "Ours: InlineField",
  render: function FieldStory() {
    const [v, setV] = useState("");
    return (
      <InlineField
        inputId="lab-field"
        label="Display name"
        value={v}
        onChange={setV}
        placeholder="Your name as people know it"
      />
    );
  },
};
