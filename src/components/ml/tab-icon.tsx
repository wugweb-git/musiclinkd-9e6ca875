import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import homeRaw from "@/assets/icons/gestalt/home.svg?raw";
import compassRaw from "@/assets/icons/gestalt/compass.svg?raw";
import speechRaw from "@/assets/icons/gestalt/speech-ellipsis-fill.svg?raw";
import bagRaw from "@/assets/icons/gestalt/shopping-bag.svg?raw";
import personRaw from "@/assets/icons/gestalt/person.svg?raw";
import checkRaw from "@/assets/icons/gestalt/check-circle.svg?raw";
import sparkleRaw from "@/assets/icons/gestalt/sparkle.svg?raw";
import infoRaw from "@/assets/icons/gestalt/info-circle.svg?raw";
import musicRaw from "@/assets/icons/gestalt/music-on.svg?raw";
import folderRaw from "@/assets/icons/gestalt/folder.svg?raw";
import briefcaseRaw from "@/assets/icons/gestalt/briefcase.svg?raw";
import starRaw from "@/assets/icons/gestalt/star.svg?raw";
import heartRaw from "@/assets/icons/gestalt/heart.svg?raw";

/*
 * Two-state icons: a Lucide outline at rest, a Gestalt solid when on. Gestalt ships at a fixed 24px
 * with no viewBox, so as-is it can't scale; each one gets a viewBox and takes the text colour.
 * They're bundled local files, so the markup is ours.
 */
function solid(raw: string) {
  return raw.replace(
    /<svg[^>]*>/,
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">',
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- icon set co-located with the one component that draws it
export const solidIcons = {
  home: solid(homeRaw),
  compass: solid(compassRaw),
  speech: solid(speechRaw),
  bag: solid(bagRaw),
  person: solid(personRaw),
  check: solid(checkRaw),
  sparkle: solid(sparkleRaw),
  info: solid(infoRaw),
  music: solid(musicRaw),
  folder: solid(folderRaw),
  briefcase: solid(briefcaseRaw),
  star: solid(starRaw),
  heart: solid(heartRaw),
};

export type SolidIcon = keyof typeof solidIcons;

/* How an icon moves when it turns on (keyframes in styles.css), written out whole so Tailwind sees
   the class names. The origin is part of the move: a bag swings from its handle, a house lands
   on its floor. */
const moves = {
  hop: "animate-tab-home origin-bottom",
  spin: "animate-tab-compass",
  talk: "animate-tab-speech origin-bottom-left",
  swing: "animate-tab-bag origin-top",
  dance: "animate-tab-person origin-bottom",
  stamp: "animate-tab-stamp",
  beat: "animate-tab-beat",
} as const;

export type Move = keyof typeof moves;

/**
 * Outline at rest, solid when on. Turning on plays the icon's move; turning off just steps back
 * (150ms, no bounce), so the eye goes to what changed. Only a real change plays it — an icon that
 * mounts already on sits still. Reduced motion is handled globally in styles.css.
 */
export function StateIcon({
  outline: Outline,
  solid: name,
  active,
  size,
  move,
  strokeWidth = 1.8,
}: {
  outline: LucideIcon;
  solid: SolidIcon;
  active: boolean;
  /** Pixels, or any CSS length (e.g. "4.8cqw" inside a container-sized card). */
  size: number | string;
  move: Move;
  strokeWidth?: number;
}) {
  // Set during render, not in an effect, so the move starts on the same frame the icon appears.
  const [was, setWas] = useState(active);
  const [moving, setMoving] = useState(false);
  if (active !== was) {
    setWas(active);
    setMoving(active);
  }

  return (
    <span
      className="relative inline-block shrink-0"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <Outline
        strokeWidth={strokeWidth}
        className={`absolute inset-0 h-full w-full transition-[opacity,scale] ${
          active
            ? "scale-[0.7] opacity-0 duration-[120ms] ease-standard"
            : "scale-100 opacity-100 duration-[220ms] ease-standard"
        }`}
      />
      <span
        onAnimationEnd={() => setMoving(false)}
        className={`absolute inset-0 ${
          active
            ? "opacity-100 transition-opacity duration-[120ms]"
            : "scale-[0.6] opacity-0 transition-[opacity,scale] duration-[150ms] ease-standard"
        } ${active && moving ? moves[move] : ""}`}
        dangerouslySetInnerHTML={{ __html: solidIcons[name] }}
      />
    </span>
  );
}

/* Each bottom-nav tab moves like the thing it is. */
const tabMoves: Partial<Record<SolidIcon, Move>> = {
  home: "hop",
  compass: "spin",
  speech: "talk",
  bag: "swing",
  person: "dance",
};

/** A bottom-nav tab's icon. */
export function TabIcon(props: {
  outline: LucideIcon;
  solid: SolidIcon;
  active: boolean;
  size: number;
}) {
  return <StateIcon {...props} move={tabMoves[props.solid] ?? "stamp"} />;
}

/**
 * A profile's section tabs: icon only until selected, then the icon goes solid with its move and
 * the name slides in. The person profile and the business profile both use this one row.
 */
export function SectionTabs<K extends string>({
  tabs,
  value,
  onChange,
  label,
}: {
  tabs: readonly { key: K; icon: LucideIcon; solid: SolidIcon; move: Move }[];
  value: K;
  onChange: (key: K) => void;
  label: string;
}) {
  return (
    <nav aria-label={label} className="pt-inset sticky top-0 z-tabs bg-background/95 px-2 backdrop-blur">
      <div role="tablist" aria-label={label} className="flex items-stretch">
        {tabs.map(({ key, icon: Icon, solid, move }) => {
          const active = value === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={key}
              onClick={() => onChange(key)}
              className={cn(
                "state-layer relative flex items-center justify-center gap-1.5 rounded-t-sm py-3.5 transition-[flex,color] duration-200 ease-standard",
                active ? "flex-1 px-2 text-foreground" : "w-11 shrink-0 text-muted-foreground",
              )}
            >
              <StateIcon outline={Icon} solid={solid} active={active} size={20} move={move} />
              <span
                className={cn(
                  "overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold transition-all duration-200 ease-standard motion-reduce:transition-none",
                  active ? "max-w-40 opacity-100" : "max-w-0 opacity-0",
                )}
              >
                {key}
              </span>
              {active ? (
                <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-foreground" />
              ) : null}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
