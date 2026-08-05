#!/usr/bin/env python3
"""Generate one unique, product-relevant catalogue image per seeded product.

The web-sourced bottle artwork used in every generated image is stored in
public/images/products/_source. Final assets are deterministic, so running the
script again produces the same file for the same product.
"""

from __future__ import annotations

import hashlib
import json
import math
import random
import re
import textwrap
import argparse
from multiprocessing import Pool
from pathlib import Path

import cairosvg
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
DATA_FILE = ROOT / "prisma" / "products_seed_data.json"
OUTPUT_DIR = ROOT / "public" / "images" / "products"
SOURCE_DIR = OUTPUT_DIR / "_source"
SOURCE_SVG = SOURCE_DIR / "chemistry-bottle.svg"
LOGO_FILE = ROOT / "public" / "images" / "logo" / "logo-mark.png"

WIDTH, HEIGHT = 720, 540
FONT_REGULAR = "/usr/share/fonts/opentype/inter/Inter-Regular.otf"
FONT_SEMIBOLD = "/usr/share/fonts/opentype/inter/Inter-SemiBold.otf"
FONT_BOLD = "/usr/share/fonts/opentype/inter/Inter-Bold.otf"

PALETTES = {
    "Acids": ((171, 45, 69), (255, 241, 244), (253, 221, 228)),
    "Solvents": ((32, 111, 165), (238, 248, 255), (214, 237, 252)),
    "Organic Chemicals": ((10, 124, 115), (237, 252, 249), (207, 244, 238)),
    "Inorganic Chemicals": ((79, 70, 229), (244, 243, 255), (225, 222, 255)),
    "Food Chemicals": ((196, 120, 23), (255, 249, 235), (250, 234, 194)),
    "Pharmaceutical Chemicals": ((118, 56, 156), (250, 244, 255), (236, 219, 248)),
    "Laboratory Chemicals": ((25, 91, 132), (241, 249, 253), (212, 235, 246)),
    "Water Treatment Chemicals": ((18, 126, 155), (238, 252, 255), (204, 239, 246)),
}


def title_case(value: str) -> str:
    value = re.sub(r"\s+", " ", value.strip())
    if value.upper() == value:
        small_acronyms = {"AR", "LR", "HPLC", "ACS", "USP", "BP", "IP", "EP", "GC", "UV"}
        words = []
        for raw in value.lower().split(" "):
            token = raw.upper() if raw.upper() in small_acronyms else raw[:1].upper() + raw[1:]
            words.append(token)
        value = " ".join(words)
    return value.replace("Hplc", "HPLC").replace("Lr", "LR").replace("Ar", "AR")


