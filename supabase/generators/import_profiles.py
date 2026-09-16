"""Generates two migrations from Firebase users + portfolio_projects: the profile import (with the linked
seed profiles' portfolio sections and covers), and the private-details and portfolio-counts import.

Usage (repo root):
  bun run supabase/generators/export_linked_profiles.ts > /tmp/linked.json
  python3 supabase/generators/import_profiles.py <FIRESTORE-FULL-DUMP.md> /tmp/linked.json \
    supabase/migrations/20260914150000_import_profiles.sql \
    supabase/migrations/20260915180000_private_imports_and_counts.sql

Every value is written in the shape the app already reads: taxonomy slugs in roles / instruments /
genres / languages, "<role slug>:<label>" in specialisations, onboarding availability values,
link maps keyed by platform, and portfolio_items kinds from src/data/portfolio.ts. Text is written without
"/" (owner, 15 Sep 2026): taxonomy_renames.clean_text.
"""
from __future__ import annotations

import json
import re
import sys
import uuid

from taxonomy_renames import clean_row

DUMP, LINKED, OUT, OUT_PRIVATE = sys.argv[1:5]
NS = uuid.UUID("5b1b2f0e-3c1a-4f6e-9d3a-6d1c2b7e9a10")  # stable ids across re-runs


def uid(key: str) -> str:
    return str(uuid.uuid5(NS, key))


text = open(DUMP, encoding="utf-8").read()
FB = {m.group(1): json.loads(m.group(3))
      for m in re.finditer(r"`(\w+)` — (\d+) docs\s*```json\s*(\[.*?\])\s*```", text, re.S)}
LINKED_PROFILES = json.load(open(LINKED, encoding="utf-8"))

# Usernames already in profiles (13 Sep seed). A Firebase user whose username clashes is imported
# under the name below (owner's call, 14 Sep); any other clash stops the generator.
EXISTING = {p["username"] for p in LINKED_PROFILES}
RENAME_ON_CLASH = {"octave.sound.labs": ("wugweb", "Wugweb")}

LANGUAGE = {"English": "en", "Hindi (हिंदी)": "hi", "Punjabi (ਪੰਜਾਬੀ)": "pa", "Tamil (தமிழ்)": "ta",
            "Tamil": "ta", "Telugu (తెలుగు)": "te", "Marathi (मराठी)": "mr", "Gujarati (ગુજરાતી)": "gu",
            "Kannada (ಕನ್ನಡ)": "kn", "Kannada": "kn", "Malayalam (മലയാളം)": "ml", "Bengali (বাংলা)": "bn",
            "Assamese (অসমীয়া)": "as"}
# Firebase labels (keys) -> taxonomy slugs (values). The dump carries single names since 16 Sep 2026
# (owner: "edit the export file"; taxonomy_renames.py OLD_LABELS), so keys are the single labels.
INSTRUMENT = {"Acoustic Guitar": "acoustic_guitar", "Electric Guitar": "electric_guitar",
              "Bass Guitar": "bass_guitar", "Keyboard": "keyboard",
              "Piano": "piano", "Drums": "drums", "Tabla": "tabla",
              "Sitar": "sitar", "Flute (Bansuri)": "flute_bansuri", "Harmonium": "harmonium",
              "Dholak": "dholak", "Violin": "violin", "Saxophone": "saxophone", "Trumpet": "trumpet",
              "Sarod": "sarod", "Shehnai": "shehnai", "Mridangam": "mridangam", "Santoor": "santoor",
              "Veena": "veena", "Tanpura": "tanpura", "Cello": "cello"}
GENRE = {"Bollywood": "bollywood", "Indie Pop": "indie_pop",
         "Hindustani Classical": "hindustani_classical", "Carnatic Classical": "carnatic_classical",
         "Bhangra": "bhangra", "Rajasthani Folk": "rajasthani_folk",
         "Sufi Devotional": "sufi_devotional", "Ghazal": "ghazal", "Qawwali": "qawwali",
         "Rock": "rock", "Hip Hop": "hiphop", "Lofi": "lofi",
         "EDM": "edm", "Acoustic": "acoustic",
         "R&B": "rnb", "Jazz": "jazz", "Reggae": "reggae"}
