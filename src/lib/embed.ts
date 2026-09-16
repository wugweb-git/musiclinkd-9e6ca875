/*
 * How a portfolio link plays. YouTube, Spotify and SoundCloud have embeddable players; a direct
 * audio or video file plays in the browser's own element; anything else opens in a new tab.
 */
export type Embed =
  | { mode: "iframe"; src: string; height: number }
  | { mode: "audio" | "video"; src: string }
  | { mode: "external"; src: string };

export function embedFor(url: string): Embed | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  const host = u.hostname.replace(/^www\.|^m\./, "");

  if (host === "youtube.com" || host === "youtu.be") {
    const id =
      host === "youtu.be"
        ? u.pathname.slice(1)
        : (u.searchParams.get("v") ?? u.pathname.match(/^\/(?:shorts|embed|live)\/([^/]+)/)?.[1]);
    if (id && /^[\w-]{6,20}$/.test(id)) {
      return { mode: "iframe", src: `https://www.youtube-nocookie.com/embed/${id}`, height: 200 };
    }
  }

  if (host === "open.spotify.com") {
    const m = u.pathname.match(
      /^\/(?:intl-[a-z-]+\/)?(track|album|playlist|episode|artist)\/(\w+)/,
    );
    if (m) {
      const tall = m[1] !== "track" && m[1] !== "episode";
      return {
        mode: "iframe",
        src: `https://open.spotify.com/embed/${m[1]}/${m[2]}`,
        height: tall ? 352 : 152,
      };
    }
  }

  if (host === "soundcloud.com") {
    return {
      mode: "iframe",
      src: `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&visual=false`,
      height: 166,
    };
  }

  if (/\.(mp3|m4a|wav|ogg|aac|flac)$/i.test(u.pathname)) return { mode: "audio", src: url };
  if (/\.(mp4|webm|mov)$/i.test(u.pathname)) return { mode: "video", src: url };

  return { mode: "external", src: url };
}
