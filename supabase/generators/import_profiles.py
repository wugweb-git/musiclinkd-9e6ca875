"""Generates the profile import migration: Firebase users + portfolio_projects, and the linked seed
profiles' portfolio sections and covers.

Usage (repo root):
  bun run supabase/generators/export_linked_profiles.ts > /tmp/linked.json
  python3 supabase/generators/import_profiles.py <FIRESTORE-FULL-DUMP.md> /tmp/linked.json <out.sql>

Every value is written in the shape the app already reads: taxonomy slugs in roles / instruments /
genres / languages, "<role slug>:<label>" in specialisations, onboarding availability values,
link maps keyed by platform, and portfolio_items kinds from src/data/portfolio.ts.
"""
from __future__ import annotations

import json
import re
import sys
import uuid

DUMP, LINKED, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
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
# Firebase labels (keys) -> taxonomy slugs (values). A combined label maps to its first name's slug
# (taxonomy_renames.py, owner 15 Sep 2026).
INSTRUMENT = {"Acoustic Guitar": "acoustic_guitar", "Electric Guitar": "electric_guitar",
              "Bass Guitar": "bass_guitar", "Keyboard / Synthesizer": "keyboard",
              "Piano": "piano", "Drums / Percussion": "drums", "Tabla": "tabla",
              "Sitar": "sitar", "Flute (Bansuri)": "flute_bansuri", "Harmonium": "harmonium",
              "Dholak": "dholak", "Violin": "violin", "Saxophone": "saxophone", "Trumpet": "trumpet",
              "Sarod": "sarod", "Shehnai": "shehnai", "Mridangam": "mridangam", "Santoor": "santoor",
              "Veena": "veena", "Tanpura": "tanpura", "Cello": "cello"}
GENRE = {"Bollywood / Filmi": "bollywood", "Indie Pop": "indie_pop",
         "Hindustani Classical": "hindustani_classical", "Carnatic Classical": "carnatic_classical",
         "Punjabi Folk / Bhangra": "bhangra", "Rajasthani Folk": "rajasthani_folk",
         "Sufi Devotional": "sufi_devotional", "Ghazal": "ghazal", "Qawwali": "qawwali",
         "Rock / Metal": "rock", "Hip Hop / Trap": "hiphop", "Lofi / Chill Beats": "lofi",
         "EDM / Synthwave": "edm", "Acoustic / Unplugged": "acoustic",
         "R&B / Soul": "rnb", "Jazz / Blues": "jazz", "Reggae / Dub": "reggae"}
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
    profile_rows.append({
        "id": pid, "username": name, "display_name": display, "headline": u.get("tagline"),
        "bio": u["bio"], "city": city, "state": state, "country": "India", "roles": roles,
        "instruments": mapped(u.get("instruments"), INSTRUMENT, "instrument", fid, problems),
        "genres": mapped(u.get("genres"), GENRE, "genre", fid, problems),
        "languages": mapped(u.get("languages"), LANGUAGE, "language", fid, problems),
        "specialisations": specs, "avatar_url": u["avatarUrl"],
        "availability": AVAILABILITY.get(u.get("sessionAvailability")), "visibility": "public",
        "links": links, "created_at": u["createdAt"],
    })
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
portfolio_dicts = [dict(zip(PORTFOLIO_FIELDS, r)) for r in portfolio_rows]

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
-- octave.sound.labs profile is unchanged. Email, GSTIN and phone are not imported.
--
-- Values are written in the shapes the app reads: taxonomy slugs; "<role slug>:<label>"
-- specialisations; availability Shows / Touring (other Firebase statuses have no equivalent, so null);
-- business and venue users get their business type as the first role.
--
-- Not imported here (no column or table yet): hourly rate, budget tier, persona and trust badges,
-- verified / available flags, gender, business address / hours / team / service offerings / rosters /
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
