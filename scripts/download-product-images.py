#!/usr/bin/env python3
"""Download relevant product images from PubChem and store them locally.

The catalogue contains multiple rows for the same chemical because each pack size
has its own SKU. This script first consolidates those rows into one product, then
retrieves a 2D molecular-structure image from PubChem by CAS number or product
name. The structure is placed in a clean catalogue frame without duplicating the
full product-card text.

PubChem PUG REST documentation:
https://pubchem.ncbi.nlm.nih.gov/docs/pug-rest
"""

from __future__ import annotations

import argparse
import hashlib
import io
import json
import re
import time
from pathlib import Path
from typing import Any
from urllib.parse import quote

import requests
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
DATA_FILE = ROOT / "prisma" / "products_seed_data.json"
OUTPUT_DIR = ROOT / "public" / "images" / "products"
MANIFEST_FILE = OUTPUT_DIR / "manifest.json"

WIDTH = 800
HEIGHT = 600

CATEGORY_COLORS = {
    "Acids": ((166, 40, 67), (255, 246, 248)),
    "Solvents": ((30, 105, 165), (244, 250, 255)),
    "Organic Chemicals": ((7, 124, 111), (242, 253, 250)),
    "Inorganic Chemicals": ((79, 70, 229), (247, 246, 255)),
    "Food Chemicals": ((184, 112, 17), (255, 251, 239)),
    "Pharmaceutical Chemicals": ((126, 53, 153), (252, 247, 255)),
    "Laboratory Chemicals": ((25, 91, 132), (245, 251, 254)),
    "Water Treatment Chemicals": ((14, 116, 144), (242, 252, 255)),
}

GRADE_TOKENS = [
    "HPLC",
    "GC",
    "ACS",
    "AR",
    "LR",
    "USP",
    "BP",
    "IP",
    "EP",
    "PURIFIED",
    "FOR SYNTHESIS",
    "BIOCHEMISTRY",
    "MOLECULAR BIOLOGY",
]


def normalize_name(value: str) -> str:
    value = value.upper().replace("–", "-").replace("—", "-")
    value = re.sub(r"[^A-Z0-9]+", " ", value)
    return " ".join(value.split())


def normalize_cas(value: str | None) -> str:
    value = (value or "").strip()
    return "" if value in {"", "---", "NA"} else value


def sku_number(sku: str) -> int:
    match = re.search(r"(\d+)", sku)
    return int(match.group(1)) if match else 10**12


def consolidate_products(products: list[dict[str, Any]]) -> list[dict[str, Any]]:
    groups: dict[tuple[str, str, str], list[dict[str, Any]]] = {}
    for product in products:
        key = (
            normalize_name(product["name"]),
            normalize_cas(product.get("cas")),
            product.get("category") or "",
        )
        groups.setdefault(key, []).append(product)

    consolidated: list[dict[str, Any]] = []
    for group in groups.values():
        group.sort(key=lambda item: (sku_number(item["sku"]), item["sku"]))
        canonical = dict(group[0])
        canonical["source_skus"] = [item["sku"] for item in group]
        canonical["pack_sizes"] = list(
            dict.fromkeys(
                size
                for item in group
                for size in item.get("pack_sizes", [])
                if size
            )
        )
        consolidated.append(canonical)

    consolidated.sort(key=lambda item: (sku_number(item["sku"]), item["sku"]))
    return consolidated


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        Path("C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf"),
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
        Path("/usr/share/fonts/opentype/inter/Inter-Bold.otf" if bold else "/usr/share/fonts/opentype/inter/Inter-Regular.otf"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size)
    return ImageFont.load_default()


def product_grade(name: str) -> str:
    upper = name.upper()
    found = [token for token in GRADE_TOKENS if re.search(rf"\b{re.escape(token)}\b", upper)]
    return " · ".join(found[:2]) or "LABORATORY REAGENT"


