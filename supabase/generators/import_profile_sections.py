"""Generates the profile-sections migration: the rest of each profile bucket.

Usage (repo root):
  bun run supabase/generators/export_linked_sections.ts > /tmp/sections.json
  python3 supabase/generators/import_profile_sections.py \
    <FIRESTORE-FULL-DUMP.md> <admin/scripts/seed/data/taxonomy-seed.ts> /tmp/sections.json <out.sql>

Everything is keyed by profile id. Profile ids come from import_profiles.py's namespace, so the rows
attach to the profiles that migration created. Values use taxonomy slugs; money is integer paise.
"""
from __future__ import annotations

import json
import re
import sys
import unicodedata
import uuid

from taxonomy_renames import clean_row, renamed, with_added

DUMP, SEED, SECTIONS, OUT = sys.argv[1:5]
NS = uuid.UUID("5b1b2f0e-3c1a-4f6e-9d3a-6d1c2b7e9a10")  # same namespace as import_profiles.py


def uid(key: str) -> str:
    return str(uuid.uuid5(NS, key))


text = open(DUMP, encoding="utf-8").read()
FB = {m.group(1): json.loads(m.group(3))
      for m in re.finditer(r"`(\w+)` — (\d+) docs\s*```json\s*(\[.*?\])\s*```", text, re.S)}
LINKED = json.load(open(SECTIONS, encoding="utf-8"))
problems: list[str] = []

# ---- taxonomy: the categories not yet in taxonomy_options --------------------------------------
ALREADY = {"genres", "person_types", "languages", "instruments"}
SLUG_OVERRIDE = {("studio_amenities", "24x7 Access"): "access_24x7"}  # TAXONOMY-MIGRATION-SPEC §3


def slugify(label: str) -> str:
    s = unicodedata.normalize("NFKD", label).encode("ascii", "ignore").decode().lower().replace("&", "and")
    return re.sub(r"_+", "_", re.sub(r"[^a-z0-9]+", "_", s)).strip("_")


seed = open(SEED, encoding="utf-8").read()
seed_body = seed[seed.index("const CATEGORIES"):seed.index("export const TAXONOMY_CATEGORIES")]
taxonomy_categories, taxonomy_options = [], []
SLUG = {}  # (category, seed value or label) -> slug
for m in re.finditer(r'\{\s*key: "(\w+)",\s*label: "([^"]+)",\s*description:\s*"((?:[^"\\]|\\.)*)",'
                     r'\s*options: \[(.*?)\n    \],', seed_body, re.S):
    key, label, description, opts = m.group(1), m.group(2), m.group(3), m.group(4)
    if key in ALREADY:
        continue
    taxonomy_categories.append({"key": key, "label": label, "description": description.replace('\\"', '"')})
    seeded = []
    for i, o in enumerate(re.finditer(r'\{ label: "([^"]+)", value: "([^"]+)"(?:, metadata: \{ group: "([^"]+)" \})? \}',
                                      opts), 1):
        olabel, value, group = o.group(1), o.group(2), o.group(3)
        slug = SLUG_OVERRIDE.get((key, olabel)) or (value if re.fullmatch(r"[a-z0-9_]+", value) else slugify(olabel))
        slug = renamed(key, slug)
        SLUG[(key, value)] = SLUG[(key, olabel)] = slug
        seeded.append({"category_key": key, "slug": slug, "label": olabel, "sort_order": i,
                       "metadata": {"group": group} if group else None})
    # Single names, no "/" in labels (owner, 15 Sep 2026): Company PAN / GSTIN is two options.
    # Text without "/" too: the opportunity_types group "Studio / Space" is "Studio".
    taxonomy_options.extend(clean_row("taxonomy_options", o) for o in with_added(key, seeded))
assert len(taxonomy_categories) == 25, len(taxonomy_categories)
assert not [o for o in taxonomy_options if "/" in o["label"]], "an option label has a /"


