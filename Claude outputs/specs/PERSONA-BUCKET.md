---
doc: PERSONA-BUCKET
version: 0.3
status: DRAFT — for Vedanshu's review
updated: 2026-09-14
verified_against: musiclinkd-9e6ca875 supabase/migrations/20260914120000_taxonomy_persona_bucket.sql (generated from the same data)
folder: specs/user-research
originally: new
---

> **DRAFT** · 14 Sep 2026. The options a profile can pick, given one primary person type, up to two
> secondary person types, and its languages. Generated together with the migration, so the tables
> below and the SQL cannot disagree. Rows marked *added* were not in either source list.

# Persona bucket

**Instruments** = union of the instruments allowed for the primary and each secondary person type.
**Genres** = every *universal* genre, plus each *regional* genre linked to any selected language.

## Screen limit — 12 per screen, genres 20

| Screen | How it stays within 12 |
|---|---|
| Languages | 12 options |
| Primary / secondary person type | pick a group (8), then a type (largest group: Business, 12) |
| Instruments | `persona_bucket` caps at 12 — primary's instruments first, then secondaries', each by popularity |
| Genres | `persona_bucket` caps at 20 (GREATEST(p_limit, 20); owner, 15 Sep 2026) — regional genres for the selected languages first, then universal, each by popularity |

The generator refuses to build if any flat list or person-type group exceeds 12.

## Business flow

The **Business** person-type group *is* the business type list (12). Every row in it carries
`metadata.flow = "business"`; picking one leads into the business flow. All other person types carry
`flow = "talent"`. Whether a business type may be a *secondary* person type is not decided here.

## Publish / unpublish

`is_published` on `taxonomy_categories` and `taxonomy_options`, default `true`.

- Clients (anon, signed-in) see only published rows — enforced by RLS, not by the app.
- Unpublishing a category hides every option in it.
- `persona_bucket` skips unpublished instruments, genres and languages, and rejects an unpublished
  person type.
- Toggling is service-role only (no client write): `UPDATE public.taxonomy_options SET is_published = false WHERE category_key = 'instruments' AND slug = 'harmonica';`
- `updated_at` moves on every update (trigger).

Call: `select * from persona_bucket('singer', array['lyricist','composer'], array['hi','en']);`
— returns `category_key, slug, label, display_order`; `display_order` is the on-screen order, 1–12
(instruments) or 1–20 (genres).

## Languages (12)

| Slug | Name |
|---|---|
| `hi` | हिंदी |
| `pa` | ਪੰਜਾਬੀ |
| `ta` | தமிழ் |
| `te` | తెలుగు |
| `bn` | বাংলা |
| `mr` | मराठी |
| `gu` | ગુજરાતી |
| `kn` | ಕನ್ನಡ |
| `ml` | മലയാളം |
| `bho` | भोजपुरी |
| `as` | অসমীয়া |
| `en` | English |

## Instruments (35)

| Family | Instruments |
|---|---|
| Guitar | Acoustic Guitar · Electric Guitar · Bass Guitar · Ukulele *(added)* · Mandolin *(added)* |
| Keys | Keyboard · Piano · Harmonium |
| Percussion | Drums · Tabla · Dholak · Mridangam · Ghatam *(added)* · Kanjira *(added)* · Cajón *(added)* |
| Indian String | Sitar · Sarod · Santoor · Veena · Tanpura |
| Bowed | Violin · Viola *(added)* · Cello · Double Bass *(added)* · Sarangi *(added)* |
| Wind | Flute (Bansuri) · Saxophone · Trumpet · Clarinet *(added)* · Shehnai · Nadaswaram *(added)* · Harmonica *(added)* |
| Electronic | DJ Controller *(added)* · Drum Machine *(added)* · Sampler *(added)* |

Popularity order: 1. Acoustic Guitar · 2. Keyboard · 3. Piano · 4. Electric Guitar · 5. Drums · 6. Tabla · 7. Bass Guitar · 8. Flute (Bansuri) · 9. Violin · 10. Harmonium · 11. Sitar · 12. Dholak · 13. DJ Controller · 14. Drum Machine · 15. Sampler · 16. Saxophone · 17. Ukulele · 18. Cajón · 19. Santoor · 20. Mridangam · 21. Veena · 22. Sarangi · 23. Cello · 24. Trumpet · 25. Sarod · 26. Shehnai · 27. Tanpura · 28. Ghatam · 29. Kanjira · 30. Clarinet · 31. Nadaswaram · 32. Mandolin · 33. Double Bass · 34. Viola · 35. Harmonica