# Firebase person_types slugs that exist unchanged in taxonomy person_types.
PERSON_TYPES = {"singer", "rapper", "folk_vocalist", "guitarist", "keyboardist", "drummer", "sitarist",
                "composer", "lyricist", "arranger", "producer", "sound_engineer", "sound_designer",
                "artist_manager", "music_label", "music_publisher", "studio", "event_organizer"}
BUSINESS_TYPE = {"Studio": "studio", "Label": "music_label", "School": "music_school",
                 "Booking Agency": "booking_agency", "Artist Manager": "artist_manager",
                 "Dealer": "dealer", "Production House": "production_house",
                 "Rental Company": "rental_provider"}
VOCAL_RANGE = {"soprano": "Soprano", "mezzo_soprano": "Mezzo-Soprano", "alto": "Alto", "tenor": "Tenor",
               "baritone": "Baritone", "bass": "Bass"}
DAW = {"logic_pro": "Logic Pro", "pro_tools": "Pro Tools", "ableton_live": "Ableton Live",
       "fl_studio": "FL Studio", "cubase": "Cubase", "studio_one": "Studio One", "reaper": "Reaper"}
SERVICE = {"recording": "Recording", "mixing": "Mixing", "mastering": "Mastering"}
# Onboarding availability values that profile-view.ts maps; other statuses have no equivalent.
AVAILABILITY = {"open_for_gigs": "Shows", "on_tour": "Touring"}
STATE = {"Mumbai": "Maharashtra", "Pune": "Maharashtra", "Bengaluru": "Karnataka", "Chennai": "Tamil Nadu",
         "New Delhi": "Delhi", "Goa": "Goa", "Hyderabad": "Telangana", "Ahmedabad": "Gujarat",
         "Kolkata": "West Bengal", "Chandigarh": "Chandigarh"}
PORTFOLIO_KIND = {"song": "track", "dj_mix": "track", "album": "album", "ep": "album",
                  "live_performance": "performance", "film_score": "project"}
RELEASE_KIND = {"Album": "album", "EP": "album", "Single": "track", "Score": "project"}


def username(fid: str) -> str:
    s = re.sub(r"^mock-", "", fid)
    s = re.sub(r"^(talent|business|band|venue)-", "", s)
    s = re.sub(r"^filler-", "", s)
    s = re.sub(r"-mock$", "", re.sub(r"-\d+$", "", s))
    return s.replace("-", ".")  # usernames are [a-z0-9._] (20260914200000_username_rules)


def city_state(location: str) -> tuple[str, str | None]:
    city, _, rest = location.partition(",")
    city = "New Delhi" if city.strip() == "Delhi" else city.strip()
    state = STATE.get(city)
    if city == "Goa":  # "Goa, GA · Anjuna": the locality is the city
        locality = rest.split("·")[-1].strip()
        return locality, state
    return city, state


def mapped(values, table, what, fid, problems):
    out = []
    for v in values or []:
        if v not in table:
            problems.append(f"{fid}: {what} {v!r} has no slug")
            continue
        if table[v] not in out:
            out.append(table[v])
    return out


problems: list[str] = []
profile_rows: list[dict] = []
owner_of: dict[str, str] = {}
created = renamed = 0

