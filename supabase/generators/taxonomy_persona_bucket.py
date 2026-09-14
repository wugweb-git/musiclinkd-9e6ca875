"""Generates the taxonomy + persona-bucket migration and its companion doc from one data set.

Usage: python3 supabase/generators/taxonomy_persona_bucket.py <migration.sql> <PERSONA-BUCKET.md>
"""
import sys

LANGUAGES = [  # (slug, native label) — app onboarding order
    ("hi", "हिंदी"), ("pa", "ਪੰਜਾਬੀ"), ("ta", "தமிழ்"), ("te", "తెలుగు"), ("bn", "বাংলা"),
    ("mr", "मराठी"), ("gu", "ગુજરાતી"), ("kn", "ಕನ್ನಡ"), ("ml", "മലയാളം"), ("bho", "भोजपुरी"),
    ("as", "অসমীয়া"), ("en", "English"),
]
INDIAN = [s for s, _ in LANGUAGES if s != "en"]

BUSINESS_TYPES = [
    ("studio", "Studio"), ("label", "Label"), ("agency", "Agency"), ("venue", "Venue"),
    ("dealer", "Dealer"), ("rental_provider", "Rental Provider"), ("music_school", "Music School"),
    ("production_house", "Production House"), ("other", "Other"),
]

FAMILIES = [("guitar", "Guitar"), ("keys", "Keys"), ("percussion", "Percussion"),
            ("indian_string", "Indian String"), ("bowed", "Bowed"), ("wind", "Wind"),
            ("electronic", "Electronic")]

# (slug, label, family, added)
INSTRUMENTS = [
    ("acoustic_guitar", "Acoustic Guitar", "guitar", False),
    ("electric_guitar", "Electric Guitar", "guitar", False),
    ("bass_guitar", "Bass Guitar", "guitar", False),
    ("ukulele", "Ukulele", "guitar", True),
    ("mandolin", "Mandolin", "guitar", True),
    ("keyboard_synthesizer", "Keyboard / Synthesizer", "keys", False),
    ("piano", "Piano", "keys", False),
    ("harmonium", "Harmonium", "keys", False),
    ("drums_percussion", "Drums / Percussion", "percussion", False),
    ("tabla", "Tabla", "percussion", False),
    ("dholak", "Dholak", "percussion", False),
    ("mridangam", "Mridangam", "percussion", False),
    ("ghatam", "Ghatam", "percussion", True),
    ("kanjira", "Kanjira", "percussion", True),
    ("cajon", "Cajón", "percussion", True),
    ("sitar", "Sitar", "indian_string", False),
    ("sarod", "Sarod", "indian_string", False),
    ("santoor", "Santoor", "indian_string", False),
    ("veena", "Veena", "indian_string", False),
    ("tanpura", "Tanpura", "indian_string", False),
    ("violin", "Violin", "bowed", False),
    ("viola", "Viola", "bowed", True),
    ("cello", "Cello", "bowed", False),
    ("double_bass", "Double Bass", "bowed", True),
    ("sarangi", "Sarangi", "bowed", True),
    ("flute_bansuri", "Flute (Bansuri)", "wind", False),
    ("saxophone", "Saxophone", "wind", False),
    ("trumpet", "Trumpet", "wind", False),
    ("clarinet", "Clarinet", "wind", True),
    ("shehnai", "Shehnai", "wind", False),
    ("nadaswaram", "Nadaswaram", "wind", True),
    ("harmonica", "Harmonica", "wind", True),
    ("dj_controller", "DJ Controller / Turntables", "electronic", True),
    ("drum_machine_sampler", "Drum Machine / Sampler", "electronic", True),
]
FAM = {s: f for s, _, f, _ in INSTRUMENTS}
ALL = [s for s, *_ in INSTRUMENTS]

def fam(*families, plus=(), minus=()):
    out = [s for s in ALL if FAM[s] in families] + list(plus)
    return [s for s in ALL if s in out and s not in minus]

GROUPS = [("vocal", "Vocal"), ("instrumentalist", "Instrumentalist"), ("creator", "Creator"),
          ("technical", "Technical"), ("media", "Media"), ("education", "Education"),
          ("business", "Business"), ("other", "Other")]

