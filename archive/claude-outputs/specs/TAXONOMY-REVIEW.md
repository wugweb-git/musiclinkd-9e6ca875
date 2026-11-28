# Taxonomy review — running notes

> **Superseded.** This is the working diagnosis that led to the final cut. The canonical target is
> **`TAXONOMY-FINAL.md`** — eight families (Persona · Tools · Service · Output · Labels · Filter ·
> Meta · Compliance), settled 25 Sep. Where the two disagree, the final wins. Kept for the reasoning
> and the evidence: the collision counts, the live-vs-documented drift, and the value-level audits.


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
        evidence     portfolio (talent) · tools (business) — both prove a service
      composition  fixture + gear + people = service (many-to-many, the business declares it)
```

Naming rules in force:

- No screen, route, table, column or function is named after one **type**. `studio` is a business type exactly as `singer` is a talent type. The generic is talent / business.
- When something exists for both cohorts, **both** names are qualified: `talent-profile` and `business-profile`. The bare word is the parent only.
- An entity is **name + members**; a `tax_id` makes it a business, its absence makes it a collab.

---

## Q1 · Persona Types (38) vs DJ Types (5) — are they all personas?

**No. Three different axes, plus a fourth that keeps being confused with them.**

```
1  flow          talent_user | business_user     metadata.flow on persona_types   (2)
2  person type   Singer, DJ, Recording Studio…   persona_types                    (38)
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
| `project_roles` — 8 of 11 duplicate `persona_types` | *who* re-listed inside projects |
| `recording` / `mixing` / `mastering` ×3 each | *what work* re-listed as engineer specialty, studio service and service category |
| `touring` ×3 (persona_badges, available_for, work_modes) | *how you work* re-listed three times |
| `studio` ×2 | a business type also used as a service category |

`mix_engineer` (project_roles) vs `mixing_engineer` (persona_types) is a further near-duplicate that does not even register as a collision.

Strip the re-encodings and the real surface is nearer 60 values than 125.

---

## Q2 · Instruments · Equipment · Amenities · DAW Tools — one family? **Settled: yes.**

**One parent family: `tools`.** Alongside `persona`, these are the two parent families.

```
persona   who a subject is      persona_types (38) + role details + working mode
tools     what a subject has    instruments (37) + equipment (9) + daw (7)
```

**Amenities stay out of `tools`** (owner, 25 Sep). Only ~6 of the 33 are gear; the rest are fixtures, services, people and policy. They are handled separately — see *fixtures* below.

### Why the earlier splits failed

| Split tried | Why it broke |
|---|---|
| played vs not played | DJ Controller, Drum Machine, Sampler and Synth are already listed as *instruments*. A laptop running Ableton is the same case. |
| hardware vs software | An MPC Live, Push 3 standalone, Force or Maschine+ **is** the DAW, in a box. The split describes 2005. |
| signal chain (source/capture/…) | Engineering-correct, but it maps equipment, not intent. Dropped. |
| studio-only amenities | 23, 24, 25 and most of the rest apply to a music school, venue or rehearsal room just as well. Not studio-specific. |

### What varies is the relation, and relations are not exclusive

One guitar can be **played, used, owned, rented out and included** at the same time. It is not a single `relation` field; it is a set of independent edges on one (subject, tool) pair.

| Relation | Attaches to | Needs |
|---|---|---|
| plays / uses / owns | subject ↔ tool | nothing |
| rents out / sells | listing → tool | price, period, condition |
| includes | **service** ↔ tool | — |

`drums_included` is *tool + relation* flattened into one string — the same defect as `profile_members.name` and `portfolio_items.collaborators`: a relationship stored as text instead of a link.

### Naming

**gear** is the commercial word — what the industry says, what the category leader owns, and a higher-volume search term than "tools" or "equipment". `tools` is the family key; *gear* is the word shown to people.

### Category and grade sit on the item

```
tool
  category   browse grouping, only as deep as inventory can fill
  grade      professional | prosumer | personal
```

**Grade belongs to the item, not the owner and not the relation.** A Neve 1073 is professional in a bedroom; an SM58 is an SM58 in Abbey Road. If a seller self-declares grade it becomes noise within a month — it only works from the catalogue.

Grade is already leaking elsewhere: `persona_badges` contains `home_studio_owner`, which is a grade statement wearing a badge, and unverifiable where it sits.

### The one structural break inside tools: fixtures

The test is commercial, not physical — **can it be traded, or must you travel to it?**

```
gear       portable, owned, tradeable    → marketplace revenue (buy / rent / sell)
fixtures   fixed to a place              → booking revenue (you come to it)
```

Of the 33 amenities: ~6 are gear (drums_included, backline_included, stage_monitors, analogue_chain, four_mic_positions, instruments_support), ~17 are fixtures (vocal_booth, live_room, green_room, wifi, AC, cafe, parking…), and ~10 are not tools at all — services (attended_sessions, stem_mastering, catering), people (`resident_engineers`, `producer` — a persona_types slug sitting in an amenities list) and policy (24×7, open_till_2am).

Amenities are therefore **not** folded into `tools`. The 6 gear-shaped values move to `tools`; the 17 fixtures become their own thing; the remaining 10 go back to the families they were copied from.

### Composition: fixture + gear + people = service

Nothing is sold on its own. A booth is not sold and a mic is not sold — **vocal recording** is sold, and the booth and mic are the proof beneath it. A service's evidence is its own inputs.

