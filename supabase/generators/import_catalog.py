"""Generates the catalog migration: studios, opportunities, marketplace listings, feed posts, brand
assets and CMS pages from the Firebase dump.

Usage (repo root):
  python3 supabase/generators/import_catalog.py \
    <FIRESTORE-FULL-DUMP.md> <admin/scripts/seed/data/taxonomy-seed.ts> <out.sql>

Owners are the profiles import_profiles.py created (same uuid namespace). Values use taxonomy slugs;
money is integer paise, with any text a price carries beyond the amount kept in a note.
"""
from __future__ import annotations

import json
import re
import sys
import uuid

from taxonomy_renames import fixed_text, renamed

DUMP, SEED, OUT = sys.argv[1:4]
NS = uuid.UUID("5b1b2f0e-3c1a-4f6e-9d3a-6d1c2b7e9a10")  # same namespace as import_profiles.py


def uid(key: str) -> str:
    return str(uuid.uuid5(NS, key))


text = open(DUMP, encoding="utf-8").read()
FB = {m.group(1): json.loads(m.group(3))
      for m in re.finditer(r"`(\w+)` — (\d+) docs\s*```json\s*(\[.*?\])\s*```", text, re.S)}
problems: list[str] = []

# Taxonomy label -> slug, from the admin seed file (same source import_profile_sections.py loaded).
seed = open(SEED, encoding="utf-8").read()
seed_body = seed[seed.index("const CATEGORIES"):seed.index("export const TAXONOMY_CATEGORIES")]
SLUG: dict[tuple[str, str], str] = {}
for m in re.finditer(r'\{\s*key: "(\w+)",\s*label: "([^"]+)",\s*description:\s*"(?:[^"\\]|\\.)*",'
                     r'\s*options: \[(.*?)\n    \],', seed_body, re.S):
    for o in re.finditer(r'\{ label: "([^"]+)", value: "([^"]+)"', m.group(3)):
        label, value = o.group(1), o.group(2)
        slug = value if re.fullmatch(r"[a-z0-9_]+", value) else re.sub(
            r"_+", "_", re.sub(r"[^a-z0-9]+", "_", label.lower().replace("&", "and"))).strip("_")
        SLUG[(m.group(1), label)] = SLUG[(m.group(1), value)] = slug
SLUG[("studio_amenities", "24x7 Access")] = "access_24x7"  # TAXONOMY-MIGRATION-SPEC §3
for (category, key), slug in list(SLUG.items()):
    SLUG[(category, key)] = renamed(category, slug)  # single names, owner 15 Sep 2026 (taxonomy_renames.py)
GENRE = {"Bollywood / Filmi": "bollywood", "Indie Pop": "indie_pop", "Hindustani Classical": "hindustani_classical",
         "Carnatic Classical": "carnatic_classical", "Rajasthani Folk": "rajasthani_folk", "Rock / Metal": "rock",
         "EDM / Synthwave": "edm", "Acoustic / Unplugged": "acoustic"}


def slugs(category, values, ref):
    out = []
    for v in values or []:
        s = GENRE.get(v) if category == "genres" else SLUG.get((category, v))
        if not s:
            problems.append(f"{ref}: {category} {v!r} has no slug")
        elif s not in out:
            out.append(s)
    return out


def price(raw: str):
    """'₹1,500/day + ₹5,000 deposit' -> (150000, 'day', '+ ₹5,000 deposit'); 'Royalties Split' -> (None, None, 'Royalties Split')."""
    m = re.fullmatch(r"₹\s*([\d,]+)\s*(?:/\s*([^+]+?))?\s*(\+.*)?", raw.strip())
    if not m:
        return None, None, raw.strip() or None
    return int(m.group(1).replace(",", "")) * 100, (m.group(2) or "").strip() or None, (m.group(3) or "").strip() or None


PROFILE_ID = {u["_id"]: uid(f"firebase:users/{u['_id']}") for u in FB["users"]}
# import_profiles.py imported mock-business-octave-sound-labs as "Wugweb"; its studio follows (owner's call).
RENAME = {"mock-studio-octave-sound-labs": ("wugweb", "Wugweb")}

