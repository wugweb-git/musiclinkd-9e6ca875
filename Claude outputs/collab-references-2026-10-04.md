# Collab references in the active codebase — 4 Oct 2026

Brief item: "Every remaining import or reference is migrated or explicitly classified before any
retired code is removed." Collab was retired by the owner on 28 Sep 2026: a band is not a collab, and
bands get their own tables. Nothing has been removed. This file only classifies.

Scope: `src/` (excluding the generated `src/routeTree.gen.ts` and `src/integrations/supabase/types.ts`,
which follow the route files and the live schema). There is no root `index.html`, and `public/` has
no collab references. Migrations are cited only where code depends on them. Line numbers are from
`main` at f6c691f.

Classes:

- **(a) Live**: the retired feature, still reachable from a route and the nav.
- **(b) Generic**: the word "collaborate/collaborator/collaboration" in its ordinary sense, or the
  opportunities taxonomy. This is not the retired feature. Keep it.
- **(c) Retired, unreachable**: retired code with no live entry point. Candidate for removal.
- **(d) Shared with bands**: retired naming that bands still run on. It must stay until it is migrated.

## Summary

| Class | Count | What |
|---|---|---|
| (a) Live | 13 | 4 routes, menu entry, release stage, 2 "Start a collab" sheet entry points, the `CollabKindSheet` itself, search "Collabs" group, notification routing, analytics path, `StackDestination` type |
| (b) Generic | 24 groups | portfolio `collaborators`, opportunity `collaboration_type` / `collaboration_types` taxonomy, "Collaborator" opportunity category, "Looking for Collaboration" availability, marketing copy, page descriptions |
| (c) Retired, unreachable | 4 | demo notification `n-5` → `/collab`, `dashboardData`/`headlineUpdate` (dead), stale rows in `registry/buttons-and-links.mdx`, `profile.tsx` comments |
| (d) Shared with bands | 9 | `collabs`/`collab_*` tables in `bands.functions.ts`, `createCollab`/`getCollab`/`addCollabMember`/`setCollabImage` used by band routes, band invitations answered only on `/collab/$id`, `collab_invite`/`collab_joined` notifications linking to `/collab/<id>`, account export of `collab_members`, global search |

**Main finding.** The collab UI cannot be deleted yet. Today a band invitation can only be
answered on `/collab/$id`. The database trigger sends the invitee there
(`supabase/migrations/20260922251000_collab_invite_links.sql:149`, `'/collab/' || v_collab.id`).
`/collab` is also the only list that shows pending band invitations
(`src/routes/collab.index.tsx:106-112`). `/bands` has no invitation inbox. The band manage screen's
Remove member, Transfer ownership and Delete band buttons only close their dialogs
(`src/routes/bands.$id.manage.tsx:217, 228, 239`). The working versions live only in the collab room
(`removeMember`, `transferCollab`, `deleteCollab`). That is a dead-control bug in its own right.

## (a) Live feature still reachable

