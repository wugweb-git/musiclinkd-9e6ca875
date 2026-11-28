# Master Taxonomy — from Notion, 25 Sep 2026

Source: Wugweb HQ / MusicLinkd / MusicLinkd pages / 🏷️ Master Taxonomy (verified).
Stored as `label` → `` `slug` ``. The **slug** is the stored identifier, never the label.

## Canonical model

Flat Postgres tables, not a nested document store:

- `taxonomy_categories/{key}` — `key`, `label`, `description`, `is_published`, `created_at`, `updated_at`
- `taxonomy_options/{category_key, slug}` — `category_key`, `slug`, `label`, `sort_order`, `is_published`, `metadata` (jsonb), `created_at`, `updated_at`

Core categories: `person_types`, `languages`, `genres`, `instruments`, `persona_badges`, `project_types`, `project_roles`, `booking_statuses`, `studio_amenities`, `collaboration_types`, `trust_badges`. The other 28 are live but secondary.

## Critical rules

- Store `option.slug`, not the label.
- Admin controls taxonomy writes. App screens and debug screens do not write master taxonomy.
- No parallel `metadata_*` collections when the generic taxonomy can carry the concept.
- Not every string is taxonomy. Fixed named UI fields (the social/link fields) stay explicit until the UI goes dynamic — though `link_platforms` now models exactly that set and `profiles.links` reads it as jsonb keys.
- A person's `person_types` identity is distinct from a project's `project_roles` attribution.
- Instruments selected on a profile are the same vocabulary marketplace gear records must reference.
- Onboarding enforces controlled limits, e.g. **up to 3 genres/styles**.
- **Dynamic consumption:** an option is not operational just because the row exists. A screen must read and write it.

---

## Person Types — 38

Each option carries `metadata.flow`, splitting **`talent_user`** (1–26 + Other, a person doing the role) from **`business_user`** (27–37, a company doing it). A role a person does is a talent type; a company is a business type — so Sound Engineer, Composer, Beatmaker and Sound Designer are never tagged on business profiles. A&R and artist management are one business type (Artist Management, `artist_manager`); `a_and_r` was removed. Flow values were `talent` / `business` until the 21 Sep migration `20260921300000_business_types_cleanup.sql`.

**Talent (1–26):** Singer `singer` · Rapper `rapper` · Folk Vocalist `folk_vocalist` · Voice Artist `voice_artist` · Musician `musician` · Guitarist `guitarist` · Bassist `bassist` · Keyboardist `keyboardist` · Drummer `drummer` · Sitarist `sitarist` · Violinist `violinist` · Flautist `flautist` · Composer `composer` · Lyricist `lyricist` · Vocal Arranger `arranger` · Music Director `music_director` · Music Producer `producer` · Beatmaker `beatmaker` · Sound Engineer `sound_engineer` · Mixing Engineer `mixing_engineer` · Mastering Engineer `mastering_engineer` · Sound Designer `sound_designer` · DJ `dj` · RJ `rj` · Podcaster `podcaster` · Music Teacher `music_teacher`

**Business (27–37):** Recording Studio `studio` · Music Label `music_label` · Venue `venue` · Event Organizer `event_organizer` · Booking Agency `booking_agency` · Artist Management `artist_manager` · Production House `production_house` · Music School `music_school` · Dealer `dealer` · Rental Provider `rental_provider` · Music Publisher `music_publisher`

**38.** Other `other`

## Genres — 47

