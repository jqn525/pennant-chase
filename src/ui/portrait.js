// ── Player portraits: code-drawn pixel busts, stable per player ──
// See art/sprites/portraits.js for how a face is built. URLs are cached.

import { portraitFrames, portraitSwap } from "../art/sprites/portraits.js";
import { spriteUrl, pixelsUrl } from "../art/dataUrl.js";
import { cardPhoto } from "../art/card/photo.js";

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

// Trading-card photo: a posed portrait for his position, in club colors.
// opts: { team, word, initials, logoInk, style: "photo" | "vintage", backdrop }
export const cardPhotoUrl = (p, opts = {}) =>
  pixelsUrl(`card:${p.id}|${p.pos}|${p.name}|${opts.team}|${opts.word}|${opts.initials}|${opts.style}|${opts.backdrop}`, () => cardPhoto(p, opts));