**But the fixture does not determine the service.** One live room backs tracking, rehearsal, a podcast, a video shoot or a workshop — different products, different prices, same room. It is many-to-many, and the business declares what it sells. Fixtures prove *what could be offered*, not what is.

### Two columns to collapse

```
profiles.instruments            text[]   ← talent "plays instruments"
profile_business.equipment_list text[]   ← business "owns equipment"
```

Split by cohort stereotype, not by grade. A mastering engineer with a Bricasti has nowhere to put it; a studio with backline owns instruments. Same asymmetry as `person-profile` vs `business-profile`.

### Marketing read

- **Trust → conversion.** Named, grade-tagged gear is the proof element on a business page. "Microphones, Mixers, Headphones" converts nobody.
- **Long-tail search.** Every gear name is a query. Generic buckets do not rank.
- **Depth follows liquidity, not symmetry.** An empty category makes the shop look dead. 37 instrument values are over-built for browse and right for profiles; 9 equipment buckets are under-built for the highest-churn resale category.
- The 17 fixtures are **booking copy** — parking, 24×7, green room, AC decide a 10-hour session. They belong on the booking page, not buried in a gear list.

## Q3 · Project Types · Project Roles · Intents · Work Types — one family? **Settled.**

**Four categories, 42 values. One container, one recycled media primitive, the rest is metadata — and `intents` does not belong with them.**

### The shape

```
container            portfolio item = project = work — ONE thing, not three
  media[]            audio · video · reel · image · text · link      PRIMITIVE — drives the renderer
  meta
    .task            recording · mixing · mastering · production     shared across all directions
    .format          track · album · ep · single                     release shape
    .framing         client work · case study                        how it is presented
    .sector          film · advertising · digital · independent      industry
```

**All labelling lives under `meta`, but `meta` has named slots — it is not one bag.** A flat meta bucket recreates `studio_amenities` and `opportunity_types` one layer up: five kinds in one list.

### `task` is the spine

`task` is not only meta. It is the one vocabulary shared across every direction:

```
offer   service        task = mixing     "I mix"
need    opportunity    task = mixing     "I need a mix"
done    portfolio      task = mixing     "I mixed this"
```

Same value, three tenses. A portfolio item tagged `mixing` is evidence for a service tagged `mixing`, answering an opportunity tagged `mixing`. Today those are three separate lists that merely happen to contain the same word, so nothing connects.

### Direction: offer, need and accept are one object

| Category | Direction | Overlap |
|---|---|---|
| `service_categories` (8) | **I offer** | recording · mixing · mastering · production |
| `available_for` (9) | **I'll accept** | recording · production · session_work · shows · touring |
| `opportunity_types` (23) | **I need** | recording · mixing · mastering · session_work · gigs · shows |

One vocabulary, three directions, three hand-maintained lists.

```
posting
  direction   offer | need
  task        the work              ← one shared vocabulary
  who         person type wanted    ← persona_types, not "looking_for_singer"
  sector      film · advertising · digital
  needs[]     fixture · gear        ← the "_required" values
```

`direction = offer` renders as a service; `need` renders as an opportunity. `available_for` disappears — "I'll accept" is an offer with looser terms.

### `opportunity_types` is five lists in one

| Kind | n | Values |
|---|---|---|
| A person type wanted | 5 | looking_for_singer / musician / producer / composer / lyricist |
| The task | 5 | recording, mixing, mastering, session_work, sound_engineering |
| Engagement format | 5 | gigs, shows, events, touring, albums |
| Sector | 3 | film, advertising, digital_content |
| **A resource needed** | 5 | studio_required, rehearsal_required, venue_required, equipment_required, rental_required |

The last group is the giveaway: those are needs for a **fixture** and **gear**, the same things modelled on the offer side. The posting says "I need a room and a backline" — a service request, not a category.

### Gig = project = opportunity

Legacy `projects` was *"Gig/opportunity posting with role, budget, genres"* and became opportunities. Three names, one object — the same renaming that made `project` and `work` the same thing.

**Media type is the primitive** because it decides the renderer. One media block serves portfolio, listings, profile, feed, opportunities and reviews — that is what makes it recyclable. `reel` is its own value, not a video: vertical short-form needs a different player, aspect ratio and feed position.

Release format and framing decide nothing on screen. They are labels on the container.

### Why project = work

They were the same object, renamed, and the taxonomy did not follow.

| Legacy Firestore | What it was | Fate |
|---|---|---|
| `portfolio_projects` | published portfolio piece; consumed `project_types`, `project_roles` | **"Superseded by portfolio_items"** |
| `projects` | gig/opportunity posting; consumed `project_roles`, `opportunity_types` | became **opportunities** |

So "project" meant both a portfolio piece and a gig posting, in the same store, at the same time. The table was replaced; `project_types` survived and was **repurposed** onto collabs — `collabs.project_type`, per `collabs.functions.ts:47`. That is why `project_types` and `work_types` overlap: they once classified the same object.

### What each of the four becomes