# (slug, label, group, source, instruments, basis)
PERSON_TYPES = [
    ("singer", "Singer / Vocalist", "vocal", "both", fam("guitar", "keys"), "Vedanshu, 14 Sep"),
    ("rapper", "Rapper / MC", "vocal", "firestore", [], "none"),
    ("folk_vocalist", "Folk Vocalist", "vocal", "firestore", ["acoustic_guitar", "harmonium", "dholak"], "proposed"),
    ("voice_artist", "Voice Artist", "vocal", "app", [], "app: not asked"),
    ("musician", "Musician", "instrumentalist", "app", ALL, "app: asked"),
    ("guitarist", "Guitarist", "instrumentalist", "firestore", fam("guitar"), "label"),
    ("bassist", "Bassist", "instrumentalist", "added", ["bass_guitar", "double_bass"], "label"),
    ("keyboardist", "Keyboardist / Pianist", "instrumentalist", "firestore", fam("keys"), "label"),
    ("drummer", "Drummer / Percussionist", "instrumentalist", "firestore", fam("percussion", plus=["drum_machine_sampler"]), "label"),
    ("sitarist", "Sitarist / Flutist", "instrumentalist", "firestore", fam("indian_string", plus=["flute_bansuri"]), "label"),
    ("violinist", "Violinist / String Player", "instrumentalist", "added", fam("bowed"), "label"),
    ("wind_player", "Flautist / Wind Player", "instrumentalist", "added", fam("wind"), "label"),
    ("composer", "Composer", "creator", "both", ALL, "app: asked"),
    ("lyricist", "Lyricist", "creator", "both", [], "app: not asked"),
    ("arranger", "Vocal Arranger", "creator", "firestore", fam("keys"), "proposed"),
    ("music_director", "Music Director", "creator", "app", [], "app: not asked"),
    ("producer", "Music Producer", "creator", "both", ALL, "app: asked"),
    ("beatmaker", "Beatmaker", "creator", "added", ["keyboard_synthesizer", "drum_machine_sampler"], "proposed"),
    ("sound_engineer", "Sound Engineer", "technical", "both", [], "app: not asked"),
    ("mixing_engineer", "Mixing Engineer", "technical", "added", [], "none"),
    ("mastering_engineer", "Mastering Engineer", "technical", "added", [], "none"),
    ("sound_designer", "Sound Designer", "technical", "firestore", ["keyboard_synthesizer", "drum_machine_sampler"], "proposed"),
    ("dj", "DJ", "media", "app", fam("electronic"), "proposed (no acoustic instruments)"),
    ("rj", "RJ", "media", "app", [], "app: not asked"),
    ("podcaster", "Podcaster", "media", "app", [], "app: not asked"),
    ("music_teacher", "Music Teacher", "education", "app", ALL, "app: asked"),
    ("artist_manager", "Artist Manager", "business", "firestore", [], "business"),
    ("a_and_r", "A&R", "business", "added", [], "business"),
    ("music_label", "Music Label", "business", "firestore", [], "business"),
    ("music_publisher", "Music Publisher", "business", "firestore", [], "business"),
    ("studio", "Recording Studio", "business", "firestore", [], "business"),
    ("event_organizer", "Event Organizer", "business", "firestore", [], "business"),
    ("other", "Other", "other", "app", [], "app: not asked"),
]

# (slug, label, languages or None for universal, added)
GENRES = [
    ("indie_pop", "Indie Pop", None, False),
    ("rock_metal", "Rock / Metal", None, False),
    ("hiphop_trap", "Hip Hop / Trap", None, False),
    ("lofi_chill", "Lofi / Chill Beats", None, False),
    ("edm_synthwave", "EDM / Synthwave", None, False),
    ("acoustic_unplugged", "Acoustic / Unplugged", None, False),
    ("rnb_soul", "R&B / Soul", None, False),
    ("jazz_blues", "Jazz / Blues", None, False),
    ("reggae_dub", "Reggae / Dub", None, False),
    ("fusion", "Fusion", None, True),
    ("bollywood_filmi", "Bollywood / Filmi", ["hi"], False),
    ("hindustani_classical", "Hindustani Classical", ["hi", "pa", "bn", "mr", "gu", "as", "bho"], False),
    ("carnatic_classical", "Carnatic Classical", ["ta", "te", "kn", "ml"], False),
    ("sufi_devotional", "Sufi Devotional", ["hi", "pa"], False),
    ("ghazal", "Ghazal", ["hi"], False),
    ("qawwali", "Qawwali", ["hi", "pa"], False),
    ("bhajan_kirtan", "Bhajan / Kirtan", INDIAN, True),
    ("punjabi_folk_bhangra", "Punjabi Folk / Bhangra", ["pa"], False),
    ("punjabi_pop", "Punjabi Pop", ["pa"], True),
    ("rajasthani_folk", "Rajasthani Folk", ["hi"], False),
    ("bhojpuri_folk", "Bhojpuri Folk", ["bho"], True),
    ("kollywood", "Tamil Film (Kollywood)", ["ta"], True),
    ("gaana", "Gaana", ["ta"], True),
    ("tollywood", "Telugu Film (Tollywood)", ["te"], True),
    ("sandalwood", "Kannada Film (Sandalwood)", ["kn"], True),
    ("mollywood", "Malayalam Film (Mollywood)", ["ml"], True),
    ("rabindra_sangeet", "Rabindra Sangeet", ["bn"], True),
    ("baul", "Baul", ["bn"], True),
    ("lavani", "Lavani", ["mr"], True),
    ("natya_sangeet", "Natya Sangeet", ["mr"], True),
    ("garba_dandiya", "Garba / Dandiya", ["gu"], True),
    ("bihu", "Bihu", ["as"], True),
]

