# MusicLinkd Master Taxonomy — canonical target

Eight families. Every value placed, nothing dropped. Owner's settled cut, 25 Sep 2026.

> **This is the canonical target, not implemented taxonomy.** Diagnosis is complete; no taxonomy, database or code change has been made.

## Already built — do not reinvent

The "persona determines applicability" mechanism already exists as live join tables:

| Table | Rows | Maps |
|---|---|---|
| `person_type_service_categories` | 53 | persona → service category |
| `person_type_instruments` | 199 | persona → instrument |
| `genre_languages` | 43 | genre → language |
| `taxonomy_options` | **420** | all options; `metadata` carries the `flow` filter |

`getServiceOptions()` (`src/lib/services.functions.ts:280–320`) already reads the mapping into `categoriesByRole` **and** reads `metadata.parent` on `service_categories`, so a parent/child service hierarchy needs no schema change. `profile_role_details(profile_id, role_slug, details jsonb)` is already the structural home for role-specific detail.

**Drift:** 420 options live vs 382 documented on the Notion page — the page is ~38 values behind.

## The eight families

| # | Family | Owns |
|---|---|---|
| 1 | **PERSONA** | Who the subject is |
| 2 | **TOOLS** | What a subject has / uses / owns / rents / sells |
| 3 | **SERVICE** | What is offered / needed / done |
| 4 | **OUTPUT** | What is rendered or attached |
| 5 | **LABELS** | Things being referenced / tagged |
| 6 | **FILTER** | State, type, constraint, eligibility |
| 7 | **META** | Container and structured metadata |
| 8 | **COMPLIANCE** | Verification and trust |

---

## 1 · PERSONA — identity only

Two flows, **37 canonical types**. `persona.flow` → `talent | business`; `persona.type` → one of 37.

| Group | Roles |
|---|---|
| Vocal | Singer · Rapper · Folk Vocalist · Voice Artist |
| Instrumentalist | Musician · Guitarist · Bassist · Keyboardist · Drummer · Sitarist · Violinist · Flautist |
| Creator | Composer · Lyricist · Vocal Arranger · Music Director · Music Producer · Beatmaker |
| Technical | Sound Engineer · Mixing Engineer · Mastering Engineer · Sound Designer |
| Media | DJ · RJ · Podcaster |
| Education | Music Teacher |
| **Business** | Recording Studio · Music Label · Venue · Event Organizer · Booking Agency · Artist Management · Production House · Music School · Dealer · Rental Provider · Music Publisher |

**persona_types** (38) — renamed from `person_types`. `other` retires, leaving 37

| # | Label | Slug |
|---|---|---|
| 1 | Singer | `singer` |
| 2 | Rapper | `rapper` |
| 3 | Folk Vocalist | `folk_vocalist` |
| 4 | Voice Artist | `voice_artist` |
| 5 | Musician | `musician` |
| 6 | Guitarist | `guitarist` |
| 7 | Bassist | `bassist` |
| 8 | Keyboardist | `keyboardist` |
| 9 | Drummer | `drummer` |
| 10 | Sitarist | `sitarist` |
| 11 | Violinist | `violinist` |
| 12 | Flautist | `flautist` |
| 13 | Composer | `composer` |
| 14 | Lyricist | `lyricist` |
| 15 | Vocal Arranger | `arranger` |
| 16 | Music Director | `music_director` |
| 17 | Music Producer | `producer` |
| 18 | Beatmaker | `beatmaker` |
| 19 | Sound Engineer | `sound_engineer` |
| 20 | Mixing Engineer | `mixing_engineer` |
| 21 | Mastering Engineer | `mastering_engineer` |
| 22 | Sound Designer | `sound_designer` |
| 23 | DJ | `dj` |
| 24 | RJ | `rj` |
| 25 | Podcaster | `podcaster` |
| 26 | Music Teacher | `music_teacher` |
| 27 | Recording Studio | `studio` |
| 28 | Music Label | `music_label` |
| 29 | Venue | `venue` |
| 30 | Event Organizer | `event_organizer` |
| 31 | Booking Agency | `booking_agency` |
| 32 | Artist Management | `artist_manager` |
| 33 | Production House | `production_house` |
| 34 | Music School | `music_school` |
| 35 | Dealer | `dealer` |
| 36 | Rental Provider | `rental_provider` |
| 37 | Music Publisher | `music_publisher` |
| 38 | Other | `other` |

