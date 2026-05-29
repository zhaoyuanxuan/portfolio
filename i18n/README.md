# i18n bundle — Zhao Yuanxuan Portfolio

This folder is the canonical translation source for the site. It follows the
**i18next / FormatJS-style** convention used by most modern web stacks:
one JSON file per locale, identical structure, simple dotted keys.

## Files

| File | Purpose |
|---|---|
| `zh-CN.json` | **Source-of-truth.** All Chinese strings extracted from `index.html`, `case.html`, `script.js`. Do not delete. |
| `en.json` | English translations. **Empty `""` values = needs translation.** Pre-filled values came from the existing `script.js` dict — feel free to edit. |
| `translation.csv` | Flat translator-friendly view. **The most convenient file to send to a translator** — Excel/Sheets/macOS Numbers can open it directly. |
| `glossary.md` | Proper nouns, brand names and fixed terms. Translators **MUST** keep these consistent. |
| `make_csv.py` | One-shot generator: `python3 i18n/make_csv.py` rebuilds `translation.csv` from the two JSON files. |
| `apply.py` | Once `en.json` is filled in, run `python3 i18n/apply.py` to write the EN strings back into `script.js` and emit a unified i18n loader stub. |

## How to use (translator workflow)

1. **Open `translation.csv`** in Excel / Numbers / Google Sheets.
2. Translate each row in the `en (translate this)` column.
   - Rows with `⚠ preserve HTML tags` in the `notes` column contain `<em>`, `<b>`, `<i>` or `<br>`. Keep these tags 1-for-1 — don't translate or drop them.
   - Don't translate proper nouns listed in `glossary.md` (brand names, project codenames, version numbers).
3. **Save back as CSV (UTF-8)**.
4. Send back to me. I'll convert it back to `en.json` and apply it to the codebase.

## How to use (developer workflow, after translator returns)

```bash
# 1. (optional) regenerate CSV from updated JSON
python3 i18n/make_csv.py

# 2. apply en.json into the live codebase
python3 i18n/apply.py
```

`apply.py` will:
- patch the `dict.en` block in `script.js`
- (later, when we wire it) update `data-i18n` attributes in `index.html` & `case.html`

## Conventions

- **Keys** use dot notation: `section.subsection.key` (e.g. `hero.card.status`).
- **Arrays** are used for repeated items (tags, bullet lists, axis bodies).
- **HTML tags** (`<em>`, `<b>`, `<i>`, `<br>`) inside string values are intentional — they style the rendered output.
- **No interpolation tokens** (`{{var}}`) appear in this dataset.

## Coverage

| Source | What's in here |
|---|---|
| `script.js` `dict` | hero.*, about.*, beliefs.heading, career.heading, focus.heading, work.*, contact.*, foot.quote |
| `index.html` body | about.bio, about.tags, career.rows.*, beliefs.items, work.p1..p6 |
| `case.html` JS data | case.subtitle.*, case.thinkData.1..6 (kicker/title/caption/divider/center + 4 axes × {name,sub,title,body[],tags[],leaves[]}) |
| `case.html` static | case.engine_pdf_fallback, case.p1_talent.*, case.p2_engine.* |

Total: **477 translatable rows.**

---

*Last updated: 2026-05-29*