| Category | n | Verdict |
|---|---|---|
| `work_types` | 10 | **Split.** `image`, `writing`→`text`, `link` are media — keep. `audio`, `video`, `reel` are **missing**. `track`, `album`, `performance` → meta. `project` → the container itself. `client`, `case_study` → framing meta. |
| `project_types` | 10 | **Retire as a work classification.** Duplicates the above. Currently repurposed for collabs only. |
| `project_roles` | 11 | **Retire.** 8 of 11 duplicate `persona_types`; `mix_engineer` is `mixing_engineer` misspelled. A credit role is a person type applied to a work. |
| `intents` | 11 | **Keep, but elsewhere.** Not a property of work — a person's goal on the platform. Onboarding and personalisation. Has no consuming column today. |

### `credit`

Out of scope — credits and rights are not part of the product. Live `portfolio_items` rows carrying `kind = 'credit'` are a stray value not in the taxonomy; it should be removed from `kind`, not modelled.

`collaboration_types` (work_for_hire, royalties_split, co_write, session_payment) stays unused.

## The top layer · nouns and verbs

Owner, 25 Sep. Above the buckets sits one split:

```
NOUNS   things that exist       persona · tool · brand · genre · language · platform · sector · media · format
VERBS   what happens to them    task   record · mix · master · sing · compose
                                trade  buy · sell · rent · hire · book
                                reach  find · discover · promote · join · follow
```

Everything else in the taxonomy is a **pair** of one noun and one verb. That is the single defect behind most of the duplication found in this review: pairs were stored as flat value lists instead of as an edge.

| Thing | Really is |
|---|---|
| an **intent** | verb + noun |
| a **relation** (plays, owns, rents out) | verb + noun |
| a **direction** (offer / need) | the verb on a service |
| a **task** | the verb on a container |

### Intents decompose completely

| Intent | Verb | Noun |
|---|---|---|
| find_collaborators | find | persona (talent) |
| hire_talent | hire | persona (talent) |
| find_studios | find | persona (business) |
| buy_equipment | buy | **tool** |
| rent_equipment | rent | **tool** |
| sell_equipment | sell | **tool** |
| find_work | find | service |
| discover_music | discover | media |
| promote_my_work | promote | container |
| join_communities | join | community |
| build_professional_network | build | connection |

11 values → 9 verbs × 6 nouns, and every noun is a bucket that already exists. `buy_equipment` / `rent_equipment` / `sell_equipment` are one noun with three verbs — the same three verbs recorded separately as tool *relations*. The same pair, written twice, in two unrelated categories.

So `intents` is not moved to onboarding as a list; it is **decomposed**, and the onboarding question becomes "pick a verb and a noun".

### `brand` — the missing noun

There is no brand category, and commercially it is the strongest noun on the list. Shure, Neve, Ableton, Roland, Fender. In gear resale nobody searches "microphone", they search "SM7B". It is also the one noun a seller supplies for free and accurately, because it makes the listing sell.

Today a listing can say `microphones` and nothing more. Brand gives long-tail pages, filters and matching from text sellers already type into the title.

### `task` — the missing verb list

No complete list exists. `service_categories` (8) is the nearest and mixes verbs (mixing, mastering, production, songwriting) with a person type (vocals, instrument) and a business type (studio). Since a service maps to tool + persona, this list has to be rebuilt as verbs before that mapping can work.

## Q5 · Are the specialisation lists service types? **Settled: they belong to services — but only two are tasks.**

| List | n | What the values actually are |
|---|---|---|
| **Engineer Specialties** | 4 | **task** — recording, mixing, mastering, live_sound |
| **Studio Services** | 3 | **task** — duplicate of the above, minus live_sound |
| Director Specializations | 4 | **sector** — film_music, ott, advertising, independent |
| Singing Styles | 9 | **genre** ×8 (all already in `genres`); `playback` is a sector |
| Lyricist Specializations | 6 | genre + sector + one theme |
| Composition Styles | 5 | genre + output format |

31 values across six lists resolve to **four tasks** plus genres and sectors that already exist.

`ghazal`, `bhajan`, `sufi`, `rock`, `rap`, `indie`, `classical`, `electronic`, `orchestral` are all in `genres` (47). They were copied into per-role lists so a singer could say "I sing ghazal" — but that is `task = singing` + `genre = ghazal`, which the platform can already express.

**A singer sings.** The role is the verb; the style is not a kind of singer, it is the genre they sing in.

```
service
  task     recording · mixing · mastering · live_sound · singing · composing · writing · production
  genre    from genres (47)
  sector   film · ott · advertising · independent · digital
  mode     in_person · remote · hybrid          ← work_modes
```

Six specialisation lists → zero. This also removes the per-role detail problem from Q1: those lists existed only because the role had nowhere to put its qualifiers.

## The buckets — where all 39 categories land

Owner's cut, 25 Sep. Eight buckets. A **service** is the unit; it maps to a **tool** and a **persona**.

```
PERSONA      who a subject is
TOOLS        what a subject has            instruments + equipment + daw (not amenities)
SERVICE      what is offered/needed/done   the task list — one vocabulary, three directions
META         labels on anything            genre · language · sector · mode · format · framing · task
MEDIA/EMBED  the renderer primitive        audio · video · reel · image · text · link · platform embeds
STATUS       state of a thing              availability · booking · verification · payment · visibility · duration
COMPLIANCE   verification + trust          left as is
MARKETPLACE  kept separate                 instrument + function
```

Notes on the owner's calls:

