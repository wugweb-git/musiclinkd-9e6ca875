# Taxonomy review — running notes

One compiled document for the taxonomy re-cut. Updated as each question is worked through.
Started 25 Sep 2026. Source: Notion 🏷️ Master Taxonomy (39 categories) + the live Postgres schema.

**Status: diagnosis only. Nothing has been changed in the taxonomy, the database or the code.**

---

## The model so far

Settled in discussion, not yet built:

```
fork once            talent | collab | business        (person type, locked at onboarding)
  screen class       system | published | owner
    blocks by role   not by cohort — verification_types_for(roles) is the pattern
      service        the one bookable unit
        evidence     portfolio (talent) · amenities (business) — both prove a service
```

Naming rules in force:

- No screen, route, table, column or function is named after one **type**. `studio` is a business type exactly as `singer` is a talent type. The generic is talent / business.
- When something exists for both cohorts, **both** names are qualified: `talent-profile` and `business-profile`. The bare word is the parent only.
- An entity is **name + members**; a `tax_id` makes it a business, its absence makes it a collab.

---

## Q1 · Person Types (38) vs DJ Types (5) — are they all personas?

**No. Three different axes, plus a fourth that keeps being confused with them.**

```
1  flow          talent_user | business_user     metadata.flow on person_types   (2)
2  person type   Singer, DJ, Recording Studio…   person_types                    (38)
3  role detail   DJ Types, Singing Styles…       keyed to ONE person type
4  working mode  persona_badges, work_modes      independent of all the above
```

Level 3 is already supported by the schema: `profile_role_details(profile_id, role_slug, details jsonb)`.

| Detail category | Belongs to |
|---|---|
| Singing Styles (9), Vocal Range (6) | `singer` |
| Lyricist Specializations (6) | `lyricist` |
| Composition Styles (5) | `composer` |
| Director Specializations (4) | `music_director` |
| Engineer Specialties (4) | `sound_engineer`, `mixing_engineer`, `mastering_engineer` |
| DJ Types (5) | `dj` |
| Podcast Categories (6) | `podcaster` |
| Studio Services (3), Studio Amenities (33) | `studio` |

**Coverage gaps.** Only 10 of 26 talent types have a detail list. Seven of the remainder are instrumentalists whose detail *is* `instruments` (37) — the same idea, wired differently. Genuinely uncovered: rapper, folk_vocalist, voice_artist, producer, beatmaker, sound_designer, rj, music_teacher.

On the business side only `studio` has any detail at all. The other ten have none.

### The merge (see PERSONA-MERGED.md)

17 persona-ish categories, **125 values → 106 distinct slugs, 15 colliding**. Every collision is one axis re-encoded inside a category belonging to another:

| Collision | What it really is |
|---|---|
| `project_roles` — 8 of 11 duplicate `person_types` | *who* re-listed inside projects |
| `recording` / `mixing` / `mastering` ×3 each | *what work* re-listed as engineer specialty, studio service and service category |
| `touring` ×3 (persona_badges, available_for, work_modes) | *how you work* re-listed three times |
| `studio` ×2 | a business type also used as a service category |

`mix_engineer` (project_roles) vs `mixing_engineer` (person_types) is a further near-duplicate that does not even register as a collision.

Strip the re-encodings and the real surface is nearer 60 values than 125.

---

## Q2 · Instruments (37) · Equipment (9) · Studio Amenities (33) · DAW Tools (7) — one family?

**No — two families, one tool list, and one category that is not a category at all.**

| Category | What it is | Owned? | Tradeable? | Attaches to |
|---|---|---|---|---|
| Instruments (37) | objects a person **plays** | yes | yes | a person (skill) **and** a listing (goods) |
| Equipment (9) | objects that **capture / reproduce** | yes | yes | a service or a listing |
| DAW Tools (7) | **software**, licensed not owned | no | no | a person (skill) |
| Studio Amenities (33) | *see below* | — | no | a place |

Instruments and Equipment are one family: both are physical objects, both are tradeable in the marketplace, both can be "included" with a service. They differ only in whether a human plays them. DAW Tools are a skill marker, never goods — you cannot sell a Pro Tools licence as a listing.

### Studio Amenities is five things in one list

The 33 values do not share a kind:

| Kind | n | Examples |
|---|---|---|
| **Facility** — the place has it | 17 | vocal_booth, live_room, green_room, wifi, parking_space, cafe, air_conditioning, dolby_atmos |
| **Kit included** — gear bundled with the offer | 6 | drums_included, backline_included, stage_monitors, analogue_chain, four_mic_positions |
| **Service** — labour, not a thing | 6 | attended_sessions, stem_mastering, multicam_video, same_day_audio, catering, valet_parking |
| **People** — a person type | 2 | resident_engineers, producer |
| **Policy** — hours and access | 2 | access_24x7, open_till_2am |

So `studio_amenities` leaks into three other families it should be referencing instead:

- `drums_included` / `backline_included` → **Instruments / Equipment** (`backline` is already an equipment category)
- `stem_mastering` / `same_day_audio` / `multicam_video` → **service_categories**
- `resident_engineers` / `producer` → **person_types** (`producer` is literally a person type slug)

`producer` appearing in both `person_types` and `studio_amenities` is the same defect as `studio` appearing in both `person_types` and `service_categories`.

### Proposed shape

```
kit          instruments (37) + equipment (9)      objects: playable | technical
             ↳ marketplace listings reference these
             ↳ a service may include some
tools        daw_tools (7)                         software, skill only
facilities   the 17 real amenities                 attributes of a place
policies     hours / access                        attributes of a business
```

Everything else in the current amenities list is a reference to another family, not a value of its own.

Per the earlier naming rule, the category key `studio_amenities` also has to lose the type name — a venue, school or rehearsal room has facilities too.

---

## Queued changes — none started, all need the owner's word

Each database write is preceded by committing a SQL dump of the live DB to git.

| # | Change | Kind |
|---|---|---|
| 1 | `verification_types`: `studio` → `service` | taxonomy row |
| 2 | `service_categories`: `studio` → `space` | taxonomy row |
| 3 | `studio_amenities` → `amenities`, decomposed into facilities / policies, moved onto `profile_services` | taxonomy + schema |
| 4 | `booking_requests.service_id` → `profile_services`, so anyone can be booked | schema |
| 5 | Entity model: `tax_id`, real membership, subjects that are not user rows | schema |
| 6 | `studio` as the cohort word in `public-profile.tsx`, `recently-viewed`, `device-history`, `global-search` | code |
| 7 | Confirm `20260921300000_business_types_cleanup.sql` is actually applied — two code comments say live rows still read `business` | check |

## Open questions

- Q3 · Project Types (10) · Project Roles (11) · Intents (11) · Work Types (10)
- Q4 · Portfolio classification vs portfolio meta type
- Q5 · Are the specialisation lists service types?
- What the four Firestore types were — not found in code or either spec; would be on the Legacy Schema page
- Business types: collapse 11 → Space / Representation / Supply, with production house and event organizer resisting (they commission)