for u in FB["users"]:
    fid, name, display = u["_id"], username(u["_id"]), u["displayName"]
    if name in EXISTING:
        if name not in RENAME_ON_CLASH:
            sys.exit(f"{fid}: username {name!r} already exists")
        name, display = RENAME_ON_CLASH[name]
        renamed += 1
    pid = uid(f"firebase:users/{fid}")
    owner_of[fid] = pid

    type_slug = BUSINESS_TYPE.get(u.get("businessType")) or ("venue" if u["profileType"] == "VENUE" else None)
    roles = []
    for r in [type_slug, u.get("primaryRole"), u.get("secondaryRole")]:
        if not r:
            continue
        if r not in PERSON_TYPES and r not in BUSINESS_TYPE.values() and r != "venue":
            problems.append(f"{fid}: role {r!r} has no slug")
            continue
        if r not in roles:
            roles.append(r)
    roles = roles[:3]

    specs = []
    if u.get("vocalRange"):
        role = "singer" if "singer" in roles else roles[0]
        specs.append(f"{role}:{VOCAL_RANGE[u['vocalRange']]}")
    for d in u.get("dawStack") or []:
        role = next((r for r in ("sound_engineer", "producer") if r in roles), roles[0])
        specs.append(f"{role}:{DAW[d]}")
    for s in u.get("services") or []:
        specs.append(f"{roles[0]}:{SERVICE[s]}")

    city, state = city_state(u["location"])
    links = {k: v for k, v in (u.get("externalLinks") or {}).items() if v}
    profile_rows.append(clean_row("profiles", {
        "id": pid, "username": name, "display_name": display, "headline": u.get("tagline"),
        "bio": u["bio"], "city": city, "state": state, "country": "India", "roles": roles,
        "instruments": mapped(u.get("instruments"), INSTRUMENT, "instrument", fid, problems),
        "genres": mapped(u.get("genres"), GENRE, "genre", fid, problems),
        "languages": mapped(u.get("languages"), LANGUAGE, "language", fid, problems),
        "specialisations": specs, "avatar_url": u["avatarUrl"],
        "availability": AVAILABILITY.get(u.get("sessionAvailability")), "visibility": "public",
        "links": links, "created_at": u["createdAt"],
    }))
    if "Based out of Mumbai" in u["bio"]:  # was "Mumbai/Chandigarh"; the edit kept Mumbai, the profile's city
        assert city == "Mumbai", (fid, city)
    created += 1

portfolio_rows: list[tuple] = []  # (id, user_id, title, kind, description, role, collaborators, cover, media, year, sort)

by_owner: dict[str, list] = {}
for p in FB["portfolio_projects"]:
    by_owner.setdefault(p["ownerUid"], []).append(p)
for fid, items in by_owner.items():
    items.sort(key=lambda p: p.get("releaseDate") or "", reverse=True)
    for i, p in enumerate(items):
        media = p.get("spotifyUrl") or p.get("youtubeUrl") or p.get("appleMusicUrl")
        year = int(p["releaseDate"][:4]) if p.get("releaseDate") else None
        portfolio_rows.append((
            uid(f"firebase:portfolio_projects/{p['_id']}"), owner_of[fid], p["name"],
            PORTFOLIO_KIND[p["type"]], p.get("description") or None, ", ".join(p.get("ownerRoles") or []) or None,
            [c["name"] for c in p.get("collaborators") or []], None, media, year,
            p.get("visibility") == "Public", 100 + i,  # after the linked profile's own items
        ))

# ---- private details and portfolio counts (20260915180000; owner, 16 Sep 2026) ------------------------
# Firebase gender -> profile_private.gender (its CHECK: woman, man, non_binary, prefer_not_to_say).
GENDER = {"Male": "man", "Female": "woman"}
EMAIL = re.compile(r"[^@\s]+@[^@\s]+\.[^@\s]+")  # same shape as the column CHECK
GSTIN = re.compile(r"[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]")  # 15-character GSTIN layout
E164 = re.compile(r"\+[1-9][0-9]{7,14}")


def e164(raw: str) -> str:
    """'+91 98200 00000' -> '+919820000000'."""
    return re.sub(r"[^0-9+]", "", raw)


private_rows: dict[str, dict] = {}
for u in FB["users"]:
    fid = u["_id"]
    gender = u.get("gender")
    if gender is not None and gender not in GENDER:
        problems.append(f"{fid}: gender {gender!r} has no value")
    email, gstin = u.get("email"), u.get("gstin")
    if email is not None and not (EMAIL.fullmatch(email) and len(email) <= 254):
        problems.append(f"{fid}: email {email!r} is not an address")
    if gstin is not None and not GSTIN.fullmatch(gstin):
        problems.append(f"{fid}: gstin {gstin!r} is not a GSTIN")
    private_rows[owner_of[fid]] = {"id": owner_of[fid], "email": email, "gender": GENDER.get(gender),
                                   "gstin": gstin, "business_phone": None}