| # | Where | What it does today |
|---|---|---|
| a1 | `src/routes/collab.index.tsx:34` (`/collab/`) | "Collaborations": lists your bands and projects via `listMyCollabs`, with tabs for Invited, Active and so on. Band rows go to `/bands/$id`; invitations and projects go to `/collab/$id` (106-112). The empty state shows "Start a collab" (226) and opens `CollabKindSheet` (11). |
| a2 | `src/routes/collab.$id.index.tsx:68` (`/collab/$id/`) | The collab room (1,090 lines). Covers details, members, roles, invites, invite link, budget (`collab_private`), visibility, status, transfer, leave and delete. It imports almost all of `collabs.functions.ts`. If the collab is a band, it redirects to `/bands/$id` unless the viewer is invited (188, 211). This makes it the band invitation answer screen (see d4). |
| a3 | `src/routes/collab.new.index.tsx:35` (`/collab/new/`) | "Start a collab": a multi-step project creator (`createCollab`, `listProjectTypes`, `searchPeople`). `?type=band` redirects to `/bands/new` (40). |
| a4 | `src/routes/collab.join.$token.tsx:15` (`/collab/join/$token`) | Join by invite link (`joinCollabByLink` → `join_collab_by_link` RPC), then navigates to `/collab/$id` (36). |
| a5 | `src/components/ml/ui.tsx:171` | Menu → My work → "Collaborations" (`Handshake`), placed above "Bands" (172). |
| a6 | `src/lib/release.ts:16` | `"/collab": "soon"`. The menu row gets a Soon badge but stays tappable (`ui.tsx:298-311` passes `to` with a badge and does not disable the row), so `/collab` is reachable. |
| a7 | `src/components/ml/collab.tsx:11` | `CollabKindSheet`, the only export. It asks "Start a collab: Project / Band" and navigates to `/collab/new?type=…` (15). |
| a8 | `src/routes/opportunities.$id.applicants.$aid.tsx:8, 97, 262` | The applicant screen's "How do you want to work together?" sheet has a "Start a Collaboration" button that opens `CollabKindSheet`. |
| a9 | `src/routes/discover.$slug.tsx:9, 153, 205` | Discover → Projects, empty state "Start Your Own" opens `CollabKindSheet`. The list itself is opportunities (b). |
| a10 | `src/lib/global-search.functions.ts:11-12, 21, 28, 48, 57, 211-255, 351, 383, 394, 488-496, 608`; `src/routes/search.index.tsx:48, 59, 71, 189, 207, 285`; `src/routes/search.why.$id.tsx:29` | The search "Collabs" group queries the `collabs` table (public and not archived). A band hit links to `/bands/$id`; a project hit links to `/collab/$id` (251). `explainResult` has a `collab` kind. Search is itself `soon` (`release.ts:22`). |
| a11 | `src/routes/notifications.index.tsx:60-61, 78-79`; `src/lib/notifications.functions.ts:27-28` | `collab_invite` and `collab_joined` kinds, with icon and tab. The rows' links come from the DB (`/collab/<id>`). See d5. |
| a12 | `src/lib/analytics.ts:111` | `safePath` redacts `/collab/:id` along with `/bands/:id`. Harmless. Drop `collab` from the regex when the routes go. |
| a13 | `src/components/ml/profile.tsx:110` | `StackDestination` type includes `"/collab"`. No caller passes it (checked). Remove it with the routes, or `tsc` breaks once `/collab` leaves the route tree. |

## (b) Generic wording, not the retired feature — keep

| Where | Why it stays |
|---|---|
| `src/lib/portfolio.functions.ts:18, 157, 569, 607`; `src/components/ml/work-form.tsx:91, 157, 267, 321`; `src/components/ml/portfolio.tsx:201-203, 425`; `src/routes/portfolio.$id.index.tsx:205-209`; `src/lib/profile-view.ts:248`; `src/components/ml/profile.tsx:1105-1106`; `src/data/portfolio.ts:29, 184, 197, 210, 399`; `src/data/profile.ts:56, 96, 154, 217, 418-508, 655`; `src/data/linked-profiles.ts` (`collaborators:` throughout); `src/components/ml/portfolio.stories.tsx:20, 44, 64`; `src/components/ml/work-form.stories.tsx:58` | The `collaborators` credit on a portfolio item: the people a piece of work was made with. |
| `src/lib/taxonomy.ts:35`; `src/lib/catalog.functions.ts:86, 152`; `src/lib/applications.functions.ts:245, 263`; `src/lib/opportunity-view.ts:49-53, 91`; `src/data/opportunities.ts:76, 93-94`; `src/routes/opportunities.new.tsx:89-93, 120`; `src/routes/opportunities.search.tsx:52-65`; `src/lib/global-search.functions.ts:69, 267, 515-526`; `src/lib/portfolio.functions.ts:691` | `collaboration_type` / `collaboration_types` taxonomy on opportunities (Work for Hire, Royalties Split, Co-Write). Nothing to do with collab rooms. |
| `src/data/opportunities.ts:13, 42-43`; `src/lib/opportunity-view.ts:22, 32`; `src/components/ml/opportunity.tsx:71`; `src/lib/fit.ts:73`; `src/routes/discover.$slug.tsx:167, 199` | The "Collaborator" opportunity category (`categoryKey: "collab"`): an opportunity whose role isn't a single person category. The key is named `collab`, but it is an opportunity category, not the feature. |
| `src/data/profile.ts:23`; `src/components/ml/profile.tsx:335`; `src/lib/profile-view.ts:60`; `src/data/linked-profiles.ts:108, 550, 735, 934` | The availability value "Looking for Collaboration". |
| `src/data/onboarding.ts:193, 203`; `src/data/linked-profiles.ts:315, 720, 919, 1091, 1288, 1471` | Onboarding "available for: Collaborations" and intent "Find Collaborators". These should come from `taxonomy_options` per AGENTS.md, but that is a separate issue. |
| `src/routes/index.tsx:152`; `src/components/ml/talent-profile.tsx:215`; `src/routes/welcome.tsx:50, 312, 318`; `src/components/ml/marketing.stories.tsx:25, 40`; `src/routes/onboarding/index.tsx:234`; `src/routes/onboarding/done.tsx:26`; `src/routes/profile.index.tsx:31`; `src/routes/reviews.request.tsx:24`; `src/routes/opportunities.index.tsx:141`; `src/routes/opportunities.$id.manage.tsx:127`; `src/components/ml/cards.tsx:171`; `src/components/onboarding-01.tsx:42` | Marketing and head copy ("Connect. Collaborate. Create.", "find collaborators"). Note that `opportunities.$id.manage.tsx:127` ("Convert the shortlist into a booking or a collaboration") points at the same next step as a8. Reword it when a8 changes, but it is copy, not code. |
| `src/routes/bands.$id.contact.tsx:31` | The enquiry reason "Collab" on a band's contact form: a reason to contact a band. |
| `src/components/ml/market.tsx:1100`; `src/components/ml/kit.tsx:394`; `src/components/ml/links.tsx:15`; `src/components/ml/profile.tsx:535, 611` | Comments that name collab screens as users of a shared block. `links.tsx:15` refers to a `RowLink` in `collab.tsx` that no longer exists. Fix these comments when the code goes. |