def search_names(product: dict[str, Any]) -> list[str]:
    names = [product["name"]]
    cleaned = product["name"]
    for token in GRADE_TOKENS:
        cleaned = re.sub(rf"\b{re.escape(token)}\b", " ", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\([^)]*(?:SYNTHESIS|GRADE|REAGENT|AR|LR|HPLC)[^)]*\)", " ", cleaned, flags=re.IGNORECASE)
    cleaned = " ".join(cleaned.replace("/", " ").split())
    if normalize_name(cleaned) != normalize_name(product["name"]):
        names.append(cleaned)
    return list(dict.fromkeys(name for name in names if name.strip()))


def pubchem_identifiers(product: dict[str, Any]) -> list[str]:
    identifiers: list[str] = []
    cas = normalize_cas(product.get("cas"))
    if re.fullmatch(r"\d{2,7}-\d{2}-\d", cas):
        identifiers.append(cas)
    identifiers.extend(search_names(product))
    return list(dict.fromkeys(identifiers))


def download_pubchem_structure(
    session: requests.Session,
    product: dict[str, Any],
    timeout: int,
    delay: float,
) -> tuple[Image.Image | None, str | None]:
    for identifier in pubchem_identifiers(product):
        encoded = quote(identifier, safe="")
        url = (
            "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/"
            f"{encoded}/PNG?record_type=2d&image_size=500x500"
        )

        for attempt in range(3):
            try:
                response = session.get(url, timeout=timeout)
            except requests.RequestException:
                response = None

            if response is not None and response.status_code == 200 and response.content.startswith(b"\x89PNG"):
                try:
                    image = Image.open(io.BytesIO(response.content)).convert("RGBA")
                    time.sleep(delay)
                    return image, url
                except OSError:
                    pass

            if response is not None and response.status_code in {404, 400}:
                break

            time.sleep(1.2 * (attempt + 1))

        time.sleep(delay)

    return None, None


def gradient(size: tuple[int, int], top: tuple[int, int, int], bottom: tuple[int, int, int]) -> Image.Image:
    width, height = size
    image = Image.new("RGB", size, top)
    pixels = image.load()
    for y in range(height):
        ratio = y / max(1, height - 1)
        row = tuple(round(top[index] * (1 - ratio) + bottom[index] * ratio) for index in range(3))
        for x in range(width):
            pixels[x, y] = row
    return image


def draw_fallback_structure(draw: ImageDraw.ImageDraw, seed: int, accent: tuple[int, int, int]) -> None:
    # Deterministic molecule-like fallback used only when PubChem has no match.
    points: list[tuple[int, int]] = []
    value = seed
    for index in range(10):
        value = (1103515245 * value + 12345) & 0x7FFFFFFF
        x = 210 + value % 380
        value = (1103515245 * value + 12345) & 0x7FFFFFFF
        y = 150 + value % 240
        points.append((x, y))
    for index, (x, y) in enumerate(points):
        nearest = sorted(
            ((x - x2) ** 2 + (y - y2) ** 2, j)
            for j, (x2, y2) in enumerate(points)
            if j != index
        )[:2]
        for _, j in nearest:
            if j > index:
                draw.line((x, y, *points[j]), fill=accent + (120,), width=4)
    for x, y in points:
        draw.ellipse((x - 10, y - 10, x + 10, y + 10), fill="white", outline=accent, width=4)