# A studio's contact number is its owner's business phone, kept privately on the owner's profile_private.
for st in FB["studios"]:
    if st.get("phone"):
        row = private_rows[owner_of[st["ownerUid"]]]
        phone = e164(st["phone"])
        if not E164.fullmatch(phone):
            problems.append(f"{st['_id']}: phone {st['phone']!r} is not a phone number")
        elif row["business_phone"] not in (None, phone):
            problems.append(f"{st['ownerUid']}: two studio phones")
        row["business_phone"] = phone
private_rows_list = [r for r in private_rows.values() if any(r[c] is not None for c in ("email", "gender", "gstin", "business_phone"))]

COUNTS = ("likes_count", "views_count", "shares_count")
count_rows = [{"id": uid(f"firebase:portfolio_projects/{p['_id']}"), "likes_count": int(p.get("likes") or 0),
               "views_count": int(p.get("projectViews") or 0), "shares_count": int(p.get("shares") or 0)}
              for p in FB["portfolio_projects"]]
assert all(r[c] >= 0 for r in count_rows for c in COUNTS)

covers: list[dict] = []
for lp in LINKED_PROFILES:
    pid, order = lp["id"], 0

    def add(section, item, **row):
        global order
        portfolio_rows.append((
            uid(f"linked:{pid}:{section}:{item['id']}"), pid, row["title"], row["kind"],
            row.get("description"), row.get("role"), row.get("collaborators", []), row.get("cover"),
            None, row.get("year"), True, order,
        ))
        order += 1

    for a in lp["audio"]:
        add("audio", a, title=a["title"], kind="track", role=a["role"] or None,
            description=a["project"] or None, cover=a["artwork"] or None)
    for v in lp["video"]:
        add("video", v, title=v["title"], kind="video", description=v["context"] or None, cover=v["thumb"] or None)
    for p in lp["projects"]:
        # Free text in the seed ("Multi-cam series, 2 episodes"), not a name list: keep it whole.
        collaborators = [p["collaborators"].strip()] if p["collaborators"].strip() else []
        add("projects", p, title=p["name"], kind="project", role=p["role"] or None,
            collaborators=collaborators, description=" · ".join(x for x in (p["genre"], p["status"]) if x) or None,
            cover=p["cover"] or None, year=int(p["year"]) if p["year"].isdigit() else None)
    for r in lp["discography"]:
        add("discography", r, title=r["title"], kind=RELEASE_KIND[r["kind"]], description=r["label"] or None,
            cover=r["cover"] or None, year=int(r["year"]) if r["year"].isdigit() else None)
    if lp["cover"]:
        covers.append({"id": pid, "cover_url": lp["cover"]})

for r in portfolio_rows:
    assert len(r[2]) <= 120 and (r[4] is None or len(r[4]) <= 1200) and (r[5] is None or len(r[5]) <= 120), r

PORTFOLIO_FIELDS = ["id", "user_id", "title", "kind", "description", "role", "collaborators", "cover_url",
                    "media_url", "release_year", "published", "sort_order"]
portfolio_dicts = [clean_row("portfolio_items", dict(zip(PORTFOLIO_FIELDS, r))) for r in portfolio_rows]

PROFILE_COLS = [("id", "uuid"), ("username", "text"), ("display_name", "text"), ("headline", "text"),
                ("bio", "text"), ("city", "text"), ("state", "text"), ("country", "text"), ("roles", "text[]"),
                ("instruments", "text[]"), ("genres", "text[]"), ("languages", "text[]"),
                ("specialisations", "text[]"), ("avatar_url", "text"), ("availability", "text"),
                ("visibility", "text"), ("links", "jsonb"), ("created_at", "timestamptz")]
PORTFOLIO_COLS = [("id", "uuid"), ("user_id", "uuid"), ("title", "text"), ("kind", "text"),
                  ("description", "text"), ("role", "text"), ("collaborators", "text[]"), ("cover_url", "text"),
                  ("media_url", "text"), ("release_year", "int"), ("published", "boolean"), ("sort_order", "int")]


def recordset(cols):
    return "jsonb_to_recordset(payload) AS r(" + ", ".join(f"{c} {t}" for c, t in cols) + ")"


def chunks(rows, limit=24000):
    out, cur = [], []
    for row in rows:
        cur.append(row)
        if len(json.dumps(cur, ensure_ascii=False, separators=(",", ":")).encode()) > limit and len(cur) > 1:
            out.append(cur[:-1])
            cur = [row]
    return out + [cur]


