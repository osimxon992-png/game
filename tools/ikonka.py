# Ilova ikonkalarini chizadi: python3 tools/ikonka.py
# Natija: assets/icons/*.png (oddiy, maskable, Apple)
import math, os, random
from PIL import Image, ImageDraw, ImageFilter

S = 1024
os.makedirs("assets/icons", exist_ok=True)


def fon():
    img = Image.new("RGB", (S, S), (2, 2, 7))
    px = img.load()
    for y in range(S):
        for x in range(S):
            d = math.hypot(x - S * 0.42, y - S * 0.38) / S
            k = max(0.0, 1 - d * 1.5)
            px[x, y] = (int(4 + 16 * k * k), int(5 + 18 * k * k), int(12 + 34 * k * k))
    d = ImageDraw.Draw(img)
    r = random.Random(4)
    for _ in range(260):
        x, y = r.random() * S, r.random() * S
        b = r.random() ** 3
        c = int(90 + 165 * b)
        s = 1 + b * 3
        d.ellipse([x, y, x + s, y + s], fill=(c, c, min(255, c + 15)))
    # sayyora: kenglik bo'ylab tasmalar, chap-yuqoridan yoritilgan, silliq terminator
    img = img.convert("RGBA")
    px = img.load()
    cx, cy, R = S * 1.0, S * 1.08, S * 0.52
    L = (-0.62, -0.55, 0.56)
    n = math.sqrt(sum(v * v for v in L)); L = tuple(v / n for v in L)
    for y in range(int(cy - R), S):
        for x in range(int(cx - R), S):
            dx, dy = (x - cx) / R, (y - cy) / R
            q = dx * dx + dy * dy
            if q >= 1: continue
            dz = math.sqrt(1 - q)
            yoruq = max(0.0, dx * L[0] + dy * L[1] + dz * L[2])
            yoruq = yoruq ** 0.8 * 1.15 + 0.02
            t = dy + 0.03 * math.sin(dx * 9 + dy * 4)
            b = 0.5 + 0.5 * math.sin(t * 21) * 0.8 + 0.1 * math.sin(t * 57)
            base = (0.42 + 0.4 * b, 0.28 + 0.3 * b, 0.17 + 0.2 * b)
            a = min(1.0, (1 - q) * 40)
            o = px[x, y]
            col = tuple(int(o[i] * (1 - a) + min(255, base[i] * 255 * yoruq) * a) for i in range(3))
            px[x, y] = col + (255,)
    return img


def kema(img, masshtab):
    # yuqoridan ko'rinish: oldinga (yuqoriga) qaragan, orqaga qayrilgan qanotli kema
    c = S / 2
    k = masshtab * S / 1024

    def P(pts):
        return [(c + x * k, c + y * k) for x, y in pts]

    # dvigatel nuri
    nur = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    nd = ImageDraw.Draw(nur)
    for ex, rw in ((-92, 34), (92, 34), (0, 48)):
        nd.polygon(P([(ex - rw, 250), (ex + rw, 250), (ex + 6, 520), (ex - 6, 520)]), fill=(120, 185, 255, 170))
        nd.ellipse([c + (ex - rw) * k, c + 228 * k, c + (ex + rw) * k, c + 272 * k], fill=(230, 245, 255, 255))
    img.alpha_composite(nur.filter(ImageFilter.GaussianBlur(26 * k)))
    img.alpha_composite(nur.filter(ImageFilter.GaussianBlur(6 * k)))

    d = ImageDraw.Draw(img)
    korpus = (196, 202, 210, 255)
    qorongi = (120, 126, 136, 255)
    # qanotlar
    d.polygon(P([(-40, -40), (-330, 170), (-340, 215), (-40, 230)]), fill=qorongi)
    d.polygon(P([(40, -40), (330, 170), (340, 215), (40, 230)]), fill=korpus)
    # gondolalar
    for s in (-1, 1):
        d.rounded_rectangle([c + (s * 92 - 30) * k, c + 30 * k, c + (s * 92 + 30) * k, c + 250 * k], radius=14 * k, fill=(150, 156, 165, 255))
    # fyuzelyaj
    d.polygon(P([(0, -380), (34, -300), (62, -120), (72, 120), (64, 250), (-64, 250), (-72, 120), (-62, -120), (-34, -300)]), fill=korpus)
    d.polygon(P([(0, -380), (-34, -300), (-62, -120), (-72, 120), (-64, 250), (0, 250)]), fill=(176, 182, 191, 255))
    # kabina
    d.ellipse([c - 30 * k, c - 250 * k, c + 30 * k, c - 110 * k], fill=(70, 54, 24, 255))
    d.ellipse([c - 14 * k, c - 236 * k, c + 6 * k, c - 170 * k], fill=(214, 176, 92, 255))
    # to'q sariq chiziq
    d.polygon(P([(-66, 20), (66, 20), (68, 46), (-68, 46)]), fill=(214, 112, 34, 255))
    # navigatsiya chiroqlari
    for (x, col) in ((-335, (255, 60, 50, 255)), (335, (60, 255, 110, 255))):
        g = Image.new("RGBA", (S, S), (0, 0, 0, 0))
        ImageDraw.Draw(g).ellipse([c + (x - 16) * k, c + 176 * k, c + (x + 16) * k, c + 208 * k], fill=col)
        img.alpha_composite(g.filter(ImageFilter.GaussianBlur(10 * k)))
        ImageDraw.Draw(img).ellipse([c + (x - 7) * k, c + 185 * k, c + (x + 7) * k, c + 199 * k], fill=(255, 255, 255, 255))


asos = fon()
oddiy = asos.copy()
kema(oddiy, 1.0)
maskable = asos.copy()
kema(maskable, 0.74)

oddiy.convert("RGB").resize((512, 512), Image.LANCZOS).save("assets/icons/icon-512.png", optimize=True)
oddiy.convert("RGB").resize((192, 192), Image.LANCZOS).save("assets/icons/icon-192.png", optimize=True)
maskable.convert("RGB").resize((512, 512), Image.LANCZOS).save("assets/icons/maskable-512.png", optimize=True)
maskable.convert("RGB").resize((192, 192), Image.LANCZOS).save("assets/icons/maskable-192.png", optimize=True)
maskable.convert("RGB").resize((180, 180), Image.LANCZOS).save("assets/icons/apple-touch-icon.png", optimize=True)
oddiy.convert("RGB").resize((64, 64), Image.LANCZOS).save("assets/icons/favicon-64.png", optimize=True)
print("ikonkalar tayyor")
