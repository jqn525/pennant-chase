// ── Player portraits: code-drawn pixel busts, stable per player ──
// See art/sprites/portraits.js for how a face is built. URLs are cached.

import { portraitFrames, portraitSwap } from "../art/sprites/portraits.js";
import { spriteUrl } from "../art/dataUrl.js";

const framesCache = new Map();
const framesOf = (p) => {
  const key = `${p.id}|${p.pos}|${p.role}|${p.name}`;
  if (!framesCache.has(key)) {
    if (framesCache.size > 600) framesCache.clear();
    framesCache.set(key, portraitFrames(p));
  }
  return framesCache.get(key);
};

// frame: "base" | "blink" | "breathe"
export const portraitUrl = (p, frame = "base") =>
  spriteUrl(`portrait:${p.id}|${p.pos}|${p.role}|${p.name}|${frame}`, () => framesOf(p)[frame], portraitSwap(p));
