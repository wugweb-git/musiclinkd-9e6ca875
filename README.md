# MusicLinkd

India's professional network and operating system for the music industry — discovery, profiles,
bookings, and messaging for musicians, bands, studios, labels, and venues.

- **Stack**: TanStack Start (React), Tailwind CSS, shadcn/ui (Radix), Supabase
- **Live app**: https://app.musiclinkd.com
- **Rules for working in this repo**: see [`AGENTS.md`](./AGENTS.md) — the GitHub↔Lovable sync
  protocol and code conventions. Read it before making changes.
- **Brand palette**: ink `#0D0D0D` (primary), black/greys/white. Brand pink `#EA4C89` is rare and
  always a signal — the logo, the active tab underline, press feedback, a selected pill, prices, and
  the `brand` button inside branded blocks; never a resting border, background or body text.
  `src/styles.css` is the authority. Radius by role: `sm` 8, `md` 12, `lg` 16, `xl` 20, `2xl` 28,
  `3xl` hero, `full` pill.

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
