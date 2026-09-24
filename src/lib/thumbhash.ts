// Turns an image's ThumbHash (from src/data/image-placeholders.generated.ts,
// produced by scripts/generate-image-placeholders.py) into a tiny blurred
// PNG data URL to show while the real picture is still downloading.
//
// Decoder ported from Evan Wallace's `thumbhash` package
// (https://github.com/evanw/thumbhash, MIT) — vendored instead of added as a
// dependency since only these two functions are needed. It's pure math with
// no DOM access, so it renders identically on the server and the client.
import { IMAGE_PLACEHOLDERS } from "@/data/image-placeholders.generated";

function thumbHashToRGBA(hash: Uint8Array) {
  const { PI, min, max, cos, round } = Math;
  const at = (i: number) => hash[i] ?? 0;

  // Read the constants
  const header24 = at(0) | (at(1) << 8) | (at(2) << 16);
  const header16 = at(3) | (at(4) << 8);
  const lDc = (header24 & 63) / 63;
  const pDc = ((header24 >> 6) & 63) / 31.5 - 1;
  const qDc = ((header24 >> 12) & 63) / 31.5 - 1;
  const lScale = ((header24 >> 18) & 31) / 31;
  const hasAlpha = header24 >> 23 !== 0;
  const pScale = ((header16 >> 3) & 63) / 63;
  const qScale = ((header16 >> 9) & 63) / 63;
  const isLandscape = header16 >> 15 !== 0;
  const lx = max(3, isLandscape ? (hasAlpha ? 5 : 7) : header16 & 7);
  const ly = max(3, isLandscape ? header16 & 7 : hasAlpha ? 5 : 7);
  const aDc = hasAlpha ? (at(5) & 15) / 15 : 1;
  const aScale = (at(5) >> 4) / 15;

  // Read the varying factors (boost saturation by 1.25x to compensate for quantization)
  const acStart = hasAlpha ? 6 : 5;
  let acIndex = 0;
  const decodeChannel = (nx: number, ny: number, scale: number) => {
    const ac: number[] = [];
    for (let cy = 0; cy < ny; cy++)
      for (let cx = cy ? 0 : 1; cx * ny < nx * (ny - cy); cx++, acIndex++)
        ac.push((((at(acStart + (acIndex >> 1)) >> ((acIndex & 1) << 2)) & 15) / 7.5 - 1) * scale);
    return ac;
  };
  const lAc = decodeChannel(lx, ly, lScale);
  const pAc = decodeChannel(3, 3, pScale * 1.25);
  const qAc = decodeChannel(3, 3, qScale * 1.25);
  const aAc = hasAlpha ? decodeChannel(5, 5, aScale) : [];

  // Decode using the DCT into RGB
  const ratio = thumbHashToApproximateAspectRatio(hash);
  const w = round(ratio > 1 ? 32 : 32 * ratio);
  const h = round(ratio > 1 ? 32 / ratio : 32);
  const rgba = new Uint8Array(w * h * 4);
  const fx: number[] = [];
  const fy: number[] = [];
  for (let y = 0, i = 0; y < h; y++) {
    for (let x = 0; x < w; x++, i += 4) {
      let l = lDc;
      let p = pDc;
      let q = qDc;
      let a = aDc;

      // Precompute the coefficients
      for (let cx = 0, n = max(lx, hasAlpha ? 5 : 3); cx < n; cx++)
        fx[cx] = cos((PI / w) * (x + 0.5) * cx);
      for (let cy = 0, n = max(ly, hasAlpha ? 5 : 3); cy < n; cy++)
        fy[cy] = cos((PI / h) * (y + 0.5) * cy);

      // Decode L
      for (let cy = 0, j = 0; cy < ly; cy++)
        for (let cx = cy ? 0 : 1, fy2 = fy[cy]! * 2; cx * ly < lx * (ly - cy); cx++, j++)
          l += lAc[j]! * fx[cx]! * fy2;

      // Decode P and Q
      for (let cy = 0, j = 0; cy < 3; cy++) {
        for (let cx = cy ? 0 : 1, fy2 = fy[cy]! * 2; cx < 3 - cy; cx++, j++) {
          const f = fx[cx]! * fy2;
          p += pAc[j]! * f;
          q += qAc[j]! * f;
        }
      }

      // Decode A
      if (hasAlpha)
        for (let cy = 0, j = 0; cy < 5; cy++)
          for (let cx = cy ? 0 : 1, fy2 = fy[cy]! * 2; cx < 5 - cy; cx++, j++)
            a += aAc[j]! * fx[cx]! * fy2;

      // Convert to RGB
      const b = l - (2 / 3) * p;
      const r = (3 * l - b + q) / 2;
      const g = r - q;
      rgba[i] = max(0, 255 * min(1, r));
      rgba[i + 1] = max(0, 255 * min(1, g));
      rgba[i + 2] = max(0, 255 * min(1, b));
      rgba[i + 3] = max(0, 255 * min(1, a));
    }
  }
  return { w, h, rgba };
}