**Rules.** `Other` is **not** a canonical Persona Type. **`Band` is not a Persona Type.** Do not add Persona types to express attributes or capabilities. Instruments, genres, skills, services, opportunities, intents, availability and statuses remain separate taxonomies.

**Retire:** `other`, `vocal_range`. **Persona Badges are not Persona** — they move to Filter.

## 2 · TOOLS

Split by **what the tool does in the workflow**, not whether it is physical.

```
TOOLS                              FIXTURES
├── Instruments        33          fixed-to-place infrastructure
└── Production                     booking evidence, NOT marketplace gear
    ├── Hardware       14
    └── Software        7
```

**Instruments** (33) — things you play or perform with

| # | Label | Slug |
|---|---|---|
| 1 | Acoustic Guitar | `acoustic_guitar` |
| 2 | Keyboard | `keyboard` |
| 3 | Piano | `piano` |
| 4 | Electric Guitar | `electric_guitar` |
| 5 | Drums | `drums` |
| 6 | Tabla | `tabla` |
| 7 | Bass Guitar | `bass_guitar` |
| 8 | Flute | `flute_bansuri` |
| 9 | Violin | `violin` |
| 10 | Harmonium | `harmonium` |
| 11 | Sitar | `sitar` |
| 12 | Dholak | `dholak` |
| 13 | Saxophone | `saxophone` |
| 14 | Ukulele | `ukulele` |
| 15 | Cajón | `cajon` |
| 16 | Santoor | `santoor` |
| 17 | Mridangam | `mridangam` |
| 18 | Veena | `veena` |
| 19 | Sarangi | `sarangi` |
| 20 | Cello | `cello` |
| 21 | Trumpet | `trumpet` |
| 22 | Sarod | `sarod` |
| 23 | Shehnai | `shehnai` |
| 24 | Tanpura | `tanpura` |
| 25 | Ghatam | `ghatam` |
| 26 | Kanjira | `kanjira` |
| 27 | Clarinet | `clarinet` |
| 28 | Nadaswaram | `nadaswaram` |
| 29 | Mandolin | `mandolin` |
| 30 | Double Bass | `double_bass` |
| 31 | Viola | `viola` |
| 32 | Harmonica | `harmonica` |
| 33 | Percussion | `percussion` |

**Production → Hardware** (14) — the 4 moved out of Instruments, the 9 equipment categories, plus `speakers`

**…moved from Instruments** (4) — Synth settles as Production, not Instrument

| # | Label | Slug |
|---|---|---|
| 1 | DJ Controller | `dj_controller` |
| 2 | Drum Machine | `drum_machine` |
| 3 | Sampler | `sampler` |
| 4 | Synth | `synth` |

**…equipment categories** (9)

| # | Label | Slug |
|---|---|---|
| 1 | Microphones | `microphones` |
| 2 | Audio Interfaces | `audio_interfaces` |
| 3 | Studio Monitors | `studio_monitors` |
| 4 | Mixers | `mixers` |
| 5 | Preamps | `preamps` |
| 6 | Headphones | `headphones` |
| 7 | Controllers | `controllers` |
| 8 | PA Systems | `pa_systems` |
| 9 | Backline | `backline` |

**…new:** Speakers `speakers`

| Value | Slug | Means |
|---|---|---|
| Studio Monitors | `studio_monitors` | nearfield / farfield monitoring |
| PA Systems | `pa_systems` | live / event amplification |
| **Speakers** | `speakers` | generic, where a more specific type is not required |

**Production → Software** (7)

| # | Label | Slug |
|---|---|---|
| 1 | Logic Pro | `logic_pro` |
| 2 | Pro Tools | `pro_tools` |
| 3 | Ableton Live | `ableton_live` |
| 4 | FL Studio | `fl_studio` |
| 5 | Cubase | `cubase` |
| 6 | Studio One | `studio_one` |
| 7 | Reaper | `reaper` |

**Attributes:** Category · Family · **Grade** (Professional / Prosumer / Personal) · **Brand**. Grade sits on the **item**, not the owner — a Neve is professional in a bedroom.

**Relations are not taxonomy values.** A tool can hold several at once:

```
subject ↔ tool     plays · uses · owns
listing → tool     rents · sells
service ↔ tool     includes
```

**Do not merge Studio Amenities into Tools.** Fixtures stay separate.

## 3 · SERVICE

**Services split between talent type and business type.** The live `service_categories` (8) stays canonical — not replaced by a new verb list — and the split is carried by the **53 rows already in `person_type_service_categories`**.

