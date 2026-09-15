"""Generates two migrations: the data model behind services and behind verification.

Usage (repo root):
  bun run supabase/generators/export_services_verification.ts > /tmp/services-verification.json
  python3 supabase/generators/services_verification.py /tmp/services-verification.json \
    supabase/migrations/20260915160000_services.sql supabase/migrations/20260915170000_verification.sql

Owner, 16 Sep 2026: "services also have quite a big db and mapping; verification too". The option lists
(service_categories, pricing_models, verification_types, verification_id_type) are taxonomy categories
since 20260915110000; this adds the tables, mappings and rules behind them.

Content comes from src/data/services.ts and src/data/verification.ts (via the exporter) and from the
stored profile_services rows (the payloads of 20260914170000 and 20260915120000). The mapping choices
below (MAPPING CHOICE) are ours, not the app's; the migration header lists them for the owner.
Same uuid namespace as import_profiles.py. Prints a report of what was and was not stored.
"""
from __future__ import annotations

import json
import re
import sys
import uuid

import taxonomy_persona_bucket as tpb

APP, OUT_SERVICES, OUT_VERIFICATION = sys.argv[1:4]
NS = uuid.UUID("5b1b2f0e-3c1a-4f6e-9d3a-6d1c2b7e9a10")  # same namespace as import_profiles.py
DATA = json.load(open(APP, encoding="utf-8"))
problems: list[str] = []
report: list[str] = []


def uid(key: str) -> str:
    return str(uuid.uuid5(NS, key))


def payload_of(path: str, table_comment: str) -> list[dict]:
    """The JSON payload of the data block headed `-- <table_comment>` in an earlier migration."""
    sql = open(path, encoding="utf-8").read()
    m = re.search(re.escape(table_comment) + r"[^\n]*\nDO \$import\$\nDECLARE\n  payload jsonb := \$json\$(.*?)\$json\$;", sql, re.S)
    assert m, f"{table_comment} payload not found in {path}"
    return json.loads(m.group(1))


PERSON_TYPES = [p[0] for p in tpb.PERSON_TYPES]
FLOW = {p[0]: "business" if p[2] == "business" else "talent" for p in tpb.PERSON_TYPES}
assert [(p["slug"], p["flow"]) for p in DATA["personTypes"]] == [(s, FLOW[s]) for s in PERSON_TYPES], \
    "person types in 20260915110000 differ from taxonomy_persona_bucket.py"

SERVICE_CATEGORY = {c["key"]: c["label"] for c in DATA["serviceCategories"]}
PRICING_MODEL = DATA["pricingModelLabel"]
assert list(SERVICE_CATEGORY) == ["vocals", "mixing", "mastering", "production", "instrument", "songwriting",
                                  "live", "studio"], SERVICE_CATEGORY
assert list(PRICING_MODEL) == ["hourly", "per_song", "per_day", "package", "custom"], PRICING_MODEL

# =============================================================================================
# SERVICES
# =============================================================================================

# MAPPING CHOICE: service categories each person type can offer. Every person type is listed; an empty
# list means no service category fits it.
ALL_CATEGORIES = list(SERVICE_CATEGORY)
PERSON_TYPE_SERVICES = {
    "singer": ["vocals", "live"],
    "rapper": ["vocals", "songwriting", "live"],
    "folk_vocalist": ["vocals", "live"],
    "voice_artist": ["vocals"],
    "musician": ["instrument", "live"],
    "guitarist": ["instrument", "live"],
    "bassist": ["instrument", "live"],
    "keyboardist": ["instrument", "live"],
    "drummer": ["instrument", "live"],
    "sitarist": ["instrument", "live"],
    "violinist": ["instrument", "live"],
    "flautist": ["instrument", "live"],
    "composer": ["songwriting", "production"],
    "lyricist": ["songwriting"],
    "arranger": ["production"],
    "music_director": ["production", "songwriting"],
    "producer": ["production"],
    "beatmaker": ["production"],
    "sound_engineer": ["mixing", "mastering"],
    "mixing_engineer": ["mixing"],
    "mastering_engineer": ["mastering"],
    "sound_designer": ["production"],
    "dj": ["live"],
    "rj": [],
    "podcaster": [],
    "music_teacher": [],
    "studio": ["studio", "mixing", "mastering"],
    "music_label": [],
    "venue": ["live"],
    "event_organizer": [],
    "booking_agency": ["live"],
    "artist_manager": [],
    "production_house": ["production"],
    "music_school": [],
    "dealer": [],
    "rental_provider": ["studio"],
    "music_publisher": [],
    "a_and_r": [],
    "other": ALL_CATEGORIES,
}
assert list(PERSON_TYPE_SERVICES) == PERSON_TYPES, "every person type, in taxonomy order"
person_type_services = [{"person_type_slug": p, "service_category_slug": c}
                        for p in PERSON_TYPES for c in PERSON_TYPE_SERVICES[p]]
for r in person_type_services:
    assert r["service_category_slug"] in SERVICE_CATEGORY, r

# MAPPING CHOICE: service category -> studio_services / engineer_specialties options, only where the
# option is the same thing by slug and label (Mixing, Mastering). Recording is not mapped: no service
# category is recording alone (Studio time and Session vocals both may be).
SPECIALTIES = [
    ("mixing", "studio_services", "mixing"), ("mixing", "engineer_specialties", "mixing"),
    ("mastering", "studio_services", "mastering"), ("mastering", "engineer_specialties", "mastering"),
]
service_specialties = [{"service_category_slug": c, "option_category": k, "option_slug": s} for c, k, s in SPECIALTIES]

# ---- Backfill of stored profile_services -----------------------------------------------------------
stored = (payload_of("supabase/migrations/20260914170000_profile_sections.sql", "-- profile_services 1/1")
          + payload_of("supabase/migrations/20260915120000_business_accounts.sql", "-- profile_services (3 rows)"))
assert len(stored) == 31, len(stored)

# MAPPING CHOICE: price_unit -> pricing model. "track" is a song; "show" follows the app's own Live set
# (services.ts svc-3: pricingModel per_day, unit "per show"). Other units (session, 5 sessions, project,
# film, video, night) and rows with no price have no model.
UNIT_MODEL = {"hr": "hourly", "day": "per_day", "song": "per_song", "track": "per_song", "show": "per_day"}
# MAPPING CHOICE: profile_services.mode (display text) -> work_modes slugs, "·" separating two modes.
MODE_SLUG = {"Remote": "remote", "In person": "in_person"}

# Category per stored row (id, name as stored): set only where the name says the category itself, or names
# a room of a recording studio. None = left empty, with the reason.
CATEGORY_OF = [
    # wugweb (studio, sound_engineer)
    ("205ee30a-9535-5184-8863-b85a3551fcef", "Full Band Live Tracking", None, "Studio time or Production"),
    ("dae5d070-3ee4-53f7-a443-c2fcf3dbe359", "Certified Dolby Atmos Mixing", "mixing", None),
    ("b60d9d28-1ba1-5104-8b94-1ca11379202b", "Acoustic Grand Piano Session", None, "Studio time or Session instrument"),
    ("cb3bd535-e606-58ad-aebc-c8d0caa15405", "Commercial Film Stereo Dubbing", None, "no category fits"),
    ("312416cd-bb74-52b8-aa99-838cbd963967", "Masterclass Audio Production", None, "a class; no category fits"),
    ("cb995cf5-08c5-56e4-8e2d-af314ade836a", "Vintage Backline Gear Rental", None, "no category fits"),
    # yash.raj.sound.studios (studio, sound_engineer)
    ("56914bb7-93d1-5efb-ad3c-a46af2a36c6f", "Full Feature Sound Mix", "mixing", None),
    # sunsetrecords (music_label, a_and_r, music_publisher)
    ("46f346de-340d-5189-bbac-550ab3c30cd4", "Single release deal", None, "no category fits"),
    ("eb1eeaa7-df82-5b43-bf50-daabc24ad8eb", "Distribution", None, "no category fits"),
    # kabirmenon (musician, singer)
    ("177c9e87-4f9b-5379-b185-44f5db0f9afb", "Session guitar", "instrument", None),
    ("d5f6910d-282c-5e28-882d-27dd0719a9ae", "Support slot", "live", None),
    # thequarter (venue)
    ("f3349118-ad2c-5188-ac5f-1e8a3f84d0ca", "Headline night", None, "a venue slot or Live performance"),
    ("ffe392a9-626c-56de-a3f7-fbc2b373eb65", "Private event hire", None, "no category fits"),
    # meeraraghav (producer, musician)
    ("84c18a58-e831-512f-9530-ea853cb5e53e", "Band production", "production", None),
    ("c4ec9072-78d8-5d35-95fb-bd80dfe7c819", "Piano and Rhodes sessions", "instrument", None),
    # northlightfilms (production_house)
    ("a86f1607-8f2a-5b32-ad15-1ba7af2909db", "Brand film production", None, "film production, not music Production"),
    ("ad2077a9-a02a-511f-9df8-f50269df72bb", "Music video", None, "no category fits"),
    # rheadsouza (musician)
    ("e6cb6008-6b9d-55b9-a896-a65fd2fcf265", "Session keys", "instrument", None),
    ("9da9074d-f013-54d1-9822-f7a3c2a335c7", "Live and touring keys", None, "Live performance or Session instrument"),
    # arjunpillai (musician, composer)
    ("9a1e81d0-dbff-5979-8e44-cc063f556c5b", "Arrangement and charts", None, "Production or Songwriting"),
    ("5f93a2a2-85cd-590e-8953-67eae5f427b1", "Session piano", "instrument", None),
    # tarabose (producer, musician)
    ("3c25f732-91c8-582a-a432-5839f2cd610a", "Electronic production", "production", None),
    ("6f6ffb57-5ddc-5b21-8dd4-9a7a80653810", "Score and sound design", None, "Production or Songwriting"),
    # kabir.nair (sound_engineer)
    ("4a435ff4-a6ff-52e6-9b02-34b4391c038b", "Mixing", "mixing", None),
    ("a06e78a7-5430-5005-9476-0fdacbfce4d9", "Mastering", "mastering", None),
    # octave.sound.labs (studio): rooms of a recording studio
    ("3cec16a2-29e8-52c6-ad4c-a694c5df65aa", "Live Room A", "studio", None),
    ("d163b376-3bbf-5ec4-acaa-79286e5e2c05", "Vocal booth", "studio", None),
    # sanya.rao (artist_manager)
    ("dfb71d12-c58b-5c2f-b9e8-f79a5464e63f", "Production liaison", None, "no category fits"),
    # soundhouse.bandra (studio; 20260915120000): two rooms of its studio and a mixing service
    ("a7d848c0-658d-541b-8fa1-398acc5fc958", "Studio A — tracking", "studio", None),
    ("55796e2f-57c7-5d93-adf5-bdb5b62f3cde", "Studio B — overdubs & vocals", "studio", None),
    ("f40c3a8c-0807-574e-b58b-8af5d9667675", "Mixing with house engineer", "mixing", None),
]
by_id = {r["id"]: r for r in stored}
backfill, category_report = [], []
for sid, name, category, why in CATEGORY_OF:
    row = by_id.get(sid)
    if not row or row["name"] != name:
        problems.append(f"backfill: no stored profile_services row {sid} named {name!r}")
        continue
    if (category is None) == (why is None) or (category is not None and category not in SERVICE_CATEGORY):
        problems.append(f"backfill {sid}: category {category!r} with reason {why!r}")
    unit = row.get("price_unit")
    model = UNIT_MODEL.get(unit) if row.get("price_paise") is not None else None
    modes = []
    for part in (row.get("mode") or "").split(" · "):
        if part and part not in MODE_SLUG:
            problems.append(f"backfill {sid}: mode {part!r} not understood")
        elif part:
            modes.append(MODE_SLUG[part])
    backfill.append({"id": row["id"], "category": category, "pricing_model": model, "work_modes": modes})
    category_report.append((row, category, why, model, modes))
