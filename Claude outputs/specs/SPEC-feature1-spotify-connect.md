---
doc: SPEC-feature1-spotify-connect
version: 1.0
status: CURRENT
updated: 2026-09-16
verified_against: user-supplied Snapchat "Connect Spotify" screenshots (settings entry + Spotify
  OAuth consent) — read 16 Sep 2026
folder: specs
originally: new
---

> **Mechanics, not a mockup.** An earlier turn in this thread built an HTML mockup for this —
> that broke the standing rule that Claude doesn't design screens. This replaces it: same
> feature, written as flow/mechanics/constraints for Vedanshu and Claude Code, no visual design
> decisions made on Claude's side.

# Feature 1 — connect Spotify

## What it is

Account-level connection to Spotify via OAuth, modeled on Snapchat's "Connect Spotify" flow
(reference screenshots: a settings entry point with a sharing-preference sheet, then Spotify's
own OAuth consent screen), adapted to MusicLinkd, light background (Snapchat's reference was
dark).

## Flow — three steps

1. **Entry point.** Somewhere in Settings (exact location/IA is Vedanshu's call — reference
   used a "Music & Listening" section), a row shows Spotify connection status: not connected /
   connected. Tapping it when not connected opens step 2.
2. **Sharing-preference sheet (MusicLinkd's own screen, before handoff).** A bottom sheet asking
   who can see the user's listening activity once connected — options in the reference were
   "All connections" / "Only people I approve" (radio, single-select). Allow → proceeds to
   Spotify's OAuth. Not now → dismisses, no connection made.
3. **Spotify OAuth consent (Spotify's own screen, not MusicLinkd's).** Standard OAuth consent —
   MusicLinkd doesn't design this screen, only chooses which scopes to request. Reference
   requested: account data (name/photo/email), recently-played/now-playing, top artists &
   genres. Agree → returns to MusicLinkd with a connected account; Cancel → returns with no
   change.

## Scopes — pick deliberately, don't default to "everything Spotify offers"

Each scope needs a reason tied to a real MusicLinkd surface, or drop it:

- Account data (display name, photo, email) → needed to label the connection in Settings.
- Recently played / now playing → only needed if there's an actual "now playing" surface on the
  profile. **Open question for Vedanshu: does that surface exist or is it planned?** If not
  planned, this scope shouldn't be requested yet — asking for data you don't use is the kind of
  thing that gets flagged in a privacy review.
- Top artists & genres → reference notes this is "used only if taste-matching is enabled later."
  Same issue: don't request a scope for a feature that doesn't exist yet. Either scope it out of
  v1 or confirm taste-matching is committed.

## States to define (not designed here, just enumerated — someone has to decide what each shows)

- Not connected
- Connected, sharing = all connections
- Connected, sharing = approved-only
- Connection revoked from Spotify's side (token invalid) — MusicLinkd needs to detect this and
  show "reconnect," not silently show stale data
- User disconnects from MusicLinkd's side — what happens to previously-shown "now playing" data
  on their profile immediately after

## Data/backend dependency

This needs an OAuth token store (which table — new or does `profile_private` extend to hold
this?) and a background or on-demand refresh path for now-playing data if that scope is kept.
Not specced here — flagging that it's a real backend decision, not just a UI toggle.

## What this doesn't decide

Exact copy, exact placement in Settings IA, the visual design of MusicLinkd's own two screens
(entry row, sharing sheet), or whether "now playing" and taste-matching are committed features.
Those are Vedanshu's calls — this spec exists so Claude Code has the mechanics (flow, scopes,
states, backend dependency) to build against once those calls are made.