def tax(category, values, fid):
    out = []
    for v in values or []:
        s = SLUG.get((category, v))
        if not s:
            problems.append(f"{fid}: {category} {v!r} has no slug")
        elif s not in out:
            out.append(s)
    return out


# ---- helpers ------------------------------------------------------------------------------------
def paise(price):
    """{amount: '₹4,500', unit: 'hr'} or '₹4,500/hr' -> (450000, 'hr', None); '15% of net' -> (None, None, '15% of net')."""
    if isinstance(price, dict):
        price = f"{price['amount']} / {price['unit']}" if price.get("unit") else price["amount"]
    m = re.fullmatch(r"₹\s*([\d,]+)\s*(?:/\s*(.+))?", price.strip())
    if not m:
        return None, None, price.strip() or None
    return int(m.group(1).replace(",", "")) * 100, (m.group(2) or "").strip() or None, None


def period(p: str):
    m = re.fullmatch(r"(\d{4}) — (\d{4}|present)", p)
    if not m:
        problems.append(f"period {p!r} not parsed")
        return None, None
    return int(m.group(1)), None if m.group(2) == "present" else int(m.group(2))


INSTRUMENT_SLUG = {"Acoustic Guitar": "acoustic_guitar", "Electric Guitar": "electric_guitar", "Bass Guitar": "bass_guitar",
                   "Keyboard / Synthesizer": "keyboard", "Piano": "piano",
                   "Drums / Percussion": "drums", "Tabla": "tabla", "Sitar": "sitar",
                   "Flute (Bansuri)": "flute_bansuri", "Harmonium": "harmonium", "Violin": "violin",
                   "Saxophone": "saxophone"}
FB_USERS = {u["_id"]: u for u in FB["users"]}
PROFILE_ID = {fid: uid(f"firebase:users/{fid}") for fid in FB_USERS}
LINKED_ID = {p["username"]: p["id"] for p in LINKED}

profile_fields, services, experience, gallery, reviews = [], [], [], [], []
role_details, business, members, events = {}, [], [], []

# ---- Firebase users ------------------------------------------------------------------------------
for fid, u in FB_USERS.items():
    pid = PROFILE_ID[fid]
    rate = u.get("hourlyRate") or 0
    profile_fields.append({
        "id": pid, "hourly_rate_paise": rate * 100 if rate > 0 else None,
        "budget_tier": tax("budget_type", [u["budgetTier"]], fid)[0] if u.get("budgetTier") else None,
        "persona_badges": tax("persona_badges", u.get("personaBadges"), fid),
        "trust_badges": tax("trust_badges", u.get("trustBadges"), fid),
        "is_verified": bool(u.get("isVerified")), "is_available": bool(u.get("isAvailable", True)),
    })
    roles = [u.get("primaryRole"), u.get("secondaryRole")]
    if u.get("vocalRange"):
        role = "singer" if "singer" in roles else u["primaryRole"]
        role_details.setdefault((pid, role), {})["vocal_range"] = u["vocalRange"]
    if u.get("dawStack"):
        role = next((r for r in ("sound_engineer", "producer") if r in roles), u["primaryRole"])
        role_details.setdefault((pid, role), {})["daw_tools"] = u["dawStack"]
    if u.get("sessionAvailability"):
        role_details.setdefault((pid, u["primaryRole"]), {})["availability_status"] = u["sessionAvailability"]

    for i, s in enumerate(u.get("serviceOfferings") or []):
        amount, unit, note = paise(s["price"])
        services.append({"id": uid(f"firebase:users/{fid}/serviceOfferings/{i}"), "profile_id": pid,
                         "name": s["title"], "description": None, "price_paise": amount, "price_unit": unit,
                         "price_note": note, "turnaround": None, "mode": None, "availability": None, "sort_order": i})

    biz = {"business_address": u.get("businessAddress"), "operating_hours": u.get("operatingHours"),
           "equipment_list": u.get("equipmentList") or [], "artist_roster": u.get("artistRoster") or [],
           "talent_roster": u.get("talentRoster") or [], "courses": u.get("courses") or [],
           "capacity": u.get("capacity"), "venue_features": u.get("venueFeatures") or []}
    if any(v for v in biz.values()):
        business.append({"profile_id": pid, **biz})
    for kind, people in (("team", u.get("teamMembers")), ("lineup", u.get("lineupMembers"))):
        for i, p in enumerate(people or []):
            members.append({"id": uid(f"firebase:users/{fid}/{kind}/{i}"), "profile_id": pid, "kind": kind,
                            "name": p["name"], "role": p.get("role"), "experience": p.get("experience"),
                            "is_leader": bool(p.get("isLeader")), "sort_order": i})
    for i, e in enumerate(u.get("shows") or []):
        events.append({"id": uid(f"firebase:users/{fid}/shows/{i}"), "profile_id": pid, "title": e["title"],
                       "event_date": e.get("date"), "venue_name": e.get("venueName"), "sort_order": i})