if {r["id"] for r in stored} != {c[0] for c in CATEGORY_OF}:
    problems.append("backfill: stored rows and decisions differ")

# ---- myServices ---------------------------------------------------------------------------------------
# src/data/services.ts names no account for myServices (no username, id or name), and no profile's roles
# and services match them, so they are not stored. Set an owner profile id here to seed them.
SERVICES_OWNER: str | None = None
WORK_MODE_SLUGS = {"Remote": ["remote"], "In studio": ["in_person"], "Remote or in studio": ["remote", "in_person"]}
APP_UNIT = {"per hour": "hr", "per song": "song", "per day": "day", "per show": "show", "per set": "set"}
label_to_category = {v: k for k, v in SERVICE_CATEGORY.items()}
services, packages, addons = [], [], []
for i, s in enumerate(DATA["myServices"]):
    for text in [s["title"], s["description"], *s["deliverables"], *s["requirements"],
                 *(x for p in s["packages"] for x in [p["name"], *p["includes"]]), *(a["label"] for a in s["addons"])]:
        if "/" in text:
            (problems if SERVICES_OWNER else report).append(f'myServices {s["id"]}: text with "/": {text!r}')
    if SERVICES_OWNER is None:
        continue
    sid = uid(f"demo:services/{s['id']}")
    services.append({
        "id": sid, "profile_id": SERVICES_OWNER, "name": s["title"], "description": s["description"],
        "category": label_to_category[s["category"]], "pricing_model": s["pricingModel"],
        "price_paise": s["basePrice"] * 100, "price_unit": APP_UNIT.get(s["unit"], s["unit"]),
        "min_hours": s.get("minHours"), "status": s["status"], "deliverables": s["deliverables"],
        "requirements": s["requirements"], "mode": s["workMode"], "work_modes": WORK_MODE_SLUGS[s["workMode"]],
        "turnaround": s["turnaround"], "sort_order": 100 + i,
    })
    for j, p in enumerate(s["packages"]):
        packages.append({"id": uid(f"demo:services/{s['id']}/package/{p['id']}"), "service_id": sid,
                         "profile_id": SERVICES_OWNER, "name": p["name"], "price_paise": p["price"] * 100,
                         "price_unit": APP_UNIT.get(p["unit"], p["unit"]), "includes": p["includes"],
                         "turnaround": p["turnaround"], "revisions": p["revisions"],
                         "is_popular": bool(p.get("popular")), "sort_order": j})
    for j, a in enumerate(s["addons"]):
        addons.append({"id": uid(f"demo:services/{s['id']}/addon/{a['id']}"), "service_id": sid,
                       "profile_id": SERVICES_OWNER, "label": a["label"], "price_paise": a["price"] * 100,
                       "price_unit": APP_UNIT.get(a["unit"], a["unit"]), "sort_order": j})

# =============================================================================================
# VERIFICATION
# =============================================================================================

TYPES = DATA["verificationTypes"]
TYPE_KEYS = [t["key"] for t in TYPES]
assert TYPE_KEYS == ["identity", "professional", "business", "studio"], TYPE_KEYS
GATES = {g["key"]: g for g in DATA["gates"]}

# Who can apply: verificationTypesFor run for each person type alone, for no role, and for a role the
# taxonomy lacks.
for_role = DATA["typesForRole"]
type_person_types = [{"type_slug": k, "person_type_slug": p} for k in TYPE_KEYS for p in PERSON_TYPES if k in for_role[p]]
every_profile = [k for k in TYPE_KEYS
                 if all(k in for_role[p] for p in PERSON_TYPES) and k in DATA["typesForNoRole"]
                 and k in DATA["typesForUnknownRole"]]
without_role = DATA["typesForNoRole"]

# MAPPING CHOICE: which approved types set profiles.is_verified. The app reads is_verified as
# "Professional" on a talent profile (profile-view.ts), "Verified business" on a business
# (business-view.ts) and as the verified mark of the owner's studio (studio-view.ts); nothing reads it
# as identity.
GRANTS_IS_VERIFIED = {"identity": False, "professional": True, "business": True, "studio": True}
# MAPPING CHOICE: no trust_badges option (verified_artist, top_host, rising_talent, studio_partner) is
# the same thing as a verification type, so none is granted. Set a slug here to grant one.
TRUST_BADGE: dict[str, str | None] = {"identity": None, "professional": None, "business": None, "studio": None}
# MAPPING CHOICE: requirement values kept in verification_request_private instead of the item row.
PRIVATE_FIELD = {("identity", "Phone number on file"): "phone"}


