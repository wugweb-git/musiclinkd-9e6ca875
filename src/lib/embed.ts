/*
 * How a portfolio link plays. YouTube (Shorts too), Instagram reels, Spotify, SoundCloud,
 * Bandcamp and Apple Music embed in-app; reels and Shorts play in a tall 9:16 frame; audio/video play directly; web links preview in-app without redirecting out.
 */
export type Embed =
  | { mode: "iframe"; src: string; height: number }
  | { mode: "audio" | "video"; src: string }
  | { mode: "in-app"; src: string };

/** A 9:16 frame on a 412px phone, less the page gutters. */
const REEL_HEIGHT = 600;

export function embedFor(url: string): Embed | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  const host = u.hostname.replace(/^www\.|^m\./, "");

  if (host === "youtube.com" || host === "music.youtube.com" || host === "youtu.be") {
    const cleanPath = u.pathname.replace(/^\/+/, "");
    const id =
      host === "youtu.be"
        ? cleanPath.split("/")[0]?.split("?")[0]
        : (u.searchParams.get("v") ?? u.pathname.match(/^\/(?:shorts|embed|live)\/([^/?]+)/)?.[1]);
    if (id && /^[\w-]{6,25}$/.test(id)) {
      // A Short is portrait: a 9:16 frame at the app's width, not a letterboxed 16:9 strip.
      const short = /^\/shorts\//.test(u.pathname);
      return {
        mode: "iframe",
        src: `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`,
        height: short ? REEL_HEIGHT : 210,
      };
    }
  }

  // Instagram reels and posts, by link (owner, 5 Oct): Instagram's own embed, in a tall frame.
  if (host === "instagram.com") {
    const m = u.pathname.match(/^\/(?:[\w.]+\/)?(reel|reels|p|tv)\/([\w-]+)/);
    if (m) {
      const kind = m[1] === "reels" ? "reel" : m[1];
      return {
        mode: "iframe",
        src: `https://www.instagram.com/${kind}/${m[2]}/embed/`,
        height: REEL_HEIGHT,
      };
    }
  }

  if (host === "open.spotify.com" || host === "spotify.com") {
    const m = u.pathname.match(
      /^\/(?:intl-[a-z-]+\/)?(track|album|playlist|episode|artist)\/([a-zA-Z0-9]+)/,
    );
    if (m) {
      const tall = m[1] !== "track" && m[1] !== "episode";
      return {
        mode: "iframe",
        src: `https://open.spotify.com/embed/${m[1]}/${m[2]}?utm_source=generator&theme=0`,
        height: tall ? 352 : 152,
      };
    }
  }

  if (host === "soundcloud.com") {
    return {
      mode: "iframe",
      src: `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%230d0d0d&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`,
      height: 166,
    };
  }

  if (host === "bandcamp.com" || host.endsWith(".bandcamp.com")) {
    return {
      mode: "iframe",
      src: url,
      height: 180,
    };
  }

  if (/\.(mp3|m4a|wav|ogg|aac|flac)$/i.test(u.pathname)) return { mode: "audio", src: url };
  if (/\.(mp4|webm|mov)$/i.test(u.pathname)) return { mode: "video", src: url };

  return { mode: "in-app", src: url };
}