for rp in FB["role_profiles"]:
    pid = PROFILE_ID[rp["ownerUid"]]
    details = {k: v for k, v in rp.items() if k not in ("_id", "ownerUid", "roleKey", "createdAt", "updatedAt")}
    snake = {re.sub(r"(?<!^)([A-Z])", r"_\1", k).lower(): v for k, v in details.items()}
    # Same vocabulary as the user-level fields: daw_tools, and instrument slugs rather than labels.
    if "daw_stack" in snake:
        snake["daw_tools"] = snake.pop("daw_stack")
    if "primary_instrument" in snake:
        snake["primary_instrument"] = INSTRUMENT_SLUG[snake["primary_instrument"]]
    if "secondary_instruments" in snake:
        snake["secondary_instruments"] = [INSTRUMENT_SLUG[i] for i in snake["secondary_instruments"]]
    role_details.setdefault((pid, renamed("person_types", rp["roleKey"])), {}).update(snake)

# Reviews of people. Firebase USER reviews carry the attribution inside the text: '"…" — Name, Org'.
for r in FB["reviews"]:
    if r["targetType"] != "USER":
        continue  # studio reviews attach to studios, not profiles
    m = re.fullmatch(r'"(.+)"\s*—\s*(.+)', r["text"], re.S)
    body, attribution = (m.group(1), m.group(2)) if m else (r["text"], "")
    name, _, org = attribution.partition(", ")
    reviews.append({"id": uid(f"firebase:reviews/{r['_id']}"), "target_profile_id": PROFILE_ID[r["targetId"]],
                    "author_name": name.strip() or r["authorUid"].replace("mock-reviewer-", "").replace("-", " ").title(),
                    "author_org": org.strip() or None, "context": None, "rating": r["rating"], "body": body,
                    "response": None, "created_at": r["createdAt"]})

# ---- the 11 linked profiles' TS sections ---------------------------------------------------------
for p in LINKED:
    pid = p["id"]
    for i, s in enumerate(p["services"]):
        amount, unit, note = paise(s.get("from") or "")
        services.append({"id": uid(f"linked:{pid}:services:{s['id']}"), "profile_id": pid, "name": s["name"],
                         "description": s["description"] or None, "price_paise": amount, "price_unit": unit,
                         "price_note": note, "turnaround": s["turnaround"] or None, "mode": s["mode"] or None,
                         "availability": s["availability"] or None, "sort_order": i})
    for i, e in enumerate(p["experience"]):
        start, end = period(e["period"])
        experience.append({"id": uid(f"linked:{pid}:experience:{e['id']}"), "profile_id": pid, "title": e["title"],
                           "org": e["org"] or None, "start_year": start, "end_year": end,
                           "detail": e["detail"] or None, "sort_order": i})
    for i, r in enumerate(p["reviews"]):
        reviews.append({"id": uid(f"linked:{pid}:reviews:{r['id']}"), "target_profile_id": pid, "author_name": r["by"],
                        "author_org": r["org"] or None, "context": r["context"] or None, "rating": r["stars"],
                        "body": r["text"], "response": r.get("response"), "created_at": None})
    for i, url in enumerate(p["gallery"]):
        gallery.append({"id": uid(f"linked:{pid}:gallery:{i}"), "profile_id": pid, "image_url": url, "sort_order": i})