| Flow | Services |
|---|---|
| **Talent — 7** | Vocals · Mixing · Mastering · Production · Instrument · Songwriting · Live |
| **Business** | Studio → Recording · Mixing · Mastering |

**service_categories** (8) — canonical; `profile_services.category` is the live consumer

| # | Label | Slug |
|---|---|---|
| 1 | Vocals | `vocals` |
| 2 | Mixing | `mixing` |
| 3 | Mastering | `mastering` |
| 4 | Production | `production` |
| 5 | Instrument | `instrument` |
| 6 | Songwriting | `songwriting` |
| 7 | Live | `live` |
| 8 | Studio | `studio` |

The parent/child shape is carried by `metadata.parent`, already read at `services.functions.ts:307`. **No migration — the 53 mappings stay intact.**

```
SERVICE
  task · direction · persona · tool · mode
```

**Direction** — Offer | Need. `offer + mixing`, `need + mixing`, `done + mixing` are one shared concept, not three taxonomies. **`available_for` disappears.**

### Kept separate — not services

**Engineer Specialties** (4)

| # | Label | Slug |
|---|---|---|
| 1 | Recording | `recording` |
| 2 | Mixing | `mixing` |
| 3 | Mastering | `mastering` |
| 4 | Live Sound | `live_sound` |

**Session Types** (5)

| # | Label | Slug |
|---|---|---|
| 1 | Recording | `recording` |
| 2 | Mixing | `mixing` |
| 3 | Mastering | `mastering` |
| 4 | Podcast | `podcast` |
| 5 | Jam Session | `jam_session` |

**Studio Services** (3)

| # | Label | Slug |
|---|---|---|
| 1 | Recording | `recording` |
| 2 | Mixing | `mixing` |
| 3 | Mastering | `mastering` |

**Available For** (9)

| # | Label | Slug |
|---|---|---|
| 1 | Shows | `shows` |
| 2 | Session Work | `session_work` |
| 3 | Collaborations | `collaborations` |
| 4 | Projects | `projects` |
| 5 | Teaching | `teaching` |
| 6 | Recording | `recording` |
| 7 | Production | `production` |
| 8 | Freelance Work | `freelance_work` |
| 9 | Touring | `touring` |

**Marketplace Categories** (6)

| # | Label | Slug |
|---|---|---|
| 1 | Gear Sale | `gear_sale` |
| 2 | Gear Rental | `gear_rental` |
| 3 | Beats Licensing | `beats_licensing` |
| 4 | Stems | `stems` |
| 5 | Mixing & Mastering | `mixing_mastering` |
| 6 | Creative Services | `creative_services` |

**Do not** assign the 23 Opportunity Types to individual Business Personas — there is no row-level evidence. Read the real mapping from `person_type_service_categories`; do not reconstruct it.

## 4 · OUTPUT

Renderer primitive, kept separate from format and framing.

| # | Label | Slug | Status |
|---|---|---|---|
| 1 | Audio | `audio` | **missing today** |
| 2 | Video | `video` | exists in `work_types` |
| 3 | Reel | `reel` | **missing today** |
| 4 | Image | `image` | exists in `work_types` |
| 5 | Text | `text` | `writing` → rename |
| 6 | Link | `link` | exists in `work_types` |

**work_types — to be split** (10) — 3 values are Output; the rest are Meta

| # | Label | Slug |
|---|---|---|
| 1 | Track | `track` |
| 2 | Album | `album` |
| 3 | Video | `video` |
| 4 | Performance | `performance` |
| 5 | Project | `project` |
| 6 | Client work | `client` |
| 7 | Case study | `case_study` |
| 8 | Writing sample | `writing` |
| 9 | Image | `image` |
| 10 | External link | `link` |

| Value | Goes to |
|---|---|
| `video` · `image` · `link` | **Output** |
| `writing` | **Output**, renamed `text` |
| `track` · `album` · `performance` | Meta → format |
| `client` · `case_study` | Meta → framing |
| `project` | Meta → container |

Live rows also carry `kind = 'credit'`, which is **not in the taxonomy** — a stray value to remove. Credits are out of scope.

## 5 · LABELS

Things being referenced or tagged: Persona · Tool · **Brand** · Genre · Language · Platform · Place · Sector · Format · Framing

**Genre** (47)

