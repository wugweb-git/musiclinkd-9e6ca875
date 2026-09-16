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
    ("keyboard", "Keyboard", "keys", False),
    ("piano", "Piano", "keys", False),
    ("harmonium", "Harmonium", "keys", False),
    ("drums", "Drums", "percussion", False),
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
    ("dj_controller", "DJ Controller", "electronic", True),
    ("drum_machine", "Drum Machine", "electronic", True),
    ("sampler", "Sampler", "electronic", True),
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
    ("singer", "Singer", "vocal", "both", fam("guitar", "keys"), "Vedanshu, 14 Sep"),
    ("rapper", "Rapper", "vocal", "firestore", [], "none"),
    ("folk_vocalist", "Folk Vocalist", "vocal", "firestore", ["acoustic_guitar", "harmonium", "dholak"], "proposed"),
    ("voice_artist", "Voice Artist", "vocal", "app", [], "app: not asked"),
    ("musician", "Musician", "instrumentalist", "app", ALL, "app: asked"),
    ("guitarist", "Guitarist", "instrumentalist", "firestore", fam("guitar"), "label"),
    ("bassist", "Bassist", "instrumentalist", "added", ["bass_guitar", "double_bass"], "label"),
    ("keyboardist", "Keyboardist", "instrumentalist", "firestore", fam("keys"), "label"),
    ("drummer", "Drummer", "instrumentalist", "firestore", fam("percussion", plus=["drum_machine", "sampler"]), "label"),
    ("sitarist", "Sitarist", "instrumentalist", "firestore", fam("indian_string"), "label"),
    ("violinist", "Violinist", "instrumentalist", "added", fam("bowed"), "label"),
    ("flautist", "Flautist", "instrumentalist", "added", fam("wind"), "label"),
    ("composer", "Composer", "creator", "both", ALL, "app: asked"),
    ("lyricist", "Lyricist", "creator", "both", [], "app: not asked"),
    ("arranger", "Vocal Arranger", "creator", "firestore", fam("keys"), "proposed"),
    ("music_director", "Music Director", "creator", "app", [], "app: not asked"),
    ("producer", "Music Producer", "creator", "both", ALL, "app: asked"),
    ("beatmaker", "Beatmaker", "creator", "added", ["keyboard", "drum_machine", "sampler"], "proposed"),
    ("sound_engineer", "Sound Engineer", "technical", "both", [], "app: not asked"),
    ("mixing_engineer", "Mixing Engineer", "technical", "added", [], "none"),
    ("mastering_engineer", "Mastering Engineer", "technical", "added", [], "none"),
    ("sound_designer", "Sound Designer", "technical", "firestore", ["keyboard", "drum_machine", "sampler"], "proposed"),
    ("dj", "DJ", "media", "app", fam("electronic"), "proposed (no acoustic instruments)"),
    ("rj", "RJ", "media", "app", [], "app: not asked"),
    ("podcaster", "Podcaster", "media", "app", [], "app: not asked"),
    ("music_teacher", "Music Teacher", "education", "app", ALL, "app: asked"),
    # Business group = business types. Selecting any of these leads into the business flow
    # (metadata.flow = "business"). Source: app businessTypes, Firestore BusinessType / person_types.
    ("studio", "Recording Studio", "business", "both", [], "business flow"),
    ("music_label", "Music Label", "business", "both", [], "business flow"),
    ("venue", "Venue", "business", "both", [], "business flow"),
    ("event_organizer", "Event Organizer", "business", "firestore", [], "business flow"),
    ("booking_agency", "Booking Agency", "business", "both", [], "business flow"),
    ("artist_manager", "Artist Manager", "business", "firestore", [], "business flow"),
    ("production_house", "Production House", "business", "both", [], "business flow"),
    ("music_school", "Music School", "business", "both", [], "business flow"),
    ("dealer", "Dealer", "business", "both", [], "business flow"),
    ("rental_provider", "Rental Provider", "business", "both", [], "business flow"),
    ("music_publisher", "Music Publisher", "business", "firestore", [], "business flow"),
    ("a_and_r", "A&R", "business", "added", [], "business flow"),
    ("other", "Other", "other", "app", [], "app: not asked"),
]