# ---- studios -------------------------------------------------------------------------------------
studios, rooms, equipment = [], [], []
STUDIO_ID = {}
for s in FB["studios"]:
    sid = uid(f"firebase:studios/{s['_id']}")
    STUDIO_ID[s["_id"]] = sid
    slug, name = RENAME.get(s["_id"], (s["_id"].removeprefix("mock-studio-").removeprefix("filler-"), s["name"]))
    geo = s.get("geo") or {}
    images = s.get("images") or []
    studios.append({
        "id": sid, "owner_profile_id": PROFILE_ID[s["ownerUid"]], "slug": slug, "name": name,
        "description": s.get("description"), "location": s["location"], "geo_lat": geo.get("lat"),
        "geo_lng": geo.get("lng"), "hourly_rate_paise": s["hourlyRate"] * 100 if s.get("hourlyRate") else None,
        "rating": s.get("rating"), "review_count": s.get("reviewCount") or 0,
        "verified_gold": bool(s.get("verifiedGold")), "console_type": s.get("consoleType"),
        "services": slugs("studio_services", s.get("services"), s["_id"]),
        "amenities": slugs("studio_amenities", s.get("amenities"), s["_id"]),
        "cancellation_policy": s.get("cancellationPolicy"), "operating_hours": s.get("operatingHours"),
        "image_url": s.get("imageUrl"), "images": images, "created_at": s["createdAt"],
    })
    for i, r in enumerate(s.get("rooms") or []):
        rooms.append({"id": uid(f"firebase:studios/{s['_id']}/rooms/{i}"), "studio_id": sid, "name": r["name"],
                      "capacity": r.get("capacity"), "hourly_rate_paise": r["hourlyRate"] * 100 if r.get("hourlyRate") else None,
                      "amenities": slugs("studio_amenities", r.get("amenities"), s["_id"]), "sort_order": i})
    for i, e in enumerate(s.get("equipment") or []):
        equipment.append({"id": uid(f"firebase:studios/{s['_id']}/equipment/{i}"), "studio_id": sid, "name": e["name"],
                          "category": slugs("equipment_categories", [e["category"]], s["_id"])[0],
                          "quantity": e.get("quantity"), "included": bool(e.get("included", True)), "sort_order": i})

studio_reviews = []
for r in FB["reviews"]:
    if r["targetType"] != "STUDIO":
        continue
    studio_reviews.append({
        "id": uid(f"firebase:reviews/{r['_id']}"), "target_studio_id": STUDIO_ID[r["targetId"]],
        "author_name": r["authorUid"].removeprefix("mock-reviewer-").replace("-", " ").title(),
        "rating": r["rating"], "body": r["text"], "created_at": r["createdAt"]})

# ---- opportunities -------------------------------------------------------------------------------
opportunities = []
for p in FB["projects"]:
    amount, unit, note = price(p["budget"])
    opportunities.append({
        "id": uid(f"firebase:projects/{p['_id']}"), "creator_profile_id": PROFILE_ID[p["creatorUid"]],
        "slug": p["_id"].removeprefix("mock-project-"), "title": p["title"],
        "role_required": fixed_text("opportunities", "role_required", p.get("roleRequired")),
        "genres": slugs("genres", p.get("genres"), p["_id"]), "budget_paise": amount, "budget_unit": unit,
        "budget_note": note, "collaboration_type": slugs("collaboration_types", [p["collaborationType"]], p["_id"])[0],
        "location": p.get("location"), "status": p["status"].lower(), "applicant_count": p.get("applicantCount") or 0,
        "created_at": p["createdAt"]})

# ---- marketplace -----------------------------------------------------------------------------------
CONDITION = {"NEW": "new", "LIKE_NEW": "like_new", "USED": "used"}
listings = []
for m in FB["marketplace_items"]:
    amount, unit, note = price(m["price"])
    item = m.get("itemCategory")
    if item and SLUG.get(("equipment_categories", item)):
        item_category, item_kind = SLUG[("equipment_categories", item)], "equipment"
    elif item and SLUG.get(("instruments", item)):
        item_category, item_kind = SLUG[("instruments", item)], "instrument"
    else:
        item_category, item_kind = None, None
    seller = PROFILE_ID.get(m["sellerUid"])
    listings.append({
        "id": uid(f"firebase:marketplace_items/{m['_id']}"), "slug": m["_id"].removeprefix("mock-marketplace-"),
        "seller_profile_id": seller,
        # Sellers with no user document: the name comes from the Firebase id, as nothing else carries it.
        "seller_name": None if seller else m["sellerUid"].removeprefix("mock-seller-").replace("-", " ").title(),
        "title": fixed_text("marketplace_listings", "title", m["title"]), "category": slugs("marketplace_categories", [m["category"]], m["_id"])[0],
        "item_category": item_category, "item_category_kind": item_kind, "condition": CONDITION[m["condition"]],
        "price_paise": amount, "price_unit": unit, "price_note": note, "image_url": m.get("imageUrl"),
        "created_at": m["createdAt"]})