role_detail_rows = [{"profile_id": pid, "role_slug": role, "details": d} for (pid, role), d in role_details.items()]

if problems:
    sys.exit("Unmapped values:\n" + "\n".join(problems))

# ---- SQL -----------------------------------------------------------------------------------------
SCHEMA = """-- Profile sections: the rest of each profile bucket, keyed by profile id.
--
-- Generated by supabase/generators/import_profile_sections.py from Claude outputs/audits/
-- FIRESTORE-FULL-DUMP.md, admin/scripts/seed/data/taxonomy-seed.ts and src/data/linked-profiles.ts.
-- Edit the generator, not this file.
--
-- Schema
--   profiles + hourly_rate_paise, budget_tier (budget_type slug), persona_badges, trust_badges,
--             is_verified, is_available. trust_badges and is_verified are admin-only: a signed-in
--             user changing them is refused by trigger.
--   profile_services, profile_experience, profile_gallery, reviews (of a profile),
--   profile_role_details (per role, jsonb), profile_business (1:1), profile_members (team / band
--   lineup), profile_events (shows).
--   Read: rows of public profiles, and your own. Write: owners for their own sections; reviews and
--   admin fields are not client-writable.
--   Money is integer paise; a price with no amount keeps its text in price_note.
--
-- Data
--   Taxonomy: the 25 categories not yet loaded (published). Labels are single names, no "/" (owner,
--   15 Sep 2026): the seed's combined Company PAN option is company_pan and company_gstin, and the
--   opportunity_types group is "Studio". Imported text has no "/" either (taxonomy_renames.py);
--   category descriptions (developer notes) are kept as they are.
--   Firebase: rates, budget tiers, badges, verified / available, role details (user fields and
--   role_profiles), service offerings, business / venue details, team and band lineup, shows, and
--   reviews of people. Studio reviews belong to studios and are not here.
--   The 11 linked seed profiles: services, experience, reviews and gallery from their TS sections.
--   Not imported: gender, GSTIN, email.
--
-- Each data block re-reads what it wrote and raises on any difference. Idempotent.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS hourly_rate_paise bigint CHECK (hourly_rate_paise >= 0),
  ADD COLUMN IF NOT EXISTS budget_tier text,
  ADD COLUMN IF NOT EXISTS persona_badges text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS trust_badges text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_available boolean NOT NULL DEFAULT true;

-- Admin-granted fields. Signed-in and anonymous callers cannot set or change them; the service role
-- and direct database sessions can.
CREATE OR REPLACE FUNCTION public.profiles_guard_admin_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $fn$
BEGIN
  IF coalesce(auth.jwt() ->> 'role', '') IN ('authenticated', 'anon') THEN
    IF TG_OP = 'INSERT' AND (NEW.trust_badges <> '{}' OR NEW.is_verified) THEN
      RAISE EXCEPTION 'trust_badges and is_verified are set by MusicLinkd, not by the profile owner';
    END IF;
    IF TG_OP = 'UPDATE' AND (NEW.trust_badges IS DISTINCT FROM OLD.trust_badges
                             OR NEW.is_verified IS DISTINCT FROM OLD.is_verified) THEN
      RAISE EXCEPTION 'trust_badges and is_verified are set by MusicLinkd, not by the profile owner';
    END IF;
  END IF;
  RETURN NEW;
END
$fn$;

DROP TRIGGER IF EXISTS profiles_guard_admin_fields ON public.profiles;
CREATE TRIGGER profiles_guard_admin_fields
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_guard_admin_fields();

-- Readable when the owning profile is public, or it is your own.
CREATE OR REPLACE FUNCTION public.profile_is_readable(p_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT EXISTS (SELECT 1 FROM public.profiles p
                 WHERE p.id = p_profile_id AND (p.visibility = 'public' OR p.id = auth.uid()));
$fn$;
REVOKE ALL ON FUNCTION public.profile_is_readable(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.profile_is_readable(uuid) TO anon, authenticated;

CREATE TABLE IF NOT EXISTS public.profile_services (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name         text NOT NULL,
  description  text,
  price_paise  bigint CHECK (price_paise >= 0),
  price_unit   text,
  price_note   text,
  turnaround   text,
  mode         text,
  availability text,
  sort_order   int NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profile_experience (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title      text NOT NULL,
  org        text,
  start_year int,
  end_year   int,  -- null: present
  detail     text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_year IS NULL OR start_year IS NULL OR end_year >= start_year)
);

CREATE TABLE IF NOT EXISTS public.profile_gallery (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  image_url  text NOT NULL,
  caption    text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reviews (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  author_name       text NOT NULL,
  author_org        text,
  context           text,
  rating            numeric(2,1) NOT NULL CHECK (rating >= 1 AND rating <= 5),
  body              text NOT NULL,
  response          text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profile_role_details (
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_slug  text NOT NULL,
  details    jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (profile_id, role_slug)
);

CREATE TABLE IF NOT EXISTS public.profile_business (
  profile_id       uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_address text,
  operating_hours  text,
  equipment_list   text[] NOT NULL DEFAULT '{}',
  artist_roster    text[] NOT NULL DEFAULT '{}',
  talent_roster    text[] NOT NULL DEFAULT '{}',
  courses          text[] NOT NULL DEFAULT '{}',
  capacity         int CHECK (capacity >= 0),
  venue_features   text[] NOT NULL DEFAULT '{}',
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profile_members (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind       text NOT NULL CHECK (kind IN ('team', 'lineup')),
  name       text NOT NULL,
  role       text,
  experience text,
  is_leader  boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.profile_events (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title      text NOT NULL,
  event_date date,
  venue_name text,
  sort_order int NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS profile_services_profile_idx   ON public.profile_services (profile_id, sort_order);
CREATE INDEX IF NOT EXISTS profile_experience_profile_idx ON public.profile_experience (profile_id, sort_order);
CREATE INDEX IF NOT EXISTS profile_gallery_profile_idx    ON public.profile_gallery (profile_id, sort_order);
CREATE INDEX IF NOT EXISTS reviews_target_profile_idx     ON public.reviews (target_profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS profile_members_profile_idx    ON public.profile_members (profile_id, kind, sort_order);
CREATE INDEX IF NOT EXISTS profile_events_profile_idx     ON public.profile_events (profile_id, event_date);

DO $rls$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['profile_services', 'profile_experience', 'profile_gallery', 'profile_role_details',
                           'profile_business', 'profile_members', 'profile_events'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('GRANT SELECT ON public.%I TO anon, authenticated', t);
    EXECUTE format('GRANT INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('DROP POLICY IF EXISTS "Readable with its profile" ON public.%I', t);
    EXECUTE format('CREATE POLICY "Readable with its profile" ON public.%I FOR SELECT USING (public.profile_is_readable(profile_id))', t);
    EXECUTE format('DROP POLICY IF EXISTS "Owners write their own" ON public.%I', t);
    EXECUTE format('CREATE POLICY "Owners write their own" ON public.%I FOR ALL TO authenticated USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id)', t);
  END LOOP;
END
$rls$;

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.reviews TO anon, authenticated;
GRANT ALL ON public.reviews TO service_role;
DROP POLICY IF EXISTS "Readable with its profile" ON public.reviews;
CREATE POLICY "Readable with its profile" ON public.reviews FOR SELECT
  USING (public.profile_is_readable(target_profile_id));
"""

