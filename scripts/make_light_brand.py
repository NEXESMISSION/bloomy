"""Logo sombre (pour thème clair) + favicon propre. Source: logo white no bg.png"""
import os
from PIL import Image, ImageDraw, ImageFilter

ROOT = r"C:\Users\Med Saief Allah\Desktop\Bloomy"
WEB = os.path.join(ROOT, "website")
B = os.path.join(WEB, "public", "brand")
APP = os.path.join(WEB, "src", "app")

# Wordmark sombre, plus épais (recolore le logo blanc d'origine en quasi-noir)
wm = Image.open(os.path.join(B, "bloomy-wordmark.png")).convert("RGBA")
alpha = wm.split()[3]
# épaissit légèrement le trait pour qu'il ne paraisse pas trop fin
alpha = alpha.filter(ImageFilter.MaxFilter(7))
dark = Image.new("RGBA", wm.size, (18, 18, 22, 0))
dark.putalpha(alpha)
dark.save(os.path.join(B, "bloomy-wordmark-dark.png"))
print("wordmark sombre (épaissi) ok")

# Favicon : carré arrondi quasi-noir + B blanc
S = 512
m = Image.new("L", (S, S), 0)
ImageDraw.Draw(m).rounded_rectangle([0, 0, S, S], radius=116, fill=255)
base = Image.new("RGBA", (S, S), (22, 22, 28, 255))
base.putalpha(m)
b = Image.open(os.path.join(B, "bloomy-b.png")).convert("RGBA")
sc = (S * 0.58) / max(b.size)
b = b.resize((int(b.width * sc), int(b.height * sc)), Image.LANCZOS)
base.alpha_composite(b, ((S - b.width) // 2, (S - b.height) // 2))
base.save(os.path.join(APP, "icon.png"))
print("favicon ok")
