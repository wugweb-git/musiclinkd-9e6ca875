"""Single names for taxonomy options: no "/" in any option label (owner, 15 Sep 2026).

The owner chose to rename the ids to match. Imported by the generators, so a regenerated migration
already uses the new slugs, and by taxonomy_single_names.py, which moves a live database across.
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


def renamed(category: str, slug: str) -> str:
    return RENAMES.get(category, {}).get(slug, slug)


def fixed_text(table: str, column: str, value):
    return TEXT.get(table, {}).get(column, {}).get(value, value)


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