- **sector, mode and genre are meta**, not their own families.
- **task is meta too**, but it is the spine — the same vocabulary in three directions (offer / need / done).
- **platform type = use case = embed type.** A link is an output type, like a `.pdf`. Same family as media.
- **availability is a status**, not a persona attribute.
- **Marketplace categories stay separate** — they are instrument + function, a browse concern.
- **Verification is compliance**; `trust_badges` folds into it.
- **Status covers** verification status, payment status, duration/session and visibility.
- **Credits and rights are out of scope** — not modelled.
- **`profile_fields` are tags** → meta. **`pricing_models`, `budget_type` and `collaboration_types` are filter types** → meta. Nothing is left unassigned.

### Full disposition

| Category | n | Bucket | Note |
|---|---|---|---|
| `persona_types` | 38 | **PERSONA** | the 38 roles; flow splits talent/business |
| `persona_badges` | 7 | **PERSONA** | working mode; `home_studio_owner` is really a gear grade |
| `vocal_range` | 6 | **PERSONA** | a physical attribute of a singer |
| `instruments` | 37 | **TOOLS** | merge |
| `equipment_categories` | 9 | **TOOLS** | merge |
| `daw_tools` | 7 | **TOOLS** | merge |
| `service_categories` | 8 | **SERVICE** | closest to a task list; mixes tasks with a person type and a business type |
| `session_types` | 5 | **SERVICE** | task — duplicate |
| `engineer_specialties` | 4 | **SERVICE** | task — recording, mixing, mastering, live_sound |
| `studio_services` | 3 | **SERVICE** | task — duplicate |
| `genres` | 47 | **META** | genre |
| `languages` | 15 | **META** | language |
| `singing_styles` | 9 | **META** | 8 already in `genres`; `playback` is a sector |
| `podcast_categories` | 6 | **META** | genre, for podcasts |
| `lyricist_specializations` | 6 | **META** | genre + sector + one theme |
| `dj_types` | 5 | **META** | sector/context |
| `composition_styles` | 5 | **META** | genre + output format |
| `work_modes` | 4 | **META** | mode |
| `director_specializations` | 4 | **META** | sector |
| `work_types` | 10 | **MEDIA** | add audio, video, reel; writing→text; rest is meta/framing |
| `link_platforms` | 10 | **MEDIA** | platform = embed type |
| `availability_status` | 5 | **STATUS** | availability |
| `booking_statuses` | 5 | **STATUS** | does not match the live check constraint |
| `profile_visibility` | 3 | **STATUS** | visibility |
| `session_duration_tiers` | 3 | **STATUS** | duration / session |
| `verification_id_type` | 5 | **COMPLIANCE** | evidence documents |
| `verification_types` | 4 | **COMPLIANCE** | leave as is |
| `trust_badges` | 4 | **COMPLIANCE** | folded in |
| `marketplace_categories` | 6 | **MARKETPLACE** | separate — instrument + function |
| `intents` | 11 | **MOVE** | onboarding, not work |
| `project_roles` | 11 | **RETIRE** | 8 of 11 duplicate persona_types |
| `project_types` | 10 | **RETIRE** | duplicates work_types |
| `available_for` | 9 | **RETIRE** | an offer with looser terms |
| `studio_amenities` | 33 | **SPLIT** | gear 6 · fixtures 17 · services 6 · people 2 · policy 2 |
| `opportunity_types` | 23 | **SPLIT** | five lists in one |
| `profile_fields` | 30 | **UNASSIGNED** | **no values on the taxonomy page** |
| `pricing_models` | 5 | **UNASSIGNED** | pricing |
| `collaboration_types` | 4 | **UNASSIGNED** | was rights; credits out of scope, now unused |
| `budget_type` | 3 | **UNASSIGNED** | pricing |

39 categories, 419 values.

## Queued changes — none started, all need the owner's word

Each database write is preceded by committing a SQL dump of the live DB to git.

| # | Change | Kind |
|---|---|---|
| 1 | `verification_types`: `studio` → `service` | taxonomy row |
| 2 | `service_categories`: `studio` → `space` | taxonomy row |
| 3 | One `tools` family: `instruments` + `equipment_categories` + `daw_tools` (**not** amenities), with `category` and `grade` on the item, and relation edges (plays / uses / owns / rents / sells / includes) | taxonomy + schema |
| 3b | Split `fixtures` out of tools — not tradeable, drives bookings not marketplace | schema |
| 3c | Collapse `profiles.instruments` + `profile_business.equipment_list` into one gear relation | schema |
| 4 | `booking_requests.service_id` → `profile_services`, so anyone can be booked | schema |
| 5 | Entity model: `tax_id`, real membership, subjects that are not user rows | schema |
| 6 | `studio` as the cohort word in `public-profile.tsx`, `recently-viewed`, `device-history`, `global-search` | code |
| 8 | `work_types` → `media_types` (add `audio`, `video`, `reel`; `writing`→`text`); move release format and framing to meta on the container | taxonomy |
| 9 | Remove the stray `kind='credit'` value from live `portfolio_items` rows — not in the taxonomy, and credits are out of scope | data |
| 7 | Confirm `20260921300000_business_types_cleanup.sql` is actually applied — two code comments say live rows still read `business` | check |

## Reference · every value, reorganised

Imported from the Master Taxonomy page and regrouped. One table per group; the **From** column names the source category, so a slug listed against two categories is a duplicate.

Counts verified against the page: every category matches its declared total except `Profile Fields` (30 declared, **no values published**).

### PERSONA — who a subject is

3 categories · 51 declared · **51 distinct**

