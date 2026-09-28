// ── Sprite rows -> cached PNG data URLs, for use in plain <img> tags ──
// Browser only (needs a canvas). Callers pass a stable key per look.

import { parseFrame, rasterize } from "./sprite.js";

const urls = new Map();

export function spriteUrl(key, rowsFn, swap) {
  let u = urls.get(key);
  if (u) return u;
  const frame = parseFrame(rowsFn());
  u = rasterize(frame, swap, key).toDataURL("image/png");
  if (urls.size > 1500) urls.clear();
  urls.set(key, u);
  return u;
}

// Full-color pixel arrays ({ w, h, px: ["#rrggbb" | null] }) -> cached PNG data URL
export function pixelsUrl(key, build) {
  let u = urls.get(key);
  if (u) return u;
  const { w, h, px } = build();
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext("2d");
  const img = ctx.createImageData(w, h);
  px.forEach((hex, i) => {
    if (!hex) return;
    const n = parseInt(hex.slice(1), 16);
    img.data[i * 4] = n >> 16;
    img.data[i * 4 + 1] = (n >> 8) & 255;
    img.data[i * 4 + 2] = n & 255;
    img.data[i * 4 + 3] = 255;
  });
  ctx.putImageData(img, 0, 0);
  u = cv.toDataURL("image/png");
  if (urls.size > 1500) urls.clear();
  urls.set(key, u);
  return u;
}
