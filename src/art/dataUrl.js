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
