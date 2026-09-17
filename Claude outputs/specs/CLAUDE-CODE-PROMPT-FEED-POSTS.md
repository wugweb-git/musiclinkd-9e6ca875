# Claude Code prompt: feed posts on Home

Version 1.1 · 14 Sep 2026 · Status: ready to paste into a Claude Code session in the app repo
(`musiclinkd-9e6ca875`).

Owner decision (14 Sep 2026): Claude Code builds the posts UI, as an exception to the
"Lovable builds screens" rule. The prompt below is scoped to that one section.

---

## Prompt

Show the posts stored in Supabase `public.feed_posts` on the Home dashboard (`src/routes/feed.tsx`).
Build it from the existing kit only. Before editing, check with the other Claude session whether
`feed.tsx` is claimed. The onboarding restructure may add a "Profile published" block there.

### Data that exists

Table `public.feed_posts`, defined in `supabase/migrations/20260914180000_catalog.sql`:

| column | type | notes |
|---|---|---|
| id | uuid | |
| author_profile_id | uuid → profiles.id | |
| post_type | text | `text` \| `image` \| `audio` \| `video` |
| body | text | nullable |
| media_urls | text[] | image/video URLs, may be empty |
| audio_url | text | nullable |
| likes_count, comments_count | int | imported counts |
| created_at | timestamptz | |

- **RLS:** anyone can read. Authors insert, update and delete their own rows (`auth.uid() = author_profile_id`).
- **Rows today:** 5 imported from Firebase (2 audio, 2 text, 1 image with 1 photo), dated 3–8 Aug 2026.
- **Authors:** arijit.sen, kabeer.varma, vedanshu.beats, wugweb, vikramaditya.roy.
- **No other tables:** there are none for likes, comments or follows.

### Server function

Add `listFeedPosts` to `src/lib/catalog.functions.ts`:
- It takes no input and uses `anonClient()`.
- Select the post fields plus the author: `author:profiles!feed_posts_author_profile_id_fkey(username, display_name, avatar_url, is_verified)`.
- Order by `created_at desc`, limit 20.
- Export a `FeedPostRow` type.
- Return `[]` on error.

### UI rules

1. **Placement:** one section inside `Body` in `feed.tsx`, using the existing `SectionHeader`.
   - Candidate spots: after "Activity" (section 5) or after "Opportunities" (3b). The owner picks.
   - Section title: "Posts". Use no other new copy.
2. **Primitives:** only existing ones from `@/components/ml/ui` and `@/components/ml/kit`, plus the tokens already used in `feed.tsx`.
   - Rows follow the Activity list pattern.
   - Avatars use the existing avatar/img guard pattern: a `bg-subtle` placeholder when there's no URL.
   - Palette: ink primary; brand pink only for small accents such as unread dots. Never pink buttons, links or selection.
3. **Each post shows its own data only:**
   - Author name links to `/profile/$username`, with a verified tick if `is_verified`.
   - Relative time from `created_at`, in the same "N days ago" style as `market-view.ts` and `opportunity-view.ts`.
   - `body` clamped to 3 lines.
   - For `image`/`video`, the first `media_urls` item as a thumbnail.
   - For `audio`, a native `<audio controls preload="none">` when `audio_url` is set.
   - Likes and comments counts as plain numbers.
   - Hide any field that is empty. Never invent text, counts or media.
4. **No interactions that have no backend:** no like, comment or share buttons.
5. **Empty and error state:** if the list is empty or the fetch fails, render nothing. Home already has its own empty states.
6. **Loading:** fetch alongside the existing dashboard data (`useDashboard`/`buildHome`) or with its own `useServerFn` call. Don't block the rest of Home, and follow the existing `SkeletonBody` pattern.
7. **Checks:**
   - Run `npx prettier --write` on changed files, then `npx tsc --noEmit -p .` and `npx eslint` on changed files.
   - Before opening a dev server, say so, then verify Home renders the 5 posts.
8. **Commit:** a conventional message with exactly one trailer, `Co-Authored-By: Wugweb <admin@wugweb.com>`.

### Out of scope

- Composing posts, likes, comments, a dedicated `/posts` route, and profile post tabs.
- Each of these needs a product decision first.
