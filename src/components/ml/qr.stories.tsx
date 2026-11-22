import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  QrCode,
  QrIdentityCard,
  ScanFrame,
  CameraSurface,
  ScannerControls,
  DestinationPreviewCard,
  CopyLinkRow,
  ShareActions,
} from "./qr";

const meta = {
  title: "Identity/QR",
  component: QrIdentityCard,
  args: {
    name: "Ananya Sharma",
    role: "Playback Vocalist · Hindi Film & Sufi",
    photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
    verified: true,
    handle: "ananya",
    url: "https://musiclinkd.com/@ananya",
  },
  parameters: { layout: "padded" },
} satisfies Meta<typeof QrIdentityCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const IdentityCards: Story = {
  name: "Identity Cards (Light & Dark)",
  render: () => (
    <div className="space-y-6">
      <QrIdentityCard
        name="Ananya Sharma"
        role="Playback Vocalist"
        photo="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80"
        verified
        handle="ananya"
        url="https://musiclinkd.com/@ananya"
        tagline="Available for live sets & playback studio sessions in Mumbai."
      />
      <QrIdentityCard
        name="SoundCraft Studios"
        role="Dolby Atmos Tracking Room"
        photo="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&q=80"
        verified
        handle="soundcraft"
        url="https://musiclinkd.com/studios/soundcraft"
        style="dark"
        compact
      />
    </div>
  ),
};

export const StandaloneCodes: Story = {
  name: "Standalone QR Codes",
  render: () => (
    <div className="flex flex-wrap gap-4">
      <QrCode value="https://musiclinkd.com/@ananya" size={160} style="light" />
      <QrCode value="https://musiclinkd.com/@ananya" size={160} style="dark" />
      <QrCode value="https://musiclinkd.com/@ananya" size={160} style="branded" />
      <QrCode value="https://musiclinkd.com/@ananya" size={160} style="minimal" />
    </div>
  ),
};

export const ScannerChrome: Story = {
  name: "Scanner Viewfinder",
  render: () => (
    <CameraSurface>
      <ScanFrame scanning />
      <ScannerControls
        flash={false}
        onFlash={() => {}}
        onGallery={() => {}}
      />
    </CameraSurface>
  ),
};

export const DestinationPreview: Story = {
  name: "Destination Preview Card",
  render: () => (
    <div className="space-y-4">
      <DestinationPreviewCard
        preview={{
          kind: "profile",
          title: "Ananya Sharma",
          subtitle: "Playback Vocalist · Mumbai",
          meta: "4.9 · 42 reviews",
          image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
          verified: true,
          route: "/profile/ananya",
        }}
      />
      <DestinationPreviewCard
        preview={{
          kind: "service",
          title: "Vocal Tracking & Lead Harmonies",
          subtitle: "SoundCraft Studios · Andheri West",
          meta: "Top rated studio",
          image: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&q=80",
          price: { amount: "3500", unit: "hr" },
          route: "/booking/soundcraft/service",
        }}
      />
    </div>
  ),
};

export const Sharing: Story = {
  name: "Copy and Share Actions",
  render: () => (
    <div className="space-y-4">
      <CopyLinkRow url="https://musiclinkd.com/@ananya" />
      <ShareActions
        url="https://musiclinkd.com/@ananya"
        title="Connect with Ananya on MusicLinkd"
      />
    </div>
  ),
};
