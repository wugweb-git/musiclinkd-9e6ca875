# MusicLinkd App Engine

Customer PWA and native application engine for **MusicLinkd** — India's professional music network and operating system connecting verified talent, session musicians, recording studios, sound engineers, labels, and venues.

- **Stack**: React 19, TanStack Start SSR, Nitro / Vite, Tailwind CSS, shadcn/ui (Radix), Supabase PostgreSQL, Capacitor Android native wrapper.
- **Live Web App**: [https://app.musiclinkd.com](https://app.musiclinkd.com)
- **Primary Website & CMS Hub**: [https://musiclinkd.com](https://musiclinkd.com) (Hostinger LiteSpeed + WordPress FSE Theme in parent repo `musiclinkd`)
- **Public Directory & Marketplace**:
  - Verified Directory: [https://musiclinkd.com/directory/](https://musiclinkd.com/directory/)
  - Marketplace & Studio Rentals: [https://musiclinkd.com/shop/](https://musiclinkd.com/shop/)
  - Dokan Studio Storefronts: [https://musiclinkd.com/studio/](https://musiclinkd.com/studio/)
  - Headless WordPress Bridge: `https://musiclinkd.com/wp-json/musiclinkd/v1/`
- **Rules for working in this repo**: see [`AGENTS.md`](./AGENTS.md) — the GitHub↔Lovable sync protocol, token parity rules, and code conventions.
- **Brand palette**: ink `#0D0D0D` (primary), ground `#F3F1EC`, and canonical brand pink `#EA4C89`. Radius scale: `sm` 8, `md` 12, `lg` 16, `xl` 20, `2xl` 28, `3xl` hero, `full` pill. `src/styles.css` is the authority.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ace967d9-a62e-48bb-b076-c3b63b11b185).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? This repo is Bun-only — `bun.lock` is the lockfile and CI pins Bun.
[Install Bun](https://bun.sh/docs/installation).

```sh
git clone <this-repository-url>
cd <repository-name>
bun install
bun run dev
```

The dev server runs on port 8080. Before pushing, run what CI runs:

```sh
bunx tsc --noEmit && bun run lint && bun run build
```
