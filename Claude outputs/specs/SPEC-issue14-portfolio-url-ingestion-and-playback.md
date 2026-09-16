---
doc: SPEC-issue14-portfolio-url-ingestion-and-playback
version: 1.0
status: CURRENT
updated: 2026-09-16
verified_against: Master Schema audit findings from earlier this session (`profile_analytics` is
  legacy-only, counters are client-written — relevant to the "trending" idea below); everything
  else here is mechanics as stated, not checked against the app repo
folder: specs
originally: new
---

# Issue 14 — portfolio item URL ingestion, card states, and a Discover "trending" idea

## What a portfolio item actually is

A URL, of one of (at least): audio, video, audio-with-lyrics ("static" — a still image/lyric
display synced or paired with audio, needs a firm definition, see open question), or a reel
(short vertical video). Four content shapes behind one "add portfolio item" action, not one.

## 1 · Ingestion — detect type, fetch metadata

On submit, the URL needs to be classified (which platform, which of the four shapes) before
anything else, then metadata pulled: title, creator/artist, thumbnail, duration, and — the part
that decides everything downstream — **whether the source allows embedded playback at all.**

That last point is the real fork in the road and needs an explicit source list, not an assumed
"any URL works the same way":

- Platforms with an embeddable player + metadata API (Spotify, YouTube, SoundCloud are the
  common ones with public oEmbed or embed-widget support) → full in-card playback is realistic.
- Platforms that restrict embedding (Instagram Reels' embeddability is far more limited than
  YouTube's, and policies shift) → may only yield a thumbnail + metadata, no in-card play.
- A direct file link (raw `.mp3`/`.mp4`) → no platform metadata at all; MusicLinkd would need to
  read file metadata itself (ID3 tags, duration from the file) rather than fetch it from a
  platform.

**Open question, not guessed at:** which of these sources are actually in scope for v1? "A URL"
covers a very different engineering surface depending on whether that's "paste a Spotify track
link" vs. "paste any link on the internet." Confirm the supported source list before Claude Code
scopes the ingestion work — this single decision changes the size of the task by an order of
magnitude.

## 2 · Card states — two, as described

- **State 1 — default (row or grid).** Static: thumbnail/poster image, content-type icon (audio
  / video / lyrics / reel — reuse the icon-chip pattern from Issues 2/3/7, not a new treatment),
  title, duration if known. No playback yet.
- **State 2 — expanded (on interaction).** Card expands in place, shows the fuller metadata
  (title + artist/source + which MusicLinkd user posted it), and offers playback inline.

## 3 · Redirect — last resort, not the default path

Explicit priority order:

1. **Inline playback in the expanded card** — the goal state, for anything embeddable.
2. **Redirect, only when inline playback isn't possible** (source doesn't support embedding, or
   it's a raw file type the card can't render inline) — and when it does redirect, **new tab**,
   never navigating the viewer away from MusicLinkd.

This means the card component needs to know, per item, which of the two paths it's on — that's
a property set at ingestion time (§1's "does this source allow embedding" check), not something
decided at render time by guessing.

## 4 · Idea — trending portfolio items on Discover

Flagging as an idea under consideration, not a decision — "why not" isn't a spec. Two real
things stand in the way before this is buildable, being direct about both:

- **Discover itself is Phase 2**, not built yet (per Release Phases). This can't ship before
  Discover exists.
- **There's no reliable engagement data to compute "trending" from.** From the Master Schema
  audit earlier this session: `profile_analytics` is legacy-only and its counters are
  client-written (i.e., not a trustworthy server-side signal — a client can under- or
  over-report). "Trending" needs a real definition (plays in the last N days? views? saves?) backed
  by a counter the server actually owns, which doesn't exist yet on the current schema. This
  isn't a UI feature waiting on a Discover screen — it's also a backend/instrumentation gap.

Worth keeping on the list for Phase 2 planning, not worth specifying further until Discover's
own scope is set and a real engagement-counter table exists.

## What this doesn't decide

The supported source list for ingestion (§1's open question — this blocks real scoping), the
exact metadata schema stored per portfolio item, the visual design of the expanded card state,
and whether/how "trending" gets defined once Discover is actually being built.
