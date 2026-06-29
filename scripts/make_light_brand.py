"""Logos depuis les nouveaux fichiers (Bloomy élégant noir) + favicon."""
import os
import numpy as np
from PIL import Image, ImageDraw

ROOT = r"C:\Users\Med Saief Allah\Desktop\Bloomy"
WEB = os.path.join(ROOT, "website")
B = os.path.join(WEB, "public", "brand")
APP = os.path.join(WEB, "src", "app")
INK = (23, 23, 27)


def to_ink_alpha(path, ink=INK):
    """Noir-sur-blanc/transparent -> couleur 'ink' sur transparent (AA propre), rogné."""
    src = Image.open(path).convert("RGBA")
    bg = Image.new("RGBA", src.size, (255, 255, 255, 255))
    flat = Image.alpha_composite(bg, src).convert("L")
    alpha = (255 - np.array(flat)).clip(0, 255).astype(np.uint8)
    h, w = alpha.shape
    rgba = np.zeros((h, w, 4), np.uint8)
    rgba[:, :, 0] = ink[0]
    rgba[:, :, 1] = ink[1]
    rgba[:, :, 2] = ink[2]
    rgba[:, :, 3] = alpha
    im = Image.fromarray(rgba, "RGBA")
    ys, xs = np.where(alpha > 12)
    if len(xs):
        im = im.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    return im


# Wordmark (header / footer) — noir élégant sur transparent
wm = to_ink_alpha(os.path.join(ROOT, "logo fukl thin.png"))
wm.save(os.path.join(B, "bloomy-wordmark-dark.png"))
print("wordmark ok", wm.size)

# Monogramme B
bmono = to_ink_alpha(os.path.join(ROOT, "letter logo.png"))
bmono.save(os.path.join(B, "bloomy-b.png"))
print("B ok", bmono.size)

# Favicon : carré ink + B blanc
S = 512
m = Image.new("L", (S, S), 0)
ImageDraw.Draw(m).rounded_rectangle([0, 0, S, S], radius=116, fill=255)
base = Image.new("RGBA", (S, S), (23, 23, 27, 255))
base.putalpha(m)
arr = np.array(bmono)
arr[:, :, 0] = 255
arr[:, :, 1] = 255
arr[:, :, 2] = 255
bwhite = Image.fromarray(arr, "RGBA")
sc = (S * 0.62) / max(bwhite.size)
bwhite = bwhite.resize((int(bwhite.width * sc), int(bwhite.height * sc)), Image.LANCZOS)
base.alpha_composite(bwhite, ((S - bwhite.width) // 2, (S - bwhite.height) // 2))
base.save(os.path.join(APP, "icon.png"))
print("favicon ok")
