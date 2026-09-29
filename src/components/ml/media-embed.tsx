import { ExternalLink } from "lucide-react";
import { embedFor } from "@/lib/embed";
import { iconSize } from "@/lib/tokens";

/**
 * A portfolio link played in place: the source's own player when it embeds, the browser's player
 * for a direct file, otherwise an "Open on {site}" link to a new tab. `onOpen` hears that link
 * being followed. `onPlay` hears playback actually starting, which only the browser's own player
 * can report: an embedded source's player (YouTube, Spotify, SoundCloud…) says nothing, so no play
 * is counted there rather than one being guessed from a tap.
 */
export function MediaEmbed({
  url,
  title,
  onOpen,
  onPlay,
}: {
  url: string;
  title: string;
  onOpen?: (() => void) | undefined;
  onPlay?: (() => void) | undefined;
}) {
  const embed = embedFor(url);
  if (!embed) return null;
  if (embed.mode === "iframe") {
    return (
      <iframe
        src={embed.src}
        title={title}
        height={embed.height}
        loading="lazy"
        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
        allowFullScreen
        className="w-full rounded-lg border-0 bg-background"
      />
    );
  }
  if (embed.mode === "audio") {
    return (
      // eslint-disable-next-line jsx-a11y/media-has-caption -- user-supplied file; no caption track exists to attach
      <audio
        src={embed.src}
        controls
        preload="none"
        onPlay={onPlay}
        className="w-full"
        aria-label={title}
      />
    );
  }
  if (embed.mode === "video") {
    return (
      // eslint-disable-next-line jsx-a11y/media-has-caption -- user-supplied file; no caption track exists to attach
      <video
        src={embed.src}
        controls
        preload="none"
        onPlay={onPlay}
        className="w-full rounded-lg"
        aria-label={title}
      />
    );
  }
  // Nothing plays in place, so say where it does play instead of pretending it plays here.
  return (
    <a
      href={embed.src}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onOpen}
      className="flex min-h-12 items-center gap-3 rounded-lg border border-border bg-subtle p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-background">
        <ExternalLink size={iconSize.sm} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-foreground">{title}</span>
        <span className="block truncate text-1 text-muted-foreground">
          Open on {platformName(embed.src)}
        </span>
      </span>
    </a>
  );
}

/** "https://www.example.com/x" → "example.com". */
function platformName(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\.|^m\./, "");
  } catch {
    return "the web";
  }
}