# Screen cap: no picker shows more than this many options.
SCREEN_LIMIT = 12

# Popularity order — sets sort_order, and decides which options survive the screen cap.
INSTRUMENT_RANK = [
    "acoustic_guitar", "keyboard_synthesizer", "piano", "electric_guitar", "drums_percussion",
    "tabla", "bass_guitar", "flute_bansuri", "violin", "harmonium", "sitar", "dholak",
    "dj_controller", "drum_machine_sampler", "saxophone", "ukulele", "cajon", "santoor",
    "mridangam", "veena", "sarangi", "cello", "trumpet", "sarod", "shehnai", "tanpura",
    "ghatam", "kanjira", "clarinet", "nadaswaram", "mandolin", "double_bass", "viola", "harmonica",
]
GENRE_RANK = [
    # regional
    "bollywood_filmi", "punjabi_pop", "hindustani_classical", "carnatic_classical", "sufi_devotional",
    "bhajan_kirtan", "ghazal", "qawwali", "punjabi_folk_bhangra", "kollywood", "tollywood",
    "mollywood", "sandalwood", "rabindra_sangeet", "lavani", "garba_dandiya", "bihu",
    "bhojpuri_folk", "gaana", "baul", "natya_sangeet", "rajasthani_folk",
    # universal
    "indie_pop", "hiphop_trap", "rock_metal", "edm_synthwave", "lofi_chill", "acoustic_unplugged",
    "fusion", "rnb_soul", "jazz_blues", "reggae_dub",
]

# ---- integrity checks -------------------------------------------------------
def unique(xs, what):
    assert len(xs) == len(set(xs)), f"duplicate {what}"
unique([s for s, _ in LANGUAGES], "language"); unique(ALL, "instrument")
unique([p[0] for p in PERSON_TYPES], "person type"); unique([g[0] for g in GENRES], "genre")
for p in PERSON_TYPES:
    assert all(i in FAM for i in p[4]), p[0]
    assert p[2] in dict(GROUPS), p[0]
for g in GENRES:
    assert g[2] is None or all(l in dict(LANGUAGES) for l in g[2]), g[0]
assert sorted(INSTRUMENT_RANK) == sorted(ALL), "INSTRUMENT_RANK must list every instrument once"
assert sorted(GENRE_RANK) == sorted(g[0] for g in GENRES), "GENRE_RANK must list every genre once"
# Flat pickers and every person-type group must fit one screen.
assert len(LANGUAGES) <= SCREEN_LIMIT, "languages exceed a screen"
assert len(BUSINESS_TYPES) <= SCREEN_LIMIT, "business types exceed a screen"
assert len(GROUPS) <= SCREEN_LIMIT, "person-type groups exceed a screen"
for gk, _ in GROUPS:
    assert sum(p[2] == gk for p in PERSON_TYPES) <= SCREEN_LIMIT, f"group {gk} exceeds a screen"

