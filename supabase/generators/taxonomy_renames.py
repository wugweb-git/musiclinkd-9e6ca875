"""Single names for taxonomy options: no "/" in any option label (owner, 15 Sep 2026).

The owner chose to rename the ids to match. Imported by the generators, so a regenerated migration
already uses the new slugs, and by taxonomy_single_names.py, which moves a live database across.

Also the one table of free-text rules (no "/" in data text, same day): the import generators apply
clean_text / clean_row, and text_single_names.py applies the same rules to a live database.
"""

# category -> old slug -> new slug. Every stored reference to an old slug moves to the new one.
RENAMES = {
    "genres": {
        "bollywood_filmi": "bollywood",
        "bhajan_kirtan": "bhajan",
        "punjabi_folk_bhangra": "bhangra",
        "garba_dandiya": "garba",
        "hiphop_trap": "hiphop",
        "rock_metal": "rock",
        "edm_synthwave": "edm",
        "lofi_chill": "lofi",
        "acoustic_unplugged": "acoustic",
        "rnb_soul": "rnb",
        "jazz_blues": "jazz",
        "reggae_dub": "reggae",
    },
    "instruments": {
        "keyboard_synthesizer": "keyboard",
        "drums_percussion": "drums",
        "drum_machine_sampler": "drum_machine",
    },
    "person_types": {
        "wind_player": "flautist",
    },
    "verification_id_type": {
        "company_pan_gstin": "company_pan",
    },
}

# The second half of a combined option becomes an option of its own, placed right after its parent
# (new slug) and given the parent's rules. Stored references stay on the parent.
# (category, slug, label, parent slug)
ADDED = [
    ("genres", "trap", "Trap", "hiphop"),
    ("genres", "metal", "Metal", "rock"),
    ("genres", "blues", "Blues", "jazz"),
    ("instruments", "sampler", "Sampler", "drum_machine"),
    ("verification_id_type", "company_gstin", "GSTIN", "company_pan"),
]

# person_type_instruments rows removed (person type, instrument): flute only under Flautist.
REMOVED_INSTRUMENT_MAPPINGS = [("sitarist", "flute_bansuri")]

# Labels for options whose seed label (admin/scripts/seed/data/taxonomy-seed.ts) still has a "/".
# taxonomy_persona_bucket.py holds its own labels.
SEED_LABELS = {
    ("verification_id_type", "company_pan"): "Company PAN",
}

# Imported free text that carried a "/": table -> column -> old text -> new text.
TEXT = {
    "opportunities": {
        "role_required": {
            "Singer / Vocalist": "Singer",
            "Sitarist / Flutist, Mix Engineer, Male Lead Vocals": "Sitarist, Flautist, Mix Engineer, Male Lead Vocals",
        },
    },
    "marketplace_listings": {
        "title": {
            "Exclusive Trap / Lofi Beat Instrumental License": "Exclusive Trap Lofi Beat Instrumental License",
        },
    },
}


# ---- Free text: no "/" in data text (owner, 15 Sep 2026: "keep the relevant one") -----------------
# An old combined option label anywhere inside any text becomes the option's single label. Applied
# by the import generators and, on a live database, by 20260915140000_text_single_names.sql
# (text_single_names.py) to every text, text[] and jsonb column.
OLD_LABELS = {
    "Singer / Vocalist": "Singer",
    "Rapper / MC": "Rapper",
    "Keyboardist / Pianist": "Keyboardist",
    "Drummer / Percussionist": "Drummer",
    "Sitarist / Flutist": "Sitarist",
    "Violinist / String Player": "Violinist",
    "Flautist / Wind Player": "Flautist",
    "Bollywood / Filmi": "Bollywood",
    "Bhajan / Kirtan": "Bhajan",
    "Punjabi Folk / Bhangra": "Bhangra",
    "Garba / Dandiya": "Garba",
    "Hip Hop / Trap": "Hip Hop",
    "Rock / Metal": "Rock",
    "EDM / Synthwave": "EDM",
    "Lofi / Chill Beats": "Lofi",
    "Acoustic / Unplugged": "Acoustic",
    "R&B / Soul": "R&B",
    "Jazz / Blues": "Jazz",
    "Reggae / Dub": "Reggae",
    "Keyboard / Synthesizer": "Keyboard",
    "Drums / Percussion": "Drums",
    "DJ Controller / Turntables": "DJ Controller",
    "Drum Machine / Sampler": "Drum Machine",
    "Company PAN / GSTIN": "Company PAN",
}