# ---- feed, brand assets, CMS pages ------------------------------------------------------------------
posts = [{"id": uid(f"firebase:feed_posts/{p['_id']}"), "author_profile_id": PROFILE_ID[p["authorUid"]],
          "post_type": p["postType"], "body": p.get("text"), "media_urls": p.get("mediaUrls") or [],
          "audio_url": p.get("audioUrl"), "likes_count": p.get("likesCount") or 0,
          "comments_count": p.get("commentsCount") or 0, "created_at": p["timestamp"]} for p in FB["feed_posts"]]
brand = [{"profile_id": PROFILE_ID[b["ownerUid"]], "logo_url": b.get("logoUrl"), "hero_banner_url": b.get("heroBannerUrl"),
          "thumbnail_url": b.get("thumbnailUrl"), "icon_url": b.get("iconUrl")} for b in FB["brand_assets"]]
pages = [{"slug": p["_id"], "route": p["route"], "title": p["title"], "status": p["status"].lower(),
          "content": p["content"], "seo_description": p.get("seoDescription"), "updated_at": p["updatedAt"]}
         for p in FB["page_content"]]

if problems:
    sys.exit("Unmapped values:\n" + "\n".join(problems))
assert not [o for o in opportunities if "/" in (o["role_required"] or "")], "a role_required has a /"
assert not [m for m in listings if "/" in m["title"]], "a listing title has a /"