def block(label, rows, body):
    payload = json.dumps(rows, ensure_ascii=False, separators=(",", ":"))
    assert "$json$" not in payload
    return (f"-- {label}\nDO $import$\nDECLARE\n  payload jsonb := $json${payload}$json$;\nBEGIN\n{body}\nEND\n"
            "$import$;\n")


compared = [c for c, _ in PROFILE_COLS if c not in ("id", "created_at")]
PROFILE_BODY = f"""  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, raw_app_meta_data,
    raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, is_sso_user, is_anonymous)
  SELECT '00000000-0000-0000-0000-000000000000', r.id, 'authenticated', 'authenticated', NULL, NULL, '{{}}'::jsonb,
    jsonb_build_object('full_name', r.display_name, 'avatar_url', r.avatar_url), r.created_at, r.created_at,
    '', '', '', '', false, false
  FROM {recordset(PROFILE_COLS)}
  ON CONFLICT (id) DO NOTHING;

  -- on_auth_user_created has made a bare profile for each; fill it.
  INSERT INTO public.profiles ({", ".join(c for c, _ in PROFILE_COLS)}, onboarding_complete)
  SELECT {", ".join("r." + c for c, _ in PROFILE_COLS)}, true
  FROM {recordset(PROFILE_COLS)}
  ON CONFLICT (id) DO UPDATE SET {", ".join(f"{c} = EXCLUDED.{c}" for c in compared)}, onboarding_complete = true;

  IF (SELECT count(*) FROM {recordset(PROFILE_COLS)} JOIN public.profiles p ON p.id = r.id
      WHERE ({", ".join("p." + c for c in compared)}) IS NOT DISTINCT FROM ({", ".join("r." + c for c in compared)}))
     <> jsonb_array_length(payload) THEN
    RAISE EXCEPTION 'profile import: stored rows differ from the payload';
  END IF;"""

PORTFOLIO_BODY = f"""  INSERT INTO public.portfolio_items ({", ".join(c for c, _ in PORTFOLIO_COLS)})
  SELECT {", ".join("r." + c for c, _ in PORTFOLIO_COLS)}
  FROM {recordset(PORTFOLIO_COLS)}
  ON CONFLICT (id) DO NOTHING;

  IF (SELECT count(*) FROM {recordset(PORTFOLIO_COLS)} JOIN public.portfolio_items p ON p.id = r.id
      WHERE ({", ".join("p." + c for c, _ in PORTFOLIO_COLS)}) IS NOT DISTINCT FROM ({", ".join("r." + c for c, _ in PORTFOLIO_COLS)}))
     <> jsonb_array_length(payload) THEN
    RAISE EXCEPTION 'portfolio import: stored rows differ from the payload';
  END IF;"""

COVER_BODY = """  UPDATE public.profiles p SET cover_url = r.cover_url
  FROM jsonb_to_recordset(payload) AS r(id uuid, cover_url text)
  WHERE p.id = r.id AND p.cover_url IS NULL;"""

blocks = []
profile_chunks = chunks(profile_rows)
for i, rows in enumerate(profile_chunks, 1):
    blocks.append(block(f"profiles {i}/{len(profile_chunks)} ({len(rows)} rows)", rows, PROFILE_BODY))
blocks.append(block(f"linked profile covers ({len(covers)} rows)", covers, COVER_BODY))
portfolio_chunks = chunks(portfolio_dicts)
for i, rows in enumerate(portfolio_chunks, 1):
    blocks.append(block(f"portfolio_items {i}/{len(portfolio_chunks)} ({len(rows)} rows)", rows, PORTFOLIO_BODY))

