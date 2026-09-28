// ── Player portraits: code-drawn pixel busts, stable per player ──
// See art/sprites/portraits.js for how a face is built. URLs are cached.

import { portraitFrames, portraitSwap } from "../art/sprites/portraits.js";
import { spriteUrl } from "../art/dataUrl.js";
import { poseFrame } from "../art/sprites/poses.js";

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

// Trading-card photo: full-body action pose for his position, in club colors
export const poseUrl = (p, team) => {
  const swap = { ...portraitSwap(p), ...(team ? { c: team[0], C: team[1] } : {}) };
  return spriteUrl(`pose:${p.id}|${p.pos}|${p.name}|${swap.c}`, () => poseFrame(p), swap);
};
