#!/usr/bin/env python3
# Generates a ThumbHash (https://evanw.github.io/thumbhash/) for every
# picture under public/ so a quiz image that's slow to arrive (bad network,
# cache miss) shows a soft blurred preview of itself instead of an empty
# card. Each hash is ~25 bytes, stored base64 in the manifest at
# src/data/image-placeholders.generated.ts, which the app imports and
# decodes on the client (src/lib/thumbhash.ts).
#
# Usage (needs Pillow):
#   python3 scripts/generate-image-placeholders.py
#
# Rerun it after adding or replacing any image — it always rewrites the
# whole manifest (hashing ~100 images takes a few seconds).
#
# The encoder is a line-for-line port of rgbaToThumbHash from Evan Wallace's
# `thumbhash` package (MIT). Math.round is emulated with floor(x + 0.5) so
# the output matches the JS encoder byte for byte.

import base64
import math
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PUBLIC_DIR = ROOT / "public"
MANIFEST_PATH = ROOT / "src" / "data" / "image-placeholders.generated.ts"
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def js_round(x):
    return math.floor(x + 0.5)


def rgba_to_thumbhash(w, h, rgba):
    if w > 100 or h > 100:
        raise ValueError(f"{w}x{h} doesn't fit in 100x100")
    n = w * h

    # Determine the average color
    avg_r = avg_g = avg_b = avg_a = 0.0
    for i in range(n):
        j = i * 4
        alpha = rgba[j + 3] / 255
        avg_r += alpha / 255 * rgba[j]
        avg_g += alpha / 255 * rgba[j + 1]
        avg_b += alpha / 255 * rgba[j + 2]
        avg_a += alpha
    if avg_a:
        avg_r /= avg_a
        avg_g /= avg_a
        avg_b /= avg_a

    has_alpha = avg_a < n
    l_limit = 5 if has_alpha else 7  # Use fewer luminance bits if there's alpha
    lx = max(1, js_round(l_limit * w / max(w, h)))
    ly = max(1, js_round(l_limit * h / max(w, h)))
    l, p, q, a = [], [], [], []

    # Convert the image from RGBA to LPQA (composite atop the average color)
    for i in range(n):
        j = i * 4
        alpha = rgba[j + 3] / 255
        r = avg_r * (1 - alpha) + alpha / 255 * rgba[j]
        g = avg_g * (1 - alpha) + alpha / 255 * rgba[j + 1]
        b = avg_b * (1 - alpha) + alpha / 255 * rgba[j + 2]
        l.append((r + g + b) / 3)
        p.append((r + g) / 2 - b)
        q.append(r - g)
        a.append(alpha)

    # Encode using the DCT into DC (constant) and normalized AC (varying) terms
    def encode_channel(channel, nx, ny):
        dc, ac, scale = 0.0, [], 0.0
        for cy in range(ny):
            cx = 0
            while cx * ny < nx * (ny - cy):
                fx = [math.cos(math.pi / w * cx * (x + 0.5)) for x in range(w)]
                f = 0.0
                for y in range(h):
                    fy = math.cos(math.pi / h * cy * (y + 0.5))
                    row = y * w
                    for x in range(w):
                        f += channel[x + row] * fx[x] * fy
                f /= n
                if cx or cy:
                    ac.append(f)
                    scale = max(scale, abs(f))
                else:
                    dc = f
                cx += 1
        if scale:
            ac = [0.5 + 0.5 / scale * f for f in ac]
        return dc, ac, scale

    l_dc, l_ac, l_scale = encode_channel(l, max(3, lx), max(3, ly))
    p_dc, p_ac, p_scale = encode_channel(p, 3, 3)
    q_dc, q_ac, q_scale = encode_channel(q, 3, 3)
    if has_alpha:
        a_dc, a_ac, a_scale = encode_channel(a, 5, 5)

    # Write the constants
    is_landscape = w > h
    header24 = (
        js_round(63 * l_dc)
        | (js_round(31.5 + 31.5 * p_dc) << 6)
        | (js_round(31.5 + 31.5 * q_dc) << 12)
        | (js_round(31 * l_scale) << 18)
        | (int(has_alpha) << 23)
    )
    header16 = (
        (ly if is_landscape else lx)
        | (js_round(63 * p_scale) << 3)
        | (js_round(63 * q_scale) << 9)
        | (int(is_landscape) << 15)
    )
    hash_bytes = [header24 & 255, (header24 >> 8) & 255, header24 >> 16, header16 & 255, header16 >> 8]
    ac_start = 6 if has_alpha else 5
    if has_alpha:
        hash_bytes.append(js_round(15 * a_dc) | (js_round(15 * a_scale) << 4))

    # Write the varying factors
    channels = [l_ac, p_ac, q_ac, a_ac] if has_alpha else [l_ac, p_ac, q_ac]
    ac_index = 0
    for ac in channels:
        for f in ac:
            k = ac_start + (ac_index >> 1)
            while len(hash_bytes) <= k:
                hash_bytes.append(0)
            hash_bytes[k] |= js_round(15 * f) << ((ac_index & 1) << 2)
            ac_index += 1
    return bytes(hash_bytes)


def hash_image(path):
    with Image.open(path) as img:
        img = img.convert("RGBA")
        img.thumbnail((100, 100), Image.Resampling.LANCZOS)
        return rgba_to_thumbhash(img.width, img.height, img.tobytes())


def main():
    images = sorted(
        p
        for p in PUBLIC_DIR.rglob("*")
        if p.is_file() and p.suffix.lower() in IMAGE_EXTENSIONS and "images" in p.relative_to(PUBLIC_DIR).parts[:-1]
    )
    entries = []
    for path in images:
        url = "/" + path.relative_to(PUBLIC_DIR).as_posix()
        encoded = base64.b64encode(hash_image(path)).decode("ascii")
        entries.append((url, encoded))
        print(f"hashed {url}")

    body = "\n".join(f'  "{url}": "{encoded}",' for url, encoded in entries)
    MANIFEST_PATH.write_text(
        "// AUTO-GENERATED by scripts/generate-image-placeholders.py — do not edit by hand.\n"
        "// Maps an image's public URL to its base64 ThumbHash, decoded into a blurred\n"
        "// placeholder while the real image loads (see src/lib/thumbhash.ts).\n"
        "export const IMAGE_PLACEHOLDERS: Record<string, string> = {\n"
        f"{body}\n"
        "};\n",
        encoding="utf-8",
        newline="\n",
    )
    print(f"wrote  {MANIFEST_PATH.relative_to(ROOT).as_posix()} ({len(entries)} images)")


if __name__ == "__main__":
    main()