header = f"""-- Profile import: Firebase users and portfolio projects, and the linked seed profiles' portfolio.
--
-- Generated by supabase/generators/import_profiles.py from Claude outputs/audits/FIRESTORE-FULL-DUMP.md
-- (musiclinkd-7ae30, read 14 Sep 2026) and src/data/linked-profiles.ts. Edit the generator, not this file.
--
-- Firebase users: {created} new profiles, each with a sign-in-less auth.users row (no email, no
-- password, as in 20260913090949_seed_linked_profiles.sql). {renamed} clashed with an existing username:
-- mock-business-octave-sound-labs is imported as "Wugweb" (username wugweb); the existing
-- octave.sound.labs profile is unchanged. Email, gender, GSTIN and the studio phone go to the owner-only
-- profile_private table (20260915180000_private_imports_and_counts.sql), never to profiles.
--
-- Values are written in the shapes the app reads: taxonomy slugs; "<role slug>:<label>"
-- specialisations; availability Shows or Touring (other Firebase statuses have no equivalent, so null);
-- business and venue users get their business type as the first role. Text is written without "/"
-- (owner, 15 Sep 2026; taxonomy_renames.py): old combined labels become single ones, and the listed
-- phrases are shortened.
--
-- Not imported here (no column or table yet): hourly rate, budget tier, persona and trust badges,
-- verified / available flags, business address / hours / team / service offerings / rosters /
-- courses, band lineup and shows, venue capacity / features, and the linked profiles' services,
-- experience, reviews and gallery.
--
-- portfolio_items: {len(portfolio_rows)} rows ({len(FB['portfolio_projects'])} from Firebase, the rest from the 11
-- linked profiles). Linked profiles also get profiles.cover_url from their seed cover where unset.
--
-- Rows travel as JSON, one DO block per ~24 KB. Each block re-reads what it wrote and raises if any
-- stored value differs from its payload. Idempotent: fixed ids, ON CONFLICT.
-- Rollback: delete the payload ids from public.portfolio_items, then from auth.users (profiles cascade).
"""
if problems:
    sys.exit("Unmapped values:\n" + "\n".join(problems))

with open(OUT, "w", encoding="utf-8") as f:
    f.write(header + "\n" + "\n".join(blocks))
print(f"profiles created {created}, renamed {renamed}, portfolio rows {len(portfolio_rows)}, covers {len(covers)}, "
      f"blocks {[len(b.encode()) for b in blocks]}")

# ---- 20260915180000: private details and portfolio counts ---------------------------------------------
PRIVATE_COLS = [("id", "uuid"), ("email", "text"), ("gender", "text"), ("gstin", "text"), ("business_phone", "text")]
PRIVATE_FIELDS = [c for c, _ in PRIVATE_COLS if c != "id"]
COUNT_COLS = [("id", "uuid")] + [(c, "int") for c in COUNTS]
gender_counts = {g: sum(r["gender"] == g for r in private_rows_list) for g in sorted(set(GENDER.values()))}
source_genders = {str(g): sum(u.get("gender") == g for u in FB["users"]) for g in ("Male", "Female", None)}
expected = {"email": sum(r["email"] is not None for r in private_rows_list),
            "gstin": sum(r["gstin"] is not None for r in private_rows_list),
            "business_phone": sum(r["business_phone"] is not None for r in private_rows_list), **gender_counts}

