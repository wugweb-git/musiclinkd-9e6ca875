import type { Meta, StoryObj } from "@storybook/react-vite";
import { useMemo, useState } from "react";

import { AudioTrackCard } from "@/components/ml/profile";
import { WavePlayer } from "@/components/waves-cn/wave-player";
import { toneUrl } from "./tone";

/* Lab: audio. Ours (AudioTrackCard) next to @waves-cn's waveform player. */

const meta = { title: "Lab/Audio: ours vs waves-cn" } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const track = {
  id: "t1",
  title: "Monsoon Echoes",
  role: "Session musician",
  project: "Single",
  duration: "0:06",
  artwork: "",
};

export const Ours: Story = {
  name: "Ours: AudioTrackCard",
  render: function OursStory() {
    const [playing, setPlaying] = useState(false);
    return (
      <AudioTrackCard track={track} playing={playing} onToggle={() => setPlaying((p) => !p)} />
    );
  },
};

export const WavesCn: Story = {
  name: "@waves-cn: WavePlayer",
  render: function WaveStory() {
    const src = useMemo(() => toneUrl(), []);
    return (
      <WavePlayer
        src={src}
        title="Monsoon Echoes"
        waveColor="var(--border)"
        progressColor="var(--ink)"
        waveHeight={56}
      />
    );
  },
};
