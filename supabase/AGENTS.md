# Database, storage and naming

**Database.** Every schema change is a file in `supabase/migrations/`, applied through Lovable's
own tooling, never pasted into the live database by hand. While Lovable is out of credits, the
owner may have a migration applied directly from the committed file on `main` — unchanged, and
verified against the live database afterwards. It is always a committed file first.
`supabase_migrations.schema_migrations` stopped being updated after `20260918160000`: later
migrations are live without being recorded there, so it is not a record of what is applied.
Nobody writes to it by hand. No new table, bucket, or rename of
either without owner approval; propose the plan first.
**Commit a snapshot to `supabase/dumps/` before any write to the live database**, named
`YYYY-MM-DD-before-<change>.sql`, and reference it from the migration's header — that file is the
undo. A snapshot holds only what the change touches (definitions, row counts), never user data:
the repo syncs to Lovable.

**Naming (owner, 3 Oct 2026).** Storage, tables, files, routes and functions are named by the job,
never by one persona type: a studio is one business type, and a singer's cover and a studio's cover
are the same profile cover. Media buckets, by job:

| Bucket | Holds |
|---|---|
| `avatars` | Profile pictures, any persona |
| `covers` | Profile covers, any persona |
| `gallery` | Profile and band gallery photos |
| `listing-media` | Anything listed in Market: gear for sale or rent, any persona |
| `business-media` | Equipment and amenities of a bookable space, as proof of what it offers; never for sale (5 MB) |
| `verification-documents` | Private, owner-only |

Equipment for sale or rent belongs in `listing-media`; the two buckets are not merged. A
bookable space's tables are `bookables`, `bookable_blocks`, `bookable_equipment` and
`bookable_photos`, linked by `bookable_id` (20261003130000_bookables_rename.sql); its business
type stays on the owner's profile, and `studios_one_per_owner` keeps one per owner. The old
`studio*` views and functions were dropped (20261003140000). **There are no rooms** (owner,
3 Oct 2026): people book a service (`booking_requests.service_id`), one calendar per place; no code
reads `bookable_rooms` or `bookables.services`, which 20261004120000/20261004140000 retire by
renaming (`bookable_rooms_retired`, `services_retired`) and P2 drops.
Data access is server-side `createServerFn` in `*.functions.ts` with `requireSupabaseAuth`; no
client-side Supabase writes. The one exception is file uploads (photos, verification documents):
they go from the browser straight to Supabase Storage (owner, 3 Oct 2026). That is allowed because
the storage rules enforce ownership: every bucket only accepts files inside the uploader's own
folder (their user id, or a studio they own), so a server hop would protect nothing more. Files
are type- and size-checked first and photos resized in the browser (`checkPickedImage`,
`downscaleImage`); the row that points at a file is still written server-side. A storage rule
that checks a folder inside a subquery must say `objects.name` — a bare `name` can resolve to the
subquery's table (20261003100000_fix_studio_media_policies.sql). Private user details live in owner-only `profile_private`.
