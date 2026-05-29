#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Flattens zh-CN.json + en.json into a 4-column CSV:
  key | zh-CN | en | notes

Usage:  python3 i18n/make_csv.py
Output: i18n/translation.csv
"""
import json, csv, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent
zh   = json.loads((ROOT / "zh-CN.json").read_text(encoding="utf-8"))
en   = json.loads((ROOT / "en.json").read_text(encoding="utf-8"))

rows = []  # (key, zh_val, en_val, notes)
HTML_NOTE = "⚠ preserve HTML tags"

def flat(obj, prefix="", zh_obj=None, en_obj=None):
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k.startswith("_"):
                continue
            flat(v, f"{prefix}.{k}" if prefix else k,
                 zh_obj=zh_obj.get(k) if isinstance(zh_obj, dict) else None,
                 en_obj=en_obj.get(k) if isinstance(en_obj, dict) else None)
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            flat(v, f"{prefix}[{i}]",
                 zh_obj=zh_obj[i] if isinstance(zh_obj, list) and i < len(zh_obj) else None,
                 en_obj=en_obj[i] if isinstance(en_obj, list) and i < len(en_obj) else None)
    else:
        z = str(zh_obj) if zh_obj is not None else ""
        e = str(en_obj) if en_obj is not None else ""
        note = HTML_NOTE if any(t in z for t in ["<em>","<b>","<br","<i>"]) else ""
        rows.append((prefix, z, e, note))

flat(zh, zh_obj=zh, en_obj=en)

out = ROOT / "translation.csv"
with out.open("w", newline="", encoding="utf-8-sig") as f:
    w = csv.writer(f)
    w.writerow(["key", "zh-CN (source)", "en (translate this)", "notes"])
    w.writerows(rows)

print(f"[ok] {len(rows)} rows → {out}")
