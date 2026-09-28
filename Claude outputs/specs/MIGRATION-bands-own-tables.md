# Migration — bands get their own tables, collab retires

**Owner, 28 Sep 2026: delete collabs as a concept; a band is not a collab type.**
This reverses the 17 Sep model ("a band is a collab of type 'band'"), recorded in
`src/lib/bands.functions.ts:15` and in the `collab-model` memory.

> **Not applied.** This is the proposed migration, written to `Claude outputs/specs/` on purpose —
> **not** to `supabase/migrations/`, because a file there is applied on the next deploy. Per the
> standing rule, a SQL dump of the live database is committed to git before any database write, and
> the MusicLinkd project (Lovable Cloud) is not reachable from the session that wrote this.

## What exists today

Bands are rows in the collab tables filtered by `type = 'band'` — `bands.functions.ts` queries
`.from("collabs").eq("type", "band")` in at least three places.

| Table | Rows | Columns | Used by |
|---|---|---|---|
| `collabs` | 3 | 23 | bands + collabs |
| `collab_members` | 11 | 9 | bands + collabs |
| `collab_events` | 7 | 12 | band shows |
| `collab_releases` | 3 | 8 | band releases |
| `collab_messages` | 0 | 5 | collab chat only |

`collabs` carries `slug`, `name`, `tagline`, `bio`, `genres`, `city`, `formed_year`, `avatar_url`,
`cover_url`, `looking_for`, `availability`, `type`.

## The migration

Four new tables, mirroring what bands actually use. `collab_messages` has **no band equivalent** —
band chat does not exist, and its 0 rows confirm nothing is lost.

```sql
-- 1. New tables, same shapes minus `type`.
create table public.bands (like public.collabs including all);
alter table public.bands drop column type;

create table public.band_members (like public.collab_members including all);
create table public.band_events  (like public.collab_events  including all);
create table public.band_releases(like public.collab_releases including all);

alter table public.band_members  rename column collab_id to band_id;
alter table public.band_events   rename column collab_id to band_id;
alter table public.band_releases rename column collab_id to band_id;

-- 2. Copy only the band rows.
insert into public.bands
  select id, slug, name, tagline, bio, genres, city, formed_year, avatar_url, cover_url,
         looking_for, availability /* … remaining columns … */
  from public.collabs where type = 'band';

insert into public.band_members  select * from public.collab_members
  where collab_id in (select id from public.collabs where type = 'band');
insert into public.band_events   select * from public.collab_events
  where collab_id in (select id from public.collabs where type = 'band');
insert into public.band_releases select * from public.collab_releases
  where collab_id in (select id from public.collabs where type = 'band');

-- 3. Re-point the foreign keys at bands, then add RLS matching the collab policies.

-- 4. Only once the app reads the new tables:
drop table public.collab_messages;
drop table public.collab_releases;
drop table public.collab_events;
drop table public.collab_members;
drop table public.collabs;
```

## Code that changes with it

| File | Change |
|---|---|
| `src/lib/bands.functions.ts` | `.from("collabs").eq("type","band")` → `.from("bands")`; the three child queries follow |
| `src/lib/collabs.functions.ts` | deleted |
| `src/lib/account.functions.ts`, `src/lib/global-search.functions.ts` | drop the collab reads |
| `src/routes/collab.index.tsx`, `collab.$id.index.tsx`, `collab.join.$token.tsx`, `collab.new.index.tsx` | deleted |
| `src/components/ml/collab.tsx` (`CollabKindSheet`) | deleted, or becomes the band-create drawer |
| `taxonomy_options` | `collaboration_types` (4) loses its only consumer |

## The membership rule this also settles

**A business cannot be part of a band; it can only view one** (owner, 28 Sep). Nothing enforces that
today — `collab_members.profile_id` is a plain FK to `profiles`, with no cohort constraint. The new
`band_members` should carry it:

```sql
-- a band member is a talent profile, never a business page
alter table public.band_members add constraint band_members_talent_only
  check (public.is_talent_profile(profile_id));
```

…or enforce it in the invite and join server functions, which is cheaper and reversible.

## Order

1. Commit a SQL dump of the live database to git.
2. Create and backfill the four tables; leave the collab tables in place.
3. Point `bands.functions.ts` at them; ship; confirm bands still read and write.
4. Delete the collab routes, functions and component.
5. Drop the collab tables.

Steps 2 and 5 are the only irreversible ones, and they are separated by a shipped, verified step on
purpose.
