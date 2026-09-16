"""Generates the migration that gives taxonomy options single names and adds the app's option lists.

Usage (repo root):
  bun run supabase/generators/export_app_options.ts > /tmp/app-options.json
  python3 supabase/generators/taxonomy_single_names.py /tmp/app-options.json <out.sql>

Part A moves a database created before 15 Sep 2026 to the slugs and labels in taxonomy_persona_bucket.py
and taxonomy_renames.py. Part B loads option categories from the app's own copy (src/data/*.ts).
"""
from __future__ import annotations

import json
import re
import sys

import taxonomy_persona_bucket as tpb
from taxonomy_renames import ADDED, OLD_LABELS, REMOVED_INSTRUMENT_MAPPINGS, RENAMES, SEED_LABELS, TEXT

APP, OUT = sys.argv[1:3]
app = json.load(open(APP, encoding="utf-8"))
SCREEN_LIMIT = tpb.SCREEN_LIMIT

# ---- Part A: target state of the renamed categories ------------------------------------------------
by_ins = {s: (s, l, f) for s, l, f, _ in tpb.INSTRUMENTS}
by_gen = {g[0]: g for g in tpb.GENRES}
target_options = (
    [{"category_key": "person_types", "slug": p[0], "label": p[1], "sort_order": i,
      "metadata": {"group": p[2], "flow": "business" if p[2] == "business" else "talent"}}
     for i, p in enumerate(tpb.PERSON_TYPES, 1)]
    + [{"category_key": "instruments", "slug": s, "label": l, "sort_order": i, "metadata": {"family": f}}
       for i, (s, l, f) in enumerate((by_ins[x] for x in tpb.INSTRUMENT_RANK), 1)]
    + [{"category_key": "genres", "slug": g[0], "label": g[1], "sort_order": i,
        "metadata": {"scope": "universal" if g[2] is None else "regional"}}
       for i, g in enumerate((by_gen[x] for x in tpb.GENRE_RANK), 1)]
)
FULL = ("person_types", "instruments", "genres")  # categories whose whole option set is checked
# verification_id_type: only the split option and its new half; the category's other options stay.
split_options = [
    {"category_key": "verification_id_type", "slug": "company_pan", "label": SEED_LABELS[("verification_id_type", "company_pan")],
     "sort_order": 4, "metadata": None},
    {"category_key": "verification_id_type", "slug": "company_gstin", "label": "GSTIN", "sort_order": 5, "metadata": None},
]
expected_pti = [{"person_type_slug": p[0], "instrument_slug": i} for p in tpb.PERSON_TYPES for i in p[4]]
expected_gl = [{"genre_slug": g[0], "language_slug": l} for g in tpb.GENRES if g[2] for l in g[2]]

renames = [{"category_key": c, "old": o, "new": n} for c, m in RENAMES.items() for o, n in m.items()]
added = [{"category_key": c, "slug": s, "label": l, "parent": p} for c, s, l, p in ADDED]
text_fixes = [{"table": t, "column": col, "old": o, "new": n}
              for t, cols in TEXT.items() for col, m in cols.items() for o, n in m.items()]

# The data files and the rename table agree.
have = {(o["category_key"], o["slug"]) for o in target_options + split_options}
for r in renames:
    assert (r["category_key"], r["new"]) in have, r
    assert (r["category_key"], r["old"]) not in have, r
for a in added:
    assert (a["category_key"], a["slug"]) in have and (a["category_key"], a["parent"]) in have, a
pti = {(r["person_type_slug"], r["instrument_slug"]) for r in expected_pti}
for pt, ins in REMOVED_INSTRUMENT_MAPPINGS:
    assert (pt, ins) not in pti, (pt, ins)
assert ("flautist", "flute_bansuri") in pti
for a in added:  # an added option holds exactly its parent's rules
    if a["category_key"] == "instruments":
        assert {p for p, i in pti if i == a["slug"]} == {p for p, i in pti if i == a["parent"]}, a
    if a["category_key"] == "genres":
        gl = {(r["genre_slug"], r["language_slug"]) for r in expected_gl}
        assert {l for g, l in gl if g == a["slug"]} == {l for g, l in gl if g == a["parent"]}, a
assert not [o for o in target_options + split_options if "/" in o["label"]]
# Each old combined label's single name (text rule, 20260915140000) is the label of a current option.
assert set(OLD_LABELS.values()) <= {o["label"] for o in target_options + split_options}, \
    set(OLD_LABELS.values()) - {o["label"] for o in target_options + split_options}

# ---- Part B: option categories from the app's copy -------------------------------------------------


def slugify(s: str) -> str:
    return re.sub(r"_+", "_", re.sub(r"[^a-z0-9]+", "_", s.lower().replace("&", "and"))).strip("_")