| # | Label | Slug |
|---|---|---|
| 1 | Bollywood | `bollywood` |
| 2 | Punjabi Pop | `punjabi_pop` |
| 3 | Hindustani Classical | `hindustani_classical` |
| 4 | Carnatic Classical | `carnatic_classical` |
| 5 | Sufi Devotional | `sufi_devotional` |
| 6 | Bhajan | `bhajan` |
| 7 | Ghazal | `ghazal` |
| 8 | Qawwali | `qawwali` |
| 9 | Bhangra | `bhangra` |
| 10 | Tamil Film (Kollywood | `kollywood` |
| 11 | Telugu Film (Tollywood | `tollywood` |
| 12 | Malayalam Film (Mollywood | `mollywood` |
| 13 | Kannada Film (Sandalwood | `sandalwood` |
| 14 | Rabindra Sangeet | `rabindra_sangeet` |
| 15 | Lavani | `lavani` |
| 16 | Garba | `garba` |
| 17 | Bihu | `bihu` |
| 18 | Bhojpuri Folk | `bhojpuri_folk` |
| 19 | Gaana | `gaana` |
| 20 | Baul | `baul` |
| 21 | Natya Sangeet | `natya_sangeet` |
| 22 | Rajasthani Folk | `rajasthani_folk` |
| 23 | Indie Pop | `indie_pop` |
| 24 | Hip Hop | `hiphop` |
| 25 | Trap | `trap` |
| 26 | Rock | `rock` |
| 27 | Metal | `metal` |
| 28 | EDM | `edm` |
| 29 | Lofi | `lofi` |
| 30 | Acoustic | `acoustic` |
| 31 | Fusion | `fusion` |
| 32 | R&B | `rnb` |
| 33 | Jazz | `jazz` |
| 34 | Blues | `blues` |
| 35 | Reggae | `reggae` |
| 36 | Indie | `indie` |
| 37 | Electronic | `electronic` |
| 38 | Ambient | `ambient` |
| 39 | Pop Vocals | `pop_vocals` |
| 40 | House | `house` |
| 41 | Techno | `techno` |
| 42 | Desi Bass | `desi_bass` |
| 43 | Carnatic Fusion | `carnatic_fusion` |
| 44 | Semi-Classical | `semi_classical` |
| 45 | Gully Rap | `gully_rap` |
| 46 | Folk | `folk` |
| 47 | Punjabi Folk | `punjabi_folk` |

**Language** (15)

| # | Label | Slug |
|---|---|---|
| 1 | हिंदी | `hi` |
| 2 | ਪੰਜਾਬੀ | `pa` |
| 3 | தமிழ் | `ta` |
| 4 | తెలుగు | `te` |
| 5 | বাংলা | `bn` |
| 6 | मराठी | `mr` |
| 7 | ગુજરાતી | `gu` |
| 8 | ಕನ್ನಡ | `kn` |
| 9 | മലയാളം | `ml` |
| 10 | भोजपुरी | `bho` |
| 11 | অসমীয়া | `as` |
| 12 | English | `en` |
| 13 | संस्कृतम् | `sa` |
| 14 | اردو | `ur` |
| 15 | कोंकणी | `kok` |

**Platform** (10) — the embed type

| # | Label | Slug |
|---|---|---|
| 1 | Website | `website` |
| 2 | Instagram | `instagram` |
| 3 | YouTube | `youtube` |
| 4 | Spotify | `spotify` |
| 5 | SoundCloud | `soundcloud` |
| 6 | Apple Music | `apple_music` |
| 7 | Bandcamp | `bandcamp` |
| 8 | Facebook | `facebook` |
| 9 | X | `x` |
| 10 | LinkedIn | `linkedin` |

**Sector** — assembled from two lists that retire into it:

**…sector, from Director Specializations** (4)

| # | Label | Slug |
|---|---|---|
| 1 | Film Music | `film_music` |
| 2 | OTT | `ott` |
| 3 | Advertising | `advertising` |
| 4 | Independent | `independent` |

**…sector/context, from DJ Types** (5)

| # | Label | Slug |
|---|---|---|
| 1 | Club | `club` |
| 2 | Wedding | `wedding` |
| 3 | Radio | `radio` |
| 4 | Festival | `festival` |
| 5 | Bollywood | `bollywood` |

**Format** — Track · Album · EP · Single *(from `work_types` + `project_types`)*

**Framing** — Client Work · Case Study *(from `work_types`)*

**Place** — `indian_states` · `cities`. Live in code, **undocumented in Notion**.

**Brand** — **new.** Shure · Neve · Ableton · Roland · Fender. The highest-intent term in gear resale; absent today.

## 6 · FILTER

**Availability Status** (5)

| # | Label | Slug |
|---|---|---|
| 1 | Available Now | `available_now` |
| 2 | Open for Gigs | `open_for_gigs` |
| 3 | Booked Soon | `booked_soon` |
| 4 | On Tour | `on_tour` |
| 5 | Unavailable | `unavailable` |

**Booking Statuses** (5) — **reconcile with the live check constraint before implementation**

| # | Label | Slug |
|---|---|---|
| 1 | Requested | `requested` |
| 2 | Confirmed | `confirmed` |
| 3 | Payment Pending | `payment_pending` |
| 4 | Cancelled | `cancelled` |
| 5 | Completed | `completed` |

**Profile Visibility** (3)

| # | Label | Slug |
|---|---|---|
| 1 | Public | `public` |
| 2 | MusicLinkd members | `members` |
| 3 | Limited | `limited` |

**Session Duration Tiers** (3)

| # | Label | Slug |
|---|---|---|
| 1 | Hourly | `hourly` |
| 2 | Half Day | `half_day` |
| 3 | Full Day | `full_day` |

**Pricing Models** (5)

| # | Label | Slug |
|---|---|---|
| 1 | Per hour | `hourly` |
| 2 | Per song | `per_song` |
| 3 | Per day | `per_day` |
| 4 | Packages only | `package` |
| 5 | Custom quote | `custom` |

**Budget Type** (3)

| # | Label | Slug |
|---|---|---|
| 1 | ₹ (Budget | `budget` |
| 2 | ₹₹ (Mid-range | `mid_range` |
| 3 | ₹₹₹ (Premium | `premium` |

**Collaboration Types** (4)

| # | Label | Slug |
|---|---|---|
| 1 | Work for Hire | `work_for_hire` |
| 2 | Royalties Split | `royalties_split` |
| 3 | Co-Write | `co_write` |
| 4 | Session Payment | `session_payment` |

**Work Modes** (4)

| # | Label | Slug |
|---|---|---|
| 1 | In person | `in_person` |
| 2 | Remote | `remote` |
| 3 | Hybrid | `hybrid` |
| 4 | Touring | `touring` |

**Persona Badges** (7) — **moved out of Persona**

| # | Label | Slug |
|---|---|---|
| 1 | Available for Collab | `available_for_collab` |
| 2 | Session Ready | `session_ready` |
| 3 | Touring | `touring` |
| 4 | Home Studio Owner | `home_studio_owner` |
| 5 | Full-Time | `full_time` |
| 6 | Weekend Warrior | `weekend_warrior` |
| 7 | Open to Remote Work | `open_to_remote_work` |

### Family assignment

| Category | Family |
|---|---|
| availability | Status / filter |
| booking | Status / filter — reconcile state machine |
| visibility | Status / filter |
| duration · pricing · budget · collaboration | Filter |
| verification_types · verification_id_types | Compliance |
| trust_badges | Compliance / trust |
| marketplace_categories | **Derived** — Tools + transaction |
| opportunity_types | Split — see Intent → Opportunity |

**Missing:** payment status, verification status. **Do not recreate Vocal Range.**

### Code-only / backend categories — must be documented

These exist in the backend (`src/lib/taxonomy.ts`) but are missing from the 39-category Notion presentation. **They must be documented rather than silently treated as nonexistent:**

`discovery_prefs` · `experience_levels` · `genders` · `indian_states` · `cities` · `business_policies`

**vocal_range — RETIRED** (6) — Western SATB; gender is the relevant attribute and `genders` already exists

| # | Label | Slug |
|---|---|---|
| 1 | Soprano | `soprano` |
| 2 | Mezzo-Soprano | `mezzo_soprano` |
| 3 | Alto | `alto` |
| 4 | Tenor | `tenor` |
| 5 | Baritone | `baritone` |
| 6 | Bass | `bass` |

## 7 · META

Container · Task · Format · Framing · Sector · Profile Fields

**Container** — Portfolio Item · Project/Work · Opportunity · Gig · Service · Listing · Collaboration. Records built from the same underlying structure, not separate taxonomy universes; the project/work/opportunity/gig naming had become fragmented representations of related objects.

**Task is the spine** — the same task appears as `offer → service`, `need → opportunity`, `done → portfolio/work`.

**project_types — RETIRED** (10) — the old container list; folds into format

| # | Label | Slug |
|---|---|---|
| 1 | Song | `song` |
| 2 | Album | `album` |
| 3 | EP | `ep` |
| 4 | Podcast | `podcast` |
| 5 | DJ Mix | `dj_mix` |
| 6 | Film Score | `film_score` |
| 7 | Commercial Jingle | `commercial_jingle` |
| 8 | Live Performance | `live_performance` |
| 9 | Music Video | `music_video` |
| 10 | Custom Project | `custom_project` |

**project_roles — RETIRED as taxonomy** (11) — 8 of 11 duplicate persona_types; `mix_engineer` is `mixing_engineer` misspelled

| # | Label | Slug |
|---|---|---|
| 1 | Singer | `singer` |
| 2 | Composer | `composer` |
| 3 | Music Director | `music_director` |
| 4 | Producer | `producer` |
| 5 | Lyricist | `lyricist` |
| 6 | Session Musician | `session_musician` |
| 7 | DJ | `dj` |
| 8 | Mix Engineer | `mix_engineer` |
| 9 | Mastering Engineer | `mastering_engineer` |
| 10 | Sound Designer | `sound_designer` |
| 11 | Band Member | `band_member` |

**profile_fields** (0) — stay schema-level fields unless a field genuinely needs controlled vocabulary

| # | Label | Slug |
|---|---|---|
| — | _no values published_ | — |

## 8 · COMPLIANCE

Trust belongs inside Compliance, **not** Persona.

**verification_types** (4) — `studio` → **`service`**

| # | Label | Slug |
|---|---|---|
| 1 | Identity verification | `identity` |
| 2 | Professional verification | `professional` |
| 3 | Business verification | `business` |
| 4 | Studio & space verification | `studio` |

**verification_id_types** (5)

| # | Label | Slug |
|---|---|---|
| 1 | Government ID (Aadhaar | `govt_id_aadhaar` |
| 2 | Passport | `passport` |
| 3 | Driving License | `driving_license` |
| 4 | Company PAN | `company_pan` |
| 5 | GSTIN | `company_gstin` |

**trust_badges** (4)

| # | Label | Slug |
|---|---|---|
| 1 | Verified Artist | `verified_artist` |
| 2 | Top Host | `top_host` |
| 3 | Rising Talent | `rising_talent` |
| 4 | Studio Partner | `studio_partner` |

---

## 9 · INTENT → OPPORTUNITY → ENGAGEMENT

Two-way, not separate one-sided taxonomies.

> **Intent becomes a Service when offered, and an Opportunity when needed.**

```
INTENT                     why — the entry / use-case layer
  ↓ creates / enters
OPPORTUNITY                what is being offered or needed — the transaction object
  ├── Direction   Offer | Need
  ├── Persona     who is wanted / involved
  ├── Task        Recording · Mixing · Mastering · Singing · …
  ├── Engagement  Gig · Collaboration · Session · Project · …
  ├── Sector
  ├── Resource
  ├── Location
  ├── Timing
  └── Terms
       ↕ responds / accepts / applies
PERSON / BUSINESS
```

### Intent is directional

| # | Intent | Slug | Direction |
|---|---|---|---|
| 1 | Find Collaborators | `find_collaborators` | Need |
| 2 | Find Work | `find_work` | Need |
| 3 | Hire Talent | `hire_talent` | Need |
| 4 | Find Studios | `find_studios` | Need |
| 5 | Buy Equipment | `buy_equipment` | Need |
| 6 | Rent Equipment | `rent_equipment` | Need |
| 7 | Sell Equipment | `sell_equipment` | **Offer** |
| 8 | Join Communities | `join_communities` | Join |
| 9 | Discover Music | `discover_music` | Explore |
| 10 | Promote My Work | `promote_my_work` | **Offer** |
| 11 | Build Professional Network | `build_professional_network` | Connect |

Intent is an **entry layer**, not the transaction object.

### The two-way relation

```
A ── creates ──► OPPORTUNITY ◄── responds ── B
                      ↓ accepted
        Gig · Collaboration · Session · Project ·
        Service engagement · Hire · Rental · Sale
```

The Opportunity itself does **not** encode which side it is "for".

### Gig and Collaboration are engagement types

Neither is an Intent, neither is a Persona type. **Gig = what kind of engagement the opportunity represents.** Collaboration is an engagement relationship attached to an Opportunity.

```
Intent  → Find Work
Opportunity → Need: Singer · Engagement: Gig · Sector: Advertising · Mumbai · 12 Oct
            ← Singer responds / applies

Intent  → Find Collaborators
Opportunity → Need: Composer · Task: Composing · Engagement: Collaboration ·
              Format: Single · Collaboration model: Co-write
            ← Composer responds
```

**Intent = why · Opportunity = what is offered/needed · Gig / Collaboration = what kind of engagement · Relation = A ↔ B through the Opportunity.**

**opportunity_types — to be SPLIT** (23) — five kinds in one flat list

| # | Label | Slug |
|---|---|---|
| 1 | Looking for Singer | `looking_for_singer` |
| 2 | Looking for Musician | `looking_for_musician` |
| 3 | Looking for Producer | `looking_for_producer` |
| 4 | Looking for Composer | `looking_for_composer` |
| 5 | Looking for Lyricist | `looking_for_lyricist` |
| 6 | Recording | `recording` |
| 7 | Mixing | `mixing` |
| 8 | Mastering | `mastering` |
| 9 | Session Work | `session_work` |
| 10 | Sound Engineering | `sound_engineering` |
| 11 | Gigs | `gigs` |
| 12 | Shows | `shows` |
| 13 | Events | `events` |
| 14 | Touring | `touring` |
| 15 | Film | `film` |
| 16 | Advertising | `advertising` |
| 17 | Albums | `albums` |
| 18 | Digital Content | `digital_content` |
| 19 | Studio Required | `studio_required` |
| 20 | Rehearsal Required | `rehearsal_required` |
| 21 | Venue Required | `venue_required` |
| 22 | Equipment Required | `equipment_required` |
| 23 | Rental Required | `rental_required` |

| → | n | Values |
|---|---|---|
| **Persona** wanted | 5 | looking_for_singer · looking_for_musician · looking_for_producer · looking_for_composer · looking_for_lyricist |
| **Task** | 5 | recording · mixing · mastering · session_work · sound_engineering |
| **Engagement format** | 5 | gigs · shows · events · touring · albums |
| **Sector** | 3 | film · advertising · digital_content |
| **Resource** needed | 5 | studio_required · rehearsal_required · venue_required · equipment_required · rental_required |

Making Gig, Collaboration, Find Work and Hire Talent competing taxonomy categories is the thing this replaces.

---

## Fixtures — the Studio Amenities split

**studio_amenities — to be SPLIT** (33) — kept OUT of Tools

| # | Label | Slug |
|---|---|---|
| 1 | Dolby Atmos | `dolby_atmos` |
| 2 | Vocal Booth | `vocal_booth` |
| 3 | Live Room | `live_room` |
| 4 | Valet Parking | `valet_parking` |
| 5 | Resident Engineers | `resident_engineers` |
| 6 | Private Lounge | `private_lounge` |
| 7 | 24x7 Access | `access_24x7` |
| 8 | Rehearsal Room | `rehearsal_room` |
| 9 | Chill Lounge | `chill_lounge` |
| 10 | Drums Included | `drums_included` |
| 11 | Parking Space | `parking_space` |
| 12 | Instruments Support | `instruments_support` |
| 13 | Acoustics Optimized | `acoustics_optimized` |
| 14 | Fiber Internet | `fiber_internet` |
| 15 | Stage Monitors | `stage_monitors` |
| 16 | Bar & Diner Access | `bar_and_diner_access` |
| 17 | Green Room | `green_room` |
| 18 | Wi-Fi | `wifi` |
| 19 | Attended Sessions | `attended_sessions` |
| 20 | Stem Mastering | `stem_mastering` |
| 21 | Analogue Chain | `analogue_chain` |
| 22 | Reference Library | `reference_library` |
| 23 | Backline Included | `backline_included` |
| 24 | Open Till 2 AM | `open_till_2am` |
| 25 | Lockers | `lockers` |
| 26 | Cafe | `cafe` |
| 27 | 4 Mic Positions | `four_mic_positions` |
| 28 | Multicam Video | `multicam_video` |
| 29 | Producer | `producer` |
| 30 | Same-Day Audio | `same_day_audio` |
| 31 | AC | `air_conditioning` |
| 32 | Water | `drinking_water` |
| 33 | Catering | `catering` |

| → | n | Values |
|---|---|---|
| **Amenities** | 17 | vocal_booth · live_room · private_lounge · rehearsal_room · chill_lounge · parking_space · green_room · lockers · cafe · reference_library · fiber_internet · wifi · air_conditioning · drinking_water · catering · bar_and_diner_access · valet_parking |
| **Tools** | 3 | drums_included · stage_monitors · backline_included |
| **Services** | 5 | resident_engineers · instruments_support · attended_sessions · stem_mastering · multicam_video |
| **Policies** | 2 | access_24x7 · open_till_2am |
| **Facility attributes** | 4 | dolby_atmos · acoustics_optimized · analogue_chain · four_mic_positions |
| **Staff / Persona** | 1 | producer *(a `persona_types` slug)* |
| **UNASSIGNED** | 1 | **same_day_audio** |

Catering, Bar & Diner Access and Valet Parking are services rather than physical amenities, but are defensible under Amenities if that means "things provided by the business".

There is **no `Capability` taxonomy** in MusicLinkd and none is to be introduced.

---

## Role-specific data — not top-level families

| Legacy list | n | Correct treatment |
|---|---|---|
| Singing Styles | 9 | Genre / sector attributes |
| Lyricist Specializations | 6 | Genre / sector / theme |
| Composition Styles | 5 | Genre / format |
| Director Specializations | 4 | Sector |
| DJ Types | 5 | Sector / context |
| Podcast Categories | 6 | Content genre / context |
| Engineer Specialties | 4 | Task |

Home: the existing `profile_role_details(profile_id, role_slug, details jsonb)`.

**Singing Styles** (9)

| # | Label | Slug |
|---|---|---|
| 1 | Playback | `playback` |
| 2 | Classical | `classical` |
| 3 | Ghazal | `ghazal` |
| 4 | Sufi | `sufi` |
| 5 | Indie | `indie` |
| 6 | Pop | `pop` |
| 7 | Rock | `rock` |
| 8 | Rap | `rap` |
| 9 | Bhajan | `bhajan` |

**Lyricist Specializations** (6)

| # | Label | Slug |
|---|---|---|
| 1 | Romantic | `romantic` |
| 2 | Commercial | `commercial` |
| 3 | Devotional | `devotional` |
| 4 | Rap | `rap` |
| 5 | Film Songs | `film_songs` |
| 6 | Independent Music | `independent_music` |

**Composition Styles** (5)

| # | Label | Slug |
|---|---|---|
| 1 | Orchestral | `orchestral` |
| 2 | Electronic | `electronic` |
| 3 | Background Score | `background_score` |
| 4 | Commercial Jingles | `commercial_jingles` |
| 5 | Film Score | `film_score` |

**Podcast Categories** (6)

| # | Label | Slug |
|---|---|---|
| 1 | Music | `music` |
| 2 | Interview | `interview` |
| 3 | Comedy | `comedy` |
| 4 | Culture | `culture` |
| 5 | Business | `business` |
| 6 | Education | `education` |

---

## Retirement table

| Legacy | Final |
|---|---|
| `person_types` | `persona_types` |
| `other` · `vocal_range` · `available_for` · `project_types` | Retired |
| `persona_badges` | Filter |
| `instruments` · `equipment_categories` · `daw_tools` | Tools |
| `marketplace_categories` | Derived — Tools + transaction |
| `service_categories` · `engineer_specialties` · `session_types` · `studio_services` | Service task |
| `work_types` | Split — Output + Meta |
| `project_roles` | Retired as taxonomy |
| `intents` | Entry layer with a direction — **Service** when offered, **Opportunity** when needed |
| `studio_amenities` · `opportunity_types` | Split |
| `singing_styles` · `lyricist_specializations` · `composition_styles` · `director_specializations` · `dj_types` | Role detail |

## Still open

1. **`same_day_audio`** is unassigned in the amenity split — 17+3+5+2+4+1 = 32 of 33. Reads as a Service (turnaround commitment); owner's call.
2. **Persona groups** — shown as 6 talent groups; an earlier instruction was to keep the flat original list. Presentational grouping for a picker, or structural?
3. **Booking statuses** must be reconciled with the live check constraint (`requested/reviewing/confirmed/declined/cancelled/completed`) before implementation.
4. **Four status vocabularies disagree** — `booking_statuses` taxonomy, `booking_requests.status`, `rental_bookings.status`, `enquiries.status`.

## Database work — not started

Each write is preceded by committing a SQL dump of the live database to git. The project is Lovable Cloud and is not reachable from this session's Supabase account.

| # | Change |
|---|---|
| 1 | Rename `person_types` → `persona_types` |
| 2 | Retire `other` and `vocal_range` |
| 3 | Move `dj_controller`, `drum_machine`, `sampler`, `synth` from Instruments to Production → Hardware |
| 4 | Add `speakers` |
| 5 | Add `brand` |
| 6 | Add `audio`, `video`, `reel` to Output; rename `writing` → `text` |
| 7 | `verification_types.studio` → `service` |
| 8 | Split `studio_amenities` and `opportunity_types` |
| 9 | Remove the stray `kind = 'credit'` rows from `portfolio_items` |
| 10 | Document the six code-only categories in Notion |