PRIVATE_SCHEMA = f"""-- Private imports: Firebase email, gender and GSTIN, and a studio's contact phone, into the owner-only
-- public.profile_private; and portfolio likes, views and shares on public.portfolio_items.
--
-- Generated by supabase/generators/import_profiles.py from Claude outputs/audits/FIRESTORE-FULL-DUMP.md
-- (musiclinkd-7ae30). Edit the generator, not this file. Owner decisions of 16 Sep 2026.
--
-- profile_private (owner-only: its policies in 20260915100000_profile_private.sql cover the new columns;
-- anon has no privilege on the table, and this migration raises if that changes)
--   email           Firebase users.email. auth.users is not touched: imported accounts stay sign-in-less.
--   gender          Firebase users.gender: Male -> man, Female -> woman ({source_genders["Male"]} and {source_genders["Female"]}; {source_genders["None"]} users have none).
--   gstin           Firebase users.gstin. Shape-checked as a 15-character GSTIN (state code, PAN, entity,
--                   Z, check character); the check character itself is not verified.
--   business_phone  Firebase studios.phone, on the studio owner's row, in E.164 ("+91 98200 00000" is
--                   stored as +919820000000). The studios table is public, so the number is not kept there.
--   Rows: {len(private_rows_list)} profiles ({expected["email"]} emails, {gender_counts["man"]} man, {gender_counts["woman"]} woman, {expected["gstin"]} GSTIN, {expected["business_phone"]} business phone). Profile ids are
--   import_profiles.py's (uuid5 of "firebase:users/<id>"). A value already stored is never cleared.
--
-- portfolio_items + likes_count, views_count, shares_count (int, NOT NULL DEFAULT 0, never negative).
--   Backfilled for the {len(count_rows)} Firebase portfolio_projects (likes, projectViews, shares); every other
--   row keeps 0. artworkTheme is not imported.
--
-- Each data block re-reads what it wrote and raises on any difference. Idempotent.
--
-- Rollback:
--   ALTER TABLE public.portfolio_items DROP COLUMN IF EXISTS likes_count, DROP COLUMN IF EXISTS views_count,
--     DROP COLUMN IF EXISTS shares_count;
--   ALTER TABLE public.profile_private DROP COLUMN IF EXISTS email, DROP COLUMN IF EXISTS gstin,
--     DROP COLUMN IF EXISTS business_phone;
--   (gender values imported here: UPDATE public.profile_private SET gender = NULL WHERE id IN (payload ids).)

ALTER TABLE public.profile_private
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS gstin text,
  ADD COLUMN IF NOT EXISTS business_phone text;

ALTER TABLE public.profile_private DROP CONSTRAINT IF EXISTS profile_private_email;
ALTER TABLE public.profile_private ADD CONSTRAINT profile_private_email CHECK (
  email IS NULL OR (char_length(email) <= 254 AND email ~ '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$')
);

ALTER TABLE public.profile_private DROP CONSTRAINT IF EXISTS profile_private_gstin;
ALTER TABLE public.profile_private ADD CONSTRAINT profile_private_gstin CHECK (
  gstin IS NULL OR gstin ~ '^[0-9]{{2}}[A-Z]{{5}}[0-9]{{4}}[A-Z][1-9A-Z]Z[0-9A-Z]$'
);

ALTER TABLE public.profile_private DROP CONSTRAINT IF EXISTS profile_private_business_phone;
ALTER TABLE public.profile_private ADD CONSTRAINT profile_private_business_phone CHECK (
  business_phone IS NULL OR business_phone ~ '^\\+[1-9][0-9]{{7,14}}$'
);

-- Owner-only, restated: nothing public reads these columns.
REVOKE ALL ON public.profile_private FROM anon;
REVOKE ALL ON public.profile_private FROM PUBLIC;
ALTER TABLE public.profile_private ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.portfolio_items
  ADD COLUMN IF NOT EXISTS likes_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS views_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shares_count int NOT NULL DEFAULT 0;

ALTER TABLE public.portfolio_items DROP CONSTRAINT IF EXISTS portfolio_items_counts_nonnegative;
ALTER TABLE public.portfolio_items ADD CONSTRAINT portfolio_items_counts_nonnegative CHECK (
  likes_count >= 0 AND views_count >= 0 AND shares_count >= 0
);
"""

PRIVATE_BODY = f"""  INSERT INTO public.profile_private ({", ".join(c for c, _ in PRIVATE_COLS)})
  SELECT {", ".join("r." + c for c, _ in PRIVATE_COLS)}
  FROM {recordset(PRIVATE_COLS)}
  ON CONFLICT (id) DO UPDATE SET {", ".join(f"{c} = coalesce(EXCLUDED.{c}, profile_private.{c})" for c in PRIVATE_FIELDS)},
    updated_at = now()
  WHERE ({", ".join("profile_private." + c for c in PRIVATE_FIELDS)})
        IS DISTINCT FROM ({", ".join(f"coalesce(EXCLUDED.{c}, profile_private.{c})" for c in PRIVATE_FIELDS)});

  IF (SELECT count(*) FROM {recordset(PRIVATE_COLS)} JOIN public.profile_private p ON p.id = r.id
      WHERE {" AND ".join(f"(r.{c} IS NULL OR p.{c} = r.{c})" for c in PRIVATE_FIELDS)})
     <> jsonb_array_length(payload) THEN
    RAISE EXCEPTION 'private import: stored rows differ from the payload';
  END IF;"""

