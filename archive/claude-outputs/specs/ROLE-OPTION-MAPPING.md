---
doc: ROLE-OPTION-MAPPING
version: 0.1
status: DRAFT — for Vedanshu's review
updated: 2026-09-14
verified_against: musiclinkd-9e6ca875@1937767 (src/data/onboarding.ts) · admin/types/firestore.ts · admin/scripts/seed/data/taxonomy-seed.ts · audits/FIRESTORE-FULL-DUMP.md
folder: specs/user-research
originally: new
---

> **DRAFT** · 14 Sep 2026. Which options each role and profile type can be offered — the rule that a
> DJ is never offered Sarod. Every rule cites where it comes from. Where no source exists, the cell
> says **open**; nothing here is a decision. Companion to `audits/TAXONOMY-D1-PREFLIGHT-2026-09-14.md`.

# Role → option mapping

## 0. Where "can get" comes from

| Source | What it says | Scope |
|---|---|---|
| **S1** `onboarding.ts` `RoleDef.instruments` | per role, whether the Instruments step is shown | app |
| **S2** `onboarding.ts` step `visible()` | Instruments step shows if **primary or any secondary** role has S1 = true | app |
| **S3** `onboarding.ts` `specialisationByRole` | per role, which specialisation groups are shown (primary role only) | app |
| **S4** `taxonomy-seed.ts` `person_types` labels | instrument-specific roles: *Guitarist*, *Keyboardist / Pianist*, *Drummer / Percussionist*, *Sitarist / Flutist* | Firestore |
| **S5** `firestore.ts` field comments | Talent module fields "gated on primaryRole"; each `RoleProfileDoc` names its taxonomy category; Business/Band/Venue extension blocks | Firestore |

Firestore `UserDoc.instruments` itself carries **no** gating — any profile can hold any instrument.

---

## 1. Role crosswalk

The two systems name roles differently and neither list contains the other.

| App `RoleKey` | S1 asks instruments | Firestore `person_types` | Firestore `role_profiles.roleKey` |
|---|---|---|---|
| `singer` | no | `singer` | `singer` |
| `musician` | **yes** | — *(split into the four below)* | `musician` |
| `producer` | **yes** | `producer` | — |
| `composer` | **yes** | `composer` | `composer` |
| `lyricist` | no | `lyricist` | `lyricist` |
| `music-director` | no | — | `music_director` |
| `sound-engineer` | no | `sound_engineer` | `sound_engineer` |
| `dj` | no | — | `dj` |
| `rj` | no | — | `rj` |
| `podcaster` | no | — | `podcaster` |
| `voice-artist` | no | — | — |
| `music-teacher` | **yes** | — | — |
| `other` | no | — | — |
| — | | `guitarist` · `keyboardist` · `drummer` · `sitarist` | *(musician)* |
| — | | `rapper` · `folk_vocalist` · `arranger` · `sound_designer` | — |
| — | | `artist_manager` · `music_label` · `music_publisher` · `studio` · `event_organizer` | — |

Facts that fall out of this:

- Firestore has **no `dj` person type**, so the seeded DJ (`talent-dj-rish`) has `primaryRole: producer`.
- App business roles in live `profiles.roles` (`Independent label`, `A&R`, `Publishing`, `Recording
  studio`, `Rehearsal space`, `Venue`, `Live music bookings`, `Production house`, `Music videos`,
  `Artist manager`, `Production liaison`) exist **only** in `src/data/linked-profiles.ts`. No app
  picker offers them.

### Business types

| App `businessTypes` | Firestore `BusinessType` / `profileType` |
|---|---|
| Studio | `Studio` |
| Label | `Label` |
| Agency | `Booking Agency` · `Artist Manager` |
| Venue | `profileType: VENUE` (not a business type) |
| Dealer | `Dealer` |
| Rental Provider | `Rental Company` |
| Music School | `School` |
| Production House | `Production House` |
| Other | — |

---

## 2. Instruments

### 2a. Families

Organological grouping, so role rules can be written once per family instead of per option.
**The grouping is Claude Code's classification — review it.** Each option sits in exactly one family.

| Family | Firestore taxonomy (21) | App list (14) |
|---|---|---|
| guitar | Acoustic Guitar · Electric Guitar · Bass Guitar | Guitar · Bass |
| keys | Keyboard / Synthesizer · Piano · Harmonium | Keyboard · Piano · Harmonium |
| percussion | Drums / Percussion · Tabla · Dholak · Mridangam | Drums · Tabla · Percussion |
| indian_string | Sitar · Sarod · Santoor · Veena · Tanpura | Sitar · Santoor |
| wind | Flute (Bansuri) · Saxophone · Trumpet · Shehnai | Flute · Saxophone |
| bowed | Violin · Cello | Violin |
| — | | Other |

### 2b. Role → instruments offered

| Role | Offered | Source |
|---|---|---|
| `musician`, `producer`, `composer`, `music-teacher` (app) | all families | S1 = yes, no narrowing in code |
| `singer`, `lyricist`, `music-director`, `sound-engineer`, `dj`, `rj`, `podcaster`, `voice-artist`, `other` (app) | **none** | S1 = no |
| any app role **+ a secondary role with S1 = yes** | all families | S2 — the step is shown for the union |
| `guitarist` | guitar | S4 label |
| `keyboardist` | Keyboard, Piano | S4 label *Keyboardist / Pianist* — Harmonium **open** |
| `drummer` | percussion | S4 label *Drummer / Percussionist* |
| `sitarist` | Sitar, Flute | S4 label *Sitarist / Flutist* — Sarod, Santoor, Veena, Tanpura, other wind **open** |
| `rapper`, `folk_vocalist`, `arranger`, `sound_designer` | **open** | no source |
| BUSINESS / VENUE profiles | **open** for `UserDoc.instruments`; dealers/rentals use `instruments` for *what is sold* (`MarketplaceItemDoc.itemCategory`) | S5 |

