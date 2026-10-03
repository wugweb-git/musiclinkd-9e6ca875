# External hosts and media in the codebase — 4 Oct 2026

An inventory of every external host a URL in `src/`, `public/` or the root configs points at,
classified by whether it should stay. Scope: `src/`, `public/`, `.storybook/`, `vite.config.ts`,
`capacitor.config.ts`. **There is no `index.html` in the repo.** The document head is built by
`src/routes/__root.tsx`, which is covered here. `public/` holds only local files (favicons,
`manifest.webmanifest` with relative icon paths, `banners/`, `robots.txt`) and references no external
host. `storybook-static/` and `node_modules/` are build output and were not inventoried. Line numbers
are from `main` at f6c691f.

Classes:

- **Keep (integration)**: intentional production content or integration.
- **Retained (owner, 4 Oct)**: seed, demo or Storybook media kept on the owner's decision. The
  decision covers Unsplash for hardcoded data, through `src/data/unsplash.ts`.
- **Remove (accidental)**: an accidental dependency.
- **Not fetched**: a URL that appears only as text (comment, placeholder, namespace, outbound-link
  normaliser). Listed so the inventory is complete; nothing to do.

## Summary

| Class | Hosts | Occurrences |
|---|---|---|
| Keep (integration) | 22 hosts in 19 rows (including user-supplied URLs and the env-configured Supabase project) | about 30 |
| Retained (owner, 4 Oct) | 2 (images.unsplash.com; play.google.com as a story prop) | 1 builder + 11 data modules, plus 8 raw story URLs |
| Remove (accidental) | 2 (blocks.so; commondatastorage.googleapis.com) | 5 |
| Not fetched | 14 | about 2,480 (2,449 of them `www.w3.org` SVG namespaces) |