# App labels that carry a "/": the single name used instead.
LABEL = {("work_types", "album"): "Album", ("work_modes", "touring"): "Touring"}

# Simple Icons (CC0), simple-icons v13 as in src/components/ml/brand-icons.tsx. LinkedIn is in v13 and
# was removed in later releases. JioSaavn is not offered: it has no brand icon (owner, 15 Sep 2026).
PLATFORMS = [  # (slug, label, icon, brand colour, placeholder)
    ("website", "Website", None, None, None),
    ("instagram", "Instagram", "instagram", "#FF0069", None),
    ("youtube", "YouTube", "youtube", "#FF0000", None),
    ("spotify", "Spotify", "spotify", "#1ED760", None),
    ("soundcloud", "SoundCloud", "soundcloud", "#FF5500", None),
    ("apple_music", "Apple Music", "applemusic", "#FA243C", "https://music.apple.com/in/artist/..."),
    ("bandcamp", "Bandcamp", "bandcamp", "#408294", "https://yourname.bandcamp.com"),
    ("facebook", "Facebook", "facebook", "#0866FF", "https://facebook.com/username"),
    ("x", "X", "x", "#000000", "https://x.com/username"),
    ("linkedin", "LinkedIn", "linkedin", "#0A66C2", "https://linkedin.com/in/username"),
]

REMOVED_PLATFORMS = ["jiosaavn"]
assert not {p[0] for p in PLATFORMS} & set(REMOVED_PLATFORMS)
app_links = {p["key"]: p for p in app["linkPlatforms"]}
assert set(app_links) <= {p[0] for p in PLATFORMS}, "the app has a link platform this list lacks"

CATEGORIES = [
    ("verification_types", "Verification Types",
     "Verification badges a profile can apply for. metadata.description is the app's blurb.",
     [{"slug": v["key"], "label": v["title"], "metadata": {"app_key": v["key"], "description": v["blurb"]}}
      for v in app["verificationTypes"]]),
    ("work_types", "Work Types",
     "Kinds of work added to a portfolio (Add work). metadata.app_key is the portfolio_items.kind the app writes; "
     "metadata.media is what the work carries.",
     [{"slug": slugify(w["kind"]), "label": w["label"],
       "metadata": {"app_key": w["kind"], "media": w["media"], "description": w["blurb"]}} for w in app["workTypes"]]),
    ("profile_visibility", "Profile Visibility",
     "Who can see your profile. metadata.app_key is the profiles.visibility value.",
     [{"slug": v["key"], "label": v["label"], "metadata": {"app_key": v["key"], "description": v["hint"]}}
      for v in app["visibilityOptions"]]),
    ("link_platforms", "Link Platforms",
     "External links on a profile. metadata.app_key is the profiles.links key the app writes (absent when the app "
     "does not offer the platform yet); icon is a Simple Icons slug, brand_color its hex, placeholder an example URL.",
     [{"slug": s, "label": l, "metadata": {
         **({"app_key": s} if s in app_links else {}), "icon": icon, "brand_color": colour,
         "placeholder": app_links[s]["placeholder"] if s in app_links else placeholder}}
      for s, l, icon, colour, placeholder in PLATFORMS]),
    ("intents", "Intents",
     "What brings a person to MusicLinkd. metadata.app_key is the profiles.intents value the app writes.",
     [{"slug": slugify(v), "label": v, "metadata": {"app_key": v}} for v in app["intents"]]),
    ("work_modes", "Work Modes",
     "How a person works. metadata.app_key is the profiles.work_modes value the app writes.",
     [{"slug": slugify(w["key"]), "label": w["label"], "metadata": {"app_key": w["key"], "description": w["hint"]}}
      for w in app["workModes"]]),
    ("available_for", "Available For",
     "What a person is available for. metadata.app_key is the profiles.availability value the app writes.",
     [{"slug": slugify(v), "label": v, "metadata": {"app_key": v}} for v in app["availabilityFor"]]),
    ("service_categories", "Service Categories",
     "What a service offers. metadata.app_key is the app's service category key.",
     [{"slug": slugify(c["key"]), "label": c["label"], "metadata": {"app_key": c["key"]}}
      for c in app["serviceCategories"]]),
    ("pricing_models", "Pricing Models",
     "How a service is priced. metadata.app_key is the app's pricing model key.",
     [{"slug": slugify(k), "label": v, "metadata": {"app_key": k}} for k, v in app["pricingModelLabel"].items()]),
]

