import type { Meta, StoryObj } from "@storybook/react-vite";

import { Reel, ReelContent, ReelImage, ReelItem, ReelProgress } from "@/components/kibo-ui/reel";
import {
  Stories,
  StoriesContent,
  Story,
  StoryAuthor,
  StoryImage,
} from "@/components/kibo-ui/stories";
import { talents } from "@/data/discover";

/* Lab: @kibo-ui stories and reel, using the app's own demo talent photos. We have no equivalent. */

const meta = { title: "Lab/Stories and reel: kibo-ui" } satisfies Meta;
export default meta;
type S = StoryObj<typeof meta>;

export const StoriesRow: S = {
  name: "Stories row",
  render: () => (
    <Stories>
      <StoriesContent>
        {talents.slice(0, 6).map((t) => (
          <Story key={t.id} className="aspect-[3/4] w-[140px]">
            <StoryImage src={t.photo} alt={t.name} />
            <StoryAuthor>
              <span className="text-1 font-semibold text-background">{t.name}</span>
            </StoryAuthor>
          </Story>
        ))}
      </StoriesContent>
    </Stories>
  ),
};

export const ReelPlayer: S = {
  name: "Reel",
  render: () => (
    <div className="mx-auto aspect-[9/16] w-[300px] overflow-hidden rounded-2xl">
      <Reel
        data={talents.slice(0, 4).map((t, i) => ({
          id: i,
          type: "image" as const,
          src: t.photo,
          duration: 4,
          title: t.name,
        }))}
      >
        <ReelProgress />
        <ReelContent>
          {(item) => (
            <ReelItem key={item.id}>
              <ReelImage src={item.src} alt={item.title ?? ""} duration={item.duration} />
            </ReelItem>
          )}
        </ReelContent>
      </Reel>
    </div>
  ),
};