# (slug, label, languages or None for universal, added)
GENRES = [
    ("indie_pop", "Indie Pop", None, False),
    ("rock", "Rock", None, False),
    ("metal", "Metal", None, True),
    ("hiphop", "Hip Hop", None, False),
    ("trap", "Trap", None, True),
    ("lofi", "Lofi", None, False),
    ("edm", "EDM", None, False),
    ("acoustic", "Acoustic", None, False),
    ("rnb", "R&B", None, False),
    ("jazz", "Jazz", None, False),
    ("blues", "Blues", None, True),
    ("reggae", "Reggae", None, False),
    ("fusion", "Fusion", None, True),
    ("bollywood", "Bollywood", ["hi"], False),
    ("hindustani_classical", "Hindustani Classical", ["hi", "pa", "bn", "mr", "gu", "as", "bho"], False),
    ("carnatic_classical", "Carnatic Classical", ["ta", "te", "kn", "ml"], False),
    ("sufi_devotional", "Sufi Devotional", ["hi", "pa"], False),
    ("ghazal", "Ghazal", ["hi"], False),
    ("qawwali", "Qawwali", ["hi", "pa"], False),
    ("bhajan", "Bhajan", INDIAN, True),
    ("bhangra", "Bhangra", ["pa"], False),
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
    ("garba", "Garba", ["gu"], True),
    ("bihu", "Bihu", ["as"], True),
]

# Screen cap: no picker shows more than this many options.
SCREEN_LIMIT = 12
# Genres show up to 20 per screen (owner, 15 Sep 2026); every other category keeps SCREEN_LIMIT.
# persona_bucket caps genres at GREATEST(p_limit, GENRE_SCREEN_LIMIT), so a caller passing 12 gets 20.
GENRE_SCREEN_LIMIT = 20