CATEGORY_BODY = """  INSERT INTO public.taxonomy_categories (key, label, description)
  SELECT r.key, r.label, r.description FROM jsonb_to_recordset(payload) AS r(key text, label text, description text)
  ON CONFLICT (key) DO UPDATE SET label = EXCLUDED.label, description = EXCLUDED.description;"""
OPTION_BODY = """  INSERT INTO public.taxonomy_options (category_key, slug, label, sort_order, metadata)
  SELECT r.category_key, r.slug, r.label, r.sort_order, r.metadata
  FROM jsonb_to_recordset(payload) AS r(category_key text, slug text, label text, sort_order int, metadata jsonb)
  ON CONFLICT (category_key, slug) DO UPDATE SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order,
    metadata = EXCLUDED.metadata;"""


def upsert_body(table, cols, key, update=True):
    names = [c for c, _ in cols]
    rs = "jsonb_to_recordset(payload) AS r(" + ", ".join(f"{c} {t}" for c, t in cols) + ")"
    conflict = (f"ON CONFLICT ({key}) DO UPDATE SET " + ", ".join(f"{c} = EXCLUDED.{c}" for c in names if c not in key.split(", "))
                if update else f"ON CONFLICT ({key}) DO NOTHING")
    key_join = " AND ".join(f"t.{k} = r.{k}" for k in key.split(", "))
    return f"""  INSERT INTO public.{table} ({", ".join(names)})
  SELECT {", ".join("r." + c for c in names)} FROM {rs}
  {conflict};

  IF (SELECT count(*) FROM {rs} JOIN public.{table} t ON {key_join}
      WHERE ({", ".join("t." + c for c in names)}) IS NOT DISTINCT FROM ({", ".join("r." + c for c in names)}))
     <> jsonb_array_length(payload) THEN
    RAISE EXCEPTION '{table} import: stored rows differ from the payload';
  END IF;"""