def fit_font(text: str, max_width: int, max_lines: int = 3, start: int = 34, minimum: int = 20):
    for size in range(start, minimum - 1, -1):
        font = ImageFont.truetype(FONT_BOLD, size)
        avg = max(8, int(size * 0.58))
        lines = textwrap.wrap(text, width=max(12, max_width // avg), break_long_words=False)
        if len(lines) <= max_lines:
            return font, lines
    font = ImageFont.truetype(FONT_BOLD, minimum)
    lines = textwrap.wrap(text, width=max(12, max_width // max(8, int(minimum * 0.58))), break_long_words=False)
    if len(lines) > max_lines:
        lines = lines[:max_lines]
        lines[-1] = lines[-1].rstrip(" .") + "…"
    return font, lines


def gradient_background(top: tuple[int, int, int], bottom: tuple[int, int, int]) -> Image.Image:
    strip = Image.new("RGB", (1, HEIGHT), top)
    pixels = strip.load()
    for y in range(HEIGHT):
        t = y / max(1, HEIGHT - 1)
        pixels[0, y] = tuple(round(top[i] * (1 - t) + bottom[i] * t) for i in range(3))
    return strip.resize((WIDTH, HEIGHT))


def render_source_icon() -> Image.Image:
    png_bytes = cairosvg.svg2png(url=str(SOURCE_SVG), output_width=360, output_height=324)
    from io import BytesIO

    icon = Image.open(BytesIO(png_bytes)).convert("RGBA")
    # Make the SVG's white canvas transparent while retaining its bottle shape.
    rgb = icon.convert("RGB")
    white = Image.new("RGB", icon.size, "white")
    difference = ImageChops.difference(rgb, white).convert("L")
    alpha = difference.point(lambda p: min(190, p * 3))
    icon.putalpha(alpha)
    return icon


def tint_icon(icon: Image.Image, color: tuple[int, int, int]) -> Image.Image:
    alpha = icon.getchannel("A")
    tinted = Image.new("RGBA", icon.size, color + (0,))
    tinted.putalpha(alpha)
    return tinted


def draw_molecule_pattern(draw: ImageDraw.ImageDraw, rng: random.Random, accent: tuple[int, int, int]):
    nodes = []
    for _ in range(13):
        x = rng.randint(390, 690)
        y = rng.randint(32, 335)
        r = rng.randint(5, 10)
        nodes.append((x, y, r))
    for i, (x1, y1, _) in enumerate(nodes):
        distances = sorted(
            ((math.hypot(x1 - x2, y1 - y2), j) for j, (x2, y2, _) in enumerate(nodes) if j != i),
            key=lambda item: item[0],
        )[:2]
        for distance, j in distances:
            if distance < 125 and j > i:
                x2, y2, _ = nodes[j]
                draw.line((x1, y1, x2, y2), fill=accent + (55,), width=2)
    for x, y, r in nodes:
        draw.ellipse((x - r, y - r, x + r, y + r), fill=accent + (75,), outline=accent + (115,), width=1)


def draw_product_image(product: dict, source_icon: Image.Image, logo: Image.Image | None) -> Image.Image:
    sku = product["sku"]
    name = title_case(product["name"])
    category = product.get("category") or "Laboratory Chemicals"
    cas = product.get("cas")
    cas = cas if cas and cas != "---" else "Not specified"
    accent, top, bottom = PALETTES.get(category, PALETTES["Laboratory Chemicals"])
    seed = int(hashlib.sha256(f"{sku}|{name}|{cas}".encode()).hexdigest()[:16], 16)
    rng = random.Random(seed)

    base = gradient_background(top, bottom).convert("RGBA")
    layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer, "RGBA")

    # Distinctive molecule graph per SKU.
    draw_molecule_pattern(draw, rng, accent)

    # Product visual panel.
    panel = (385, 58, 684, 355)
    draw.rounded_rectangle(panel, radius=34, fill=(255, 255, 255, 206), outline=accent + (32,), width=2)
    draw.ellipse((430, 85, 642, 297), fill=accent + (18,))

    icon = tint_icon(source_icon, accent)
    angle = rng.choice([-5, -3, 0, 3, 5])
    icon = icon.rotate(angle, expand=True, resample=Image.Resampling.BICUBIC)
    icon.thumbnail((240, 220), Image.Resampling.LANCZOS)
    layer.alpha_composite(icon, (530 - icon.width // 2, 183 - icon.height // 2))

    # Bottle label makes otherwise similar grades visually and semantically unique.
    label_x, label_y, label_w, label_h = 463, 205, 145, 76
    draw.rounded_rectangle((label_x, label_y, label_x + label_w, label_y + label_h), radius=8, fill=(255, 255, 255, 235), outline=accent + (90,), width=2)
    sku_font = ImageFont.truetype(FONT_BOLD, 17)
    tiny_font = ImageFont.truetype(FONT_SEMIBOLD, 11)
    draw.text((label_x + 10, label_y + 10), sku, font=sku_font, fill=(16, 38, 66, 255))
    draw.text((label_x + 10, label_y + 37), category.upper()[:22], font=tiny_font, fill=accent + (255,))
    draw.text((label_x + 10, label_y + 55), f"CAS {cas}"[:24], font=ImageFont.truetype(FONT_REGULAR, 9), fill=(75, 94, 116, 255))

    # Left content.
    pill_font = ImageFont.truetype(FONT_SEMIBOLD, 13)
    pill_text = category.upper()
    pill_box = draw.textbbox((0, 0), pill_text, font=pill_font)
    pill_w = pill_box[2] - pill_box[0] + 28
    draw.rounded_rectangle((42, 44, 42 + pill_w, 76), radius=16, fill=accent + (24,), outline=accent + (70,), width=1)
    draw.text((56, 52), pill_text, font=pill_font, fill=accent + (255,))

    font, lines = fit_font(name, 315, max_lines=4, start=35, minimum=21)
    y = 108
    for line in lines:
        draw.text((42, y), line, font=font, fill=(12, 35, 61, 255))
        y += int(font.size * 1.12)

    draw.rounded_rectangle((42, 328, 346, 386), radius=14, fill=(255, 255, 255, 180), outline=(18, 56, 86, 20), width=1)
    meta_font = ImageFont.truetype(FONT_SEMIBOLD, 13)
    meta_value = ImageFont.truetype(FONT_REGULAR, 14)
    draw.text((58, 341), "SKU", font=meta_font, fill=(87, 104, 121, 255))
    draw.text((113, 340), sku, font=meta_value, fill=(17, 44, 71, 255))
    draw.text((58, 363), "CAS", font=meta_font, fill=(87, 104, 121, 255))
    draw.text((113, 362), cas, font=meta_value, fill=(17, 44, 71, 255))

    # Footer branding.
    draw.rounded_rectangle((0, 418, WIDTH, HEIGHT), radius=0, fill=(7, 35, 65, 246))
    draw.text((42, 450), "AARNAV SCIENTIFIC", font=ImageFont.truetype(FONT_BOLD, 20), fill=(255, 255, 255, 255))
    draw.text((42, 480), "QUANTA CHEM  •  QUALITY LABORATORY REAGENTS", font=ImageFont.truetype(FONT_SEMIBOLD, 11), fill=(182, 224, 235, 255))
    draw.rounded_rectangle((500, 453, 674, 492), radius=20, fill=accent + (255,))
    draw.text((524, 464), "PRODUCT CATALOGUE", font=ImageFont.truetype(FONT_BOLD, 11), fill=(255, 255, 255, 255))

    if logo is not None:
        logo_copy = logo.copy()
        logo_copy.thumbnail((56, 42), Image.Resampling.LANCZOS)
        # Preserve transparent logo and add it to the footer.
        layer.alpha_composite(logo_copy, (616, 428))

    base.alpha_composite(layer)
    return base.convert("RGB")


_WORKER_ICON = None
_WORKER_LOGO = None


def _init_worker(icon_path: str, logo_path: str) -> None:
    global _WORKER_ICON, _WORKER_LOGO
    _WORKER_ICON = Image.open(icon_path).convert("RGBA")
    _WORKER_LOGO = Image.open(logo_path).convert("RGBA") if Path(logo_path).exists() else None


def _generate_one(args: tuple[dict, bool]) -> tuple[str, bool]:
    product, force = args
    output = OUTPUT_DIR / f"{product['sku'].lower()}.webp"
    if output.exists() and not force:
        return product["sku"], False
    image = draw_product_image(product, _WORKER_ICON, _WORKER_LOGO)
    image.save(output, "WEBP", quality=79, method=2)
    return product["sku"], True


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--force", action="store_true", help="Regenerate images that already exist")
    parser.add_argument("--workers", type=int, default=8)
    args = parser.parse_args()

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    products = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    icon_cache = SOURCE_DIR / "chemistry-bottle-source.png"
    if not icon_cache.exists():
        render_source_icon().save(icon_cache, "PNG")

    completed = 0
    generated = 0
    with Pool(
        processes=max(1, args.workers),
        initializer=_init_worker,
        initargs=(str(icon_cache), str(LOGO_FILE)),
    ) as pool:
        for _, was_generated in pool.imap_unordered(_generate_one, ((p, args.force) for p in products), chunksize=16):
            completed += 1
            generated += int(was_generated)
            if completed % 250 == 0 or completed == len(products):
                print(f"Processed {completed}/{len(products)}; generated {generated}", flush=True)

    print(f"Done: {generated} new product images in {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