# Other "/" phrases in imported and live text, replaced inside the named column only:
# (table, column) -> [(old, new)]. "metadata.group" is the group key inside a jsonb column.
# vedanshu.beats' city is Mumbai (checked 15 Sep 2026), so "Mumbai/Chandigarh" keeps Mumbai.
PHRASES = {
    ("feed_posts", "body"): [("lo-fi/chill producers", "lo-fi producers")],
    ("portfolio_items", "description"): [("Funk / soul", "Funk"), ("Hip-hop / advertising", "Hip-hop"),
                                         ("Pop / indie", "Pop")],
    ("studio_equipment", "name"): [("Neumann U87/U47/Telefunken ELAM 251", "Neumann U87"),
                                   ("Pearl Masters / Ampeg / Marshall Backline", "Pearl Masters Backline")],
    ("profile_business", "equipment_list"): [("Neumann U87/U47/Telefunken ELAM 251", "Neumann U87")],
    ("profiles", "bio"): [("Live/rehearsal room", "Live room"), ("synthwave/cyberpop leaning", "synthwave leaning"),
                          ("a flutist/sitarist for", "a flautist for"),
                          ("Based out of Mumbai/Chandigarh", "Based out of Mumbai")],
    ("taxonomy_options", "metadata.group"): [("Studio / Space", "Studio")],
}

# Text columns with a "/" the owner keeps: taxonomy_categories.description holds internal developer
# notes (one names a file path). The import generators do not rewrite it.
KEEP = {("taxonomy_categories", "description")}


def renamed(category: str, slug: str) -> str:
    return RENAMES.get(category, {}).get(slug, slug)


def fixed_text(table: str, column: str, value):
    return TEXT.get(table, {}).get(column, {}).get(value, value)


def single_names(value: str) -> str:
    """Every old combined option label inside value replaced by its single label (longest first)."""
    for old in sorted(OLD_LABELS, key=len, reverse=True):
        value = value.replace(old, OLD_LABELS[old])
    return value


def clean_text(table: str, column: str, value):
    """Imported text as it is stored: whole-value fixes, then single labels, then the column's phrases.
    Lists and dicts are cleaned element by element; a dict key extends the column ("metadata.group")."""
    if (table, column) in KEEP or value is None or isinstance(value, (bool, int, float)):
        return value
    if isinstance(value, list):
        return [clean_text(table, column, v) for v in value]
    if isinstance(value, dict):
        return {k: clean_text(table, f"{column}.{k}", v) for k, v in value.items()}
    value = single_names(fixed_text(table, column, value))
    for old, new in PHRASES.get((table, column), []):
        value = value.replace(old, new)
    return value


def clean_row(table: str, row: dict) -> dict:
    return {c: clean_text(table, c, v) for c, v in row.items()}


def with_added(category: str, options: list[dict]) -> list[dict]:
    """Seed options of one category, renamed, relabelled, split and renumbered 1..n."""
    out = []
    for o in options:
        slug = renamed(category, o["slug"])
        out.append({**o, "slug": slug, "label": SEED_LABELS.get((category, slug), o["label"])})
        for cat, new, label, parent in ADDED:
            if cat == category and parent == slug:
                out.append({**o, "slug": new, "label": label})
    for i, o in enumerate(out, 1):
        o["sort_order"] = i
    return out


_olds = {(c, s) for c, m in RENAMES.items() for s in m}
_news = [(c, s) for c, m in RENAMES.items() for s in m.values()] + [(c, s) for c, s, _, _ in ADDED]
assert len(_news) == len(set(_news)), "a new slug is used twice"
assert not _olds & set(_news), "a new slug reuses an old one"
assert all((c, p) in _news for c, _, _, p in ADDED), "an added option's parent is not a renamed slug"
assert all("/" not in label for _, _, label, _ in ADDED) and all("/" not in v for v in SEED_LABELS.values())
assert all("/" in o and "/" not in n and n in o for o, n in OLD_LABELS.items()), "an old label rule is not a shortening"
assert all("/" in o and "/" not in n for rules in PHRASES.values() for o, n in rules), "a phrase rule keeps a /"
assert all(not any(label in o for label in OLD_LABELS) for rules in PHRASES.values() for o, _ in rules)
assert all("/" not in n for cols in TEXT.values() for m in cols.values() for n in m.values())
