import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { BarChart3 } from "lucide-react";
import { ArticleGrid, BottomCta, DownloadCta, TopicFilter, type Article } from "./marketing";

/*
 * The marketing blocks, at the width they are built for. Every number and every piece of copy here
 * is a story fixture — the components hold none of it.
 */

const meta = {
  title: "Marketing/Blocks",
  parameters: { layout: "fullscreen" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const u = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;

export const Bottom: Story = {
  render: () => (
    <div className="bg-background p-5">
      <BottomCta
        title="Built for music professionals"
        body="Connect, collaborate, and grow your career on the only professional network designed for the music industry."
        primary={{ label: "Join MusicLinkd", to: "/welcome" }}
        secondary={{ label: "Learn more", to: "/help" }}
        facts={["12.4k+ artists", "42 cities", "10 languages"]}
      />
    </div>
  ),
};

export const BottomWithoutFigures: Story = {
  name: "Bottom CTA — no figures",
  render: () => (
    <div className="bg-background p-5">
      <BottomCta
        title="Built for music professionals"
        body="Connect, collaborate, and grow your career on the only professional network designed for the music industry."
        primary={{ label: "Join MusicLinkd", to: "/welcome" }}
        secondary={{ label: "Learn more", to: "/help" }}
      />
    </div>
  ),
};

export const Download: Story = {
  render: () => (
    <DownloadCta
      title="Download the app to start creating."
      body="Connect with the global music community on iOS and Android."
      android={{ label: "Download on Android", to: "https://play.google.com" }}
    />
  ),
};

const topics = ["All", "News", "Best practices", "Success stories"] as const;

const articles: Article[] = [
  {
    id: "a-1",
    title: "How to use storefront linking to monetise content",
    date: "15 June 2026",
    topic: "News",
    image: u("photo-1501386761578-eac5c94b800a"),
    to: "/help",
    badge: { kind: "icon", icon: <BarChart3 size={24} aria-hidden /> },
  },
  {
    id: "a-2",
    title: "Photo selection and editing essentials for creators",
    date: "9 June 2026",
    topic: "Best practices",
    image: u("photo-1520523839897-bd0b52f945a0"),
    to: "/help",
    badge: {
      kind: "avatar",
      src: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=200&q=80",
      alt: "",
    },
  },
];

export const Articles: Story = {
  render: function ArticleList() {
    const [topic, setTopic] = useState<(typeof topics)[number]>("All");
    const shown = topic === "All" ? articles : articles.filter((a) => a.topic === topic);
    return (
      <div className="bg-background px-5 py-8">
        <TopicFilter topics={topics} value={topic} onChange={setTopic} className="mb-8" />
        <ArticleGrid articles={shown} />
      </div>
    );
  },
};
