"""Generates two migrations: the demo business accounts, and bands (tables, the demo bands and The
Bangalore Blues Project as a band group of existing talent profiles).

Usage (repo root):
  bun run supabase/generators/export_demo_groups.ts > /tmp/groups.json
  python3 supabase/generators/import_groups.py /tmp/groups.json \
    supabase/migrations/20260915120000_business_accounts.sql supabase/migrations/20260915130000_bands.sql

Owner decisions of 15 Sep 2026: a business is an account (profile + sign-in-less auth user, one
username namespace with people); a band is not an account and has no username, it is a group of
existing talent profiles. Same uuid namespace as import_profiles.py.
"""
from __future__ import annotations

import datetime
import json
import re
import sys
import uuid

from taxonomy_renames import single_names

GROUPS, OUT_BUSINESS, OUT_BANDS = sys.argv[1:4]
NS = uuid.UUID("5b1b2f0e-3c1a-4f6e-9d3a-6d1c2b7e9a10")  # same namespace as import_profiles.py


def uid(key: str) -> str:
    return str(uuid.uuid5(NS, key))


DATA = json.load(open(GROUPS, encoding="utf-8"))
RULES = open("supabase/migrations/20260914200000_username_rules.sql", encoding="utf-8").read()
RESERVED = set(re.findall(r"\('([a-z0-9._]+)', '(?:brand|staff|system|route)'\)", RULES))
assert "business" in RESERVED and "bands" in RESERVED, "reserved list not parsed"
USERNAME = re.compile(r"^[a-z0-9._]{3,30}$")
problems: list[str] = []

# Business type in src/data/business.ts -> person_types slug (the business types onboarding offers,
# as import_profiles.py maps Firebase business types). The migration refuses a slug the taxonomy lacks.
BUSINESS_ROLE = {"studio": "studio", "label": "music_label", "production_house": "production_house",
                 "venue": "venue", "agency": "booking_agency", "rental": "rental_provider"}
MEMBER_ROLE = {"owner": "Owner", "manager": "Manager", "engineer": "Engineer", "staff": "Staff"}
PRICE_UNIT = {"hour": "hr", "song": "song", "show": "show", "day": "day", "track": "track"}


def price(raw, ref: str):
    """{amount: '₹2,500', unit: 'hour'} (or '₹2,500 per hour' / '₹2,500 / hour') -> (250000, 'hr')."""
    if isinstance(raw, dict):
        raw = f"{raw['amount']} / {raw.get('unit') or ''}"
    m = re.fullmatch(r"₹([\d,]+)\s*(?:per|/)\s*(\w+)", raw.strip())
    if not m or m.group(2) not in PRICE_UNIT:
        problems.append(f"{ref}: price {raw!r} not understood")
        return None, None
    return int(m.group(1).replace(",", "")) * 100, PRICE_UNIT[m.group(2)]


def year(raw: str, ref: str):
    if not re.fullmatch(r"\d{4}", raw or ""):
        problems.append(f"{ref}: year {raw!r} not understood")
        return None
    return int(raw)


# ---------------------------------------------------------------------------------------------
# Businesses
# ---------------------------------------------------------------------------------------------

accounts, business_rows, services, gallery, team, studios, rooms, reviews, credits = ([] for _ in range(9))
usernames: list[str] = []

for b in DATA["businesses"]:
    ref = f"business {b['id']}"
    pid = uid(f"demo:business/{b['id']}")
    name = b["handle"].replace("-", ".")  # usernames are [a-z0-9._] (20260914200000_username_rules)
    if not USERNAME.fullmatch(name) or name in RESERVED:
        problems.append(f"{ref}: username {name!r} is invalid or reserved")
    usernames.append(name)
    accounts.append({
        "id": pid, "username": name, "display_name": b["name"], "headline": b["tagline"] or None,
        "bio": b["about"] or None, "city": b["city"] or None, "roles": [BUSINESS_ROLE[b["type"]]],
        "avatar_url": b["logo"] or None, "cover_url": b["cover"] or None, "visibility": "public",
        "is_verified": b["verified"],
    })
    business_rows.append({
        "profile_id": pid, "business_address": b["address"] or None,
        # One line per day, "Day: hours"; business-view.ts splits them back.
        "operating_hours": "\n".join(f"{h['day']}: {h['hours']}" for h in b["hours"]) or None,
        "logo_url": b["logo"] or None, "hero_banner_url": b["cover"] or None,
        "founded_year": year(b["founded"], ref),
    })
    for i, g in enumerate(b["gallery"]):
        gallery.append({"id": uid(f"demo:business/{b['id']}/gallery/{i}"), "profile_id": pid, "image_url": g,
                        "sort_order": i})
    for i, s in enumerate(b["services"]):
        amount, unit = price(s["price"], f"{ref} service {s['id']}")
        services.append({"id": uid(f"demo:business/{b['id']}/service/{s['id']}"), "profile_id": pid,
                         "name": s["label"], "price_paise": amount, "price_unit": unit, "sort_order": i})
    for i, m in enumerate(x for x in b["members"] if x["status"] != "removed"):
        team.append({"id": uid(f"demo:business/{b['id']}/member/{m['id']}"), "profile_id": pid, "kind": "team",
                     "name": m["name"], "role": MEMBER_ROLE[m["role"]], "photo_url": m["photo"] or None,
                     "since_year": year(m["since"], f"{ref} member {m['id']}"), "status": m["status"],
                     "is_leader": False, "sort_order": i})
    if b["spaces"]:
        sid = uid(f"demo:business/{b['id']}/studio")
        studios.append({
            "id": sid, "owner_profile_id": pid, "slug": b["handle"], "name": b["name"],
            "description": b["about"] or None, "location": b["address"] or None, "rating": b["stats"]["rating"],
            "review_count": b["stats"]["reviews"],
            "operating_hours": business_rows[-1]["operating_hours"], "image_url": b["cover"] or None,
            "images": b["gallery"],
        })
        for i, sp in enumerate(b["spaces"]):
            amount, unit = price(sp["rate"], f"{ref} space {sp['id']}")
            if unit != "hr":
                problems.append(f"{ref} space {sp['id']}: rate is not hourly")
            cap = re.fullmatch(r"(\d+) musicians?", sp["capacity"])
            if not cap:
                problems.append(f"{ref} space {sp['id']}: capacity {sp['capacity']!r} not understood")
            rooms.append({"id": uid(f"demo:business/{b['id']}/space/{sp['id']}"), "studio_id": sid,
                          "name": sp["name"], "kind": sp["kind"] or None,
                          "capacity": int(cap.group(1)) if cap else None, "hourly_rate_paise": amount,
                          "gear": sp["gear"], "photo_url": sp["photo"] or None, "sort_order": i})
    for i, c in enumerate(b["credits"]):
        what, _, when = c["meta"].rpartition(" · ")
        credits.append({"id": uid(f"demo:business/{b['id']}/credit/{i}"), "user_id": pid, "title": c["title"],
                        "kind": "credit", "role": what or None, "release_year": year(when, f"{ref} credit {i}"),
                        "published": True, "sort_order": i})

