import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { genres, instruments, visibilityOptions, workModes } from "@/data/onboarding";
import { Btn } from "./ui";
import {
  ChipPicker,
  ErrorBanner,
  InlineField,
  OfflineBanner,
  OptionList,
  SavingBanner,
  SelectField,
  StepShell,
  StepSkeleton,
  SyncBanner,
  SyncStatus,
  type SyncState,
} from "./onboarding";

/*
 * The onboarding step surfaces. StepShell is presentational — it takes its step, copy and footer
 * from the route, so every state below is reachable without the onboarding provider.
 *
 * Options come from the existing taxonomy lists in @/data/onboarding. Nothing here invents a role,
 * an instrument or a genre.
 */
const shell = {
  step: 3,
  total: 8,
  group: "Profession",
  title: "What do you play?",
  subtitle: "Pick the instruments you'd be booked for.",
  why: "Instruments are how people filter when they're casting a session.",
};

const meta = {
  title: "Onboarding/StepShell",
  component: StepShell,
  args: { ...shell, children: null, footer: null },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof StepShell>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: function DefaultStory() {
    const [picked, setPicked] = useState<string[]>(["guitar"]);
    const toggle = (v: string) =>
      setPicked((p) => (p.includes(v) ? p.filter((x) => x !== v) : [...p, v]));
    return (
      <StepShell {...shell} footer={<Btn className="w-full">Continue</Btn>} status="idle">
        <ChipPicker options={[...instruments]} selected={picked} onToggle={toggle} />
      </StepShell>
    );
  },
};

/** An optional step says so beside the question, so nobody abandons one they could skip. */
export const Optional: Story = {
  render: () => (
    <StepShell
      {...shell}
      optional
      onBack={() => {}}
      onSkip={() => {}}
      footer={<Btn className="w-full">Continue</Btn>}
    >
      <ChipPicker options={[...genres]} selected={[]} onToggle={() => {}} />
    </StepShell>
  ),
};

/** A cap disables the unselected chips once it is reached, rather than silently ignoring taps. */
export const AtSelectionLimit: Story = {
  render: () => (
    <StepShell
      {...shell}
      subtitle="Pick up to three."
      footer={<Btn className="w-full">Continue</Btn>}
    >
      <ChipPicker options={[...genres]} selected={genres.slice(0, 3)} onToggle={() => {}} max={3} />
    </StepShell>
  ),
};

export const Loading: Story = {
  render: () => (
    <StepShell
      {...shell}
      footer={
        <Btn className="w-full" disabled>
          Continue
        </Btn>
      }
    >
      <StepSkeleton />
    </StepShell>
  ),
};

export const Offline: Story = {
  render: () => (
    <StepShell
      {...shell}
      banner={<OfflineBanner />}
      footer={<Btn className="w-full">Continue</Btn>}
      status="offline"
    >
      <ChipPicker options={[...instruments]} selected={[]} onToggle={() => {}} />
    </StepShell>
  ),
};

export const Error: Story = {
  render: () => (
    <StepShell
      {...shell}
      banner={<ErrorBanner message="We couldn't save your answers." onRetry={() => {}} />}
      footer={<Btn className="w-full">Continue</Btn>}
      status="error"
    >
      <ChipPicker options={[...instruments]} selected={["guitar"]} onToggle={() => {}} />
    </StepShell>
  ),
};

export const Saving: Story = {
  render: () => (
    <StepShell
      {...shell}
      banner={<SavingBanner />}
      footer={
        <Btn className="w-full" loading>
          Continue
        </Btn>
      }
      status="saving"
    >
      <ChipPicker options={[...instruments]} selected={["guitar"]} onToggle={() => {}} />
    </StepShell>
  ),
};

/**
 * Long questions and options in Devanagari and Tamil. The step header, the chips and the footer all
 * have to hold at 412px with the keyboard's height gone from the viewport.
 */
