---
doc: SPEC-issue8-earnings-bands-home-profile
version: 1.0
status: CURRENT
updated: 2026-09-16
verified_against: stated by Vedanshu, not independently checked against the app repo — the two
  bug reports (notification, profile save) need Claude Code to reproduce, not just take as given
folder: specs
originally: new
---

# Issue 8 — earnings visibility, Bands deferral, Home consolidation, two bugs, name field split

## 1 · Hide Earnings from Profile / Home

Consistent with Issue 6 (no in-app financial transactions) — if there's no payment on the
product itself, an Earnings surface has nothing real behind it. Hide it from both Profile and
Home for now, not just one.

## 2 · Bands → deferred to Phase 4, shown with a "Soon" badge (not hidden)

This is a change from the existing Release Phases doc, which had Bands in Phase 3. Moving it to
Phase 4 per this message. My reading of "will do it later, Phase 4 — or put a small shining
label 'Soon' on it" is that both parts are one decision: **defer the feature, but keep its entry
point visible with a "Soon" badge rather than removing it from the UI** — stating that
interpretation plainly in case it's wrong.

**Notion note:** I tried to update the Release Phases page (`Release Phases — talent first`) to
move Bands from Phase 3 to Phase 4 and record this, and the update was blocked/denied on this
end. It has NOT been changed in Notion yet — the doc still shows Bands under Phase 3. Tell me to
retry, or I'll take another pass next message.

## 3 · Home — merge "Shortcuts" and "Tools", redo the UI

This is a screen-design ask, and per the standing rule I don't design screens. What I can do
without a current screenshot of Home is name the actual question that needs answering before
anyone redesigns it: what's the full list of items in each of the two sections today, and which
ones are actual duplicates vs. distinct (a "shortcut" to a screen vs. a "tool" that does
something in place)? Send the current Home screenshot and I'll do the same measured audit as
Issues 2/3 — what's redundant, what the merged list should contain — and leave the actual layout
to you.

## 4 · Bug — notifications not working on Home

Reported, not diagnosed — I don't have repo/runtime access to say why. Handing to Claude Code as
a bug: notification icon/badge/feed on the Home screen isn't functioning. Needs reproduction
steps and a check of whatever notification data source or badge-count logic feeds that Home
surface before a fix is proposed.

## 5 · Bug — Profile edits not saving (name, missing fields)

Also reported, not diagnosed. Editing name or filling in a previously-missing profile field
doesn't persist. Needs reproduction (is it a client-side state issue not calling the update, a
failed request being swallowed silently, an RLS/permission rejection, etc.) — Claude Code's call
once it's actually looked at the code path.

**My recommendation on the fix, since it was asked for directly:** explicit **Save button**, not
silent autosave. Two reasons, not just preference — first, autosave that fails silently is
worse than a broken save button: with a button, a failure is visible (nothing happened, try
again); with autosave, the user believes it saved and walks away, which is exactly the bug
you just hit, just invisible instead of visible. Second, this bug means something in the save
path is already broken — fix and verify that path with an explicit, observable action (button →
success/error state) before layering autosave's silent-failure risk on top of it. Autosave can
be revisited once the underlying save path is proven reliable.

## 6 · Name field — split into First name / Last name

Update the profile name field from a single name field to first name + last name. Data model
and form change — actual schema/migration decision (nullable last name? display concatenation
rule?) is Claude Code's to work out, not specced further here.
