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

def bucket(primary, secondary, languages):
    assert len(secondary) <= 2 and primary not in secondary
    pt = {p[0]: p for p in PERSON_TYPES}
    allowed = set().union(*(pt[r][4] for r in [primary, *secondary]))
    instruments = [s for s in ALL if s in allowed]
    genres = [g[0] for g in GENRES if g[2] is None or set(g[2]) & set(languages)]
    return instruments, genres

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
-- persona_bucket(primary, secondary[], languages[]) returns the options a profile can pick:
-- instruments = union over primary + up to 2 secondary person types;
-- genres = every universal genre + regional genres linked to any selected language.
--
-- Does not touch profiles. Reference data: public SELECT, no client write.
--
-- Rollback:
--   DROP FUNCTION public.persona_bucket(text, text[], text[]);
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
    options("instruments", [(s, l, meta({"family": f})) for s, l, f, _ in INSTRUMENTS])
    options("genres", [(g[0], g[1], meta({"scope": "universal" if g[2] is None else "regional"})) for g in GENRES])

    w("INSERT INTO public.person_type_instruments (person_type_slug, instrument_slug) VALUES")
    w(",\n".join(f"  ({q(p[0])}, {q(i)})" for p in PERSON_TYPES for i in p[4]) + ";\n")

    w("INSERT INTO public.genre_languages (genre_slug, language_slug) VALUES")
    w(",\n".join(f"  ({q(g[0])}, {q(l)})" for g in GENRES if g[2] for l in g[2]) + ";\n")

    w("""CREATE FUNCTION public.persona_bucket(
  p_primary   text,
  p_secondary text[] DEFAULT '{}',
  p_languages text[] DEFAULT '{}'
)
RETURNS TABLE (category_key text, slug text, label text, sort_order int)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $fn$
#variable_conflict use_column
DECLARE
  v_roles text[] := array_append(coalesce(p_secondary, '{}'), p_primary);
BEGIN
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

  RETURN QUERY
  SELECT o.category_key, o.slug, o.label, o.sort_order
  FROM taxonomy_options o
  WHERE o.category_key = 'instruments' AND o.is_active
    AND EXISTS (SELECT 1 FROM person_type_instruments pti
                WHERE pti.instrument_slug = o.slug AND pti.person_type_slug = ANY (v_roles))
  UNION ALL
  SELECT o.category_key, o.slug, o.label, o.sort_order
  FROM taxonomy_options o
  WHERE o.category_key = 'genres' AND o.is_active
    AND (o.metadata->>'scope' = 'universal'
         OR EXISTS (SELECT 1 FROM genre_languages gl
                    WHERE gl.genre_slug = o.slug AND gl.language_slug = ANY (coalesce(p_languages, '{}'))))
  ORDER BY 1, 4;
END
$fn$;

GRANT EXECUTE ON FUNCTION public.persona_bucket(text, text[], text[]) TO anon, authenticated;
""")
    return "\n".join(L)

# ---- doc ---------------------------------------------------------------------
def doc():
    L = []; w = L.append
    lab = {s: l for s, l, *_ in INSTRUMENTS}
    w("""---
doc: PERSONA-BUCKET
version: 0.1
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

Call: `select * from persona_bucket('singer', array['lyricist','composer'], array['hi','en']);`
""")
    w("## Languages (12)\n\n| Slug | Name |\n|---|---|")
    for s, l in LANGUAGES: w(f"| `{s}` | {l} |")
    w("\n## Business types (9)\n\n| Slug | Label |\n|---|---|")
    for s, l in BUSINESS_TYPES: w(f"| `{s}` | {l} |")
    w(f"\n## Instruments ({len(INSTRUMENTS)})\n\n| Family | Instruments |\n|---|---|")
    for f, fl in FAMILIES:
        w(f"| {fl} | " + " · ".join(l + (" *(added)*" if a else "") for s, l, ff, a in INSTRUMENTS if ff == f) + " |")
    w(f"\n## Person types ({len(PERSON_TYPES)}) → instruments\n")
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
    w(f"\n## Genres ({len(GENRES)}) → languages\n\n| Slug | Label | Scope | Languages |\n|---|---|---|---|")
    ln = dict(LANGUAGES)
    for g in GENRES:
        langs = "all" if g[2] is None else ("all Indian" if g[2] == INDIAN else " · ".join(ln[l] for l in g[2]))
        w(f"| `{g[0]}` | {g[1]}{' *(added)*' if g[3] else ''} | {'universal' if g[2] is None else 'regional'} | {langs} |")
    w("\n## Worked examples\n")
    gl = {g[0]: g[1] for g in GENRES}
    for prim, sec, langs in [("singer", ["lyricist", "composer"], ["hi", "en"]),
                             ("singer", ["lyricist", "dj"], ["ta"]),
                             ("drummer", ["folk_vocalist"], ["pa", "bho"])]:
        ins, gen = bucket(prim, sec, langs)
        w(f"**{prim} + {', '.join(sec)} · languages {' · '.join(ln[l] for l in langs)}**\n")
        w(f"- Instruments ({len(ins)}): " + ("all" if ins == ALL else ", ".join(lab[s] for s in ins)))
        reg = [gl[g] for g in gen if dict((x[0], x[2]) for x in GENRES)[g] is not None]
        w(f"- Genres ({len(gen)}): 10 universal + " + (", ".join(reg) if reg else "none regional") + "\n")
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
    for args in [("singer", ["lyricist", "composer"], ["hi", "en"]), ("singer", ["lyricist", "dj"], ["ta"])]:
        i, g = bucket(*args); print(args, len(i), "instruments", len(g), "genres")