new_categories, new_options = [], []
for key, label, description, options in CATEGORIES:
    assert "/" not in label and 1 <= len(options) <= SCREEN_LIMIT, key
    new_categories.append({"key": key, "label": label, "description": description})
    for i, o in enumerate(options, 1):
        o = {"category_key": key, **o, "sort_order": i}
        o["label"] = LABEL.get((key, o["slug"]), o["label"])
        assert re.fullmatch(r"[a-z0-9]+(_[a-z0-9]+)*", o["slug"]), o
        assert "/" not in o["label"], o
        new_options.append(o)
    slugs = [o["slug"] for o in options]
    assert len(slugs) == len(set(slugs)), key
assert not {"languages", "person_types", "instruments", "genres", "verification_id_type"} & {c["key"] for c in new_categories}

# ---- reference columns --------------------------------------------------------------------------
# (table, column, kind, category, extra). kinds: array (text[]), text (whole value), prefix
# ("<slug>:<label>" in text[]), json_text / json_array / json_keys (a key inside a jsonb column).
REFS = [
    ("profiles", "roles", "array", "person_types", None),
    ("profiles", "instruments", "array", "instruments", None),
    ("profiles", "genres", "array", "genres", None),
    ("profiles", "specialisations", "prefix", "person_types", None),
    ("profiles", "headline", "text", "person_types", None),  # onboarding writes the primary role slug
    ("profiles", "discovery_prefs", "json_keys", "instruments", "instrumentExperience"),
    ("profiles", "onboarding_draft", "json_text", "person_types", "primaryRole"),
    ("profiles", "onboarding_draft", "json_array", "person_types", "secondaryRoles"),
    ("profiles", "onboarding_draft", "json_keys", "person_types", "specialisation"),
    ("profiles", "onboarding_draft", "json_text", "instruments", "primaryInstrument"),
    ("profiles", "onboarding_draft", "json_array", "instruments", "instruments"),
    ("profiles", "onboarding_draft", "json_keys", "instruments", "instrumentExperience"),
    ("profiles", "onboarding_draft", "json_array", "genres", "genres"),
    ("profile_role_details", "details", "json_text", "instruments", "primary_instrument"),
    ("profile_role_details", "details", "json_array", "instruments", "secondary_instruments"),
    ("opportunities", "genres", "array", "genres", None),
]
TOUCHES_UPDATED_AT = {"profile_role_details", "opportunities", "marketplace_listings"}  # no trigger sets it


def m(category):
    return f"v_renames->'{category}'"


def olds(category):
    return f"ARRAY(SELECT jsonb_object_keys({m(category)}))"


def dedupe_text_array(source, element):
    """text[] with each element mapped, repeats dropped, first position kept."""
    return (f"(SELECT coalesce(array_agg(d.v ORDER BY d.o), '{{}}') FROM (SELECT DISTINCT ON (y.v) y.v, u.o "
            f"FROM unnest({source}) WITH ORDINALITY AS u(x, o) CROSS JOIN LATERAL (SELECT {element} AS v) y "
            f"ORDER BY y.v, u.o) d)")


def ref_sql(table, column, kind, category, key):
    """(UPDATE statement, condition that a row still holds an old slug)."""
    col = f"t.{column}"
    stamp = ", updated_at = now()" if table in TOUCHES_UPDATED_AT else ""
    if kind == "array":
        cond = f"{col} && {olds(category)}"
        new = dedupe_text_array(col, f"coalesce({m(category)}->>u.x, u.x)")
    elif kind == "prefix":
        cond = (f"EXISTS (SELECT 1 FROM unnest({col}) AS s(x) WHERE position(':' in s.x) > 1 "
                f"AND {m(category)} ? split_part(s.x, ':', 1))")
        new = dedupe_text_array(col, f"CASE WHEN position(':' in u.x) > 1 AND {m(category)} ? split_part(u.x, ':', 1) "
                                     f"THEN ({m(category)}->>split_part(u.x, ':', 1)) || substr(u.x, position(':' in u.x)) "
                                     f"ELSE u.x END")
    elif kind == "text":
        cond = f"{col} = ANY ({olds(category)})"
        new = f"{m(category)}->>{col}"
    elif kind == "json_text":
        cond = f"jsonb_typeof({col}->'{key}') = 'string' AND {m(category)} ? ({col}->>'{key}')"
        new = f"jsonb_set({col}, '{{{key}}}', to_jsonb({m(category)}->>({col}->>'{key}')))"
    elif kind == "json_array":
        cond = f"jsonb_typeof({col}->'{key}') = 'array' AND {col}->'{key}' ?| {olds(category)}"
        new = (f"jsonb_set({col}, '{{{key}}}', (SELECT coalesce(jsonb_agg(d.v ORDER BY d.o), '[]') FROM "
               f"(SELECT DISTINCT ON (y.v) y.v, e.o FROM jsonb_array_elements({col}->'{key}') WITH ORDINALITY AS e(x, o) "
               f"CROSS JOIN LATERAL (SELECT CASE WHEN jsonb_typeof(e.x) = 'string' AND {m(category)} ? (e.x #>> '{{}}') "
               f"THEN to_jsonb({m(category)}->>(e.x #>> '{{}}')) ELSE e.x END AS v) y ORDER BY y.v, e.o) d))")
    elif kind == "json_keys":
        # On a clash (old and new key both present) the value already under the new key is kept.
        cond = f"jsonb_typeof({col}->'{key}') = 'object' AND {col}->'{key}' ?| {olds(category)}"
        new = (f"jsonb_set({col}, '{{{key}}}', (SELECT coalesce(jsonb_object_agg(d.k, d.v), '{{}}') FROM "
               f"(SELECT DISTINCT ON (coalesce({m(category)}->>j.key, j.key)) coalesce({m(category)}->>j.key, j.key) AS k, "
               f"j.value AS v FROM jsonb_each({col}->'{key}') AS j "
               f"ORDER BY coalesce({m(category)}->>j.key, j.key), {m(category)} ? j.key) d))")
    else:
        raise ValueError(kind)
    return f"  UPDATE public.{table} t SET {column} = {new}{stamp}\n  WHERE {cond};", cond