SCHEMA = """-- Catalog: studios (rooms, equipment, reviews), opportunities, marketplace listings, feed posts,
-- brand assets and CMS pages.
--
-- Generated by supabase/generators/import_catalog.py from Claude outputs/audits/FIRESTORE-FULL-DUMP.md
-- and admin/scripts/seed/data/taxonomy-seed.ts. Edit the generator, not this file.
--
-- Owners reference profiles. Taxonomy slugs for services, amenities, equipment and marketplace
-- categories, collaboration types and genres. Money is integer paise; text beyond an amount
-- ("+ ₹5,000 deposit", "Royalties Split") is kept in a *_note column.
-- mock-studio-octave-sound-labs is imported as Wugweb (slug wugweb), matching its owner's profile.
-- Marketplace sellers with no Firebase user document keep a seller_name and no profile.
-- Imported role and title text is written without "/" (owner, 15 Sep 2026; taxonomy_renames.py).
-- Read: public (CMS pages when published). Write: owners of their own rows; CMS is not client-writable.
-- Not imported: studio phone numbers.
--
-- Each data block re-reads what it wrote and raises on any difference. Idempotent.

CREATE TABLE IF NOT EXISTS public.studios (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_profile_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  slug                text NOT NULL UNIQUE,
  name                text NOT NULL,
  description         text,
  location            text,
  geo_lat             double precision,
  geo_lng             double precision,
  hourly_rate_paise   bigint CHECK (hourly_rate_paise >= 0),
  rating              numeric(3,2) CHECK (rating >= 0 AND rating <= 5),
  review_count        int NOT NULL DEFAULT 0,
  verified_gold       boolean NOT NULL DEFAULT false,
  console_type        text,
  services            text[] NOT NULL DEFAULT '{}',
  amenities           text[] NOT NULL DEFAULT '{}',
  cancellation_policy text,
  operating_hours     text,
  image_url           text,
  images              text[] NOT NULL DEFAULT '{}',
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.studio_rooms (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id         uuid NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
  name              text NOT NULL,
  capacity          int CHECK (capacity >= 0),
  hourly_rate_paise bigint CHECK (hourly_rate_paise >= 0),
  amenities         text[] NOT NULL DEFAULT '{}',
  sort_order        int NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.studio_equipment (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id  uuid NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
  name       text NOT NULL,
  category   text,
  quantity   int CHECK (quantity >= 0),
  included   boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0
);

-- Reviews can be of a profile or of a studio, never both.
ALTER TABLE public.reviews ALTER COLUMN target_profile_id DROP NOT NULL;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS target_studio_id uuid REFERENCES public.studios(id) ON DELETE CASCADE;
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_one_target;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_one_target CHECK (num_nonnulls(target_profile_id, target_studio_id) = 1);
CREATE INDEX IF NOT EXISTS reviews_target_studio_idx ON public.reviews (target_studio_id, created_at DESC);
DROP POLICY IF EXISTS "Readable with its profile" ON public.reviews;
DROP POLICY IF EXISTS "Readable with its profile or studio" ON public.reviews;
CREATE POLICY "Readable with its profile or studio" ON public.reviews FOR SELECT
  USING (target_studio_id IS NOT NULL OR public.profile_is_readable(target_profile_id));

CREATE TABLE IF NOT EXISTS public.opportunities (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  slug               text NOT NULL UNIQUE,
  title              text NOT NULL,
  role_required      text,
  genres             text[] NOT NULL DEFAULT '{}',
  budget_paise       bigint CHECK (budget_paise >= 0),
  budget_unit        text,
  budget_note        text,
  collaboration_type text,
  location           text,
  status             text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'filled')),
  applicant_count    int NOT NULL DEFAULT 0,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.marketplace_listings (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug               text NOT NULL UNIQUE,
  seller_profile_id  uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  seller_name        text,
  title              text NOT NULL,
  category           text NOT NULL,
  item_category      text,
  item_category_kind text CHECK (item_category_kind IN ('equipment', 'instrument')),
  condition          text CHECK (condition IN ('new', 'like_new', 'used')),
  price_paise        bigint CHECK (price_paise >= 0),
  price_unit         text,
  price_note         text,
  image_url          text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  CHECK (seller_profile_id IS NOT NULL OR seller_name IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS public.feed_posts (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_type         text NOT NULL CHECK (post_type IN ('text', 'image', 'audio', 'video')),
  body              text,
  media_urls        text[] NOT NULL DEFAULT '{}',
  audio_url         text,
  likes_count       int NOT NULL DEFAULT 0,
  comments_count    int NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profile_business
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS hero_banner_url text,
  ADD COLUMN IF NOT EXISTS thumbnail_url text,
  ADD COLUMN IF NOT EXISTS icon_url text;

CREATE TABLE IF NOT EXISTS public.cms_pages (
  slug            text PRIMARY KEY,
  route           text NOT NULL UNIQUE,
  title           text NOT NULL,
  status          text NOT NULL CHECK (status IN ('draft', 'published')),
  content         text NOT NULL DEFAULT '',
  seo_description text,
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS studios_owner_idx          ON public.studios (owner_profile_id);
CREATE INDEX IF NOT EXISTS studio_rooms_studio_idx    ON public.studio_rooms (studio_id, sort_order);
CREATE INDEX IF NOT EXISTS studio_equipment_studio_idx ON public.studio_equipment (studio_id, sort_order);
CREATE INDEX IF NOT EXISTS opportunities_creator_idx  ON public.opportunities (creator_profile_id);
CREATE INDEX IF NOT EXISTS opportunities_open_idx     ON public.opportunities (created_at DESC) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS marketplace_seller_idx     ON public.marketplace_listings (seller_profile_id);
CREATE INDEX IF NOT EXISTS feed_posts_author_idx      ON public.feed_posts (author_profile_id, created_at DESC);

DO $rls$
DECLARE
  spec text[];
BEGIN
  FOREACH spec SLICE 1 IN ARRAY ARRAY[
    ['studios', 'auth.uid() = owner_profile_id'],
    ['studio_rooms', 'EXISTS (SELECT 1 FROM public.studios s WHERE s.id = studio_id AND s.owner_profile_id = auth.uid())'],
    ['studio_equipment', 'EXISTS (SELECT 1 FROM public.studios s WHERE s.id = studio_id AND s.owner_profile_id = auth.uid())'],
    ['opportunities', 'auth.uid() = creator_profile_id'],
    ['marketplace_listings', 'auth.uid() = seller_profile_id'],
    ['feed_posts', 'auth.uid() = author_profile_id']
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', spec[1]);
    EXECUTE format('GRANT SELECT ON public.%I TO anon, authenticated', spec[1]);
    EXECUTE format('GRANT INSERT, UPDATE, DELETE ON public.%I TO authenticated', spec[1]);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', spec[1]);
    EXECUTE format('DROP POLICY IF EXISTS "Readable by everyone" ON public.%I', spec[1]);
    EXECUTE format('CREATE POLICY "Readable by everyone" ON public.%I FOR SELECT USING (true)', spec[1]);
    EXECUTE format('DROP POLICY IF EXISTS "Owners write their own" ON public.%I', spec[1]);
    EXECUTE format('CREATE POLICY "Owners write their own" ON public.%I FOR ALL TO authenticated USING (%s) WITH CHECK (%s)',
                   spec[1], spec[2], spec[2]);
  END LOOP;
END
$rls$;

ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.cms_pages TO anon, authenticated;
GRANT ALL ON public.cms_pages TO service_role;
DROP POLICY IF EXISTS "Published pages are readable by everyone" ON public.cms_pages;
CREATE POLICY "Published pages are readable by everyone" ON public.cms_pages FOR SELECT USING (status = 'published');
"""