export const LongLabels: Story = {
  render: () => (
    <StepShell
      step={5}
      total={8}
      group="आपके बारे में"
      title="आप किन भाषाओं में काम करते हैं?"
      subtitle="वे भाषाएँ चुनें जिनमें आप रिकॉर्डिंग या प्रदर्शन कर सकते हैं।"
      why="भाषा वह पहला फ़िल्टर है जिसका उपयोग लोग किसी सत्र के लिए कास्टिंग करते समय करते हैं।"
      footer={<Btn className="w-full">जारी रखें</Btn>}
    >
      <ChipPicker
        options={["हिन्दी", "मराठी", "தமிழ்", "മലയാളം", "ਪੰਜਾਬੀ", "ಕನ್ನಡ", "বাংলা", "ગુજરાતી"]}
        selected={["हिन्दी"]}
        onToggle={() => {}}
      />
    </StepShell>
  ),
};

/** The list picker, where each option carries a hint the chips have no room for. */
export const Options: Story = {
  render: function OptionsStory() {
    const [picked, setPicked] = useState<string[]>([]);
    return (
      <div className="space-y-6 p-5">
        <OptionList
          options={workModes}
          selected={picked}
          onToggle={(k) => setPicked((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]))}
        />
        {/* Single-select: visibility is one choice, so `multi` is off. */}
        <OptionList
          options={visibilityOptions}
          selected={["public"]}
          onToggle={() => {}}
          multi={false}
        />
      </div>
    );
  },
};

/** Every field state: hint, valid, error, prefixed, read-only, and a counted multiline. */
export const Fields: Story = {
  render: () => (
    <div className="space-y-5 p-5">
      <InlineField
        inputId="s-name"
        label="Display name"
        value=""
        onChange={() => {}}
        placeholder="Your professional name"
        hint="Use the name you're credited under."
      />
      <InlineField
        inputId="s-user-ok"
        label="Username"
        prefix="musiclinkd.com/"
        value="aditirao"
        onChange={() => {}}
        placeholder="yourname"
        ok="aditirao is available"
      />
      <InlineField
        inputId="s-user-err"
        label="Username"
        prefix="musiclinkd.com/"
        value="aditi rao"
        onChange={() => {}}
        placeholder="yourname"
        error="Lowercase letters, numbers, dots and underscores only."
      />
      <InlineField
        inputId="s-user-lock"
        label="Username"
        prefix="musiclinkd.com/"
        value="aditirao"
        onChange={() => {}}
        placeholder="yourname"
        readOnly
        hint="This is your profile link. Usernames can't be changed."
      />
      <InlineField
        inputId="s-bio"
        label="Short bio (optional)"
        value="Producer and mixing engineer working out of Mumbai."
        onChange={() => {}}
        placeholder="What you do, who you've worked with."
        multiline
        maxLength={240}
        hint="Two lines is plenty."
      />
      <div className="grid grid-cols-2 gap-3">
        <SelectField
          selectId="s-state"
          label="State"
          value="Maharashtra"
          options={["Maharashtra", "Karnataka", "Kerala"]}
          placeholder="Choose"
          onChange={() => {}}
        />
        <SelectField
          selectId="s-city"
          label="City"
          value=""
          options={[]}
          placeholder="State first"
          disabled
          onChange={() => {}}
        />
      </div>
    </div>
  ),
};

/** The save indicator in each state. It never moves the page — it sits quietly in the header. */
export const SyncStates: Story = {
  render: () => (
    <div className="space-y-4 p-5">
      {(["idle", "loading", "saving", "saved", "offline", "error"] as SyncState[]).map((s) => (
        <div key={s} className="rounded-lg border border-border bg-card p-3">
          <p className="mb-2 text-1 text-muted-foreground">{s}</p>
          <SyncStatus state={s} />
          <SyncBanner state={s} onRetry={() => {}} />
        </div>
      ))}
    </div>
  ),
};
