#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Apply translations back into the codebase.

Workflow:
  1. Translator fills in i18n/translation.csv (or directly edits i18n/en.json)
  2. If they edited the CSV, run:    python3 i18n/apply.py --from-csv
     This rebuilds en.json from the CSV.
  3. Then run:                       python3 i18n/apply.py
     This patches script.js dict.en with the matching keys.

Currently this script ONLY patches keys that already exist in script.js dict
(hero.*, about.*, work.*, contact.*, foot.*, etc.). The remaining strings
(career rows, work card titles, case.thinkData) are still hard-coded in HTML
and will require either:
  (a) wiring up data-i18n attributes for each (then this script can patch them),
  (b) rendering them from a runtime fetch of i18n/en.json.

Run from repo root:
  python3 i18n/apply.py            # JSON → script.js
  python3 i18n/apply.py --from-csv # CSV  → en.json
"""
import json, csv, re, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
I18N = ROOT / "i18n"

# ----------------------------------------------------------------------------
# Helpers
# ----------------------------------------------------------------------------
def set_by_dotted_path(obj, key, value):
    """Set a deeply nested value: 'a.b[2].c' → obj['a']['b'][2]['c'] = value."""
    parts = re.findall(r"[^.\[\]]+|\[\d+\]", key)
    cur = obj
    for i, p in enumerate(parts):
        last = (i == len(parts) - 1)
        if p.startswith("[") and p.endswith("]"):
            idx = int(p[1:-1])
            if last:
                while len(cur) <= idx: cur.append("")
                cur[idx] = value
            else:
                while len(cur) <= idx: cur.append({})
                cur = cur[idx]
        else:
            if last:
                cur[p] = value
            else:
                if p not in cur or not isinstance(cur[p], (dict, list)):
                    # next part decides shape
                    nxt = parts[i+1]
                    cur[p] = [] if (nxt.startswith("[") and nxt.endswith("]")) else {}
                cur = cur[p]

# ----------------------------------------------------------------------------
# Mode 1: CSV → en.json
# ----------------------------------------------------------------------------
def csv_to_json():
    en_path = I18N / "en.json"
    csv_path = I18N / "translation.csv"
    en = json.loads(en_path.read_text(encoding="utf-8"))
    with csv_path.open(encoding="utf-8-sig") as f:
        r = csv.reader(f)
        next(r)  # header
        for row in r:
            if not row: continue
            key, _zh, en_val, *_ = row
            if not key: continue
            set_by_dotted_path(en, key, en_val)
    en_path.write_text(
        json.dumps(en, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )
    print(f"[ok] CSV → {en_path}")

# ----------------------------------------------------------------------------
# Mode 2: en.json → script.js dict.en
# ----------------------------------------------------------------------------
# Mapping from script.js dict keys → en.json paths (only keys that map cleanly)
SCRIPT_KEY_MAP = {
    "hero.kicker":          "hero.kicker",
    "hero.title":           "hero.title",
    "hero.sub":             "hero.sub",
    "hero.card.name":       "hero.card.name",
    "hero.card.name.body":  "hero.card.name_body",
    "hero.card.status":     "hero.card.status",
    "hero.card.status.body":"hero.card.status_body",
    "hero.card.based":      "hero.card.based",
    "hero.card.based.body": "hero.card.based_body",
    "about.heading":        "about.heading",
    "about.sub":            "about.sub",
    "about.name":           "about.fact_label.name",
    "about.title":          "about.fact_label.title",
    "about.location":       "about.fact_label.location",
    "about.years":          "about.fact_label.years",
    "about.status2":        "about.fact_label.status",
    "about.contact":        "about.fact_label.contact",
    "about.bio":            "about.bio",
    "beliefs.heading":      "beliefs.heading",
    "career.heading":       "career.heading",
    "focus.heading":        "focus.heading",   # not in en.json yet → falls back to current value
    "work.heading":         "work.heading",
    "work.sub":             "work.sub",
    "work.hint":            "work.hint",
    "contact.heading":      "contact.heading",
    "contact.sub":           "contact.sub",
    "contact.statement":    "contact.statement",
    "foot.quote":           "foot.quote",
}

def get_by_dotted(obj, key):
    parts = key.split(".")
    cur = obj
    for p in parts:
        if cur is None: return None
        cur = cur.get(p) if isinstance(cur, dict) else None
    return cur

def json_to_scriptjs():
    en = json.loads((I18N / "en.json").read_text(encoding="utf-8"))
    sj = ROOT / "script.js"
    src = sj.read_text(encoding="utf-8")

    # Build new en block content
    parts = ["    en: {"]
    for k_js, k_json in SCRIPT_KEY_MAP.items():
        v = get_by_dotted(en, k_json)
        if v is None or v == "":
            print(f"[skip] {k_js} → en.json {k_json} is empty")
            continue
        # JSON-encode the string for safe JS
        v_js = json.dumps(v, ensure_ascii=False)
        parts.append(f'      "{k_js}": {v_js},')
    parts.append("    },")
    new_block = "\n".join(parts)

    # Replace the existing en block in script.js (greedy match between `en: {` and the closing `},` before `};`)
    pattern = re.compile(
        r"    en:\s*\{[\s\S]*?\n    \},",
        re.MULTILINE
    )
    if not pattern.search(src):
        sys.exit("[fatal] could not locate the en: { ... } block in script.js")

    new_src = pattern.sub(new_block, src, count=1)
    sj.write_text(new_src, encoding="utf-8")
    print(f"[ok] patched dict.en in {sj}")

# ----------------------------------------------------------------------------
if __name__ == "__main__":
    if "--from-csv" in sys.argv:
        csv_to_json()
    else:
        json_to_scriptjs()