Recommended removals: `blocks.so` (in a file nothing imports) and `commondatastorage.googleapis.com`
(Storybook media that CI's `test-storybook` run downloads from a third-party bucket). Details below.

## Keep: production integrations

| Host | Where | What it is |
|---|---|---|
| fonts.googleapis.com, fonts.gstatic.com | `src/routes/__root.tsx:115-119` | Inter webfont (preconnect + stylesheet). It could be self-hosted to drop a third-party request, but that is optional. |
| www.googletagmanager.com | `src/lib/analytics.ts:71` | GA4 `gtag.js`. Injected only when a measurement ID is configured, and fails silently when blocked. |
| www.youtube-nocookie.com | `src/lib/embed.ts:29` | In-app YouTube player for portfolio links (privacy-enhanced domain). |
| open.spotify.com | `src/lib/embed.ts:43`; `src/lib/link-preview.functions.ts:83` | Spotify embed player; oEmbed metadata (server-side). |
| w.soundcloud.com, soundcloud.com | `src/lib/embed.ts:52`; `src/lib/link-preview.functions.ts:90` | SoundCloud widget player; oEmbed (server-side). |
| *.bandcamp.com | `src/lib/embed.ts:57-62` | The user's own Bandcamp URL, iframed as-is. |
| www.youtube.com | `src/lib/link-preview.functions.ts:77` | YouTube oEmbed (server-side). |
| (any user-supplied https host) | `src/lib/link-preview.functions.ts:39` | Link preview fetches the pasted URL server-side. It has a private-address guard (lines 20-33) and a timeout. This is intentional. |
| accounts.spotify.com, api.spotify.com | `src/lib/spotify.functions.ts:41, 108, 134` | Spotify OAuth and `/v1/me` (connect-Spotify settings). Redirect URI `https://app.musiclinkd.com/settings/spotify` at 31. |
| maps.google.com | `src/components/ml/market.tsx:754-755` (iframe at 780-783) | Embedded map in the city picker. |
| www.google.com/maps | `src/lib/booking-actions.ts:64` | Outbound "Directions" link. |
| places.googleapis.com | `src/lib/maps-link.functions.ts:115` | Places API text search when a business pastes a Maps link (server-side). |
| (maps.app.goo.gl / google.com/maps, user-pasted) | `src/lib/maps-link.functions.ts:40-48, 213` | Resolves the pasted short link server-side. Input is restricted to Google Maps URLs by the `GOOGLE_MAPS` regex. |
| nominatim.openstreetmap.org | `src/lib/maps-link.functions.ts:76` | Reverse geocode for a pin (server-side), with an identifying User-Agent as Nominatim's policy asks. |
| api.postalpincode.in | `src/lib/postcode.functions.ts:30` | India PIN code → city/state lookup (server-side). |
| `<project>.supabase.co` (from env) | `src/integrations/supabase/client.ts:36`, `client.server.ts:36`, `auth-middleware.ts:36`; `src/lib/mcp/index.ts:15` | Database, auth and Storage. All user photos and media rows resolve here. |
| app.musiclinkd.com | `src/lib/site.ts:23` (`PUBLIC_HOST`); `capacitor.config.ts:23`; `src/lib/spotify.functions.ts:31` | Own origin: share links, Android hosted shell, OAuth redirect. |
| lovable.dev, localhost:3000 | `src/integrations/supabase/previewAuthStorage.ts:29` | Allowed `postMessage` origins for the Lovable editor preview. Nothing is fetched. |
| wugweb.com | `src/components/ml/kit.tsx:168` | "Made by Wugweb" outbound credit link. |

## Retained by owner decision (4 Oct 2026)

| Host | Where | Notes |
|---|---|---|
| images.unsplash.com | `src/data/unsplash.ts:8` (the one builder), used by `src/data/band.ts`, `booking.ts`, `business.ts`, `discover.ts`, `linked-profiles.ts`, `market.ts`, `notifications.ts`, `opportunities.ts`, `profile.ts`, `rentals.ts`, `reviews.ts` | Photos in hardcoded content. Retained. No code outside `src/data/` calls the builder. |
| images.unsplash.com (raw URLs in stories) | `src/lab/glass.stories.tsx:15`; `src/components/ml/marketing.stories.tsx:18, 79`; `src/components/ml/portfolio.stories.tsx:160, 171, 182`; `src/components/ml/cards.stories.tsx:107` | Storybook media. Same host and same decision, so retained. They bypass `unsplash()` with hand-written URLs. Optional tidy: route them through the builder so the "one builder" comment in `unsplash.ts` holds. Not a removal. |
| play.google.com | `src/components/ml/marketing.stories.tsx:53` | Placeholder `to` for the Android download CTA in a story. It is only a link and nothing is fetched. Keep until the real store URL exists. |

## Remove: accidental dependencies

| Host | Where | Reason |
|---|---|---|
| blocks.so | `src/components/file-upload-01.tsx:118, 128, 138` | Vendor avatars from the blocks.so registry demo. `file-upload-01.tsx` is not imported anywhere: not by a route, nor by `registry/kept.stories.tsx`, which keeps `onboarding-01` and others but not this one. Remove the three `<img>` sources, or the whole unused file if the owner agrees it isn't on the "kept" list. |
| commondatastorage.googleapis.com | `src/components/ml/portfolio.stories.tsx:162` (`codeskulptor-assets/Epoq-Lepidoptera.ogg`), `:173` (`gtv-videos-bucket/sample/BigBuckBunny.mp4`) | Google's public sample audio/video, used as `media_url` in portfolio stories. The owner's Unsplash decision doesn't cover it. Because the stories are CI's test suite (`bun run test-storybook`), the accessibility gate depends on a third-party bucket and a roughly 150 MB video. Replace with a short local fixture in the Storybook static dir, or with a stub URL the player doesn't load. |

## Not fetched (text only, nothing to do)

| Host / text | Where |
|---|---|
| www.w3.org (SVG `xmlns`) | about 2,449 occurrences across icon and SVG components |
| schema.org (JSON-LD `@context` and enum IRIs) | `src/components/ml/public-profile.tsx:121, 139`; `src/routes/bands.$id.index.tsx:142`; `src/routes/marketplace/l.$id.tsx:205-222` |
| yourname.com, instagram.com/username, youtube.com/@channel, open.spotify.com/artist/..., soundcloud.com/username | `src/data/onboarding.ts:264-268`: input placeholders |
| youtu.be/… | `src/components/ml/listing-form.tsx:851`: placeholder |
| maps.app.goo.gl/… | `src/routes/business.new.tsx:366`: placeholder |
| www.example.com, www.hive.in, https://…/rock.jpg, app.…/bands/7 | comments: `src/components/ml/media-embed.tsx:103`, `business-profile.tsx:520`, `ui.tsx:391`, `src/lib/site.ts:25` |
| `https://` prefix only | `src/routes/identity.scan.tsx:66`; `src/lib/business-view.ts:119-123`: normalising a typed website into a link |
| rysana.com, developer.mozilla.org | `src/components/agents-ui/react-shader-toy.tsx:384-415`: doc comments in a vendor component |
| github.com | `src/components/ui/phone-input.tsx:29`: source credit comment |
| musiclinkd.com/guide | `src/registry/guide.mdx:8`; `.storybook/main.ts:13`: docs text |
| localhost:&lt;port&gt; | `vite.config.ts:12`: comment |

## Disagreement to surface

`src/registry/guide.mdx:8` and `.storybook/main.ts:13` call `https://musiclinkd.com/guide` "production".
The project's own notes say the public address is `app.musiclinkd.com`, and that `musiclinkd.com/@name`
404s. I did not check whether `musiclinkd.com/guide` resolves. If it doesn't, those two lines should
name the right host. Nothing is fetched from it either way.

Not run: no network checks, builds or Storybook. This is a static read of the source.