# The business reviews in src/data/business.ts belong to the one demo business (biz-1).
REVIEWS_OF = "biz-1"
assert [b["id"] for b in DATA["businesses"]] == [REVIEWS_OF], "reviews need an owner"

# ---------------------------------------------------------------------------------------------
# Bands
# ---------------------------------------------------------------------------------------------

AVAILABILITY = {"Available": "available", "Selective": "selective", "Booked": "booked"}
RELEASE_KIND = {"Single": "single", "EP": "ep", "Album": "album", "Live": "live"}
MONTHS = {m: i for i, m in enumerate(["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct",
                                      "Nov", "Dec"], 1)}


def show_date(raw: str, ref: str):
    """'Sat 19 Sep · 9:00 PM' -> ('2026-09-19', '21:00', 'day'): the weekday fixes the year (2025-2027).
    'Feb 2026' -> ('2026-02-01', None, 'month')."""
    m = re.fullmatch(r"(\w{3}) (\d{1,2}) (\w{3})(?: · (\d{1,2}):(\d{2}) (AM|PM))?", raw)
    if m:
        day, month = int(m.group(2)), MONTHS[m.group(3)]
        years = [y for y in (2025, 2026, 2027) if datetime.date(y, month, day).strftime("%a") == m.group(1)]
        if len(years) != 1:
            problems.append(f"{ref}: {raw!r} matches years {years}")
            return None, None, "day"
        time = None
        if m.group(4):
            hour = int(m.group(4)) % 12 + (12 if m.group(6) == "PM" else 0)
            time = f"{hour:02d}:{m.group(5)}"
        return f"{years[0]}-{month:02d}-{day:02d}", time, "day"
    m = re.fullmatch(r"(\w{3}) (\d{4})", raw)
    if m and m.group(1) in MONTHS:
        return f"{m.group(2)}-{MONTHS[m.group(1)]:02d}-01", None, "month"
    problems.append(f"{ref}: date {raw!r} not understood")
    return None, None, "day"


band_rows, demo_members, events, releases = [], [], [], []
for band in DATA["bands"]:
    ref = f"band {band['id']}"
    bid = uid(f"demo:band/{band['id']}")
    amount, unit = price(band["rate"], ref)
    band_rows.append({
        "id": bid, "slug": band["id"], "name": band["name"], "tagline": band["tagline"] or None,
        "bio": band["bio"] or None, "genres": band["genres"], "city": band["city"] or None,
        "formed_year": year(band["formed"], ref), "avatar_url": band["avatar"] or None,
        "cover_url": band["cover"] or None, "looking_for": band["lookingFor"],
        "availability": AVAILABILITY[band["availability"]], "rate_paise": amount, "rate_unit": unit,
        "is_verified": band["verified"],
    })
    for i, m in enumerate(band["members"]):
        # Resolved when the migration runs: the demo member's username (talent id, hyphens as dots)
        # and display name must both match one profile.
        demo_members.append({"band_id": bid, "username": m["userId"].replace("-", "."), "display_name": m["name"],
                             "role": m["role"], "instrument": m["instrument"] or None,
                             "since_year": year(m["since"], f"{ref} member {m['userId']}"), "sort_order": i})
    for i, e in enumerate(band["events"]):
        date, time, precision = show_date(e["date"], f"{ref} event {e['id']}")
        events.append({"id": uid(f"demo:band/{band['id']}/event/{e['id']}"), "band_id": bid, "title": e["title"],
                       "venue": e["venue"] or None, "city": e["city"] or None, "event_date": date,
                       "event_time": time, "date_precision": precision,
                       # "past" is not stored: it follows from the date.
                       "status": e["status"] if e["status"] in ("confirmed", "hold") else None,
                       "ticket_note": e.get("ticketNote") or None, "sort_order": i})
    for i, r in enumerate(band["releases"]):
        releases.append({"id": uid(f"demo:band/{band['id']}/release/{r['id']}"), "band_id": bid, "title": r["title"],
                         "kind": RELEASE_KIND[r["kind"]], "release_year": r["year"], "cover_url": r["cover"] or None,
                         "sort_order": i})