def payload(rows):
    text = json.dumps(rows, ensure_ascii=False, separators=(",", ":"))
    assert "$json$" not in text
    return f"$json${text}$json$"


renames_obj = {c: dict(mp) for c, mp in RENAMES.items()}

# ---- SQL ---------------------------------------------------------------------------------------------
L: list[str] = []
w = L.append

rename_lines = "\n".join(
    f"--   {c:<21} " + " · ".join(f"{o} → {n}" for o, n in mp.items()) for c, mp in RENAMES.items())
added_lines = " · ".join(f"{s} “{l}” ({c}, after {p})" for c, s, l, p in ADDED)
w(f"""-- Taxonomy: single option names, and the app's option lists as taxonomy categories.
--
-- Generated by supabase/generators/taxonomy_single_names.py from taxonomy_persona_bucket.py,
-- taxonomy_renames.py and the app's copy (supabase/generators/export_app_options.ts). Edit those and
-- regenerate, not this file.
--
-- Part A — no "/" in any option label (owner, 15 Sep 2026). Ids are renamed to match ("rename ids") and
-- every stored reference moves with them:
{rename_lines}
-- New options, placed after their parent with the parent's rules and publish state: {added_lines}.
-- verification_id_type: company_pan “Company PAN”, company_gstin “GSTIN”. person_types, instruments and
-- genres take every label, sort order and metadata from taxonomy_persona_bucket.py (single names; sort
-- orders shift where an option was added). Flute is only under Flautist: sitarist loses flute_bansuri.
-- Imported text: {"; ".join(f"{f['table']}.{f['column']} “{f['old']}” → “{f['new']}”" for f in text_fixes)}.
--
-- References updated: profiles.roles, .instruments, .genres (text[]); profiles.specialisations
-- ("<role slug>:<label>"); profiles.headline (onboarding stores the primary role slug there);
-- profiles.discovery_prefs.instrumentExperience keys; profiles.onboarding_draft primaryRole,
-- secondaryRoles, specialisation keys, primaryInstrument, instruments, instrumentExperience keys, genres;
-- profile_role_details.role_slug, details.primary_instrument, details.secondary_instruments;
-- opportunities.genres; marketplace_listings.item_category (instrument items); person_type_instruments;
-- genre_languages. Arrays keep their order and drop a repeat. No table stores verification_id_type
-- slugs, so company_pan_gstin has no references to move.
--
-- Part B — published option categories from the app's copy, each at most {SCREEN_LIMIT} options:
-- {", ".join(f"{c['key']} ({sum(o['category_key'] == c['key'] for o in new_options)})" for c in new_categories)}.
-- metadata.app_key holds the value the app writes today, so an option maps to stored profile values
-- without changing them. Labels with a "/" in the app use a single name: Album (app "Album / EP"),
-- Touring (app "Travel / touring"). link_platforms has no JioSaavn (no brand icon; owner, 15 Sep 2026):
-- a jiosaavn option is removed and sort orders stay 1..n.
--
-- persona_bucket: genres are capped at GREATEST(p_limit, {tpb.GENRE_SCREEN_LIMIT}) (owner, 15 Sep 2026: up to
-- {tpb.GENRE_SCREEN_LIMIT} genres per screen); instruments stay at p_limit. Same signature, so the app's call with
-- p_limit 12 now gets up to {tpb.GENRE_SCREEN_LIMIT} genres. The function body is taxonomy_persona_bucket.py's.
--
-- Stops before writing if a new slug is already taken in its category. Each block re-reads what it
-- wrote and raises on any difference; the last block asserts that no option label and none of the fixed
-- text columns contains "/", and that no old slug remains anywhere above. Idempotent: on a database
-- already at the new slugs (for example one built from the regenerated earlier migrations) it changes
-- nothing.
--
-- Rollback: not automatic. Re-running the previous versions of the generators restores the old
-- taxonomy rows; stored references would need the renames applied in reverse, and the Part B
-- categories deleted (DELETE FROM public.taxonomy_categories WHERE key IN (...) cascades to options).
""")