def compose_image(product: dict[str, Any], structure: Image.Image | None, source_url: str | None) -> Image.Image:
    accent, pale = CATEGORY_COLORS.get(
        product.get("category") or "",
        CATEGORY_COLORS["Laboratory Chemicals"],
    )
    seed = int(hashlib.sha256(f"{product['sku']}|{product['name']}".encode()).hexdigest()[:12], 16)
    tint = tuple(max(0, min(255, channel + ((seed >> (index * 4)) & 15) - 7)) for index, channel in enumerate(pale))
    canvas = gradient((WIDTH, HEIGHT), (255, 255, 255), tint).convert("RGBA")
    draw = ImageDraw.Draw(canvas, "RGBA")

    draw.rounded_rectangle((38, 34, 762, 566), radius=34, fill=(255, 255, 255, 240), outline=accent + (42,), width=2)
    draw.rounded_rectangle((62, 58, 738, 470), radius=26, fill=pale + (190,), outline=accent + (22,), width=1)

    if structure is not None:
        structure = structure.convert("RGBA")
        structure.thumbnail((590, 355), Image.Resampling.LANCZOS)
        x = (WIDTH - structure.width) // 2
        y = 88 + (355 - structure.height) // 2
        canvas.alpha_composite(structure, (x, y))
    else:
        draw_fallback_structure(draw, seed, accent)

    category = (product.get("category") or "Laboratory Chemicals").upper()
    category_font = font(16, True)
    grade_font = font(17, True)
    meta_font = font(15, False)
    small_font = font(12, False)

    category_box = draw.textbbox((0, 0), category, font=category_font)
    category_width = min(310, category_box[2] - category_box[0] + 32)
    draw.rounded_rectangle((70, 72, 70 + category_width, 108), radius=18, fill=accent + (28,), outline=accent + (64,), width=1)
    draw.text((86, 80), category[:30], font=category_font, fill=accent + (255,))

    grade = product_grade(product["name"])
    draw.rounded_rectangle((70, 492, 355, 536), radius=18, fill=accent + (255,))
    draw.text((88, 503), grade[:28], font=grade_font, fill="white")

    cas = normalize_cas(product.get("cas")) or "CAS not specified"
    pack_text = " · ".join(product.get("pack_sizes", [])[:4])
    draw.text((382, 494), f"CAS {cas}", font=meta_font, fill=(25, 50, 76, 255))
    if pack_text:
        draw.text((382, 518), f"Packs: {pack_text}", font=small_font, fill=(76, 95, 116, 255))

    source_label = "PUBCHEM 2D STRUCTURE" if source_url else "CATALOGUE FALLBACK"
    draw.text((604, 548), source_label, font=font(10, False), fill=(112, 128, 145, 210))

    return canvas.convert("RGB")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--force", action="store_true", help="Replace existing product images")
    parser.add_argument("--offline", action="store_true", help="Create fallbacks without web requests")
    parser.add_argument("--limit", type=int, default=0, help="Process only the first N unique products")
    parser.add_argument("--timeout", type=int, default=30)
    parser.add_argument("--delay", type=float, default=0.25, help="Pause between PubChem requests")
    args = parser.parse_args()

    raw_products = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    products = consolidate_products(raw_products)
    if args.limit > 0:
        products = products[: args.limit]

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    session = requests.Session()
    session.headers.update(
        {
            "User-Agent": "AarnavScientificCatalogue/1.0 (product image sync)",
            "Accept": "image/png",
        }
    )

    manifest: dict[str, Any] = {}
    matched = 0
    fallback = 0

    for index, product in enumerate(products, start=1):
        destination = OUTPUT_DIR / f"{product['sku'].lower()}.webp"
        if destination.exists() and not args.force:
            continue

        structure = None
        source_url = None
        if not args.offline:
            structure, source_url = download_pubchem_structure(
                session,
                product,
                timeout=args.timeout,
                delay=args.delay,
            )

        image = compose_image(product, structure, source_url)
        image.save(destination, "WEBP", quality=88, method=6)

        if source_url:
            matched += 1
        else:
            fallback += 1

        manifest[product["sku"]] = {
            "file": f"/images/products/{product['sku'].lower()}.webp",
            "source": source_url,
            "match": "pubchem" if source_url else "fallback",
            "sourceSkus": product["source_skus"],
            "packSizes": product["pack_sizes"],
        }

        if index % 25 == 0 or index == len(products):
            print(
                f"Processed {index}/{len(products)} unique products | "
                f"PubChem: {matched} | fallback: {fallback}",
                flush=True,
            )

    MANIFEST_FILE.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"Finished. Images saved to {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
