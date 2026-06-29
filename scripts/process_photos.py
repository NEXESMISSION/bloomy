"""Découpe les 4 flacons depuis all.png (échelle uniforme) -> public/products/*.png (fond gris #EEE)."""
import os
from collections import deque
import numpy as np
from PIL import Image

DL = r"C:\Users\Med Saief Allah\Downloads"
OUT = r"C:\Users\Med Saief Allah\Desktop\Bloomy\website\public\products"
SCRATCH = r"C:\Users\MEDSAI~1\AppData\Local\Temp\claude\C--Users-Med-Saief-Allah-Desktop-Bloomy-website\ad18162b-8806-4004-94e9-6d4dbc615caa\scratchpad"
PHOTOS = r"C:\Users\Med Saief Allah\Desktop\Bloomy\website\public\photos"
os.makedirs(OUT, exist_ok=True)
os.makedirs(PHOTOS, exist_ok=True)
TARGET = (238, 238, 238)  # gris neutre #EEEEEE (= bg-surface)
# ordre dans all.png, de gauche à droite
SLUGS = ["bleu-de-chanel", "most-wanted", "sauvage", "imagination"]


def normalize_bg(im):
    a = np.array(im).astype(np.int16)
    h, w, _ = a.shape
    corners = np.array([a[2, 2], a[2, w - 3], a[h - 3, 2], a[h - 3, w - 3]]).mean(axis=0)
    dist = np.sqrt(((a - corners) ** 2).sum(axis=2))
    passable = dist < 30
    keep = np.zeros((h, w), bool)
    dq = deque()
    for x in range(w):
        for y in (0, h - 1):
            if passable[y, x] and not keep[y, x]:
                keep[y, x] = True; dq.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if passable[y, x] and not keep[y, x]:
                keep[y, x] = True; dq.append((y, x))
    while dq:
        y, x = dq.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and passable[ny, nx] and not keep[ny, nx]:
                keep[ny, nx] = True; dq.append((ny, nx))
    out = np.array(im).copy()
    out[keep] = TARGET
    return Image.fromarray(out, "RGB")


def crop_bottle(im, px=0.12, pt=0.05, pb=0.06):
    a = np.array(im).astype(float)
    dist = np.sqrt(((a - np.array(TARGET)) ** 2).sum(axis=2))
    ys, xs = np.where(dist > 22)
    if len(xs) == 0:
        return im
    w, h = im.size
    x0 = max(int(xs.min() - px * (xs.max() - xs.min())), 0)
    x1 = min(int(xs.max() + px * (xs.max() - xs.min())), w)
    y0 = max(int(ys.min() - pt * h), 0)
    y1 = min(int(ys.max() + pb * h), h)
    return im.crop((x0, y0, x1, y1))


board = Image.open(os.path.join(DL, "all.png")).convert("RGB")
arr = np.array(board).astype(float)
H, W, _ = arr.shape
dist = np.sqrt(((arr - 238) ** 2).sum(axis=2))
band = dist[250:1400]
onfrac = (band > 45).mean(axis=0)
on = onfrac > 0.18

runs, s = [], None
for x in range(W):
    if on[x] and s is None:
        s = x
    elif not on[x] and s is not None:
        if x - s > 150:
            runs.append((s, x))
        s = None
if s is not None and W - s > 150:
    runs.append((s, W))
runs = sorted(sorted(runs, key=lambda r: r[1] - r[0], reverse=True)[:4])
print("colonnes:", runs)

thumbs = []
for slug, (x0, x1) in zip(SLUGS, runs):
    pad = 50
    crop = board.crop((max(x0 - pad, 0), 0, min(x1 + pad, W), H))
    crop = crop_bottle(normalize_bg(crop))
    th = 1500
    crop = crop.resize((int(crop.width * th / crop.height), th), Image.LANCZOS)
    crop.save(os.path.join(OUT, f"{slug}.png"))
    thumbs.append(crop)
    print(f"{slug}: {crop.size}")

# Hero lineup (les 4 flacons) sur fond beige
lineup = normalize_bg(board)
lw = 1700
lineup = lineup.resize((lw, int(lineup.height * lw / lineup.width)), Image.LANCZOS)
lineup.save(os.path.join(PHOTOS, "lineup.png"))
print("lineup ok", lineup.size)

maxh = max(t.height for t in thumbs)
totw = sum(t.width for t in thumbs) + 30 * (len(thumbs) + 1)
sheet = Image.new("RGB", (totw, maxh + 60), TARGET)
x = 30
for t in thumbs:
    sheet.paste(t, (x, 30 + (maxh - t.height)))
    x += t.width + 30
sheet.save(os.path.join(SCRATCH, "photos.png"))
print("sheet ok")