## (c) Retired code with no reachable entry — candidates for removal

| Where | Why |
|---|---|
| `src/data/notifications.ts:87-96` (`n-5`, "Milestone due tomorrow", `to: "/collab"`), plus the `collaboration` category at 12, 35, 150 | The `notifications` array (44) is not imported anywhere. Only `categoryMeta`, `channels`, `defaultPreferences` and `quietHours` are. The `collaboration` category also feeds `notifications.settings.tsx` through `categoryMeta`/`defaultPreferences`, so it shows a "Collaboration" preference row today. Remove `n-5` freely. Remove or retarget the category once band invites have their own category. |
| `src/data/dashboard.ts:81-82, 224, 230-232` | `dashboardData` and `headlineUpdate` are not imported anywhere (only `emptyDashboard` is, in `home.tsx:14`). The "collabs" stat links to `/opportunities`, so the wording is generic, but the code is dead. |
| `src/registry/buttons-and-links.mdx:50, 68, 95-96, 102-103, 181-186, 205-216, 256-258, 278, 323` | A generated inventory (16 Sep) listing `collab-workspace.tsx` and `collab.$id.files/.media/.milestones/.participants/.settings/.share/.timeline`, `collab.invites.$id`, `collab.new.collaborators`. None of these files exist. The rows are stale. Regenerate the inventory or delete the rows. |
| `src/lib/bands.functions.ts:15-18` (comment "a band is a collab of type 'band' (owner, 17 Sep 2026)") | The comment contradicts the 28 Sep decision. Update it when bands move to their own tables. The code under it is (d). |

## (d) Shared with bands — must stay until migrated