# Popularity order — sets sort_order, and decides which options survive the screen cap.
INSTRUMENT_RANK = [
    "acoustic_guitar", "keyboard", "piano", "electric_guitar", "drums",
    "tabla", "bass_guitar", "flute_bansuri", "violin", "harmonium", "sitar", "dholak",
    "dj_controller", "drum_machine", "sampler", "saxophone", "ukulele", "cajon", "santoor",
    "mridangam", "veena", "sarangi", "cello", "trumpet", "sarod", "shehnai", "tanpura",
    "ghatam", "kanjira", "clarinet", "nadaswaram", "mandolin", "double_bass", "viola", "harmonica",
]
GENRE_RANK = [
    # regional
    "bollywood", "punjabi_pop", "hindustani_classical", "carnatic_classical", "sufi_devotional",
    "bhajan", "ghazal", "qawwali", "bhangra", "kollywood", "tollywood",
    "mollywood", "sandalwood", "rabindra_sangeet", "lavani", "garba", "bihu",
    "bhojpuri_folk", "gaana", "baul", "natya_sangeet", "rajasthani_folk",
    # universal
    "indie_pop", "hiphop", "trap", "rock", "metal", "edm", "lofi", "acoustic",
    "fusion", "rnb", "jazz", "blues", "reggae",
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
assert not [x for x in LANGUAGES + INSTRUMENTS + PERSON_TYPES + GENRES if "/" in x[1]], "a label has a /"
assert sorted(INSTRUMENT_RANK) == sorted(ALL), "INSTRUMENT_RANK must list every instrument once"
assert sorted(GENRE_RANK) == sorted(g[0] for g in GENRES), "GENRE_RANK must list every genre once"
# Flat pickers and every person-type group must fit one screen.
assert len(LANGUAGES) <= SCREEN_LIMIT, "languages exceed a screen"
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
    return ins[:limit], gen[:max(limit, GENRE_SCREEN_LIMIT)], len(ins), len(gen)

def q(s):
    return "'" + s.replace("'", "''") + "'"

def meta(d):
    import json
    return q(json.dumps(d, ensure_ascii=False)) + "::jsonb"

PERSONA_BUCKET_FUNCTION = """@CREATE@ public.persona_bucket(
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
                      JOIN taxonomy_categories c ON c.key = o.category_key AND c.is_published
                      WHERE o.category_key = 'person_types' AND o.slug = r AND o.is_published)
  ) THEN
    RAISE EXCEPTION 'persona_bucket: unknown or unpublished person type in %', v_roles;
  END IF;

  -- tier 0 ranks first: instruments the primary person type allows; regional genres a selected
  -- language unlocks. Within a tier, sort_order (popularity). Instruments are capped at p_limit,
  -- genres at GREATEST(p_limit, @GENRE_LIMIT@).
  RETURN QUERY
  WITH candidates AS (
    SELECT o.category_key AS cat, o.slug AS opt_slug, o.label AS opt_label, o.sort_order AS rank_order,
           CASE WHEN EXISTS (SELECT 1 FROM person_type_instruments p0
                             WHERE p0.instrument_slug = o.slug AND p0.person_type_slug = p_primary)
                THEN 0 ELSE 1 END AS tier
    FROM taxonomy_options o
    JOIN taxonomy_categories c ON c.key = o.category_key AND c.is_published
    WHERE o.category_key = 'instruments' AND o.is_published
      AND EXISTS (SELECT 1 FROM person_type_instruments pti
                  WHERE pti.instrument_slug = o.slug AND pti.person_type_slug = ANY (v_roles))
    UNION ALL
    SELECT o.category_key, o.slug, o.label, o.sort_order,
           CASE WHEN o.metadata->>'scope' = 'regional' THEN 0 ELSE 1 END
    FROM taxonomy_options o
    JOIN taxonomy_categories c ON c.key = o.category_key AND c.is_published
    WHERE o.category_key = 'genres' AND o.is_published
      AND (o.metadata->>'scope' = 'universal'
           OR EXISTS (SELECT 1 FROM genre_languages gl
                      JOIN taxonomy_options lo ON lo.category_key = 'languages' AND lo.slug = gl.language_slug
                      WHERE gl.genre_slug = o.slug AND lo.is_published
                        AND gl.language_slug = ANY (coalesce(p_languages, '{}'))))
  ),
  ranked AS (
    SELECT c.*, (row_number() OVER (PARTITION BY c.cat ORDER BY c.tier, c.rank_order))::int AS rn
    FROM candidates c
  )
  SELECT r.cat, r.opt_slug, r.opt_label, r.rn
  FROM ranked r
  WHERE r.rn <= CASE WHEN r.cat = 'genres' THEN GREATEST(p_limit, @GENRE_LIMIT@) ELSE p_limit END
  ORDER BY r.cat, r.rn;
END
$fn$;

GRANT EXECUTE ON FUNCTION public.persona_bucket(text, text[], text[], int) TO anon, authenticated;
"""


def persona_bucket_function(create="CREATE FUNCTION"):
    """persona_bucket() and its grant. 20260915110000 ships the same body with CREATE OR REPLACE FUNCTION."""
    return (PERSONA_BUCKET_FUNCTION.replace("@CREATE@", create, 1)
            .replace("@GENRE_LIMIT@", str(GENRE_SCREEN_LIMIT)))


# ---- SQL ---------------------------------------------------------------------
def sql():
    L = []
    w = L.append
    w(f"""-- Taxonomy reference data and the persona bucket.
--
-- Generated by supabase/generators/taxonomy_persona_bucket.py, which also writes
-- Claude outputs/specs/PERSONA-BUCKET.md. Edit the data there and regenerate, not this file.
-- Shape follows specs/TAXONOMY-MIGRATION-SPEC.md §5: options keyed by stable slug, never by
-- display string.
--
-- Categories: languages (12, native-script labels, ISO 639-1 slugs; Bhojpuri ISO 639-3 `bho`),
-- person_types ({len(PERSON_TYPES)}, metadata.group; metadata.flow = business for the 12 business types, talent
-- otherwise), instruments ({len(INSTRUMENTS)}, metadata.family), genres ({len(GENRES)}, metadata.scope universal | regional).
--
-- Option labels are single names, no "/" (owner, 15 Sep 2026). A database created before then is moved
-- to these slugs by 20260915110000_taxonomy_single_names_and_options.sql.
--
-- Publish / unpublish: is_published on categories and options. Clients only ever see published
-- rows (RLS); an unpublished category hides all its options; persona_bucket skips unpublished
-- options and rejects unpublished person types. Toggle with service_role, e.g.
--   UPDATE public.taxonomy_options SET is_published = false
--   WHERE category_key = 'instruments' AND slug = 'harmonica';
--
-- Rules: person_type_instruments (which instruments a person type can hold) and genre_languages
-- (which languages unlock a regional genre). Both reference taxonomy_options by foreign key.
--
-- persona_bucket(primary, secondary[], languages[], limit) returns the options a profile can pick:
-- instruments = union over primary + up to 2 secondary person types, primary's first;
-- genres = regional genres linked to any selected language first, then universal genres.
-- Instruments are capped at limit (default 12); genres at GREATEST(limit, 20) (owner, 15 Sep 2026:
-- up to 20 genres per screen), so no picker screen exceeds its cap.
-- sort_order on instruments and genres is popularity, which decides what survives the cap.
--
-- Does not touch profiles. Reference data: public SELECT of published rows, no client write.
--
-- Rollback:
--   DROP FUNCTION public.persona_bucket(text, text[], text[], int);
--   DROP TABLE public.genre_languages, public.person_type_instruments,
--              public.taxonomy_options, public.taxonomy_categories;
--   DROP FUNCTION public.taxonomy_touch_updated_at();

CREATE TABLE public.taxonomy_categories (
  key         text PRIMARY KEY,
  label       text NOT NULL,
  description text NOT NULL DEFAULT '',
  is_published boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.taxonomy_options (
  category_key text NOT NULL REFERENCES public.taxonomy_categories(key) ON DELETE CASCADE,
  slug         text NOT NULL,
  label        text NOT NULL,
  sort_order   int  NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  metadata     jsonb,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (category_key, slug)
);

CREATE INDEX taxonomy_options_published_sort_idx
  ON public.taxonomy_options (category_key, sort_order) WHERE is_published;

CREATE FUNCTION public.taxonomy_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $fn$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END
$fn$;

CREATE TRIGGER taxonomy_categories_touch_updated_at
  BEFORE UPDATE ON public.taxonomy_categories
  FOR EACH ROW EXECUTE FUNCTION public.taxonomy_touch_updated_at();
CREATE TRIGGER taxonomy_options_touch_updated_at
  BEFORE UPDATE ON public.taxonomy_options
  FOR EACH ROW EXECUTE FUNCTION public.taxonomy_touch_updated_at();

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

CREATE POLICY "Published taxonomy categories are readable by everyone"
  ON public.taxonomy_categories FOR SELECT USING (is_published);
CREATE POLICY "Published taxonomy options are readable by everyone"
  ON public.taxonomy_options FOR SELECT USING (
    is_published
    AND EXISTS (SELECT 1 FROM public.taxonomy_categories c
                WHERE c.key = taxonomy_options.category_key AND c.is_published)
  );
CREATE POLICY "Person type instruments are readable by everyone"
  ON public.person_type_instruments FOR SELECT USING (true);
CREATE POLICY "Genre languages are readable by everyone"
  ON public.genre_languages FOR SELECT USING (true);
""")
    w("INSERT INTO public.taxonomy_categories (key, label, description) VALUES")
    cats = [
        ("languages", "Languages", "Languages a person performs or writes in."),
        ("person_types", "Person Types", "Primary and secondary roles a person selects; the business group leads into the business flow."),
        ("instruments", "Instruments", "Instruments a person plays."),
        ("genres", "Genres", "Genres a person works in."),
    ]
    w(",\n".join(f"  ({q(k)}, {q(l)}, {q(d)})" for k, l, d in cats) + ";\n")

    def options(cat, rows):
        w(f"INSERT INTO public.taxonomy_options (category_key, slug, label, sort_order, metadata) VALUES")
        w(",\n".join(f"  ({q(cat)}, {q(s)}, {q(l)}, {i}, {m})" for i, (s, l, m) in enumerate(rows, 1)) + ";\n")

    options("languages", [(s, l, "NULL") for s, l in LANGUAGES])
    options("person_types", [(p[0], p[1], meta({"group": p[2], "flow": "business" if p[2] == "business" else "talent"}))
                             for p in PERSON_TYPES])
    by_ins = {s: (s, l, f) for s, l, f, _ in INSTRUMENTS}
    options("instruments", [(s, l, meta({"family": f})) for s, l, f in (by_ins[x] for x in INSTRUMENT_RANK)])
    by_gen = {g[0]: g for g in GENRES}
    options("genres", [(g[0], g[1], meta({"scope": "universal" if g[2] is None else "regional"}))
                       for g in (by_gen[x] for x in GENRE_RANK)])

    w("INSERT INTO public.person_type_instruments (person_type_slug, instrument_slug) VALUES")
    w(",\n".join(f"  ({q(p[0])}, {q(i)})" for p in PERSON_TYPES for i in p[4]) + ";\n")

    w("INSERT INTO public.genre_languages (genre_slug, language_slug) VALUES")
    w(",\n".join(f"  ({q(g[0])}, {q(l)})" for g in GENRES if g[2] for l in g[2]) + ";\n")

    w(persona_bucket_function("CREATE FUNCTION"))
    return "\n".join(L)

# ---- doc ---------------------------------------------------------------------
def doc():
    L = []; w = L.append
    lab = {s: l for s, l, *_ in INSTRUMENTS}
    w("""---
doc: PERSONA-BUCKET
version: 0.3
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
""")
    w("## Languages (12)\n\n| Slug | Name |\n|---|---|")
    for s, l in LANGUAGES: w(f"| `{s}` | {l} |")
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
- Labels are single names (owner, 15 Sep 2026): Firestore's combined labels were split or shortened, and
  flute sits only under Flautist (`flautist`, formerly `wind_player`), which still holds every wind instrument.
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
        assert len(i) <= SCREEN_LIMIT and len(g) <= GENRE_SCREEN_LIMIT
        print(args[:2], f"instruments {len(i)}/{ni}", f"genres {len(g)}/{ng}")
