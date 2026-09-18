import { ExternalLink } from "lucide-react";
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
    <a
      href={embed.src}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onOpen}
      className="state-layer press-brand inline-flex min-h-control-sm w-full items-center justify-center gap-2 rounded-full bg-ink px-4 text-sm font-semibold text-background"
    >
      <ExternalLink size={iconSize.sm} aria-hidden /> Open
    </a>
  );
}