| # | Where | Dependency |
|---|---|---|
| d1 | `src/lib/bands.functions.ts:96-101, 123, 136, 174, 197, 221-239, 265-285, 311-401` | Every band read and write uses the `collabs` table (`.eq("type", "band")`) and `collab_members`, `collab_events`, `collab_releases`, `collab_live_videos`, `collab_gallery` (the band showcase; `band-sections.tsx:597`). Permissions come from the `collab_can_manage` DB function (147, 296). |
| d2 | `src/routes/bands.new.tsx:12, 45-47, 61-73` | Creating a band calls `createCollab({type:"band"})` (→ `start_collab` RPC), `getCollab` and `addCollabMember`. |
| d3 | `src/routes/bands.$id.invite.tsx:18, 48-51`; `src/routes/bands.$id.index.tsx:52, 106` | Inviting a member uses `addCollabMember` (a `collab_members` row with status `invited`). The band cover and avatar use `setCollabImage`. |
| d4 | `src/routes/collab.$id.index.tsx:178-215`; `src/routes/collab.index.tsx:106-112` | **Band invitations are answered only here.** `answerCollabInvite` is called only from the collab room. The invited band member stays on `/collab/$id` to answer, and only `/collab` lists their pending invitations. |
| d5 | DB triggers: `supabase/migrations/20260918150000_collab_invites.sql:95-102`, `20260922251000_collab_invite_links.sql:143-162`, `20260921180000_collab_complete.sql:64` | `collab_invite` / `collab_joined` notifications, including band invitations, store the link `'/collab/' || id`. Removing the routes breaks every existing and future band-invite notification. The `notifications_kind_check` constraint (`20260922320000_enquiry_notices.sql:10`) lists both kinds. |
| d6 | `src/routes/bands.$id.manage.tsx:109, 183-186, 217, 228, 239` | Remove member, Transfer ownership and Delete band are dead controls (they close the dialog and do nothing). The working versions exist only as `removeMember`, `transferCollab` and `deleteCollab` in `collabs.functions.ts`, used only by the collab room. These need to move to bands, not be deleted. |
| d7 | `src/lib/collabs.functions.ts` (648 lines; tables `collabs`, `collab_members`, `collab_private`, `collab_invite_links`, `taxonomy_options[project_types]`; RPCs `start_collab`, `join_collab_by_link`) | Bands use 4 of its 21 exports (`createCollab`, `getCollab`, `addCollabMember`, `setCollabImage`), and need 4 more for d4/d6 (`answerCollabInvite`, `removeMember`, `transferCollab`, `deleteCollab`; also `setMemberRole` and `leaveCollab` if band roles and leaving are wanted). Project-only and safe to drop with the UI: `listProjectTypes`, `listMyCollabs`, `setCollabVisibility`, `setCollabStatus`, `updateCollab`, `getCollabBudget`, `setCollabBudget`, `getCollabInviteLink`, `setCollabInviteLink`, `joinCollabByLink`, `letInCollabMember`, and the `CollabMessage` type. |
| d8 | `src/lib/account.functions.ts:43` | Account data export includes `collab_members` (band membership). Keep it, or rename it when the table is renamed. |
| d9 | `src/lib/global-search.functions.ts:222-255` | Bands are found in search through the `collabs` query. Splitting off the project half is fine. The band half must stay until bands have their own table. |

## Recommended removal order

What must be migrated first (blocking):

1. **Band invitations off `/collab`.** Add an invitation answer to the band side: an invited state
   on `/bands/$id`, or an invitations list on `/bands`, using `answerCollabInvite` (moved or
   re-exported from `bands.functions.ts`). Then a migration retargets the notify triggers so band
   rows link to `/bands/<slug>` (d4, d5). Existing notification rows pointing at `/collab/<id>`
   need either a data update in the same migration or a redirect route kept for a while. Snapshot to
   `supabase/dumps/` first.
2. **Band manage controls.** Wire Remove member, Transfer ownership and Delete band on
   `bands.$id.manage.tsx` to the existing functions (d6). This fixes a dead-control bug regardless.
3. **Move the band-used functions** (`createCollab` for bands, `getCollab`, `addCollabMember`,
   `setCollabImage`, `answerCollabInvite`, `removeMember`, `transferCollab`, `deleteCollab`) into
   `bands.functions.ts` under band names. They still sit on the `collab*` tables (d1-d3, d7).

Then remove, in this order, running `bunx tsc --noEmit` after each step:

4. Entry points: menu row `ui.tsx:171`, `release.ts:16`, "Start a Collaboration" in
   `opportunities.$id.applicants.$aid.tsx` (8, 97, 262), "Start Your Own" in `discover.$slug.tsx`
   (9, 205). The owner should decide what these buttons become (a message? an offer?), since
   removing them leaves the "How do you want to work together?" sheet with one option.
5. `src/components/ml/collab.tsx` (`CollabKindSheet`).
6. Routes `collab.index.tsx`, `collab.$id.index.tsx`, `collab.new.index.tsx`,
   `collab.join.$token.tsx`. Then `"/collab"` in `StackDestination` (`profile.tsx:110`), the project
   branch of global search (`global-search.functions.ts:251`) and the `collab` kind in
   `search.why.$id.tsx`, and `collab` in `analytics.ts:111`. `routeTree.gen.ts` regenerates.
7. The project-only exports of `collabs.functions.ts` (d7), then the file itself once step 3 is done.
8. Dead data and docs: `n-5` and the `collaboration` category in `data/notifications.ts`, the
   `dashboardData`/`headlineUpdate` dead code, stale rows in `registry/buttons-and-links.mdx`, and the
   stale comments listed in (b) and (c).
9. Last, and only with owner approval, since it renames tables: give bands their own tables (the
   `collabs` → `bands`, `collab_*` → `band_*` rename, done the way `bookables` was), drop
   `collab_private` and `collab_invite_links` and the project rows, and rename the
   `collab_invite`/`collab_joined` notification kinds. Bands stay on the `collab*` tables until then.

Not run: no builds, typecheck or tests. This is a read-only inventory.