def slugify(label: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", label.lower()).strip("_")


details, requirements = [], []
for t in TYPES:
    gate = GATES[t["key"]]
    prerequisite = None if gate["allowed"] else gate["unlockedBy"]
    if prerequisite is not None and len(prerequisite) != 1:
        problems.append(f"verification {t['key']}: unlocked by {prerequisite}, expected one type")
    if t.get("locked"):
        problems.append(f"verification {t['key']}: locked is set in the app; not handled")
    details.append({
        "type_slug": t["key"], "verifies": t["verifies"], "what_others_see": t["whatOthersSee"],
        "turnaround": t["turnaround"], "applies_to": t["appliesTo"],
        "applies_to_every_profile": t["key"] in every_profile, "applies_without_role": t["key"] in without_role,
        "prerequisite_slug": prerequisite[0] if prerequisite else None,
        "locked_reason": gate["reason"] or None,
        "grants_is_verified": GRANTS_IS_VERIFIED[t["key"]], "trust_badge_slug": TRUST_BADGE[t["key"]],
    })
    for i, r in enumerate(t["requirements"]):
        slug = slugify(r["label"])
        requirements.append({
            "id": uid(f"verification_requirement:{t['key']}/{slug}"), "type_slug": t["key"], "slug": slug,
            "label": r["label"], "why": r["why"], "kind": r["kind"],
            "is_optional": r["label"].endswith("(optional)"),
            "private_field": PRIVATE_FIELD.get((t["key"], r["label"])), "sort_order": i + 1,
        })
for (k, label), _ in PRIVATE_FIELD.items():
    assert any(r["type_slug"] == k and r["label"] == label and r["kind"] == "info" for r in requirements), (k, label)
for row in details + requirements:
    for c, v in row.items():
        if isinstance(v, str) and "/" in v:
            problems.append(f"verification text with '/': {c} {v!r}")

# myVerifications: design data (use-my-verification.ts: "never shown to a real account"). They name no
# account, and their dates are relative ("2 days ago", "8 Mar this year"), so they are not stored.
for v in DATA["myVerifications"]:
    report.append(f"myVerifications {v['id']} ({v['type']}, {v['status']}): not stored, no account")

if problems:
    sys.exit("Problems:\n" + "\n".join(problems))

# =============================================================================================
# SQL helpers
# =============================================================================================

COLTYPES = {"id": "uuid", "profile_id": "uuid", "service_id": "uuid", "price_paise": "bigint", "sort_order": "int",
            "min_hours": "int", "is_popular": "boolean", "deliverables": "text[]", "requirements": "text[]",
            "work_modes": "text[]", "includes": "text[]", "applies_to_every_profile": "boolean",
            "applies_without_role": "boolean", "grants_is_verified": "boolean", "is_optional": "boolean"}


def recordset(cols):
    return "jsonb_to_recordset(payload) AS r(" + ", ".join(f"{c} {COLTYPES.get(c, 'text')}" for c in cols) + ")"


def upsert(table, rows, key):
    cols = list(rows[0].keys())
    keys = [k.strip() for k in key.split(",")]
    rs = recordset(cols)
    return f"""  INSERT INTO public.{table} ({", ".join(cols)})
  SELECT {", ".join("r." + c for c in cols)} FROM {rs}
  ON CONFLICT ({key}) DO UPDATE SET {", ".join(f"{c} = EXCLUDED.{c}" for c in cols if c not in keys)}
  WHERE ({", ".join(f"{table}.{c}" for c in cols)}) IS DISTINCT FROM ({", ".join("EXCLUDED." + c for c in cols)});

  IF (SELECT count(*) FROM {rs} JOIN public.{table} t ON {" AND ".join(f"t.{k} = r.{k}" for k in keys)}
      WHERE ({", ".join("t." + c for c in cols)}) IS NOT DISTINCT FROM ({", ".join("r." + c for c in cols)}))
     <> jsonb_array_length(payload) THEN
    RAISE EXCEPTION '{table} import: stored rows differ from the payload';
  END IF;"""


def insert_missing(table, rows, key):
    """Adds the payload rows that are missing; rows added later by MusicLinkd are kept."""
    cols = list(rows[0].keys())
    keys = [k.strip() for k in key.split(",")]
    rs = recordset(cols)
    return f"""  INSERT INTO public.{table} ({", ".join(cols)})
  SELECT {", ".join("r." + c for c in cols)} FROM {rs}
  ON CONFLICT ({key}) DO NOTHING;

  IF (SELECT count(*) FROM {rs} JOIN public.{table} t ON {" AND ".join(f"t.{k} = r.{k}" for k in keys)})
     <> jsonb_array_length(payload) THEN
    RAISE EXCEPTION '{table} import: payload rows are missing';
  END IF;"""


def block(label, rows, body):
    payload = json.dumps(rows, ensure_ascii=False, separators=(",", ":"))
    assert "$json$" not in payload
    return (f"-- {label} ({len(rows)} rows)\nDO $import$\nDECLARE\n  payload jsonb := $json${payload}$json$;\n"
            f"BEGIN\n{body}\nEND\n$import$;\n")


def comment_table(rows, width=100):
    return "\n".join("--   " + line for line in rows)


# =============================================================================================
# Services migration
# =============================================================================================

app_options = ([{"category_key": "service_categories", "slug": k, "label": v} for k, v in SERVICE_CATEGORY.items()]
               + [{"category_key": "pricing_models", "slug": k, "label": v} for k, v in PRICING_MODEL.items()])

mapping_lines = [f"{p:<19} {', '.join(PERSON_TYPE_SERVICES[p]) or '(none fits)'}" for p in PERSON_TYPES]
backfill_lines = []
for row, category, why, model, modes in category_report:
    price = (f"{row['price_paise'] // 100} {row.get('price_unit')}" if row.get("price_paise") is not None
             else (row.get("price_note") or "no price"))
    backfill_lines.append(f"{row['id'][:8]} {row['name']} | category {category or '-'} | pricing {model or '-'}"
                          f" ({price}) | work_modes {','.join(modes) or '-'}")
    if category is None:
        backfill_lines.append(f"         category left empty: {why}")

SERVICES_HEADER = f"""-- Services: the data model behind the service_categories and pricing_models options.
--
-- Generated by supabase/generators/services_verification.py from src/data/services.ts (via
-- supabase/generators/export_services_verification.ts) and the stored profile_services rows. Edit the
-- generator, not this file.
--
-- Owner, 16 Sep 2026: "services also have quite a big db and mapping". profile_services (20260914170000)
-- is the service table: the profile pages and business pages already read it, so it is extended rather
-- than replaced by a second table.
--
-- Schema
--   profile_services + category (service_categories slug), pricing_model (pricing_models slug), min_hours,
--                      status (active | paused | draft, default active), deliverables (What you get),
--                      requirements (What the client should send), work_modes (work_modes slugs),
--                      notice (Notice needed), updated_at trigger. Kept: name (the app's title),
--                      description, price_paise (basePrice), price_unit (unit), price_note, turnaround,
--                      mode (display text), availability, sort_order.
--                      category and pricing_model reference taxonomy_options by foreign key (with the
--                      constant columns category_taxonomy and pricing_model_taxonomy, as
--                      person_type_instruments does); work_modes is checked by trigger.
--   profile_service_packages  tiers of a service: name, price_paise, price_unit, includes, turnaround,
--                      revisions, is_popular, sort_order.
--   profile_service_addons    extras of a service: label, price_paise, price_unit, sort_order.
--   person_type_service_categories  which service categories each person type can offer.
--   service_category_specialties    service category -> studio_services and engineer_specialties options.
--   Not stored: the category emoji (it follows from the category) and stats (views, enquiries,
--   bookings, rating, reviews are counts of other data, not service fields).
--
-- Read and write
--   profile_services: readable with its profile (profile_is_readable), except drafts, which only the
--   owner reads. Owners write their own (unchanged).
--   Packages and add-ons: readable when their service is (profile_service_is_readable); owners write
--   their own. profile_id must be the service's profile (composite foreign key).
--   Mapping tables: everyone reads; only service_role writes.
--
-- Mapping: service categories per person type (MAPPING CHOICE, for the owner to confirm)
{comment_table(mapping_lines)}
-- Service category specialties (same slug and label): mixing -> studio_services mixing, engineer_specialties
--   mixing; mastering -> studio_services mastering, engineer_specialties mastering. Recording is not mapped.
--
-- Backfill of the {len(backfill)} stored profile_services rows (28 imported in 20260914170000, 3 of soundhouse.bandra
-- in 20260915120000). Only empty fields are filled, so a value an owner has set is kept.
--   category: only where the name says the category itself (or names a room of a recording studio).
--   pricing_model from price_unit: hr hourly, day per_day, song per_song, track per_song, show per_day
--   (services.ts prices its Live set per_day "per show"); other units and rows with no price stay empty.
--   work_modes from mode: Remote remote, In person in_person, "Remote · In person" both.
{comment_table(backfill_lines)}
--   A row that does not exist is skipped and named in a NOTICE.
--
-- myServices (src/data/services.ts) are not stored: the file names no account for them, and no profile
-- has those services. Set SERVICES_OWNER in the generator to seed them with their packages and add-ons.
--
-- Each data block re-reads what it wrote and raises on any difference. Idempotent.
-- Rollback:
--   DROP TABLE public.profile_service_addons, public.profile_service_packages,
--     public.service_category_specialties, public.person_type_service_categories;
--   DROP FUNCTION public.profile_service_is_readable(uuid), public.profile_services_check_work_modes();
--   ALTER TABLE public.profile_services DROP COLUMN category_taxonomy, DROP COLUMN category,
--     DROP COLUMN pricing_model_taxonomy, DROP COLUMN pricing_model, DROP COLUMN min_hours, DROP COLUMN status,
--     DROP COLUMN deliverables, DROP COLUMN requirements, DROP COLUMN work_modes, DROP COLUMN notice;
--   and restore the "Readable with its profile" policy of 20260914170000.
"""

SERVICES_SCHEMA = """
-- 1. The option categories used here exist, and their labels are the app's
DO $guard$
DECLARE
  v_app jsonb := $json$@APP@$json$;
  v_missing text;
BEGIN
  SELECT string_agg(k, ', ') INTO v_missing
  FROM unnest(ARRAY['service_categories', 'pricing_models', 'work_modes', 'person_types', 'studio_services',
                    'engineer_specialties']) AS k
  WHERE NOT EXISTS (SELECT 1 FROM public.taxonomy_categories c WHERE c.key = k);
  IF v_missing IS NOT NULL THEN
    RAISE EXCEPTION 'services: taxonomy categories missing: %', v_missing;
  END IF;
  SELECT string_agg(r.category_key || '.' || r.slug, ', ') INTO v_missing
  FROM jsonb_to_recordset(v_app) AS r(category_key text, slug text, label text)
  WHERE NOT EXISTS (SELECT 1 FROM public.taxonomy_options o
                    WHERE o.category_key = r.category_key AND o.slug = r.slug AND o.label = r.label);
  IF v_missing IS NOT NULL THEN
    RAISE EXCEPTION 'services: taxonomy options missing or labelled differently from the app: %', v_missing;
  END IF;
END
$guard$;

-- 2. profile_services: the fields of a service
ALTER TABLE public.profile_services
  ADD COLUMN IF NOT EXISTS category_taxonomy      text NOT NULL DEFAULT 'service_categories',
  ADD COLUMN IF NOT EXISTS category               text,
  ADD COLUMN IF NOT EXISTS pricing_model_taxonomy text NOT NULL DEFAULT 'pricing_models',
  ADD COLUMN IF NOT EXISTS pricing_model          text,
  ADD COLUMN IF NOT EXISTS min_hours              int,
  ADD COLUMN IF NOT EXISTS status                 text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS deliverables           text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS requirements           text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS work_modes             text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS notice                 text;

ALTER TABLE public.profile_services
  DROP CONSTRAINT IF EXISTS profile_services_category_taxonomy,
  DROP CONSTRAINT IF EXISTS profile_services_pricing_model_taxonomy,
  DROP CONSTRAINT IF EXISTS profile_services_category_fkey,
  DROP CONSTRAINT IF EXISTS profile_services_pricing_model_fkey,
  DROP CONSTRAINT IF EXISTS profile_services_min_hours,
  DROP CONSTRAINT IF EXISTS profile_services_status;
ALTER TABLE public.profile_services
  ADD CONSTRAINT profile_services_category_taxonomy CHECK (category_taxonomy = 'service_categories'),
  ADD CONSTRAINT profile_services_pricing_model_taxonomy CHECK (pricing_model_taxonomy = 'pricing_models'),
  ADD CONSTRAINT profile_services_category_fkey FOREIGN KEY (category_taxonomy, category)
    REFERENCES public.taxonomy_options (category_key, slug),
  ADD CONSTRAINT profile_services_pricing_model_fkey FOREIGN KEY (pricing_model_taxonomy, pricing_model)
    REFERENCES public.taxonomy_options (category_key, slug),
  ADD CONSTRAINT profile_services_min_hours CHECK (min_hours IS NULL OR min_hours > 0),
  ADD CONSTRAINT profile_services_status CHECK (status IN ('active', 'paused', 'draft'));

-- Packages and add-ons reference (id, profile_id), so their profile is always the service's.
DO $unique$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profile_services_id_profile_key') THEN
    ALTER TABLE public.profile_services ADD CONSTRAINT profile_services_id_profile_key UNIQUE (id, profile_id);
  END IF;
END
$unique$;

CREATE INDEX IF NOT EXISTS profile_services_category_idx ON public.profile_services (category) WHERE status = 'active';

CREATE OR REPLACE FUNCTION public.profile_services_check_work_modes()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $fn$
DECLARE
  v_bad text;
BEGIN
  SELECT string_agg(m, ', ') INTO v_bad
  FROM unnest(NEW.work_modes) AS m
  WHERE NOT EXISTS (SELECT 1 FROM public.taxonomy_options o WHERE o.category_key = 'work_modes' AND o.slug = m);
  IF v_bad IS NOT NULL THEN
    RAISE EXCEPTION 'profile_services.work_modes: not a work_modes option: %', v_bad;
  END IF;
  IF cardinality(NEW.work_modes) <> (SELECT count(DISTINCT m) FROM unnest(NEW.work_modes) AS m) THEN
    RAISE EXCEPTION 'profile_services.work_modes: a work mode is listed twice';
  END IF;
  RETURN NEW;
END
$fn$;

DROP TRIGGER IF EXISTS profile_services_check_work_modes ON public.profile_services;
CREATE TRIGGER profile_services_check_work_modes
  BEFORE INSERT OR UPDATE OF work_modes ON public.profile_services
  FOR EACH ROW EXECUTE FUNCTION public.profile_services_check_work_modes();

DROP TRIGGER IF EXISTS update_profile_services_updated_at ON public.profile_services;
CREATE TRIGGER update_profile_services_updated_at BEFORE UPDATE ON public.profile_services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Drafts are the owner's only.
DROP POLICY IF EXISTS "Readable with its profile" ON public.profile_services;
CREATE POLICY "Readable with its profile" ON public.profile_services FOR SELECT
  USING (public.profile_is_readable(profile_id) AND (status <> 'draft' OR profile_id = auth.uid()));

-- 3. Packages and add-ons
CREATE TABLE IF NOT EXISTS public.profile_service_packages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id  uuid NOT NULL,
  profile_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name        text NOT NULL CHECK (length(btrim(name)) > 0),
  price_paise bigint NOT NULL CHECK (price_paise >= 0),
  price_unit  text,
  includes    text[] NOT NULL DEFAULT '{}',
  turnaround  text,
  revisions   text,
  is_popular  boolean NOT NULL DEFAULT false,
  sort_order  int NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profile_service_packages_service_fkey FOREIGN KEY (service_id, profile_id)
    REFERENCES public.profile_services (id, profile_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.profile_service_addons (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id  uuid NOT NULL,
  profile_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label       text NOT NULL CHECK (length(btrim(label)) > 0),
  price_paise bigint NOT NULL CHECK (price_paise >= 0),
  price_unit  text,
  sort_order  int NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profile_service_addons_service_fkey FOREIGN KEY (service_id, profile_id)
    REFERENCES public.profile_services (id, profile_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS profile_service_packages_service_idx ON public.profile_service_packages (service_id, sort_order);
CREATE INDEX IF NOT EXISTS profile_service_addons_service_idx   ON public.profile_service_addons (service_id, sort_order);

-- A package or add-on is readable when its service is: the profile is readable and the service is
-- not a draft, or it is your own.
CREATE OR REPLACE FUNCTION public.profile_service_is_readable(p_service_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT EXISTS (SELECT 1 FROM public.profile_services s
                 WHERE s.id = p_service_id
                   AND public.profile_is_readable(s.profile_id)
                   AND (s.status <> 'draft' OR s.profile_id = auth.uid()));
$fn$;
REVOKE ALL ON FUNCTION public.profile_service_is_readable(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.profile_service_is_readable(uuid) TO anon, authenticated, service_role;

DO $rls$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['profile_service_packages', 'profile_service_addons'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated', t);
    EXECUTE format('GRANT SELECT ON public.%I TO anon, authenticated', t);
    EXECUTE format('GRANT INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('DROP POLICY IF EXISTS "Readable with its service" ON public.%I', t);
    EXECUTE format('CREATE POLICY "Readable with its service" ON public.%I FOR SELECT USING (public.profile_service_is_readable(service_id))', t);
    EXECUTE format('DROP POLICY IF EXISTS "Owners write their own" ON public.%I', t);
    EXECUTE format('CREATE POLICY "Owners write their own" ON public.%I FOR ALL TO authenticated USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id)', t);
    EXECUTE format('DROP TRIGGER IF EXISTS update_%s_updated_at ON public.%I', t, t);
    EXECUTE format('CREATE TRIGGER update_%s_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()', t, t);
  END LOOP;
END
$rls$;

-- 4. Mappings
CREATE TABLE IF NOT EXISTS public.person_type_service_categories (
  person_type_category      text NOT NULL DEFAULT 'person_types' CHECK (person_type_category = 'person_types'),
  person_type_slug          text NOT NULL,
  service_category_category text NOT NULL DEFAULT 'service_categories'
                            CHECK (service_category_category = 'service_categories'),
  service_category_slug     text NOT NULL,
  PRIMARY KEY (person_type_slug, service_category_slug),
  FOREIGN KEY (person_type_category, person_type_slug)
    REFERENCES public.taxonomy_options (category_key, slug) ON DELETE CASCADE,
  FOREIGN KEY (service_category_category, service_category_slug)
    REFERENCES public.taxonomy_options (category_key, slug) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS person_type_service_categories_category_idx
  ON public.person_type_service_categories (service_category_slug);

CREATE TABLE IF NOT EXISTS public.service_category_specialties (
  service_category_category text NOT NULL DEFAULT 'service_categories'
                            CHECK (service_category_category = 'service_categories'),
  service_category_slug     text NOT NULL,
  option_category           text NOT NULL CHECK (option_category IN ('studio_services', 'engineer_specialties')),
  option_slug               text NOT NULL,
  PRIMARY KEY (service_category_slug, option_category, option_slug),
  FOREIGN KEY (service_category_category, service_category_slug)
    REFERENCES public.taxonomy_options (category_key, slug) ON DELETE CASCADE,
  FOREIGN KEY (option_category, option_slug)
    REFERENCES public.taxonomy_options (category_key, slug) ON DELETE CASCADE
);

DO $rls$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['person_type_service_categories', 'service_category_specialties'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated', t);
    EXECUTE format('GRANT SELECT ON public.%I TO anon, authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('DROP POLICY IF EXISTS "Readable by everyone" ON public.%I', t);
    EXECUTE format('CREATE POLICY "Readable by everyone" ON public.%I FOR SELECT USING (true)', t);
  END LOOP;
END
$rls$;
""".replace("@APP@", json.dumps(app_options, ensure_ascii=False, separators=(",", ":")))

BACKFILL_BODY = f"""  SELECT string_agg(r.id::text, ', ') INTO v_absent
  FROM {recordset(["id", "category", "pricing_model", "work_modes"])}
  WHERE NOT EXISTS (SELECT 1 FROM public.profile_services t WHERE t.id = r.id);
  IF v_absent IS NOT NULL THEN
    RAISE NOTICE 'profile_services backfill: rows not in this database, skipped: %', v_absent;
  END IF;

  UPDATE public.profile_services t
  SET category      = coalesce(t.category, r.category),
      pricing_model = coalesce(t.pricing_model, r.pricing_model),
      work_modes    = CASE WHEN t.work_modes = '{{}}' THEN r.work_modes ELSE t.work_modes END
  FROM {recordset(["id", "category", "pricing_model", "work_modes"])}
  WHERE t.id = r.id
    AND ((t.category IS NULL AND r.category IS NOT NULL)
         OR (t.pricing_model IS NULL AND r.pricing_model IS NOT NULL)
         OR (t.work_modes = '{{}}' AND r.work_modes <> '{{}}'));

  IF EXISTS (SELECT 1 FROM {recordset(["id", "category", "pricing_model", "work_modes"])}
             JOIN public.profile_services t ON t.id = r.id
             WHERE (r.category IS NOT NULL AND t.category IS NULL)
                OR (r.pricing_model IS NOT NULL AND t.pricing_model IS NULL)
                OR (r.work_modes <> '{{}}' AND t.work_modes = '{{}}')) THEN
    RAISE EXCEPTION 'profile_services backfill: a field is still empty';
  END IF;"""

services_blocks = [
    block("person_type_service_categories", person_type_services,
          insert_missing("person_type_service_categories", person_type_services, "person_type_slug, service_category_slug")),
    block("service_category_specialties", service_specialties,
          insert_missing("service_category_specialties", service_specialties,
                         "service_category_slug, option_category, option_slug")),
    block("profile_services backfill", backfill, BACKFILL_BODY).replace("DECLARE\n", "DECLARE\n  v_absent text;\n", 1),
]
if services:
    services_blocks += [
        block("profile_services: myServices", services, upsert("profile_services", services, "id")),
        block("profile_service_packages", packages, upsert("profile_service_packages", packages, "id")),
        block("profile_service_addons", addons, upsert("profile_service_addons", addons, "id")),
    ]

with open(OUT_SERVICES, "w", encoding="utf-8") as f:
    f.write(SERVICES_HEADER + SERVICES_SCHEMA + "\n" + "\n".join(services_blocks))

# =============================================================================================
# Verification migration
# =============================================================================================

eligibility_lines = []
for k in TYPE_KEYS:
    slugs = [r["person_type_slug"] for r in type_person_types if r["type_slug"] == k]
    who = ("every person type" if len(slugs) == len(PERSON_TYPES)
           else "every talent type (" + str(len(slugs)) + ")" if all(FLOW[s] == "talent" for s in slugs)
           and len(slugs) == sum(1 for s in PERSON_TYPES if FLOW[s] == "talent")
           else "every business type (" + str(len(slugs)) + ")" if all(FLOW[s] == "business" for s in slugs)
           and len(slugs) == sum(1 for s in PERSON_TYPES if FLOW[s] == "business")
           else ", ".join(slugs))
    d = next(x for x in details if x["type_slug"] == k)
    extra = [x for x, on in (("also profiles with no role or an unknown role", d["applies_to_every_profile"]),
                             ("also profiles with no role", d["applies_without_role"] and not d["applies_to_every_profile"]))
             if on]
    eligibility_lines.append(f"{k:<13} {who}" + (f"; {extra[0]}" if extra else ""))
requirement_lines = [f"{r['type_slug']:<13} {r['sort_order']}. {r['label']} ({r['kind']}"
                     + (", optional" if r["is_optional"] else "")
                     + (f", value in verification_request_private.{r['private_field']}" if r["private_field"] else "")
                     + ")" for r in requirements]

VERIFICATION_HEADER = f"""-- Verification: the data model behind the verification_types and verification_id_type options.
--
-- Generated by supabase/generators/services_verification.py from src/data/verification.ts (via
-- supabase/generators/export_services_verification.ts). Edit the generator, not this file.
--
-- Owner, 16 Sep 2026: "verification too". The four types stay taxonomy options (label = the app's title,
-- metadata.description = its blurb, checked here); everything else about a type is in these tables.
--
-- Schema
--   verification_type_details   1:1 with a verification_types option: verifies, what_others_see,
--                               turnaround, applies_to (the app's label), applies_to_every_profile,
--                               applies_without_role, prerequisite_slug and locked_reason (the app's
--                               eligibility gate), grants_is_verified, trust_badge_slug (trust_badges).
--   verification_requirements   per type: slug, label, why, kind (document | info), is_optional,
--                               private_field, sort_order.
--   verification_type_person_types  which person types can apply for which type (replaces the app's
--                               verificationTypesFor and its hardcoded studio, venue, rental_provider).
--   verification_types_for(roles text[])  the type slugs a profile with these roles can apply for.
--   verification_requests       profile, type, status (unverified | in_review | verified | rejected |
--                               expired), submitted_at, reviewed_at, reviewed_by, expires_at,
--                               reviewer_note, rejection_reason. At most one open (unverified or
--                               in_review) request per profile and type.
--   verification_request_items  per requirement: state (uploaded | missing | rejected), and a file in
--                               the private verification-documents bucket (document) or info_text (info).
--   verification_request_private  per request: phone, id_type (verification_id_type), id_number.
--
-- Status
--   unverified is a draft the owner is filling in. The owner submits it (unverified -> in_review); the
--   request must apply to the profile's roles, its prerequisite must be verified and not expired, and
--   every required requirement must have an uploaded item (or, for phone, a private value).
--   Everything after that is MusicLinkd's: verification_decide(request, status, ...) moves in_review ->
--   verified | rejected and verified -> expired; verification_expire_due() expires verified requests
--   past expires_at. Both are service_role only.
--   A signed-in caller cannot set or change status beyond submitting, nor submitted_at, reviewed_at,
--   reviewed_by, expires_at, reviewer_note or rejection_reason (trigger), nor mark an item rejected.
--
-- Trust flags
--   After any change to a request made by service_role or a database session, verification_sync_trust
--   (SECURITY DEFINER, service_role only) recomputes the profile: is_verified becomes true while a type
--   with grants_is_verified is verified and not expired, and false when such a type has lapsed (expired)
--   and none is current; otherwise it is left as it is (the imported Firebase flags stay). Likewise a
--   type's trust_badge_slug is added while verified and removed when it lapses. Signed-in callers never
--   reach it, and the profiles admin-field guard (20260914170000) still refuses them.
--
-- Read and write
--   Types, requirements, mapping: everyone reads; service_role writes.
--   verification_requests: the owner reads theirs, starts drafts, edits and submits a draft, and
--   withdraws (deletes) a draft or a request in review. Anonymous callers have no access.
--   Items and private values: the owner reads theirs, and writes them while the request is a draft.
--   Nothing here is readable by anyone but the owner and service_role.
--
-- Storage: bucket verification-documents, private, 10 MB, JPEG, PNG, WebP or PDF. Paths are
--   <auth.uid()>/<request id>/<file>. The owner reads their own folder; uploads, replaces and deletes
--   only inside a draft request of theirs; and deletes the files of a request that no longer exists
--   (withdrawn). Files of a submitted request stay until service_role removes them.
--
-- Data
--   Types (MAPPING CHOICE for grants_is_verified and trust badges, for the owner to confirm):
--     identity      grants_is_verified false   trust badge none   prerequisite none
--     professional  grants_is_verified true    trust badge none   prerequisite identity
--     business      grants_is_verified true    trust badge none   prerequisite identity
--     studio        grants_is_verified true    trust badge none   prerequisite identity
--     The prerequisite and its reason come from the app's eligibility(), which gates every type but
--     identity (its comment names only professional and business). is_verified: the app reads it as
--     Professional on talent (profile-view.ts), Verified business (business-view.ts) and the studio's
--     verified mark (studio-view.ts). No trust_badges option is the same thing as a type.
--   Who can apply ({len(type_person_types)} rows, from verificationTypesFor per person type):
{comment_table(eligibility_lines)}
--     A role the taxonomy lacks: the app offers identity and professional; here only identity
--     (applies_to_every_profile).
--   Requirements ({len(requirements)}):
{comment_table(requirement_lines)}
--   myVerifications (src/data/verification.ts) are not stored: they are design data for no account
--   (use-my-verification.ts), with relative dates ("2 days ago", "8 Mar this year").
--
-- Each data block re-reads what it wrote and raises on any difference. Idempotent.
-- Rollback:
--   DROP TABLE public.verification_request_private, public.verification_request_items,
--     public.verification_requests, public.verification_type_person_types, public.verification_requirements,
--     public.verification_type_details;
--   DROP FUNCTION public.verification_types_for(text[]), public.verification_type_applies(uuid, text),
--     public.verification_prerequisite_met(uuid, text), public.verification_request_missing(uuid),
--     public.verification_requests_guard(), public.verification_requests_sync_trust(),
--     public.verification_sync_trust(uuid), public.verification_expire_due(),
--     public.verification_decide(uuid, text, text, text, text, timestamptz);
--   DROP POLICY on storage.objects: "Owners read their verification documents",
--     "Owners upload verification documents to a draft", "Owners replace verification documents in a draft",
--     "Owners delete verification documents of a draft or withdrawn request";
--   DELETE FROM storage.buckets WHERE id = 'verification-documents';  -- only once empty
"""

type_labels = [{"slug": t["key"], "label": t["title"], "description": t["blurb"]} for t in TYPES]

VERIFICATION_SCHEMA = """
-- 1. The option categories used here exist, and the verification types are the app's
DO $guard$
DECLARE
  v_types jsonb := $json$@TYPES@$json$;
  v_missing text;
BEGIN
  SELECT string_agg(k, ', ') INTO v_missing
  FROM unnest(ARRAY['verification_types', 'verification_id_type', 'person_types', 'trust_badges']) AS k
  WHERE NOT EXISTS (SELECT 1 FROM public.taxonomy_categories c WHERE c.key = k);
  IF v_missing IS NOT NULL THEN
    RAISE EXCEPTION 'verification: taxonomy categories missing: %', v_missing;
  END IF;
  SELECT string_agg(r.slug, ', ') INTO v_missing
  FROM jsonb_to_recordset(v_types) AS r(slug text, label text, description text)
  WHERE NOT EXISTS (SELECT 1 FROM public.taxonomy_options o
                    WHERE o.category_key = 'verification_types' AND o.slug = r.slug AND o.label = r.label
                      AND o.metadata ->> 'description' = r.description);
  IF v_missing IS NOT NULL THEN
    RAISE EXCEPTION 'verification: verification_types options missing or different from the app: %', v_missing;
  END IF;
END
$guard$;

-- 2. Types, requirements and who can apply
CREATE TABLE IF NOT EXISTS public.verification_type_details (
  type_category            text NOT NULL DEFAULT 'verification_types' CHECK (type_category = 'verification_types'),
  type_slug                text PRIMARY KEY,
  verifies                 text NOT NULL,
  what_others_see          text NOT NULL,
  turnaround               text NOT NULL,
  applies_to               text NOT NULL,
  applies_to_every_profile boolean NOT NULL DEFAULT false,
  applies_without_role     boolean NOT NULL DEFAULT false,
  prerequisite_category    text NOT NULL DEFAULT 'verification_types' CHECK (prerequisite_category = 'verification_types'),
  prerequisite_slug        text,
  locked_reason            text,
  grants_is_verified       boolean NOT NULL DEFAULT false,
  trust_badge_category     text NOT NULL DEFAULT 'trust_badges' CHECK (trust_badge_category = 'trust_badges'),
  trust_badge_slug         text,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (type_category, type_slug) REFERENCES public.taxonomy_options (category_key, slug),
  FOREIGN KEY (prerequisite_category, prerequisite_slug) REFERENCES public.taxonomy_options (category_key, slug),
  FOREIGN KEY (trust_badge_category, trust_badge_slug) REFERENCES public.taxonomy_options (category_key, slug),
  CHECK (prerequisite_slug IS DISTINCT FROM type_slug),
  CHECK ((prerequisite_slug IS NULL) = (locked_reason IS NULL))
);

CREATE TABLE IF NOT EXISTS public.verification_requirements (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type_slug     text NOT NULL REFERENCES public.verification_type_details (type_slug) ON DELETE CASCADE,
  slug          text NOT NULL CHECK (slug ~ '^[a-z0-9]+(_[a-z0-9]+)*$'),
  label         text NOT NULL CHECK (length(btrim(label)) > 0 AND position('/' in label) = 0),
  why           text NOT NULL,
  kind          text NOT NULL CHECK (kind IN ('document', 'info')),
  is_optional   boolean NOT NULL DEFAULT false,
  private_field text CHECK (private_field IN ('phone')),
  sort_order    int NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (type_slug, slug),
  UNIQUE (id, type_slug, kind),
  CHECK (private_field IS NULL OR kind = 'info')
);

CREATE TABLE IF NOT EXISTS public.verification_type_person_types (
  type_slug            text NOT NULL REFERENCES public.verification_type_details (type_slug) ON DELETE CASCADE,
  person_type_category text NOT NULL DEFAULT 'person_types' CHECK (person_type_category = 'person_types'),
  person_type_slug     text NOT NULL,
  PRIMARY KEY (type_slug, person_type_slug),
  FOREIGN KEY (person_type_category, person_type_slug)
    REFERENCES public.taxonomy_options (category_key, slug) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS verification_type_person_types_person_idx
  ON public.verification_type_person_types (person_type_slug);

DO $rls$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['verification_type_details', 'verification_requirements', 'verification_type_person_types'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated', t);
    EXECUTE format('GRANT SELECT ON public.%I TO anon, authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('DROP POLICY IF EXISTS "Readable by everyone" ON public.%I', t);
    EXECUTE format('CREATE POLICY "Readable by everyone" ON public.%I FOR SELECT USING (true)', t);
  END LOOP;
  FOREACH t IN ARRAY ARRAY['verification_type_details', 'verification_requirements'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS update_%s_updated_at ON public.%I', t, t);
    EXECUTE format('CREATE TRIGGER update_%s_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()', t, t);
  END LOOP;
END
$rls$;

-- The types a profile with these roles can apply for, in taxonomy order. Only published types.
CREATE OR REPLACE FUNCTION public.verification_types_for(p_roles text[])
RETURNS SETOF text
LANGUAGE sql
STABLE
SET search_path = public
AS $fn$
  SELECT d.type_slug
  FROM public.verification_type_details d
  JOIN public.taxonomy_options o ON o.category_key = 'verification_types' AND o.slug = d.type_slug
  WHERE o.is_published
    AND (d.applies_to_every_profile
         OR (coalesce(cardinality(p_roles), 0) = 0 AND d.applies_without_role)
         OR EXISTS (SELECT 1 FROM public.verification_type_person_types m
                    WHERE m.type_slug = d.type_slug AND m.person_type_slug = ANY (p_roles)))
  ORDER BY o.sort_order, d.type_slug;
$fn$;
REVOKE ALL ON FUNCTION public.verification_types_for(text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verification_types_for(text[]) TO anon, authenticated, service_role;

-- 3. Requests, items, private values
CREATE TABLE IF NOT EXISTS public.verification_requests (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type_slug        text NOT NULL REFERENCES public.verification_type_details (type_slug),
  status           text NOT NULL DEFAULT 'unverified'
                   CHECK (status IN ('unverified', 'in_review', 'verified', 'rejected', 'expired')),
  submitted_at     timestamptz,
  reviewed_at      timestamptz,
  reviewed_by      text,
  expires_at       timestamptz,
  reviewer_note    text,
  rejection_reason text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT verification_requests_id_profile_key UNIQUE (id, profile_id),
  CONSTRAINT verification_requests_id_profile_type_key UNIQUE (id, profile_id, type_slug),
  CONSTRAINT verification_requests_submitted CHECK ((status = 'unverified') = (submitted_at IS NULL)),
  CONSTRAINT verification_requests_reviewed CHECK ((status IN ('verified', 'rejected', 'expired')) = (reviewed_at IS NOT NULL)),
  CONSTRAINT verification_requests_rejection CHECK ((status = 'rejected') = (rejection_reason IS NOT NULL)),
  CONSTRAINT verification_requests_expiry CHECK (expires_at IS NULL OR status IN ('verified', 'expired'))
);
CREATE UNIQUE INDEX IF NOT EXISTS verification_requests_one_open
  ON public.verification_requests (profile_id, type_slug) WHERE status IN ('unverified', 'in_review');
CREATE INDEX IF NOT EXISTS verification_requests_profile_idx ON public.verification_requests (profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS verification_requests_queue_idx ON public.verification_requests (submitted_at) WHERE status = 'in_review';
CREATE INDEX IF NOT EXISTS verification_requests_expiry_idx ON public.verification_requests (expires_at) WHERE status = 'verified';

CREATE TABLE IF NOT EXISTS public.verification_request_items (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id     uuid NOT NULL,
  profile_id     uuid NOT NULL,
  type_slug      text NOT NULL,
  requirement_id uuid NOT NULL,
  kind           text NOT NULL,
  state          text NOT NULL DEFAULT 'uploaded' CHECK (state IN ('uploaded', 'missing', 'rejected')),
  file_path      text,
  file_name      text,
  info_text      text,
  sort_order     int NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT verification_request_items_request_fkey FOREIGN KEY (request_id, profile_id, type_slug)
    REFERENCES public.verification_requests (id, profile_id, type_slug) ON DELETE CASCADE,
  CONSTRAINT verification_request_items_requirement_fkey FOREIGN KEY (requirement_id, type_slug, kind)
    REFERENCES public.verification_requirements (id, type_slug, kind),
  CONSTRAINT verification_request_items_document CHECK (kind = 'document' OR (file_path IS NULL AND file_name IS NULL)),
  CONSTRAINT verification_request_items_info CHECK (kind = 'info' OR info_text IS NULL),
  CONSTRAINT verification_request_items_path CHECK (
    file_path IS NULL OR file_path LIKE profile_id::text || '/' || request_id::text || '/_%')
);
CREATE INDEX IF NOT EXISTS verification_request_items_request_idx
  ON public.verification_request_items (request_id, requirement_id, sort_order);

CREATE TABLE IF NOT EXISTS public.verification_request_private (
  request_id       uuid PRIMARY KEY,
  profile_id       uuid NOT NULL,
  phone            text CHECK (phone ~ '^\\+[1-9][0-9]{7,14}$'),
  id_type_category text NOT NULL DEFAULT 'verification_id_type' CHECK (id_type_category = 'verification_id_type'),
  id_type          text,
  id_number        text CHECK (length(btrim(id_number)) BETWEEN 1 AND 40),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT verification_request_private_request_fkey FOREIGN KEY (request_id, profile_id)
    REFERENCES public.verification_requests (id, profile_id) ON DELETE CASCADE,
  CONSTRAINT verification_request_private_id_type_fkey FOREIGN KEY (id_type_category, id_type)
    REFERENCES public.taxonomy_options (category_key, slug),
  CONSTRAINT verification_request_private_id_number CHECK (id_number IS NULL OR id_type IS NOT NULL)
);

-- 4. Rules
CREATE OR REPLACE FUNCTION public.verification_type_applies(p_profile_id uuid, p_type text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT EXISTS (SELECT 1 FROM public.profiles p
                 CROSS JOIN LATERAL public.verification_types_for(p.roles) AS t(slug)
                 WHERE p.id = p_profile_id AND t.slug = p_type
                   AND (p.id = auth.uid() OR coalesce(auth.jwt() ->> 'role', '') NOT IN ('authenticated', 'anon')));
$fn$;

CREATE OR REPLACE FUNCTION public.verification_prerequisite_met(p_profile_id uuid, p_type text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT d.prerequisite_slug IS NULL
      OR EXISTS (SELECT 1 FROM public.verification_requests r
                 WHERE r.profile_id = p_profile_id AND r.type_slug = d.prerequisite_slug
                   AND r.status = 'verified' AND (r.expires_at IS NULL OR r.expires_at > now()))
  FROM public.verification_type_details d
  WHERE d.type_slug = p_type
    AND (p_profile_id = auth.uid() OR coalesce(auth.jwt() ->> 'role', '') NOT IN ('authenticated', 'anon'));
$fn$;

-- Labels of the required requirements a request does not meet yet.
CREATE OR REPLACE FUNCTION public.verification_request_missing(p_request_id uuid)
RETURNS text[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT coalesce(array_agg(q.label ORDER BY q.sort_order), '{}')
  FROM public.verification_requests r
  JOIN public.verification_requirements q ON q.type_slug = r.type_slug AND NOT q.is_optional
  WHERE r.id = p_request_id
    AND (r.profile_id = auth.uid() OR coalesce(auth.jwt() ->> 'role', '') NOT IN ('authenticated', 'anon'))
    AND NOT CASE
      WHEN q.private_field = 'phone' THEN EXISTS (
        SELECT 1 FROM public.verification_request_private v WHERE v.request_id = r.id AND v.phone IS NOT NULL)
      ELSE EXISTS (
        SELECT 1 FROM public.verification_request_items i
        WHERE i.request_id = r.id AND i.requirement_id = q.id AND i.state = 'uploaded'
          AND (i.file_path IS NOT NULL OR nullif(btrim(i.info_text), '') IS NOT NULL))
    END;
$fn$;

REVOKE ALL ON FUNCTION public.verification_type_applies(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.verification_prerequisite_met(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.verification_request_missing(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.verification_type_applies(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.verification_prerequisite_met(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.verification_request_missing(uuid) TO authenticated, service_role;

-- Signed-in and anonymous callers: a request starts as a draft for a type that applies, and its only
-- status change is submitting it. The review fields are MusicLinkd's.
CREATE OR REPLACE FUNCTION public.verification_requests_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $fn$
DECLARE
  v_missing text[];
BEGIN
  IF TG_OP = 'UPDATE' THEN
    NEW.updated_at := now();
  END IF;
  IF coalesce(auth.jwt() ->> 'role', '') NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.status <> 'unverified' OR NEW.submitted_at IS NOT NULL OR NEW.reviewed_at IS NOT NULL
       OR NEW.reviewed_by IS NOT NULL OR NEW.expires_at IS NOT NULL OR NEW.reviewer_note IS NOT NULL
       OR NEW.rejection_reason IS NOT NULL THEN
      RAISE EXCEPTION 'a verification request starts as a draft; its status and review are set by MusicLinkd';
    END IF;
    IF NOT public.verification_type_applies(NEW.profile_id, NEW.type_slug) THEN
      RAISE EXCEPTION 'verification type % does not apply to this profile', NEW.type_slug;
    END IF;
    IF NOT public.verification_prerequisite_met(NEW.profile_id, NEW.type_slug) THEN
      RAISE EXCEPTION '%', (SELECT locked_reason FROM public.verification_type_details WHERE type_slug = NEW.type_slug);
    END IF;
    RETURN NEW;
  END IF;

  IF (NEW.id, NEW.profile_id, NEW.type_slug, NEW.reviewed_at, NEW.reviewed_by, NEW.expires_at, NEW.reviewer_note,
      NEW.rejection_reason, NEW.created_at)
     IS DISTINCT FROM
     (OLD.id, OLD.profile_id, OLD.type_slug, OLD.reviewed_at, OLD.reviewed_by, OLD.expires_at, OLD.reviewer_note,
      OLD.rejection_reason, OLD.created_at) THEN
    RAISE EXCEPTION 'the review of a verification request is set by MusicLinkd';
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NOT (OLD.status = 'unverified' AND NEW.status = 'in_review') THEN
      RAISE EXCEPTION 'a verification request can only be submitted; MusicLinkd sets every other status';
    END IF;
    IF NOT public.verification_type_applies(NEW.profile_id, NEW.type_slug) THEN
      RAISE EXCEPTION 'verification type % does not apply to this profile', NEW.type_slug;
    END IF;
    IF NOT public.verification_prerequisite_met(NEW.profile_id, NEW.type_slug) THEN
      RAISE EXCEPTION '%', (SELECT locked_reason FROM public.verification_type_details WHERE type_slug = NEW.type_slug);
    END IF;
    v_missing := public.verification_request_missing(NEW.id);
    IF cardinality(v_missing) > 0 THEN
      RAISE EXCEPTION 'verification request is missing: %', array_to_string(v_missing, ', ');
    END IF;
    NEW.submitted_at := now();
  ELSIF NEW.submitted_at IS DISTINCT FROM OLD.submitted_at THEN
    RAISE EXCEPTION 'submitted_at is set when the request is submitted';
  END IF;
  RETURN NEW;
END
$fn$;

DROP TRIGGER IF EXISTS verification_requests_guard ON public.verification_requests;
CREATE TRIGGER verification_requests_guard
  BEFORE INSERT OR UPDATE ON public.verification_requests
  FOR EACH ROW EXECUTE FUNCTION public.verification_requests_guard();

-- 5. Trust flags
CREATE OR REPLACE FUNCTION public.verification_sync_trust(p_profile_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_current text[];
  v_lapsed  text[];
  v_grant   text[];
  v_revoke  text[];
  v_verified boolean;
  v_badges  text[];
  p public.profiles;
BEGIN
  IF coalesce(auth.jwt() ->> 'role', '') IN ('authenticated', 'anon') THEN
    RAISE EXCEPTION 'trust flags are set by MusicLinkd';
  END IF;
  SELECT * INTO p FROM public.profiles WHERE id = p_profile_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  SELECT coalesce(array_agg(DISTINCT r.type_slug), '{}') INTO v_current
  FROM public.verification_requests r
  WHERE r.profile_id = p_profile_id AND r.status = 'verified' AND (r.expires_at IS NULL OR r.expires_at > now());
  SELECT coalesce(array_agg(DISTINCT r.type_slug), '{}') INTO v_lapsed
  FROM public.verification_requests r
  WHERE r.profile_id = p_profile_id
    AND (r.status = 'expired' OR (r.status = 'verified' AND r.expires_at <= now()))
    AND NOT (r.type_slug = ANY (v_current));

  v_verified := CASE
    WHEN EXISTS (SELECT 1 FROM public.verification_type_details d WHERE d.grants_is_verified AND d.type_slug = ANY (v_current)) THEN true
    WHEN EXISTS (SELECT 1 FROM public.verification_type_details d WHERE d.grants_is_verified AND d.type_slug = ANY (v_lapsed)) THEN false
    ELSE p.is_verified END;

  SELECT coalesce(array_agg(DISTINCT d.trust_badge_slug), '{}') INTO v_grant
  FROM public.verification_type_details d
  WHERE d.trust_badge_slug IS NOT NULL AND d.type_slug = ANY (v_current);
  SELECT coalesce(array_agg(DISTINCT d.trust_badge_slug), '{}') INTO v_revoke
  FROM public.verification_type_details d
  WHERE d.trust_badge_slug IS NOT NULL AND d.type_slug = ANY (v_lapsed) AND NOT (d.trust_badge_slug = ANY (v_grant));

  SELECT coalesce(array_agg(x ORDER BY o), '{}') INTO v_badges
  FROM (SELECT u.x, u.o FROM unnest(p.trust_badges) WITH ORDINALITY AS u(x, o) WHERE NOT (u.x = ANY (v_revoke))
        UNION ALL
        SELECT g.x, 1000000 + g.o FROM unnest(v_grant) WITH ORDINALITY AS g(x, o) WHERE NOT (g.x = ANY (p.trust_badges))) s;

  IF (v_verified, v_badges) IS DISTINCT FROM (p.is_verified, p.trust_badges) THEN
    UPDATE public.profiles SET is_verified = v_verified, trust_badges = v_badges WHERE id = p_profile_id;
  END IF;
END
$fn$;

CREATE OR REPLACE FUNCTION public.verification_requests_sync_trust()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  IF coalesce(auth.jwt() ->> 'role', '') IN ('authenticated', 'anon') THEN
    RETURN NULL;  -- a signed-in owner's draft, submission or withdrawal changes no trust flag
  END IF;
  IF TG_OP = 'DELETE' THEN
    PERFORM public.verification_sync_trust(OLD.profile_id);
  ELSE
    PERFORM public.verification_sync_trust(NEW.profile_id);
  END IF;
  RETURN NULL;
END
$fn$;

DROP TRIGGER IF EXISTS verification_requests_sync_trust ON public.verification_requests;
CREATE TRIGGER verification_requests_sync_trust
  AFTER INSERT OR UPDATE OR DELETE ON public.verification_requests
  FOR EACH ROW EXECUTE FUNCTION public.verification_requests_sync_trust();

-- MusicLinkd's decision on a request.
CREATE OR REPLACE FUNCTION public.verification_decide(
  p_request_id uuid,
  p_status text,
  p_rejection_reason text DEFAULT NULL,
  p_reviewer_note text DEFAULT NULL,
  p_reviewed_by text DEFAULT NULL,
  p_expires_at timestamptz DEFAULT NULL
)
RETURNS public.verification_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  r public.verification_requests;
BEGIN
  IF coalesce(auth.jwt() ->> 'role', '') IN ('authenticated', 'anon') THEN
    RAISE EXCEPTION 'verification decisions are made by MusicLinkd';
  END IF;
  SELECT * INTO r FROM public.verification_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'verification request % not found', p_request_id;
  END IF;
  IF NOT ((r.status = 'in_review' AND p_status IN ('verified', 'rejected')) OR (r.status = 'verified' AND p_status = 'expired')) THEN
    RAISE EXCEPTION 'a verification request cannot move from % to %', r.status, p_status;
  END IF;
  IF p_status = 'rejected' AND nullif(btrim(p_rejection_reason), '') IS NULL THEN
    RAISE EXCEPTION 'a rejected verification request needs a reason';
  END IF;
  IF p_status = 'verified' AND p_expires_at IS NOT NULL AND p_expires_at <= now() THEN
    RAISE EXCEPTION 'expires_at must be in the future';
  END IF;

  UPDATE public.verification_requests SET
    status           = p_status,
    reviewed_at      = CASE WHEN p_status = 'expired' THEN reviewed_at ELSE now() END,
    reviewed_by      = CASE WHEN p_status = 'expired' THEN reviewed_by ELSE p_reviewed_by END,
    reviewer_note    = CASE WHEN p_status = 'expired' THEN reviewer_note ELSE p_reviewer_note END,
    rejection_reason = CASE WHEN p_status = 'rejected' THEN p_rejection_reason END,
    expires_at       = CASE WHEN p_status = 'verified' THEN p_expires_at
                            WHEN p_status = 'expired' THEN least(coalesce(expires_at, now()), now()) END
  WHERE id = p_request_id
  RETURNING * INTO r;
  RETURN r;
END
$fn$;

-- Verified requests past expires_at become expired. Returns how many.
CREATE OR REPLACE FUNCTION public.verification_expire_due()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_count int;
BEGIN
  IF coalesce(auth.jwt() ->> 'role', '') IN ('authenticated', 'anon') THEN
    RAISE EXCEPTION 'verification requests are expired by MusicLinkd';
  END IF;
  UPDATE public.verification_requests SET status = 'expired'
  WHERE status = 'verified' AND expires_at <= now();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END
$fn$;

REVOKE ALL ON FUNCTION public.verification_sync_trust(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.verification_decide(uuid, text, text, text, text, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.verification_expire_due() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.verification_requests_guard() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.verification_requests_sync_trust() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verification_sync_trust(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.verification_decide(uuid, text, text, text, text, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.verification_expire_due() TO service_role;

-- 6. Row level security: owners only
DO $rls$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['verification_requests', 'verification_request_items', 'verification_request_private'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
  END LOOP;
  FOREACH t IN ARRAY ARRAY['verification_request_items', 'verification_request_private'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS update_%s_updated_at ON public.%I', t, t);
    EXECUTE format('CREATE TRIGGER update_%s_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()', t, t);
  END LOOP;
END
$rls$;

DROP POLICY IF EXISTS "Owners read their own requests" ON public.verification_requests;
CREATE POLICY "Owners read their own requests" ON public.verification_requests
  FOR SELECT TO authenticated USING (auth.uid() = profile_id);
DROP POLICY IF EXISTS "Owners start their own requests" ON public.verification_requests;
CREATE POLICY "Owners start their own requests" ON public.verification_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = profile_id);
DROP POLICY IF EXISTS "Owners edit and submit their drafts" ON public.verification_requests;
CREATE POLICY "Owners edit and submit their drafts" ON public.verification_requests
  FOR UPDATE TO authenticated USING (auth.uid() = profile_id AND status = 'unverified')
  WITH CHECK (auth.uid() = profile_id);
DROP POLICY IF EXISTS "Owners withdraw drafts and requests in review" ON public.verification_requests;
CREATE POLICY "Owners withdraw drafts and requests in review" ON public.verification_requests
  FOR DELETE TO authenticated USING (auth.uid() = profile_id AND status IN ('unverified', 'in_review'));

DO $rls$
DECLARE
  t text;
  v_draft text := 'auth.uid() = profile_id AND EXISTS (SELECT 1 FROM public.verification_requests r WHERE r.id = request_id AND r.profile_id = auth.uid() AND r.status = ''unverified'')';
BEGIN
  FOREACH t IN ARRAY ARRAY['verification_request_items', 'verification_request_private'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Owners read their own" ON public.%I', t);
    EXECUTE format('CREATE POLICY "Owners read their own" ON public.%I FOR SELECT TO authenticated USING (auth.uid() = profile_id)', t);
    EXECUTE format('DROP POLICY IF EXISTS "Owners add to a draft" ON public.%I', t);
    EXECUTE format('CREATE POLICY "Owners add to a draft" ON public.%I FOR INSERT TO authenticated WITH CHECK (%s%s)', t, v_draft,
                   CASE WHEN t = 'verification_request_items' THEN ' AND state <> ''rejected''' ELSE '' END);
    EXECUTE format('DROP POLICY IF EXISTS "Owners change a draft" ON public.%I', t);
    EXECUTE format('CREATE POLICY "Owners change a draft" ON public.%I FOR UPDATE TO authenticated USING (%s) WITH CHECK (%s%s)', t, v_draft, v_draft,
                   CASE WHEN t = 'verification_request_items' THEN ' AND state <> ''rejected''' ELSE '' END);
    EXECUTE format('DROP POLICY IF EXISTS "Owners remove from a draft" ON public.%I', t);
    EXECUTE format('CREATE POLICY "Owners remove from a draft" ON public.%I FOR DELETE TO authenticated USING (%s)', t, v_draft);
  END LOOP;
END
$rls$;

-- 7. Private document bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
  ('verification-documents', 'verification-documents', false, 10485760,
   ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "Owners read their verification documents" ON storage.objects;
CREATE POLICY "Owners read their verification documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'verification-documents'
         AND (storage.foldername(name))[1] = (SELECT auth.uid()::text));

DROP POLICY IF EXISTS "Owners upload verification documents to a draft" ON storage.objects;
CREATE POLICY "Owners upload verification documents to a draft"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'verification-documents'
              AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
              AND EXISTS (SELECT 1 FROM public.verification_requests r
                          WHERE r.id::text = (storage.foldername(name))[2]
                            AND r.profile_id = (SELECT auth.uid()) AND r.status = 'unverified'));

DROP POLICY IF EXISTS "Owners replace verification documents in a draft" ON storage.objects;
CREATE POLICY "Owners replace verification documents in a draft"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'verification-documents'
         AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
         AND EXISTS (SELECT 1 FROM public.verification_requests r
                     WHERE r.id::text = (storage.foldername(name))[2]
                       AND r.profile_id = (SELECT auth.uid()) AND r.status = 'unverified'))
  WITH CHECK (bucket_id = 'verification-documents'
              AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
              AND EXISTS (SELECT 1 FROM public.verification_requests r
                          WHERE r.id::text = (storage.foldername(name))[2]
                            AND r.profile_id = (SELECT auth.uid()) AND r.status = 'unverified'));

DROP POLICY IF EXISTS "Owners delete verification documents of a draft or withdrawn request" ON storage.objects;
CREATE POLICY "Owners delete verification documents of a draft or withdrawn request"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'verification-documents'
         AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
         AND NOT EXISTS (SELECT 1 FROM public.verification_requests r
                         WHERE r.id::text = (storage.foldername(name))[2] AND r.status <> 'unverified'));

DO $verify$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'verification-documents' AND public = false) THEN
    RAISE EXCEPTION 'verification-documents bucket is missing or public';
  END IF;
END
$verify$;
""".replace("@TYPES@", json.dumps(type_labels, ensure_ascii=False, separators=(",", ":")))

REQUIREMENTS_BODY = upsert("verification_requirements", requirements, "id") + """

  -- Requirements the app no longer has, unless a request already uses them.
  DELETE FROM public.verification_requirements q
  WHERE q.type_slug IN (SELECT DISTINCT r.type_slug FROM @RS@)
    AND q.id NOT IN (SELECT r.id FROM @RS@)
    AND NOT EXISTS (SELECT 1 FROM public.verification_request_items i WHERE i.requirement_id = q.id);
  IF EXISTS (SELECT 1 FROM public.verification_requirements q
             WHERE q.type_slug IN (SELECT DISTINCT r.type_slug FROM @RS@)
               AND q.id NOT IN (SELECT r.id FROM @RS@)) THEN
    RAISE NOTICE 'verification_requirements: requirements no longer in the app are kept because requests use them';
  END IF;""".replace("@RS@", recordset(list(requirements[0].keys())))

PERSON_TYPES_BODY = f"""  IF EXISTS (SELECT 1 FROM {recordset(["type_slug", "person_type_slug"])}
             WHERE NOT EXISTS (SELECT 1 FROM public.taxonomy_options o
                               WHERE o.category_key = 'person_types' AND o.slug = r.person_type_slug)) THEN
    RAISE EXCEPTION 'verification_type_person_types: a person type is not in the taxonomy';
  END IF;
""" + insert_missing("verification_type_person_types", type_person_types, "type_slug, person_type_slug")

verification_blocks = [
    block("verification_type_details", details, upsert("verification_type_details", details, "type_slug")),
    block("verification_requirements", requirements, REQUIREMENTS_BODY),
    block("verification_type_person_types", type_person_types, PERSON_TYPES_BODY),
]

with open(OUT_VERIFICATION, "w", encoding="utf-8") as f:
    f.write(VERIFICATION_HEADER + VERIFICATION_SCHEMA + "\n" + "\n".join(verification_blocks))

# =============================================================================================
# Report
# =============================================================================================
print(f"person_type_service_categories: {len(person_type_services)} rows; service_category_specialties: "
      f"{len(service_specialties)}; profile_services backfill: {len(backfill)} rows "
      f"({sum(1 for b in backfill if b['category'])} with category, "
      f"{sum(1 for b in backfill if b['pricing_model'])} with pricing model)")
print(f"myServices: {'seeded for ' + SERVICES_OWNER if SERVICES_OWNER else 'not seeded (no owner)'}: "
      f"{len(DATA['myServices'])} services, {sum(len(s['packages']) for s in DATA['myServices'])} packages, "
      f"{sum(len(s['addons']) for s in DATA['myServices'])} add-ons")
print(f"verification: {len(details)} types, {len(requirements)} requirements, {len(type_person_types)} eligibility rows")
for line in report:
    print(line)
