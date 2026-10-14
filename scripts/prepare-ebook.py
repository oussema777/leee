"""Prepare private reading pages without changing or publishing the approved PDF.

Requires PyMuPDF and Pillow: python -m pip install pymupdf pillow
Usage: python scripts/prepare-ebook.py SOURCE.pdf private-ebooks/manal
"""
import argparse
import hashlib
import io
import json
from pathlib import Path
import fitz
from PIL import Image

parser = argparse.ArgumentParser()
parser.add_argument("source", type=Path)
parser.add_argument("output", type=Path)
parser.add_argument("--width", type=int, default=1600)
args = parser.parse_args()
source = args.source.resolve()
output = args.output.resolve()
if "public" in output.parts:
    raise SystemExit("Reading pages must never be prepared inside public/.")
output.mkdir(parents=True, exist_ok=True)
pdf = fitz.open(source)
sizes = []
widths = []
for index, page in enumerate(pdf):
    target = output / f"{index + 1:04d}.webp"
    width = args.width
    # Preserve full-page raster originals at native size: upscaling adds bytes, not detail.
    images = page.get_images()
    if not page.get_text().strip() and len(images) == 1:
        original_width, original_height = images[0][2:4]
        if abs(original_width / original_height - page.rect.width / page.rect.height) < 0.02:
            width = min(width, original_width)
    widths.append(width)
    pix = page.get_pixmap(matrix=fitz.Matrix(width / page.rect.width, width / page.rect.width), alpha=False)
    image = Image.open(io.BytesIO(pix.tobytes("png")))
    image.save(target, "WEBP", quality=88, method=4)
    sizes.append(target.stat().st_size)
    if index % 50 == 0:
        print(f"Prepared {index + 1}/{len(pdf)} pages", flush=True)
manifest = {
    "sourceName": source.name,
    "sourceSha256": hashlib.sha256(source.read_bytes()).hexdigest(),
    "sourceBytes": source.stat().st_size,
    "pageCount": len(pdf),
    "width": args.width,
    "nativeWidths": sorted(set(widths)),
    "totalPageBytes": sum(sizes),
    "largestPageBytes": max(sizes),
    "title": pdf.metadata.get("title", ""),
    "pages": [f"{i + 1:04d}.webp" for i in range(len(pdf))],
}
(output / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps({k: v for k, v in manifest.items() if k not in ("pages", "title")}, indent=2), flush=True)
