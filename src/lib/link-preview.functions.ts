import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/*
 * Reads a pasted link's title, cover and source so Add work can fill itself in. YouTube, Spotify
 * and SoundCloud answer through their public oEmbed endpoints; any other page is read for its Open
 * Graph tags. Server-side only (the browser can't read other sites), signed-in callers only, http(s)
 * to public hosts only, 5-second limit, and at most 512KB of a page is read.
 */

export type LinkPreview = {
  url: string;
  title: string | null;
  image: string | null;
  author: string | null;
  /** Where the link lives, e.g. "YouTube", "Spotify", or the site's own name. */
  source: string | null;
  /** The work type the link most likely is, when the source says so. */
  kind: "track" | "album" | "video" | "link" | null;
};

const TIMEOUT_MS = 5000;
const MAX_BYTES = 512 * 1024;

function isPublicHost(host: string) {
  const h = host.toLowerCase();
  if (h === "localhost" || h.endsWith(".local") || h.endsWith(".internal")) return false;
  if (/^(127|10|0)\./.test(h) || /^192\.168\./.test(h) || /^169\.254\./.test(h)) return false;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return false;
  if (h.startsWith("[") || h === "::1") return false;
  return true;
}

async function fetchWithLimit(url: string, accept: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { accept, "user-agent": "MusicLinkd link preview" },
    });
    if (!res.ok || !res.body) return null;
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (size < MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      size += value.byteLength;
    }
    await reader.cancel().catch(() => {});
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const c of chunks) {
      bytes.set(c.subarray(0, Math.min(c.byteLength, size - offset)), offset);
      offset += c.byteLength;
    }
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

const oembedSources: {
  test: (u: URL) => boolean;
  endpoint: (url: string) => string;
  source: string;
  kind: (u: URL) => LinkPreview["kind"];
}[] = [
  {
    test: (u) => /(^|\.)youtube\.com$|(^|\.)youtu\.be$/.test(u.hostname),
    endpoint: (url) => `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`,
    source: "YouTube",
    kind: () => "video",
  },
  {
    test: (u) => /(^|\.)spotify\.com$/.test(u.hostname),
    endpoint: (url) => `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`,
    source: "Spotify",
    kind: (u) =>
      u.pathname.includes("/album/") ? "album" : u.pathname.includes("/track/") ? "track" : "link",
  },
  {
    test: (u) => /(^|\.)soundcloud\.com$/.test(u.hostname),
    endpoint: (url) => `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(url)}`,
    source: "SoundCloud",
    kind: (u) => (u.pathname.includes("/sets/") ? "album" : "track"),
  },
];

function metaContent(html: string, key: string) {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${key}["'][^>]*content=["']([^"']*)["']|<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${key}["']`,
    "i",
  );
  const m = html.match(re);
  const v = (m?.[1] ?? m?.[2] ?? "").trim();
  return v ? decodeEntities(v) : null;
}

function decodeEntities(s: string) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export const getLinkPreview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ url: z.string().url().max(500) }).parse(d))
  .handler(async ({ data }): Promise<LinkPreview> => {
    const u = new URL(data.url);
    const empty: LinkPreview = {
      url: data.url,
      title: null,
      image: null,
      author: null,
      source: null,
      kind: null,
    };
    if (!/^https?:$/.test(u.protocol) || !isPublicHost(u.hostname)) return empty;

    const known = oembedSources.find((s) => s.test(u));
    if (known) {
      const body = await fetchWithLimit(known.endpoint(data.url), "application/json");
      if (body) {
        try {
          const j = JSON.parse(body) as {
            title?: string;
            thumbnail_url?: string;
            author_name?: string;
          };
          return {
            url: data.url,
            title: j.title?.trim() || null,
            image: j.thumbnail_url || null,
            author: j.author_name?.trim() || null,
            source: known.source,
            kind: known.kind(u),
          };
        } catch {
          /* fall through to Open Graph */
        }
      }
    }

    const html = await fetchWithLimit(data.url, "text/html");
    if (!html) return { ...empty, source: known?.source ?? null, kind: known?.kind(u) ?? null };
    const title =
      metaContent(html, "og:title") ??
      metaContent(html, "twitter:title") ??
      decodeEntities(html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ?? "") ??
      null;
    const image = metaContent(html, "og:image") ?? metaContent(html, "twitter:image");
    return {
      url: data.url,
      title: title || null,
      image: image ? new URL(image, data.url).toString() : null,
      author: null,
      source:
        known?.source ?? metaContent(html, "og:site_name") ?? u.hostname.replace(/^www\./, ""),
      kind: known?.kind(u) ?? "link",
    };
  });
