# FLOW 06 — Collaboration (design-only)

Build the collaboration layer: turning a conversation into a structured working project. Reuses the existing Gestalt design system, 430px mobile shell, and the current 5-item bottom nav (no nav redesign). All data is seeded mock data — no backend.

## What gets built

**Entry & list**
- Collaborations home with tabs: Active / Pending / Completed / Drafts, plus search, filter sheet and sort sheet (recently updated, created, deadline, status, alphabetical).
- Project cards: artwork, name, type, my role, participant stack, status pill, last activity, progress.
- Empty states for each tab (no collaborations, no invitations, no active, no completed) with CTAs into Discover and Create.

**Create & invite**
- Create collaboration (name, type, description, your role, location, remote/in-person, timeline, optional budget — most fields optional).
- Add collaborators: search by name, username, role, instrument, business; invite state per person.
- Select role from the canonical role taxonomy already used in onboarding/profile.
- Invite link screen (copy, share, disable) and invite-link privacy notice.

**Invitations & proposals**
- Invitation detail (project, inviter, proposed role, description, timeline, budget) with Accept / Decline / Message.
- Accepted and declined confirmation screens.
- Proposal composer (role, scope, deliverables, timeline, compensation, notes) with Send / Save draft.
- Proposal received, counter proposal (original vs proposed diff), proposal accepted, proposal declined.

**Project workspace**
- Project overview hero: artwork, name, type, status, owner, participants, timeline, "Open Workspace" + "Message participants".
- Workspace tabs: Overview, Discussion, Files, Timeline, Participants, Notes, Activity.
- Discussion: structured thread with replies, attachments, mentions, pinned decisions; a clear handoff button into Messaging rather than a second chat system.
- Files: typed list (audio, video, images, documents, lyrics, contracts, references) with filters, preview, upload sheet with progress / cancel / retry, upload error state, file access sheet, unavailable-file state.
- Audio file detail: artwork, track, version, contributor, duration, waveform player, comment; version history list (v1/v2/final with author, date, notes) that never overwrites.
- Timeline & milestones: milestone list, milestone detail, create milestone, light task list (owner, due, status) kept deliberately minimal.
- Notes (shared notes, decisions, pin, mention) and Activity log (joined, uploaded, milestone completed, proposal accepted, status changed).
- Participants and Roles views with view profile / message / remove-where-permitted.

**Lifecycle & settings**
- Status handling across Draft, Proposed, Active, On Hold, Completed, Cancelled, Archived with visually obvious status treatment.
- On hold / resume, complete project (with consequences explained), completed project screen, cancel / cancelled, archived / restore.
- Leave project, remove collaborator, transfer ownership confirmations.
- Settings: project identity, participants, privacy (private / participants only / public), notifications (routing to the global notification flow), files, ownership, danger zone.
- Share project (copy link, send via MusicLinkd) respecting visibility.

**Handoffs**
- After completion: review handoff ("Leave Review") and portfolio handoff ("Add to Portfolio") — links out, no duplicated functionality.
- Entry points from profile, opportunity, message, business, band, booking are represented as "Propose collaboration" CTAs that deep-link into create/proposal.

**States**
- Gestalt skeleton loading, offline with cached/unsynced indicators, network error with retry, permission error, deleted project.

## Technical approach

- `src/data/collab.ts` — types (project, participant, role, milestone, file, version, proposal, invitation, activity, status enums) plus seeded projects covering every lifecycle state and empty case.
- `src/components/ml/collab.tsx` — reusable kit: ProjectCard, StatusPill, ParticipantStack, RoleRow, MilestoneRow, FileRow, AudioVersionCard, ProposalSummary, ActivityItem, UploadSheet, ConfirmSheet, CollabSkeleton, state banners.
- `src/components/ml/collab-context.tsx` — design-time draft store (React context + localStorage) for create/proposal wizards, mirroring the booking/onboarding pattern.
- Routes under `src/routes/collab*`: `collab.index.tsx`, `collab.new.tsx`, `collab.new.collaborators.tsx`, `collab.$id.tsx` (workspace shell with tabs) + child routes for overview/discussion/files/timeline/participants/notes/activity/settings, `collab.$id.files.$fileId.tsx`, `collab.$id.milestones.new.tsx`, `collab.invites.$id.tsx`, `collab.proposals.$id.tsx`, `collab.proposals.$id.counter.tsx`, plus lifecycle confirmation routes (complete, cancel, hold, leave, transfer, share).
- Cross-flow CTAs added to the person profile and messages screens; existing behaviour otherwise untouched.
- Each route gets its own `head()` with unique title/description/OG tags.
- Strict TS settings (`exactOptionalPropertyTypes`) respected across new component props.

## Out of scope
No backend, APIs, storage, payments, or real messaging/notification/review/portfolio implementations — only design-level handoffs.