**The DJ case, worked:** a DJ sees no Instruments step (S1). A DJ who also picks `musician` as a
secondary role sees the step with every family, Sarod included (S2), because the app gates the
step, not the options. Whether the offered options should narrow by role is **open** — no source
defines it for app roles.

### 2c. Seed data against 2b

Measured on the 83 Firestore users. All 17 flagged rows are `filler` except the last two.

**Instrument-role holding instruments outside its label (7):**

| User | `primaryRole` | Instruments outside |
|---|---|---|
| filler-anika-rao | guitarist | Flute (Bansuri) |
| filler-dev-pillai | keyboardist | Tabla, Sitar |
| filler-myra-rao | keyboardist | Acoustic Guitar |
| filler-reyansh-pillai | drummer | Piano |
| filler-vihaan-nair | sitarist | Tabla, Violin |
| filler-vivaan-bose | drummer | Bass Guitar, Acoustic Guitar |
| filler-yuvraj-bose | keyboardist | Flute (Bansuri) |

**Instrument-role with no instruments (6):** filler-arnav-gupta, filler-dev-nair,
filler-tara-khanna, filler-yuvraj-mehta (guitarist) · filler-kavya-chatterjee (sitarist) ·
filler-riya-kapoor (drummer).

**No-instrument roles holding instruments, no secondary role that allows them (4):**
filler-dev-desai (singer + lyricist) · filler-myra-iyer (sound_engineer + singer) ·
**talent-kabir-sethi** and **talent-maya-sharma** (singer + lyricist, Acoustic Guitar — both
hand-written singer-songwriters). The app's S1 rule would drop those two instruments on import.

BUSINESS and VENUE seed rows: `instruments` is empty on all 20.

---

## 3. Other categories → who gets them

| Taxonomy category | Firestore: applies to (S5) | App: nearest surface (S3) |
|---|---|---|
| `vocal_range` | singer (Talent module; `SingerRoleProfile`) | singer › Vocal type |
| `singing_styles` | singer (`SingerRoleProfile`) | singer › Performance type |
| `daw_tools` | sound_engineer (Engineer module; `SoundEngineerRoleProfile`) — seeds also set it on 10 producers, 1 composer, 1 guitarist | producer › Tools · sound-engineer › Tools |
| `engineer_specialties` | sound_engineer | sound-engineer › Discipline |
| `composition_styles` | composer | composer › Composition type |
| `director_specializations` | music_director | — *(music-director has no specialisation step)* |
| `lyricist_specializations` | lyricist | — |
| `dj_types` | dj | dj › Event types |
| `podcast_categories` | podcaster | — |
| `availability_status` | "Musician module" per comment; seeds set it on all 62 TALENT, no others | onboarding › availability (different list) |
| `studio_services`, `studio_amenities`, `equipment_categories` | BUSINESS `Studio`, `StudioDoc`, VENUE (`venueFeatures` is free text) | business profile |
| `budget_type`, `genres`, `languages`, `persona_badges` | every profile, ungated | genres / languages steps, every role |
| `trust_badges` | every profile, **admin-only write** | — |
| `person_types` | `primaryRole` / `secondaryRole` | role / secondary-roles steps |
| `project_types`, `project_roles` | `portfolio_projects` | portfolio |
| `collaboration_types`, `opportunity_types` | `projects` (opportunities) | collab / opportunities |
| `booking_statuses`, `session_types`, `session_duration_tiers` | `studio_bookings` | booking |
| `marketplace_categories` | `marketplace_items` | market |
| `verification_id_type` | `verification_requests` | verification |

### 3a. App specialisation options ↔ taxonomy slugs

Exact label matches only; singular/plural normalised. Everything else has no counterpart.

| App role › group | Matches | App-only | Taxonomy-only |
|---|---|---|---|
| singer › Vocal type | Baritone, Tenor, Soprano, Alto → `vocal_range` | Male, Female *(Firestore stores these in `gender`)* | `mezzo_soprano`, `bass` |
| singer › Vocal range | — | Low, Mid, High, Wide range | — |
| singer › Performance type | Playback → `singing_styles.playback` | Live shows, Studio sessions, Backing vocals, Jingles | classical, ghazal, sufi, indie, pop, rock, rap, bhajan |
| producer › Tools | all 6 → `daw_tools` | — | `studio_one` |
| sound-engineer › Discipline | Recording, Mixing, Mastering, Live sound → `engineer_specialties` | Post production | — |
| sound-engineer › Tools | Pro Tools, Logic Pro, Ableton Live → `daw_tools` | Nuendo, Analog console | — |
| composer › Composition type | Background score → `composition_styles`; Advertising, Independent → `director_specializations` | Film *(film_score or film_music — two categories)*, Series, Games | orchestral, electronic, commercial_jingles |
| dj › Event types | Clubs, Weddings, Festivals → `dj_types` | Corporate, Private parties | radio, bollywood |
| dj › Setup · musician › * · producer › Production · music-teacher › * | — | all | — |

---

## 4. Open — no source defines these

1. Do offered instrument options narrow by role, or only the step's visibility (2b, DJ case)?
2. Harmonium for keyboardist; Sarod / Santoor / Veena / Tanpura and other wind for sitarist.
3. Instruments for rapper, folk_vocalist, arranger, sound_designer, and for BUSINESS/VENUE profiles.
4. Singer-songwriters holding an instrument (kabir-sethi, maya-sharma) under S1 = no for singer.
5. Specialisation gating is **primary role only** (S3); instruments use primary **+ secondary** (S2).
6. Composer's `Film` maps to two taxonomy categories.
7. The instrument family grouping in 2a.
