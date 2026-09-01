# FLOW 06 — Collaboration: complete the remaining screens

The collaboration layer already exists (home with tabs/search/filters/sort, create + add collaborators, invitation and proposal review, counter proposal, workspace with Overview / Discussion / Files / File detail / Timeline / People / Notes / Activity, settings, share, and lifecycle confirmations). This plan closes the gaps between what is built and the 63-screen spec, in the same design-only, mock-data manner — no backend, no APIs, no storage, no navigation redesign, no second messaging system.

## What gets added

**Roles & agreement**
- Project Roles screen: role, person, responsibility, status — read from the canonical role taxonomy already used in onboarding and profiles.
- Project Agreement screen: scope, roles, timeline, compensation, ownership, credit, deliverables, with a plain note that this is a working agreement, not a legal contract. Linked from Settings and Overview.

**Media & milestones**
- Shared Media gallery: All / Audio / Video / Images / Documents filters over the project's existing files, with previews.
- Milestone detail: milestone, owner, deadline, status, notes, plus Complete / Edit where permitted.

**Proposals & invitations — full outcome set**
- Proposal composer (new proposal): project, role, scope, deliverables, timeline, compensation, notes, with Send / Save draft / Cancel.
- Proposal accepted and proposal declined outcome screens.
- Invitation accepted ("You're now collaborating on…", role, participants, Open Project) and invitation declined screens.

**Permissions & ownership**
- Invite link screen: copy, share, disable link, with the controlled-access notice.
- Transfer ownership confirmation (current owner → new owner).
- Remove collaborator confirmation, gated to permitted roles.

**Remaining states**
- Deleted project state ("This collaboration is no longer available") wired into the workspace and detail routes.
- Empty states for no collaborators / no files / no milestones / no activity inside the workspace tabs.

## Technical approach

- Extend `src/data/collab.ts` with the small amount of extra mock data these screens need (role responsibilities, proposal outcomes, invite link record); reuse existing types.
- Reuse the `src/components/ml/collab.tsx` kit and `WorkspaceShell`; add only primitives that don't exist yet (media tile, role row detail, outcome/confirmation panel).
- New flat routes: `collab.$id.roles.tsx`, `collab.$id.agreement.tsx`, `collab.$id.media.tsx`, `collab.$id.milestones.$mid.tsx`, `collab.$id.invite-link.tsx`, `collab.$id.transfer.tsx`, `collab.$id.participants.$pid.remove.tsx`, `collab.proposals.new.tsx`, `collab.proposals.$id.accepted.tsx`, `collab.proposals.$id.declined.tsx`, `collab.invites.$id.accepted.tsx`, `collab.invites.$id.declined.tsx`.
- Each route gets its own `head()` with a unique title, description and OG/Twitter tags.
- Entry points added from Settings, Participants, Timeline, Files and the Collaborations home so nothing is orphaned.

## Out of scope

Backend, APIs, database, real file storage, payments, and real messaging / notifications / reviews / portfolio — those stay as design-level handoffs.