# The Bangalore Blues Project: Firebase's band account (profile c2b4edcd-...). Owner, 15 Sep: a band
# group, not an account. Name, headline, bio, city, genres, avatar and cover are copied from the
# profile when the migration runs (the taxonomy migration may have renamed its genre slugs); its shows
# are copied from profile_events. The profile, its line-up names, shows and portfolio stay as they are.
BBP_PROFILE = str(uuid.uuid5(NS, "firebase:users/mock-band-the-bangalore-blues-project"))
assert BBP_PROFILE == "c2b4edcd-eb80-5a4f-86d8-35a2a5a88ad6", BBP_PROFILE
BBP = uid("band:the-bangalore-blues-project")
BBP_SOURCE = [{"id": BBP, "slug": "the-bangalore-blues-project", "source_profile_id": BBP_PROFILE}]
BBP_EVENT_SOURCES = ["a407c423-e464-51be-b78b-0512faee6418", "828db50e-5fc7-576b-804c-4014fd9d5519",
                     "2634c7b4-9376-5977-8c8a-c1049e363bb4"]
BBP_EVENTS = [{"id": uid(f"band:the-bangalore-blues-project/event/{src}"), "band_id": BBP, "source_event_id": src}
              for src in BBP_EVENT_SOURCES]
# One existing talent profile per line-up slot (profile_members kind 'lineup', read 15 Sep 2026):
# Bengaluru-based, not a business, not the band account, none used twice. The line-up role is kept as
# the member's instrument; the leader is the owner.
BBP_MEMBERS = [
    # Vikram Kumar, Lead Vocalist & Slide Guitar (leader): roles singer + guitarist.
    ("388fbd0a-9c57-5f5d-84e7-45a43890c4a8", "arnav.desai", "Lead Vocalist & Slide Guitar", "owner"),
    # Sharon D'Souza, Keyboards & Hammond B3: role keyboardist.
    ("9078142e-bb3a-59c1-b330-2c9bb54af016", "arjun.kapoor", "Keyboards & Hammond B3", "member"),
    # Abhinav Das, Alto Saxophone: the only talent profile with saxophone.
    ("41bb93a2-c008-5cd9-8527-df24dd257435", "zara.desai", "Alto Saxophone", "member"),
    # Rohit Raj, Double Bass: bass guitar, Bengaluru (arjun.kapoor already holds keys).
    ("472ea245-75bc-42ee-8fbb-db6d571ee5d0", "kabirmenon", "Double Bass", "member"),
    # Siddharth M., Drums & Percussion: role drummer.
    ("d7b2a092-5bed-5b7b-8789-77faad938c7c", "arnav.gupta", "Drums & Percussion", "member"),
]
assert len({m[0] for m in BBP_MEMBERS}) == len(BBP_MEMBERS)
bbp_members = [{"band_id": BBP, "profile_id": pid, "username": name, "role": role, "instrument": instrument,
                "since_year": None, "sort_order": i} for i, (pid, name, instrument, role) in enumerate(BBP_MEMBERS)]

if problems:
    sys.exit("Problems:\n" + "\n".join(problems))

# ---------------------------------------------------------------------------------------------
# SQL
# ---------------------------------------------------------------------------------------------

TYPES = {"id": "uuid", "profile_id": "uuid", "user_id": "uuid", "studio_id": "uuid", "owner_profile_id": "uuid",
         "target_profile_id": "uuid", "band_id": "uuid", "source_profile_id": "uuid", "source_event_id": "uuid",
         "price_paise": "bigint", "hourly_rate_paise": "bigint", "rate_paise": "bigint", "rating": "numeric",
         "review_count": "int", "capacity": "int", "sort_order": "int", "founded_year": "int", "since_year": "int",
         "formed_year": "int", "release_year": "int", "is_verified": "boolean", "is_leader": "boolean",
         "published": "boolean", "roles": "text[]", "images": "text[]", "gear": "text[]", "genres": "text[]",
         "looking_for": "text[]", "event_date": "date", "event_time": "time"}


def recordset(cols):
    return "jsonb_to_recordset(payload) AS r(" + ", ".join(f"{c} {TYPES.get(c, 'text')}" for c in cols) + ")"