COUNT_BODY = f"""  UPDATE public.portfolio_items t SET {", ".join(f"{c} = r.{c}" for c in COUNTS)}
  FROM {recordset(COUNT_COLS)}
  WHERE t.id = r.id AND ({", ".join("t." + c for c in COUNTS)}) IS DISTINCT FROM ({", ".join("r." + c for c in COUNTS)});

  IF (SELECT count(*) FROM {recordset(COUNT_COLS)} JOIN public.portfolio_items t ON t.id = r.id
      WHERE ({", ".join("t." + c for c in COUNTS)}) = ({", ".join("r." + c for c in COUNTS)}))
     <> jsonb_array_length(payload) THEN
    RAISE EXCEPTION 'portfolio counts import: stored rows differ from the payload';
  END IF;"""

PRIVATE_VERIFY = f"""-- verify
DO $verify$
DECLARE
  c text;
BEGIN
  IF (SELECT count(*) FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'profile_private'
        AND column_name IN ('email', 'gstin', 'business_phone') AND is_nullable = 'YES') <> 3 THEN
    RAISE EXCEPTION 'profile_private email, gstin and business_phone columns missing';
  END IF;
  IF (SELECT count(*) FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'portfolio_items'
        AND column_name IN ('likes_count', 'views_count', 'shares_count') AND is_nullable = 'NO'
        AND column_default = '0') <> 3 THEN
    RAISE EXCEPTION 'portfolio_items count columns missing';
  END IF;

  -- Private stays private: no privilege for anon or PUBLIC, row security on, no policy that reaches them.
  FOREACH c IN ARRAY ARRAY['id', 'date_of_birth', 'gender', 'email', 'gstin', 'business_phone'] LOOP
    IF has_column_privilege('anon', 'public.profile_private', c, 'SELECT') THEN
      RAISE EXCEPTION 'profile_private.% is readable by anon', c;
    END IF;
  END LOOP;
  IF has_table_privilege('anon', 'public.profile_private', 'SELECT')
     OR EXISTS (SELECT 1 FROM pg_class t, aclexplode(t.relacl) g
                WHERE t.oid = 'public.profile_private'::regclass AND g.grantee = 0)
     OR EXISTS (SELECT 1 FROM pg_attribute t, aclexplode(t.attacl) g
                WHERE t.attrelid = 'public.profile_private'::regclass AND g.grantee = 0)
     OR NOT (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.profile_private'::regclass)
     OR EXISTS (SELECT 1 FROM pg_policy
                WHERE polrelid = 'public.profile_private'::regclass
                  AND (polroles @> ARRAY[0::oid] OR polroles @> ARRAY[(SELECT oid FROM pg_roles WHERE rolname = 'anon')])) THEN
    RAISE EXCEPTION 'profile_private is reachable by anon or PUBLIC';
  END IF;

  IF (SELECT count(*) FILTER (WHERE email IS NOT NULL) FROM public.profile_private) < {expected["email"]}
     OR (SELECT count(*) FILTER (WHERE gender = 'man') FROM public.profile_private) < {gender_counts["man"]}
     OR (SELECT count(*) FILTER (WHERE gender = 'woman') FROM public.profile_private) < {gender_counts["woman"]}
     OR (SELECT count(*) FILTER (WHERE gstin IS NOT NULL) FROM public.profile_private) < {expected["gstin"]}
     OR (SELECT count(*) FILTER (WHERE business_phone IS NOT NULL) FROM public.profile_private) < {expected["business_phone"]} THEN
    RAISE EXCEPTION 'private import: fewer values stored than imported';
  END IF;
END
$verify$;
"""

private_blocks = []
for label, rows, body in (("profile_private", private_rows_list, PRIVATE_BODY),
                          ("portfolio_items counts", count_rows, COUNT_BODY)):
    cs = chunks(rows)
    for i, rs in enumerate(cs, 1):
        private_blocks.append(block(f"{label} {i}/{len(cs)} ({len(rs)} rows)", rs, body))

with open(OUT_PRIVATE, "w", encoding="utf-8") as f:
    f.write(PRIVATE_SCHEMA + "\n" + "\n".join(private_blocks) + "\n" + PRIVATE_VERIFY)
print({"private rows": len(private_rows_list), **expected, "source genders": source_genders,
       "count rows": len(count_rows), "bytes": [len(b.encode()) for b in private_blocks]})
