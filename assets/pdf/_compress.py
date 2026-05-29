#!/usr/bin/env python3
"""
Re-render every page of each PDF as a JPEG (quality 78, ~144 DPI) and
re-pack into a fresh PDF.  Goal: keep visual quality identical for on-screen
viewing while shrinking file size 5–10× — critical for online deployment.

Originals are preserved in ./_orig/ (do not delete those manually until
you have visually verified the compressed copies).
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

import fitz  # PyMuPDF


SRC_DIR = Path(__file__).parent / "_orig"
DST_DIR = Path(__file__).parent

DPI = 144            # screen-quality
JPEG_QUALITY = 78    # good visual / size trade-off


def compress(src: Path, dst: Path) -> None:
    print(f"→ {src.name}  ({src.stat().st_size/1e6:5.1f} MB)", end=" ")
    src_doc = fitz.open(src)
    out_doc = fitz.open()
    zoom = DPI / 72.0
    matrix = fitz.Matrix(zoom, zoom)

    for page in src_doc:
        pix = page.get_pixmap(matrix=matrix, alpha=False)
        # Encode as JPEG so we get real compression (PDFs default to lossless).
        jpeg_bytes = pix.tobytes("jpeg", jpg_quality=JPEG_QUALITY)
        # New page that matches the rasterized aspect ratio at 72 dpi units.
        new_page = out_doc.new_page(width=page.rect.width, height=page.rect.height)
        new_page.insert_image(new_page.rect, stream=jpeg_bytes)

    out_doc.save(
        dst,
        garbage=4,        # remove unused objects
        deflate=True,     # compress streams
        clean=True,
    )
    out_doc.close()
    src_doc.close()

    new_size = dst.stat().st_size / 1e6
    old_size = src.stat().st_size / 1e6
    ratio = old_size / new_size if new_size else 0
    print(f"→ {new_size:5.1f} MB  ({ratio:4.1f}× smaller)")


def main() -> int:
    if not SRC_DIR.exists():
        print(f"missing {SRC_DIR}", file=sys.stderr)
        return 1
    files = sorted(SRC_DIR.glob("P*.pdf"))
    if not files:
        print("no PDFs found in _orig/", file=sys.stderr)
        return 1
    total_old = 0.0
    total_new = 0.0
    for src in files:
        dst = DST_DIR / src.name
        compress(src, dst)
        total_old += src.stat().st_size
        total_new += dst.stat().st_size
    print("─" * 48)
    print(
        f"total: {total_old/1e6:.1f} MB → {total_new/1e6:.1f} MB "
        f"({total_old/total_new:.1f}× smaller)"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