| Label | Slug | From |
|---|---|---|
| Singer | `singer` | Persona Types |
| Rapper | `rapper` | Persona Types |
| Folk Vocalist | `folk_vocalist` | Persona Types |
| Voice Artist | `voice_artist` | Persona Types |
| Musician | `musician` | Persona Types |
| Guitarist | `guitarist` | Persona Types |
| Bassist | `bassist` | Persona Types |
| Keyboardist | `keyboardist` | Persona Types |
| Drummer | `drummer` | Persona Types |
| Sitarist | `sitarist` | Persona Types |
| Violinist | `violinist` | Persona Types |
| Flautist | `flautist` | Persona Types |
| Composer | `composer` | Persona Types |
| Lyricist | `lyricist` | Persona Types |
| Vocal Arranger | `arranger` | Persona Types |
| Music Director | `music_director` | Persona Types |
| Music Producer | `producer` | Persona Types |
| Beatmaker | `beatmaker` | Persona Types |
| Sound Engineer | `sound_engineer` | Persona Types |
| Mixing Engineer | `mixing_engineer` | Persona Types |
| Mastering Engineer | `mastering_engineer` | Persona Types |
| Sound Designer | `sound_designer` | Persona Types |
| DJ | `dj` | Persona Types |
| RJ | `rj` | Persona Types |
| Podcaster | `podcaster` | Persona Types |
| Music Teacher | `music_teacher` | Persona Types |
| Recording Studio | `studio` | Persona Types |
| Music Label | `music_label` | Persona Types |
| Venue | `venue` | Persona Types |
| Event Organizer | `event_organizer` | Persona Types |
| Booking Agency | `booking_agency` | Persona Types |
| Artist Management | `artist_manager` | Persona Types |
| Production House | `production_house` | Persona Types |
| Music School | `music_school` | Persona Types |
| Dealer | `dealer` | Persona Types |
| Rental Provider | `rental_provider` | Persona Types |
| Music Publisher | `music_publisher` | Persona Types |
| Other | `other` | Persona Types |
| Available for Collab | `available_for_collab` | Persona Badges |
| Session Ready | `session_ready` | Persona Badges |
| Touring | `touring` | Persona Badges |
| Home Studio Owner | `home_studio_owner` | Persona Badges |
| Full-Time | `full_time` | Persona Badges |
| Weekend Warrior | `weekend_warrior` | Persona Badges |
| Open to Remote Work | `open_to_remote_work` | Persona Badges |
| Soprano | `soprano` | Vocal Range |
| Mezzo-Soprano | `mezzo_soprano` | Vocal Range |
| Alto | `alto` | Vocal Range |
| Tenor | `tenor` | Vocal Range |
| Baritone | `baritone` | Vocal Range |
| Bass | `bass` | Vocal Range |

### TOOLS — what a subject has

3 categories · 53 declared · **53 distinct**

| Label | Slug | From |
|---|---|---|
| Acoustic Guitar | `acoustic_guitar` | Instruments |
| Keyboard | `keyboard` | Instruments |
| Piano | `piano` | Instruments |
| Electric Guitar | `electric_guitar` | Instruments |
| Drums | `drums` | Instruments |
| Tabla | `tabla` | Instruments |
| Bass Guitar | `bass_guitar` | Instruments |
| Flute | `flute_bansuri` | Instruments |
| Violin | `violin` | Instruments |
| Harmonium | `harmonium` | Instruments |
| Sitar | `sitar` | Instruments |
| Dholak | `dholak` | Instruments |
| DJ Controller | `dj_controller` | Instruments |
| Drum Machine | `drum_machine` | Instruments |
| Sampler | `sampler` | Instruments |
| Saxophone | `saxophone` | Instruments |
| Ukulele | `ukulele` | Instruments |
| Cajón | `cajon` | Instruments |
| Santoor | `santoor` | Instruments |
| Mridangam | `mridangam` | Instruments |
| Veena | `veena` | Instruments |
| Sarangi | `sarangi` | Instruments |
| Cello | `cello` | Instruments |
| Trumpet | `trumpet` | Instruments |
| Sarod | `sarod` | Instruments |
| Shehnai | `shehnai` | Instruments |
| Tanpura | `tanpura` | Instruments |
| Ghatam | `ghatam` | Instruments |
| Kanjira | `kanjira` | Instruments |
| Clarinet | `clarinet` | Instruments |
| Nadaswaram | `nadaswaram` | Instruments |
| Mandolin | `mandolin` | Instruments |
| Double Bass | `double_bass` | Instruments |
| Viola | `viola` | Instruments |
| Harmonica | `harmonica` | Instruments |
| Synth | `synth` | Instruments |
| Percussion | `percussion` | Instruments |
| Microphones | `microphones` | Equipment Categories |
| Audio Interfaces | `audio_interfaces` | Equipment Categories |
| Studio Monitors | `studio_monitors` | Equipment Categories |
| Mixers | `mixers` | Equipment Categories |
| Preamps | `preamps` | Equipment Categories |
| Headphones | `headphones` | Equipment Categories |
| Controllers | `controllers` | Equipment Categories |
| PA Systems | `pa_systems` | Equipment Categories |
| Backline | `backline` | Equipment Categories |
| Logic Pro | `logic_pro` | DAW Tools |
| Pro Tools | `pro_tools` | DAW Tools |
| Ableton Live | `ableton_live` | DAW Tools |
| FL Studio | `fl_studio` | DAW Tools |
| Cubase | `cubase` | DAW Tools |
| Studio One | `studio_one` | DAW Tools |
| Reaper | `reaper` | DAW Tools |

