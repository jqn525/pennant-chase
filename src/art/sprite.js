// ── Code-authored pixel sprites ──
// A frame is an array of equal-length strings, one char per pixel. "." is
// transparent; every other char is a key into PAL (palette.js), optionally
// overridden per actor by a swap map ({ c: "#hex", ... }). Frames are
// rasterized once per (frame, swap) and cached as canvases.

import { PAL } from "./palette.js";

// Parse + validate a frame. Pure (no DOM) so it can be unit tested.
export function parseFrame(rows) {
  const h = rows.length;
  const w = rows[0].length;
  rows.forEach((r, i) => {
    if (r.length !== w) throw new Error(`sprite row ${i} is ${r.length} wide, expected ${w}`);
  });
  return { w, h, px: rows.join("") };
}

// Resolve a frame to an array of hex colors (null = transparent). Pure.
export function resolveFrame(frame, swap = {}) {
  const f = frame.px ? frame : parseFrame(frame);
  return Array.from(f.px, (ch) => (ch === "." ? null : swap[ch] || PAL[ch] || null));
}

const cache = new Map();
let ids = 0;
const frameId = new WeakMap();
const idOf = (o) => {
  if (!frameId.has(o)) frameId.set(o, ++ids);
  return frameId.get(o);
};

// Rasterize a frame to a canvas (cached). Browser only.
export function rasterize(frame, swap = {}, swapKey = "") {
  const key = `${idOf(frame)}|${swapKey}`;
  let cv = cache.get(key);
  if (cv) return cv;
  const f = frame.px ? frame : parseFrame(frame);
  cv = document.createElement("canvas");
  cv.width = f.w;
  cv.height = f.h;
  const ctx = cv.getContext("2d");
  const img = ctx.createImageData(f.w, f.h);
  resolveFrame(f, swap).forEach((hex, i) => {
    if (!hex) return;
    const n = parseInt(hex.slice(1), 16);
    img.data[i * 4] = n >> 16;
    img.data[i * 4 + 1] = (n >> 8) & 255;
    img.data[i * 4 + 2] = n & 255;
    img.data[i * 4 + 3] = 255;
  });
  ctx.putImageData(img, 0, 0);
  if (cache.size > 2000) cache.clear();
  cache.set(key, cv);
  return cv;
}

// Mirror a frame horizontally (pure; used to author one side of a pose)
export const flipFrame = (rows) => rows.map((r) => [...r].reverse().join(""));

// Draw a frame with its anchor at bottom-center (feet), optionally mirrored.
export function drawFrame(ctx, frame, swap, swapKey, x, y, flip = false) {
  const cv = rasterize(frame, swap, swapKey);
  const dx = Math.round(x - cv.width / 2);
  const dy = Math.round(y - cv.height);
  if (!flip) { ctx.drawImage(cv, dx, dy); return; }
  ctx.save();
  ctx.translate(dx + cv.width, dy);
  ctx.scale(-1, 1);
  ctx.drawImage(cv, 0, 0);
  ctx.restore();
}

// Pick a frame from an animation {frames, fps, loop} at time ms.
export function frameAt(anim, ms) {
  const n = anim.frames.length;
  const i = Math.floor((ms / 1000) * anim.fps);
  return anim.frames[anim.loop === false ? Math.min(n - 1, Math.max(0, i)) : ((i % n) + n) % n];
}
