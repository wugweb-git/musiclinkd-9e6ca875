import type { Meta, StoryObj } from "@storybook/react-vite";
import { Mail } from "lucide-react";
import { useState } from "react";

import { AuthNotice, Brand, CodeInput, LegalNote, PhoneField, TextField } from "./auth";

/* Primitives: text fields, codes and notices (auth). */

const meta = {
  title: "Primitives/Fields",
  component: TextField,
  args: { label: "Email", value: "", onChange: () => {}, placeholder: "you@example.com" },
} satisfies Meta<typeof TextField>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};
export const Filled: Story = { args: { value: "asha@example.com" } };
export const WithIcon: Story = { args: { leading: <Mail size={18} /> } };
export const WithHint: Story = { args: { hint: "We'll send a 6-digit code." } };
export const WithError: Story = {
  args: { value: "asha@", error: "Enter a valid email, like name@example.com" },
};
export const Disabled: Story = { args: { value: "asha@example.com", disabled: true } };

export const Interactive: Story = {
  render: function Controlled(args) {
    const [v, setV] = useState("");
    return <TextField {...args} value={v} onChange={setV} />;
  },
};

export const Phone: Story = {
  name: "PhoneField",
  render: function PhoneStory() {
    const [v, setV] = useState("");
    return <PhoneField value={v} onChange={setV} />;
  },
};

export const Code: Story = {
  name: "CodeInput: empty, typing, rejected",
  render: function CodeStory() {
    const [v, setV] = useState("");
    return (
      <div className="space-y-6">
        <CodeInput value={v} onChange={setV} />
        <CodeInput value="12" onChange={() => {}} label="Partly typed" />
        <CodeInput value="123456" onChange={() => {}} invalid label="Rejected" />
      </div>
    );
  },
};

export const Notices: Story = {
  name: "AuthNotice: tones",
  render: () => (
    <div>
      <AuthNotice tone="error" title="That code didn't work">
        Check the latest message and try again.
      </AuthNotice>
      <AuthNotice tone="warn" title="You're offline">
        We'll send the code when you're back online.
      </AuthNotice>
      <AuthNotice tone="info" title="Code sent">
        It can take a minute to arrive.
      </AuthNotice>
      <AuthNotice tone="success" title="Signed in" />
    </div>
  ),
};

export const BrandAndLegal: Story = {
  name: "Brand and LegalNote",
  render: () => (
    <div className="space-y-6">
      <Brand compact />
      <LegalNote />
    </div>
  ),
};