PROFILE_FIELDS_BODY = """  UPDATE public.profiles p SET hourly_rate_paise = r.hourly_rate_paise, budget_tier = r.budget_tier,
    persona_badges = r.persona_badges, trust_badges = r.trust_badges, is_verified = r.is_verified,
    is_available = r.is_available
  FROM jsonb_to_recordset(payload) AS r(id uuid, hourly_rate_paise bigint, budget_tier text, persona_badges text[],
                                        trust_badges text[], is_verified boolean, is_available boolean)
  WHERE p.id = r.id;

  IF (SELECT count(*) FROM jsonb_to_recordset(payload) AS r(id uuid, hourly_rate_paise bigint, budget_tier text,
        persona_badges text[], trust_badges text[], is_verified boolean, is_available boolean)
      JOIN public.profiles p ON p.id = r.id
      WHERE (p.hourly_rate_paise, p.budget_tier, p.persona_badges, p.trust_badges, p.is_verified, p.is_available)
            IS NOT DISTINCT FROM (r.hourly_rate_paise, r.budget_tier, r.persona_badges, r.trust_badges, r.is_verified, r.is_available))
     <> jsonb_array_length(payload) THEN
    RAISE EXCEPTION 'profile fields import: stored rows differ from the payload';
  END IF;"""

SERVICE_COLS = [("id", "uuid"), ("profile_id", "uuid"), ("name", "text"), ("description", "text"),
                ("price_paise", "bigint"), ("price_unit", "text"), ("price_note", "text"), ("turnaround", "text"),
                ("mode", "text"), ("availability", "text"), ("sort_order", "int")]
EXPERIENCE_COLS = [("id", "uuid"), ("profile_id", "uuid"), ("title", "text"), ("org", "text"), ("start_year", "int"),
                   ("end_year", "int"), ("detail", "text"), ("sort_order", "int")]
GALLERY_COLS = [("id", "uuid"), ("profile_id", "uuid"), ("image_url", "text"), ("sort_order", "int")]
REVIEW_COLS = [("id", "uuid"), ("target_profile_id", "uuid"), ("author_name", "text"), ("author_org", "text"),
               ("context", "text"), ("rating", "numeric"), ("body", "text"), ("response", "text")]
ROLE_COLS = [("profile_id", "uuid"), ("role_slug", "text"), ("details", "jsonb")]
BUSINESS_COLS = [("profile_id", "uuid"), ("business_address", "text"), ("operating_hours", "text"),
                 ("equipment_list", "text[]"), ("artist_roster", "text[]"), ("talent_roster", "text[]"),
                 ("courses", "text[]"), ("capacity", "int"), ("venue_features", "text[]")]