## Person types (39) → instruments

| Group | Types |
|---|---|
| Vocal (4) | Singer · Rapper · Folk Vocalist · Voice Artist |
| Instrumentalist (8) | Musician · Guitarist · Bassist · Keyboardist · Drummer · Sitarist · Violinist · Flautist |
| Creator (6) | Composer · Lyricist · Vocal Arranger · Music Director · Music Producer · Beatmaker |
| Technical (4) | Sound Engineer · Mixing Engineer · Mastering Engineer · Sound Designer |
| Media (3) | DJ · RJ · Podcaster |
| Education (1) | Music Teacher |
| Business (12) | Recording Studio · Music Label · Venue · Event Organizer · Booking Agency · Artist Manager · Production House · Music School · Dealer · Rental Provider · Music Publisher · A&R |
| Other (1) | Other |

| Group | Slug | Label | Source | Instruments | Basis |
|---|---|---|---|---|---|
| Vocal | `singer` | Singer | both | **Guitar** · **Keys** | Vedanshu, 14 Sep |
| Vocal | `rapper` | Rapper | firestore | — | none |
| Vocal | `folk_vocalist` | Folk Vocalist | firestore | Acoustic Guitar · Harmonium · Dholak | proposed |
| Vocal | `voice_artist` | Voice Artist | app | — | app: not asked |
| Instrumentalist | `musician` | Musician | app | all | app: asked |
| Instrumentalist | `guitarist` | Guitarist | firestore | **Guitar** | label |
| Instrumentalist | `bassist` | Bassist | added | Bass Guitar · Double Bass | label |
| Instrumentalist | `keyboardist` | Keyboardist | firestore | **Keys** | label |
| Instrumentalist | `drummer` | Drummer | firestore | **Percussion** · Drum Machine, Sampler | label |
| Instrumentalist | `sitarist` | Sitarist | firestore | **Indian String** | label |
| Instrumentalist | `violinist` | Violinist | added | **Bowed** | label |
| Instrumentalist | `flautist` | Flautist | added | **Wind** | label |
| Creator | `composer` | Composer | both | all | app: asked |
| Creator | `lyricist` | Lyricist | both | — | app: not asked |
| Creator | `arranger` | Vocal Arranger | firestore | **Keys** | proposed |
| Creator | `music_director` | Music Director | app | — | app: not asked |
| Creator | `producer` | Music Producer | both | all | app: asked |
| Creator | `beatmaker` | Beatmaker | added | Keyboard · Drum Machine, Sampler | proposed |
| Technical | `sound_engineer` | Sound Engineer | both | — | app: not asked |
| Technical | `mixing_engineer` | Mixing Engineer | added | — | none |
| Technical | `mastering_engineer` | Mastering Engineer | added | — | none |
| Technical | `sound_designer` | Sound Designer | firestore | Keyboard · Drum Machine, Sampler | proposed |
| Media | `dj` | DJ | app | **Electronic** | proposed (no acoustic instruments) |
| Media | `rj` | RJ | app | — | app: not asked |
| Media | `podcaster` | Podcaster | app | — | app: not asked |
| Education | `music_teacher` | Music Teacher | app | all | app: asked |
| Business | `studio` | Recording Studio | both | — | business flow |
| Business | `music_label` | Music Label | both | — | business flow |
| Business | `venue` | Venue | both | — | business flow |
| Business | `event_organizer` | Event Organizer | firestore | — | business flow |
| Business | `booking_agency` | Booking Agency | both | — | business flow |
| Business | `artist_manager` | Artist Manager | firestore | — | business flow |
| Business | `production_house` | Production House | both | — | business flow |
| Business | `music_school` | Music School | both | — | business flow |
| Business | `dealer` | Dealer | both | — | business flow |
| Business | `rental_provider` | Rental Provider | both | — | business flow |
| Business | `music_publisher` | Music Publisher | firestore | — | business flow |
| Business | `a_and_r` | A&R | added | — | business flow |
| Other | `other` | Other | app | — | app: not asked |

## Genres (35) → languages, in popularity order