def upsert(table, rows, key):
    cols = list(rows[0].keys())
    keys = [k.strip() for k in key.split(",")]
    rs = recordset(cols)
    return f"""  INSERT INTO public.{table} ({", ".join(cols)})
  SELECT {", ".join("r." + c for c in cols)} FROM {rs}
  ON CONFLICT ({key}) DO UPDATE SET {", ".join(f"{c} = EXCLUDED.{c}" for c in cols if c not in keys)};

  IF (SELECT count(*) FROM {rs} JOIN public.{table} t ON {" AND ".join(f"t.{k} = r.{k}" for k in keys)}
      WHERE ({", ".join("t." + c for c in cols)}) IS NOT DISTINCT FROM ({", ".join("r." + c for c in cols)}))
     <> jsonb_array_length(payload) THEN
    RAISE EXCEPTION '{table} import: stored rows differ from the payload';
  END IF;"""


def no_old_labels(value):
    """Text without "/" (owner, 15 Sep 2026): an old combined option label becomes its single label."""
    if isinstance(value, str):
        return single_names(value)
    if isinstance(value, list):
        return [no_old_labels(v) for v in value]
    if isinstance(value, dict):
        return {k: no_old_labels(v) for k, v in value.items()}
    return value


def block(label, rows, body):
    payload = json.dumps(no_old_labels(rows), ensure_ascii=False, separators=(",", ":"))
    assert "$json$" not in payload
    return (f"-- {label} ({len(rows)} rows)\nDO $import$\nDECLARE\n  payload jsonb := $json${payload}$json$;\n"
            f"BEGIN\n{body}\nEND\n$import$;\n")


ACCOUNT_COLS = list(accounts[0].keys())
ACCOUNT_BODY = f"""  -- A business username is in the same namespace as talent's: refuse a reserved or taken name, and
  -- a business type the taxonomy does not have.
  IF EXISTS (SELECT 1 FROM {recordset(ACCOUNT_COLS)} JOIN public.reserved_usernames x ON x.name = r.username) THEN
    RAISE EXCEPTION 'business accounts: a username is reserved';
  END IF;
  IF EXISTS (SELECT 1 FROM {recordset(ACCOUNT_COLS)} JOIN public.profiles p
             ON lower(p.username) = lower(r.username) AND p.id <> r.id) THEN
    RAISE EXCEPTION 'business accounts: a username is already taken by another profile';
  END IF;
  IF EXISTS (SELECT 1 FROM {recordset(ACCOUNT_COLS)}, unnest(r.roles) AS x(slug)
             WHERE NOT EXISTS (SELECT 1 FROM public.taxonomy_options o
                               WHERE o.category_key = 'person_types' AND o.slug = x.slug)) THEN
    RAISE EXCEPTION 'business accounts: a business type has no person_types option';
  END IF;

  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, raw_app_meta_data,
    raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, is_sso_user, is_anonymous)
  SELECT '00000000-0000-0000-0000-000000000000', r.id, 'authenticated', 'authenticated', NULL, NULL, '{{}}'::jsonb,
    jsonb_build_object('full_name', r.display_name, 'avatar_url', r.avatar_url), now(), now(), '', '', '', '', false, false
  FROM {recordset(ACCOUNT_COLS)}
  ON CONFLICT (id) DO NOTHING;

  -- on_auth_user_created has made a bare profile for each; fill it.
  INSERT INTO public.profiles ({", ".join(ACCOUNT_COLS)}, onboarding_complete)
  SELECT {", ".join("r." + c for c in ACCOUNT_COLS)}, true
  FROM {recordset(ACCOUNT_COLS)}
  ON CONFLICT (id) DO UPDATE SET {", ".join(f"{c} = EXCLUDED.{c}" for c in ACCOUNT_COLS if c != "id")},
    onboarding_complete = true;

  IF (SELECT count(*) FROM {recordset(ACCOUNT_COLS)} JOIN public.profiles t ON t.id = r.id
      WHERE ({", ".join("t." + c for c in ACCOUNT_COLS)}) IS NOT DISTINCT FROM ({", ".join("r." + c for c in ACCOUNT_COLS)}))
     <> jsonb_array_length(payload) THEN
    RAISE EXCEPTION 'business accounts: stored profiles differ from the payload';
  END IF;"""

business_blocks = [
    block("business accounts: auth users and profiles", accounts, ACCOUNT_BODY),
    block("profile_business", business_rows, upsert("profile_business", business_rows, "profile_id")),
    block("profile_gallery", gallery, upsert("profile_gallery", gallery, "id")),
    block("profile_services", services, upsert("profile_services", services, "id")),
    block("profile_members (team)", team, upsert("profile_members", team, "id")),
    block("studios", studios, upsert("studios", studios, "id")),
    block("studio_rooms", rooms, upsert("studio_rooms", rooms, "id")),
]
# Review text, rating, author name and reply; the author photo and the relative "2 weeks ago" are not stored.
reviews = [{"id": uid(f"demo:business/{REVIEWS_OF}/review/{r['id']}"), "target_profile_id": accounts[0]["id"],
            "author_name": r["author"], "rating": r["rating"], "body": r["body"], "response": r["response"]}
           for r in DATA["businessReviews"]]
if reviews:
    business_blocks.append(block("reviews of the business", reviews, upsert("reviews", reviews, "id")))
business_blocks.append(block("portfolio_items (credits)", credits, upsert("portfolio_items", credits, "id")))