w(f"""-- 1. Stop if a new slug is already taken
DO $guard$
DECLARE
  v_renames jsonb := {payload(renames)};
  v_added jsonb := {payload(added)};
  v_clash text;
BEGIN
  SELECT string_agg(r.category_key || '.' || r.old || ' → ' || r.new, ', ') INTO v_clash
  FROM jsonb_to_recordset(v_renames) AS r(category_key text, old text, new text)
  WHERE EXISTS (SELECT 1 FROM public.taxonomy_options o WHERE o.category_key = r.category_key AND o.slug = r.old)
    AND EXISTS (SELECT 1 FROM public.taxonomy_options o WHERE o.category_key = r.category_key AND o.slug = r.new);
  IF v_clash IS NOT NULL THEN
    RAISE EXCEPTION 'taxonomy rename: new slug already exists beside the old one: %', v_clash;
  END IF;

  -- An added option must not exist yet while its parent still has its old slug.
  SELECT string_agg(a.category_key || '.' || a.slug, ', ') INTO v_clash
  FROM jsonb_to_recordset(v_added) AS a(category_key text, slug text, label text, parent text)
  JOIN jsonb_to_recordset(v_renames) AS r(category_key text, old text, new text)
    ON r.category_key = a.category_key AND r.new = a.parent
  WHERE EXISTS (SELECT 1 FROM public.taxonomy_options o WHERE o.category_key = r.category_key AND o.slug = r.old)
    AND EXISTS (SELECT 1 FROM public.taxonomy_options o WHERE o.category_key = a.category_key AND o.slug = a.slug);
  IF v_clash IS NOT NULL THEN
    RAISE EXCEPTION 'taxonomy rename: added slug already exists: %', v_clash;
  END IF;
END
$guard$;
""")

remove_pairs = ", ".join(f"('{p}', '{i}')" for p, i in REMOVED_INSTRUMENT_MAPPINGS)
w(f"""-- 2. Rename options, move their rules, add the split-out options, set labels and order
DO $rename$
DECLARE
  v_renames jsonb := {payload(renames)};
  v_added jsonb := {payload(added)};
  v_options jsonb := {payload(target_options + split_options)};
  a record;
BEGIN
  -- New row per renamed option, carrying the old row's publish state and creation time.
  INSERT INTO public.taxonomy_options (category_key, slug, label, sort_order, is_published, metadata, created_at)
  SELECT o.category_key, r.new, o.label, o.sort_order, o.is_published, o.metadata, o.created_at
  FROM jsonb_to_recordset(v_renames) AS r(category_key text, old text, new text)
  JOIN public.taxonomy_options o ON o.category_key = r.category_key AND o.slug = r.old
  ON CONFLICT (category_key, slug) DO NOTHING;

  INSERT INTO public.person_type_instruments (person_type_slug, instrument_slug)
  SELECT coalesce(rp.new, p.person_type_slug), coalesce(ri.new, p.instrument_slug)
  FROM public.person_type_instruments p
  LEFT JOIN jsonb_to_recordset(v_renames) AS rp(category_key text, old text, new text)
    ON rp.category_key = 'person_types' AND rp.old = p.person_type_slug
  LEFT JOIN jsonb_to_recordset(v_renames) AS ri(category_key text, old text, new text)
    ON ri.category_key = 'instruments' AND ri.old = p.instrument_slug
  WHERE rp.old IS NOT NULL OR ri.old IS NOT NULL
  ON CONFLICT (person_type_slug, instrument_slug) DO NOTHING;

  INSERT INTO public.genre_languages (genre_slug, language_slug)
  SELECT r.new, g.language_slug
  FROM public.genre_languages g
  JOIN jsonb_to_recordset(v_renames) AS r(category_key text, old text, new text)
    ON r.category_key = 'genres' AND r.old = g.genre_slug
  ON CONFLICT (genre_slug, language_slug) DO NOTHING;

  -- Old rows go; their rule rows were copied above and cascade with them.
  DELETE FROM public.taxonomy_options o
  USING jsonb_to_recordset(v_renames) AS r(category_key text, old text, new text)
  WHERE o.category_key = r.category_key AND o.slug = r.old;

  -- Split-out options: created once, with the parent's publish state and rules.
  FOR a IN SELECT * FROM jsonb_to_recordset(v_added) AS x(category_key text, slug text, label text, parent text) LOOP
    INSERT INTO public.taxonomy_options (category_key, slug, label, sort_order, is_published, metadata)
    SELECT p.category_key, a.slug, a.label, p.sort_order, p.is_published, p.metadata
    FROM public.taxonomy_options p
    WHERE p.category_key = a.category_key AND p.slug = a.parent
    ON CONFLICT (category_key, slug) DO NOTHING;
    IF FOUND THEN
      IF a.category_key = 'instruments' THEN
        INSERT INTO public.person_type_instruments (person_type_slug, instrument_slug)
        SELECT p.person_type_slug, a.slug FROM public.person_type_instruments p WHERE p.instrument_slug = a.parent
        ON CONFLICT (person_type_slug, instrument_slug) DO NOTHING;
      ELSIF a.category_key = 'genres' THEN
        INSERT INTO public.genre_languages (genre_slug, language_slug)
        SELECT a.slug, g.language_slug FROM public.genre_languages g WHERE g.genre_slug = a.parent
        ON CONFLICT (genre_slug, language_slug) DO NOTHING;
      END IF;
    END IF;
  END LOOP;

  DELETE FROM public.person_type_instruments
  WHERE (person_type_slug, instrument_slug) IN ({remove_pairs});

  UPDATE public.taxonomy_options o SET label = r.label, sort_order = r.sort_order, metadata = r.metadata
  FROM jsonb_to_recordset(v_options) AS r(category_key text, slug text, label text, sort_order int, metadata jsonb)
  WHERE o.category_key = r.category_key AND o.slug = r.slug
    AND (o.label, o.sort_order, o.metadata) IS DISTINCT FROM (r.label, r.sort_order, r.metadata);

  IF (SELECT count(*) FROM jsonb_to_recordset(v_options) AS r(category_key text, slug text, label text, sort_order int, metadata jsonb)
      JOIN public.taxonomy_options o ON o.category_key = r.category_key AND o.slug = r.slug
      WHERE (o.label, o.sort_order, o.metadata) IS NOT DISTINCT FROM (r.label, r.sort_order, r.metadata))
     <> jsonb_array_length(v_options) THEN
    RAISE EXCEPTION 'taxonomy rename: stored options differ from the payload';
  END IF;
END
$rename$;
""")