### SERVICE — the task (verbs)

4 categories · 20 declared · **12 distinct** · 3 duplicated

| Label | Slug | From |
|---|---|---|
| Vocals | `vocals` | Service Categories |
| Mixing | `mixing` | Service Categories, Engineer Specialties, Session Types, Studio Services **×4** |
| Mastering | `mastering` | Service Categories, Engineer Specialties, Session Types, Studio Services **×4** |
| Production | `production` | Service Categories |
| Instrument | `instrument` | Service Categories |
| Songwriting | `songwriting` | Service Categories |
| Live | `live` | Service Categories |
| Studio | `studio` | Service Categories |
| Recording | `recording` | Engineer Specialties, Session Types, Studio Services **×3** |
| Live Sound | `live_sound` | Engineer Specialties |
| Podcast | `podcast` | Session Types |
| Jam Session | `jam_session` | Session Types |

### META — labels on anything

9 categories · 101 declared · **94 distinct** · 7 duplicated

| Label | Slug | From |
|---|---|---|
| Bollywood | `bollywood` | Genres, DJ Types **×2** |
| Punjabi Pop | `punjabi_pop` | Genres |
| Hindustani Classical | `hindustani_classical` | Genres |
| Carnatic Classical | `carnatic_classical` | Genres |
| Sufi Devotional | `sufi_devotional` | Genres |
| Bhajan | `bhajan` | Genres, Singing Styles **×2** |
| Ghazal | `ghazal` | Genres, Singing Styles **×2** |
| Qawwali | `qawwali` | Genres |
| Bhangra | `bhangra` | Genres |
| Tamil Film (Kollywood | `kollywood` | Genres |
| Telugu Film (Tollywood | `tollywood` | Genres |
| Malayalam Film (Mollywood | `mollywood` | Genres |
| Kannada Film (Sandalwood | `sandalwood` | Genres |
| Rabindra Sangeet | `rabindra_sangeet` | Genres |
| Lavani | `lavani` | Genres |
| Garba | `garba` | Genres |
| Bihu | `bihu` | Genres |
| Bhojpuri Folk | `bhojpuri_folk` | Genres |
| Gaana | `gaana` | Genres |
| Baul | `baul` | Genres |
| Natya Sangeet | `natya_sangeet` | Genres |
| Rajasthani Folk | `rajasthani_folk` | Genres |
| Indie Pop | `indie_pop` | Genres |
| Hip Hop | `hiphop` | Genres |
| Trap | `trap` | Genres |
| Rock | `rock` | Genres, Singing Styles **×2** |
| Metal | `metal` | Genres |
| EDM | `edm` | Genres |
| Lofi | `lofi` | Genres |
| Acoustic | `acoustic` | Genres |
| Fusion | `fusion` | Genres |
| R&B | `rnb` | Genres |
| Jazz | `jazz` | Genres |
| Blues | `blues` | Genres |
| Reggae | `reggae` | Genres |
| Indie | `indie` | Genres, Singing Styles **×2** |
| Electronic | `electronic` | Genres, Composition Styles **×2** |
| Ambient | `ambient` | Genres |
| Pop Vocals | `pop_vocals` | Genres |
| House | `house` | Genres |
| Techno | `techno` | Genres |
| Desi Bass | `desi_bass` | Genres |
| Carnatic Fusion | `carnatic_fusion` | Genres |
| Semi-Classical | `semi_classical` | Genres |
| Gully Rap | `gully_rap` | Genres |
| Folk | `folk` | Genres |
| Punjabi Folk | `punjabi_folk` | Genres |
| हिंदी | `hi` | Languages |
| ਪੰਜਾਬੀ | `pa` | Languages |
| தமிழ் | `ta` | Languages |
| తెలుగు | `te` | Languages |
| বাংলা | `bn` | Languages |
| मराठी | `mr` | Languages |
| ગુજરાતી | `gu` | Languages |
| ಕನ್ನಡ | `kn` | Languages |
| മലയാളം | `ml` | Languages |
| भोजपुरी | `bho` | Languages |
| অসমীয়া | `as` | Languages |
| English | `en` | Languages |
| संस्कृतम् | `sa` | Languages |
| اردو | `ur` | Languages |
| कोंकणी | `kok` | Languages |
| Playback | `playback` | Singing Styles |
| Classical | `classical` | Singing Styles |
| Sufi | `sufi` | Singing Styles |
| Pop | `pop` | Singing Styles |
| Rap | `rap` | Singing Styles, Lyricist Specializations **×2** |
| Music | `music` | Podcast Categories |
| Interview | `interview` | Podcast Categories |
| Comedy | `comedy` | Podcast Categories |
| Culture | `culture` | Podcast Categories |
| Business | `business` | Podcast Categories |
| Education | `education` | Podcast Categories |
| Romantic | `romantic` | Lyricist Specializations |
| Commercial | `commercial` | Lyricist Specializations |
| Devotional | `devotional` | Lyricist Specializations |
| Film Songs | `film_songs` | Lyricist Specializations |
| Independent Music | `independent_music` | Lyricist Specializations |
| Orchestral | `orchestral` | Composition Styles |
| Background Score | `background_score` | Composition Styles |
| Commercial Jingles | `commercial_jingles` | Composition Styles |
| Film Score | `film_score` | Composition Styles |
| Club | `club` | DJ Types |
| Wedding | `wedding` | DJ Types |
| Radio | `radio` | DJ Types |
| Festival | `festival` | DJ Types |
| Film Music | `film_music` | Director Specializations |
| OTT | `ott` | Director Specializations |
| Advertising | `advertising` | Director Specializations |
| Independent | `independent` | Director Specializations |
| In person | `in_person` | Work Modes |
| Remote | `remote` | Work Modes |
| Hybrid | `hybrid` | Work Modes |
| Touring | `touring` | Work Modes |

### FILTERS & TAGS

4 categories · 42 declared · **12 distinct**

| Label | Slug | From |
|---|---|---|
| Per hour | `hourly` | Pricing Models |
| Per song | `per_song` | Pricing Models |
| Per day | `per_day` | Pricing Models |
| Packages only | `package` | Pricing Models |
| Custom quote | `custom` | Pricing Models |
| ₹ (Budget | `budget` | Budget Type |
| ₹₹ (Mid-range | `mid_range` | Budget Type |
| ₹₹₹ (Premium | `premium` | Budget Type |
| Work for Hire | `work_for_hire` | Collaboration Types |
| Royalties Split | `royalties_split` | Collaboration Types |
| Co-Write | `co_write` | Collaboration Types |
| Session Payment | `session_payment` | Collaboration Types |

### STATUS — state of a thing

4 categories · 16 declared · **16 distinct**

| Label | Slug | From |
|---|---|---|
| Available Now | `available_now` | Availability Status |
| Open for Gigs | `open_for_gigs` | Availability Status |
| Booked Soon | `booked_soon` | Availability Status |
| On Tour | `on_tour` | Availability Status |
| Unavailable | `unavailable` | Availability Status |
| Requested | `requested` | Booking Statuses |
| Confirmed | `confirmed` | Booking Statuses |
| Payment Pending | `payment_pending` | Booking Statuses |
| Cancelled | `cancelled` | Booking Statuses |
| Completed | `completed` | Booking Statuses |
| Public | `public` | Profile Visibility |
| MusicLinkd members | `members` | Profile Visibility |
| Limited | `limited` | Profile Visibility |
| Hourly | `hourly` | Session Duration Tiers |
| Half Day | `half_day` | Session Duration Tiers |
| Full Day | `full_day` | Session Duration Tiers |

### MEDIA / EMBED — the renderer primitive

2 categories · 20 declared · **20 distinct**

| Label | Slug | From |
|---|---|---|
| Track | `track` | Work Types |
| Album | `album` | Work Types |
| Video | `video` | Work Types |
| Performance | `performance` | Work Types |
| Project | `project` | Work Types |
| Client work | `client` | Work Types |
| Case study | `case_study` | Work Types |
| Writing sample | `writing` | Work Types |
| Image | `image` | Work Types |
| External link | `link` | Work Types |
| Website | `website` | Link Platforms |
| Instagram | `instagram` | Link Platforms |
| YouTube | `youtube` | Link Platforms |
| Spotify | `spotify` | Link Platforms |
| SoundCloud | `soundcloud` | Link Platforms |
| Apple Music | `apple_music` | Link Platforms |
| Bandcamp | `bandcamp` | Link Platforms |
| Facebook | `facebook` | Link Platforms |
| X | `x` | Link Platforms |
| LinkedIn | `linkedin` | Link Platforms |

### COMPLIANCE — verification and trust

3 categories · 13 declared · **13 distinct**

| Label | Slug | From |
|---|---|---|
| Identity verification | `identity` | Verification Types |
| Professional verification | `professional` | Verification Types |
| Business verification | `business` | Verification Types |
| Studio & space verification | `studio` | Verification Types |
| Government ID (Aadhaar | `govt_id_aadhaar` | Verification ID Type |
| Passport | `passport` | Verification ID Type |
| Driving License | `driving_license` | Verification ID Type |
| Company PAN | `company_pan` | Verification ID Type |
| GSTIN | `company_gstin` | Verification ID Type |
| Verified Artist | `verified_artist` | Trust Badges |
| Top Host | `top_host` | Trust Badges |
| Rising Talent | `rising_talent` | Trust Badges |
| Studio Partner | `studio_partner` | Trust Badges |

### MARKETPLACE — kept separate

1 categories · 6 declared · **6 distinct**

| Label | Slug | From |
|---|---|---|
| Gear Sale | `gear_sale` | Marketplace Categories |
| Gear Rental | `gear_rental` | Marketplace Categories |
| Beats Licensing | `beats_licensing` | Marketplace Categories |
| Stems | `stems` | Marketplace Categories |
| Mixing & Mastering | `mixing_mastering` | Marketplace Categories |
| Creative Services | `creative_services` | Marketplace Categories |

### SPLIT — several kinds in one list

2 categories · 56 declared · **56 distinct**

| Label | Slug | From |
|---|---|---|
| Dolby Atmos | `dolby_atmos` | Studio Amenities |
| Vocal Booth | `vocal_booth` | Studio Amenities |
| Live Room | `live_room` | Studio Amenities |
| Valet Parking | `valet_parking` | Studio Amenities |
| Resident Engineers | `resident_engineers` | Studio Amenities |
| Private Lounge | `private_lounge` | Studio Amenities |
| 24x7 Access | `access_24x7` | Studio Amenities |
| Rehearsal Room | `rehearsal_room` | Studio Amenities |
| Chill Lounge | `chill_lounge` | Studio Amenities |
| Drums Included | `drums_included` | Studio Amenities |
| Parking Space | `parking_space` | Studio Amenities |
| Instruments Support | `instruments_support` | Studio Amenities |
| Acoustics Optimized | `acoustics_optimized` | Studio Amenities |
| Fiber Internet | `fiber_internet` | Studio Amenities |
| Stage Monitors | `stage_monitors` | Studio Amenities |
| Bar & Diner Access | `bar_and_diner_access` | Studio Amenities |
| Green Room | `green_room` | Studio Amenities |
| Wi-Fi | `wifi` | Studio Amenities |
| Attended Sessions | `attended_sessions` | Studio Amenities |
| Stem Mastering | `stem_mastering` | Studio Amenities |
| Analogue Chain | `analogue_chain` | Studio Amenities |
| Reference Library | `reference_library` | Studio Amenities |
| Backline Included | `backline_included` | Studio Amenities |
| Open Till 2 AM | `open_till_2am` | Studio Amenities |
| Lockers | `lockers` | Studio Amenities |
| Cafe | `cafe` | Studio Amenities |
| 4 Mic Positions | `four_mic_positions` | Studio Amenities |
| Multicam Video | `multicam_video` | Studio Amenities |
| Producer | `producer` | Studio Amenities |
| Same-Day Audio | `same_day_audio` | Studio Amenities |
| AC | `air_conditioning` | Studio Amenities |
| Water | `drinking_water` | Studio Amenities |
| Catering | `catering` | Studio Amenities |
| Looking for Singer | `looking_for_singer` | Opportunity Types |
| Looking for Musician | `looking_for_musician` | Opportunity Types |
| Looking for Producer | `looking_for_producer` | Opportunity Types |
| Looking for Composer | `looking_for_composer` | Opportunity Types |
| Looking for Lyricist | `looking_for_lyricist` | Opportunity Types |
| Recording | `recording` | Opportunity Types |
| Mixing | `mixing` | Opportunity Types |
| Mastering | `mastering` | Opportunity Types |
| Session Work | `session_work` | Opportunity Types |
| Sound Engineering | `sound_engineering` | Opportunity Types |
| Gigs | `gigs` | Opportunity Types |
| Shows | `shows` | Opportunity Types |
| Events | `events` | Opportunity Types |
| Touring | `touring` | Opportunity Types |
| Film | `film` | Opportunity Types |
| Advertising | `advertising` | Opportunity Types |
| Albums | `albums` | Opportunity Types |
| Digital Content | `digital_content` | Opportunity Types |
| Studio Required | `studio_required` | Opportunity Types |
| Rehearsal Required | `rehearsal_required` | Opportunity Types |
| Venue Required | `venue_required` | Opportunity Types |
| Equipment Required | `equipment_required` | Opportunity Types |
| Rental Required | `rental_required` | Opportunity Types |

### RETIRE / DECOMPOSE

4 categories · 41 declared · **41 distinct**

| Label | Slug | From |
|---|---|---|
| Singer | `singer` | Project Roles |
| Composer | `composer` | Project Roles |
| Music Director | `music_director` | Project Roles |
| Producer | `producer` | Project Roles |
| Lyricist | `lyricist` | Project Roles |
| Session Musician | `session_musician` | Project Roles |
| DJ | `dj` | Project Roles |
| Mix Engineer | `mix_engineer` | Project Roles |
| Mastering Engineer | `mastering_engineer` | Project Roles |
| Sound Designer | `sound_designer` | Project Roles |
| Band Member | `band_member` | Project Roles |
| Song | `song` | Project Types |
| Album | `album` | Project Types |
| EP | `ep` | Project Types |
| Podcast | `podcast` | Project Types |
| DJ Mix | `dj_mix` | Project Types |
| Film Score | `film_score` | Project Types |
| Commercial Jingle | `commercial_jingle` | Project Types |
| Live Performance | `live_performance` | Project Types |
| Music Video | `music_video` | Project Types |
| Custom Project | `custom_project` | Project Types |
| Shows | `shows` | Available For |
| Session Work | `session_work` | Available For |
| Collaborations | `collaborations` | Available For |
| Projects | `projects` | Available For |
| Teaching | `teaching` | Available For |
| Recording | `recording` | Available For |
| Production | `production` | Available For |
| Freelance Work | `freelance_work` | Available For |
| Touring | `touring` | Available For |
| Find Collaborators | `find_collaborators` | Intents |
| Find Work | `find_work` | Intents |
| Hire Talent | `hire_talent` | Intents |
| Find Studios | `find_studios` | Intents |
| Buy Equipment | `buy_equipment` | Intents |
| Rent Equipment | `rent_equipment` | Intents |
| Sell Equipment | `sell_equipment` | Intents |
| Join Communities | `join_communities` | Intents |
| Discover Music | `discover_music` | Intents |
| Promote My Work | `promote_my_work` | Intents |
| Build Professional Network | `build_professional_network` | Intents |

_419 declared values across 39 categories._

## Open questions

- What the four Firestore types were — not found in code or either spec; would be on the Legacy Schema page
- Business types: collapse 11 → Space / Representation / Supply, with production house and event organizer resisting (they commission)