BUSINESS_SCHEMA = f"""-- Business accounts: the demo businesses from src/data/business.ts as business accounts.
--
-- Generated by supabase/generators/import_groups.py from src/data/business.ts (via
-- supabase/generators/export_demo_groups.ts). Edit the generator, not this file.
--
-- Owner decisions, 15 Sep 2026: MusicLinkd has account kinds: talent (a human) and business (every
-- other account). A business is an account like talent (a profile with a sign-in-less auth.users row, as in
-- 20260914150000_import_profiles.sql), its username in the same namespace; it is a business because it
-- has a profile_business row. The 20 Firebase businesses (19 BUSINESS, 1 VENUE) already have theirs
-- (20260914170000_profile_sections.sql); every business screen reads these tables.
--
-- Schema, for fields the demo business has and the tables did not:
--   profile_business + founded_year
--   profile_members  + photo_url, since_year, status ('active' | 'invited')
--   studio_rooms     + kind, photo_url, gear (free text; amenities stay taxonomy slugs)
--
-- Data: {len(accounts)} business account ({", ".join(usernames)}), with its business details, {len(gallery)} gallery photos,
-- {len(services)} services, {len(team)} team members, {len(studios)} studio with {len(rooms)} rooms, {len(reviews)} reviews and {len(credits)} credits
-- (portfolio_items, kind 'credit').
-- Not stored (no column, or not a fact): followers and bookings counts, contact phone (masked in the
-- demo), email and website, review author photos and dates, the owner's personal username.
-- The migration refuses a reserved or taken username and a business type missing from the taxonomy.
--
-- Each data block re-reads what it wrote and raises on any difference. Idempotent: fixed uuid5 ids.
-- Rollback: DELETE FROM auth.users WHERE id IN ({", ".join(f"'{a['id']}'" for a in accounts)}); (profile rows
-- cascade), then drop the added columns.

ALTER TABLE public.profile_business
  ADD COLUMN IF NOT EXISTS founded_year int CHECK (founded_year BETWEEN 1800 AND 2100);

ALTER TABLE public.profile_members
  ADD COLUMN IF NOT EXISTS photo_url text,
  ADD COLUMN IF NOT EXISTS since_year int CHECK (since_year BETWEEN 1800 AND 2100),
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited'));

ALTER TABLE public.studio_rooms
  ADD COLUMN IF NOT EXISTS kind text,
  ADD COLUMN IF NOT EXISTS photo_url text,
  ADD COLUMN IF NOT EXISTS gear text[] NOT NULL DEFAULT '{{}}';
"""

# Bands ---------------------------------------------------------------------------------------