function thumbHashToApproximateAspectRatio(hash: Uint8Array) {
  const header = hash[3] ?? 0;
  const hasAlpha = ((hash[2] ?? 0) & 0x80) !== 0;
  const isLandscape = ((hash[4] ?? 0) & 0x80) !== 0;
  const lx = isLandscape ? (hasAlpha ? 5 : 7) : header & 7;
  const ly = isLandscape ? header & 7 : hasAlpha ? 5 : 7;
  return lx / ly;
}

// Minimal uncompressed PNG encoder (the images are only 32px, so size
// doesn't matter).
function rgbaToDataURL(w: number, h: number, rgba: Uint8Array) {
  const row = w * 4 + 1;
  const idat = 6 + h * (5 + row);
  // prettier-ignore
  const bytes = [
    137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, w >> 8, w & 255, 0, 0,
    h >> 8, h & 255, 8, 6, 0, 0, 0, 0, 0, 0, 0, idat >>> 24, (idat >> 16) & 255,
    (idat >> 8) & 255, idat & 255, 73, 68, 65, 84, 120, 1,
  ];
  // prettier-ignore
  const table = [
    0, 498536548, 997073096, 651767980, 1994146192, 1802195444, 1303535960, 1342533948,
    -306674912, -267414716, -690576408, -882789492, -1687895376, -2032938284, -1609899400,
    -1111625188,
  ];
  let a = 1;
  let b = 0;
  for (let y = 0, i = 0, end = row - 1; y < h; y++, end += row - 1) {
    bytes.push(y + 1 < h ? 0 : 1, row & 255, row >> 8, ~row & 255, (row >> 8) ^ 255, 0);
    for (b = (b + a) % 65521; i < end; i++) {
      const u = rgba[i]! & 255;
      bytes.push(u);
      a = (a + u) % 65521;
      b = (b + a) % 65521;
    }
  }
  // prettier-ignore
  bytes.push(
    b >> 8, b & 255, a >> 8, a & 255, 0, 0, 0, 0,
    0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130,
  );
  for (const [start, stop] of [
    [12, 29],
    [37, 41 + idat],
  ] as const) {
    let end = stop;
    let c = ~0;
    for (let i = start; i < end; i++) {
      c ^= bytes[i]!;
      c = (c >>> 4) ^ table[c & 15]!;
      c = (c >>> 4) ^ table[c & 15]!;
    }
    c = ~c;
    bytes[end++] = c >>> 24;
    bytes[end++] = (c >> 16) & 255;
    bytes[end++] = (c >> 8) & 255;
    bytes[end++] = c & 255;
  }
  return "data:image/png;base64," + btoa(String.fromCharCode(...bytes));
}

const decoded = new Map<string, string>();

// Blurred placeholder for an image URL, or undefined if the image hasn't been
// hashed yet (rerun the generator script after adding images).
export function placeholderFor(src: string): string | undefined {
  const cached = decoded.get(src);
  if (cached) return cached;
  const encoded = IMAGE_PLACEHOLDERS[src];
  if (!encoded) return undefined;
  const hash = Uint8Array.from(atob(encoded), (ch) => ch.charCodeAt(0));
  const { w, h, rgba } = thumbHashToRGBA(hash);
  const url = rgbaToDataURL(w, h, rgba);
  decoded.set(src, url);
  return url;
}
