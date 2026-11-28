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

## Dual-Repo Architecture & Ecosystem Bridge
- **Parent Repository (`musiclinkd`):** Primary production host at `musiclinkd.com` (Hostinger LiteSpeed). Houses the WordPress FSE theme, DirectoryWeb listings (`/directory/`), WooCommerce Marketplace & WPS Bookings (`/shop/`, `/product/`), Dokan Multi-Vendor studio storefronts (`/studio/`), and FluentCRM marketing automation.
- **Child Repository (`musiclinkd-app`):** Lives at `app.musiclinkd.com` on Cloudflare Edge / Nitro runtime. Uses Supabase PostgreSQL as the low-latency operational buffer for authentication, live messaging, stems audio streaming, and realtime event subscriptions.
- **REST Catalog Bridge Endpoints:**
  - `GET https://musiclinkd.com/wp-json/musiclinkd/v1/directory` (DirectoryWeb listings: 140 verified creator & studio profiles)
  - `GET https://musiclinkd.com/wp-json/musiclinkd/v1/catalog` (WooCommerce Marketplace: 288 bookable services & gear rentals)
  - `GET https://musiclinkd.com/wp-json/musiclinkd/v1/studios` (Dokan Multi-Vendor: 46 studio storefronts)
- **Zero In-App Checkout Payments:** Peer-to-peer agreement model (0% platform commission, offline UPI/bank settlement). In-app payment gateways remain disabled.

## Checks
Default `bunx tsc --noEmit`. Before a push run CI: tsc, `bun run lint`, `bun run check-token-drift`,
`bun run build`. Storybook is not a gate (owner, 4 Oct; dropped from CI 10 Oct). Screenshots and `CHANGELOG.md` only when asked. No
`roadmap.md`; open work goes in the reply. Don't commit dated audit reports or one-off prompts.
Say plainly what was not run, what couldn't be read, and where sources disagree.