BANDS_SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS public.bands (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length(slug) <= 60),
  name         text NOT NULL CHECK (length(name) BETWEEN 1 AND 80),
  tagline      text,
  bio          text,
  genres       text[] NOT NULL DEFAULT '{}',
  city         text,
  formed_year  int CHECK (formed_year BETWEEN 1900 AND 2100),
  avatar_url   text,
  cover_url    text,
  looking_for  text[] NOT NULL DEFAULT '{}',
  availability text CHECK (availability IN ('available', 'selective', 'booked')),
  rate_paise   bigint CHECK (rate_paise >= 0),
  rate_unit    text,
  is_verified  boolean NOT NULL DEFAULT false,
  created_by   uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.band_members (
  band_id    uuid NOT NULL REFERENCES public.bands(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role       text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  instrument text,
  since_year int CHECK (since_year BETWEEN 1900 AND 2100),
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (band_id, profile_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS band_members_one_owner ON public.band_members (band_id) WHERE role = 'owner';
CREATE INDEX IF NOT EXISTS band_members_profile_idx ON public.band_members (profile_id);

CREATE TABLE IF NOT EXISTS public.band_events (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id        uuid NOT NULL REFERENCES public.bands(id) ON DELETE CASCADE,
  title          text NOT NULL,
  venue          text,
  city           text,
  event_date     date,
  event_time     time,
  date_precision text NOT NULL DEFAULT 'day' CHECK (date_precision IN ('day', 'month')),
  status         text CHECK (status IN ('confirmed', 'hold')),
  ticket_note    text,
  sort_order     int NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS band_events_band_idx ON public.band_events (band_id, event_date);

CREATE TABLE IF NOT EXISTS public.band_releases (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id      uuid NOT NULL REFERENCES public.bands(id) ON DELETE CASCADE,
  title        text NOT NULL,
  kind         text NOT NULL CHECK (kind IN ('single', 'ep', 'album', 'live')),
  release_year int CHECK (release_year BETWEEN 1900 AND 2100),
  cover_url    text,
  sort_order   int NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS band_releases_band_idx ON public.band_releases (band_id, sort_order);

DROP TRIGGER IF EXISTS update_bands_updated_at ON public.bands;
CREATE TRIGGER update_bands_updated_at BEFORE UPDATE ON public.bands
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- is_verified is granted by MusicLinkd: signed-in and anonymous callers cannot set or change it.
CREATE OR REPLACE FUNCTION public.bands_guard_admin_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $fn$
BEGIN
  IF coalesce(auth.jwt() ->> 'role', '') IN ('authenticated', 'anon')
     AND ((TG_OP = 'INSERT' AND NEW.is_verified)
          OR (TG_OP = 'UPDATE' AND NEW.is_verified IS DISTINCT FROM OLD.is_verified)) THEN
    RAISE EXCEPTION 'is_verified is set by MusicLinkd, not by the band';
  END IF;
  RETURN NEW;
END
$fn$;
DROP TRIGGER IF EXISTS bands_guard_admin_fields ON public.bands;
CREATE TRIGGER bands_guard_admin_fields BEFORE INSERT OR UPDATE ON public.bands
  FOR EACH ROW EXECUTE FUNCTION public.bands_guard_admin_fields();

-- Who may write. SECURITY DEFINER so the policies can read band_members without recursing into its RLS.
CREATE OR REPLACE FUNCTION public.band_can_write(p_band_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT auth.uid() IS NOT NULL AND (
    EXISTS (SELECT 1 FROM public.bands b WHERE b.id = p_band_id AND b.created_by = auth.uid())
    OR EXISTS (SELECT 1 FROM public.band_members m WHERE m.band_id = p_band_id AND m.profile_id = auth.uid()));
$fn$;

CREATE OR REPLACE FUNCTION public.band_can_manage(p_band_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT auth.uid() IS NOT NULL AND (
    EXISTS (SELECT 1 FROM public.bands b WHERE b.id = p_band_id AND b.created_by = auth.uid())
    OR EXISTS (SELECT 1 FROM public.band_members m
               WHERE m.band_id = p_band_id AND m.profile_id = auth.uid() AND m.role IN ('owner', 'admin')));
$fn$;
CREATE OR REPLACE FUNCTION public.band_is_owner(p_band_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT auth.uid() IS NOT NULL AND (
    EXISTS (SELECT 1 FROM public.bands b WHERE b.id = p_band_id AND b.created_by = auth.uid())
    OR EXISTS (SELECT 1 FROM public.band_members m
               WHERE m.band_id = p_band_id AND m.profile_id = auth.uid() AND m.role = 'owner'));
$fn$;
REVOKE ALL ON FUNCTION public.band_is_owner(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.band_is_owner(uuid) TO anon, authenticated;
REVOKE ALL ON FUNCTION public.band_can_write(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.band_can_manage(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.band_can_write(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.band_can_manage(uuid) TO anon, authenticated;

DO $rls$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['bands', 'band_members', 'band_events', 'band_releases'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('GRANT SELECT ON public.%I TO anon, authenticated', t);
    EXECUTE format('GRANT INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
  END LOOP;
END
$rls$;

-- bands: everyone reads; a signed-in person creates one as its creator; the creator and members edit;
-- the creator or the owner deletes.
DROP POLICY IF EXISTS "Readable by everyone" ON public.bands;
CREATE POLICY "Readable by everyone" ON public.bands FOR SELECT USING (true);
DROP POLICY IF EXISTS "Creators insert" ON public.bands;
CREATE POLICY "Creators insert" ON public.bands FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
DROP POLICY IF EXISTS "Creator and members update" ON public.bands;
CREATE POLICY "Creator and members update" ON public.bands FOR UPDATE TO authenticated
  USING (public.band_can_write(id)) WITH CHECK (public.band_can_write(id));
DROP POLICY IF EXISTS "Creator and owner delete" ON public.bands;
CREATE POLICY "Creator and owner delete" ON public.bands FOR DELETE TO authenticated
  USING (public.band_is_owner(id));

-- band_members: readable with the member's profile; the creator, owner and admins change the line-up;
-- a member can leave.
DROP POLICY IF EXISTS "Readable with the member's profile" ON public.band_members;
CREATE POLICY "Readable with the member's profile" ON public.band_members FOR SELECT
  USING (public.profile_is_readable(profile_id));
DROP POLICY IF EXISTS "Managers add" ON public.band_members;
CREATE POLICY "Managers add" ON public.band_members FOR INSERT TO authenticated
  WITH CHECK (public.band_can_manage(band_id));
DROP POLICY IF EXISTS "Managers update" ON public.band_members;
CREATE POLICY "Managers update" ON public.band_members FOR UPDATE TO authenticated
  USING (public.band_can_manage(band_id)) WITH CHECK (public.band_can_manage(band_id));
DROP POLICY IF EXISTS "Managers remove, members leave" ON public.band_members;
CREATE POLICY "Managers remove, members leave" ON public.band_members FOR DELETE TO authenticated
  USING (public.band_can_manage(band_id) OR profile_id = auth.uid());

-- band_events, band_releases: everyone reads; the creator and members write.
DO $rls$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['band_events', 'band_releases'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Readable by everyone" ON public.%I', t);
    EXECUTE format('CREATE POLICY "Readable by everyone" ON public.%I FOR SELECT USING (true)', t);
    EXECUTE format('DROP POLICY IF EXISTS "Creator and members write" ON public.%I', t);
    EXECUTE format('CREATE POLICY "Creator and members write" ON public.%I FOR ALL TO authenticated USING (public.band_can_write(band_id)) WITH CHECK (public.band_can_write(band_id))', t);
  END LOOP;
END
$rls$;
"""

DEMO_MEMBER_COLS = list(demo_members[0].keys())
DEMO_MEMBERS_BODY = f"""  -- Demo members join only a profile whose username and display name both match; the rest are reported.
  INSERT INTO public.band_members (band_id, profile_id, role, instrument, since_year, sort_order)
  SELECT r.band_id, p.id, r.role, r.instrument, r.since_year, r.sort_order
  FROM {recordset(DEMO_MEMBER_COLS)} JOIN public.profiles p ON p.username = r.username AND p.display_name = r.display_name
  ON CONFLICT (band_id, profile_id) DO UPDATE SET role = EXCLUDED.role, instrument = EXCLUDED.instrument,
    since_year = EXCLUDED.since_year, sort_order = EXCLUDED.sort_order;

  IF (SELECT count(*) FROM {recordset(DEMO_MEMBER_COLS)}
      JOIN public.profiles p ON p.username = r.username AND p.display_name = r.display_name
      JOIN public.band_members t ON t.band_id = r.band_id AND t.profile_id = p.id
      WHERE (t.role, t.instrument, t.since_year, t.sort_order) IS NOT DISTINCT FROM (r.role, r.instrument, r.since_year, r.sort_order))
     <> (SELECT count(*) FROM {recordset(DEMO_MEMBER_COLS)}
         JOIN public.profiles p ON p.username = r.username AND p.display_name = r.display_name) THEN
    RAISE EXCEPTION 'band_members import: stored rows differ from the payload';
  END IF;

  RAISE NOTICE 'band_members: demo members with no matching profile: %', (
    SELECT coalesce(string_agg(r.username || ' (' || r.display_name || ')', ', '), 'none')
    FROM {recordset(DEMO_MEMBER_COLS)}
    WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.username = r.username AND p.display_name = r.display_name));"""

BBP_BAND_BODY = f"""  IF NOT EXISTS (SELECT 1 FROM {recordset(["id", "slug", "source_profile_id"])}
                 JOIN public.profiles p ON p.id = r.source_profile_id) THEN
    RAISE EXCEPTION 'bands import: The Bangalore Blues Project profile is missing';
  END IF;

  INSERT INTO public.bands (id, slug, name, tagline, bio, genres, city, avatar_url, cover_url)
  SELECT r.id, r.slug, p.display_name, p.headline, p.bio, p.genres, p.city, p.avatar_url, p.cover_url
  FROM {recordset(["id", "slug", "source_profile_id"])} JOIN public.profiles p ON p.id = r.source_profile_id
  ON CONFLICT (id) DO UPDATE SET slug = EXCLUDED.slug, name = EXCLUDED.name, tagline = EXCLUDED.tagline,
    bio = EXCLUDED.bio, genres = EXCLUDED.genres, city = EXCLUDED.city, avatar_url = EXCLUDED.avatar_url,
    cover_url = EXCLUDED.cover_url;

  IF (SELECT count(*) FROM {recordset(["id", "slug", "source_profile_id"])}
      JOIN public.profiles p ON p.id = r.source_profile_id JOIN public.bands t ON t.id = r.id
      WHERE (t.slug, t.name, t.tagline, t.bio, t.genres, t.city, t.avatar_url, t.cover_url)
            IS NOT DISTINCT FROM (r.slug, p.display_name, p.headline, p.bio, p.genres, p.city, p.avatar_url, p.cover_url))
     <> jsonb_array_length(payload) THEN
    RAISE EXCEPTION 'bands import: The Bangalore Blues Project differs from its profile';
  END IF;"""

BBP_MEMBER_COLS = list(bbp_members[0].keys())
BBP_MEMBERS_BODY = f"""  IF (SELECT count(*) FROM {recordset(BBP_MEMBER_COLS)} JOIN public.profiles p
      ON p.id = r.profile_id AND p.username = r.username) <> jsonb_array_length(payload) THEN
    RAISE EXCEPTION 'band_members import: an assigned profile is missing or has another username';
  END IF;
  IF EXISTS (SELECT 1 FROM {recordset(BBP_MEMBER_COLS)} JOIN public.profile_business b ON b.profile_id = r.profile_id) THEN
    RAISE EXCEPTION 'band_members import: an assigned profile is a business account';
  END IF;

  INSERT INTO public.band_members (band_id, profile_id, role, instrument, since_year, sort_order)
  SELECT r.band_id, r.profile_id, r.role, r.instrument, r.since_year, r.sort_order FROM {recordset(BBP_MEMBER_COLS)}
  ON CONFLICT (band_id, profile_id) DO UPDATE SET role = EXCLUDED.role, instrument = EXCLUDED.instrument,
    since_year = EXCLUDED.since_year, sort_order = EXCLUDED.sort_order;

  IF (SELECT count(*) FROM {recordset(BBP_MEMBER_COLS)} JOIN public.band_members t
      ON t.band_id = r.band_id AND t.profile_id = r.profile_id
      WHERE (t.role, t.instrument, t.since_year, t.sort_order) IS NOT DISTINCT FROM (r.role, r.instrument, r.since_year, r.sort_order))
     <> jsonb_array_length(payload) THEN
    RAISE EXCEPTION 'band_members import: stored rows differ from the payload';
  END IF;"""

BBP_EVENT_COLS = ["id", "band_id", "source_event_id"]
BBP_EVENTS_BODY = f"""  IF (SELECT count(*) FROM {recordset(BBP_EVENT_COLS)} JOIN public.profile_events e ON e.id = r.source_event_id)
     <> jsonb_array_length(payload) THEN
    RAISE EXCEPTION 'band_events import: a show of The Bangalore Blues Project profile is missing';
  END IF;

  -- The profile's shows are copied, not moved: profile_events keeps its rows.
  INSERT INTO public.band_events (id, band_id, title, venue, event_date, date_precision, sort_order)
  SELECT r.id, r.band_id, e.title, e.venue_name, e.event_date, 'day', e.sort_order
  FROM {recordset(BBP_EVENT_COLS)} JOIN public.profile_events e ON e.id = r.source_event_id
  ON CONFLICT (id) DO UPDATE SET band_id = EXCLUDED.band_id, title = EXCLUDED.title, venue = EXCLUDED.venue,
    event_date = EXCLUDED.event_date, date_precision = EXCLUDED.date_precision, sort_order = EXCLUDED.sort_order;

  IF (SELECT count(*) FROM {recordset(BBP_EVENT_COLS)} JOIN public.profile_events e ON e.id = r.source_event_id
      JOIN public.band_events t ON t.id = r.id
      WHERE (t.band_id, t.title, t.venue, t.city, t.event_date, t.event_time, t.date_precision, t.status, t.ticket_note, t.sort_order)
            IS NOT DISTINCT FROM (r.band_id, e.title, e.venue_name, NULL::text, e.event_date, NULL::time, 'day', NULL::text, NULL::text, e.sort_order))
     <> jsonb_array_length(payload) THEN
    RAISE EXCEPTION 'band_events import: stored shows differ from the profile';
  END IF;"""

band_blocks = [
    block("bands: demo bands", band_rows, upsert("bands", band_rows, "id")),
    block("bands: The Bangalore Blues Project, from its profile", BBP_SOURCE, BBP_BAND_BODY),
    block("band_members: demo bands", demo_members, DEMO_MEMBERS_BODY),
    block("band_members: The Bangalore Blues Project", bbp_members, BBP_MEMBERS_BODY),
    block("band_events: demo bands", events, upsert("band_events", events, "id")),
    block("band_events: The Bangalore Blues Project, from its profile", BBP_EVENTS, BBP_EVENTS_BODY),
    block("band_releases", releases, upsert("band_releases", releases, "id")),
]

member_lines = "\n".join(f"--   {name:<14} {instrument} ({role})" for _, name, instrument, role in BBP_MEMBERS)
BANDS_HEADER = f"""-- Bands: a band is a group of talent profiles. It is not an account and has no username.
--
-- Generated by supabase/generators/import_groups.py from src/data/band.ts (via
-- supabase/generators/export_demo_groups.ts) and The Bangalore Blues Project profile. Edit the
-- generator, not this file.
--
-- Schema
--   bands          slug (URL key, not a username), name, tagline, bio, genres, city, formed year, avatar,
--                  cover, open seats, availability, rate (paise + unit), is_verified (admin-only, by
--                  trigger), created_by.
--   band_members   band + talent profile, role owner | admin | member (one owner), instrument, since.
--   band_events    shows: date (day or month precision), time, venue, city, confirmed | hold (past follows
--                  from the date), ticket note.
--   band_releases  single | ep | album | live, year, cover.
--   Read: everyone (members with their profile's visibility). Write: the creator and members; the
--   line-up is changed by the creator, owner and admins, and a member can leave.
--
-- Data
--   Demo bands: {len(band_rows)} ({", ".join(b["slug"] for b in band_rows)}), {len(events)} shows, {len(releases)} releases. Genres are kept as
--   written in the demo (no taxonomy option matches them). Their {len(demo_members)} members join a profile only
--   where username and display name both match when this runs; a NOTICE lists the rest.
--   The Bangalore Blues Project (band slug the-bangalore-blues-project) from profile {BBP_PROFILE}:
--   name, headline, bio, city, genres, avatar and cover copied from the profile, its {len(BBP_EVENTS)} shows copied
--   from profile_events. Line-up slots filled with existing talent profiles:
{member_lines}
--   The profile, its username, line-up names, shows and portfolio are not changed or deleted.
--   Not stored: followers, QR codes, invitations, the demo portfolio item link.
--
-- Each data block re-reads what it wrote and raises on any difference. Idempotent: fixed uuid5 ids.
-- Rollback: DROP TABLE public.band_releases, public.band_events, public.band_members, public.bands;
--   DROP FUNCTION public.band_can_write(uuid), public.band_can_manage(uuid), public.band_is_owner(uuid),
--   public.bands_guard_admin_fields();
"""

with open(OUT_BUSINESS, "w", encoding="utf-8") as f:
    f.write(BUSINESS_SCHEMA + "\n" + "\n".join(business_blocks))
with open(OUT_BANDS, "w", encoding="utf-8") as f:
    f.write(BANDS_HEADER + BANDS_SCHEMA_SQL + "\n" + "\n".join(band_blocks))
print({"accounts": usernames, "gallery": len(gallery), "services": len(services), "team": len(team),
       "studios": len(studios), "rooms": len(rooms), "reviews": len(reviews), "credits": len(credits),
       "bands": len(band_rows) + 1, "demo_members": len(demo_members), "bbp_members": len(bbp_members),
       "events": len(events) + len(BBP_EVENTS), "releases": len(releases)})