w(f"""-- 3. Option categories from the app's copy ({len(new_categories)} categories, {len(new_options)} options)
DO $import$
DECLARE
  v_categories jsonb := {payload(new_categories)};
  v_options jsonb := {payload(new_options)};
BEGIN
  INSERT INTO public.taxonomy_categories (key, label, description)
  SELECT r.key, r.label, r.description FROM jsonb_to_recordset(v_categories) AS r(key text, label text, description text)
  ON CONFLICT (key) DO UPDATE SET label = EXCLUDED.label, description = EXCLUDED.description
  WHERE (taxonomy_categories.label, taxonomy_categories.description) IS DISTINCT FROM (EXCLUDED.label, EXCLUDED.description);

  -- Platforms no longer offered.
  DELETE FROM public.taxonomy_options
  WHERE category_key = 'link_platforms' AND slug IN ({", ".join(f"'{x}'" for x in REMOVED_PLATFORMS)});

  INSERT INTO public.taxonomy_options (category_key, slug, label, sort_order, metadata)
  SELECT r.category_key, r.slug, r.label, r.sort_order, r.metadata
  FROM jsonb_to_recordset(v_options) AS r(category_key text, slug text, label text, sort_order int, metadata jsonb)
  ON CONFLICT (category_key, slug) DO UPDATE SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order,
    metadata = EXCLUDED.metadata
  WHERE (taxonomy_options.label, taxonomy_options.sort_order, taxonomy_options.metadata)
        IS DISTINCT FROM (EXCLUDED.label, EXCLUDED.sort_order, EXCLUDED.metadata);

  IF (SELECT count(*) FROM jsonb_to_recordset(v_categories) AS r(key text, label text, description text)
      JOIN public.taxonomy_categories c ON c.key = r.key
      WHERE (c.label, c.description) IS NOT DISTINCT FROM (r.label, r.description))
     <> jsonb_array_length(v_categories) THEN
    RAISE EXCEPTION 'taxonomy categories import: stored rows differ from the payload';
  END IF;
  IF (SELECT count(*) FROM jsonb_to_recordset(v_options) AS r(category_key text, slug text, label text, sort_order int, metadata jsonb)
      JOIN public.taxonomy_options o ON o.category_key = r.category_key AND o.slug = r.slug
      WHERE (o.label, o.sort_order, o.metadata) IS NOT DISTINCT FROM (r.label, r.sort_order, r.metadata))
     <> jsonb_array_length(v_options) THEN
    RAISE EXCEPTION 'taxonomy options import: stored rows differ from the payload';
  END IF;
  IF EXISTS (SELECT 1 FROM public.taxonomy_options
             WHERE category_key = 'link_platforms' AND slug IN ({", ".join(f"'{x}'" for x in REMOVED_PLATFORMS)}))
     OR EXISTS (SELECT 1 FROM (SELECT sort_order, row_number() OVER (ORDER BY sort_order, slug) AS n
                               FROM public.taxonomy_options WHERE category_key = 'link_platforms') x
                WHERE x.sort_order <> x.n) THEN
    RAISE EXCEPTION 'link_platforms: a removed platform remains or sort orders are not 1..n';
  END IF;
END
$import$;
""")

