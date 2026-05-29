"""Knock out near-white background → transparent alpha for cover figures.
Soft threshold so anti-aliased edges keep partial alpha (no jaggies).
"""
import os
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
FILES = ["p1-thinker.png", "p2-presenter.png", "p3-handoff.png", "p4-puzzle.png", "p5-viewer.png", "p6-system.png"]

# pixels brighter than HI -> fully transparent
# pixels darker  than LO -> fully opaque
# in between -> linear ramp (soft edges)
HI = 248
LO = 218

for name in FILES:
    path = os.path.join(HERE, name)
    img = Image.open(path).convert("RGBA")
    px = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            # use min(r,g,b) so colorful pixels stay fully opaque
            v = min(r, g, b)
            if v >= HI:
                px[x, y] = (r, g, b, 0)
            elif v >= LO:
                # linear ramp
                ratio = (HI - v) / (HI - LO)
                new_a = int(round(a * ratio))
                px[x, y] = (r, g, b, new_a)
            # else: keep original alpha
    out = path  # overwrite in-place
    img.save(out, optimize=True)
    print(f"knocked out: {name}  ({w}x{h})")

print("done")
