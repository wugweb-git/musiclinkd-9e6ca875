import type { Meta, StoryObj } from "@storybook/react-vite";
import { Home, Music, Search, UserRound } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsContents,
  TabsList,
  TabsTrigger,
} from "@/components/animate-ui/components/radix/tabs";
import { CommandMenu01 } from "@/components/command-menu-01";
import { Onboarding01 } from "@/components/onboarding-01";
import { ChatEmptyState } from "@/components/spectrumui/blocks/ai-assistants/chat-empty-state";
import { TabSwitcher } from "@/components/tab-switcher";
import { FloatingDock } from "@/components/ui/floating-dock";

/*
 * Registry components the app does not use, kept here on the owner's word rather than deleted.
 * Each one duplicates something we already ship (named in its story), so none of them is wired
 * into a route. They render as the vendor wrote them — our tokens are not applied — so this page
 * is for reference, not for copying.
 */

const meta = {
  title: "Registry/Kept",
  // Vendor components, rendered as the vendor wrote them (see the file comment above) — not
  // wired into a route, not maintained here, so not gated on our a11y bar. Exempt from the
  // blocking a11y gate rather than leaving it permanently unable to go blocking over code we
  // don't ship (audit, 23 Sep).
  parameters: { layout: "padded", a11y: { test: "off" } },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const AnimateTabs: Story = {
  name: "animate-ui tabs (we ship TabHeader)",
  render: () => (
    <Tabs defaultValue="portfolio" className="w-full max-w-md">
      <TabsList>
        <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
        <TabsTrigger value="services">Services</TabsTrigger>
        <TabsTrigger value="reviews">Reviews</TabsTrigger>
      </TabsList>
      <TabsContents className="p-4">
        <TabsContent value="portfolio">Portfolio panel</TabsContent>
        <TabsContent value="services">Services panel</TabsContent>
        <TabsContent value="reviews">Reviews panel</TabsContent>
      </TabsContents>
    </Tabs>
  ),
};

export const CommandMenu: Story = {
  name: "command-menu-01 (we ship /search)",
  render: () => <CommandMenu01 />,
};

export const Onboarding: Story = {
  name: "onboarding-01 (we ship the onboarding flow)",
  render: () => <Onboarding01 />,
};

export const Switcher: Story = {
  name: "tab-switcher (we ship SegmentedField)",
  render: () => (
    <TabSwitcher
      variant="segmented"
      tabs={[
        { id: "audio", label: "Audio", content: "Audio panel" },
        { id: "video", label: "Video", content: "Video panel" },
        { id: "photos", label: "Photos", content: "Photos panel" },
      ]}
    />
  ),
};

export const ChatEmpty: Story = {
  name: "spectrumui chat empty state (we ship EmptyState)",
  render: () => (
    <ChatEmptyState
      variant="Centered"
      prompts={[
        { id: "p-1", label: "Find a session drummer" },
        { id: "p-2", label: "Studios near me" },
      ]}
    />
  ),
};

export const Dock: Story = {
  name: "floating-dock (we ship the bottom nav)",
  render: () => (
    <div className="flex h-48 items-end justify-center">
      <FloatingDock
        items={[
          { title: "Home", icon: <Home className="size-full" />, href: "#" },
          { title: "Search", icon: <Search className="size-full" />, href: "#" },
          { title: "Portfolio", icon: <Music className="size-full" />, href: "#" },
          { title: "Profile", icon: <UserRound className="size-full" />, href: "#" },
        ]}
      />
    </div>
  ),
};