def bucket(primary, secondary, languages, limit=SCREEN_LIMIT):
    """Python mirror of persona_bucket(): (instruments, genres, instruments_total, genres_total)."""
    assert len(secondary) <= 2 and len(set(secondary)) == len(secondary) and primary not in secondary
    pt = {p[0]: p for p in PERSON_TYPES}
    prim = set(pt[primary][4])
    allowed = set().union(prim, *(pt[r][4] for r in secondary))
    ins = sorted(allowed, key=lambda s: (s not in prim, INSTRUMENT_RANK.index(s)))
    scope = {g[0]: g[2] for g in GENRES}
    matched = [g for g in GENRE_RANK if scope[g] is None or set(scope[g]) & set(languages)]
    gen = sorted(matched, key=lambda g: (scope[g] is None, GENRE_RANK.index(g)))
    return ins[:limit], gen[:limit], len(ins), len(gen)

def q(s):
    return "'" + s.replace("'", "''") + "'"

def meta(d):
    import json
    return q(json.dumps(d, ensure_ascii=False)) + "::jsonb"

# ---- SQL ---------------------------------------------------------------------
def sql():
    L = []
    w = L.append
    w("""-- Taxonomy reference data and the persona bucket.
--
-- Generated by supabase/generators/taxonomy_persona_bucket.py, which also writes
-- Claude outputs/specs/PERSONA-BUCKET.md. Edit the data there and regenerate, not this file.
-- Shape follows specs/TAXONOMY-MIGRATION-SPEC.md §5: options keyed by stable slug, never by
-- display string.
--
-- Categories: languages (12, native-script labels, ISO 639-1 slugs; Bhojpuri ISO 639-3 `bho`),
-- business_types (9), person_types (33), instruments (34, metadata.family), genres (32,
-- metadata.scope universal | regional).
--
-- Rules: person_type_instruments (which instruments a person type can hold) and genre_languages
-- (which languages unlock a regional genre). Both reference taxonomy_options by foreign key.
--
-- persona_bucket(primary, secondary[], languages[], limit) returns the options a profile can pick:
-- instruments = union over primary + up to 2 secondary person types, primary's first;
-- genres = regional genres linked to any selected language first, then universal genres.
-- Each category is capped at limit (default 12) so no picker screen exceeds it.
-- sort_order on instruments and genres is popularity, which decides what survives the cap.
--
-- Does not touch profiles. Reference data: public SELECT, no client write.
--
-- Rollback:
--   DROP FUNCTION public.persona_bucket(text, text[], text[], int);
--   DROP TABLE public.genre_languages, public.person_type_instruments,
--              public.taxonomy_options, public.taxonomy_categories;

CREATE TABLE public.taxonomy_categories (
  key         text PRIMARY KEY,
  label       text NOT NULL,
  description text NOT NULL DEFAULT '',
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.taxonomy_options (
  category_key text NOT NULL REFERENCES public.taxonomy_categories(key) ON DELETE CASCADE,
  slug         text NOT NULL,
  label        text NOT NULL,
  sort_order   int  NOT NULL DEFAULT 0,
  is_active    boolean NOT NULL DEFAULT true,
  metadata     jsonb,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (category_key, slug)
);

CREATE INDEX taxonomy_options_active_sort_idx
  ON public.taxonomy_options (category_key, sort_order) WHERE is_active;

CREATE TABLE public.person_type_instruments (
  person_type_category text NOT NULL DEFAULT 'person_types' CHECK (person_type_category = 'person_types'),
  person_type_slug     text NOT NULL,
  instrument_category  text NOT NULL DEFAULT 'instruments' CHECK (instrument_category = 'instruments'),
  instrument_slug      text NOT NULL,
  PRIMARY KEY (person_type_slug, instrument_slug),
  FOREIGN KEY (person_type_category, person_type_slug)
    REFERENCES public.taxonomy_options (category_key, slug) ON DELETE CASCADE,
  FOREIGN KEY (instrument_category, instrument_slug)
    REFERENCES public.taxonomy_options (category_key, slug) ON DELETE CASCADE
);

CREATE TABLE public.genre_languages (
  genre_category    text NOT NULL DEFAULT 'genres' CHECK (genre_category = 'genres'),
  genre_slug        text NOT NULL,
  language_category text NOT NULL DEFAULT 'languages' CHECK (language_category = 'languages'),
  language_slug     text NOT NULL,
  PRIMARY KEY (genre_slug, language_slug),
  FOREIGN KEY (genre_category, genre_slug)
    REFERENCES public.taxonomy_options (category_key, slug) ON DELETE CASCADE,
  FOREIGN KEY (language_category, language_slug)
    REFERENCES public.taxonomy_options (category_key, slug) ON DELETE CASCADE
);

CREATE INDEX genre_languages_language_idx ON public.genre_languages (language_slug);

GRANT SELECT ON public.taxonomy_categories, public.taxonomy_options,
                public.person_type_instruments, public.genre_languages TO anon, authenticated;
GRANT ALL ON public.taxonomy_categories, public.taxonomy_options,
             public.person_type_instruments, public.genre_languages TO service_role;

ALTER TABLE public.taxonomy_categories     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taxonomy_options        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.person_type_instruments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.genre_languages         ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Taxonomy categories are readable by everyone"
  ON public.taxonomy_categories FOR SELECT USING (true);
CREATE POLICY "Taxonomy options are readable by everyone"
  ON public.taxonomy_options FOR SELECT USING (true);
CREATE POLICY "Person type instruments are readable by everyone"
  ON public.person_type_instruments FOR SELECT USING (true);
CREATE POLICY "Genre languages are readable by everyone"
  ON public.genre_languages FOR SELECT USING (true);
""")
    w("INSERT INTO public.taxonomy_categories (key, label, description) VALUES")
    cats = [
        ("languages", "Languages", "Languages a person performs or writes in."),
        ("business_types", "Business Types", "Kind of business a business profile represents."),
        ("person_types", "Person Types", "Primary and secondary roles a person selects."),
        ("instruments", "Instruments", "Instruments a person plays."),
        ("genres", "Genres", "Genres a person works in."),
    ]
    w(",\n".join(f"  ({q(k)}, {q(l)}, {q(d)})" for k, l, d in cats) + ";\n")

    def options(cat, rows):
        w(f"INSERT INTO public.taxonomy_options (category_key, slug, label, sort_order, metadata) VALUES")
        w(",\n".join(f"  ({q(cat)}, {q(s)}, {q(l)}, {i}, {m})" for i, (s, l, m) in enumerate(rows, 1)) + ";\n")

    options("languages", [(s, l, "NULL") for s, l in LANGUAGES])
    options("business_types", [(s, l, "NULL") for s, l in BUSINESS_TYPES])
    options("person_types", [(p[0], p[1], meta({"group": p[2]})) for p in PERSON_TYPES])
    by_ins = {s: (s, l, f) for s, l, f, _ in INSTRUMENTS}
    options("instruments", [(s, l, meta({"family": f})) for s, l, f in (by_ins[x] for x in INSTRUMENT_RANK)])
    by_gen = {g[0]: g for g in GENRES}
    options("genres", [(g[0], g[1], meta({"scope": "universal" if g[2] is None else "regional"}))
                       for g in (by_gen[x] for x in GENRE_RANK)])

    w("INSERT INTO public.person_type_instruments (person_type_slug, instrument_slug) VALUES")
    w(",\n".join(f"  ({q(p[0])}, {q(i)})" for p in PERSON_TYPES for i in p[4]) + ";\n")

    w("INSERT INTO public.genre_languages (genre_slug, language_slug) VALUES")
    w(",\n".join(f"  ({q(g[0])}, {q(l)})" for g in GENRES if g[2] for l in g[2]) + ";\n")

    w("""CREATE FUNCTION public.persona_bucket(
  p_primary   text,
  p_secondary text[] DEFAULT '{}',
  p_languages text[] DEFAULT '{}',
  p_limit     int    DEFAULT 12
)
RETURNS TABLE (category_key text, slug text, label text, display_order int)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $fn$
#variable_conflict use_column
DECLARE
  v_roles text[] := array_append(coalesce(p_secondary, '{}'), p_primary);
BEGIN
  IF p_limit IS NULL OR p_limit < 1 THEN
    RAISE EXCEPTION 'persona_bucket: p_limit must be at least 1, got %', p_limit;
  END IF;
  IF cardinality(coalesce(p_secondary, '{}')) > 2 THEN
    RAISE EXCEPTION 'persona_bucket: at most 2 secondary person types, got %', cardinality(p_secondary);
  END IF;
  IF (SELECT count(DISTINCT x) FROM unnest(coalesce(p_secondary, '{}')) x) <> cardinality(coalesce(p_secondary, '{}')) THEN
    RAISE EXCEPTION 'persona_bucket: secondary person types repeat: %', p_secondary;
  END IF;
  IF p_primary = ANY (coalesce(p_secondary, '{}')) THEN
    RAISE EXCEPTION 'persona_bucket: secondary person type % repeats the primary', p_primary;
  END IF;
  IF EXISTS (
    SELECT 1 FROM unnest(v_roles) r
    WHERE NOT EXISTS (SELECT 1 FROM taxonomy_options o
                      WHERE o.category_key = 'person_types' AND o.slug = r AND o.is_active)
  ) THEN
    RAISE EXCEPTION 'persona_bucket: unknown person type in %', v_roles;
  END IF;

  -- tier 0 ranks first: instruments the primary person type allows; regional genres a selected
  -- language unlocks. Within a tier, sort_order (popularity). Each category is capped at p_limit.
  RETURN QUERY
  WITH candidates AS (
    SELECT o.category_key AS cat, o.slug AS opt_slug, o.label AS opt_label, o.sort_order AS rank_order,
           CASE WHEN EXISTS (SELECT 1 FROM person_type_instruments p0
                             WHERE p0.instrument_slug = o.slug AND p0.person_type_slug = p_primary)
                THEN 0 ELSE 1 END AS tier
    FROM taxonomy_options o
    WHERE o.category_key = 'instruments' AND o.is_active
      AND EXISTS (SELECT 1 FROM person_type_instruments pti
                  WHERE pti.instrument_slug = o.slug AND pti.person_type_slug = ANY (v_roles))
    UNION ALL
    SELECT o.category_key, o.slug, o.label, o.sort_order,
           CASE WHEN o.metadata->>'scope' = 'regional' THEN 0 ELSE 1 END
    FROM taxonomy_options o
    WHERE o.category_key = 'genres' AND o.is_active
      AND (o.metadata->>'scope' = 'universal'
           OR EXISTS (SELECT 1 FROM genre_languages gl
                      WHERE gl.genre_slug = o.slug
                        AND gl.language_slug = ANY (coalesce(p_languages, '{}'))))
  ),
  ranked AS (
    SELECT c.*, (row_number() OVER (PARTITION BY c.cat ORDER BY c.tier, c.rank_order))::int AS rn
    FROM candidates c
  )
  SELECT r.cat, r.opt_slug, r.opt_label, r.rn
  FROM ranked r
  WHERE r.rn <= p_limit
  ORDER BY r.cat, r.rn;
END
$fn$;

GRANT EXECUTE ON FUNCTION public.persona_bucket(text, text[], text[], int) TO anon, authenticated;
""")
    return "\n".join(L)

