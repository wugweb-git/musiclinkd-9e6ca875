<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

# Working in this repository

MusicLinkd — India's music-industry network, live at `app.musiclinkd.com`. Nothing is a prototype.
Component, route and database rules live in `src/components/`, `src/routes/` and `supabase/` AGENTS.md.

## Git
- Lovable syncs only `main`; branch, merge `--no-ff`, push. Never force push, rebase, amend or squash pushed work.
- Push only when the Lovable agent is idle; merge any `lovable-sync` branch, never delete it unmerged.
- Commits describe the diff and end with exactly one trailer: `Co-Authored-By: Wugweb <admin@wugweb.com>`

## Code
- `exactOptionalPropertyTypes`: optional props as `x?: T | undefined` at the definition. No `as any` on links.
- Tailwind token classes only; inline `style` only for runtime values. Never key styling off display copy.
- Lucide icons at `iconSize`, default stroke; never emoji. Focus-visible ring and 48px hit target on every control.
- Radius `sm` 8 / `lg` 16 / `3xl` 32 / `full`; no others. Type `text-1`, `text-sm`, `text-2`, `text-3`, `text-4`;
  `text-[10px]`/`text-[11px]` only for metadata; `text-0/2.5/5/xs/base/lg` don't exist. Tracking normal.
- Colour: `ink` is the only dark token (no `primary`); greys and white. Brand pink is a signal only — read the
  `--brand` comment in `src/styles.css`. Three grounds: `--auth-ground` (sign-in), `--background` (content), `--card` (raised).
- Motion lives in `src/styles.css` (`screen-enter`, press scale, `lift`, `reveal`), behind reduced-motion.

## Data
- Database rows are live data. Hardcoded content only in `src/data/`; screens read the database.
- Never fabricate counts, availability, ratings, payments or bookings. Store timestamps, not relative text.
- Option lists come from `taxonomy_options`; read with `labelFor`, compare cities with `sameCity`.

## Checks
Default `bunx tsc --noEmit`. Before a push run CI: tsc, `bun run lint`, `bun run test-storybook`,
`bun run check-token-drift`, `bun run build`. Screenshots and `CHANGELOG.md` only when asked. No
`roadmap.md`; open work goes in the reply. Don't commit dated audit reports or one-off prompts.
Say plainly what was not run, what couldn't be read, and where sources disagree.