Bollywood `bollywood` · Punjabi Pop `punjabi_pop` · Hindustani Classical `hindustani_classical` · Carnatic Classical `carnatic_classical` · Sufi Devotional `sufi_devotional` · Bhajan `bhajan` · Ghazal `ghazal` · Qawwali `qawwali` · Bhangra `bhangra` · Tamil Film (Kollywood) `kollywood` · Telugu Film (Tollywood) `tollywood` · Malayalam Film (Mollywood) `mollywood` · Kannada Film (Sandalwood) `sandalwood` · Rabindra Sangeet `rabindra_sangeet` · Lavani `lavani` · Garba `garba` · Bihu `bihu` · Bhojpuri Folk `bhojpuri_folk` · Gaana `gaana` · Baul `baul` · Natya Sangeet `natya_sangeet` · Rajasthani Folk `rajasthani_folk` · Indie Pop `indie_pop` · Hip Hop `hiphop` · Trap `trap` · Rock `rock` · Metal `metal` · EDM `edm` · Lofi `lofi` · Acoustic `acoustic` · Fusion `fusion` · R&B `rnb` · Jazz `jazz` · Blues `blues` · Reggae `reggae` · Indie `indie` · Electronic `electronic` · Ambient `ambient` · Pop Vocals `pop_vocals` · House `house` · Techno `techno` · Desi Bass `desi_bass` · Carnatic Fusion `carnatic_fusion` · Semi-Classical `semi_classical` · Gully Rap `gully_rap` · Folk `folk` · Punjabi Folk `punjabi_folk`

## Instruments — 37

Acoustic Guitar `acoustic_guitar` · Keyboard `keyboard` · Piano `piano` · Electric Guitar `electric_guitar` · Drums `drums` · Tabla `tabla` · Bass Guitar `bass_guitar` · Flute `flute_bansuri` · Violin `violin` · Harmonium `harmonium` · Sitar `sitar` · Dholak `dholak` · DJ Controller `dj_controller` · Drum Machine `drum_machine` · Sampler `sampler` · Saxophone `saxophone` · Ukulele `ukulele` · Cajón `cajon` · Santoor `santoor` · Mridangam `mridangam` · Veena `veena` · Sarangi `sarangi` · Cello `cello` · Trumpet `trumpet` · Sarod `sarod` · Shehnai `shehnai` · Tanpura `tanpura` · Ghatam `ghatam` · Kanjira `kanjira` · Clarinet `clarinet` · Nadaswaram `nadaswaram` · Mandolin `mandolin` · Double Bass `double_bass` · Viola `viola` · Harmonica `harmonica` · Synth `synth` · Percussion `percussion`

## Profile Fields — 30

Listed on the Notion page as a category of 30, with the field map itself held in Master Schema → Profile field map. **The value list is empty on the taxonomy page.**

## Opportunity Types — 23

Looking for Singer `looking_for_singer` · Looking for Musician `looking_for_musician` · Looking for Producer `looking_for_producer` · Looking for Composer `looking_for_composer` · Looking for Lyricist `looking_for_lyricist` · Recording `recording` · Mixing `mixing` · Mastering `mastering` · Session Work `session_work` · Sound Engineering `sound_engineering` · Gigs `gigs` · Shows `shows` · Events `events` · Touring `touring` · Film `film` · Advertising `advertising` · Albums `albums` · Digital Content `digital_content` · Studio Required `studio_required` · Rehearsal Required `rehearsal_required` · Venue Required `venue_required` · Equipment Required `equipment_required` · Rental Required `rental_required`

## Studio Amenities — 33

Dolby Atmos `dolby_atmos` · Vocal Booth `vocal_booth` · Live Room `live_room` · Valet Parking `valet_parking` · Resident Engineers `resident_engineers` · Private Lounge `private_lounge` · 24x7 Access `access_24x7` · Rehearsal Room `rehearsal_room` · Chill Lounge `chill_lounge` · Drums Included `drums_included` · Parking Space `parking_space` · Instruments Support `instruments_support` · Acoustics Optimized `acoustics_optimized` · Fiber Internet `fiber_internet` · Stage Monitors `stage_monitors` · Bar & Diner Access `bar_and_diner_access` · Green Room `green_room` · Wi-Fi `wifi` · Attended Sessions `attended_sessions` · Stem Mastering `stem_mastering` · Analogue Chain `analogue_chain` · Reference Library `reference_library` · Backline Included `backline_included` · Open Till 2 AM `open_till_2am` · Lockers `lockers` · Cafe `cafe` · 4 Mic Positions `four_mic_positions` · Multicam Video `multicam_video` · Producer `producer` · Same-Day Audio `same_day_audio` · AC `air_conditioning` · Water `drinking_water` · Catering `catering`