# ---- doc ---------------------------------------------------------------------
def doc():
    L = []; w = L.append
    lab = {s: l for s, l, *_ in INSTRUMENTS}
    w("""---
doc: PERSONA-BUCKET
version: 0.2
status: DRAFT — for Vedanshu's review
updated: 2026-09-14
verified_against: musiclinkd-9e6ca875 supabase/migrations/20260914120000_taxonomy_persona_bucket.sql (generated from the same data)
folder: specs
originally: new
---

> **DRAFT** · 14 Sep 2026. The options a profile can pick, given one primary person type, up to two
> secondary person types, and its languages. Generated together with the migration, so the tables
> below and the SQL cannot disagree. Rows marked *added* were not in either source list.

# Persona bucket

**Instruments** = union of the instruments allowed for the primary and each secondary person type.
**Genres** = every *universal* genre, plus each *regional* genre linked to any selected language.

## Screen limit — 12 per screen

| Screen | How it stays within 12 |
|---|---|
| Languages | 12 options |
| Business types | 9 options |
| Primary / secondary person type | pick a group (8), then a type (largest group: 8) |
| Instruments | `persona_bucket` caps at 12 — primary's instruments first, then secondaries', each by popularity |
| Genres | `persona_bucket` caps at 12 — regional genres for the selected languages first, then universal, each by popularity |

The generator refuses to build if any flat list or person-type group exceeds 12.

Call: `select * from persona_bucket('singer', array['lyricist','composer'], array['hi','en']);`
— returns `category_key, slug, label, display_order`; `display_order` is the on-screen order, 1–12.
""")
    w("## Languages (12)\n\n| Slug | Name |\n|---|---|")
    for s, l in LANGUAGES: w(f"| `{s}` | {l} |")
    w("\n## Business types (9)\n\n| Slug | Label |\n|---|---|")
    for s, l in BUSINESS_TYPES: w(f"| `{s}` | {l} |")
    w(f"\n## Instruments ({len(INSTRUMENTS)})\n\n| Family | Instruments |\n|---|---|")
    popularity = " · ".join(f"{i}. {lab[s]}" for i, s in enumerate(INSTRUMENT_RANK, 1))
    for f, fl in FAMILIES:
        w(f"| {fl} | " + " · ".join(l + (" *(added)*" if a else "") for s, l, ff, a in INSTRUMENTS if ff == f) + " |")
    w(f"\nPopularity order: {popularity}")
    w(f"\n## Person types ({len(PERSON_TYPES)}) → instruments\n")
    w("| Group | Types |\n|---|---|")
    for gk, gname in GROUPS:
        members = [p[1] for p in PERSON_TYPES if p[2] == gk]
        w(f"| {gname} ({len(members)}) | " + " · ".join(members) + " |")
    w("")
    w("| Group | Slug | Label | Source | Instruments | Basis |\n|---|---|---|---|---|---|")
    for p in PERSON_TYPES:
        ins = p[4]
        if ins == ALL: txt = "all"
        elif not ins: txt = "—"
        else:
            parts = []
            for f, fl in FAMILIES:
                members = [s for s in ALL if FAM[s] == f]
                got = [s for s in members if s in ins]
                if got and got == members: parts.append(f"**{fl}**")
                elif got: parts.append(", ".join(lab[s] for s in got))
            txt = " · ".join(parts)
        w(f"| {dict(GROUPS)[p[2]]} | `{p[0]}` | {p[1]} | {p[3]} | {txt} | {p[5]} |")
    w(f"\n## Genres ({len(GENRES)}) → languages, in popularity order\n\n| Slug | Label | Scope | Languages |\n|---|---|---|---|")
    ln = dict(LANGUAGES)
    for g in sorted(GENRES, key=lambda g: GENRE_RANK.index(g[0])):
        langs = "all" if g[2] is None else ("all Indian" if g[2] == INDIAN else " · ".join(ln[l] for l in g[2]))
        w(f"| `{g[0]}` | {g[1]}{' *(added)*' if g[3] else ''} | {'universal' if g[2] is None else 'regional'} | {langs} |")
    w("\n## Worked examples\n")
    gl = {g[0]: g[1] for g in GENRES}
    for prim, sec, langs in [("singer", ["lyricist", "composer"], ["hi", "en"]),
                             ("singer", ["lyricist", "dj"], ["ta"]),
                             ("drummer", ["folk_vocalist"], ["pa", "bho"])]:
        ins, gen, ni, ng = bucket(prim, sec, langs)
        w(f"**{prim} + {', '.join(sec)} · languages {' · '.join(ln[l] for l in langs)}**\n")
        w(f"- Instruments — {len(ins)} shown of {ni} allowed: " + ", ".join(lab[s] for s in ins))
        w(f"- Genres — {len(gen)} shown of {ng} allowed: " + ", ".join(gl[g] for g in gen) + "\n")
    w("""## Not decided here

- Which person types, instruments and genres ship — every *added* row and every *proposed* basis.
- `profiles.roles`, `.instruments`, `.genres`, `.languages` still store the app's English strings; this
  data is not wired to onboarding or to `profiles` yet.
- Firestore `person_types` kept its combined label `Sitarist / Flutist`; `wind_player` now also covers flute.
""")
    return "\n".join(L)

if __name__ == "__main__":
    out_sql, out_doc = sys.argv[1], sys.argv[2]
    open(out_sql, "w", encoding="utf-8").write(sql())
    open(out_doc, "w", encoding="utf-8").write(doc())
    print("person types", len(PERSON_TYPES), "instruments", len(INSTRUMENTS), "genres", len(GENRES),
          "pti rows", sum(len(p[4]) for p in PERSON_TYPES), "gl rows", sum(len(g[2]) for g in GENRES if g[2]))
    for args in [("singer", ["lyricist", "composer"], ["hi", "en"]), ("singer", ["lyricist", "dj"], ["ta"]),
                 ("producer", ["composer", "music_teacher"], [s for s, _ in LANGUAGES])]:
        i, g, ni, ng = bucket(*args)
        assert len(i) <= SCREEN_LIMIT and len(g) <= SCREEN_LIMIT
        print(args[:2], f"instruments {len(i)}/{ni}", f"genres {len(g)}/{ng}")
