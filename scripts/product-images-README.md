# Product catalogue images

This folder contains one locally stored WebP image for every seeded product.
Each image is uniquely generated from the product SKU, name, category and CAS
number, so different grades or pack variants never share the same final asset.

## Regenerate

```bash
python3 -m pip install -r scripts/requirements-product-images.txt
npm run generate:product-images
```

Use `python3 scripts/generate-product-images.py --force` to overwrite existing
assets.

## Attach to an existing database

```bash
npm run sync:product-images
```

The sync preserves manually uploaded product images and only replaces images
whose URL begins with `/images/products/`.

## Web artwork sources

The generated catalogue artwork incorporates and adapts these web-sourced,
openly licensed laboratory bottle graphics:

- `chemistry-bottle.svg` — “Full bottle chemistry grey.svg” by Sebastian
  Wallroth, Wikimedia Commons, CC0 1.0.
- `reagent-bottle.svg` — “Reagent bottle.svg” by Kayau, Wikimedia Commons,
  released into the public domain.

The original source files are retained in `_source/` for provenance.