## Languages — 15

हिंदी `hi` · ਪੰਜਾਬੀ `pa` · தமிழ் `ta` · తెలుగు `te` · বাংলা `bn` · मराठी `mr` · ગુજરાતી `gu` · ಕನ್ನಡ `kn` · മലയാളം `ml` · भोजपुरी `bho` · অসমীয়া `as` · English `en` · संस्कृतम् `sa` · اردو `ur` · कोंकणी `kok`

## Intents — 11

Find Collaborators `find_collaborators` · Find Work `find_work` · Hire Talent `hire_talent` · Find Studios `find_studios` · Buy Equipment `buy_equipment` · Rent Equipment `rent_equipment` · Sell Equipment `sell_equipment` · Join Communities `join_communities` · Discover Music `discover_music` · Promote My Work `promote_my_work` · Build Professional Network `build_professional_network`

## Project Roles — 11

Singer `singer` · Composer `composer` · Music Director `music_director` · Producer `producer` · Lyricist `lyricist` · Session Musician `session_musician` · DJ `dj` · Mix Engineer `mix_engineer` · Mastering Engineer `mastering_engineer` · Sound Designer `sound_designer` · Band Member `band_member`

## Link Platforms — 10

Website `website` · Instagram `instagram` · YouTube `youtube` · Spotify `spotify` · SoundCloud `soundcloud` · Apple Music `apple_music` · Bandcamp `bandcamp` · Facebook `facebook` · X `x` · LinkedIn `linkedin`

## Project Types — 10

Song `song` · Album `album` · EP `ep` · Podcast `podcast` · DJ Mix `dj_mix` · Film Score `film_score` · Commercial Jingle `commercial_jingle` · Live Performance `live_performance` · Music Video `music_video` · Custom Project `custom_project`

## Work Types — 10

Track `track` · Album `album` · Video `video` · Performance `performance` · Project `project` · Client work `client` · Case study `case_study` · Writing sample `writing` · Image `image` · External link `link`

## Available For — 9

Shows `shows` · Session Work `session_work` · Collaborations `collaborations` · Projects `projects` · Teaching `teaching` · Recording `recording` · Production `production` · Freelance Work `freelance_work` · Touring `touring`

## Singing Styles — 9

Playback `playback` · Classical `classical` · Ghazal `ghazal` · Sufi `sufi` · Indie `indie` · Pop `pop` · Rock `rock` · Rap `rap` · Bhajan `bhajan`

## Equipment Categories — 9

Microphones `microphones` · Audio Interfaces `audio_interfaces` · Studio Monitors `studio_monitors` · Mixers `mixers` · Preamps `preamps` · Headphones `headphones` · Controllers `controllers` · PA Systems `pa_systems` · Backline `backline`

## Service Categories — 8

Vocals `vocals` · Mixing `mixing` · Mastering `mastering` · Production `production` · Instrument `instrument` · Songwriting `songwriting` · Live `live` · Studio `studio`

## DAW Tools — 7

Logic Pro `logic_pro` · Pro Tools `pro_tools` · Ableton Live `ableton_live` · FL Studio `fl_studio` · Cubase `cubase` · Studio One `studio_one` · Reaper `reaper`

## Persona Badges — 7

Available for Collab `available_for_collab` · Session Ready `session_ready` · Touring `touring` · Home Studio Owner `home_studio_owner` · Full-Time `full_time` · Weekend Warrior `weekend_warrior` · Open to Remote Work `open_to_remote_work`

## Lyricist Specializations — 6

Romantic `romantic` · Commercial `commercial` · Devotional `devotional` · Rap `rap` · Film Songs `film_songs` · Independent Music `independent_music`

## Marketplace Categories — 6