MEMBER_COLS = [("id", "uuid"), ("profile_id", "uuid"), ("kind", "text"), ("name", "text"), ("role", "text"),
               ("experience", "text"), ("is_leader", "boolean"), ("sort_order", "int")]
EVENT_COLS = [("id", "uuid"), ("profile_id", "uuid"), ("title", "text"), ("event_date", "date"),
              ("venue_name", "text"), ("sort_order", "int")]


def pick(rows, cols):
    return [{c: r.get(c) for c, _ in cols} for r in rows]


def chunks(rows, limit=24000):
    out, cur = [], []
    for row in rows:
        cur.append(row)
        if len(json.dumps(cur, ensure_ascii=False, separators=(",", ":")).encode()) > limit and len(cur) > 1:
            out.append(cur[:-1])
            cur = [row]
    return out + ([cur] if cur else [])


def block(label, rows, body):
    payload = json.dumps(rows, ensure_ascii=False, separators=(",", ":"))
    assert "$json$" not in payload
    return f"-- {label}\nDO $import$\nDECLARE\n  payload jsonb := $json${payload}$json$;\nBEGIN\n{body}\nEND\n$import$;\n"


# Reviews keep created_at from the source when it has one.
REVIEW_BODY = upsert_body("reviews", REVIEW_COLS, "id") + """

  UPDATE public.reviews t SET created_at = r.created_at
  FROM jsonb_to_recordset(payload) AS r(id uuid, created_at timestamptz)
  WHERE t.id = r.id AND r.created_at IS NOT NULL;"""

parts = [("taxonomy categories", taxonomy_categories, CATEGORY_BODY),  # descriptions are kept as they are
         ("taxonomy options", taxonomy_options, OPTION_BODY),
         ("profile fields", profile_fields, PROFILE_FIELDS_BODY),
         ("profile_services", pick(services, SERVICE_COLS), upsert_body("profile_services", SERVICE_COLS, "id")),
         ("profile_experience", pick(experience, EXPERIENCE_COLS), upsert_body("profile_experience", EXPERIENCE_COLS, "id")),
         ("profile_gallery", pick(gallery, GALLERY_COLS), upsert_body("profile_gallery", GALLERY_COLS, "id")),
         ("reviews", [{**{c: r.get(c) for c, _ in REVIEW_COLS}, "created_at": r["created_at"]} for r in reviews], REVIEW_BODY),
         ("profile_role_details", pick(role_detail_rows, ROLE_COLS),
          upsert_body("profile_role_details", ROLE_COLS, "profile_id, role_slug")),
         ("profile_business", pick(business, BUSINESS_COLS), upsert_body("profile_business", BUSINESS_COLS, "profile_id")),
         ("profile_members", pick(members, MEMBER_COLS), upsert_body("profile_members", MEMBER_COLS, "id")),
         ("profile_events", pick(events, EVENT_COLS), upsert_body("profile_events", EVENT_COLS, "id"))]

# Text without "/" (owner, 15 Sep 2026; taxonomy_renames.py). Table per part, for the column rules.
TABLE = {"profile fields": "profiles", "taxonomy options": "taxonomy_options"}
parts = [(label, rows if label == "taxonomy categories" else
          [clean_row(TABLE.get(label, label), r) for r in rows], body) for label, rows, body in parts]

blocks = []
for label, rows, body in parts:
    cs = chunks(rows)
    for i, rs in enumerate(cs, 1):
        blocks.append(block(f"{label} {i}/{len(cs)} ({len(rs)} rows)", rs, body))

with open(OUT, "w", encoding="utf-8") as f:
    f.write(SCHEMA + "\n" + "\n".join(blocks))
print({label: len(rows) for label, rows, _ in parts}, "blocks", [len(b.encode()) for b in blocks],
      "schema", len(SCHEMA.encode()))