| Slug | Label | Scope | Languages |
|---|---|---|---|
| `bollywood` | Bollywood | regional | हिंदी |
| `punjabi_pop` | Punjabi Pop *(added)* | regional | ਪੰਜਾਬੀ |
| `hindustani_classical` | Hindustani Classical | regional | हिंदी · ਪੰਜਾਬੀ · বাংলা · मराठी · ગુજરાતી · অসমীয়া · भोजपुरी |
| `carnatic_classical` | Carnatic Classical | regional | தமிழ் · తెలుగు · ಕನ್ನಡ · മലയാളം |
| `sufi_devotional` | Sufi Devotional | regional | हिंदी · ਪੰਜਾਬੀ |
| `bhajan` | Bhajan *(added)* | regional | all Indian |
| `ghazal` | Ghazal | regional | हिंदी |
| `qawwali` | Qawwali | regional | हिंदी · ਪੰਜਾਬੀ |
| `bhangra` | Bhangra | regional | ਪੰਜਾਬੀ |
| `kollywood` | Tamil Film (Kollywood) *(added)* | regional | தமிழ் |
| `tollywood` | Telugu Film (Tollywood) *(added)* | regional | తెలుగు |
| `mollywood` | Malayalam Film (Mollywood) *(added)* | regional | മലയാളം |
| `sandalwood` | Kannada Film (Sandalwood) *(added)* | regional | ಕನ್ನಡ |
| `rabindra_sangeet` | Rabindra Sangeet *(added)* | regional | বাংলা |
| `lavani` | Lavani *(added)* | regional | मराठी |
| `garba` | Garba *(added)* | regional | ગુજરાતી |
| `bihu` | Bihu *(added)* | regional | অসমীয়া |
| `bhojpuri_folk` | Bhojpuri Folk *(added)* | regional | भोजपुरी |
| `gaana` | Gaana *(added)* | regional | தமிழ் |
| `baul` | Baul *(added)* | regional | বাংলা |
| `natya_sangeet` | Natya Sangeet *(added)* | regional | मराठी |
| `rajasthani_folk` | Rajasthani Folk | regional | हिंदी |
| `indie_pop` | Indie Pop | universal | all |
| `hiphop` | Hip Hop | universal | all |
| `trap` | Trap *(added)* | universal | all |
| `rock` | Rock | universal | all |
| `metal` | Metal *(added)* | universal | all |
| `edm` | EDM | universal | all |
| `lofi` | Lofi | universal | all |
| `acoustic` | Acoustic | universal | all |
| `fusion` | Fusion *(added)* | universal | all |
| `rnb` | R&B | universal | all |
| `jazz` | Jazz | universal | all |
| `blues` | Blues *(added)* | universal | all |
| `reggae` | Reggae | universal | all |

## Worked examples

**singer + lyricist, composer · languages हिंदी · English**

- Instruments — 12 shown of 35 allowed: Acoustic Guitar, Keyboard, Piano, Electric Guitar, Bass Guitar, Harmonium, Ukulele, Mandolin, Drums, Tabla, Flute (Bansuri), Violin
- Genres — 20 shown of 20 allowed: Bollywood, Hindustani Classical, Sufi Devotional, Bhajan, Ghazal, Qawwali, Rajasthani Folk, Indie Pop, Hip Hop, Trap, Rock, Metal, EDM, Lofi, Acoustic, Fusion, R&B, Jazz, Blues, Reggae

**singer + lyricist, dj · languages தமிழ்**

- Instruments — 11 shown of 11 allowed: Acoustic Guitar, Keyboard, Piano, Electric Guitar, Bass Guitar, Harmonium, Ukulele, Mandolin, DJ Controller, Drum Machine, Sampler
- Genres — 17 shown of 17 allowed: Carnatic Classical, Bhajan, Tamil Film (Kollywood), Gaana, Indie Pop, Hip Hop, Trap, Rock, Metal, EDM, Lofi, Acoustic, Fusion, R&B, Jazz, Blues, Reggae

**drummer + folk_vocalist · languages ਪੰਜਾਬੀ · भोजपुरी**

- Instruments — 11 shown of 11 allowed: Drums, Tabla, Dholak, Drum Machine, Sampler, Cajón, Mridangam, Ghatam, Kanjira, Acoustic Guitar, Harmonium
- Genres — 20 shown of 20 allowed: Punjabi Pop, Hindustani Classical, Sufi Devotional, Bhajan, Qawwali, Bhangra, Bhojpuri Folk, Indie Pop, Hip Hop, Trap, Rock, Metal, EDM, Lofi, Acoustic, Fusion, R&B, Jazz, Blues, Reggae

## Not decided here

- Which person types, instruments and genres ship — every *added* row and every *proposed* basis.
- `profiles.roles`, `.instruments`, `.genres`, `.languages` still store the app's English strings; this
  data is not wired to onboarding or to `profiles` yet.
- Labels are single names (owner, 15 Sep 2026): Firestore's combined labels were split or shortened, and
  flute sits only under Flautist (`flautist`, formerly `wind_player`), which still holds every wind instrument.