Gear Sale `gear_sale` · Gear Rental `gear_rental` · Beats Licensing `beats_licensing` · Stems `stems` · Mixing & Mastering `mixing_mastering` · Creative Services `creative_services`

## Podcast Categories — 6

Music `music` · Interview `interview` · Comedy `comedy` · Culture `culture` · Business `business` · Education `education`

## Vocal Range — 6

Soprano `soprano` · Mezzo-Soprano `mezzo_soprano` · Alto `alto` · Tenor `tenor` · Baritone `baritone` · Bass `bass`

## Availability Status — 5

Available Now `available_now` · Open for Gigs `open_for_gigs` · Booked Soon `booked_soon` · On Tour `on_tour` · Unavailable `unavailable`

## Booking Statuses — 5

Requested `requested` · Confirmed `confirmed` · Payment Pending `payment_pending` · Cancelled `cancelled` · Completed `completed`

## Composition Styles — 5

Orchestral `orchestral` · Electronic `electronic` · Background Score `background_score` · Commercial Jingles `commercial_jingles` · Film Score `film_score`

## DJ Types — 5

Club `club` · Wedding `wedding` · Radio `radio` · Festival `festival` · Bollywood `bollywood`

## Pricing Models — 5

Per hour `hourly` · Per song `per_song` · Per day `per_day` · Packages only `package` · Custom quote `custom`

## Session Types — 5

Recording `recording` · Mixing `mixing` · Mastering `mastering` · Podcast `podcast` · Jam Session `jam_session`

## Verification ID Type — 5

Government ID (Aadhaar) `govt_id_aadhaar` · Passport `passport` · Driving License `driving_license` · Company PAN `company_pan` · GSTIN `company_gstin`

## Collaboration Types — 4

Work for Hire `work_for_hire` · Royalties Split `royalties_split` · Co-Write `co_write` · Session Payment `session_payment`

## Director Specializations — 4

Film Music `film_music` · OTT `ott` · Advertising `advertising` · Independent `independent`

## Engineer Specialties — 4

Recording `recording` · Mixing `mixing` · Mastering `mastering` · Live Sound `live_sound`

## Trust Badges — 4

Verified Artist `verified_artist` · Top Host `top_host` · Rising Talent `rising_talent` · Studio Partner `studio_partner`

## Verification Types — 4

Identity verification `identity` · Professional verification `professional` · Business verification `business` · Studio & space verification `studio`

## Work Modes — 4

In person `in_person` · Remote `remote` · Hybrid `hybrid` · Touring `touring`

## Budget Type — 3

₹ (Budget) `budget` · ₹₹ (Mid-range) `mid_range` · ₹₹₹ (Premium) `premium`

## Profile Visibility — 3

Public `public` · MusicLinkd members `members` · Limited `limited`

## Session Duration Tiers — 3

Hourly `hourly` · Half Day `half_day` · Full Day `full_day`

## Studio Services — 3

Recording `recording` · Mixing `mixing` · Mastering `mastering`

---

## Reconciliation gaps recorded on the page (17–18 Sep 2026)

Categories that exist live but have **no confirmed consuming column** — taxonomy-only until a screen reads/writes them:

- `opportunity_types` (23) — `opportunities` has no `opportunity_type` column
- `available_for` (9) — no matching column found anywhere
- `project_types` (10) — does not match the real values of `portfolio_items.kind`
- `booking_statuses` (5) — **correction 18 Sep:** `booking_requests` and `rental_bookings` are both live, and neither reads this taxonomy. `booking_requests.status` is a hardcoded check constraint (`requested / reviewing / confirmed / declined / cancelled / completed`). "Payment Pending" has no counterpart; "reviewing" and "declined" are not in the taxonomy. Reconcile the vocabulary or wire the constraint to `taxonomy_options` before calling it consumed.

One live mismatch: `work_types` feeds `portfolio_items.kind`, but real rows also use `credit`, which is not in the taxonomy — add it, or stop writing it.

Historical milestone: 128 taxonomy options were written to the legacy store; that migration is complete and every category is now live in Postgres.