updates, conditions = [], []
for table, column, kind, category, key in REFS:
    stmt, cond = ref_sql(table, column, kind, category, key)
    updates.append(stmt)
    conditions.append((f"{table}.{column}" + (f".{key}" if key else ""), table, cond))
w(f"""-- 4. Stored references to renamed slugs
DO $refs$
DECLARE
  v_renames jsonb := {payload(renames_obj)};
BEGIN
{chr(10).join(updates)}

  -- A role detail row moves to the new role unless the profile already has one there (the check
  -- below then stops the migration).
  UPDATE public.profile_role_details t SET role_slug = {m('person_types')}->>t.role_slug, updated_at = now()
  WHERE {m('person_types')} ? t.role_slug
    AND NOT EXISTS (SELECT 1 FROM public.profile_role_details n
                    WHERE n.profile_id = t.profile_id AND n.role_slug = {m('person_types')}->>t.role_slug);

  UPDATE public.marketplace_listings t SET item_category = {m('instruments')}->>t.item_category, updated_at = now()
  WHERE t.item_category_kind IS DISTINCT FROM 'equipment' AND {m('instruments')} ? t.item_category;
END
$refs$;
""")

w(f"""-- 5. Imported text without "/"
DO $text$
DECLARE
  v_fixes jsonb := {payload(text_fixes)};
BEGIN
  UPDATE public.opportunities t SET role_required = r.new, updated_at = now()
  FROM jsonb_to_recordset(v_fixes) AS r("table" text, "column" text, old text, new text)
  WHERE r."table" = 'opportunities' AND r."column" = 'role_required' AND t.role_required = r.old;

  UPDATE public.marketplace_listings t SET title = r.new, updated_at = now()
  FROM jsonb_to_recordset(v_fixes) AS r("table" text, "column" text, old text, new text)
  WHERE r."table" = 'marketplace_listings' AND r."column" = 'title' AND t.title = r.old;
END
$text$;
""")
assert {(f["table"], f["column"]) for f in text_fixes} == {("opportunities", "role_required"), ("marketplace_listings", "title")}

ref_checks = "\n".join(
    f"""  IF EXISTS (SELECT 1 FROM public.{table} t WHERE {cond}) THEN
    RAISE EXCEPTION 'taxonomy rename: {label} still holds an old slug';
  END IF;""" for label, table, cond in conditions)
w(f"""-- 6. persona_bucket: up to {tpb.GENRE_SCREEN_LIMIT} genres per screen, other categories on p_limit
{tpb.persona_bucket_function("CREATE OR REPLACE FUNCTION")}
DO $bucket$
DECLARE
  v_languages text[] := ARRAY(SELECT slug FROM public.taxonomy_options WHERE category_key = 'languages' AND is_published);
  v_primary text;
  v_available int;
BEGIN
  -- Any published person type will do; the genre count does not depend on it.
  SELECT o.slug INTO v_primary FROM public.taxonomy_options o
  JOIN public.taxonomy_categories c ON c.key = o.category_key AND c.is_published
  WHERE o.category_key = 'person_types' AND o.is_published ORDER BY o.sort_order LIMIT 1;
  IF v_primary IS NULL THEN
    RETURN;
  END IF;
  SELECT count(*) INTO v_available
  FROM public.taxonomy_options o
  JOIN public.taxonomy_categories c ON c.key = o.category_key AND c.is_published
  WHERE o.category_key = 'genres' AND o.is_published
    AND (o.metadata->>'scope' = 'universal'
         OR EXISTS (SELECT 1 FROM public.genre_languages gl WHERE gl.genre_slug = o.slug
                    AND gl.language_slug = ANY (v_languages)));
  IF (SELECT count(*) FROM public.persona_bucket(v_primary, '{{}}', v_languages, {SCREEN_LIMIT}) b
      WHERE b.category_key = 'genres') <> LEAST(v_available, {tpb.GENRE_SCREEN_LIMIT}) THEN
    RAISE EXCEPTION 'persona_bucket: genres are not capped at {tpb.GENRE_SCREEN_LIMIT}';
  END IF;
  IF (SELECT count(*) FROM public.persona_bucket(v_primary, '{{}}', v_languages, {SCREEN_LIMIT}) b
      WHERE b.category_key = 'instruments') > {SCREEN_LIMIT} THEN
    RAISE EXCEPTION 'persona_bucket: instruments exceed p_limit';
  END IF;
END
$bucket$;
""")

