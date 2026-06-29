"""Prépare logos, textures et photos dans public/ + favicon."""
import os, shutil
import numpy as np
from PIL import Image, ImageDraw

ROOT = r"C:\Users\Med Saief Allah\Desktop\Bloomy"
WEB = os.path.join(ROOT, "website")
PUB = os.path.join(WEB, "public")
for d in ["brand", "textures", "photos"]:
    os.makedirs(os.path.join(PUB, d), exist_ok=True)
os.makedirs(os.path.join(WEB, "src", "app"), exist_ok=True)


def content_clusters(mask, min_gap=60):
    cols = mask.any(axis=0)
    runs, start = [], None
    gap = 0
    for x in range(len(cols)):
        if cols[x]:
            if start is None:
                start = x
            gap = 0
        else:
            if start is not None:
                gap += 1
                if gap > min_gap:
                    runs.append((start, x - gap + 1))
                    start = None
    if start is not None:
        runs.append((start, len(cols)))
    return runs


def crop_alpha(im, box, pad=20):
    x0, x1 = box
    sub = im.crop((max(x0 - pad, 0), 0, min(x1 + pad, im.width), im.height))
    a = np.array(sub)[:, :, 3] > 25
    ys, xs = np.where(a)
    if len(xs):
        sub = sub.crop((max(xs.min() - pad, 0), max(ys.min() - pad, 0),
                        min(xs.max() + pad, sub.width), min(ys.max() + pad, sub.height)))
    return sub


# --- Logos depuis le wordmark blanc transparent ---
logo = Image.open(os.path.join(ROOT, "logo white no bg.png")).convert("RGBA")
mask = np.array(logo)[:, :, 3] > 25
clusters = content_clusters(mask)
clusters = sorted(clusters, key=lambda r: r[1] - r[0], reverse=True)
print("clusters:", clusters)
# le plus large = "Bloomy", le suivant à droite = "B"
wordmark_box = max(clusters, key=lambda r: r[1] - r[0])
right = [c for c in clusters if c[0] > wordmark_box[1]]
b_box = min(right, key=lambda r: r[0]) if right else None

wordmark = crop_alpha(logo, wordmark_box)
wordmark.save(os.path.join(PUB, "brand", "bloomy-wordmark.png"))
print("wordmark", wordmark.size)

if b_box:
    b_icon = crop_alpha(logo, b_box)
    b_icon.save(os.path.join(PUB, "brand", "bloomy-b.png"))
    print("b icon", b_icon.size)

    # favicon carré : fond cobalt + B blanc
    S = 512
    icon = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(icon)
    for y in range(S):
        t = y / S
        r = int(46 + (16 - 46) * t)
        g = int(107 + (42 - 107) * t)
        bb = int(255 + (82 - 255) * t)
        d.line([(0, y), (S, y)], fill=(r, g, bb, 255))
    # coins arrondis
    rad = 96
    m = Image.new("L", (S, S), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, S, S], radius=rad, fill=255)
    icon.putalpha(m)
    bi = b_icon.copy()
    scale = (S * 0.62) / max(bi.size)
    bi = bi.resize((int(bi.width * scale), int(bi.height * scale)), Image.LANCZOS)
    icon.alpha_composite(bi, ((S - bi.width) // 2, (S - bi.height) // 2))
    icon.save(os.path.join(WEB, "src", "app", "icon.png"))
    print("favicon ok")

# --- Textures & photos ---
copies = {
    "tikers desing 2.png": ("textures", "blue-texture.png"),
    "tikers desing 4.png": ("textures", "gold-streaks.png"),
    os.path.join("IMGES", "ChatGPT Image Jun 26, 2026, 12_34_12 AM.png"): ("photos", "display-dark.png"),
    os.path.join("IMGES", "ChatGPT Image Jun 26, 2026, 01_09_41 AM.png"): ("photos", "display-box.png"),
    os.path.join("IMGES", "ChatGPT Image Jun 26, 2026, 12_26_27 AM.png"): ("photos", "brand-board.png"),
    os.path.join("IMGES", "TXETURES", "TEXTURE 3.png"): ("textures", "dark-texture.png"),
}
for srcrel, (sub, name) in copies.items():
    src = os.path.join(ROOT, srcrel)
    if os.path.exists(src):
        shutil.copy(src, os.path.join(PUB, sub, name))
        print("copied", name)
    else:
        print("MISSING", src)

print("done")
