import { AudioLines } from "lucide-react";
import { embedFor } from "@/lib/embed";
import { iconSize } from "@/lib/tokens";

/**
 * A portfolio link played in place: the source's own player when it embeds, the browser's player
 * for a direct file, otherwise an Open link to a new tab. `onOpen` hears that link being followed.
 */
export function MediaEmbed({
  url,
  title,
  onOpen,
}: {
  url: string;
  title: string;
  onOpen?: () => void;
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
    // eslint-disable-next-line jsx-a11y/media-has-caption -- user-supplied file; no caption track exists to attach
    return <audio src={embed.src} controls preload="none" className="w-full" aria-label={title} />;
  }
  if (embed.mode === "video") {
    return (
      // eslint-disable-next-line jsx-a11y/media-has-caption -- user-supplied file; no caption track exists to attach
      <video
        src={embed.src}
        controls
        preload="none"
        className="w-full rounded-lg"
        aria-label={title}
      />
    );
  }
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-subtle p-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-background">
        <AudioLines size={iconSize.sm} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{title}</p>
        <p className="truncate text-1 text-muted-foreground">Playing in MusicLinkd</p>
      </div>
      <div className="flex items-center gap-0.5 text-ink" aria-hidden>
        {[0.4, 0.9, 0.6, 0.8, 0.3].map((h, i) => (
          <span
            key={i}
            className="w-1 rounded-full bg-current animate-pulse"
            style={{ height: `${h * 16}px`, animationDelay: `${i * 120}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