w(f"""-- 7. Verify
DO $verify$
DECLARE
  v_renames jsonb := {payload(renames_obj)};
  v_options jsonb := {payload(target_options)};
  v_pti jsonb := {payload(expected_pti)};
  v_gl jsonb := {payload(expected_gl)};
  v_bad text;
BEGIN
  SELECT string_agg(category_key || '.' || slug || ' "' || label || '"', ', ') INTO v_bad
  FROM public.taxonomy_options WHERE label LIKE '%/%';
  IF v_bad IS NOT NULL THEN
    RAISE EXCEPTION 'taxonomy labels still contain "/": %', v_bad;
  END IF;
  IF EXISTS (SELECT 1 FROM public.opportunities WHERE role_required LIKE '%/%') THEN
    RAISE EXCEPTION 'opportunities.role_required still contains "/"';
  END IF;
  IF EXISTS (SELECT 1 FROM public.marketplace_listings WHERE title LIKE '%/%') THEN
    RAISE EXCEPTION 'marketplace_listings.title still contains "/"';
  END IF;

  -- Old slugs are gone from the options and from every reference.
  SELECT string_agg(o.category_key || '.' || o.slug, ', ') INTO v_bad
  FROM public.taxonomy_options o WHERE v_renames->o.category_key ? o.slug;
  IF v_bad IS NOT NULL THEN
    RAISE EXCEPTION 'taxonomy rename: old options remain: %', v_bad;
  END IF;
{ref_checks}
  IF EXISTS (SELECT 1 FROM public.profile_role_details t WHERE {m('person_types')} ? t.role_slug) THEN
    RAISE EXCEPTION 'taxonomy rename: profile_role_details.role_slug still holds an old slug';
  END IF;
  IF EXISTS (SELECT 1 FROM public.marketplace_listings t WHERE {m('instruments')} ? t.item_category) THEN
    RAISE EXCEPTION 'taxonomy rename: marketplace_listings.item_category still holds an old slug';
  END IF;

  -- person_types, instruments and genres hold exactly the generated options.
  IF EXISTS (
    SELECT 1 FROM (SELECT category_key, slug FROM public.taxonomy_options
                   WHERE category_key IN ({", ".join(f"'{c}'" for c in FULL)})) o
    FULL JOIN jsonb_to_recordset(v_options) AS r(category_key text, slug text)
      ON r.category_key = o.category_key AND r.slug = o.slug
    WHERE o.slug IS NULL OR r.slug IS NULL
  ) THEN
    RAISE EXCEPTION 'taxonomy rename: person_types, instruments or genres differ from the generated option set';
  END IF;

  -- The rules are exactly the generated ones (flute only under Flautist; split-out options share
  -- their parent's rules).
  IF EXISTS (
    SELECT 1 FROM public.person_type_instruments p
    FULL JOIN jsonb_to_recordset(v_pti) AS r(person_type_slug text, instrument_slug text)
      ON r.person_type_slug = p.person_type_slug AND r.instrument_slug = p.instrument_slug
    WHERE p.person_type_slug IS NULL OR r.person_type_slug IS NULL
  ) THEN
    RAISE EXCEPTION 'taxonomy rename: person_type_instruments differs from the generated rules';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.genre_languages g
    FULL JOIN jsonb_to_recordset(v_gl) AS r(genre_slug text, language_slug text)
      ON r.genre_slug = g.genre_slug AND r.language_slug = g.language_slug
    WHERE g.genre_slug IS NULL OR r.genre_slug IS NULL
  ) THEN
    RAISE EXCEPTION 'taxonomy rename: genre_languages differs from the generated rules';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.taxonomy_options WHERE category_key = 'verification_id_type' AND slug = 'company_pan')
     OR NOT EXISTS (SELECT 1 FROM public.taxonomy_options WHERE category_key = 'verification_id_type' AND slug = 'company_gstin') THEN
    RAISE EXCEPTION 'taxonomy rename: verification_id_type is missing company_pan or company_gstin';
  END IF;
END
$verify$;
""")

sql = "\n".join(L)
with open(OUT, "w", encoding="utf-8") as f:
    f.write(sql)
print({"renames": len(renames), "added": len(added), "target options": len(target_options),
       "pti": len(expected_pti), "gl": len(expected_gl), "new categories": len(new_categories),
       "new options": len(new_options), "text fixes": len(text_fixes), "bytes": len(sql.encode())})