def cols_of(rows):
    return list(rows[0].keys())


TYPES = {"id": "uuid", "owner_profile_id": "uuid", "studio_id": "uuid", "target_studio_id": "uuid",
         "creator_profile_id": "uuid", "seller_profile_id": "uuid", "author_profile_id": "uuid", "profile_id": "uuid",
         "geo_lat": "double precision", "geo_lng": "double precision", "hourly_rate_paise": "bigint",
         "budget_paise": "bigint", "price_paise": "bigint", "rating": "numeric", "review_count": "int",
         "capacity": "int", "quantity": "int", "sort_order": "int", "applicant_count": "int", "likes_count": "int",
         "comments_count": "int", "verified_gold": "boolean", "included": "boolean", "services": "text[]",
         "amenities": "text[]", "images": "text[]", "genres": "text[]", "media_urls": "text[]",
         "created_at": "timestamptz", "updated_at": "timestamptz"}


def body(table, rows, key):
    cols = cols_of(rows)
    typed = ", ".join(f"{c} {TYPES.get(c, 'text')}" for c in cols)
    rs = f"jsonb_to_recordset(payload) AS r({typed})"
    compared = [c for c in cols if c not in ("created_at", "updated_at")]
    keys = [k.strip() for k in key.split(",")]
    return f"""  INSERT INTO public.{table} ({", ".join(cols)})
  SELECT {", ".join("r." + c for c in cols)} FROM {rs}
  ON CONFLICT ({key}) DO UPDATE SET {", ".join(f"{c} = EXCLUDED.{c}" for c in cols if c not in keys)};

  IF (SELECT count(*) FROM {rs} JOIN public.{table} t ON {" AND ".join(f"t.{k} = r.{k}" for k in keys)}
      WHERE ({", ".join("t." + c for c in compared)}) IS NOT DISTINCT FROM ({", ".join("r." + c for c in compared)}))
     <> jsonb_array_length(payload) THEN
    RAISE EXCEPTION '{table} import: stored rows differ from the payload';
  END IF;"""


BRAND_BODY = """  UPDATE public.profile_business t SET logo_url = r.logo_url, hero_banner_url = r.hero_banner_url,
    thumbnail_url = r.thumbnail_url, icon_url = r.icon_url
  FROM jsonb_to_recordset(payload) AS r(profile_id uuid, logo_url text, hero_banner_url text, thumbnail_url text, icon_url text)
  WHERE t.profile_id = r.profile_id;
  INSERT INTO public.profile_business (profile_id, logo_url, hero_banner_url, thumbnail_url, icon_url)
  SELECT r.profile_id, r.logo_url, r.hero_banner_url, r.thumbnail_url, r.icon_url
  FROM jsonb_to_recordset(payload) AS r(profile_id uuid, logo_url text, hero_banner_url text, thumbnail_url text, icon_url text)
  ON CONFLICT (profile_id) DO NOTHING;"""


def block(label, rows, text_body):
    payload = json.dumps(rows, ensure_ascii=False, separators=(",", ":"))
    assert "$json$" not in payload
    return f"-- {label} ({len(rows)} rows)\nDO $import$\nDECLARE\n  payload jsonb := $json${payload}$json$;\nBEGIN\n{text_body}\nEND\n$import$;\n"


blocks = [
    block("studios", studios, body("studios", studios, "id")),
    block("studio_rooms", rooms, body("studio_rooms", rooms, "id")),
    block("studio_equipment", equipment, body("studio_equipment", equipment, "id")),
    block("studio reviews", studio_reviews, body("reviews", studio_reviews, "id")),
    block("opportunities", opportunities, body("opportunities", opportunities, "id")),
    block("marketplace_listings", listings, body("marketplace_listings", listings, "id")),
    block("feed_posts", posts, body("feed_posts", posts, "id")),
    block("brand assets", brand, BRAND_BODY),
    block("cms_pages", pages, body("cms_pages", pages, "slug")),
]
with open(OUT, "w", encoding="utf-8") as f:
    f.write(SCHEMA + "\n" + "\n".join(blocks))
print({"studios": len(studios), "rooms": len(rooms), "equipment": len(equipment), "studio_reviews": len(studio_reviews),
       "opportunities": len(opportunities), "listings": len(listings), "posts": len(posts), "brand": len(brand),
       "pages": len(pages)}, "bytes", [len(b.encode()) for b in blocks], len(SCHEMA.encode()))
