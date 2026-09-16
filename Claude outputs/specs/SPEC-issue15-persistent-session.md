---
doc: SPEC-issue15-persistent-session
version: 1.0
status: CURRENT
updated: 2026-09-16
verified_against: stack facts from earlier this session (Supabase Auth, PWA now / Capacitor
  later per Issue 4) — not checked against the app's current auth setup in the repo
folder: specs
originally: new
---

# Issue 15 — keep the user signed in on the device (like Facebook)

## What "simple" actually means here

The behavior is simple — open the app, you're still logged in, same as Facebook/Instagram/etc.
The default should be **persistent by default**, not an opt-in "remember me" checkbox — Facebook
doesn't ask, it just keeps you in until you explicitly log out or the session is revoked. Match
that: no checkbox, no extra step, just don't log the user out on app close.

## Mechanics — this is Supabase Auth session config, not a custom build

Since the stack is Supabase Auth, this is mostly configuration, not new infrastructure:

- Supabase's client already supports persisted sessions (`persistSession: true`) and silent
  token refresh (`autoRefreshToken: true`) — confirm these are actually set, since "not staying
  logged in" on a Supabase-backed app is almost always one of these being off or a storage
  problem, not a missing feature.
- **Where the session token is stored matters and differs by platform stage** (per Issue 4's
  PWA-now/Capacitor-later sequence):
  - PWA stage (now): browser storage (localStorage/IndexedDB). Persists across app closes and
    device restarts as long as the user doesn't clear site data or use a private/incognito
    context — that's an inherent PWA limitation, not a bug to chase.
  - Capacitor stage (later): can move to native secure storage (Android Keystore-backed), which
    is more durable and more secure than browser storage. Worth planning for at that stage
    rather than over-engineering the PWA stage to work around a limitation Capacitor removes
    anyway.
- Refresh token rotation: make sure an expired access token triggers a silent refresh using the
  refresh token, not a forced re-login — that's the actual mechanism behind "stays logged in
  indefinitely" rather than "logged in until the access token's short expiry."

## What ends the session

Explicit log-out only (or a revoked/expired refresh token — e.g. inactive long enough that
Supabase's refresh-token expiry kicks in, if that's configured). Not app close, not device
restart, not backgrounding.

## Open question

Is there a maximum session lifetime wanted (e.g. force re-login after 90 days of inactivity,
common for security-conscious apps), or should it behave exactly like Facebook — persistent
indefinitely until explicit logout? Not deciding that here; it's a real security/UX trade-off
call.

## What this doesn't decide

Whether to add a device/session management screen (where the user can see and revoke other
signed-in devices) — that's a bigger feature, not implied by "remember me," flagging it as a
possible future ask rather than bundling it in here.
